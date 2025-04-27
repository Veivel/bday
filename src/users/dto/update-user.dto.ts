import { IsOptional, IsString, IsEmail, IsDateString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  /** the timezone identifier (e.g. "Europe/Paris") */
  @IsOptional()
  @IsString()
  timezone?: string;

  /** birth date in YYYY-MM-DD format */
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
