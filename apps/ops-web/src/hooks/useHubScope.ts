import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useHubsQuery } from '../features/masterdata/masterdata.hooks';
import { resolveOpsActor } from '../features/permissions/opsPermissions';
import {
  resolveHubScope,
  type HubScopeResult,
} from '../utils/hubScopeResolver';
import type { HubDto } from '../features/masterdata/masterdata.types';

export interface UseHubScopeReturn extends HubScopeResult {
  allHubs: HubDto[];
  isLoading: boolean;
}

export function useHubScope(): UseHubScopeReturn {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const username = session?.user.username ?? null;
  const roles = session?.user.roles ?? [];
  const assignedHubCodes = session?.user.hubCodes ?? [];

  const hubsQuery = useHubsQuery(accessToken, {});
  const allHubs = hubsQuery.data ?? [];

  const actor = useMemo(() => {
    return resolveOpsActor(username, roles, assignedHubCodes);
  }, [username, roles, assignedHubCodes]);

  const hubScope = useMemo(() => {
    return resolveHubScope(allHubs, assignedHubCodes, actor, roles);
  }, [allHubs, assignedHubCodes, actor, roles]);

  return {
    ...hubScope,
    allHubs,
    isLoading: hubsQuery.isLoading,
  };
}
