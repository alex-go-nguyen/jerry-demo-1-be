import { StatusEnableTwoFa } from '@/common/enums';

export interface ILoginInputData {
  email: string;
  password: string;
}

export interface ILoginResultWith2FA {
  userId: string;
  statusEnableTwoFa: StatusEnableTwoFa;
}

export interface ILoginResultWithTokens {
  accessToken: string;
  refreshToken: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
    email: string;
    avatar: string;
    status: string;
    phoneNumber: string;
    highLevelPasswords: { type: string; status: string }[];
    isSkippedTwoFa: boolean;
  };
}

export type ILoginResult = ILoginResultWith2FA | ILoginResultWithTokens;
