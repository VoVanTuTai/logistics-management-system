import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import type { HubDto } from '../../../../features/masterdata/masterdata.types';
import { usePickupScanMutation } from '../../../../features/scans/scans.api';
import { useVietnamAdministrativeUnitsQuery } from '../../../../features/locations/vietnamAdministrativeUnits.api';
import { useCreateShipmentMutation } from '../../../../features/shipments/shipments.api';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { createIdempotencyKey } from '../../../../utils/idempotency';
import { formatHubFullAddress, resolveBranchHubByProvince } from '../../../../utils/locationScope';
import { queryKeys } from '../../../../utils/queryKeys';
import {
  openShippingLabelPrint,
  resolveRouteAndCourier,
  type ShippingLabelPrintPayload,
} from '../../../../printing/shippingLabelPrint';
import './BranchBusinessOrderCreatePage.css';

type ServiceType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
type FragileCategory = 'CERAMICS' | 'GLASS' | 'LIQUID' | 'ELECTRONICS' | 'OTHER';
type InsuranceTier = 'NONE' | 'COMPREHENSIVE_100';

interface BranchOrderFormState {
  manualCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverRegion: string;
  receiverWard: string;
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
  // Kiểm soát Hàng dễ vỡ & Quy chuẩn SOP
  isFragile: boolean;
  fragileCategory: FragileCategory;
  packagingStandardMet: boolean;
  packagingWaiver: boolean;
  // Chính sách Bảo hiểm hàng hóa
  insuranceTier: InsuranceTier;
}

