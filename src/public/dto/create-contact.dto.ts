import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  readonly name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  readonly lastname?: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(120)
  readonly email!: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{5}(-\d{4})?$/, {
    message: 'zipcode must be a valid ZIP code, example: 12345 or 12345-6789',
  })
  readonly zipcode?: string;

  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'phone must be a valid phone number',
  })
  readonly phone!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  readonly comments!: string;
}
