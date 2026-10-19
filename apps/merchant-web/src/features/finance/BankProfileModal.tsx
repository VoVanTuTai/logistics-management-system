import React from 'react';
import type { MerchantBankProfile } from '../../types';

export interface BankProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  editBankForm: MerchantBankProfile;
  setEditBankForm: React.Dispatch<React.SetStateAction<MerchantBankProfile>>;
  onSaveBankProfile: (e: React.FormEvent) => void | Promise<void>;
}

export function BankProfileModal({
  isOpen,
  onClose,
  editBankForm,
  setEditBankForm,
  onSaveBankProfile,
}: BankProfileModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div
        className="ops-modal-card"
        style={{ maxWidth: '480px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--stitch-on-surface)',
            }}
          >
            Cập nhật tài khoản thụ hưởng COD
          </h3>
          <button type="button" className="ops-modal-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        </div>
        <form onSubmit={onSaveBankProfile} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label className="label">Ngân hàng thụ hưởng</label>
            <select
              className="input"
              value={editBankForm.bankName}
              onChange={(e) => setEditBankForm({ ...editBankForm, bankName: e.target.value })}
              required
            >
              <option value="Techcombank">Techcombank (TCB)</option>
              <option value="Vietcombank">Vietcombank (VCB)</option>
              <option value="MBBank">MBBank (Ngân hàng Quân Đội)</option>
              <option value="VPBank">VPBank</option>
              <option value="ACB">ACB (Á Châu)</option>
              <option value="BIDV">BIDV</option>
              <option value="VietinBank">VietinBank</option>
              <option value="TPBank">TPBank</option>
              <option value="Sacombank">Sacombank</option>
            </select>
          </div>

          <div>
            <label className="label">Số tài khoản ngân hàng</label>
            <input
              className="input"
              value={editBankForm.accountNumber}
              onChange={(e) => setEditBankForm({ ...editBankForm, accountNumber: e.target.value })}
              placeholder="Ví dụ: 19036788992011"
              required
            />
          </div>

          <div>
            <label className="label">Tên chủ tài khoản (In hoa không dấu)</label>
            <input
              className="input"
              value={editBankForm.accountHolder}
              onChange={(e) =>
                setEditBankForm({ ...editBankForm, accountHolder: e.target.value.toUpperCase() })
              }
              placeholder="Ví dụ: NGUYEN VAN A"
              required
            />
          </div>

          <div>
            <label className="label">Chi nhánh ngân hàng</label>
            <input
              className="input"
              value={editBankForm.branch}
              onChange={(e) => setEditBankForm({ ...editBankForm, branch: e.target.value })}
              placeholder="Ví dụ: Chi nhánh Ba Đình, Hà Nội"
              required
            />
          </div>

          <div>
            <label className="label">Chu kỳ nhận tiền COD</label>
            <select
              className="input"
              value={editBankForm.payoutSchedule}
              onChange={(e) =>
                setEditBankForm({
                  ...editBankForm,
                  payoutSchedule: e.target.value as 'MWF' | 'DAILY',
                })
              }
            >
              <option value="MWF">Thứ 2 - Thứ 4 - Thứ 6 hàng tuần (Mặc định)</option>
              <option value="DAILY">Hàng ngày T+1 (Dành cho đối tác VIP)</option>
            </select>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#64748b',
            }}
          >
            Lưu ý: Tên chủ tài khoản ngân hàng phải trùng khớp với người đại diện hợp đồng hoặc chủ
            doanh nghiệp để đảm bảo tính pháp lý khi giải ngân COD.
          </div>

          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              Lưu tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
