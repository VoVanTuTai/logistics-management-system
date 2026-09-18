import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CourierLiabilityItem } from './liabilities.types';

const LIABILITIES_STORAGE_KEY = 'courier-mobile.liabilities.v2';

const SEED_LIABILITIES: CourierLiabilityItem[] = [
  {
    id: 'clm-005',
    claimCode: 'CLM-202609-005',
    shipmentCode: 'NXS000520',
    incidentType: 'DAMAGED',
    incidentDate: '2026-09-10',
    itemDescription: 'Đồng hồ cơ nam Seiko Presage kính Sapphire',
    damageDescription: 'Vỡ nát mặt kính, xước niềng kim loại',
    qaFinding:
      'Bưu tá đi giao hàng gặp trời mưa trượt ngã xe máy, thùng hàng rơi xuống đường va đập mạnh làm nứt vỡ kính đồng hồ. Hồ sơ chỉ định chế tài bồi hoàn hỗ trợ theo quy chế vận hành.',
    adjudicatedBy: 'Trần Minh Tuấn (QA Lead)',
    adjudicatedAt: '2026-09-11T09:00:00Z',
    penaltyAmount: 350000,
    status: 'PENDING_EXPLANATION',
    evidencePhotos: [
      {
        id: 'p1',
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
        label: 'Mặt kính đồng hồ bị nứt rạn',
        takenAt: '10/09/2026 15:20',
      },
      {
        id: 'p2',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        label: 'Ngoại quan thùng móp rách góc',
        takenAt: '10/09/2026 15:25',
      },
    ],
  },
  {
    id: 'clm-007',
    claimCode: 'CLM-202609-007',
    shipmentCode: 'NXS000788',
    incidentType: 'DAMAGED',
    incidentDate: '2026-09-12',
    itemDescription: 'Bộ mỹ phẩm serum dưỡng da chống lão hóa',
    damageDescription: 'Chai thủy tinh bên trong nứt cổ, rò rỉ dung dịch ướt thùng',
    qaFinding:
      'Khách từ chối nhận do kiện hàng có mùi mỹ phẩm nồng nặc và ướt đáy. Chỉ định bưu tá chịu trách nhiệm bảo quản trong ca.',
    adjudicatedBy: 'Trần Minh Tuấn (QA Lead)',
    adjudicatedAt: '2026-09-12T14:00:00Z',
    penaltyAmount: 120000,
    status: 'APPEAL_SUBMITTED',
    appealReason: 'Hàng nhận từ bưu cục đã có dấu hiệu rò rỉ sẵn',
    appealNotes:
      'Lúc em quét xuất kho từ bưu cục đi phát đã ngửi thấy mùi serum, em có báo thủ kho ca sáng nhưng thủ kho bảo do dính bên ngoài cứ đi giao. Em xin đề nghị kiểm tra camera cửa xuất số 2 lúc 08:15 ngày 12/09.',
    appealSubmittedAt: '2026-09-12T16:30:00Z',
    evidencePhotos: [
      {
        id: 'p3',
        url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80',
        label: 'Vết ướt loang dầu đáy hộp',
        takenAt: '12/09/2026 11:30',
      },
    ],
  },
];

interface LiabilitiesState {
  items: CourierLiabilityItem[];
  isHydrated: boolean;
  hydrateLiabilities: () => Promise<void>;
  submitAppeal: (
    claimId: string,
    payload: { appealReason: string; appealNotes: string; photoUrl?: string },
  ) => Promise<void>;
  acceptLiability: (claimId: string) => Promise<void>;
  getActiveDeductionsTotal: () => number;
}

export const useLiabilitiesStore = create<LiabilitiesState>((set, get) => ({
  items: SEED_LIABILITIES,
  isHydrated: false,

  hydrateLiabilities: async () => {
    try {
      const raw = await AsyncStorage.getItem(LIABILITIES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CourierLiabilityItem[];
        set({ items: parsed, isHydrated: true });
        return;
      }
    } catch {
      // Fallback to seed
    }
    set({ items: SEED_LIABILITIES, isHydrated: true });
  },

  submitAppeal: async (claimId, payload) => {
    const updated = get().items.map((item) => {
      if (item.id === claimId || item.claimCode === claimId) {
        return {
          ...item,
          status: 'APPEAL_SUBMITTED' as const,
          appealReason: payload.appealReason,
          appealNotes: payload.appealNotes,
          appealPhotoUrl: payload.photoUrl,
          appealSubmittedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    set({ items: updated });
    try {
      await AsyncStorage.setItem(LIABILITIES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  },

  acceptLiability: async (claimId) => {
    const updated = get().items.map((item) => {
      if (item.id === claimId || item.claimCode === claimId) {
        return {
          ...item,
          status: 'DEDUCTED' as const,
        };
      }
      return item;
    });

    set({ items: updated });
    try {
      await AsyncStorage.setItem(LIABILITIES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  },

  getActiveDeductionsTotal: () => {
    // Chỉ trừ các đơn đã bị kết luận khấu trừ (DEDUCTED) hoặc đã chốt phán quyết (ADJUDICATED).
    // Các đơn đang kháng cáo (APPEAL_SUBMITTED) được tạm hoãn chờ phúc khảo!
    return get()
      .items.filter((item) => item.status === 'DEDUCTED' || item.status === 'ADJUDICATED')
      .reduce((sum, item) => sum + item.penaltyAmount, 0);
  },
}));