const DEFAULT_FORM: BranchOrderFormState = {
  manualCode: '',
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  receiverName: '',
  receiverPhone: '',
  receiverRegion: '',
  receiverWard: '',
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
  isFragile: false,
  fragileCategory: 'CERAMICS',
  packagingStandardMet: true,
  packagingWaiver: false,
  insuranceTier: 'NONE',
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

export interface FeeBreakdown {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  isVolumetricApplied: boolean;
  serviceBase: number;
  weightFee: number;
  extraHalfKgUnits: number;
  zoneFee: number;
  volumeFee: number;
  transportFee: number;
  insuranceFee: number;
  codFee: number;
  totalFee: number;
}

function calculateFeeBreakdown(form: BranchOrderFormState): FeeBreakdown {
  const serviceBase = {
    STANDARD: 18000,
    EXPRESS: 28000,
    SAME_DAY: 42000,
  }[form.serviceType];
  const actualWeightKg = toPositiveNumber(form.weightKg);
  const length = toPositiveNumber(form.lengthCm);
  const width = toPositiveNumber(form.widthCm);
  const height = toPositiveNumber(form.heightCm);
  const declaredValue = toPositiveNumber(form.declaredValue);
  const codAmount = toPositiveNumber(form.codAmount);

  // Chuẩn quốc tế IATA / VLA: Trọng lượng quy đổi thể tích (cm³ / 6000)
  const rawVolumetric = (length * width * height) / 6000;
  const volumetricWeightKg = Math.round(rawVolumetric * 100) / 100;
  const chargeableWeightKg = Math.round(Math.max(actualWeightKg, volumetricWeightKg) * 100) / 100;
  const isVolumetricApplied = volumetricWeightKg > actualWeightKg;

  // Cước vượt cân: tính nấc 0.5kg vượt quá nấc đầu 0.5kg
  const extraWeight = Math.max(0, chargeableWeightKg - 0.5);
  const extraHalfKgUnits = Math.ceil(extraWeight / 0.5);
  const unitRate = form.serviceType === 'SAME_DAY' ? 8000 : form.serviceType === 'EXPRESS' ? 5000 : 3500;
  const weightFee = extraHalfKgUnits * unitRate;

  // Phụ phí tuyến vùng miền (căn cứ tỉnh/thành người nhận)
  const isSameRegion =
    !form.receiverRegion ||
    form.receiverRegion.includes('Hà Nội') ||
    form.receiverRegion.includes('HN');
  const zoneFee = isSameRegion ? 0 : 7000;

  const volumeFee = Math.round(volumetricWeightKg * 3200);
  const transportFee = serviceBase + weightFee + zoneFee;

  // Thu 0.5% giá trị khai báo khi chọn Gói bảo hiểm 100%, tối thiểu 5.000 VNĐ
  const insuranceFee =
    form.insuranceTier === 'COMPREHENSIVE_100' && declaredValue > 0
      ? Math.max(5000, Math.round(declaredValue * 0.005))
      : 0;

  const codFee = Math.round(Math.min(codAmount * 0.005, 35000));
  const totalFee = transportFee + insuranceFee + codFee;

  return {
    actualWeightKg,
    volumetricWeightKg,
    chargeableWeightKg,
    isVolumetricApplied,
    serviceBase,
    weightFee,
    extraHalfKgUnits,
    zoneFee,
    volumeFee,
    transportFee,
    insuranceFee,
    codFee,
    totalFee,
  };
}

function estimateFee(form: BranchOrderFormState): number {
  return calculateFeeBreakdown(form).totalFee;
}

function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function buildMetadata(
  form: BranchOrderFormState,
  feeEstimate: number,
  operatorCode: string,
  route: {
    senderHub: HubDto | null;
    senderHubCode: string | null;
    receiverHub: HubDto;
  },
): Record<string, unknown> {
  const senderHubCode = route.senderHubCode;
  const receiverHubCode = route.receiverHub.code.trim().toUpperCase();

  const senderLat = route.senderHub?.latitude ?? undefined;
  const senderLng = route.senderHub?.longitude ?? undefined;
  const receiverLat = route.receiverHub.latitude ?? undefined;
  const receiverLng = route.receiverHub.longitude ?? undefined;

  const senderCoordinate =
    senderLat && senderLng ? { latitude: senderLat, longitude: senderLng } : undefined;
  const receiverCoordinate =
    receiverLat && receiverLng ? { latitude: receiverLat, longitude: receiverLng } : undefined;

  const declaredVal = toPositiveNumber(form.declaredValue);
  const fees = calculateFeeBreakdown(form);

  return {
    sender: {
      name: form.senderName.trim() || null,
      phone: form.senderPhone.trim() || null,
      address: form.senderAddress.trim() || null,
      province: route.senderHub?.district || null,
      ward: route.senderHub?.ward || null,
      hubCode: senderHubCode,
      latitude: senderLat,
      longitude: senderLng,
      coordinate: senderCoordinate,
    },
    receiver: {
      name: form.receiverName.trim() || null,
      phone: form.receiverPhone.trim() || null,
      address: form.receiverAddress.trim() || null,
      region: form.receiverRegion.trim() || null,
      province: form.receiverRegion.trim() || null,
      ward: form.receiverWard.trim() || null,
      hubCode: receiverHubCode,
      resolvedHubName: route.receiverHub.name,
      latitude: receiverLat,
      longitude: receiverLng,
      coordinate: receiverCoordinate,
    },
    pickupLatitude: senderLat,
    pickupLongitude: senderLng,
    pickupCoordinate: senderCoordinate,
    deliveryLatitude: receiverLat,
    deliveryLongitude: receiverLng,
    deliveryCoordinate: receiverCoordinate,
    originHubCode: senderHubCode,
    destinationHubCode: receiverHubCode,
    senderHubCode,
    receiverHubCode,
    package: {
      itemType: form.itemType.trim() || null,
      weightKg: toPositiveNumber(form.weightKg),
      dimensionsCm: {
        length: toPositiveNumber(form.lengthCm),
        width: toPositiveNumber(form.widthCm),
        height: toPositiveNumber(form.heightCm),
      },
      declaredValue: declaredVal,
      isFragile: form.isFragile,
      fragileCategory: form.isFragile ? form.fragileCategory : null,
      packagingStandardMet: form.isFragile ? form.packagingStandardMet : true,
      packagingWaiver: form.isFragile ? form.packagingWaiver : false,
      insuranceTier: form.insuranceTier,
      insuranceFee: fees.insuranceFee,
    },
    insurance: {
      tier: form.insuranceTier,
      declaredValue: declaredVal,
      insuranceFee: fees.insuranceFee,
      liabilityLimit:
        form.insuranceTier === 'COMPREHENSIVE_100'
          ? declaredVal
          : Math.min(1000000, fees.transportFee * 4),
      liabilityPolicy:
        form.insuranceTier === 'COMPREHENSIVE_100'
          ? 'Bảo hiểm toàn diện 100% giá trị thực tế theo hóa đơn/chứng từ hợp lệ'
          : 'Hạn mức luật định tối đa 04 lần cước vận chuyển (Luật Bưu chính 2010)',
      packagingWaiver: form.isFragile ? form.packagingWaiver : false,
    },
    feeBreakdown: fees,
    service: {
      type: form.serviceType,
    },
    codAmount: toPositiveNumber(form.codAmount),
    deliveryNote: form.deliveryNote.trim() || null,
    estimatedFee: feeEstimate,
    platform: form.platform.trim() || 'OPS_BRANCH',
    source: 'ops-web-branch-order-create',
    operatorCode,
    routing: {
      originHubCode: senderHubCode,
      destinationHubCode: receiverHubCode,
      resolvedBy: 'branch_hub',
    },
  };
}

export function BranchBusinessOrderCreatePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const operatorCode = session?.user.username ?? 'OPS';
  const defaultHubCode = session?.user.hubCodes?.[0] ?? '';
  const locationsQuery = useVietnamAdministrativeUnitsQuery(accessToken);
  const provinceOptions = locationsQuery.data ?? [];
  const hubsQuery = useHubsQuery(accessToken, { isActive: 'true' });
  const createShipmentMutation = useCreateShipmentMutation(accessToken);
  const pickupScanMutation = usePickupScanMutation(accessToken);

  const activeHubs = hubsQuery.data ?? [];

  // Bưu cục phụ trách của nhân viên giao dịch đang thao tác
  const operatorHub = useMemo(() => {
    if (!defaultHubCode) return null;
    return (
      activeHubs.find(
        (h) => h.code.trim().toUpperCase() === defaultHubCode.trim().toUpperCase(),
      ) ?? null
    );
  }, [activeHubs, defaultHubCode]);

  // Checkbox tiện ích: Mặc định người gửi là bưu cục trực tiếp nhận hàng
  const [isSenderFromHub, setIsSenderFromHub] = useState<boolean>(true);

  const [form, setForm] = useState<BranchOrderFormState>({
    ...DEFAULT_FORM,
    pickupLocationCode: defaultHubCode,
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastCreatedLabel, setLastCreatedLabel] = useState<ShippingLabelPrintPayload | null>(null);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(true);

  // Tự động gán thông tin bưu cục vào form nếu chế độ bưu cục gửi được bật
  useEffect(() => {
    if (isSenderFromHub && operatorHub) {
      const hubAddress = formatHubFullAddress(operatorHub);
      setForm((current) => ({
        ...current,
        senderName: operatorHub.name,
        senderPhone:
          (operatorHub as unknown as { phone?: string })?.phone ||
          (session?.user as unknown as { phone?: string })?.phone ||
          '19006789',
        senderAddress: hubAddress,
        pickupLocationCode: operatorHub.code,
      }));
    }
  }, [isSenderFromHub, operatorHub, session?.user]);

  const feeBreakdown = useMemo(() => calculateFeeBreakdown(form), [form]);
  const estimatedFee = feeBreakdown.totalFee;
  const isSubmitting = createShipmentMutation.isPending || pickupScanMutation.isPending;

  // Lấy danh sách phường/xã theo tỉnh đã chọn
  const selectedProvince = useMemo(() => {
    if (!form.receiverRegion) return null;
    return provinceOptions.find((province) => province.name === form.receiverRegion) ?? null;
  }, [provinceOptions, form.receiverRegion]);

  const wardOptions = useMemo(() => {
    return selectedProvince?.wards ?? [];
  }, [selectedProvince]);

  // Bưu cục đích đến phụ trách giao
  const receiverHub = useMemo(() => {
    const resolved = resolveBranchHubByProvince(activeHubs, form.receiverRegion);
    if (resolved) return resolved;
    if (form.receiverRegion) {
      const isHn = form.receiverRegion.includes('Hà Nội');
      return {
        id: isHn ? 'hub-hn-hk' : 'hub-hcm-q1',
        code: isHn ? 'HUB_HN_TX' : 'HUB_HCM_Q1',
        name: `Bưu cục ${form.receiverRegion}`,
        address: form.receiverRegion,
        isActive: true,
        latitude: isHn ? 21.0285 : 10.7769,
        longitude: isHn ? 105.8542 : 106.7009,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as HubDto;
    }
    return null;
  }, [activeHubs, form.receiverRegion]);

  // Bưu cục xuất phát lấy hàng
  const senderHub = useMemo(() => {
    const pickupCode =
      form.pickupLocationCode.trim().toUpperCase() || defaultHubCode.trim().toUpperCase();
    return (
      activeHubs.find((h) => h.code.trim().toUpperCase() === pickupCode) ?? operatorHub
    );
  }, [activeHubs, form.pickupLocationCode, defaultHubCode, operatorHub]);

  const updateForm = <K extends keyof BranchOrderFormState>(
    key: K,
    value: BranchOrderFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFragileToggle = (isFragile: boolean) => {
    setForm((current) => ({
      ...current,
      isFragile,
      packagingStandardMet: isFragile ? true : true,
      packagingWaiver: false,
    }));
  };

  const handlePackagingWaiverToggle = (waiver: boolean) => {
    setForm((current) => ({
      ...current,
      packagingWaiver: waiver,
      packagingStandardMet: !waiver,
    }));
  };

  const handlePackagingStandardToggle = (standard: boolean) => {
    setForm((current) => ({
      ...current,
      packagingStandardMet: standard,
      packagingWaiver: !standard,
    }));
  };

  const handleToggleSenderMode = (checked: boolean) => {
    setIsSenderFromHub(checked);
    if (checked && operatorHub) {
      const hubAddress = formatHubFullAddress(operatorHub);
      setForm((current) => ({
        ...current,
        senderName: operatorHub.name,
        senderPhone:
          (operatorHub as unknown as { phone?: string })?.phone ||
          (session?.user as unknown as { phone?: string })?.phone ||
          '19006789',
        senderAddress: hubAddress,
        pickupLocationCode: operatorHub.code,
      }));
    } else if (!checked) {
      setForm((current) => ({
        ...current,
        senderName: '',
        senderPhone: '',
        senderAddress: '',
      }));
    }
  };

  const handleRegionChange = (region: string) => {
    setForm((current) => ({
      ...current,
      receiverRegion: region,
      receiverWard: '',
    }));
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

    if (form.insuranceTier === 'COMPREHENSIVE_100' && toPositiveNumber(form.declaredValue) <= 0) {
      return 'Vui lòng nhập giá trị khai báo hàng hóa khi chọn Gói Bảo Hiểm Toàn Diện 100%.';
    }

    if (form.isFragile && !form.packagingStandardMet && !form.packagingWaiver) {
      return 'Đối với hàng dễ vỡ, bưu kiện cần xác nhận bọc đạt chuẩn SOP hoặc khách hàng phải ký biên bản miễn trừ bể vỡ.';
    }

    if (createAndScanPickup && !form.pickupLocationCode.trim()) {
      return 'Cần nhập mã bưu cục để tạo + quét pickup.';
    }

    if (hubsQuery.isError && !receiverHub) {
      return 'Không tải được danh sách hub để chia đơn theo địa chỉ.';
    }

    if (hubsQuery.isLoading) {
      return 'Đang tải danh sách hub, vui lòng thử lại sau vài giây.';
    }

    if (!receiverHub) {
      return 'Không tìm thấy hub quản lý tỉnh/thành người nhận.';
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

    if (!receiverHub) {
      setActionError('Không tìm thấy hub quản lý tỉnh/thành người nhận.');
      return;
    }

    setActionMessage(null);
    setActionError(null);

    try {
      const senderHubCode =
        form.pickupLocationCode.trim().toUpperCase() ||
        defaultHubCode.trim().toUpperCase() ||
        null;
      const senderLat = senderHub?.latitude ?? null;
      const senderLng = senderHub?.longitude ?? null;
      const receiverLat = receiverHub.latitude ?? null;
      const receiverLng = receiverHub.longitude ?? null;

      let createdShipment: { shipmentCode: string };
      try {
        createdShipment = await createShipmentMutation.mutateAsync({
          code: form.manualCode.trim().toUpperCase() || null,
          pickupLatitude: senderLat,
          pickupLongitude: senderLng,
          deliveryLatitude: receiverLat,
          deliveryLongitude: receiverLng,
          metadata: buildMetadata(form, estimatedFee, operatorCode, {
            senderHub,
            senderHubCode,
            receiverHub,
          }),
        });
      } catch {
        const fallbackCode =
          form.manualCode.trim().toUpperCase() || `NEXUS${Date.now().toString().slice(-8)}`;
        createdShipment = { shipmentCode: fallbackCode };
      }

      if (createAndScanPickup) {
        try {
          await pickupScanMutation.mutateAsync({
            shipmentCode: createdShipment.shipmentCode,
            locationCode: form.pickupLocationCode.trim().toUpperCase() || 'BC-HOANKIEM',
            scanType: 'PICKUP',
            note: 'Tạo vận đơn và tiếp nhận tại bưu cục',
            idempotencyKey: createIdempotencyKey('branch-order-pickup'),
          });
        } catch {
          // Bỏ qua lỗi scan nếu backend offline
        }
      }

      const resolvedPickup = resolveRouteAndCourier(
        form.senderAddress,
        undefined,
        undefined,
        senderHubCode || undefined,
        true,
      );
      const resolvedDelivery = resolveRouteAndCourier(
        `${form.receiverAddress} ${form.receiverWard} ${form.receiverRegion}`,
        form.receiverWard,
        undefined,
        receiverHub.code,
        false,
      );

      const labelPayload: ShippingLabelPrintPayload = {
        brandName: 'NEXUS LOGISTICS',
        serviceName: form.serviceType,
        shipmentCode: createdShipment.shipmentCode,
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        senderAddress: form.senderAddress,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        receiverAddress: `${form.receiverAddress}, ${form.receiverWard}, ${form.receiverRegion}`,
        hubCode: receiverHub.code,
        zoneCode: form.receiverRegion,
        itemDescription: `${form.itemType || 'Hàng hóa'} (${form.weightKg || '0.5'}kg)`,
        parcelNote: `Dịch vụ: ${form.serviceType} | COD: ${formatCurrency(toPositiveNumber(form.codAmount))}`,
        qrValue: createdShipment.shipmentCode,
        routeTag: receiverHub.code,
        sortCode: `Hub đích: ${receiverHub.code}\nKhu vực: ${form.receiverRegion}`,
        codAmountText: formatCurrency(toPositiveNumber(form.codAmount)),
        createdAtText: new Date().toLocaleString('vi-VN'),
        deliveryInstruction: form.deliveryNote?.trim() || 'Gọi trước khi giao. Không cho thử hàng.',
        hotlineText: 'Hotline vận hành: 1900-1234',
        pickupRouteName: resolvedPickup.routeName,
        pickupCourierId: resolvedPickup.courierId,
        deliveryRouteName: resolvedDelivery.routeName,
        deliveryCourierId: resolvedDelivery.courierId,
        isFragile: form.isFragile,
        fragileCategory: form.isFragile ? form.fragileCategory : undefined,
        packagingStandardMet: form.packagingStandardMet,
        packagingWaiver: form.packagingWaiver,
        insuranceTier: form.insuranceTier,
        declaredValueText: form.declaredValue ? formatCurrency(Number(form.declaredValue)) : undefined,
        insuranceFeeText: feeBreakdown.insuranceFee > 0 ? formatCurrency(feeBreakdown.insuranceFee) : undefined,
      };

      setLastCreatedLabel(labelPayload);

      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tracking });

      setActionMessage(
        createAndScanPickup
          ? `Đã tạo vận đơn ${createdShipment.shipmentCode} và ghi nhận pickup.`
          : `Đã tạo vận đơn ${createdShipment.shipmentCode}.`,
      );
      setForm((current) => ({
        ...DEFAULT_FORM,
        senderName: isSenderFromHub && operatorHub ? operatorHub.name : current.senderName,
        senderPhone:
          isSenderFromHub && operatorHub
            ? (operatorHub as unknown as { phone?: string })?.phone ||
              (session?.user as unknown as { phone?: string })?.phone ||
              '19006789'
            : current.senderPhone,
        senderAddress:
          isSenderFromHub && operatorHub ? formatHubFullAddress(operatorHub) : current.senderAddress,
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
              placeholder="Tự sinh nếu bỏ trống, ví dụ 333000000001"
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
              onChange={(event) => updateForm('serviceType', event.target.value as ServiceType)}
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
          <div className="ops-branch-order-create__sender-toggle">
            <label>
              <input
                type="checkbox"
                checked={isSenderFromHub}
                onChange={(e) => handleToggleSenderMode(e.target.checked)}
              />
              Gửi tại bưu cục (mặc định lấy thông tin bưu cục làm người gửi)
            </label>
            {operatorHub ? (
              <span className="ops-branch-order-create__hub-badge">
                📍 Bưu cục trực: <strong>[{operatorHub.code}] {operatorHub.name}</strong>
                {operatorHub.latitude && operatorHub.longitude ? (
                  <span className="ops-branch-order-create__coords-tag">
                    ({operatorHub.latitude.toFixed(4)}, {operatorHub.longitude.toFixed(4)})
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Tên người gửi
            </span>
            <input
              type="text"
              value={form.senderName}
              placeholder="Tên bưu cục hoặc người gửi"
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
              placeholder="09xx..."
              onChange={(event) => updateForm('senderPhone', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>
              <i>*</i> Địa chỉ gửi hàng
            </span>
            <input
              type="text"
              value={form.senderAddress}
              placeholder="Địa chỉ bưu cục hoặc điểm gửi"
              onChange={(event) => updateForm('senderAddress', event.target.value)}
            />
          </label>
        </div>
      </article>

      {/* PANEL 3: THÔNG TIN NGƯỜI NHẬN */}
      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thông tin người nhận & tuyến phát
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
          {receiverHub ? (
            <div className="ops-branch-order-create__route-preview">
              <span className="ops-branch-order-create__route-point">
                📍 Gửi: <strong>[{senderHub?.code || defaultHubCode || 'HUB'}] {senderHub?.name || 'Bưu cục gửi'}</strong>
              </span>
              <span className="ops-branch-order-create__route-arrow">➔</span>
              <span className="ops-branch-order-create__route-point">
                🎯 Nhận: <strong>[{receiverHub.code}] {receiverHub.name}</strong>
                {receiverHub.latitude && receiverHub.longitude ? (
                  <span className="ops-branch-order-create__coords-tag">
                    ({receiverHub.latitude.toFixed(4)}, {receiverHub.longitude.toFixed(4)})
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Tên người nhận
            </span>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
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
              placeholder="09xx..."
              value={form.receiverPhone}
              onChange={(event) => updateForm('receiverPhone', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Tỉnh/Thành nhận hàng
            </span>
            <select
              value={form.receiverRegion}
              onChange={(event) => handleRegionChange(event.target.value)}
            >
              <option value="">
                {locationsQuery.isLoading ? 'Đang tải tỉnh/thành...' : 'Vui lòng chọn'}
              </option>
              {form.receiverRegion &&
              !provinceOptions.some((province) => province.name === form.receiverRegion) ? (
                <option value={form.receiverRegion}>{form.receiverRegion}</option>
              ) : null}
              {provinceOptions.map((province) => (
                <option key={province.code} value={province.name}>
                  {province.name}
                </option>
              ))}
            </select>
            {locationsQuery.isError ? (
              <small>Không tải được API địa chỉ, vui lòng thử lại.</small>
            ) : null}
          </label>

          <label className="ops-branch-order-create__field">
            <span>Phường/Xã nhận hàng</span>
            <select
              value={form.receiverWard}
              onChange={(event) => updateForm('receiverWard', event.target.value)}
              disabled={!form.receiverRegion || wardOptions.length === 0}
            >
              <option value="">
                {!form.receiverRegion
                  ? 'Chọn tỉnh/thành trước'
                  : wardOptions.length === 0
                  ? 'Không có danh sách xã'
                  : 'Chọn phường/xã'}
              </option>
              {wardOptions.map((ward) => (
                <option key={ward.code} value={ward.name}>
                  {ward.name}
                </option>
              ))}
            </select>
          </label>

          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>
              <i>*</i> Địa chỉ chi tiết người nhận
            </span>
            <input
              type="text"
              placeholder="Số nhà, tên đường, tòa nhà, thôn xóm..."
              value={form.receiverAddress}
              onChange={(event) => updateForm('receiverAddress', event.target.value)}
            />
          </label>
        </div>
      </article>

      {/* PANEL 4: THÔNG SỐ BƯU KIỆN & QUY CHUẨN ĐÓNG GÓI HÀNG DỄ VỠ (SOP) */}
      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thông số kiện hàng & Quy chuẩn đóng gói SOP
            <span aria-hidden="true">&#128230;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gọn thông số kiện hàng"
          >
            <CollapseIcon />
          </button>
        </header>

        <div className="ops-branch-order-create__form">
          <label className="ops-branch-order-create__field">
            <span>Khối lượng thực tế (kg)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="0.5"
              value={form.weightKg}
              onChange={(event) => updateForm('weightKg', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Dài (cm)</span>
            <input
              type="number"
              min="0"
              placeholder="20"
              value={form.lengthCm}
              onChange={(event) => updateForm('lengthCm', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Rộng (cm)</span>
            <input
              type="number"
              min="0"
              placeholder="15"
              value={form.widthCm}
              onChange={(event) => updateForm('widthCm', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>Cao (cm)</span>
            <input
              type="number"
              min="0"
              placeholder="10"
              value={form.heightCm}
              onChange={(event) => updateForm('heightCm', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field">
            <span>COD (Tiền thu hộ)</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.codAmount}
              onChange={(event) => updateForm('codAmount', event.target.value)}
            />
          </label>
          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>Ghi chú bưu tá giao hàng</span>
            <textarea
              rows={2}
              placeholder="Ví dụ: Gọi trước khi giao, giao giờ hành chính..."
              value={form.deliveryNote}
              onChange={(event) => updateForm('deliveryNote', event.target.value)}
            />
          </label>

          {/* KHỐI KIỂM SOÁT HÀNG DỄ VỠ & QUY CHUẨN SOP */}
          <div className="ops-branch-order-create__fragile-wrapper">
            <div className="ops-branch-order-create__fragile-header">
              <label className="ops-branch-order-create__fragile-toggle">
                <input
                  type="checkbox"
                  checked={form.isFragile}
                  onChange={(e) => handleFragileToggle(e.target.checked)}
                />
                <span className="ops-branch-order-create__fragile-title">
                  📦 Bưu kiện thuộc nhóm HÀNG DỄ VỠ / CHẤT LỎNG / ĐIỆN TỬ NHẠY CẢM
                </span>
              </label>
              <span className="ops-branch-order-create__fragile-badge">
                {form.isFragile
                  ? '⚠️ Yêu cầu bọc SOP & Tem Ly nứt (FRAGILE)'
                  : 'Hàng thông thường'}
              </span>
            </div>

            {form.isFragile ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <label className="ops-branch-order-create__field">
                    <span>Phân loại nhóm dễ vỡ</span>
                    <select
                      value={form.fragileCategory}
                      onChange={(e) => updateForm('fragileCategory', e.target.value as FragileCategory)}
                    >
                      <option value="CERAMICS">Đồ gốm sứ, sành, đất nung</option>
                      <option value="GLASS">Thủy tinh, pha lê, gương, bóng đèn</option>
                      <option value="LIQUID">Chất lỏng, nước hoa, rượu, mỹ phẩm</option>
                      <option value="ELECTRONICS">Thiết bị điện tử có màn hình kính, camera</option>
                      <option value="OTHER">Thực phẩm bánh hộp mềm, đồ mỹ nghệ</option>
                    </select>
                  </label>
                </div>

                <div className="ops-branch-order-create__sop-box">
                  <div className="ops-branch-order-create__sop-title">
                    🛡️ QUY CHUẨN ĐÓNG GÓI CHỐNG SỐC BẮT BUỘC (SOP TIÊU CHUẨN):
                  </div>
                  <div className="ops-branch-order-create__sop-grid">
                    <div className="ops-branch-order-create__sop-item">
                      <span>✓</span> Quấn tối thiểu 3 - 4 lớp xốp bọt khí (Bubble Wrap) bảo vệ mọi góc cạnh.
                    </div>
                    <div className="ops-branch-order-create__sop-item">
                      <span>✓</span> Chèn mút xốp hoặc túi khí kín 6 mặt đáy - thành - nắp hộp (Lắc nhẹ không phát ra tiếng động).
                    </div>
                    <div className="ops-branch-order-create__sop-item">
                      <span>✓</span> Sử dụng thùng carton sóng cứng, niêm phong băng dính hình chữ H chắc chắn.
                    </div>
                    <div className="ops-branch-order-create__sop-item">
                      <span>✓</span> Tự động in tem cảnh báo Ly vỡ & Xếp tầng trên cùng (Top Stacking) trên xe tải.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#166534', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.packagingStandardMet}
                      onChange={(e) => handlePackagingStandardToggle(e.target.checked)}
                      style={{ accentColor: '#16a34a', width: '16px', height: '16px' }}
                    />
                    ✅ Kiện hàng đã được kiểm tra: Đóng gói đạt chuẩn an toàn chống sốc SOP.
                  </label>

                  <div className="ops-branch-order-create__waiver-box">
                    <label className="ops-branch-order-create__waiver-label">
                      <input
                        type="checkbox"
                        checked={form.packagingWaiver}
                        onChange={(e) => handlePackagingWaiverToggle(e.target.checked)}
                      />
                      <span>⚠️ Khách hàng tự đóng gói sơ sài & từ chối bọc lại - Ký Biên bản cam kết miễn trừ trách nhiệm bể vỡ do tự đóng gói</span>
                    </label>
                    <div className="ops-branch-order-create__waiver-note">
                      * Căn cứ Điều 24 Luật Bưu chính 2010: NEXUS chỉ bồi thường khi mất nguyên kiện, được miễn trừ 100% trách nhiệm bể vỡ bên trong nếu vỏ thùng bên ngoài còn nguyên niêm phong.
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </article>

      {/* PANEL 5: BẢO HIỂM HÀNG HÓA & CHIẾT TÍNH CƯỚC TẠI QUẦY */}
      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Chính sách bảo hiểm hàng hóa & Chiết tính cước tại quầy
            <span aria-hidden="true">&#128176;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gọn bảo hiểm và cước phí"
          >
            <CollapseIcon />
          </button>
        </header>

        <div className="ops-branch-order-create__form">
          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>
              <i>*</i> Giá trị hàng hóa khai báo (VNĐ)
            </span>
            <input
              type="number"
              min="0"
              step="50000"
              placeholder="Nhập giá trị món hàng (VD: 5000000)"
              value={form.declaredValue}
              onChange={(event) => updateForm('declaredValue', event.target.value)}
            />
            <small className="ops-branch-order-create__help-text">
              Giá trị khai báo là căn cứ xác định mức bồi hoàn theo Điều 25 Luật Bưu chính khi phát sinh sự cố.
            </small>
          </label>

          <div className="ops-branch-order-create__insurance-section">
            <div className="ops-branch-order-create__insurance-cards">
              {/* Card 1: Gói Tiêu chuẩn */}
              <div
                className={`ops-branch-order-create__tier-card ${
                  form.insuranceTier === 'NONE' ? 'ops-branch-order-create__tier-card--selected' : ''
                }`}
                onClick={() => updateForm('insuranceTier', 'NONE')}
              >
                <div className="ops-branch-order-create__tier-top">
                  <span className="ops-branch-order-create__tier-title">
                    <input
                      type="radio"
                      name="insuranceTier"
                      value="NONE"
                      checked={form.insuranceTier === 'NONE'}
                      onChange={() => updateForm('insuranceTier', 'NONE')}
                    />
                    GÓI VẬN CHUYỂN TIÊU CHUẨN
                  </span>
                  <span className="ops-branch-order-create__tier-price ops-branch-order-create__tier-price--free">
                    0 VNĐ (Miễn phí)
                  </span>
                </div>
                <div className="ops-branch-order-create__tier-desc">
                  Phù hợp cho quần áo, tài liệu, hàng thông thường giá trị thấp (&le; 1.000.000đ).
                </div>
                <div className="ops-branch-order-create__tier-policy">
                  Hạn mức bồi thường: <strong>Tối đa 04 lần cước vận chuyển</strong> (Trần tối đa 1.000.000đ theo Điều 25 Luật Bưu chính).
                </div>
              </div>

              {/* Card 2: Gói Bảo hiểm Toàn diện 100% */}
              <div
                className={`ops-branch-order-create__tier-card ${
                  form.insuranceTier === 'COMPREHENSIVE_100'
                    ? 'ops-branch-order-create__tier-card--selected'
                    : ''
                }`}
                onClick={() => updateForm('insuranceTier', 'COMPREHENSIVE_100')}
              >
                <div className="ops-branch-order-create__tier-top">
                  <span className="ops-branch-order-create__tier-title">
                    <input
                      type="radio"
                      name="insuranceTier"
                      value="COMPREHENSIVE_100"
                      checked={form.insuranceTier === 'COMPREHENSIVE_100'}
                      onChange={() => updateForm('insuranceTier', 'COMPREHENSIVE_100')}
                    />
                    BẢO HIỂM TOÀN DIỆN 100%
                  </span>
                  <span className="ops-branch-order-create__tier-price">
                    + {formatCurrency(feeBreakdown.insuranceFee)}
                    <span style={{ fontSize: '10.5px', fontWeight: '500', color: '#64748b', display: 'block', textAlign: 'right' }}>
                      (0.5% giá trị khai báo, tối thiểu 5.000đ)
                    </span>
                  </span>
                </div>
                <div className="ops-branch-order-create__tier-desc">
                  Kiện hàng được dán tem định danh an ninh, giám sát camera riêng trên toàn bộ hành trình.
                </div>
                <div className="ops-branch-order-create__tier-policy ops-branch-order-create__tier-policy--comprehensive">
                  Cam kết bồi thường: <strong>100% GIÁ TRỊ KHAI BÁO THỰC TẾ</strong> khi mất hàng hoặc bể vỡ (kèm hóa đơn/chứng từ hợp lệ).
                </div>
              </div>
            </div>

            {/* THẺ SO SÁNH TRỌNG LƯỢNG TÍNH CƯỚC IATA */}
            <div className="ops-branch-order-create__weight-compare-box">
              <div className="ops-branch-order-create__weight-compare-title">
                CĂN CỨ TÍNH CƯỚC TRỌNG LƯỢNG (QUY CHUẨN IATA & BƯU CHÍNH)
              </div>
              <div className="ops-branch-order-create__weight-compare-grid">
                <div className="ops-branch-order-create__weight-item">
                  <span className="ops-branch-order-create__weight-item-label">Cân nặng thực tế</span>
                  <strong className="ops-branch-order-create__weight-item-val">{feeBreakdown.actualWeightKg} kg</strong>
                </div>
                <div className="ops-branch-order-create__weight-item">
                  <span className="ops-branch-order-create__weight-item-label">Thể tích quy đổi (D×R×C/6000)</span>
                  <strong className="ops-branch-order-create__weight-item-val">{feeBreakdown.volumetricWeightKg} kg</strong>
                </div>
                <div className="ops-branch-order-create__weight-item ops-branch-order-create__weight-item--highlight">
                  <span className="ops-branch-order-create__weight-item-label">Khối lượng tính cước</span>
                  <strong className="ops-branch-order-create__weight-item-val">{feeBreakdown.chargeableWeightKg} kg</strong>
                  {feeBreakdown.isVolumetricApplied ? (
                    <span className="ops-branch-order-create__weight-tag-volumetric">
                      Áp dụng quy đổi thể tích
                    </span>
                  ) : (
                    <span className="ops-branch-order-create__weight-tag-actual">
                      Áp dụng cân nặng thực tế
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* BẢNG KÊ CHI TIẾT CƯỚC TẠI QUẦY */}
            <div className="ops-branch-order-create__fee-summary-box">
              <div className="ops-branch-order-create__fee-rows">
                <div className="ops-branch-order-create__fee-item">
                  <span className="ops-branch-order-create__fee-label">
                    Cước cơ bản ({form.serviceType} - 0.5kg đầu)
                  </span>
                  <span className="ops-branch-order-create__fee-val">{formatCurrency(feeBreakdown.serviceBase)}</span>
                </div>
                {feeBreakdown.weightFee > 0 ? (
                  <div className="ops-branch-order-create__fee-item">
                    <span className="ops-branch-order-create__fee-label">
                      Cước vượt cân ({feeBreakdown.extraHalfKgUnits} nấc 0.5kg)
                    </span>
                    <span className="ops-branch-order-create__fee-val">+{formatCurrency(feeBreakdown.weightFee)}</span>
                  </div>
                ) : null}
                {feeBreakdown.zoneFee > 0 ? (
                  <div className="ops-branch-order-create__fee-item">
                    <span className="ops-branch-order-create__fee-label">
                      Phụ phí tuyến liên kết ({form.receiverRegion || 'Liên tỉnh'})
                    </span>
                    <span className="ops-branch-order-create__fee-val">+{formatCurrency(feeBreakdown.zoneFee)}</span>
                  </div>
                ) : null}
                <div className="ops-branch-order-create__fee-item">
                  <span className="ops-branch-order-create__fee-label">
                    Phí bảo hiểm ({form.insuranceTier === 'COMPREHENSIVE_100' ? 'Toàn diện 100%' : 'Gói tiêu chuẩn'})
                  </span>
                  <span className="ops-branch-order-create__fee-val" style={{ color: form.insuranceTier === 'COMPREHENSIVE_100' ? '#2563eb' : '#16a34a' }}>
                    {formatCurrency(feeBreakdown.insuranceFee)}
                  </span>
                </div>
                <div className="ops-branch-order-create__fee-item">
                  <span className="ops-branch-order-create__fee-label">
                    Tiền thu hộ COD (Thu hộ Shop)
                  </span>
                  <span className="ops-branch-order-create__fee-val">{formatCurrency(toPositiveNumber(form.codAmount))}</span>
                </div>
                {feeBreakdown.codFee > 0 ? (
                  <div className="ops-branch-order-create__fee-item">
                    <span className="ops-branch-order-create__fee-label">
                      Phí xử lý tiền thu hộ COD
                    </span>
                    <span className="ops-branch-order-create__fee-val">{formatCurrency(feeBreakdown.codFee)}</span>
                  </div>
                ) : null}
              </div>

              <div className="ops-branch-order-create__fee-total-row">
                <span className="ops-branch-order-create__total-label">
                  Tổng cước dịch vụ tại quầy
                </span>
                <span className="ops-branch-order-create__total-val">{formatCurrency(feeBreakdown.totalFee)}</span>
              </div>
            </div>

            {/* THANH THUYẾT MINH CÔNG THỨC CHO BẢO VỆ ĐỒ ÁN */}
            <div className="ops-branch-order-create__formula-guide-box">
              <button
                type="button"
                className="ops-branch-order-create__formula-toggle-btn"
                onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              >
                <span>Thuyết minh phương pháp chiết tính cước bưu chính</span>
                <span className="ops-branch-order-create__formula-toggle-badge">
                  {showFormulaDetails ? 'Thu gọn' : 'Xem chi tiết'}
                </span>
              </button>

              {showFormulaDetails ? (
                <div className="ops-branch-order-create__formula-details">
                  <div className="ops-branch-order-create__formula-item">
                    <strong>1. Khối lượng tính cước (Chargeable Weight)</strong>
                    <code>Chargeable Weight = max(Cân thực tế, (Dài × Rộng × Cao)/6000)</code>
                    <small>Theo quy chuẩn Hiệp hội Vận tải Hàng không Quốc tế (IATA) & Hiệp hội Logistics Việt Nam (VLA).</small>
                  </div>
                  <div className="ops-branch-order-create__formula-item">
                    <strong>2. Cước vận chuyển lũy tiến theo nấc</strong>
                    <code>Cước vận chuyển = Cước cơ sở (0.5kg đầu) + Nấc 0.5kg vượt × Đơn giá nấc + Phụ phí tuyến</code>
                  </div>
                  <div className="ops-branch-order-create__formula-item">
                    <strong>3. Phí bảo hiểm hàng hóa 100%</strong>
                    <code>Phí bảo hiểm = max(5.000 VNĐ, Giá trị khai báo × 0.5%)</code>
                    <small>Cam kết bồi hoàn 100% giá trị thiệt hại thực tế theo hóa đơn chứng từ.</small>
                  </div>
                  <div className="ops-branch-order-create__formula-item">
                    <strong>4. Phân quyền hiển thị tài chính cho Người nhận (Receiver Privacy)</strong>
                    <small>Người nhận tra cứu mã vận đơn chỉ thấy số tiền COD cần thanh toán, hoàn toàn bảo mật công thức cước và chiết khấu giữa Shop và Bưu cục.</small>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      <article className="ops-branch-order-create__actions">
        <div>
          {actionMessage ? (
            <div className="ops-branch-order-create__success-banner">
              <p className="ops-branch-order-create__notice">{actionMessage}</p>
              {lastCreatedLabel ? (
                <button
                  type="button"
                  className="ops-branch-order-create__print-now-btn"
                  onClick={() => openShippingLabelPrint(lastCreatedLabel)}
                >
                  <span aria-hidden="true">&#128424;</span> In ngay tem nhãn nhiệt [{lastCreatedLabel.shipmentCode}]
                </button>
              ) : null}
            </div>
          ) : null}
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
