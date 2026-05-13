import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class LoginUserDto {
  
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  readonly email!: string;

  @IsString()
  @MinLength(8)
  readonly password!: string;

  @IsUUID('4')
  readonly deviceId!: string;

  @IsString()
  @MinLength(3)
  readonly deviceInfo!: string;
}
