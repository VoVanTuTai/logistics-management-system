import type { ShippingServiceOption } from '../types';

export const MOCK_SHIPPING_SERVICES: ShippingServiceOption[] = [
  {
    id: 'STANDARD',
    name: 'Chuyển phát tiết kiệm',
    estimatedHours: 'Dự kiến giao sau 2-3 ngày',
    fee: 22000,
    popular: true,
  },
  {
    id: 'EXPRESS',
    name: 'Chuyển phát nhanh TMĐT',
    estimatedHours: 'Dự kiến giao trong 24h',
    fee: 28000,
  },
  {
    id: 'SUPER_FAST',
    name: 'Hỏa tốc, hẹn giờ',
    estimatedHours: 'Dự kiến giao sau 6 giờ',
    fee: 38000,
  },
];
