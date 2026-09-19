import { SupabaseRepository } from '../config/supabase';

export interface IUser {
  _id?: string;
  id?: string;
  clinicId: string | any;
  name: string;
  email: string;
  passwordHash?: string;
  roleId: string | any;
  roleName: 'Owner' | 'Admin' | 'Doctor' | 'Receptionist' | 'Lab Technician' | 'Pharmacist' | 'Accountant';
  phone?: string;
  status: 'active' | 'inactive';
  refreshToken?: string;
  avatarUrl?: string;
  authProvider?: 'email' | 'google' | 'otp';
  googleId?: string;
  otpCode?: string;
  otpExpiresAt?: Date;
  otpLastRequestedAt?: Date;
  otpAttempts?: number;
  resetToken?: string;
  resetTokenExpiresAt?: Date;
  lastLoginAt?: Date;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IUser>;
  toObject?: () => any;
}

export const User = new SupabaseRepository<IUser>('users');
