import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { LoginDto, TenantRegistrationDto } from '../../libs/dto/authDTO';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('auth/signup')
  async registerTenant(@Body() signUpDto: TenantRegistrationDto) {
    return await this.gatewayService.registerTenant(signUpDto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.gatewayService.login(loginDto);
  }

  @Get('health')
  async healthCheck() {
    return await this.gatewayService.getHealthStatus();
  }
}
