import React, { useState } from 'react';

import './ReturnBlockManagementPage.css';

interface ReturnField {
  label: string;
  placeholder?: string;
  value?: string;
  options?: string[];
  type?: 'input' | 'select';
  wide?: boolean;
  hint?: string;
}

interface AddressSection {
  type: 'sender' | 'receiver';
  fields: ReturnField[];
}

const returnTabs = [
  'Trang chủ',
  'Tra cứu thông tin chuyển hoàn',
  'Tra cứu chuyển hoàn 1 phần',
  'Quản lý chuyển hoàn',
  'Tra cứu hành trình CPN',
  'Quản lý chuyển tiếp',
  'Đăng ký chuyển tiếp',
  'Thêm mới đề xuất - Đề xuất chuyển hoàn chuyển tiếp',
];

const returnTypeOptions = [
  'Không liên lạc được với khách hàng',
  'Shopee đồng kiểm - Từ chối do hư hỏng khi đồng kiểm',
  'Người gửi yêu cầu chuyển hoàn',
  'Khách hẹn lại ngày nhận',
  'Shopee đồng kiểm - Từ chối do sai sản phẩm',
  'Shopee đồng kiểm - Từ chối do người nhận đổi ý',
  'Khách từ chối nhận hàng, từ chối trả phí',
];

const originalAddressSections: AddressSection[] = [
  {
    type: 'sender',
    fields: [
      { label: 'Người gửi' },
      { label: 'Số điện thoại' },
      { label: 'Điện thoại' },
      { label: 'Tỉnh thành lấy', type: 'select' },
      { label: 'Quận huyện lấy', type: 'select' },
      { label: 'Phường xã gửi', type: 'select' },
      { label: 'Địa chỉ chi tiết', wide: true },
    ],
  },
  {
    type: 'receiver',
    fields: [
      { label: 'Người nhận' },
      { label: 'Số điện thoại' },
      { label: 'Điện thoại' },
      { label: 'Tỉnh thành giao', type: 'select' },
      { label: 'Quận huyện giao', type: 'select' },
      { label: 'Phường xã đến', type: 'select' },
      { label: 'Địa chỉ chi tiết', wide: true },
    ],
  },
];

const newOrderAddressSections: AddressSection[] = [
  {
    type: 'sender',
    fields: [
      { label: 'Người gửi', value: 'Trần Đăng Khôi' },
      { label: 'Số điện thoại', value: '0398472041', hint: 'Nhập số điện thoại di động' },
      { label: 'Điện thoại', hint: 'Nhập số điện thoại di động' },
      { label: 'Tỉnh thành lấy', type: 'select', value: 'Nghệ An', options: ['Nghệ An'] },
      {
        label: 'Quận huyện lấy',
        type: 'select',
        value: 'Thành phố Vinh',
        options: ['Thành phố Vinh'],
      },
      {
        label: 'Phường xã gửi',
        type: 'select',
        value: 'Phường Trường Thi-238TP',
        options: ['Phường Trường Thi-238TP'],
      },
      {
        label: 'Địa chỉ chi tiết',
        value: 'nhà 9 ngõ 3 đường Vương Thúc Mậu, Vinh, Nghệ An',
        wide: true,
      },
    ],
  },
  {
    type: 'receiver',
    fields: [
      { label: 'Người nhận' },
      { label: 'Số điện thoại', value: '******2507', hint: 'Nhập số điện thoại di động' },
      { label: 'Điện thoại', value: '******2507', hint: 'Nhập số điện thoại di động' },
      { label: 'Tỉnh thành giao', type: 'select', value: 'Hà Nội', options: ['Hà Nội'] },
      {
        label: 'Quận huyện giao',
        type: 'select',
        value: 'Quận Nam Từ Liêm',
        options: ['Quận Nam Từ Liêm'],
      },
      { label: 'Phường xã đến', type: 'select' },
      { label: 'Địa chỉ chi tiết', value: 'khu Đô Thị Geleximco', wide: true },
    ],
  },
];

function SearchIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function RefreshIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 8a7 7 0 1 0 1 5" />
      <path d="M19 4v4h-4" />
    </svg>
  );
}

function ReturnFieldControl({ field }: { field: ReturnField }): React.JSX.Element {
  return (
    <label
      className={
        field.wide
          ? 'ops-return-management__field ops-return-management__field--wide'
          : 'ops-return-management__field'
      }
    >
      <span>
        {field.label} :{field.hint ? <em>{field.hint}</em> : null}
      </span>
      {field.type === 'select' ? (
        <select defaultValue={field.value ?? ''} aria-label={field.label}>
          <option value="">Vui lòng chọn</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          defaultValue={field.value ?? ''}
          placeholder={field.placeholder ?? ''}
          aria-label={field.label}
        />
      )}
    </label>
  );
}

