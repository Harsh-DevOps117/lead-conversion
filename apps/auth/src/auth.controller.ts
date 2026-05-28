import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, TenantRegistrationDto } from '../../libs/dto/authDTO';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('service.ping')
  ping() {
    return this.authService.ping();
  }

  @MessagePattern('auth.signup')
  async registerTenant(@Payload() signUpDto: TenantRegistrationDto) {
    return await this.authService.signUp(signUpDto);
  }

  @MessagePattern('auth.login')
  async login(@Payload() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
