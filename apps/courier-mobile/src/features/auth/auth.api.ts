import { useMutation } from '@tanstack/react-query';

import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  IntrospectInputDto,
  IntrospectResultDto,
  LoginFormValues,
  LoginResultDto,
  LogoutInputDto,
  LogoutResultDto,
  RefreshSessionInputDto,
} from './auth.types';

export const authApi = {
  login: (payload: LoginFormValues): Promise<LoginResultDto> =>
    courierApiClient.request(courierEndpoints.auth.login, {
      method: 'POST',
      body: payload,
    }),
  refresh: (payload: RefreshSessionInputDto): Promise<LoginResultDto> =>
    courierApiClient.request(courierEndpoints.auth.refresh, {
      method: 'POST',
      body: payload,
    }),
  logout: (
    accessToken: string | null,
    payload: LogoutInputDto,
  ): Promise<LogoutResultDto> =>
    courierApiClient.request(courierEndpoints.auth.logout, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  introspect: (
    accessToken: string | null,
    payload: IntrospectInputDto,
  ): Promise<IntrospectResultDto> =>
    courierApiClient.request(courierEndpoints.auth.introspect, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
};

export function useLoginMutation() {
  return useMutation({
    mutationFn: authApi.login,
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: (payload: LogoutInputDto) =>
      authApi.logout(payload.accessToken ?? null, payload),
  });
}
