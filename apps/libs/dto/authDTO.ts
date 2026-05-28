import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class CompanyRegistrationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters' })
  name!: string;
}

export class TenantRegistrationDto {
  @ValidateNested()
  @Type(() => CompanyRegistrationDto)
  @IsNotEmpty()
  company!: CompanyRegistrationDto;

  @IsString()
  @MinLength(2, { message: 'Full name is required' })
  name!: string;

  @IsEmail({}, { message: 'Valid email is required' })
  email!: string;

  @IsPhoneNumber()
  phone!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export class LoginDto {
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Valid email is required if phone is not provided' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password is required' })
  password!: string;
}
