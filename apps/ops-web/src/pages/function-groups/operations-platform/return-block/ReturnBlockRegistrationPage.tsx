import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { useUiStore } from '../../../../store/uiStore';
import { ndrClient } from '../../../../features/ndr/ndr.client';
import { returnClient } from '../../../../features/returns/return.client';
import { useShipmentDetailQuery } from '../../../../features/shipments/shipments.hooks';
import './ReturnBlockRegistrationPage.css';

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

const returnTypeOptions = [
  'Không liên lạc được với khách hàng',
  'Shopee đồng kiểm - Từ chối do hư hỏng khi đồng kiểm',
  'Người gửi yêu cầu chuyển hoàn',
  'Khách hẹn lại ngày nhận',
  'Shopee đồng kiểm - Từ chối do sai sản phẩm',
  'Shopee đồng kiểm - Từ chối do người nhận đổi ý',
  'Khách từ chối nhận hàng, từ chối trả phí',
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
        <select value={field.value || ''} onChange={() => {}} aria-label={field.label}>
          <option value="">Vui lòng chọn</option>
          {field.options ? field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          )) : field.value ? (
            <option value={field.value}>{field.value}</option>
          ) : null}
        </select>
      ) : (
        <input
          type="text"
          value={field.value || ''}
          onChange={() => {}}
          placeholder={field.placeholder || ''}
          aria-label={field.label}
          readOnly
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

export function ReturnBlockRegistrationPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const showToast = useUiStore((state) => state.showToast);
  const accessToken = session?.tokens.accessToken ?? null;

  const [inputCode, setInputCode] = useState('');
  const [queryCode, setQueryCode] = useState('');

  const { data: shipment, isFetching } = useShipmentDetailQuery(accessToken, queryCode);

  const [isReasonMenuOpen, setIsReasonMenuOpen] = useState(false);
  const [selectedReturnReason, setSelectedReturnReason] = useState('');
  const [returnReasonText, setReturnReasonText] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const [originalSender, setOriginalSender] = useState<any>({});
  const [originalReceiver, setOriginalReceiver] = useState<any>({});

  useEffect(() => {
    if (shipment) {
      setOriginalSender({
        name: shipment.senderName,
        phone: shipment.senderPhone,
        address: shipment.senderAddress,
        province: shipment.senderProvince,
        district: shipment.senderDistrict,
        ward: shipment.senderWard,
      });
      setOriginalReceiver({
        name: shipment.receiverName,
        phone: shipment.receiverPhone,
        address: shipment.receiverAddress,
        province: shipment.receiverRegion,
      });

      // Populate issue note automatically
      const reason = shipment.note || 'Người gửi yêu cầu chuyển hoàn';
      setSelectedReturnReason(returnTypeOptions.includes(reason) ? reason : returnTypeOptions[2]);
      setReturnReasonText(reason);
    }
  }, [shipment]);

  const hasSelectedReturnReason = selectedReturnReason.length > 0;

  const handleSearch = () => {
    if (inputCode.trim()) {
      setQueryCode(inputCode.trim().toUpperCase());
    }
  };

  const handleReset = () => {
    setInputCode('');
    setQueryCode('');
    setOriginalSender({});
    setOriginalReceiver({});
    setSelectedReturnReason('');
    setReturnReasonText('');
  };

  const handleRegisterReturn = async () => {
    if (!queryCode || !shipment) {
      showToast('Vui lòng tìm kiếm mã vận đơn trước khi đăng ký chuyển hoàn.', 'error');
      return;
    }

    if (!accessToken) {
      showToast('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.', 'error');
      return;
    }

    const employeeName = session?.user.displayName || session?.user.username || 'N/A';
    const employeeId = session?.user.username || 'N/A';
    const hubCode = session?.user.hubCodes?.[0] || 'N/A';
    const finalNote = `Đăng ký chuyển hoàn | Nhân viên: ${employeeName} | Mã NV: ${employeeId} | Mã hub: ${hubCode} | Ghi chú: ${returnReasonText}`;

    setIsSubmittingReturn(true);
    try {
      const ndrCases = await ndrClient.list(accessToken);
      const matchedNdr = ndrCases.find((ndrCase) => ndrCase.shipmentCode === queryCode);

      if (!matchedNdr) {
        await returnClient.create(accessToken, {
          shipmentCode: queryCode,
          note: finalNote,
        });
        showToast(`Đã tạo return case độc lập cho vận đơn ${queryCode}.`, 'success');
        handleReset();
        return;
      }

      await ndrClient.returnDecision(accessToken, matchedNdr.id, {
        returnToSender: true,
        note: finalNote,
      });

      showToast(`Đã ghi nhận quyết định chuyển hoàn cho vận đơn ${queryCode}.`, 'success');
      handleReset();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Không ghi nhận được chuyển hoàn.',
        'error',
      );
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const buildAddressSections = (sender: any, receiver: any): AddressSection[] => [
    {
      type: 'sender',
      fields: [
        { label: 'Người gửi', value: sender.name },
        { label: 'Số điện thoại', value: sender.phone },
        { label: 'Điện thoại' },
        { label: 'Tỉnh thành lấy', type: 'select', value: sender.province },
        { label: 'Quận huyện lấy', type: 'select', value: sender.district },
        { label: 'Phường xã gửi', type: 'select', value: sender.ward },
        { label: 'Địa chỉ chi tiết', value: sender.address, wide: true },
      ],
    },
    {
      type: 'receiver',
      fields: [
        { label: 'Người nhận', value: receiver.name },
        { label: 'Số điện thoại', value: receiver.phone },
        { label: 'Điện thoại' },
        { label: 'Tỉnh thành giao', type: 'select', value: receiver.province },
        { label: 'Quận huyện giao', type: 'select', value: receiver.district },
        { label: 'Phường xã đến', type: 'select', value: receiver.ward },
        { label: 'Địa chỉ chi tiết', value: receiver.address, wide: true },
      ],
    },
  ];

  // For the original order, use the original sender and receiver.
  const originalAddressSections = buildAddressSections(originalSender, originalReceiver);
  
  // For the new order (return), swap sender and receiver.
  const newOrderAddressSections = buildAddressSections(originalReceiver, originalSender);

  return (
    <section className="ops-return-management">
      <ReturnPanel title="Thông tin đề xuất">
        <div className="ops-return-management__proposal">
          <label className="ops-return-management__field ops-return-management__field--required">
            <span>Mã vận đơn :</span>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Nhập mã vận đơn"
              aria-label="Mã vận đơn"
            />
          </label>
          <label className="ops-return-management__field ops-return-management__field--required">
            <span>Loại đơn :</span>
            <select defaultValue="return" aria-label="Loại đơn">
              <option value="return">Chuyển hoàn</option>
              <option value="partial-return">Chuyển hoàn 1 phần</option>
            </select>
          </label>
          <div className="ops-return-management__actions">
            <button
              type="button"
              className="ops-return-management__search-btn"
              onClick={handleSearch}
              disabled={isFetching}
            >
              <SearchIcon />
              {isFetching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
            <button type="button" className="ops-return-management__reset-btn" onClick={handleReset}>
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
            <div className="ops-return-management__reason-select">
              <button
                type="button"
                className="ops-return-management__reason-select-control"
                aria-expanded={isReasonMenuOpen}
                onClick={() => setIsReasonMenuOpen((current) => !current)}
              >
                <span>{selectedReturnReason || 'Vui lòng chọn'}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={isReasonMenuOpen ? 'm7 14 5-5 5 5' : 'm7 10 5 5 5-5'} />
                </svg>
              </button>
              {isReasonMenuOpen ? (
                <div className="ops-return-management__reason-select-menu">
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
        <button
          type="button"
          className="ops-return-management__save-more-btn"
          onClick={handleRegisterReturn}
          disabled={isSubmittingReturn}
        >
          <SearchIcon />
          {isSubmittingReturn ? 'Đang lưu...' : 'Lưu và thêm mới'}
        </button>
        <button type="button" className="ops-return-management__cancel-btn" onClick={handleReset}>
          <RefreshIcon />
          Hủy
        </button>
        <button
          type="button"
          className="ops-return-management__save-btn"
          onClick={handleRegisterReturn}
          disabled={isSubmittingReturn}
        >
          <SearchIcon />
          {isSubmittingReturn ? 'Đang lưu...' : 'Lưu'}
        </button>
      </footer>
    </section>
  );
}
