import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type { ShipmentDto } from './shipment.types';

export const shipmentApi = {
  getShipmentDetail: (
    accessToken: string,
    shipmentCode: string,
  ): Promise<ShipmentDto> =>
    courierApiClient.request(courierEndpoints.shipment.detail(shipmentCode), {
      accessToken,
    }),
};
