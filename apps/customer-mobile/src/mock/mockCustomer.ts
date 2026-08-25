import type { CustomerProfile } from '../types';

export const MOCK_CUSTOMER: CustomerProfile = {
  id: 'CUST-00189',
  name: 'Nguyễn Văn A',
  phone: '0901234567',
  email: 'nguyenvana@gmail.com',
  points: 786,
  vouchersCount: 4,
  defaultSenderAddress: {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    addressDetail: '123 Nguyễn Trãi, Phường 2, Quận 5',
    ward: 'Phường 2',
    district: 'Quận 5',
    province: 'Hồ Chí Minh',
  },
};
