import React, { useState, useEffect } from 'react';
import {
  User,
  CreditCard,
  LogOut,
  X,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  Edit3,
  Trash2,
  Plus,
  ShieldCheck,
  Package,
  Phone,
  AlertCircle,
  ExternalLink,
  MapPin,
  Star,
  Home,
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { CustomerUser } from '../store/useAuthStore';
import {
  CustomerBankAccount,
  POPULAR_BANKS,
  getCustomerBankAccount,
  saveCustomerBankAccount,
  deleteCustomerBankAccount,
} from '../utils/bankAccountService';
import {
  SavedAddress,
  getSavedAddresses,
  saveAddress,
  setDefaultAddress,
  deleteAddress,
} from '../utils/savedAddressService';
import { VIETNAM_ADMINISTRATIVE_DATA } from '../utils/vietnamAdministrativeData';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CustomerUser | null;
  phone: string | null;
  onLogout: () => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  phone,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'bank'>('profile');
  const [bankAccount, setBankAccount] = useState<CustomerBankAccount | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState(POPULAR_BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankFormError, setBankFormError] = useState<string | null>(null);
  const [bankFormSuccess, setBankFormSuccess] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressName, setAddressName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressProvince, setAddressProvince] = useState(VIETNAM_ADMINISTRATIVE_DATA[0].name);
  const [addressWard, setAddressWard] = useState(VIETNAM_ADMINISTRATIVE_DATA[0].wards[0].displayName);
  const [addressDetail, setAddressDetail] = useState('');
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);
  const [addressFormSuccess, setAddressFormSuccess] = useState<string | null>(null);

  const identifier = phone || user?.id || user?.username || '';

  // Load bank account and addresses when modal opens
  useEffect(() => {
    if (isOpen && identifier) {
      const savedBank = getCustomerBankAccount(identifier);
      setBankAccount(savedBank);
      if (savedBank) {
        setSelectedBankCode(savedBank.bankCode);
        setAccountNumber(savedBank.accountNumber);
        setAccountHolder(savedBank.accountHolder);
        setIsEditingBank(false);
      } else {
        setSelectedBankCode(POPULAR_BANKS[0].code);
        setAccountNumber('');
        setAccountHolder(user?.displayName ? user.displayName.toUpperCase() : '');
        setIsEditingBank(false);
      }
      setBankFormError(null);
      setBankFormSuccess(null);

      // Load addresses
      const list = getSavedAddresses(identifier);
      setAddresses(list);
      setIsEditingAddress(false);
      setAddressFormError(null);
      setAddressFormSuccess(null);
    }
  }, [isOpen, identifier, user?.displayName]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyAccountNumber = () => {
    if (!bankAccount?.accountNumber) return;
    navigator.clipboard.writeText(bankAccount.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      setBankFormError('Vui lòng nhập số tài khoản ngân hàng.');
      return;
    }
    if (!accountHolder.trim()) {
      setBankFormError('Vui lòng nhập tên chủ tài khoản (in hoa không dấu).');
      return;
    }

    const selectedBank = POPULAR_BANKS.find((b) => b.code === selectedBankCode) || POPULAR_BANKS[0];
    const saved = saveCustomerBankAccount(identifier, {
      bankCode: selectedBank.code,
      bankName: selectedBank.name,
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
    });

    setBankAccount(saved);
    setIsEditingBank(false);
    setBankFormError(null);
    setBankFormSuccess('Đã lưu thông tin tài khoản ngân hàng thành công!');
    setTimeout(() => setBankFormSuccess(null), 3000);
  };

  const handleDeleteBank = () => {
    if (window.confirm('Bạn có chắc chắn muốn gỡ thông tin tài khoản ngân hàng này?')) {
      deleteCustomerBankAccount(identifier);
      setBankAccount(null);
      setAccountNumber('');
      setAccountHolder('');
      setIsEditingBank(false);
      setBankFormSuccess('Đã xóa thông tin tài khoản ngân hàng.');
      setTimeout(() => setBankFormSuccess(null), 3000);
    }
  };

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressName(user?.displayName || '');
    setAddressPhone(phone || user?.phone || '');
    setAddressProvince(VIETNAM_ADMINISTRATIVE_DATA[0].name);
    setAddressWard(VIETNAM_ADMINISTRATIVE_DATA[0].wards[0].displayName);
    setAddressDetail('');
    setAddressIsDefault(addresses.length === 0);
    setAddressFormError(null);
    setIsEditingAddress(true);
  };

  const handleOpenEditAddress = (item: SavedAddress) => {
    setEditingAddressId(item.id);
    setAddressName(item.name);
    setAddressPhone(item.phone);
    setAddressProvince(item.province);
    setAddressWard(item.ward);
    setAddressDetail(item.addressDetail);
    setAddressIsDefault(item.isDefault);
    setAddressFormError(null);
    setIsEditingAddress(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressName.trim()) {
      setAddressFormError('Vui lòng nhập họ và tên người gửi.');
      return;
    }
    if (!addressPhone.trim()) {
      setAddressFormError('Vui lòng nhập số điện thoại người gửi.');
      return;
    }
    if (!addressDetail.trim()) {
      setAddressFormError('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).');
      return;
    }

    const composed = `${addressDetail.trim()}, ${addressWard}, ${addressProvince}`;
    const updated = saveAddress(identifier, {
      id: editingAddressId || undefined,
      name: addressName.trim(),
      phone: addressPhone.trim(),
      province: addressProvince,
      ward: addressWard,
      addressDetail: addressDetail.trim(),
      composedAddress: composed,
      isDefault: addressIsDefault,
    });

    setAddresses(updated);
    setIsEditingAddress(false);
    setEditingAddressId(null);
    setAddressFormError(null);
    setAddressFormSuccess('Đã lưu địa chỉ thành công!');
    setTimeout(() => setAddressFormSuccess(null), 3000);
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = setDefaultAddress(identifier, id);
    setAddresses(updated);
    setAddressFormSuccess('Đã đổi địa chỉ mặc định!');
    setTimeout(() => setAddressFormSuccess(null), 2500);
  };

  const handleDeleteAddress = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này khỏi danh bạ?')) {
      const updated = deleteAddress(identifier, id);
      setAddresses(updated);
      setAddressFormSuccess('Đã xóa địa chỉ thành công.');
      setTimeout(() => setAddressFormSuccess(null), 2500);
    }
  };

  const displayName = user?.displayName || phone || 'Khách hàng';
  const displayPhone = phone || user?.phone || 'Chưa cập nhật';
  const displayRole = user?.roles?.join(', ') || 'CUSTOMER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-extrabold text-lg shadow-inner">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-tight">{displayName}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                  Đã xác thực
                </span>
              </div>
              <p className="text-xs text-blue-100/90 flex items-center gap-1.5 mt-0.5">
                <Phone className="h-3 w-3" />
                <span>{displayPhone}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Thông tin tài khoản</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'addresses'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Sổ địa chỉ gửi</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
              {addresses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'bank'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Tài khoản ngân hàng</span>
            {bankAccount ? (
              <span className="h-2 w-2 rounded-full bg-emerald-500" title="Đã liên kết ngân hàng" />
            ) : (
              <span className="text-[10px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Chưa gán
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800 text-xs">
          {addressFormSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{addressFormSuccess}</span>
            </div>
          )}

          {addressFormError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{addressFormError}</span>
            </div>
          )}

          {bankFormSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{bankFormSuccess}</span>
            </div>
          )}

          {bankFormError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{bankFormError}</span>
            </div>
          )}

          {/* TAB 1: THÔNG TIN TÀI KHOẢN */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Họ và tên:</span>
                  <strong className="text-slate-900 font-bold">{displayName}</strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Số điện thoại đăng nhập:</span>
                  <strong className="text-slate-900 font-mono font-bold">{displayPhone}</strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Tên tài khoản (Username):</span>
                  <span className="text-slate-700 font-mono">{user?.username || phone || '—'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Loại tài khoản:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    Khách Hàng Bưu Chính ({displayRole})
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Trạng thái định danh:</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang hoạt động (ACTIVE)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Mã định danh ID:</span>
                  <span className="text-slate-500 font-mono text-[11px] truncate max-w-[200px]" title={user?.id || ''}>
                    {user?.id || '—'}
                  </span>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <RouterLink
                  to="/orders"
                  onClick={onClose}
                  className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between text-blue-700 mb-2">
                    <Package className="h-5 w-5" />
                    <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-700">Đơn hàng của tôi</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Theo dõi lịch sử đơn gửi & nhận</p>
                  </div>
                </RouterLink>

                <RouterLink
                  to="/create"
                  onClick={onClose}
                  className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between text-emerald-700 mb-2">
                    <Plus className="h-5 w-5" />
                    <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-emerald-700">Tạo đơn gửi mới</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Lấy hàng tận nơi hoặc gửi tại bưu cục</p>
                  </div>
                </RouterLink>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Tài khoản của bạn được mã hóa an toàn trên hệ thống Nexus Bưu Chính Quốc Gia theo chuẩn bảo mật ISO 27001.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: SỔ ĐỊA CHỈ GỬI */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Danh bạ địa chỉ lấy hàng</h4>
                  <p className="text-[11px] text-slate-500">
                    Lưu các địa chỉ thường xuyên gửi hàng để tự động điền nhanh khi tạo vận đơn.
                  </p>
                </div>
                {!isEditingAddress && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm địa chỉ</span>
                  </button>
                )}
              </div>

              {isEditingAddress ? (
                <form onSubmit={handleSaveAddress} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-2">
                    {editingAddressId ? 'Chỉnh sửa địa chỉ gửi' : 'Thêm địa chỉ gửi mới'}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Họ và tên người gửi *</label>
                      <input
                        type="text"
                        required
                        value={addressName}
                        onChange={(e) => setAddressName(e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        required
                        value={addressPhone}
                        onChange={(e) => setAddressPhone(e.target.value)}
                        placeholder="VD: 0901234567"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tỉnh / Thành phố *</label>
                      <select
                        value={addressProvince}
                        onChange={(e) => {
                          const p = e.target.value;
                          setAddressProvince(p);
                          const prov = VIETNAM_ADMINISTRATIVE_DATA.find((item) => item.name === p);
                          if (prov && prov.wards.length > 0) {
                            setAddressWard(prov.wards[0].displayName);
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        {VIETNAM_ADMINISTRATIVE_DATA.map((prov) => (
                          <option key={prov.name} value={prov.name}>
                            {prov.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Phường / Xã / Quận *</label>
                      <select
                        value={addressWard}
                        onChange={(e) => setAddressWard(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        {(
                          VIETNAM_ADMINISTRATIVE_DATA.find((item) => item.name === addressProvince)?.wards || []
                        ).map((w) => (
                          <option key={w.code} value={w.displayName}>
                            {w.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Địa chỉ chi tiết (số nhà, tên đường) *</label>
                    <input
                      type="text"
                      required
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      placeholder="VD: 123 Nguyễn Huệ, Chung cư A, Phòng 402"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={addressIsDefault}
                      onChange={(e) => setAddressIsDefault(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Đặt làm địa chỉ lấy hàng mặc định</span>
                  </label>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{editingAddressId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {addresses.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
                      <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <h4 className="font-bold text-slate-700">Chưa có địa chỉ nào được lưu</h4>
                      <p className="text-slate-500 text-[11px] mt-1 max-w-xs mx-auto">
                        Thêm địa chỉ người gửi để tự động điền nhanh chóng mỗi khi bạn đặt đơn lấy hàng tận nhà.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAddAddress}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Thêm địa chỉ ngay</span>
                      </button>
                    </div>
                  ) : (
                    addresses.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition ${
                          item.isDefault
                            ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 font-bold">{item.name}</strong>
                              <span className="text-slate-400">•</span>
                              <span className="font-mono text-slate-700 font-bold">{item.phone}</span>
                              {item.isDefault && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                  <Star className="h-3 w-3 fill-blue-600 text-blue-600" />
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed flex items-start gap-1.5 pt-0.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{item.composedAddress}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!item.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultAddress(item.id)}
                                className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition border border-slate-200 cursor-pointer"
                                title="Đặt làm mặc định"
                              >
                                Đặt mặc định
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(item)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(item.id)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Xóa địa chỉ"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TÀI KHOẢN NGÂN HÀNG */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Building2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Tài khoản ngân hàng dùng để <strong>nhận tiền thu hộ COD</strong> khi bạn gửi hàng, hoặc <strong>nhận hoàn cước</strong> trong các trường hợp bồi thường sự cố hàng hóa.
                </span>
              </div>

              {/* Saved Bank Account Card */}
              {bankAccount && !isEditingBank ? (
                <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-5 text-white shadow-xl border border-slate-700 overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
                  <div className="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 px-2.5 rounded-md bg-white/20 border border-white/30 flex items-center justify-center font-extrabold text-xs tracking-wider">
                        {bankAccount.bankCode}
                      </div>
                      <span className="font-bold text-sm tracking-wide text-blue-100">
                        {bankAccount.bankName}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Tài khoản chính
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-[10px] text-slate-400 block mb-1">Số tài khoản thanh toán</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xl sm:text-2xl font-mono font-bold tracking-widest text-emerald-300">
                        {bankAccount.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAccountNumber}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Sao chép số tài khoản"
                      >
                        {copiedAccount ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-2 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Chủ tài khoản</span>
                      <span className="font-bold tracking-wide uppercase text-white">
                        {bankAccount.accountHolder}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBankCode(bankAccount.bankCode);
                          setAccountNumber(bankAccount.accountNumber);
                          setAccountHolder(bankAccount.accountHolder);
                          setIsEditingBank(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteBank}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 text-[11px] font-semibold transition cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Gỡ</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Bank Form (Add or Edit) */
                <form onSubmit={handleSaveBank} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      {bankAccount ? 'Cập nhật tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng nhận tiền'}
                    </span>
                    {bankAccount && (
                      <button
                        type="button"
                        onClick={() => setIsEditingBank(false)}
                        className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Ngân hàng thụ hưởng <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedBankCode}
                      onChange={(e) => setSelectedBankCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          [{b.code}] {b.name} - {b.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Số tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 1903678912345"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Tên chủ tài khoản (in hoa không dấu) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: NGUYEN VAN A"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Tên chủ tài khoản phải trùng với thông tin trên thẻ ATM / ứng dụng ngân hàng.
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    {bankAccount && (
                      <button
                        type="button"
                        onClick={() => setIsEditingBank(false)}
                        className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{bankAccount ? 'Cập nhật ngân hàng' : 'Lưu tài khoản'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          {showConfirmLogout ? (
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold text-xs">Xác nhận đăng xuất?</span>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Đăng xuất ngay
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmLogout(false)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmLogout(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 font-bold text-xs transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
