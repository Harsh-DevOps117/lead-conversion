import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, TenantRegistrationDto } from '../../libs/dto/authDTO';
import { PrismaService } from '../prisma.service';
import { Role } from './types/typesADMIN';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly PEPPER = process.env.PEPPER;
  private readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  ping() {
    return {
      success: true,
      message: 'pong',
      data: new Date(),
      serviceName: 'auth',
    };
  }

  private async generateTokens(
    userId: number,
    email: string,
    role: string,
    companyId: number,
  ) {
    const payload = { sub: userId.toString(), email, role, companyId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async signUp(dto: TenantRegistrationDto) {
    if (!this.PEPPER || !this.REFRESH_SECRET) {
      this.logger.error('CRITICAL: Environment variables missing.');
      throw new InternalServerErrorException('Server configuration error.');
    }

    const userExist = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }] },
      select: { id: true },
    });

    if (userExist) {
      throw new ConflictException(
        'A user with this email or phone already exists.',
      );
    }

    const companyExist = await this.prisma.company.findUnique({
      where: { name: dto.company.name },
      select: { id: true },
    });

    if (companyExist) {
      throw new ConflictException('A company with this name already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password + this.PEPPER, 10);

    try {
      const newTenantUser = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          passwordHash,
          role: Role.ADMIN,
          company: {
            create: { name: dto.company.name },
          },
        },
      });

      const tokens = await this.generateTokens(
        newTenantUser.id,
        newTenantUser.email,
        newTenantUser.role,
        newTenantUser.companyID,
      );

      await this.updateRefreshToken(newTenantUser.id, tokens.refreshToken);

      const { passwordHash: _, refreshToken: __, ...safeUser } = newTenantUser;

      return {
        success: true,
        data: { user: safeUser, ...tokens },
        message: 'Tenant registered successfully',
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to register tenant: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create account. Please try again.',
      );
    }
  }

  async login(dto: LoginDto) {
    if (!this.PEPPER || !this.REFRESH_SECRET) {
      throw new InternalServerErrorException('Server configuration error.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password + this.PEPPER,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.companyID,
    );

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
      },
    });

    const { passwordHash: _, refreshToken: __, ...safeUser } = user;

    return {
      success: true,
      data: { user: safeUser, ...tokens },
      message: 'Login successful',
    };
  }

  async refreshTokens(userId: number, incomingRefreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      incomingRefreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.companyID,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      data: tokens,
      message: 'Tokens refreshed successfully',
    };
  }

  async logout(userId: number) {
    await this.prisma.user.updateMany({
      where: { id: userId, refreshToken: { not: null } },
      data: { refreshToken: null, lastLogoutAt: new Date() },
    });

    return { success: true, message: 'Logged out successfully' };
  }
}
