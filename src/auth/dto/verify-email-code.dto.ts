import { IsString, Matches } from "class-validator";

export class VerifyEmailCodeDto {

  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'Code must be exactly 4 digits',
  })
  readonly code!: string;
  
}