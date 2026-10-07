import { IsEnum, IsInt, Min } from 'class-validator';

export enum UserQuoteResponseAction {
  ACCEPT_APPOINTMENT = 'ACCEPT_APPOINTMENT',
  REQUEST_RESCHEDULE = 'REQUEST_RESCHEDULE',
  CANCEL_QUOTE = 'CANCEL_QUOTE',
}

export class RespondUserQuoteDto {
  @IsEnum(UserQuoteResponseAction)
  readonly action!: UserQuoteResponseAction;

  @IsInt()
  @Min(0)
  readonly expectedAppointmentVersion!: number;
}
