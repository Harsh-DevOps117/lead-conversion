import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  getHello(): string {
    return this.paymentService.getHello();
  }

  @MessagePattern('create_payment_order')
  async createPaymentOrder(@Payload() payload: { amount: number; currency: string; receipt?: string }) {
    try {
      return await this.paymentService.createOrder(payload);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
