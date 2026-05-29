import { Injectable, Logger } from '@nestjs/common';
import * as Razorpay from 'razorpay';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private razorpay: any;

  constructor() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (key_id && key_secret) {
      this.razorpay = new Razorpay({
        key_id,
        key_secret,
      });
      this.logger.log('Razorpay client initialized');
    } else {
      this.logger.warn('Razorpay credentials not found in environment variables');
    }
  }

  getHello(): string {
    return 'Payment Service is running!';
  }

  async createOrder(payload: { amount: number; currency: string; receipt?: string }) {
    if (!this.razorpay) {
      throw new Error('Razorpay client not initialized');
    }

    try {
      const options = {
        amount: payload.amount * 100, // amount in the smallest currency unit
        currency: payload.currency || 'INR',
        receipt: payload.receipt || `receipt_${Date.now()}`,
      };
      const order = await this.razorpay.orders.create(options);
      return { success: true, order };
    } catch (error) {
      this.logger.error(`Error creating Razorpay order: ${error.message}`);
      throw error;
    }
  }
}
