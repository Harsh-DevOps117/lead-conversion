import {
  ConflictException,
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

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  ping(): {
    sucess: boolean;
    message: string;
    data: Date;
    servicecName: string;
  } {
    return {
      sucess: true,
      message: 'pong',
      data: new Date(),
      servicecName: 'call',
    };
  }

  async signUp(dto: TenantRegistrationDto) {
    if (!this.PEPPER) {
      this.logger.error('CRITICAL: PEPPER environment variable is missing.');
      throw new InternalServerErrorException('Server configuration error.');
    }

    const userExist = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }],
      },
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
      throw new ConflictException(
        'A company with this name already exists. Please choose another.',
      );
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
            create: {
              name: dto.company.name,
            },
          },
        },
        include: {
          company: true,
        },
      });

      const payload = {
        sub: newTenantUser.id,
        email: newTenantUser.email,
        role: newTenantUser.role,
        companyId: newTenantUser.companyID,
      };

      const token = await this.jwtService.signAsync(payload);
      const { passwordHash: _, ...safeUser } = newTenantUser;

      return {
        success: true,
        data: {
          user: safeUser,
          token,
        },
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
    if (!this.PEPPER) {
      this.logger.error('CRITICAL: PEPPER environment variable is missing.');
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyID,
    };

    const token = await this.jwtService.signAsync(payload);
    const { passwordHash: _, ...safeUser } = user;

    return {
      success: true,
      data: {
        user: safeUser,
        token,
      },
      message: 'Login successful',
    };
  }
}
