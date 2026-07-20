import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { masterdataClient } from './masterdata.client';
import type {
  ConfigFilters,
  ConfigWriteInput,
  HubFilters,
  HubWriteInput,
  NdrReasonFilters,
  NdrReasonWriteInput,
  ZoneFilters,
  ZoneWriteInput,
  CourierAreaAssignmentFilters,
  CourierAreaAssignmentWriteInput,
} from './masterdata.types';

export function useHubsQuery(accessToken: string | null, filters: HubFilters) {
  return useQuery({
    queryKey: [
      ...queryKeys.masterdataHubs,
      filters.code ?? '',
      filters.name ?? '',
      filters.zoneCode ?? '',
      filters.isActive ?? '',
      filters.q ?? '',
    ],
    queryFn: () => masterdataClient.listHubs(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useCreateHubMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HubWriteInput) =>
      masterdataClient.createHub(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.masterdataHubs });
    },
  });
}

export function useUpdateHubMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { hubId: string; payload: Partial<HubWriteInput> }) =>
      masterdataClient.updateHub(accessToken, params.hubId, params.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.masterdataHubs });
    },
  });
}

export function useZonesQuery(accessToken: string | null, filters: ZoneFilters) {
  return useQuery({
    queryKey: [
      ...queryKeys.masterdataZones,
      filters.code ?? '',
      filters.name ?? '',
      filters.parentCode ?? '',
      filters.isActive ?? '',
      filters.q ?? '',
    ],
    queryFn: () => masterdataClient.listZones(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useCreateZoneMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ZoneWriteInput) =>
      masterdataClient.createZone(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.masterdataZones });
    },
  });
}

export function useUpdateZoneMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { zoneId: string; payload: Partial<ZoneWriteInput> }) =>
      masterdataClient.updateZone(accessToken, params.zoneId, params.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.masterdataZones });
    },
  });
}

export function useNdrReasonsQuery(
  accessToken: string | null,
  filters: NdrReasonFilters,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.masterdataNdrReasons,
      filters.code ?? '',
      filters.description ?? '',
      filters.isActive ?? '',
      filters.q ?? '',
    ],
    queryFn: () => masterdataClient.listNdrReasons(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useCreateNdrReasonMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NdrReasonWriteInput) =>
      masterdataClient.createNdrReason(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.masterdataNdrReasons,
      });
    },
  });
}

export function useUpdateNdrReasonMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      ndrReasonId: string;
      payload: Partial<NdrReasonWriteInput>;
    }) =>
      masterdataClient.updateNdrReason(
        accessToken,
        params.ndrReasonId,
        params.payload,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.masterdataNdrReasons,
      });
    },
  });
}

export function useConfigsQuery(
  accessToken: string | null,
  filters: ConfigFilters,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.masterdataConfigs,
      filters.key ?? '',
      filters.scope ?? '',
      filters.q ?? '',
    ],
    queryFn: () => masterdataClient.listConfigs(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useCreateConfigMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfigWriteInput) =>
      masterdataClient.createConfig(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.masterdataConfigs,
      });
    },
  });
}

export function useUpdateConfigMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { configId: string; payload: Partial<ConfigWriteInput> }) =>
      masterdataClient.updateConfig(accessToken, params.configId, params.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.masterdataConfigs,
      });
    },
  });
}

export function useCourierAreaAssignmentsQuery(
  accessToken: string | null,
  filters: CourierAreaAssignmentFilters,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.courierAreaAssignments,
      filters.courierId ?? '',
      filters.hubCode ?? '',
      filters.province ?? '',
      filters.district ?? '',
      filters.ward ?? '',
      filters.isActive ?? '',
    ],
    queryFn: () => masterdataClient.listCourierAreaAssignments(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useCreateCourierAreaAssignmentMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CourierAreaAssignmentWriteInput) =>
      masterdataClient.createCourierAreaAssignment(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.courierAreaAssignments,
      });
    },
  });
}

export function useUpdateCourierAreaAssignmentMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      id: string;
      payload: Partial<CourierAreaAssignmentWriteInput>;
    }) =>
      masterdataClient.updateCourierAreaAssignment(
        accessToken,
        params.id,
        params.payload,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.courierAreaAssignments,
      });
    },
  });
}

export function useDeleteCourierAreaAssignmentMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      masterdataClient.deleteCourierAreaAssignment(accessToken, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.courierAreaAssignments,
      });
    },
  });
}

export function useVietnamAdministrativeUnitsQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.vietnamAdministrativeUnits,
    queryFn: () => masterdataClient.listVietnamAdministrativeUnits(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours caching since administrative units change very rarely
  });
}
