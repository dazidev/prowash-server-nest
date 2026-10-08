export enum QuotePushType {
  APPOINTMENT_ASSIGNED = 'QUOTE_APPOINTMENT_ASSIGNED',
  FINAL_PRICE_ASSIGNED = 'QUOTE_FINAL_PRICE_ASSIGNED',
}

export interface QuotePushMessage {
  eventId: string;
  userId: string;
  quoteId: string;
  type: QuotePushType;
}

export interface QuotePushResult {
  acceptedDeviceIds: string[];
  retryDeviceIds: string[];
  invalidDeviceIds: string[];
  skippedDeviceIds: string[];
  hasPermanentFailure: boolean;
}
