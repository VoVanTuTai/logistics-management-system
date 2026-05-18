import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import { usePickupScanMutation } from '../../../../features/scans/scans.api';
import { useCreateShipmentMutation } from '../../../../features/shipments/shipments.api';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { createIdempotencyKey } from '../../../../utils/idempotency';
import { PROVINCE_CITY_OPTIONS } from '../../../../utils/locationScope';
import { queryKeys } from '../../../../utils/queryKeys';
import './BranchBusinessOrderCreatePage.css';

type ServiceType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY';

interface BranchOrderFormState {
  manualCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverRegion: string;
  receiverAddress: string;
  itemType: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  serviceType: ServiceType;
  codAmount: string;
  deliveryNote: string;
  platform: string;
  pickupLocationCode: string;
}

const DEFAULT_FORM: BranchOrderFormState = {
  manualCode: '',
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  receiverName: '',
  receiverPhone: '',
  receiverRegion: '',
  receiverAddress: '',
  itemType: '',
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  declaredValue: '',
  serviceType: 'STANDARD',
  codAmount: '',
  deliveryNote: '',
  platform: 'OPS_BRANCH',
  pickupLocationCode: '',
};

function CollapseIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 14 5-5 5 5" />
    </svg>
  );
}

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function estimateFee(form: BranchOrderFormState): number {
  const serviceBase = {
    STANDARD: 18000,
    EXPRESS: 28000,
    SAME_DAY: 42000,
  }[form.serviceType];
  const weightKg = toPositiveNumber(form.weightKg);
  const length = toPositiveNumber(form.lengthCm);
  const width = toPositiveNumber(form.widthCm);
  const height = toPositiveNumber(form.heightCm);
  const declaredValue = toPositiveNumber(form.declaredValue);
  const codAmount = toPositiveNumber(form.codAmount);

  return Math.round(
    serviceBase +
      weightKg * 4500 +
      ((length * width * height) / 6000) * 3200 +
      declaredValue * 0.002 +
      Math.min(codAmount * 0.005, 35000),
  );
}

function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function buildMetadata(
  form: BranchOrderFormState,
  feeEstimate: number,
  operatorCode: string,
): Record<string, unknown> {
  return {
    sender: {
      name: form.senderName.trim() || null,
      phone: form.senderPhone.trim() || null,
      address: form.senderAddress.trim() || null,
    },
    receiver: {
      name: form.receiverName.trim() || null,
      phone: form.receiverPhone.trim() || null,
      address: form.receiverAddress.trim() || null,
      region: form.receiverRegion.trim() || null,
      province: form.receiverRegion.trim() || null,
    },
    package: {
      itemType: form.itemType.trim() || null,
      weightKg: toPositiveNumber(form.weightKg),
      dimensionsCm: {
        length: toPositiveNumber(form.lengthCm),
        width: toPositiveNumber(form.widthCm),
        height: toPositiveNumber(form.heightCm),
      },
      declaredValue: toPositiveNumber(form.declaredValue),
    },
    service: {
      type: form.serviceType,
    },
    codAmount: toPositiveNumber(form.codAmount),
    deliveryNote: form.deliveryNote.trim() || null,
    estimatedFee: feeEstimate,
    platform: form.platform.trim() || 'OPS_BRANCH',
    source: 'ops-web-branch-order-create',
    operatorCode,
  };
}

export function BranchBusinessOrderCreatePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const operatorCode = session?.user.username ?? 'OPS';
  const defaultHubCode = session?.user.hubCodes?.[0] ?? '';
  const createShipmentMutation = useCreateShipmentMutation(accessToken);
  const pickupScanMutation = usePickupScanMutation(accessToken);

  const [form, setForm] = useState<BranchOrderFormState>({
    ...DEFAULT_FORM,
    pickupLocationCode: defaultHubCode,
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const estimatedFee = useMemo(() => estimateFee(form), [form]);
  const isSubmitting = createShipmentMutation.isPending || pickupScanMutation.isPending;

  const updateForm = (key: keyof BranchOrderFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateForm = (createAndScanPickup: boolean): string | null => {
    if (!form.senderName.trim()) {
      return 'Cần nhập tên người gửi.';
    }

    if (!form.senderPhone.trim()) {
      return 'Cần nhập số điện thoại người gửi.';
    }

    if (!form.receiverName.trim()) {
      return 'Cần nhập tên người nhận.';
    }

    if (!form.receiverPhone.trim()) {
      return 'Cần nhập số điện thoại người nhận.';
    }

    if (!form.receiverRegion.trim() || !form.receiverAddress.trim()) {
      return 'Cần nhập tỉnh/thành và địa chỉ chi tiết người nhận.';
    }

    if (createAndScanPickup && !form.pickupLocationCode.trim()) {
      return 'Cần nhập mã bưu cục để tạo + quét pickup.';
    }

    return null;
  };

  const submitOrder = async (createAndScanPickup: boolean) => {
    if (!accessToken) {
      setActionError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    const validationError = validateForm(createAndScanPickup);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    setActionMessage(null);
    setActionError(null);

    try {
      const createdShipment = await createShipmentMutation.mutateAsync({
        code: form.manualCode.trim().toUpperCase() || null,
        metadata: buildMetadata(form, estimatedFee, operatorCode),
      });

      if (createAndScanPickup) {
        await pickupScanMutation.mutateAsync({
          shipmentCode: createdShipment.shipmentCode,
          locationCode: form.pickupLocationCode.trim().toUpperCase(),
          scanType: 'PICKUP',
          note: 'Tạo vận đơn và tiếp nhận tại bưu cục',
          idempotencyKey: createIdempotencyKey('branch-order-pickup'),
        });
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tracking });

      setActionMessage(
        createAndScanPickup
          ? `Đã tạo vận đơn ${createdShipment.shipmentCode} và ghi nhận pickup.`
          : `Đã tạo vận đơn ${createdShipment.shipmentCode}.`,
      );
      setForm((current) => ({
        ...DEFAULT_FORM,
        senderName: current.senderName,
        senderPhone: current.senderPhone,
        senderAddress: current.senderAddress,
        platform: current.platform,
        pickupLocationCode: current.pickupLocationCode,
      }));
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  return (
    <section className="ops-branch-order-create">
      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thông tin cơ bản
            <span aria-hidden="true">&#128274;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gọn thông tin cơ bản"
          >
            <CollapseIcon />
          </button>
        </header>

        <div className="ops-branch-order-create__form">
          <label className="ops-branch-order-create__field">
            <span>Loại vận đơn</span>
            <select value="bill-dien-tu" disabled>
              <option value="bill-dien-tu">Bill điện tử</option>
            </select>
          </label>
          <label className="ops-branch-order-create__field">
            <span>Mã vận đơn</span>
            <input
              type="text"
              placeholder="Tự sinh nếu bỏ trống"
              value={form.manualCode}
              onChange={(event) => updateForm('manualCode', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Nhân viên giao nhận</span>
            <input type="text" value={operatorCode} disabled />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Phân loại sản phẩm</span>
            <input
              type="text"
              placeholder="Hàng tiêu dùng, chứng từ..."
              value={form.itemType}
              onChange={(event) => updateForm('itemType', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Phương thức dịch vụ</span>
            <select
              value={form.serviceType}
              onChange={(event) => updateForm('serviceType', event.target.value)}
            >
              <option value="STANDARD">STANDARD</option>
              <option value="EXPRESS">EXPRESS</option>
              <option value="SAME_DAY">SAME_DAY</option>
            </select>
          </label>
          <label className="ops-branch-order-create__field">
            <span>Nền tảng</span>
            <input
              type="text"
              value={form.platform}
              onChange={(event) => updateForm('platform', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Mã bưu cục pickup</span>
            <input
              type="text"
              value={form.pickupLocationCode}
              onChange={(event) => updateForm('pickupLocationCode', event.target.value)}
              placeholder="Mã bưu cục"
            />
          </label>
          <div className="ops-branch-order-create__summary">
            <span>Cước phí dự kiến</span>
            <strong>{formatCurrency(estimatedFee)}</strong>
          </div>
        </div>
      </article>

      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thông tin người gửi
            <span aria-hidden="true">&#128274;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gọn thông tin người gửi"
          >
            <CollapseIcon />
          </button>
        </header>

        <div className="ops-branch-order-create__form ops-branch-order-create__form--sender">
          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Tên người gửi
            </span>
            <input
              type="text"
              value={form.senderName}
              onChange={(event) => updateForm('senderName', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Số điện thoại
            </span>
            <input
              type="text"
              value={form.senderPhone}
              onChange={(event) => updateForm('senderPhone', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>
              <i>*</i> Địa chỉ
            </span>
            <input
              type="text"
              value={form.senderAddress}
              onChange={(event) => updateForm('senderAddress', event.target.value)}
            />
          </label>
        </div>
      </article>

      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thông tin người nhận và hàng hóa
            <span aria-hidden="true">&#128274;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gọn thông tin người nhận"
          >
            <CollapseIcon />
          </button>
        </header>

        <div className="ops-branch-order-create__form">
          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Tên người nhận
            </span>
            <input
              type="text"
              value={form.receiverName}
              onChange={(event) => updateForm('receiverName', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Số điện thoại
            </span>
            <input
              type="text"
              value={form.receiverPhone}
              onChange={(event) => updateForm('receiverPhone', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Tỉnh nhận hàng
            </span>
            <select
              value={form.receiverRegion}
              onChange={(event) => updateForm('receiverRegion', event.target.value)}
            >
              <option value="">Vui lòng chọn</option>
              {PROVINCE_CITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>
              <i>*</i> Địa chỉ chi tiết
            </span>
            <input
              type="text"
              value={form.receiverAddress}
              onChange={(event) => updateForm('receiverAddress', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Khối lượng (kg)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.weightKg}
              onChange={(event) => updateForm('weightKg', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Dài (cm)</span>
            <input
              type="number"
              min="0"
              value={form.lengthCm}
              onChange={(event) => updateForm('lengthCm', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Rộng (cm)</span>
            <input
              type="number"
              min="0"
              value={form.widthCm}
              onChange={(event) => updateForm('widthCm', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Cao (cm)</span>
            <input
              type="number"
              min="0"
              value={form.heightCm}
              onChange={(event) => updateForm('heightCm', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Giá trị khai báo</span>
            <input
              type="number"
              min="0"
              value={form.declaredValue}
              onChange={(event) => updateForm('declaredValue', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>COD</span>
            <input
              type="number"
              min="0"
              value={form.codAmount}
              onChange={(event) => updateForm('codAmount', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>Ghi chú giao hàng</span>
            <textarea
              rows={3}
              value={form.deliveryNote}
              onChange={(event) => updateForm('deliveryNote', event.target.value)}
            />
          </label>
        </div>
      </article>

      <article className="ops-branch-order-create__actions">
        <div>
          {actionMessage ? <p className="ops-branch-order-create__notice">{actionMessage}</p> : null}
          {actionError ? (
            <p className="ops-branch-order-create__notice ops-branch-order-create__notice--error">
              {actionError}
            </p>
          ) : null}
        </div>
        <button type="button" disabled={isSubmitting} onClick={() => void submitOrder(false)}>
          {isSubmitting ? 'Đang gửi...' : 'Tạo vận đơn'}
        </button>
        <button type="button" disabled={isSubmitting} onClick={() => void submitOrder(true)}>
          {isSubmitting ? 'Đang gửi...' : 'Tạo + quét pickup'}
        </button>
      </article>
    </section>
  );
}
