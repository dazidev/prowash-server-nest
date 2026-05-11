type UserRole = 'ADMIN' | 'MOD' | 'USER';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  password?: string;
  phoneNumber: string | null;
  isEmailVerified: boolean;
  isPhoneNumberVerified: boolean;
  roles: UserRole[];
  status: UserStatus;
  sessionId?: string;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
