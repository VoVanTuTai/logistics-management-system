export interface CustomerBankAccount {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  updatedAt: string;
}

export interface BankItem {
  code: string;
  name: string;
  fullName: string;
}

export const POPULAR_BANKS: BankItem[] = [
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

const STORAGE_PREFIX = 'nexus_customer_bank_account_';

export function getCustomerBankAccount(userIdOrPhone: string): CustomerBankAccount | null {
  if (!userIdOrPhone) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userIdOrPhone}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCustomerBankAccount(
  userIdOrPhone: string,
  data: Omit<CustomerBankAccount, 'updatedAt'>,
): CustomerBankAccount {
  const account: CustomerBankAccount = {
    ...data,
    accountNumber: data.accountNumber.trim().replace(/\s/g, ''),
    accountHolder: data.accountHolder.trim().toUpperCase(),
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userIdOrPhone}`, JSON.stringify(account));
  } catch {}
  return account;
}

export function deleteCustomerBankAccount(userIdOrPhone: string): void {
  if (!userIdOrPhone) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userIdOrPhone}`);
  } catch {}
}
