export type UserRole = 'Super Admin' | 'Admin' | 'User';

export interface Stock {
  id: string;
  region: string;
  modelName: string;
  quantity: number;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string;
  region?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
}
