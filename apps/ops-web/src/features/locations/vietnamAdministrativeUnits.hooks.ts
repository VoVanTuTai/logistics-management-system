import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { vietnamAdministrativeUnitsClient } from './vietnamAdministrativeUnits.client';

export function useVietnamAdministrativeUnitsQuery(accessToken: string | null | undefined) {
  return useQuery({
    queryKey: [...queryKeys.vietnamAdministrativeUnits, accessToken],
    queryFn: () => vietnamAdministrativeUnitsClient.listProvinces(accessToken ?? ''),
    enabled: Boolean(accessToken),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}
