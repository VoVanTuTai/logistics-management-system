import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AuthSessionDto,
  LoginFormValues,
  LogoutResultDto,
  RefreshTokenInputDto,
} from './auth.types';

export const authClient = {
  login: (payload: LoginFormValues): Promise<AuthSessionDto> =>
    opsApiClient.request<AuthSessionDto>(opsEndpoints.auth.login, {
      method: 'POST',
      body: payload,
    }),
  logout: (accessToken: string | null): Promise<LogoutResultDto> =>
    opsApiClient.request<LogoutResultDto>(opsEndpoints.auth.logout, {
      method: 'POST',
      accessToken,
      body: {
        accessToken,
      },
    }),
  refresh: (payload: RefreshTokenInputDto): Promise<AuthSessionDto> =>
    // TODO(contract): confirm refresh token request/response with gateway-bff /ops.
    opsApiClient.request<AuthSessionDto>(opsEndpoints.auth.refresh, {
      method: 'POST',
      body: payload,
    }),
};

