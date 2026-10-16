import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStore } from './authStore';

export interface CustomerBankAccount {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'NEXUS_CUSTOMER_BANK_ACCOUNT_V1';

function resolveStorageKey(): string {
  const user = authStore.getUser();
  const userId = user?.id || user?.username;
  if (userId) {
    return `${STORAGE_PREFIX}_${userId}`;
  }
  return `${STORAGE_PREFIX}_GUEST`;
}

export const POPULAR_BANKS = [
  { code: 'VCB', name: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
  { code: 'MB', name: 'MBBank', fullName: 'Ngân hàng TMCP Quân đội' },
  { code: 'TCB', name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { code: 'ACB', name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  { code: 'VPB', name: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { code: 'BIDV', name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'CTG', name: 'VietinBank', fullName: 'Ngân hàng TMCP Công thương Việt Nam' },
  { code: 'TPB', name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
  { code: 'STB', name: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { code: 'HDB', name: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển TP.HCM' },
  { code: 'VIB', name: 'VIB', fullName: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { code: 'SHB', name: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
];

export const bankAccountStore = {
  getBankAccount: async (): Promise<CustomerBankAccount | null> => {
    try {
      const key = resolveStorageKey();
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveBankAccount: async (
    data: Omit<CustomerBankAccount, 'updatedAt'>,
  ): Promise<CustomerBankAccount> => {
    const key = resolveStorageKey();
    const account: CustomerBankAccount = {
      ...data,
      accountNumber: data.accountNumber.trim().replace(/\s/g, ''),
      accountHolder: data.accountHolder.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(account));
    return account;
  },

  deleteBankAccount: async (): Promise<void> => {
    const key = resolveStorageKey();
    await AsyncStorage.removeItem(key);
  },
};
