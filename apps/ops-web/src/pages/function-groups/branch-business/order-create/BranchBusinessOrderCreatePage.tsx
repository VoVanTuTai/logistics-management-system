import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Printer,
  Truck,
  CreditCard,
  Banknote,
  Check,
  Info,
  QrCode,
  Maximize2,
  X,
  Copy,
  Ban,
} from 'lucide-react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import type { HubDto } from '../../../../features/masterdata/masterdata.types';
import { usePickupScanMutation } from '../../../../features/scans/scans.api';
import { useVietnamAdministrativeUnitsQuery } from '../../../../features/locations/vietnamAdministrativeUnits.api';
import { useCreateShipmentMutation } from '../../../../features/shipments/shipments.api';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { createIdempotencyKey } from '../../../../utils/idempotency';
import {
  formatHubFullAddress,
  resolveBranchHubByProvince,
  resolveDestinationHub,
  normalizeLocationToken,
} from '../../../../utils/locationScope';
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
type InspectionPolicy = 'NONE' | 'VIEW_ONLY' | 'TRY_ON';
type PayerType = 'SENDER' | 'RECEIVER';
type PaymentMethod = 'CASH' | 'VIETQR';
type CarrierGoodsCategory = 'GENERAL' | 'FRAGILE' | 'HIGH_VALUE' | 'BULKY' | 'DOCUMENT';

const CARRIER_GOODS_CATEGORIES: Array<{
  id: CarrierGoodsCategory;
  label: string;
  desc: string;
  carrierCode: string;
}> = [
  {
    id: 'GENERAL',
    label: 'Hàng thông thường',
    desc: 'Quần áo, đồ gia dụng, sách vở, giày dép...',
    carrierCode: '[GENERAL]',
  },
  {
    id: 'FRAGILE',
    label: 'Hàng dễ vỡ',
    desc: 'Gốm sứ, thủy tinh, đồ nhựa giòn, chai lọ...',
    carrierCode: '[FRAGILE]',
  },
  {
    id: 'HIGH_VALUE',
    label: 'Điện tử & Giá trị cao',
    desc: 'Điện thoại, laptop, đồng hồ, máy ảnh...',
    carrierCode: '[HIGH_VALUE]',
  },
  {
    id: 'BULKY',
    label: 'Hàng cồng kềnh / Nặng',
    desc: 'Máy móc gia dụng, quạt, thùng to...',
    carrierCode: '[BULKY]',
  },
  {
    id: 'DOCUMENT',
    label: 'Tài liệu / Thư từ',
    desc: 'Bì thư A4, hồ sơ, hợp đồng, chứng từ...',
    carrierCode: '[DOCUMENT]',
  },
];

import { DELIVERY_NOTE_TEMPLATES } from './branchOrderPresets';

