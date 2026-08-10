import { customerApiClient } from './client';

export interface LoginPayload {
  username: string;
  password?: string;
  roleGroup?: string;
}

export interface LoginResponse {
  accessToken?: string;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    expiresInSeconds?: number;
  };
  user: {
    id: string;
    username: string;
    displayName: string | null;
    phone: string | null;
    roles: string[];
    hubCodes?: string[];
  };
}

export interface RegisterPayload {
  username: string;
  password?: string;
  displayName?: string;
  phone?: string;
  roles?: string[];
}

export interface UserProfileResponse {
  id: string;
  username: string;
  displayName: string | null;
  phone: string | null;
  roles: string[];
  status?: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    return customerApiClient.request<LoginResponse>('/public/auth/auth/login', {
      method: 'POST',
      body: {
        username: payload.username,
        password: payload.password,
        roleGroup: 'MERCHANT',
      },
    });
  },

  register: async (payload: RegisterPayload): Promise<UserProfileResponse> => {
    return customerApiClient.request<UserProfileResponse>('/public/auth/auth/users', {
      method: 'POST',
      body: {
        username: payload.username,
        password: payload.password,
        displayName: payload.displayName || payload.username,
        phone: payload.phone || payload.username,
        roles: ['MERCHANT'],
      },
    });
  },

  getMe: async (accessToken: string): Promise<UserProfileResponse> => {
    return customerApiClient.request<UserProfileResponse>('/public/auth/auth/me', {
      method: 'GET',
      accessToken,
    });
  },
};
