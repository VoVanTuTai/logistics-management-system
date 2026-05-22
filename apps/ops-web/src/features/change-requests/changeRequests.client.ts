import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  ApproveChangeRequestInput,
  ChangeRequestDto,
} from './changeRequests.types';

export const changeRequestsClient = {
  list: (accessToken: string | null): Promise<ChangeRequestDto[]> =>
    opsApiClient.request<ChangeRequestDto[]>(opsEndpoints.changeRequests.list, {
      accessToken,
    }),

  approve: (
    accessToken: string | null,
    requestId: string,
    payload: ApproveChangeRequestInput,
  ): Promise<ChangeRequestDto> =>
    opsApiClient.request<ChangeRequestDto>(
      opsEndpoints.changeRequests.approve(requestId),
      {
        method: 'PATCH',
        accessToken,
        body: payload,
      },
    ),
};
