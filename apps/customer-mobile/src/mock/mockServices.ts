import type { ShippingServiceOption } from '../types';

export const MOCK_SHIPPING_SERVICES: ShippingServiceOption[] = [
  {
    id: 'STANDARD',
    name: 'Chuyển phát tiêu chuẩn',
    estimatedHours: 'Dự kiến giao sau 2-3 ngày',
    fee: 18000,
    popular: true,
  },
  {
    id: 'EXPRESS',
    name: 'Chuyển phát nhanh TMĐT',
    estimatedHours: 'Dự kiến giao trong 24h',
    fee: 28000,
  },
  {
    id: 'SAME_DAY',
    name: 'Hỏa tốc trong ngày',
    estimatedHours: 'Dự kiến giao trong ngày / 6-12h',
    fee: 42000,
  },
];