function ReturnAddressBlock({ section }: { section: AddressSection }): React.JSX.Element {
  const isSender = section.type === 'sender';

  return (
    <div className="ops-return-management__address-row">
      <div
        className={
          isSender
            ? 'ops-return-management__address-badge ops-return-management__address-badge--sender'
            : 'ops-return-management__address-badge ops-return-management__address-badge--receiver'
        }
      >
        {isSender ? 'Gửi' : 'Nhận'}
      </div>
      <div className="ops-return-management__address-grid">
        {section.fields.map((field) => (
          <ReturnFieldControl key={`${section.type}-${field.label}`} field={field} />
        ))}
      </div>
    </div>
  );
}

function ReturnPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="ops-return-management__panel">
      <header className="ops-return-management__panel-header">
        <h3>{title}</h3>
        <span aria-hidden="true">⌃</span>
      </header>
      <div className="ops-return-management__panel-body">{children}</div>
    </section>
  );
}

export function ReturnBlockManagementPage(): React.JSX.Element {
  const [isReasonMenuOpen, setIsReasonMenuOpen] = useState(true);
  const [selectedReturnReason, setSelectedReturnReason] = useState('');
  const [returnReasonText, setReturnReasonText] = useState('');

  const hasSelectedReturnReason = selectedReturnReason.length > 0;

  return (
    <section className="ops-return-management">
      <nav className="ops-return-management__tabs" aria-label="Chức năng chuyển hoàn">
        {returnTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={
              tab === 'Quản lý chuyển hoàn'
                ? 'ops-return-management__tab ops-return-management__tab--active'
                : 'ops-return-management__tab'
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      <ReturnPanel title="Thông tin đề xuất">
        <div className="ops-return-management__proposal">
          <label className="ops-return-management__field ops-return-management__field--required">
            <span>Mã đơn :</span>
            <input type="text" defaultValue="842502785302" aria-label="Mã đơn" />
          </label>
          <label className="ops-return-management__field ops-return-management__field--required">
            <span>Loại đơn :</span>
            <select defaultValue="return" aria-label="Loại đơn">
              <option value="return">Chuyển hoàn</option>
              <option value="partial-return">Chuyển hoàn 1 phần</option>
              <option value="forward">Chuyển tiếp</option>
            </select>
          </label>
          <div className="ops-return-management__actions">
            <button type="button" className="ops-return-management__search-btn">
              <SearchIcon />
              Tìm kiếm
            </button>
            <button type="button" className="ops-return-management__reset-btn">
              <RefreshIcon />
              Làm mới
            </button>
          </div>
        </div>
      </ReturnPanel>

      <ReturnPanel title="Thông tin người gửi - nhận hóa đơn gốc">
        <div className="ops-return-management__address-list">
          {originalAddressSections.map((section) => (
            <ReturnAddressBlock key={`original-${section.type}`} section={section} />
          ))}
        </div>
      </ReturnPanel>

      <ReturnPanel title="Thông tin người gửi/người nhận đơn hàng mới">
        <div className="ops-return-management__address-list">
          {newOrderAddressSections.map((section) => (
            <ReturnAddressBlock key={`new-${section.type}`} section={section} />
          ))}
        </div>
      </ReturnPanel>

      <ReturnPanel title="Nội dung yêu cầu chuyển hoàn">
        <div className="ops-return-management__request">
          <label
            className={
              hasSelectedReturnReason
                ? 'ops-return-management__field ops-return-management__field--required'
                : 'ops-return-management__field ops-return-management__field--required ops-return-management__field--invalid'
            }
          >
            <span>Loại chuyển hoàn :</span>
            <div className="ops-return-management__mock-select">
              <button
                type="button"
                className="ops-return-management__mock-select-control"
                aria-expanded={isReasonMenuOpen}
                onClick={() => setIsReasonMenuOpen((current) => !current)}
              >
                <span>{selectedReturnReason || 'Vui lòng chọn'}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={isReasonMenuOpen ? 'm7 14 5-5 5 5' : 'm7 10 5 5 5-5'} />
                </svg>
              </button>
              {isReasonMenuOpen ? (
                <div className="ops-return-management__mock-select-menu">
                  {returnTypeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSelectedReturnReason(option);
                        setReturnReasonText(option);
                        setIsReasonMenuOpen(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {hasSelectedReturnReason ? null : <small>Vui lòng bổ sung</small>}
          </label>

          <label className="ops-return-management__field ops-return-management__reason">
            <span>Nguyên nhân yêu cầu chuyển hoàn :</span>
            <textarea
              aria-label="Nguyên nhân yêu cầu chuyển hoàn"
              value={returnReasonText}
              onChange={(event) => setReturnReasonText(event.target.value)}
            />
          </label>
        </div>
      </ReturnPanel>

      <footer className="ops-return-management__footer-actions">
        <button type="button" className="ops-return-management__save-more-btn">
          <SearchIcon />
          Lưu và thêm mới
        </button>
        <button type="button" className="ops-return-management__cancel-btn">
          <RefreshIcon />
          Hủy
        </button>
        <button type="button" className="ops-return-management__save-btn">
          <SearchIcon />
          Lưu
        </button>
      </footer>
    </section>
  );
}
