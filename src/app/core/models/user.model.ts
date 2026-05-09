export interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: 'MEMBER' | 'BOARD_ADMIN' | 'PLATFORM_ADMIN';
  provider: 'LOCAL' | 'GOOGLE';
  isActive: boolean;
  premium?: boolean;
  planCode?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface OtpChallengeResponse {
  message: string;
  expiresInSeconds: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  username: string;
  password: string;
}
