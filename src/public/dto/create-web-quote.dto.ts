import { IsUUID } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';

export class CreateWebQuoteDto extends CreateContactDto {
  @IsUUID('4')
  readonly packageId!: string;

  @IsUUID('4')
  readonly packagePriceId!: string;
}
