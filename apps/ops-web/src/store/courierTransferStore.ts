import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TransferShipmentItem {
  shipmentCode: string;
  senderName: string;
  receiverName: string;
  receiverAddress: string;
  currentStatus: string;
  sourceCourierId: string;
  sourceCourierName: string;
}

export interface CourierTransferRequest {
  id: string;
  requestNo: string;
  sourceCourierId: string;
  sourceCourierName: string;
  targetCourierId: string;
  targetCourierName: string;
  hubCode: string;
  shipments: TransferShipmentItem[];
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED';
  note?: string;
  createdAt: string;
  respondedAt?: string;
}

interface CourierTransferState {
  requests: CourierTransferRequest[];
  createTransferRequest: (req: Omit<CourierTransferRequest, 'id' | 'requestNo' | 'status' | 'createdAt'>) => string;
  acceptTransferRequest: (id: string) => void;
  rejectTransferRequest: (id: string) => void;
}

export const useCourierTransferStore = create<CourierTransferState>()(
  persist(
    (set) => ({
      requests: [
        {
          id: 'tr-sample-01',
          requestNo: 'TR-20260813-001',
          sourceCourierId: '30000001',
          sourceCourierName: 'Nguyễn Văn Minh',
          targetCourierId: '30000004',
          targetCourierName: 'Phạm Minh Khang',
          hubCode: 'HCM-001',
          shipments: [
            {
              shipmentCode: 'NXS000001',
              senderName: 'Cửa hàng An Phú',
              receiverName: 'Nguyễn Văn A',
              receiverAddress: '123 Nguyễn Thị Minh Khai, Q1, TP.HCM',
              currentStatus: 'IN_TRANSIT',
              sourceCourierId: '30000001',
              sourceCourierName: 'Nguyễn Văn Minh',
            },
          ],
          status: 'PENDING_ACCEPTANCE',
          note: 'Chuyển đơn do Courier Minh bận đột xuất',
          createdAt: new Date().toISOString(),
        },
      ],
      createTransferRequest: (reqData) => {
        const id = `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const requestNo = `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
        const newReq: CourierTransferRequest = {
          ...reqData,
          id,
          requestNo,
          status: 'PENDING_ACCEPTANCE',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          requests: [newReq, ...state.requests],
        }));
        return id;
      },
      acceptTransferRequest: (id) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id
              ? { ...r, status: 'ACCEPTED', respondedAt: new Date().toISOString() }
              : r,
          ),
        })),
      rejectTransferRequest: (id) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id
              ? { ...r, status: 'REJECTED', respondedAt: new Date().toISOString() }
              : r,
          ),
        })),
    }),
    {
      name: 'nexus-ops-courier-transfer-storage',
    },
  ),
);
