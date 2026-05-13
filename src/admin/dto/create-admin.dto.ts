import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  MOD = 'MOD',
  USER = 'USER',
}

export class CreateAdminDto {
  @IsString()
  readonly name!: string;

  @IsString()
  readonly lastname!: string;

  @IsEmail()
  readonly email!: string;

  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    {
      message:
        'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  readonly password!: string;

  @IsEnum(UserRole, {
    message: 'Role must be one of the following values: ADMIN, MOD, USER',
  })
  readonly roles!: UserRole;
}
