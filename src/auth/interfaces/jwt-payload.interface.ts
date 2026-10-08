export interface JwtAccessPayload {
  id: string;
  sessionId?: string;
}

export interface JwtRefreshPayload {
  userId: string;
  sessionId: string;
}
