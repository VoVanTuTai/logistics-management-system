import { useQuery } from '@tanstack/react-query';

import { shipmentApi } from './shipment.api';

export function useShipmentDetailQuery(params: {
  accessToken: string | null;
  shipmentCode: string | null;
}) {
  return useQuery({
    queryKey: ['shipment', 'detail', params.shipmentCode],
    queryFn: () =>
      shipmentApi.getShipmentDetail(
        params.accessToken as string,
        params.shipmentCode as string,
      ),
    enabled: Boolean(params.accessToken) && Boolean(params.shipmentCode),
  });
}
