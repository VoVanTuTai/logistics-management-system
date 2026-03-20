import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AuthSessionDto,
  LoginFormValues,
  OpsUserDto,
  OpsUserFilters,
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
  listUsers: (
    accessToken: string | null,
    filters: OpsUserFilters,
  ): Promise<OpsUserDto[]> => {
    const params = new URLSearchParams();
    params.set('roleGroup', filters.roleGroup);

    if (filters.hubCode?.trim()) {
      params.set('hubCode', filters.hubCode.trim().toUpperCase());
    }

    if (filters.status) {
      params.set('status', filters.status);
    }

    if (filters.q?.trim()) {
      params.set('q', filters.q.trim());
    }

    const query = params.toString();
    return opsApiClient.request<OpsUserDto[]>(
      `${opsEndpoints.auth.users}${query ? `?${query}` : ''}`,
      {
        accessToken,
      },
    );
  },
};

