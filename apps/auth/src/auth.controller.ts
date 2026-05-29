import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, TenantRegistrationDto } from '../../libs/dto/authDTO';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.signup')
  registerTenant(@Payload() dto: TenantRegistrationDto) {
    return this.authService.signUp(dto);
  }

  @MessagePattern('auth.login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern('auth.refresh')
  refreshTokens(@Payload() data: { userId: number; refreshToken: string }) {
    return this.authService.refreshTokens(data.userId, data.refreshToken);
  }

  @MessagePattern('auth.logout')
  logout(@Payload() data: { userId: number }) {
    return this.authService.logout(data.userId);
  }

  @MessagePattern('service.ping')
  ping() {
    return { success: true, service: 'auth', timestamp: new Date() };
  }
}