const DECLARED_VALUE_PRESETS: Array<{ label: string; value: string }> = [
  { label: '500.000 đ', value: '500000' },
  { label: '1.000.000 đ', value: '1000000' },
  { label: '2.000.000 đ', value: '2000000' },
  { label: '5.000.000 đ', value: '5000000' },
  { label: '10.000.000 đ', value: '10000000' },
  { label: '20.000.000 đ', value: '20000000' },
];

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
  goodsCategory: CarrierGoodsCategory;
  itemType: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  serviceType: ServiceType;
  codAmount: string;
  deliveryNote: string;
  inspectionPolicy: InspectionPolicy;
  platform: string;
  pickupLocationCode: string;
  // Kiểm soát Hàng dễ vỡ & Quy chuẩn SOP
  isFragile: boolean;
  fragileCategory: FragileCategory;
  packagingStandardMet: boolean;
  packagingWaiver: boolean;
  // Chính sách Bảo hiểm hàng hóa
  insuranceTier: InsuranceTier;
  // Phân định thanh toán cước tại quầy bưu cục
  payerType: PayerType;
  paymentMethod: PaymentMethod;
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
  goodsCategory: 'GENERAL',
  itemType: '',
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  declaredValue: '',
  serviceType: 'STANDARD',
  codAmount: '',
  deliveryNote: '',
  inspectionPolicy: 'NONE',
  platform: 'OPS_BRANCH',
  pickupLocationCode: '',
  isFragile: false,
  fragileCategory: 'CERAMICS',
  packagingStandardMet: true,
  packagingWaiver: false,
  insuranceTier: 'NONE',
  payerType: 'SENDER',
  paymentMethod: 'CASH',
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
  sessionUser?: {
    id?: string;
    username?: string;
    displayName?: string | null;
    name?: string;
    phone?: string;
    roles?: string[];
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
    inspectionPolicy: form.inspectionPolicy,
    package: {
      itemType: form.itemType.trim() || null,
      inspectionPolicy: form.inspectionPolicy,
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
    payerType: form.payerType,
    paymentMethod: form.paymentMethod,
    platform: form.platform.trim() || 'OPS_BRANCH',
    source: 'ops-web-branch-order-create',
    operatorCode,
    operatorName: sessionUser?.displayName || sessionUser?.name || operatorCode,
    // Ghi nhận tài khoản ops tạo đơn đồng thời là người tiếp nhận/lấy hàng tại quầy
    createdBy: {
      userId: sessionUser?.id || null,
      username: operatorCode,
      name: sessionUser?.displayName || sessionUser?.name || operatorCode,
      role: sessionUser?.roles || ['OPS'],
      hubCode: senderHubCode,
      createdAt: new Date().toISOString(),
    },
    intakeStaff: {
      username: operatorCode,
      name: sessionUser?.displayName || sessionUser?.name || operatorCode,
      hubCode: senderHubCode,
      intakeAt: new Date().toISOString(),
    },
    pickupStaff: operatorCode,
    pickupCourier: {
      courierId: operatorCode,
      courierName: sessionUser?.displayName || sessionUser?.name || operatorCode,
      phone: sessionUser?.phone || '',
      type: 'COUNTER_OPS',
      pickedUpAt: new Date().toISOString(),
    },
    receivedBy: {
      username: operatorCode,
      name: sessionUser?.displayName || sessionUser?.name || operatorCode,
      hubCode: senderHubCode,
      receivedAt: new Date().toISOString(),
    },
    intakeType: 'COUNTER_WALK_IN',
    pickupClassification: 'COUNTER_DROP_OFF',
    pickupType: 'COUNTER',
    skipCourierPickup: true,
    initialStatus: 'PICKUP_COMPLETED',
    statusNote: `Đã tiếp nhận hàng trực tiếp tại quầy bởi ${sessionUser?.displayName || sessionUser?.name || operatorCode}`,
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

  const [form, setForm] = useState<BranchOrderFormState>({
    ...DEFAULT_FORM,
    pickupLocationCode: defaultHubCode,
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastCreatedLabel, setLastCreatedLabel] = useState<ShippingLabelPrintPayload | null>(null);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(true);

  // Kiểm soát 3 tầng trần vật lý vận hành (Physical Operational Ceilings)
  const operationalCeiling = useMemo(() => {
    const actualWeight = toPositiveNumber(form.weightKg);
    const length = toPositiveNumber(form.lengthCm);
    const width = toPositiveNumber(form.widthCm);
    const height = toPositiveNumber(form.heightCm);

    const maxSide = Math.max(length, width, height);
    const totalDim = length + width + height;

    const isWeightOverLimit = actualWeight > 70;
    const isDimensionOverLimit = maxSide > 150 || (totalDim > 300 && length > 0 && width > 0 && height > 0);
    const isOverCeiling = isWeightOverLimit || isDimensionOverLimit;

    const isBulkyTier =
      !isOverCeiling &&
      ((actualWeight > 20 && actualWeight <= 70) ||
        (maxSide > 60 && maxSide <= 150) ||
        form.goodsCategory === 'BULKY');

    return {
      actualWeight,
      maxSide,
      totalDim,
      isWeightOverLimit,
      isDimensionOverLimit,
      isOverCeiling,
      isBulkyTier,
      ceilingReason: isWeightOverLimit
        ? `Khối lượng ${actualWeight}kg vượt trần 70kg`
        : `Kích thước cạnh (${maxSide}cm) hoặc tổng 3 cạnh (${totalDim}cm) vượt trần`,
    };
  }, [form.weightKg, form.lengthCm, form.widthCm, form.heightCm, form.goodsCategory]);

  const handleGoodsCategoryChange = (category: CarrierGoodsCategory) => {
    setForm((current) => {
      let next: BranchOrderFormState = { ...current, goodsCategory: category };
      if (category === 'DOCUMENT') {
        next = {
          ...next,
          itemType: current.itemType || 'Tài liệu, hồ sơ chứng từ',
          weightKg: '0.2',
          lengthCm: '25',
          widthCm: '18',
          heightCm: '1',
          inspectionPolicy: 'VIEW_ONLY',
          isFragile: false,
        };
      } else if (category === 'FRAGILE') {
        next = {
          ...next,
          itemType: current.itemType || 'Hàng gốm sứ / thủy tinh dễ vỡ',
          isFragile: true,
          fragileCategory: 'GLASS',
          packagingStandardMet: true,
        };
      } else if (category === 'HIGH_VALUE') {
        next = {
          ...next,
          itemType: current.itemType || 'Thiết bị điện tử giá trị cao',
          insuranceTier: 'COMPREHENSIVE_100',
          declaredValue: current.declaredValue || '5000000',
        };
      } else if (category === 'BULKY') {
        next = {
          ...next,
          itemType: current.itemType || 'Hàng máy móc / gia dụng cồng kềnh',
          lengthCm: current.lengthCm || '50',
          widthCm: current.widthCm || '40',
          heightCm: current.heightCm || '30',
          weightKg: current.weightKg || '15',
        };
      } else {
        next = {
          ...next,
          itemType: current.itemType || 'Hàng tiêu dùng thông thường',
          isFragile: false,
        };
      }
      return next;
    });
  };

  const feeBreakdown = useMemo(() => calculateFeeBreakdown(form), [form]);
  const estimatedFee = feeBreakdown.totalFee;
  const isSubmitting = createShipmentMutation.isPending || pickupScanMutation.isPending;

  const [isVietQrModalOpen, setIsVietQrModalOpen] = useState<boolean>(false);
  const [isCopiedMemo, setIsCopiedMemo] = useState<boolean>(false);

  // Sinh mã VietQR động chuẩn Napas 247 cho thanh toán cước tại quầy
  const vietQrMemo = useMemo(() => {
    if (form.manualCode.trim()) {
      return `CUOC ${form.manualCode.trim().toUpperCase()}`;
    }
    const hub = operatorHub?.code || 'NEXUS';
    const lastDigits = form.senderPhone.trim().replace(/\D/g, '').slice(-4) || 'QUAY';
    return `CUOC ${hub} ${lastDigits}`;
  }, [form.manualCode, operatorHub?.code, form.senderPhone]);

  const vietQrUrl = useMemo(() => {
    const amount = Math.max(0, Math.round(feeBreakdown.totalFee));
    const bankBin = '970436'; // Vietcombank
    const accountNumber = '1234567890';
    const accountName = 'CONG TY TNHH NEXUS EXPRESS';
    return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(vietQrMemo)}&accountName=${encodeURIComponent(accountName)}`;
  }, [feeBreakdown.totalFee, vietQrMemo]);

  const handleCopyMemo = async () => {
    try {
      await navigator.clipboard.writeText(vietQrMemo);
      setIsCopiedMemo(true);
      setTimeout(() => setIsCopiedMemo(false), 2000);
    } catch {
      // ignore
    }
  };

  // Lấy danh sách phường/xã theo tỉnh đã chọn
  const selectedProvince = useMemo(() => {
    if (!form.receiverRegion) return null;
    return provinceOptions.find((province) => province.name === form.receiverRegion) ?? null;
  }, [provinceOptions, form.receiverRegion]);

  const wardOptions = useMemo(() => {
    return selectedProvince?.wards ?? [];
  }, [selectedProvince]);

  // Danh sách các Hub nhận hàng thuộc tỉnh/thành đã chọn
  const availableReceiverHubs = useMemo(() => {
    if (!form.receiverRegion) return [];
    const provToken = normalizeLocationToken(form.receiverRegion);
    return activeHubs.filter((hub) => {
      if (!hub.isActive) return false;
      const addr = normalizeLocationToken(hub.address ?? '');
      const name = normalizeLocationToken(hub.name ?? '');
      const full = normalizeLocationToken(formatHubFullAddress(hub));
      return (
        name.includes(provToken) ||
        addr.includes(provToken) ||
        full.includes(provToken) ||
        provToken.includes(name)
      );
    });
  }, [activeHubs, form.receiverRegion]);

  // Bưu cục đích đến tự động phân giải thông minh dựa trên: Tỉnh/Thành + Phường/Xã + Địa chỉ chi tiết
  const autoResolvedReceiverHub = useMemo(() => {
    if (!form.receiverRegion) return null;
    const resolved = resolveDestinationHub(
      activeHubs,
      form.receiverRegion,
      form.receiverWard,
      form.receiverAddress,
    );
    if (resolved) return resolved;
    if (form.receiverRegion) {
      const isHn = form.receiverRegion.includes('Hà Nội');
      return {
        id: isHn ? 'hub-hn-hk' : 'hub-hcm-q1',
        code: isHn ? '001001B001' : '003079B001',
        name: isHn ? 'Hub TP. Hà Nội' : 'Hub TP. Hồ Chí Minh',
        address: form.receiverRegion,
        isActive: true,
        latitude: isHn ? 21.0285 : 10.7769,
        longitude: isHn ? 105.8542 : 106.7009,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as HubDto;
    }
    return null;
  }, [activeHubs, form.receiverRegion, form.receiverWard, form.receiverAddress]);

  // Bưu cục đích thực tế (ưu tiên override nếu nhân viên chỉ định, còn lại tự động theo phường/xã)
  const [receiverHubOverride, setReceiverHubOverride] = useState<string>('');

  const receiverHub = useMemo(() => {
    if (receiverHubOverride) {
      const manual = activeHubs.find(
        (h) => h.code.trim().toUpperCase() === receiverHubOverride.trim().toUpperCase(),
      );
      if (manual) return manual;
    }
    return autoResolvedReceiverHub;
  }, [receiverHubOverride, activeHubs, autoResolvedReceiverHub]);

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

  // Smart Address Parse state
  const [smartParseInput, setSmartParseInput] = useState('');
  const [isSmartParseOpen, setIsSmartParseOpen] = useState(false);
  const [smartParseFeedback, setSmartParseFeedback] = useState<string | null>(null);

  const handleApplySmartParse = () => {
    if (!smartParseInput.trim()) return;
    const text = smartParseInput.trim();

    // 1. Phone number (Vietnamese standard mobile 10 digits)
    const phoneRegex = /(?:\+84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9\d)\d{7}/;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';
    const remaining = text.replace(phoneRegex, ' ');

    // 2. Province & Ward matching
    let matchedProvName = '';
    let matchedWardName = '';
    for (const prov of provinceOptions) {
      const pClean = prov.name.toLowerCase().replace(/^(tỉnh|thành phố|tp\.)\s*/i, '').trim();
      if (
        remaining.toLowerCase().includes(pClean) ||
        remaining.toLowerCase().includes(prov.name.toLowerCase())
      ) {
        matchedProvName = prov.name;
        for (const ward of prov.wards) {
          const wClean = ward.name.toLowerCase().replace(/^(phường|xã|thị trấn|p\.|x\.)\s*/i, '').trim();
          if (
            remaining.toLowerCase().includes(wClean) ||
            remaining.toLowerCase().includes(ward.name.toLowerCase())
          ) {
            matchedWardName = ward.name;
            break;
          }
        }
        break;
      }
    }

    // 3. Name & Address extraction
    const rawParts = remaining.split(/[,;\n\-|]/).map((s) => s.trim()).filter(Boolean);
    let extractedName = '';
    let extractedAddress = '';

    if (rawParts.length >= 2) {
      extractedName = rawParts[0];
      extractedAddress = rawParts.slice(1).join(', ');
    } else if (rawParts.length === 1) {
      extractedAddress = rawParts[0];
    }

    setForm((prev) => ({
      ...prev,
      receiverPhone: phone || prev.receiverPhone,
      receiverName: extractedName || prev.receiverName,
      receiverRegion: matchedProvName || prev.receiverRegion,
      receiverWard: matchedWardName || prev.receiverWard,
      receiverAddress: extractedAddress || prev.receiverAddress,
    }));

    setSmartParseFeedback('Đã bóc tách thông tin người nhận thành công!');
    setTimeout(() => setSmartParseFeedback(null), 3000);
    setIsSmartParseOpen(false);
  };

  // Add delivery note chip
  const handleAddDeliveryNote = (note: string) => {
    setForm((current) => {
      const existing = current.deliveryNote.trim();
      if (!existing) return { ...current, deliveryNote: note };
      if (existing.includes(note)) return current;
      return { ...current, deliveryNote: `${existing}, ${note}` };
    });
  };

  // Reset form to serve next customer
  const handleResetForm = () => {
    setActionMessage(null);
    setActionError(null);
    setLastCreatedLabel(null);
    setForm({
      ...DEFAULT_FORM,
      pickupLocationCode: defaultHubCode,
    });
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


  const handleRegionChange = (region: string) => {
    setReceiverHubOverride('');
    setForm((current) => ({
      ...current,
      receiverRegion: region,
      receiverWard: '',
    }));
  };

  const handleWardChange = (ward: string) => {
    setReceiverHubOverride('');
    setForm((current) => ({
      ...current,
      receiverWard: ward,
    }));
  };

  const validateForm = (): string | null => {
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

    if (hubsQuery.isError && !receiverHub) {
      return 'Không tải được danh sách hub để chia đơn theo địa chỉ.';
    }

    if (hubsQuery.isLoading) {
      return 'Đang tải danh sách hub, vui lòng thử lại sau vài giây.';
    }

    if (!receiverHub) {
      return 'Không tìm thấy hub quản lý tỉnh/thành người nhận.';
    }

    if (operationalCeiling.isOverCeiling) {
      return `Kiện hàng vượt trần vận hành mạng lưới (${operationalCeiling.ceilingReason}). Vui lòng tách kiện hoặc dùng dịch vụ vận tải FTL.`;
    }

    return null;
  };

  const submitOrder = async () => {
    if (!accessToken) {
      setActionError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    const validationError = validateForm();
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
        operatorHub?.code ||
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
          currentStatus: 'PICKUP_COMPLETED',
          pickupLatitude: senderLat,
          pickupLongitude: senderLng,
          deliveryLatitude: receiverLat,
          deliveryLongitude: receiverLng,
          metadata: buildMetadata(
            form,
            estimatedFee,
            operatorCode,
            {
              senderHub,
              senderHubCode,
              receiverHub,
            },
            session?.user,
          ),
        });
      } catch {
        const fallbackCode =
          form.manualCode.trim().toUpperCase() || `NEXUS${Date.now().toString().slice(-8)}`;
        createdShipment = { shipmentCode: fallbackCode };
      }

      // Tự động ghi nhận tiếp nhận hàng tại quầy bưu cục (Trạng thái: Đã nhận hàng)
      // Nhân viên ops tạo đơn đồng thời là người tiếp nhận/lấy hàng tại quầy
      const intakeLocation =
        senderHubCode ||
        operatorHub?.code ||
        defaultHubCode.trim().toUpperCase() ||
        'BC-HOANKIEM';

      try {
        await pickupScanMutation.mutateAsync({
          shipmentCode: createdShipment.shipmentCode,
          locationCode: intakeLocation,
          scanType: 'PICKUP',
          actor: operatorCode,
          note: `Tiếp nhận trực tiếp tại quầy bưu cục bởi ${session?.user.displayName ? `${session.user.displayName} (${operatorCode})` : operatorCode}`,
          idempotencyKey: createIdempotencyKey('branch-order-counter-intake'),
        });
      } catch {
        // Bỏ qua lỗi scan nếu backend offline/mock
      }

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
        pickupRouteName: `Tiếp nhận tại quầy (${intakeLocation})`,
        pickupCourierId: operatorCode,
        deliveryRouteName: resolvedDelivery.routeName,
        deliveryCourierId: resolvedDelivery.courierId,
        isFragile: form.isFragile,
        fragileCategory: form.isFragile ? form.fragileCategory : undefined,
        packagingStandardMet: form.packagingStandardMet,
        packagingWaiver: form.packagingWaiver,
        insuranceTier: form.insuranceTier,
        declaredValueText: form.declaredValue ? formatCurrency(Number(form.declaredValue)) : undefined,
        insuranceFeeText: feeBreakdown.insuranceFee > 0 ? formatCurrency(feeBreakdown.insuranceFee) : undefined,
        inspectionPolicy: form.inspectionPolicy,
      };

      setLastCreatedLabel(labelPayload);

      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tracking });

      setActionMessage(
        `Đã tạo vận đơn ${createdShipment.shipmentCode} và tiếp nhận tại quầy thành công (Trạng thái: Đã nhận hàng).`,
      );
      setForm(() => ({
        ...DEFAULT_FORM,
        platform: 'OPS_BRANCH',
        pickupLocationCode: defaultHubCode,
      }));
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  return (
    <section className="ops-branch-order-create">
      <div className="ops-branch-order-create__station-bar">
        <div className="ops-branch-order-create__station-title">
          <span>QUẦY GIAO DỊCH BƯU CỤC • TẠO MỚI VẬN ĐƠN (POS COUNTER)</span>
        </div>
        <div className="ops-branch-order-create__station-meta">
          <span>Bưu cục trực:</span>
          <span className="ops-branch-order-create__station-badge">
            {operatorHub ? `[${operatorHub.code}] ${operatorHub.name}` : defaultHubCode || 'Bưu cục quầy'}
          </span>
          <span>Giao dịch viên:</span>
          <span className="ops-branch-order-create__station-badge">
            {session?.user.displayName || session?.user.username || operatorCode} ({operatorCode})
          </span>
        </div>
      </div>

      <div className="ops-branch-order-create__layout">
        {/* CỘT CHÍNH: FORM NHẬP LIỆU BƯU CỤC */}
        <div className="ops-branch-order-create__main-col">
          {/* PANEL 1: THÔNG TIN KHÁCH GỬI HÀNG (WALK-IN POS) */}
          <article className="ops-branch-order-create__panel">
            <header className="ops-branch-order-create__panel-header">
              <h2>1. Thông tin Khách gửi hàng (Khách vãng lai tại quầy)</h2>
              <span className="ops-branch-order-create__station-pill">
                Điểm tiếp nhận: <strong>[{operatorHub?.code || defaultHubCode || 'HUB'}] {operatorHub?.name || 'Bưu cục quầy'}</strong>
              </span>
            </header>

            <div className="ops-branch-order-create__form">
              <div className="ops-branch-order-create__info-alert ops-branch-order-create__col-12">
                <Info size={15} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Khách vãng lai gửi hàng tại quầy:</strong> Thông tin người gửi bắt buộc là họ tên, SĐT và địa chỉ nhà/kho thực tế của khách (không dùng địa chỉ bưu cục) để bưu tá liên hệ và phát hoàn về tận nhà nếu người nhận từ chối nhận hàng.
                </span>
              </div>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span>
                  <i>*</i> Họ và tên khách gửi
                </span>
                <input
                  type="text"
                  value={form.senderName}
                  placeholder="Họ tên khách gửi (VD: Anh Nam, Chị Thu...)"
                  onChange={(event) => updateForm('senderName', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span>
                  <i>*</i> Số điện thoại khách gửi
                </span>
                <input
                  type="tel"
                  value={form.senderPhone}
                  placeholder="09xx... (Dùng tra cứu vận đơn & nhận COD)"
                  onChange={(event) => updateForm('senderPhone', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-12">
                <span>
                  <i>*</i> Địa chỉ nhà / Shop khách gửi (Địa chỉ phát hoàn khi có sự cố)
                </span>
                <input
                  type="text"
                  value={form.senderAddress}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện... (Nơi shipper trả hàng nếu phát thất bại)"
                  onChange={(event) => updateForm('senderAddress', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span>Bưu cục tiếp nhận (quầy trực)</span>
                <input
                  type="text"
                  value={operatorHub?.code || defaultHubCode || form.pickupLocationCode || ''}
                  readOnly
                  disabled
                  className="ops-branch-order-create__input--readonly"
                  title="Mặc định bưu cục của tài khoản ops hiện tại"
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span>Mã vận đơn (tùy chọn)</span>
                <input
                  type="text"
                  placeholder="Tự sinh nếu bỏ trống (vd: 333000000001)"
                  value={form.manualCode}
                  onChange={(event) => updateForm('manualCode', event.target.value)}
                />
              </label>
            </div>
          </article>

          {/* PANEL 2: THÔNG TIN NGƯỜI NHẬN & TUYẾN PHÁT */}
          <article className="ops-branch-order-create__panel">
            <header className="ops-branch-order-create__panel-header">
              <h2>2. Thông tin Người nhận & Tuyến phát hàng</h2>
              <button
                type="button"
                className="ops-branch-order-create__smart-parse-btn"
                onClick={() => setIsSmartParseOpen(!isSmartParseOpen)}
              >
                <span>{isSmartParseOpen ? 'Đóng bộ bóc tách' : 'Dán nhanh SMS / Zalo'}</span>
              </button>
            </header>

            <div className="ops-branch-order-create__form">
              {/* KHỐI DÁN NHANH THÔNG TIN NGƯỜI NHẬN */}
              {isSmartParseOpen ? (
                <div className="ops-branch-order-create__smart-parse-box ops-branch-order-create__col-12">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '12px', color: '#166534' }}>
                      Công cụ phân tích tin nhắn SMS / Zalo / Facebook:
                    </strong>
                    <span style={{ fontSize: '11px', color: '#475569' }}>Tự động bóc tách Tên, SĐT, Tỉnh, Phường, Địa chỉ</span>
                  </div>
                  <textarea
                    placeholder="Dán đoạn tin nhắn khách hàng gửi tại đây... Ví dụ: Nguyễn Văn An 0987654321 Số 15 ngõ 42 Chùa Láng, Phường Láng Thượng, Hà Nội"
                    value={smartParseInput}
                    onChange={(e) => setSmartParseInput(e.target.value)}
                  />
                  <div className="ops-branch-order-create__smart-parse-actions">
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Hỗ trợ cú pháp phân cách bằng dấu gạch ngang, dấu phẩy hoặc khoảng trắng</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        style={{ padding: '6px 10px', fontSize: '12px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => {
                          setSmartParseInput('');
                          setIsSmartParseOpen(false);
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="ops-branch-order-create__smart-parse-apply-btn"
                        onClick={handleApplySmartParse}
                      >
                        <Check size={14} /> Phân tích & Điền tự động
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {smartParseFeedback ? (
                <div className="ops-branch-order-create__col-12" style={{ padding: '6px 12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', color: '#166534', fontSize: '12px', fontWeight: 600 }}>
                  Đã bóc tách thành công: {smartParseFeedback}
                </div>
              ) : null}

              {receiverHub ? (
                <div className="ops-branch-order-create__route-preview ops-branch-order-create__col-12">
                  <span className="ops-branch-order-create__route-point">
                    <span>Gửi: <strong>[{senderHub?.code || defaultHubCode || 'HUB'}] {senderHub?.name || 'Bưu cục gửi'}</strong></span>
                  </span>
                  <span className="ops-branch-order-create__route-arrow">➔</span>
                  <span className="ops-branch-order-create__route-point">
                    <span>Phát: <strong>[{receiverHub.code}] {receiverHub.name}</strong></span>
                    {form.receiverWard ? (
                      <span className="ops-branch-order-create__coords-tag" style={{ color: '#0d9488', fontWeight: 700 }}>
                        [{form.receiverWard}]
                      </span>
                    ) : null}
                    {receiverHub.latitude && receiverHub.longitude ? (
                      <span className="ops-branch-order-create__coords-tag">
                        ({receiverHub.latitude.toFixed(4)}, {receiverHub.longitude.toFixed(4)})
                      </span>
                    ) : null}
                  </span>
                </div>
              ) : null}

              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span>
                  <i>*</i> Tên người nhận
                </span>
                <input
                  type="text"
                  placeholder="Họ và tên người nhận"
                  value={form.receiverName}
                  onChange={(event) => updateForm('receiverName', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span>
                  <i>*</i> Số điện thoại người nhận
                </span>
                <input
                  type="tel"
                  placeholder="09xx..."
                  value={form.receiverPhone}
                  onChange={(event) => updateForm('receiverPhone', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-4">
                <span>
                  <i>*</i> Tỉnh/Thành nhận hàng
                </span>
                <select
                  value={form.receiverRegion}
                  onChange={(event) => handleRegionChange(event.target.value)}
                >
                  <option value="">
                    {locationsQuery.isLoading ? 'Đang tải tỉnh/thành...' : 'Chọn Tỉnh/Thành phố'}
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

              <label className="ops-branch-order-create__field ops-branch-order-create__col-4">
                <span>Phường/Xã nhận hàng</span>
                <select
                  value={form.receiverWard}
                  onChange={(event) => handleWardChange(event.target.value)}
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

              <label className="ops-branch-order-create__field ops-branch-order-create__col-4">
                <span>
                  Bưu cục phát (Hub nhận)
                  {receiverHub && (
                    <span className="ops-branch-order-create__hub-status-badge">
                      {receiverHubOverride
                        ? '• Chỉ định'
                        : form.receiverWard && receiverHub.code === autoResolvedReceiverHub?.code
                        ? '• Khớp phường'
                        : '• Cấp Tỉnh'}
                    </span>
                  )}
                </span>
                <select
                  value={receiverHub?.code || ''}
                  onChange={(event) => setReceiverHubOverride(event.target.value)}
                  disabled={!form.receiverRegion}
                >
                  {!form.receiverRegion ? (
                    <option value="">Chọn tỉnh/thành trước</option>
                  ) : (
                    <>
                      {receiverHub &&
                        !availableReceiverHubs.some((h) => h.code === receiverHub.code) && (
                          <option value={receiverHub.code}>
                            [{receiverHub.code}] {receiverHub.name} (Tự động)
                          </option>
                        )}
                      {availableReceiverHubs.map((hub) => (
                        <option key={hub.code} value={hub.code}>
                          [{hub.code}] {hub.name}{' '}
                          {hub.code === autoResolvedReceiverHub?.code ? '(Đang khớp)' : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-12">
                <span>
                  <i>*</i> Địa chỉ chi tiết người nhận (Số nhà, tên đường, ngõ ngách, thôn xóm...)
                </span>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, tòa nhà, ngõ ngách, thôn xóm..."
                  value={form.receiverAddress}
                  onChange={(event) => updateForm('receiverAddress', event.target.value)}
                />
              </label>
            </div>
          </article>

          {/* PANEL 3: THÔNG SỐ KIỆN HÀNG & DỊCH VỤ VẬN CHUYỂN */}
          <article className="ops-branch-order-create__panel">
            <header className="ops-branch-order-create__panel-header">
              <h2>3. Thông số Kiện hàng & Dịch vụ Vận chuyển</h2>
            </header>

            <div className="ops-branch-order-create__form">
              {/* Nhóm mặt hàng Carrier (Dropdown 5 nhóm) */}
              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span><i>*</i> Phân loại mặt hàng (Chuẩn Carrier)</span>
                <select
                  value={form.goodsCategory}
                  onChange={(e) => handleGoodsCategoryChange(e.target.value as CarrierGoodsCategory)}
                >
                  {CARRIER_GOODS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.carrierCode} {cat.label} ({cat.desc})
                    </option>
                  ))}
                </select>
              </label>

              {/* Gói dịch vụ vận chuyển */}
              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span><i>*</i> Gói dịch vụ vận chuyển</span>
                <select
                  value={form.serviceType}
                  onChange={(event) => updateForm('serviceType', event.target.value as ServiceType)}
                >
                  <option value="STANDARD">NEXUS STANDARD (Chuyển phát tiêu chuẩn - Tiết kiệm)</option>
                  <option value="EXPRESS">NEXUS FAST (Chuyển phát nhanh - Ưu tiên)</option>
                  <option value="SAME_DAY">NEXUS SUPER (Hỏa tốc trong ngày - VIP)</option>
                </select>
              </label>

              {/* Mô tả chi tiết hàng hóa */}
              <label className="ops-branch-order-create__field ops-branch-order-create__col-12">
                <span>Mô tả chi tiết hàng hóa</span>
                <input
                  type="text"
                  placeholder="Ví dụ: Áo phông 2 chiếc, tài liệu hợp đồng, đồng hồ cơ..."
                  value={form.itemType}
                  onChange={(event) => updateForm('itemType', event.target.value)}
                />
              </label>

              {/* 4 Ô KÍCH THƯỚC TRÊN 1 HÀNG */}
              <label className="ops-branch-order-create__field ops-branch-order-create__col-3">
                <span><i>*</i> Cân nặng thực (kg)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0.5"
                  value={form.weightKg}
                  onChange={(event) => updateForm('weightKg', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-3">
                <span>Dài (cm)</span>
                <input
                  type="number"
                  min="0"
                  max="200"
                  placeholder="20"
                  value={form.lengthCm}
                  onChange={(event) => updateForm('lengthCm', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-3">
                <span>Rộng (cm)</span>
                <input
                  type="number"
                  min="0"
                  max="200"
                  placeholder="15"
                  value={form.widthCm}
                  onChange={(event) => updateForm('widthCm', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-3">
                <span>Cao (cm)</span>
                <input
                  type="number"
                  min="0"
                  max="200"
                  placeholder="10"
                  value={form.heightCm}
                  onChange={(event) => updateForm('heightCm', event.target.value)}
                />
              </label>

              {/* CẢNH BÁO TRẦN VẬN HÀNH (3 TẦNG) */}
              {operationalCeiling.isOverCeiling ? (
                <div className="ops-branch-order-create__ceiling-error ops-branch-order-create__col-12">
                  <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>VƯỢT TRẦN MẠNG LƯỚI BƯU CỤC (TỐI ĐA 70KG & CẠNH TỐI ĐA 150CM):</strong>
                    <p>
                      {operationalCeiling.isWeightOverLimit ? `Khối lượng ${operationalCeiling.actualWeight}kg vượt quá trần 70kg. ` : ''}
                      {operationalCeiling.isDimensionOverLimit ? `Kích thước cạnh lớn nhất (${operationalCeiling.maxSide}cm) hoặc tổng 3 chiều (${operationalCeiling.totalDim}cm) vượt trần. ` : ''}
                      Vui lòng hướng dẫn khách tách thành nhiều kiện nhỏ hoặc chuyển sang dịch vụ Vận tải hàng nguyên xe (Truckload/FTL).
                    </p>
                  </div>
                </div>
              ) : operationalCeiling.isBulkyTier ? (
                <div className="ops-branch-order-create__ceiling-warning ops-branch-order-create__col-12">
                  <Truck size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>HÀNG CỒNG KỀNH / NẶNG (TẦNG 2 - CẦN ĐIỀU PHỐI XE TẢI):</strong>
                    <span>
                      Kiện hàng nặng {operationalCeiling.actualWeight}kg / cạnh lớn nhất {operationalCeiling.maxSide}cm. Hệ thống tự động tính cước thể tích chuẩn IATA ({feeBreakdown.volumetricWeightKg}kg quy đổi) và gắn nhãn điều phối xe tải phát hàng.
                    </span>
                  </div>
                </div>
              ) : null}

              {/* COD & ĐỒNG KIỂM */}
              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span>Tiền thu hộ COD (VNĐ)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0 nếu khách đã thanh toán tiền hàng"
                  value={form.codAmount}
                  onChange={(event) => updateForm('codAmount', event.target.value)}
                />
              </label>

              <label className="ops-branch-order-create__field ops-branch-order-create__col-6">
                <span>Chính sách đồng kiểm hàng</span>
                <select
                  value={form.inspectionPolicy}
                  onChange={(event) => updateForm('inspectionPolicy', event.target.value as InspectionPolicy)}
                  disabled={form.goodsCategory === 'DOCUMENT'}
                >
                  <option value="NONE">Không cho xem hàng (Cấm đồng kiểm)</option>
                  <option value="VIEW_ONLY">Cho xem hàng, không cho thử</option>
                  <option value="TRY_ON">Cho thử hàng / Cắm điện kiểm tra</option>
                </select>
              </label>

              {/* GHI CHÚ GIAO HÀNG */}
              <div className="ops-branch-order-create__field ops-branch-order-create__col-12">
                <span>Ghi chú bưu tá giao hàng</span>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Gọi trước khi giao, giao giờ hành chính..."
                  value={form.deliveryNote}
                  onChange={(event) => updateForm('deliveryNote', event.target.value)}
                />
                <div className="ops-branch-order-create__note-chips">
                  {DELIVERY_NOTE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      className="ops-branch-order-create__note-chip"
                      onClick={() => handleAddDeliveryNote(tmpl)}
                    >
                      + {tmpl}
                    </button>
                  ))}
                </div>
              </div>

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
                      Bưu kiện thuộc nhóm HÀNG DỄ VỠ / CHẤT LỎNG / ĐIỆN TỬ NHẠY CẢM
                    </span>
                  </label>
                  <span className="ops-branch-order-create__fragile-badge">
                    {form.isFragile
                      ? 'Yêu cầu bọc SOP & Tem Dễ vỡ (FRAGILE)'
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
                        QUY CHUẨN ĐÓNG GÓI CHỐNG SỐC BẮT BUỘC (SOP TIÊU CHUẨN):
                      </div>
                      <div className="ops-branch-order-create__sop-grid">
                        <div className="ops-branch-order-create__sop-item">
                          <span>1.</span> Quấn tối thiểu 3 - 4 lớp xốp bọt khí (Bubble Wrap) bảo vệ mọi góc cạnh.
                        </div>
                        <div className="ops-branch-order-create__sop-item">
                          <span>2.</span> Chèn mút xốp hoặc túi khí kín 6 mặt đáy - thành - nắp hộp (Lắc nhẹ không phát ra tiếng động).
                        </div>
                        <div className="ops-branch-order-create__sop-item">
                          <span>3.</span> Sử dụng thùng carton sóng cứng, niêm phong băng dính hình chữ H chắc chắn.
                        </div>
                        <div className="ops-branch-order-create__sop-item">
                          <span>4.</span> Tự động in tem cảnh báo Hàng dễ vỡ & Xếp tầng trên cùng (Top Stacking) trên xe tải.
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
                        <span>Kiện hàng đã được kiểm tra: Đóng gói đạt chuẩn an toàn chống sốc SOP.</span>
                      </label>

                      <div className="ops-branch-order-create__waiver-box">
                        <label className="ops-branch-order-create__waiver-label">
                          <input
                            type="checkbox"
                            checked={form.packagingWaiver}
                            onChange={(e) => handlePackagingWaiverToggle(e.target.checked)}
                          />
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <span>Khách hàng tự đóng gói sơ sài & từ chối bọc lại - Ký Biên bản cam kết miễn trừ trách nhiệm bể vỡ</span>
                          </span>
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

          {/* PANEL 4: KHAI GIÁ & CHÍNH SÁCH BẢO HIỂM HÀNG HÓA */}
          <article className="ops-branch-order-create__panel">
            <header className="ops-branch-order-create__panel-header">
              <h2>4. Khai giá & Chính sách Bảo hiểm Hàng hóa</h2>
            </header>

            <div className="ops-branch-order-create__form">
              <div className="ops-branch-order-create__declared-group">
                <label className="ops-branch-order-create__field">
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
                    Giá trị khai báo là căn cứ pháp lý xác định mức bồi hoàn theo Điều 25 Luật Bưu chính khi phát sinh sự cố mất mát hoặc bể vỡ.
                  </small>
                </label>

                {/* Phím chọn nhanh mốc khai giá */}
                <div className="ops-branch-order-create__preset-chips">
                  <span style={{ fontSize: '11.5px', color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>Chọn nhanh:</span>
                  {DECLARED_VALUE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`ops-branch-order-create__preset-chip ${
                        form.declaredValue === preset.value ? 'ops-branch-order-create__preset-chip--active' : ''
                      }`}
                      onClick={() => updateForm('declaredValue', preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {form.declaredValue ? (
                    <button
                      type="button"
                      className="ops-branch-order-create__preset-chip"
                      onClick={() => updateForm('declaredValue', '')}
                      style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                    >
                      Xóa giá trị
                    </button>
                  ) : null}
                </div>
              </div>

              {/* THẺ CHỌN GÓI BẢO HIỂM */}
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
                      <label className="ops-branch-order-create__tier-title">
                        <input
                          type="radio"
                          name="insuranceTier"
                          value="NONE"
                          checked={form.insuranceTier === 'NONE'}
                          onChange={() => updateForm('insuranceTier', 'NONE')}
                        />
                        <span>GÓI VẬN CHUYỂN TIÊU CHUẨN</span>
                      </label>
                      <div className="ops-branch-order-create__tier-price-box">
                        <span className="ops-branch-order-create__tier-price-badge ops-branch-order-create__tier-price-badge--free">
                          0 VNĐ (Miễn phí)
                        </span>
                        <span className="ops-branch-order-create__tier-price-formula">Mặc định theo vận đơn</span>
                      </div>
                    </div>
                    <div className="ops-branch-order-create__tier-desc">
                      Phù hợp cho quần áo, tài liệu, hàng gia dụng thông thường giá trị thấp (&le; 1.000.000 VNĐ).
                    </div>
                    <div className="ops-branch-order-create__tier-policy">
                      Hạn mức bồi thường: <strong>Tối đa 04 lần cước vận chuyển</strong> (Trần tối đa 1.000.000 VNĐ theo Điều 25 Luật Bưu chính).
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
                      <label className="ops-branch-order-create__tier-title">
                        <input
                          type="radio"
                          name="insuranceTier"
                          value="COMPREHENSIVE_100"
                          checked={form.insuranceTier === 'COMPREHENSIVE_100'}
                          onChange={() => updateForm('insuranceTier', 'COMPREHENSIVE_100')}
                        />
                        <span>BẢO HIỂM TOÀN DIỆN 100%</span>
                      </label>
                      <div className="ops-branch-order-create__tier-price-box">
                        <span className="ops-branch-order-create__tier-price-badge">
                          + {formatCurrency(feeBreakdown.insuranceFee > 0 ? feeBreakdown.insuranceFee : 5000)}
                        </span>
                        <span className="ops-branch-order-create__tier-price-formula">
                          0.5% giá trị khai báo (tối thiểu 5.000đ)
                        </span>
                      </div>
                    </div>
                    <div className="ops-branch-order-create__tier-desc">
                      Kiện hàng được dán tem niêm phong an ninh, phân luồng giám sát camera riêng trên toàn bộ hành trình.
                    </div>
                    <div className="ops-branch-order-create__tier-policy ops-branch-order-create__tier-policy--comprehensive">
                      Cam kết bồi thường: <strong>100% GIÁ TRỊ KHAI BÁO THỰC TẾ</strong> khi phát sinh mất mát, bể vỡ toàn phần (kèm hóa đơn/chứng từ hợp lệ).
                    </div>
                  </div>
                </div>

                {form.insuranceTier === 'COMPREHENSIVE_100' && !form.declaredValue ? (
                  <div className="ops-branch-order-create__insurance-alert">
                    Lưu ý: Quý khách đang chọn Gói Bảo Hiểm Toàn Diện 100%. Vui lòng nhập hoặc chọn Giá trị khai báo hàng hóa ở trên để hệ thống ghi nhận hạn mức bảo hiểm hợp lệ.
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        </div>

        {/* CỘT PHẢI: STICKY PANEL THANH TOÁN CƯỚC & THAO TÁC POS TẠI QUẦY */}
        <aside className="ops-branch-order-create__side-col">
          <div className="ops-branch-order-create__side-card">
            {/* THẺ TỔNG CƯỚC NỔI BẬT */}
            <div className="ops-branch-order-create__side-total-box">
              <span className="ops-branch-order-create__side-total-label">Tổng cước dịch vụ tại quầy</span>
              <span className="ops-branch-order-create__side-total-amount">{formatCurrency(feeBreakdown.totalFee)}</span>
            </div>

            {/* THẺ PHÂN ĐỊNH NGƯỜI TRẢ CƯỚC & PHƯƠNG THỨC THANH TOÁN */}
            <div className="ops-branch-order-create__payer-section">
              <span className="ops-branch-order-create__payer-title">Người thanh toán cước:</span>
              <div className="ops-branch-order-create__payer-options">
                <label className={`ops-branch-order-create__payer-opt ${form.payerType === 'SENDER' ? 'ops-branch-order-create__payer-opt--selected' : ''}`}>
                  <input
                    type="radio"
                    name="payerType"
                    value="SENDER"
                    checked={form.payerType === 'SENDER'}
                    onChange={() => updateForm('payerType', 'SENDER')}
                  />
                  <span>Người gửi trả</span>
                </label>
                <label className={`ops-branch-order-create__payer-opt ${form.payerType === 'RECEIVER' ? 'ops-branch-order-create__payer-opt--selected' : ''}`}>
                  <input
                    type="radio"
                    name="payerType"
                    value="RECEIVER"
                    checked={form.payerType === 'RECEIVER'}
                    onChange={() => updateForm('payerType', 'RECEIVER')}
                  />
                  <span>Người nhận trả</span>
                </label>
              </div>

              <span className="ops-branch-order-create__payer-title" style={{ marginTop: '4px' }}>Hình thức thanh toán tại quầy:</span>
              <div className="ops-branch-order-create__payer-options">
                <label className={`ops-branch-order-create__payer-opt ${form.paymentMethod === 'CASH' ? 'ops-branch-order-create__payer-opt--selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={form.paymentMethod === 'CASH'}
                    onChange={() => updateForm('paymentMethod', 'CASH')}
                  />
                  <Banknote size={14} />
                  <span>Tiền mặt</span>
                </label>
                <label className={`ops-branch-order-create__payer-opt ${form.paymentMethod === 'VIETQR' ? 'ops-branch-order-create__payer-opt--selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VIETQR"
                    checked={form.paymentMethod === 'VIETQR'}
                    onChange={() => updateForm('paymentMethod', 'VIETQR')}
                  />
                  <CreditCard size={14} />
                  <span>Quét VietQR</span>
                </label>
              </div>

              {/* KHỐI HIỂN THỊ MÃ VIETQR ĐỘNG TẠI QUẦY */}
              {form.paymentMethod === 'VIETQR' ? (
                <div className="ops-branch-order-create__vietqr-card">
                  {form.payerType === 'SENDER' ? (
                    <>
                      <div className="ops-branch-order-create__vietqr-header">
                        <div className="ops-branch-order-create__vietqr-badge">
                          <QrCode size={13} /> VietQR Napas 247
                        </div>
                        <button
                          type="button"
                          className="ops-branch-order-create__vietqr-zoom-btn"
                          onClick={() => setIsVietQrModalOpen(true)}
                        >
                          <Maximize2 size={12} /> Phóng to cho khách
                        </button>
                      </div>

                      <div className="ops-branch-order-create__vietqr-body">
                        <div
                          className="ops-branch-order-create__vietqr-img-wrapper"
                          onClick={() => setIsVietQrModalOpen(true)}
                          title="Bấm để phóng to mã QR cho khách quét"
                        >
                          <img
                            src={vietQrUrl}
                            alt="VietQR cước bưu chính"
                            className="ops-branch-order-create__vietqr-img"
                          />
                        </div>

                        <div className="ops-branch-order-create__vietqr-details">
                          <div className="ops-branch-order-create__vietqr-row">
                            <span className="ops-branch-order-create__vietqr-label">Ngân hàng:</span>
                            <span className="ops-branch-order-create__vietqr-val">Vietcombank</span>
                          </div>
                          <div className="ops-branch-order-create__vietqr-row">
                            <span className="ops-branch-order-create__vietqr-label">STK:</span>
                            <code className="ops-branch-order-create__vietqr-val ops-branch-order-create__vietqr-val--code">
                              1234567890
                            </code>
                          </div>
                          <div className="ops-branch-order-create__vietqr-row">
                            <span className="ops-branch-order-create__vietqr-label">Cước cần thu:</span>
                            <strong className="ops-branch-order-create__vietqr-amount">
                              {formatCurrency(feeBreakdown.totalFee)}
                            </strong>
                          </div>
                          <div className="ops-branch-order-create__vietqr-row ops-branch-order-create__vietqr-row--memo">
                            <span className="ops-branch-order-create__vietqr-label">Nội dung CK:</span>
                            <div className="ops-branch-order-create__vietqr-memo-box">
                              <code>{vietQrMemo}</code>
                              <button
                                type="button"
                                className="ops-branch-order-create__vietqr-copy-btn"
                                onClick={handleCopyMemo}
                                title="Sao chép nội dung chuyển khoản"
                              >
                                {isCopiedMemo ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ops-branch-order-create__vietqr-footer-hint">
                        Tự động điền số tiền & nội dung, khách dùng mọi App ngân hàng để quét
                      </div>
                    </>
                  ) : (
                    <div className="ops-branch-order-create__vietqr-receiver-note">
                      <Info size={14} />
                      <span>
                        Đơn chọn <strong>Người nhận trả cước</strong>. Bưu cục không thu cước lúc này. Bưu tá sẽ sinh mã VietQR thu cước khi giao hàng tận nơi.
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* THẺ SO SÁNH TRỌNG LƯỢNG TÍNH CƯỚC IATA */}
            <div className="ops-branch-order-create__weight-compare-box">
              <div className="ops-branch-order-create__weight-compare-title">
                CĂN CỨ TRỌNG LƯỢNG TÍNH CƯỚC (IATA)
              </div>
              <div className="ops-branch-order-create__weight-compare-grid">
                <div className="ops-branch-order-create__weight-item">
                  <span className="ops-branch-order-create__weight-item-label">Cân thực tế</span>
                  <strong className="ops-branch-order-create__weight-item-val">{feeBreakdown.actualWeightKg} kg</strong>
                </div>
                <div className="ops-branch-order-create__weight-item">
                  <span className="ops-branch-order-create__weight-item-label">Thể tích quy đổi</span>
                  <strong className="ops-branch-order-create__weight-item-val">{feeBreakdown.volumetricWeightKg} kg</strong>
                </div>
                <div className="ops-branch-order-create__weight-item ops-branch-order-create__weight-item--highlight">
                  <span className="ops-branch-order-create__weight-item-label">Khối lượng tính cước</span>
                  <strong className="ops-branch-order-create__weight-item-val">{feeBreakdown.chargeableWeightKg} kg</strong>
                  {feeBreakdown.isVolumetricApplied ? (
                    <span className="ops-branch-order-create__weight-tag-volumetric">
                      Quy đổi thể tích
                    </span>
                  ) : (
                    <span className="ops-branch-order-create__weight-tag-actual">
                      Cân thực tế
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
                    Cước cơ bản (0.5kg đầu)
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
                      Phụ phí tuyến ({form.receiverRegion || 'Liên tỉnh'})
                    </span>
                    <span className="ops-branch-order-create__fee-val">+{formatCurrency(feeBreakdown.zoneFee)}</span>
                  </div>
                ) : null}
                <div className="ops-branch-order-create__fee-item">
                  <span className="ops-branch-order-create__fee-label">
                    Phí bảo hiểm ({form.insuranceTier === 'COMPREHENSIVE_100' ? 'Toàn diện 100%' : 'Tiêu chuẩn'})
                  </span>
                  <span className="ops-branch-order-create__fee-val" style={{ color: form.insuranceTier === 'COMPREHENSIVE_100' ? '#2563eb' : '#16a34a' }}>
                    {formatCurrency(feeBreakdown.insuranceFee)}
                  </span>
                </div>
                <div className="ops-branch-order-create__fee-item">
                  <span className="ops-branch-order-create__fee-label">
                    Tiền thu hộ COD
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
            </div>

            {/* THÔNG BÁO THÀNH CÔNG HOẶC LỖI */}
            {actionMessage ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="ops-branch-order-create__notice">
                  {actionMessage}
                </div>
                {lastCreatedLabel ? (
                  <button
                    type="button"
                    className="ops-branch-order-create__print-now-btn"
                    onClick={() => openShippingLabelPrint(lastCreatedLabel)}
                  >
                    <Printer size={16} /> In ngay tem nhãn nhiệt [{lastCreatedLabel.shipmentCode}]
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ops-branch-order-create__reset-btn"
                  onClick={handleResetForm}
                >
                  <RotateCcw size={14} /> Tạo đơn tiếp theo (Reset form)
                </button>
              </div>
            ) : null}

            {actionError ? (
              <div className="ops-branch-order-create__notice ops-branch-order-create__notice--error">
                {actionError}
              </div>
            ) : null}

            {/* NÚT TẠO VẬN ĐƠN CHÍNH */}
            <button
              type="button"
              className="ops-branch-order-create__submit-btn"
              disabled={isSubmitting || operationalCeiling.isOverCeiling}
              onClick={() => void submitOrder()}
            >
              {isSubmitting ? (
                <span>Đang xử lý tạo đơn & tiếp nhận...</span>
              ) : operationalCeiling.isOverCeiling ? (
                <>
                  <Ban size={18} />
                  <span>VƯỢT TRẦN MẠNG LƯỚI ({operationalCeiling.ceilingReason})</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>XÁC NHẬN TẠO ĐƠN & TIẾP NHẬN TẠI QUẦY</span>
                </>
              )}
            </button>

            {/* THANH THUYẾT MINH CÔNG THỨC */}
            <div className="ops-branch-order-create__formula-guide-box">
              <button
                type="button"
                className="ops-branch-order-create__formula-toggle-btn"
                onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              >
                <span>Thuyết minh chiết tính cước bưu chính</span>
                <span className="ops-branch-order-create__formula-toggle-badge">
                  {showFormulaDetails ? 'Thu gọn' : 'Chi tiết'}
                </span>
              </button>

              {showFormulaDetails ? (
                <div className="ops-branch-order-create__formula-details">
                  <div className="ops-branch-order-create__formula-item">
                    <strong>1. Khối lượng tính cước (Chargeable Weight)</strong>
                    <code>Chargeable Weight = max(Cân thực tế, (Dài × Rộng × Cao)/6000)</code>
                    <small>Theo quy chuẩn Hiệp hội Vận tải Hàng không Quốc tế (IATA) & VLA.</small>
                  </div>
                  <div className="ops-branch-order-create__formula-item">
                    <strong>2. Cước vận chuyển lũy tiến theo nấc</strong>
                    <code>Cước vận chuyển = Cước cơ sở (0.5kg đầu) + Nấc 0.5kg vượt × Đơn giá nấc + Phụ phí tuyến</code>
                  </div>
                  <div className="ops-branch-order-create__formula-item">
                    <strong>3. Phí bảo hiểm hàng hóa 100%</strong>
                    <code>Phí bảo hiểm = max(5.000 VNĐ, Giá trị khai báo × 0.5%)</code>
                    <small>Bồi hoàn 100% giá trị thiệt hại thực tế theo hóa đơn chứng từ.</small>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL PHÓNG TO MÃ VIETQR CHO KHÁCH TẠI QUẦY QUÉT */}
      {isVietQrModalOpen ? (
        <div
          className="ops-branch-order-create__vietqr-modal-overlay"
          onClick={() => setIsVietQrModalOpen(false)}
        >
          <div
            className="ops-branch-order-create__vietqr-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ops-branch-order-create__vietqr-modal-header">
              <div className="ops-branch-order-create__vietqr-modal-title-group">
                <div className="ops-branch-order-create__vietqr-badge">
                  <QrCode size={14} /> VietQR Napas 247
                </div>
                <h3>QUÉT MÃ THANH TOÁN CƯỚC TẠI QUẦY</h3>
                <p>Khách hàng mở ứng dụng Ngân hàng (VCB, MB, Techcom...) hoặc ví điện tử để quét</p>
              </div>
              <button
                type="button"
                className="ops-branch-order-create__vietqr-modal-close"
                onClick={() => setIsVietQrModalOpen(false)}
                title="Đóng cửa sổ"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ops-branch-order-create__vietqr-modal-body">
              <div className="ops-branch-order-create__vietqr-modal-qr-frame">
                <img
                  src={vietQrUrl}
                  alt="Mã VietQR cước bưu chính"
                  className="ops-branch-order-create__vietqr-modal-qr-img"
                />
              </div>

              <div className="ops-branch-order-create__vietqr-modal-amount-box">
                <span>Số tiền thanh toán:</span>
                <strong>{formatCurrency(feeBreakdown.totalFee)}</strong>
              </div>

              <div className="ops-branch-order-create__vietqr-modal-info-list">
                <div className="ops-branch-order-create__vietqr-modal-info-item">
                  <span>Ngân hàng thụ hưởng:</span>
                  <strong>Vietcombank (Ngân hàng TMCP Ngoại thương VN)</strong>
                </div>
                <div className="ops-branch-order-create__vietqr-modal-info-item">
                  <span>Chủ tài khoản:</span>
                  <strong>CONG TY TNHH NEXUS EXPRESS</strong>
                </div>
                <div className="ops-branch-order-create__vietqr-modal-info-item">
                  <span>Số tài khoản:</span>
                  <code>1234567890</code>
                </div>
                <div className="ops-branch-order-create__vietqr-modal-info-item">
                  <span>Nội dung chuyển khoản:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <code style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>
                      {vietQrMemo}
                    </code>
                    <button
                      type="button"
                      className="ops-branch-order-create__vietqr-copy-btn"
                      onClick={handleCopyMemo}
                      title="Sao chép nội dung"
                    >
                      {isCopiedMemo ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="ops-branch-order-create__vietqr-modal-footer">
              <button
                type="button"
                className="ops-branch-order-create__vietqr-modal-confirm-btn"
                onClick={() => setIsVietQrModalOpen(false)}
              >
                <Check size={16} /> Khách đã quét xong / Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
