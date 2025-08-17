import { LoginMethod } from '@repo/shared/types';

export type { LoginMethod };

export interface LoginFormData {
  loginMethod: string;
  phoneNumber: string;
  email: string;
  password: string;
  rememberMe: boolean;
}