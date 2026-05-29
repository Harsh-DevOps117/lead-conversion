import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';

import { CallGateway } from '../call.gateway';
import { CallService } from '../call.service';

/**
 * Low Latency Node Queue Configuration
 * -------------------------------------------------------------
 * Why Queue-Based?
 * 1. Concurrency Management: Prevents overloading the WebSocket nodes when dispatching thousands of dial actions.
 * 2. High Availability: If a user's phone temporarily disconnects, the job resides safely in Redis until the node is restored.
 * 3. Split-Worker Architecture: Heavy AI processing (STT, LLM, TTS) is offloaded to background processor workers, keeping the main WebSocket gateway responsive.
 */

@Injectable()
export class CallQueueProducer {
  private readonly logger = new Logger(CallQueueProducer.name);
  private dialQueue: Queue;

  constructor() {
    // Connects to your production Redis instance
    this.dialQueue = new Queue('OutboundDialQueue', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    });
  }

  /**
   * Enqueue a Lead calling campaign task
   */
  async addCallToQueue(companyId: string, leadId: string, campaignId: string) {
    this.logger.log(
      `Queueing dial task for lead ${leadId} • Campaign ${campaignId}`,
    );

    await this.dialQueue.add(
      'dispatchDialCommand',
      { companyId, leadId, campaignId },
      {
        jobId: `call_${leadId}_${Date.now()}`, // Prevent duplicate dials concurrently
      },
    );
  }
}

@Injectable()
export class CallQueueWorker {
  private readonly logger = new Logger(CallQueueWorker.name);
  private worker: Worker;

  constructor(
    private readonly callGateway: CallGateway,
    private readonly callService: CallService,
  ) {
    // Multi-threaded Sandbox background job processors
    this.worker = new Worker(
      'OutboundDialQueue',
      async (job: Job) => {
        const { companyId, leadId, campaignId } = job.data;
        this.logger.log(`Worker picked up dial task: Job ID ${job.id}`);

        try {
          // Trigger the direct outbound call command via Socket Gateway to Android Phone
          await this.callGateway.triggerOutboundCall(
            companyId,
            leadId,
            campaignId,
          );
          this.logger.log(
            `Successfully completed worker call trigger for Lead ID: ${leadId}`,
          );
        } catch (error) {
          this.logger.error(
            `Worker failed to execute dial action: ${error.message}`,
          );
          throw error; // Let BullMQ retry engine handle this based on dynamic exponential backup
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
        concurrency: 5, // Runs 5 concurrent dial dispatches on this backend thread block
      },
    );

    // Active life-cycle hook listeners
    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed successfully!`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed with error: ${err.message}`);
    });
  }
}
