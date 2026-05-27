import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { vietnamAdministrativeUnitsClient } from './vietnamAdministrativeUnits.client';

export function useVietnamAdministrativeUnitsQuery() {
  return useQuery({
    queryKey: queryKeys.vietnamAdministrativeUnits,
    queryFn: () => vietnamAdministrativeUnitsClient.listProvinces(),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}
