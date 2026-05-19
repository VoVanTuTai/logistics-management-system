import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';
import {
  asNumber,
  asRecord,
  buildShipmentMetadata,
  computeEstimatedFee,
  extractErrorMessage,
  extractShipmentRow,
  formatCurrency,
  formatDate,
  generateLocalId,
  generatePickupCode,
  isToday,
  normalizeCode,
  parseStorage,
  request,
  statusClass,
  toInputDate,
} from './api';
import type {
  ChangeRequest,
  CreateShipmentForm,
  IntrospectResponse,
  LoginResponse,
  MerchantProfile,
  MerchantSession,
  NotificationItem,
  PickupRequest,
  ReturnRequest,
  ShipmentDraft,
  ShipmentResponse,
  ShipmentRow,
  TimelineEvent,
  TrackingCurrent,
  ViewId,
} from './types';
import { DEFAULT_CREATE_FORM, DEFAULT_PROFILE } from './types';
import { openShippingLabelPrint } from './printing/shippingLabelPrint';

const STORAGE_KEY_SESSION = 'merchant-web.session.v1';
const STORAGE_KEY_DRAFTS = 'merchant-web.shipment-drafts.v1';
const STORAGE_KEY_NOTIFICATIONS = 'merchant-web.notifications.v1';
const STORAGE_KEY_RETURNS = 'merchant-web.return-requests.v1';
const STORAGE_KEY_PROFILE = 'merchant-web.profile.v1';
const STORAGE_KEY_PROFILE_PREFIX = 'merchant-web.profile.v2.';
const SHIPMENT_PAGE_SIZE = 8;
const MERCHANT_PROFILE_SCOPE = 'MERCHANT_PROFILE';
const MERCHANT_PROFILE_KEY_PREFIX = 'merchant.profile.';

interface HubApiRecord {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

interface HubLocationOption {
  hubCode: string;
  hubName: string;
  province: string;
  ward: string;
  district: string;
  fullAddress: string;
  label: string;
}

type MerchantRegionCode = 'HA_NOI' | 'DA_NANG' | 'HO_CHI_MINH';

interface ConfigApiRecord {
  id: string;
  key: string;
  value: unknown;
  scope: string | null;
}

interface MerchantProfileConfigPayload {
  username: string;
  citizenId: string;
  regionCode: MerchantRegionCode;
  regionLabel: string;
  defaultHubCode: string | null;
  defaultHubName: string | null;
  defaultSenderAddress: string | null;
  businessAddressDetail: string | null;
}

interface PublicTrackingSnapshotResponse {
  shipmentCode: string;
  current: TrackingCurrent | null;
  timeline: TimelineEvent[];
}

function normalizeLocationKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function resolveProvinceLabel(rawProvince: string): string | null {
  const trimmedProvince = rawProvince.trim();
  if (!trimmedProvince) {
    return null;
  }

  const normalized = normalizeLocationKey(rawProvince);
  if (['HOCHIMINH', 'HCM', 'TPHOCHIMINH', 'THANHPHOHOCHIMINH'].includes(normalized)) {
    return 'Hồ Chí Minh';
  }
  if (['DANANG', 'DN', 'TPDANANG', 'THANHPHODANANG'].includes(normalized)) {
    return 'Đà Nẵng';
  }
  if (['HANOI', 'HN', 'TPHANOI', 'THANHPHOHANOI'].includes(normalized)) {
    return 'Hà Nội';
  }

  return trimmedProvince;
}

function resolveRegionCode(rawProvince: string): MerchantRegionCode | null {
  const normalized = normalizeLocationKey(rawProvince);

  if (!normalized) {
    return null;
  }

  if (['HANOI', 'HN', 'TPHANOI', 'THANHPHOHANOI'].includes(normalized)) {
    return 'HA_NOI';
  }
  if (['DANANG', 'DN', 'TPDANANG', 'THANHPHODANANG'].includes(normalized)) {
    return 'DA_NANG';
  }
  if (['HOCHIMINH', 'HCM', 'TPHOCHIMINH', 'THANHPHOHOCHIMINH'].includes(normalized)) {
    return 'HO_CHI_MINH';
  }

  return null;
}

function buildMerchantProfileKey(username: string): string {
  return `${MERCHANT_PROFILE_KEY_PREFIX}${username.trim().toUpperCase()}`;
}

function buildProfileStorageKey(username: string): string {
  return `${STORAGE_KEY_PROFILE_PREFIX}${username.trim().toUpperCase()}`;
}

function parseMerchantProfileConfig(
  records: ConfigApiRecord[],
  username: string,
): MerchantProfileConfigPayload | null {
  const normalizedUsername = username.trim().toUpperCase();
  if (!normalizedUsername) {
    return null;
  }

  const targetKey = buildMerchantProfileKey(normalizedUsername);
  const record =
    records.find((item) => item.key === targetKey) ??
    records.find((item) => item.key.endsWith(`.${normalizedUsername}`));

  if (!record || !record.value || typeof record.value !== 'object' || Array.isArray(record.value)) {
    return null;
  }

  const payload = record.value as Record<string, unknown>;
  const regionCode = payload.regionCode;

  if (
    typeof payload.username !== 'string' ||
    typeof payload.citizenId !== 'string' ||
    typeof regionCode !== 'string' ||
    typeof payload.regionLabel !== 'string'
  ) {
    return null;
  }

  const normalizedRegionCode = regionCode as MerchantRegionCode;
  if (!['HA_NOI', 'DA_NANG', 'HO_CHI_MINH'].includes(normalizedRegionCode)) {
    return null;
  }

  return {
    username: payload.username.trim().toUpperCase(),
    citizenId: payload.citizenId.trim(),
    regionCode: normalizedRegionCode,
    regionLabel: payload.regionLabel.trim(),
    defaultHubCode:
      typeof payload.defaultHubCode === 'string' && payload.defaultHubCode.trim()
        ? payload.defaultHubCode.trim().toUpperCase()
        : null,
    defaultHubName:
      typeof payload.defaultHubName === 'string' && payload.defaultHubName.trim()
        ? payload.defaultHubName.trim()
        : null,
    defaultSenderAddress:
      typeof payload.defaultSenderAddress === 'string' && payload.defaultSenderAddress.trim()
        ? payload.defaultSenderAddress.trim()
        : null,
    businessAddressDetail:
      typeof payload.businessAddressDetail === 'string' && payload.businessAddressDetail.trim()
        ? payload.businessAddressDetail.trim()
        : null,
  };
}

function parseHubLocation(hub: HubApiRecord): HubLocationOption | null {
  if (!hub.address) {
    return null;
  }

  let province = '';
  let ward = '';
  let district = '';
  let fullAddress = '';

  try {
    const payload = JSON.parse(hub.address) as Record<string, unknown>;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    const addressLine =
      typeof payload.addressLine === 'string' ? payload.addressLine.trim() : '';
    ward = typeof payload.ward === 'string' ? payload.ward.trim() : '';
    province = typeof payload.province === 'string' ? payload.province.trim() : '';
    district = typeof payload.district === 'string' ? payload.district.trim() : '';
    const addressParts = [addressLine, ward, district, province]
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    fullAddress = Array.from(new Set(addressParts)).join(', ');
  } catch {
    const segments = hub.address.split(',').map((segment) => segment.trim());
    province = segments.length > 0 ? segments[segments.length - 1] : '';
    district = segments.length > 1 ? segments[segments.length - 2] : '';
    ward = district;
    fullAddress = hub.address.trim();
  }

  const normalizedProvince = resolveProvinceLabel(province);
  if (!normalizedProvince) {
    return null;
  }

  const wardOrDistrict = ward || district || normalizedProvince;
  const normalizedFullAddress =
    fullAddress ||
    [ward, district, normalizedProvince].filter((part) => part.length > 0).join(', ');

  return {
    hubCode: hub.code,
    hubName: hub.name,
    province: normalizedProvince,
    ward: wardOrDistrict,
    district,
    fullAddress: normalizedFullAddress || hub.name,
    label: `${hub.name} (${wardOrDistrict}, ${normalizedProvince})`,
  };
}

function findHubByCode(
  hubLocations: HubLocationOption[],
  hubCode: string,
): HubLocationOption | null {
  const normalizedHubCode = normalizeCode(hubCode);

  if (!normalizedHubCode) {
    return null;
  }

  return (
    hubLocations.find((location) => normalizeCode(location.hubCode) === normalizedHubCode) ??
    null
  );
}

function findHubByProvinceWard(
  hubLocations: HubLocationOption[],
  province: string,
  ward: string,
): HubLocationOption | null {
  const normalizedProvince = normalizeLocationKey(province);
  const normalizedWard = normalizeLocationKey(ward);

  if (!normalizedProvince || !normalizedWard) {
    return null;
  }

  return (
    hubLocations.find(
      (location) =>
        normalizeLocationKey(location.province) === normalizedProvince &&
        normalizeLocationKey(location.ward) === normalizedWard,
    ) ?? null
  );
}

function resolveSelectedHub(
  hubLocations: HubLocationOption[],
  hubCode: string,
  province: string,
  ward: string,
): HubLocationOption | null {
  const hubByCode = findHubByCode(hubLocations, hubCode);
  if (hubByCode) {
    const provinceMatches =
      !province || normalizeLocationKey(hubByCode.province) === normalizeLocationKey(province);
    const wardMatches =
      !ward || normalizeLocationKey(hubByCode.ward) === normalizeLocationKey(ward);

    if (provinceMatches && wardMatches) {
      return hubByCode;
    }
  }

  const hubByProvinceWard = findHubByProvinceWard(hubLocations, province, ward);
  if (hubByProvinceWard) {
    return hubByProvinceWard;
  }

  if (hubByCode) {
    return hubByCode;
  }

  return null;
}

function resolveHubByRegion(
  hubLocations: HubLocationOption[],
  regionCode: MerchantRegionCode,
): HubLocationOption | null {
  const matchedLocations = hubLocations.filter(
    (location) => resolveRegionCode(location.province) === regionCode,
  );

  if (matchedLocations.length === 0) {
    return null;
  }

  return matchedLocations.sort((left, right) => left.label.localeCompare(right.label, 'vi'))[0];
}

function normalizeCreateForm(
  form: Partial<CreateShipmentForm> | null | undefined,
): CreateShipmentForm {
  return {
    ...DEFAULT_CREATE_FORM,
    ...form,
    senderName: form?.senderName ?? '',
    senderPhone: form?.senderPhone ?? '',
    senderProvince: form?.senderProvince ?? '',
    senderWard: form?.senderWard ?? '',
    senderAddressDetail: form?.senderAddressDetail ?? '',
    senderHubCode: form?.senderHubCode ?? '',
    senderAddress: form?.senderAddress ?? '',
    receiverName: form?.receiverName ?? '',
    receiverPhone: form?.receiverPhone ?? '',
    receiverProvince: form?.receiverProvince ?? '',
    receiverWard: form?.receiverWard ?? '',
    receiverAddressDetail: form?.receiverAddressDetail ?? '',
    receiverHubCode: form?.receiverHubCode ?? '',
    receiverAddress: form?.receiverAddress ?? '',
    receiverRegion: form?.receiverRegion ?? '',
    itemType: form?.itemType ?? '',
    weightKg: form?.weightKg ?? '',
    lengthCm: form?.lengthCm ?? '',
    widthCm: form?.widthCm ?? '',
    heightCm: form?.heightCm ?? '',
    codAmount: form?.codAmount ?? '',
    serviceType: form?.serviceType ?? 'STANDARD',
    deliveryNote: form?.deliveryNote ?? '',
  };
}

function normalizeMerchantIdentity(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function normalizePhone(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

function isShipmentOwnedByUser(
  shipment: ShipmentResponse,
  user: MerchantSession['user'] | null,
): boolean {
  if (!user) {
    return false;
  }

  const metadata = asRecord(shipment.metadata) ?? {};
  const createdByMeta = asRecord(metadata.createdBy);
  const ownerCandidates = [
    metadata.createdBy,
    metadata.createdByUsername,
    metadata.createdByUserId,
    metadata.merchantCode,
    metadata.merchantUsername,
    createdByMeta?.username,
    createdByMeta?.userId,
    createdByMeta?.id,
    createdByMeta?.merchantCode,
  ]
    .map(normalizeMerchantIdentity)
    .filter((value) => value.length > 0);

  const normalizedUsername = normalizeMerchantIdentity(user.username);
  const normalizedUserId = normalizeMerchantIdentity(user.id);

  if (
    ownerCandidates.some(
      (candidate) =>
        candidate === normalizedUsername ||
        (normalizedUserId.length > 0 && candidate === normalizedUserId),
    )
  ) {
    return true;
  }

  const senderMeta = asRecord(metadata.sender);
  const senderPhone = normalizePhone(senderMeta?.phone);
  const merchantPhone = normalizePhone(user.phone ?? '');

  return (
    senderPhone.length > 0 &&
    merchantPhone.length > 0 &&
    senderPhone === merchantPhone
  );
}

function filterPickupRequestsByUser(
  pickupRequests: PickupRequest[],
  shipments: ShipmentResponse[],
  user: MerchantSession['user'] | null,
): PickupRequest[] {
  if (!user) {
    return [];
  }

  const ownedShipmentCodes = new Set(
    shipments
      .filter((shipment) => isShipmentOwnedByUser(shipment, user))
      .map((shipment) => normalizeCode(shipment.code))
      .filter((shipmentCode) => shipmentCode.length > 0),
  );

  return pickupRequests
    .map((pickup) => ({
      ...pickup,
      items: pickup.items.filter((item) =>
        ownedShipmentCodes.has(normalizeCode(item.shipmentCode)),
      ),
    }))
    .filter((pickup) => pickup.items.length > 0);
}

function MerchantApp(): React.JSX.Element {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<MerchantSession | null>(null);
  const [activeView, setActiveView] = useState<ViewId>('dashboard');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateShipmentForm>(DEFAULT_CREATE_FORM);
  const [quotedFee, setQuotedFee] = useState<number | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [drafts, setDrafts] = useState<ShipmentDraft[]>([]);
  const [hubLocations, setHubLocations] = useState<HubLocationOption[]>([]);
  const [merchantProfileConfig, setMerchantProfileConfig] =
    useState<MerchantProfileConfigPayload | null>(null);

  const [selectedShipmentCode, setSelectedShipmentCode] = useState('');
  const [dashboardSearchCode, setDashboardSearchCode] = useState('');

  const [listSearch, setListSearch] = useState('');
  const [listStatus, setListStatus] = useState('ALL');
  const [listService, setListService] = useState('ALL');
  const [listRegion, setListRegion] = useState('ALL');
  const [listFromDate, setListFromDate] = useState('');
  const [listToDate, setListToDate] = useState('');
  const [listPage, setListPage] = useState(1);

  const [detailReceiverPhone, setDetailReceiverPhone] = useState('');
  const [detailReceiverAddress, setDetailReceiverAddress] = useState('');
  const [detailDeliveryNote, setDetailDeliveryNote] = useState('');
  const [detailUpdating, setDetailUpdating] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSuccess, setDetailSuccess] = useState<string | null>(null);
  const [detailTrackCurrent, setDetailTrackCurrent] = useState<TrackingCurrent | null>(null);
  const [detailTrackTimeline, setDetailTrackTimeline] = useState<TimelineEvent[]>([]);
  const [detailTrackError, setDetailTrackError] = useState<string | null>(null);

  const [pickupShipmentCodes, setPickupShipmentCodes] = useState('');
  const [pickupRequesterName, setPickupRequesterName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupDesiredTime, setPickupDesiredTime] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [pickupStatusFilter, setPickupStatusFilter] = useState('ALL');
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupMessage, setPickupMessage] = useState<string | null>(null);

  const [trackingCode, setTrackingCode] = useState('');
  const [trackingCurrent, setTrackingCurrent] = useState<TrackingCurrent | null>(null);
  const [trackingTimeline, setTrackingTimeline] = useState<TimelineEvent[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const [changeCode, setChangeCode] = useState('');
  const [changeType, setChangeType] = useState('change.phone');
  const [changeValue, setChangeValue] = useState('');
  const [changeStatusFilter, setChangeStatusFilter] = useState('ALL');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMessage, setChangeMessage] = useState<string | null>(null);

  const [returnCode, setReturnCode] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnExpectedDate, setReturnExpectedDate] = useState(toInputDate(new Date()));
  const [returnStatusFilter, setReturnStatusFilter] = useState('ALL');
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  const [printSingleCode, setPrintSingleCode] = useState('');
  const [printBulkCodes, setPrintBulkCodes] = useState('');
  const [printMessage, setPrintMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<MerchantProfile>(DEFAULT_PROFILE);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [passwordOld, setPasswordOld] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const navItems: Array<{ id: ViewId; label: string; icon: string; subtitle: string }> = [
    { id: 'dashboard', label: 'Tổng quan', icon: '⌂', subtitle: 'Merchant Portal > Tổng quan' },
    { id: 'create-shipment', label: 'Tạo đơn hàng', icon: '+', subtitle: 'Đơn hàng > Tạo đơn hàng' },
    { id: 'shipments', label: 'Danh sách đơn hàng', icon: '≣', subtitle: 'Đơn hàng > Danh sách đơn hàng' },
    { id: 'pickups', label: 'Yêu cầu lấy hàng', icon: '↑', subtitle: 'Đơn hàng > Yêu cầu lấy hàng' },
    { id: 'tracking', label: 'Tra cứu vận đơn', icon: '⌕', subtitle: 'Đơn hàng > Tra cứu vận đơn' },
    { id: 'change-requests', label: 'Yêu cầu đổi thông tin giao', icon: '✎', subtitle: 'Đơn hàng > Yêu cầu đổi thông tin' },
    { id: 'returns', label: 'Yêu cầu hoàn hàng', icon: '↩', subtitle: 'Đơn hàng > Yêu cầu hoàn hàng' },
    { id: 'print', label: 'In vận đơn', icon: '⎙', subtitle: 'Đơn hàng > In vận đơn' },
    { id: 'account', label: 'Tài khoản', icon: '◉', subtitle: 'Tài khoản > Hồ sơ merchant' },
    { id: 'notifications', label: 'Thông báo', icon: '◌', subtitle: 'Hệ thống > Thông báo' },
  ];

  const shipmentRows = useMemo(() => shipments.map((s) => extractShipmentRow(s)), [shipments]);
  const selectedShipment = useMemo(
    () => shipmentRows.find((r) => r.shipment.code === normalizeCode(selectedShipmentCode)) ?? null,
    [shipmentRows, selectedShipmentCode],
  );
  const changeShipmentPreview = useMemo(
    () => shipmentRows.find((r) => r.shipment.code === normalizeCode(changeCode)) ?? null,
    [shipmentRows, changeCode],
  );
  const printPreviewRow = useMemo(
    () => shipmentRows.find((r) => r.shipment.code === normalizeCode(printSingleCode)) ?? null,
    [shipmentRows, printSingleCode],
  );
  const printBulkPreviewRows = useMemo(() => {
    const codes = printBulkCodes
      .split(/[\s,;\n]+/)
      .map((code) => normalizeCode(code))
      .filter(Boolean);
    return codes
      .map((code) => shipmentRows.find((row) => row.shipment.code === code))
      .filter((row): row is ShipmentRow => Boolean(row));
  }, [shipmentRows, printBulkCodes]);
  const returnShipmentPreview = useMemo(
    () => shipmentRows.find((row) => row.shipment.code === normalizeCode(returnCode)) ?? null,
    [shipmentRows, returnCode],
  );
  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const autoEstimatedFee = useMemo(() => computeEstimatedFee(createForm), [createForm]);
  const effectiveFee = quotedFee ?? autoEstimatedFee;
  const hubLocationMap = useMemo(
    () => new Map(hubLocations.map((location) => [location.hubCode, location])),
    [hubLocations],
  );
  const provinceOptions = useMemo(
    () =>
      Array.from(new Set(hubLocations.map((location) => location.province))).sort((left, right) =>
        left.localeCompare(right, 'vi'),
      ),
    [hubLocations],
  );
  const lockedSenderHub = useMemo(() => {
    if (!session || hubLocations.length === 0) {
      return null;
    }

    const defaultHubByProfileCode = merchantProfileConfig?.defaultHubCode
      ? findHubByCode(hubLocations, merchantProfileConfig.defaultHubCode)
      : null;
    const defaultHubByAccountCode =
      session.user.hubCodes && session.user.hubCodes.length > 0
        ? findHubByCode(hubLocations, session.user.hubCodes[0] ?? '')
        : null;
    const defaultHubByRegion = merchantProfileConfig?.regionCode
      ? resolveHubByRegion(hubLocations, merchantProfileConfig.regionCode)
      : null;

    return defaultHubByProfileCode ?? defaultHubByAccountCode ?? defaultHubByRegion;
  }, [session, hubLocations, merchantProfileConfig]);
  const receiverHubOptions = useMemo(
    () =>
      hubLocations
        .filter((location) => location.province === createForm.receiverProvince)
        .sort((left, right) => left.label.localeCompare(right.label, 'vi')),
    [hubLocations, createForm.receiverProvince],
  );
  const selectedReceiverHub = useMemo(
    () =>
      resolveSelectedHub(
        hubLocations,
        createForm.receiverHubCode,
        createForm.receiverProvince,
        createForm.receiverWard,
      ),
    [
      hubLocations,
      createForm.receiverHubCode,
      createForm.receiverProvince,
      createForm.receiverWard,
    ],
  );
  const senderComposedAddress = useMemo(
    () =>
      [createForm.senderAddressDetail.trim(), createForm.senderWard, createForm.senderProvince]
        .filter(Boolean)
        .join(', '),
    [createForm.senderAddressDetail, createForm.senderWard, createForm.senderProvince],
  );
  const receiverComposedAddress = useMemo(
    () =>
      [createForm.receiverAddressDetail.trim(), createForm.receiverWard, createForm.receiverProvince]
        .filter(Boolean)
        .join(', '),
    [createForm.receiverAddressDetail, createForm.receiverWard, createForm.receiverProvince],
  );
  const codAmount = useMemo(
    () => Math.max(asNumber(createForm.codAmount, 0), 0),
    [createForm.codAmount],
  );

  const serviceOptions = useMemo(() => Array.from(new Set(shipmentRows.map((r) => r.serviceType).filter(Boolean))), [shipmentRows]);
  const regionOptions = useMemo(() => Array.from(new Set(shipmentRows.map((r) => r.receiverRegion).filter((r) => r && r !== '-'))), [shipmentRows]);
  const pickupByShipmentCode = useMemo(() => {
    const map = new Map<string, PickupRequest>();

    for (const pickup of pickups) {
      for (const item of pickup.items) {
        const shipmentCode = normalizeCode(item.shipmentCode);
        if (!shipmentCode || map.has(shipmentCode)) {
          continue;
        }

        map.set(shipmentCode, pickup);
      }
    }

    return map;
  }, [pickups]);
  const selectedPickupUpdatedAt = useMemo(
    () =>
      pickupByShipmentCode.get(normalizeCode(selectedShipmentCode))?.updatedAt ??
      '',
    [pickupByShipmentCode, selectedShipmentCode],
  );

  const filteredRows = useMemo(() => {
    const keyword = listSearch.trim().toLowerCase();
    return shipmentRows.filter((row) => {
      const created = new Date(row.shipment.createdAt);
      const textOk = !keyword || row.shipment.code.toLowerCase().includes(keyword) || row.receiverName.toLowerCase().includes(keyword) || row.receiverPhone.toLowerCase().includes(keyword);
      const statusOk =
        listStatus === 'ALL' ||
        resolveShipmentStatusCode(row.shipment) === listStatus;
      const serviceOk = listService === 'ALL' || row.serviceType === listService;
      const regionOk = listRegion === 'ALL' || row.receiverRegion === listRegion;
      const fromOk = !listFromDate || created >= new Date(`${listFromDate}T00:00:00`);
      const toOk = !listToDate || created <= new Date(`${listToDate}T23:59:59`);
      return textOk && statusOk && serviceOk && regionOk && fromOk && toOk;
    });
  }, [shipmentRows, listSearch, listStatus, listService, listRegion, listFromDate, listToDate, pickupByShipmentCode]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / SHIPMENT_PAGE_SIZE));
  const visibleRows = useMemo(() => filteredRows.slice((listPage - 1) * SHIPMENT_PAGE_SIZE, listPage * SHIPMENT_PAGE_SIZE), [filteredRows, listPage]);
  const recentRows = useMemo(() => shipmentRows.slice(0, 8), [shipmentRows]);
  const pickupRows = useMemo(() => pickups.filter((p) => (pickupStatusFilter === 'ALL' ? true : p.status === pickupStatusFilter)), [pickups, pickupStatusFilter]);
  const changeRows = useMemo(() => changeRequests.filter((c) => (changeStatusFilter === 'ALL' ? true : c.status === changeStatusFilter)), [changeRequests, changeStatusFilter]);
  const returnRows = useMemo(() => returnRequests.filter((r) => (returnStatusFilter === 'ALL' ? true : r.status === returnStatusFilter)), [returnRequests, returnStatusFilter]);

  function resolveShipmentStatusCode(shipment: ShipmentResponse): string {
    const normalizedCode = normalizeCode(shipment.code);
    if (
      pickupByShipmentCode.has(normalizedCode) &&
      (shipment.currentStatus === 'CREATED' || shipment.currentStatus === 'UPDATED')
    ) {
      return 'WAITING_PICKUP';
    }

    return shipment.currentStatus;
  }

  function resolveShipmentOriginHubCode(shipment: ShipmentResponse): string | null {
    const metadata = asRecord(shipment.metadata) ?? {};
    const sender = asRecord(metadata.sender);
    const routing = asRecord(metadata.routing);
    const rawHubCode =
      (typeof sender?.hubCode === 'string' && sender.hubCode.trim()) ||
      (typeof routing?.originHubCode === 'string' && routing.originHubCode.trim()) ||
      null;

    return rawHubCode ? rawHubCode.toUpperCase() : null;
  }

  function resolveShipmentStatusLabel(shipment: ShipmentResponse): string {
    const resolvedStatus = resolveShipmentStatusCode(shipment);

    if (resolvedStatus === 'WAITING_PICKUP') {
      return 'Chờ lấy hàng';
    }

    if (resolvedStatus === 'CREATED' || resolvedStatus === 'UPDATED') {
      return 'Đã tạo';
    }

    if (
      resolvedStatus === 'PICKUP_COMPLETED' ||
      resolvedStatus === 'PICKED_UP'
    ) {
      return 'Đã nhận hàng';
    }

    switch (resolvedStatus) {
      case 'IN_TRANSIT':
      case 'MANIFEST_SEALED':
      case 'MANIFEST_RECEIVED':
        return 'Đang luân chuyển';
      case 'SCAN_INBOUND':
        return 'Hàng đến';
      case 'OUT_FOR_DELIVERY':
        return 'Phát hàng';
      case 'DELIVERED':
        return 'Ký nhận';
      case 'DELIVERY_FAILED':
        return 'Ghi nhận vấn đề';
      default:
        return shipment.currentStatus;
    }
  }

  function resolveShipmentStatusClass(shipment: ShipmentResponse): string {
    return resolveShipmentStatusCode(shipment) === 'WAITING_PICKUP'
      ? statusClass('UPDATED')
      : statusClass(shipment.currentStatus);
  }

  function resolvePickupCancelBlockReason(pickup: PickupRequest): string | null {
    if (pickup.status !== 'REQUESTED') {
      return 'Chỉ pickup đang REQUESTED mới được hủy';
    }

    const shipmentByCode = new Map(
      shipmentRows.map((row) => [normalizeCode(row.shipment.code), row.shipment]),
    );
    const shipmentStatuses = pickup.items
      .map((item) => shipmentByCode.get(normalizeCode(item.shipmentCode))?.currentStatus)
      .filter((status): status is string => Boolean(status));

    const hasAssignedCourier = shipmentStatuses.some(
      (status) => status === 'TASK_ASSIGNED' || status === 'PICKUP_ASSIGNED',
    );
    if (hasAssignedCourier) {
      return 'Đơn đã được phân công courier đi lấy, không thể hủy pickup';
    }

    const hasReceivedAtHub = shipmentStatuses.some((status) =>
      ['PICKUP_COMPLETED', 'PICKED_UP', 'INBOUND_AT_HUB', 'SCAN_INBOUND'].includes(status),
    );
    if (hasReceivedAtHub) {
      return 'Đơn đã nhận từ courier tại bưu cục, không thể hủy pickup';
    }

    return null;
  }

  function buildFallbackTrackingSnapshot(code: string): {
    current: TrackingCurrent | null;
    timeline: TimelineEvent[];
  } {
    const normalizedCode = normalizeCode(code);
    const row =
      shipmentRows.find(
        (item) => normalizeCode(item.shipment.code) === normalizedCode,
      ) ?? null;

    if (!row) {
      return { current: null, timeline: [] };
    }

    const normalizedSenderHubCode =
      row.senderHubCode && row.senderHubCode !== '-' ? row.senderHubCode : null;
    const metadata = asRecord(row.shipment.metadata) ?? {};
    const senderMetadata = asRecord(metadata.sender);
    const createdBy = asRecord(metadata.createdBy);
    const createdByActor =
      typeof createdBy?.username === 'string' && createdBy.username.trim()
        ? createdBy.username.trim()
        : typeof metadata.createdByUsername === 'string' &&
            metadata.createdByUsername.trim()
          ? metadata.createdByUsername.trim()
          : row.senderName !== '-'
            ? row.senderName
            : null;
    const senderLocationText =
      typeof senderMetadata?.addressDetail === 'string' &&
      senderMetadata.addressDetail.trim()
        ? senderMetadata.addressDetail.trim()
        : row.senderAddress && row.senderAddress !== '-'
          ? row.senderAddress
          : null;

    const timeline: TimelineEvent[] = [
      {
        id: `${normalizedCode}-created`,
        eventTypeCode: 'shipment.created',
        eventType: 'Đơn hàng đã được tạo',
        shipmentCode: normalizedCode,
        actor: createdByActor,
        locationCode: normalizedSenderHubCode,
        locationText: senderLocationText,
        occurredAt: row.shipment.createdAt,
      },
    ];

    const pickup = pickupByShipmentCode.get(normalizedCode);
    if (pickup) {
      const pickupEventTypeByStatus: Record<PickupRequest['status'], string> = {
        REQUESTED: 'Đã yêu cầu lấy hàng',
        COMPLETED: 'Đã lấy hàng',
        CANCELLED: 'Yêu cầu lấy hàng đã hủy',
      };

      timeline.push({
        id: `${pickup.id}-pickup`,
        eventTypeCode: `pickup.${pickup.status.toLowerCase()}`,
        eventType: pickupEventTypeByStatus[pickup.status],
        shipmentCode: normalizedCode,
        actor: pickup.requesterName ?? null,
        locationCode: normalizedSenderHubCode,
        locationText: pickup.pickupAddress?.trim() || senderLocationText,
        occurredAt:
          pickup.completedAt ?? pickup.updatedAt ?? pickup.createdAt,
      });
    }

    const currentStatusCode = resolveShipmentStatusCode(row.shipment);
    const currentStatusLabel = resolveShipmentStatusLabel(row.shipment);

    if (
      currentStatusCode !== 'CREATED' &&
      currentStatusCode !== 'UPDATED' &&
      currentStatusCode !== 'WAITING_PICKUP'
    ) {
      timeline.push({
        id: `${row.shipment.id}-status-${currentStatusCode}`,
        eventTypeCode: currentStatusCode,
        eventType: currentStatusLabel,
        shipmentCode: normalizedCode,
        actor: null,
        locationCode:
          row.receiverHubCode && row.receiverHubCode !== '-'
            ? row.receiverHubCode
            : normalizedSenderHubCode,
        occurredAt: row.shipment.updatedAt,
      });
    } else if (!pickup) {
      timeline.push({
        id: `${row.shipment.id}-waiting-pickup`,
        eventTypeCode: 'pickup.requested',
        eventType: 'Đang chờ lấy hàng',
        shipmentCode: normalizedCode,
        actor: null,
        locationCode: normalizedSenderHubCode,
        locationText: senderLocationText,
        occurredAt: row.shipment.updatedAt,
      });
    }

    timeline.sort(
      (left, right) =>
        new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime(),
    );

    const latest = timeline[timeline.length - 1] ?? null;
    const current: TrackingCurrent = {
      shipmentCode: normalizedCode,
      currentStatusCode,
      currentStatus: currentStatusLabel,
      currentLocationCode:
        latest?.locationCode ?? normalizedSenderHubCode ?? null,
      currentLocationText:
        latest?.locationText ?? senderLocationText ?? null,
      lastEventTypeCode: latest?.eventTypeCode ?? null,
      lastEventType: latest?.eventType ?? null,
      lastEventAt: latest?.occurredAt ?? row.shipment.updatedAt,
    };

    return { current, timeline };
  }

  const dashboardStats = useMemo(
    () => ({
      totalToday: shipments.filter((s) => isToday(s.createdAt)).length,
      waitingPickup: shipments.filter((s) => resolveShipmentStatusCode(s) === 'WAITING_PICKUP').length,
      inTransit: shipments.filter((s) => ['PICKUP_COMPLETED', 'TASK_ASSIGNED', 'MANIFEST_SEALED', 'MANIFEST_RECEIVED', 'MANIFEST_UNSEALED', 'SEND_GOODS', 'SCAN_INBOUND', 'SCAN_OUTBOUND'].includes(s.currentStatus)).length,
      delivered: shipments.filter((s) => s.currentStatus === 'DELIVERED').length,
      failedOrReturn: shipments.filter((s) => ['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED', 'RETURN_COMPLETED', 'CANCELLED'].includes(s.currentStatus)).length,
    }),
    [shipments, pickupByShipmentCode],
  );

  useEffect(() => setListPage(1), [listSearch, listStatus, listService, listRegion, listFromDate, listToDate]);

  useEffect(() => {
    if (!selectedShipment) return;
    setDetailReceiverPhone(selectedShipment.receiverPhone === '-' ? '' : selectedShipment.receiverPhone);
    setDetailReceiverAddress(selectedShipment.receiverAddress === '-' ? '' : selectedShipment.receiverAddress);
    setDetailDeliveryNote(selectedShipment.deliveryNote === '-' ? '' : selectedShipment.deliveryNote);
  }, [selectedShipment?.shipment.code, selectedShipment?.shipment.updatedAt]);

  useEffect(() => {
    if (!session || !lockedSenderHub) {
      return;
    }

    const defaultSenderName = session.user.displayName?.trim() ?? '';
    const defaultSenderPhone = session.user.phone?.trim() ?? '';
    const defaultAddressDetail =
      merchantProfileConfig?.businessAddressDetail?.trim() ?? '';
    const defaultAddress =
      merchantProfileConfig?.defaultSenderAddress?.trim() ?? '';

    setCreateForm((previous) => {
      const next = { ...previous };
      let hasChanges = false;

      if (!next.senderName.trim() && defaultSenderName) {
        next.senderName = defaultSenderName;
        hasChanges = true;
      }
      if (!next.senderPhone.trim() && defaultSenderPhone) {
        next.senderPhone = defaultSenderPhone;
        hasChanges = true;
      }
      if (next.senderProvince !== lockedSenderHub.province) {
        next.senderProvince = lockedSenderHub.province;
        hasChanges = true;
      }
      if (next.senderWard !== lockedSenderHub.ward) {
        next.senderWard = lockedSenderHub.ward;
        hasChanges = true;
      }
      if (next.senderHubCode !== lockedSenderHub.hubCode) {
        next.senderHubCode = lockedSenderHub.hubCode;
        hasChanges = true;
      }
      if (!next.senderAddressDetail.trim() && (defaultAddressDetail || defaultAddress)) {
        next.senderAddressDetail = defaultAddressDetail || defaultAddress;
        hasChanges = true;
      }
      if (!next.senderAddress.trim()) {
        const composedAddress = [
          next.senderAddressDetail.trim(),
          next.senderWard,
          next.senderProvince,
        ]
          .filter(Boolean)
          .join(', ');
        if (composedAddress) {
          next.senderAddress = composedAddress;
          hasChanges = true;
        }
      }

      return hasChanges ? next : previous;
    });

    setPickupRequesterName((previous) =>
      previous.trim() ? previous : defaultSenderName || session.user.username,
    );
    setPickupContactPhone((previous) =>
      previous.trim() ? previous : defaultSenderPhone,
    );
    setPickupAddress((previous) =>
      previous.trim()
        ? previous
        : defaultAddress || lockedSenderHub.fullAddress || '',
    );
    setProfile((previous) => {
      const nextProfile = {
        ...previous,
        // Keep account view aligned with admin-managed auth data.
        shopName: defaultSenderName || previous.shopName,
        contactPhone: defaultSenderPhone || previous.contactPhone,
        defaultPickupAddress:
          defaultAddress ||
          previous.defaultPickupAddress ||
          lockedSenderHub.fullAddress,
      };

      if (
        nextProfile.shopName === previous.shopName &&
        nextProfile.contactPhone === previous.contactPhone &&
        nextProfile.defaultPickupAddress === previous.defaultPickupAddress
      ) {
        return previous;
      }

      return nextProfile;
    });
  }, [
    session,
    lockedSenderHub,
    merchantProfileConfig,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedDrafts = parseStorage<ShipmentDraft[]>(
      window.localStorage.getItem(STORAGE_KEY_DRAFTS),
      [],
    );
    setDrafts(
      storedDrafts.map((draft) => ({
        ...draft,
        form: normalizeCreateForm(draft.form),
      })),
    );
    setNotifications(parseStorage(window.localStorage.getItem(STORAGE_KEY_NOTIFICATIONS), []));
    setReturnRequests(parseStorage(window.localStorage.getItem(STORAGE_KEY_RETURNS), []));
    // Legacy shared profile key caused data leakage between merchant accounts.
    window.localStorage.removeItem(STORAGE_KEY_PROFILE);

    const storedSession = parseStorage<MerchantSession | null>(window.localStorage.getItem(STORAGE_KEY_SESSION), null);
    if (!storedSession) {
      setBooting(false);
      return;
    }

    (async () => {
      try {
        const introspect = await request<IntrospectResponse>('/merchant/auth/auth/introspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: storedSession.accessToken }),
        });

        if (!introspect.active || !introspect.user) {
          window.localStorage.removeItem(STORAGE_KEY_SESSION);
          setSession(null);
          setBooting(false);
          return;
        }

        const nextSession: MerchantSession = {
          ...storedSession,
          user: introspect.user,
          accessTokenExpiresAt: introspect.accessTokenExpiresAt ?? storedSession.accessTokenExpiresAt,
        };

        setSession(nextSession);
        await refreshAllData(nextSession.accessToken, nextSession.user);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY_SESSION);
        setSession(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY_SESSION);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY_RETURNS, JSON.stringify(returnRequests));
  }, [returnRequests]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!session) {
      setProfile(DEFAULT_PROFILE);
      return;
    }

    const profileStorageKey = buildProfileStorageKey(session.user.username);
    const storedProfile = parseStorage<MerchantProfile>(
      window.localStorage.getItem(profileStorageKey),
      DEFAULT_PROFILE,
    );
    setProfile({
      ...DEFAULT_PROFILE,
      ...storedProfile,
    });
  }, [session?.user.username]);

  useEffect(() => {
    if (typeof window === 'undefined' || !session) return;
    const profileStorageKey = buildProfileStorageKey(session.user.username);
    window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  }, [profile, session?.user.username]);

  useEffect(() => {
    if (!session || !selectedShipmentCode || activeView !== 'shipment-detail') return;
    void loadDetailTracking(selectedShipmentCode);
  }, [
    session?.accessToken,
    selectedShipmentCode,
    activeView,
    selectedShipment?.shipment.updatedAt,
    selectedPickupUpdatedAt,
  ]);

  function pushNotification(level: NotificationItem['level'], title: string, description: string): void {
    setNotifications((prev) => [{ id: generateLocalId('notify'), level, title, description, createdAt: new Date().toISOString(), read: false }, ...prev].slice(0, 120));
  }

  function upsertShipment(shipment: ShipmentResponse): void {
    if (!session || !isShipmentOwnedByUser(shipment, session.user)) {
      return;
    }

    setShipments((prev) => {
      const idx = prev.findIndex((item) => item.code === shipment.code);
      if (idx === -1) return [shipment, ...prev];
      const next = [...prev];
      next[idx] = shipment;
      return next;
    });
  }

  async function refreshAllData(
    accessToken: string,
    user: MerchantSession['user'],
  ): Promise<void> {
    setDataLoading(true);
    setDataError(null);
    const merchantProfileKey = buildMerchantProfileKey(user.username);
    const [shipRes, pickupRes, changeRes, hubsRes, profileRes] = await Promise.allSettled([
      request<ShipmentResponse[]>('/merchant/shipment/shipments', { method: 'GET' }, accessToken),
      request<PickupRequest[]>('/merchant/pickup/pickups', { method: 'GET' }, accessToken),
      request<ChangeRequest[]>('/merchant/shipment/change-requests', { method: 'GET' }, accessToken),
      request<HubApiRecord[]>('/merchant/masterdata/hubs?isActive=true', { method: 'GET' }, accessToken),
      request<ConfigApiRecord[]>(
        `/merchant/masterdata/configs?scope=${encodeURIComponent(MERCHANT_PROFILE_SCOPE)}&key=${encodeURIComponent(merchantProfileKey)}`,
        { method: 'GET' },
        accessToken,
      ),
    ]);

    const ownedShipments =
      shipRes.status === 'fulfilled'
        ? shipRes.value.filter((shipment) => isShipmentOwnedByUser(shipment, user))
        : [];

    if (shipRes.status === 'fulfilled') {
      setShipments(ownedShipments);
    }
    if (pickupRes.status === 'fulfilled') {
      setPickups(filterPickupRequestsByUser(pickupRes.value, ownedShipments, user));
    }
    if (changeRes.status === 'fulfilled') setChangeRequests(changeRes.value);
    if (hubsRes.status === 'fulfilled') {
      const locations = hubsRes.value
        .filter((hub) => hub.isActive)
        .map(parseHubLocation)
        .filter((location): location is HubLocationOption => Boolean(location))
        .sort((left, right) => left.label.localeCompare(right.label, 'vi'));
      setHubLocations(locations);
    } else {
      setHubLocations([]);
    }
    if (profileRes.status === 'fulfilled') {
      const resolvedProfile = parseMerchantProfileConfig(profileRes.value, user.username);
      setMerchantProfileConfig(resolvedProfile);
    } else {
      setMerchantProfileConfig(null);
    }

    if (shipRes.status === 'rejected') setDataError(extractErrorMessage(shipRes.reason));
    if (hubsRes.status === 'rejected') {
      setDataError((previous) => previous ?? extractErrorMessage(hubsRes.reason));
    }
    setDataLoading(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const result = await request<LoginResponse>('/merchant/auth/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      const nextSession: MerchantSession = {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        accessTokenExpiresAt: result.tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: result.tokens.refreshTokenExpiresAt,
      };
      setSession(nextSession);
      await refreshAllData(nextSession.accessToken, nextSession.user);
      setActiveView('dashboard');
      pushNotification('success', 'Đăng nhập thành công', `Xin chào ${nextSession.user.username}`);
    } catch (error) {
      setLoginError(extractErrorMessage(error));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout(): Promise<void> {
    if (!session) return;
    try {
      await request('/merchant/auth/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.accessToken, refreshToken: session.refreshToken }),
      });
    } catch {
      // ignore
    }
    setSession(null);
    setShipments([]);
    setPickups([]);
    setChangeRequests([]);
    setHubLocations([]);
    setMerchantProfileConfig(null);
    setActiveView('dashboard');
  }

  async function createPickupForShipment(code: string, note: string): Promise<PickupRequest> {
    if (!session) throw new Error('Session is required');
    const normalizedShipmentCode = normalizeCode(code);
    const existingPickup = pickupByShipmentCode.get(normalizedShipmentCode);
    if (existingPickup) {
      throw new Error(
        `Shipment ${normalizedShipmentCode} đã có pickup ${existingPickup.pickupCode}.`,
      );
    }

    const pickup = await request<PickupRequest>('/merchant/pickup/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupCode: generatePickupCode(),
        requesterName: pickupRequesterName.trim() || createForm.senderName.trim() || session.user.username,
        contactPhone: pickupContactPhone.trim() || createForm.senderPhone.trim() || profile.contactPhone || null,
        pickupAddress: pickupAddress.trim() || senderComposedAddress || profile.defaultPickupAddress || null,
        note: `${note} | desired=${pickupDesiredTime || 'N/A'}`,
        items: [{ shipmentCode: normalizedShipmentCode, quantity: 1 }],
      }),
    }, session.accessToken);
    setPickups((prev) => [pickup, ...prev]);
    return pickup;
  }

  async function submitCreateShipment(withPickup: boolean): Promise<void> {
    if (!session) return;
    if (hubLocations.length === 0) {
      setCreateError('Chưa có hub hoạt động. Vui lòng cấu hình hub ở trang Admin.');
      return;
    }

    if (!createForm.senderAddressDetail.trim()) {
      setCreateError('Vui lòng nhập địa chỉ chi tiết người gửi.');
      return;
    }
    if (!createForm.receiverAddressDetail.trim()) {
      setCreateError('Vui lòng nhập địa chỉ chi tiết người nhận.');
      return;
    }

    const senderHub = lockedSenderHub;
    if (!senderHub) {
      setCreateError('Tài khoản merchant chưa được admin gán khu vực/bưu cục gửi. Vui lòng liên hệ admin.');
      return;
    }

    const receiverHub = resolveSelectedHub(
      hubLocations,
      createForm.receiverHubCode,
      createForm.receiverProvince,
      createForm.receiverWard,
    );
    if (!receiverHub) {
      setCreateError('Vui lòng chọn bưu cục nhận.');
      return;
    }
    if (receiverHub.province !== createForm.receiverProvince) {
      setCreateError('Bưu cục nhận không thuộc khu vực đã chọn.');
      return;
    }

    const normalizedForm: CreateShipmentForm = {
      ...createForm,
      senderProvince: senderHub.province,
      senderWard: senderHub.ward,
      senderHubCode: senderHub.hubCode,
      receiverProvince: receiverHub.province,
      receiverWard: receiverHub.ward,
      receiverHubCode: receiverHub.hubCode,
      senderAddress: [
        createForm.senderAddressDetail.trim(),
        senderHub.ward,
        senderHub.province,
      ]
        .filter(Boolean)
        .join(', '),
      receiverAddress: [
        createForm.receiverAddressDetail.trim(),
        receiverHub.ward,
        receiverHub.province,
      ]
        .filter(Boolean)
        .join(', '),
      receiverRegion: receiverHub.province,
    };

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const payload: Record<string, unknown> = {
        metadata: buildShipmentMetadata(normalizedForm, effectiveFee, {
          username: session.user.username,
          userId: session.user.id,
        }),
      };

      const created = await request<ShipmentResponse>('/merchant/shipment/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, session.accessToken);

      const clientMetadataFallback = asRecord(payload.metadata) ?? {};
      const createdMetadata = {
        ...clientMetadataFallback,
        ...(asRecord(created.metadata) ?? {}),
      };
      const createdForUi: ShipmentResponse = {
        ...created,
        metadata: createdMetadata,
      };

      upsertShipment(createdForUi);
      setSelectedShipmentCode(createdForUi.code);
      setCreateSuccess(`Đã tạo shipment ${createdForUi.code}`);
      if (withPickup) {
        const pickup = await createPickupForShipment(
          createdForUi.code,
          `auto pickup ${createdForUi.code}`,
        );
        setCreateSuccess(`Đã tạo shipment ${createdForUi.code} và pickup ${pickup.pickupCode}`);
      }
      setCreateForm({
        ...DEFAULT_CREATE_FORM,
        senderName: normalizedForm.senderName,
        senderPhone: normalizedForm.senderPhone,
        senderProvince: senderHub.province,
        senderWard: senderHub.ward,
        senderHubCode: senderHub.hubCode,
        senderAddressDetail: normalizedForm.senderAddressDetail,
        senderAddress: [
          normalizedForm.senderAddressDetail.trim(),
          senderHub.ward,
          senderHub.province,
        ]
          .filter(Boolean)
          .join(', '),
      });
      setQuotedFee(null);
      setActiveView('shipment-detail');
    } catch (error) {
      setCreateError(extractErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  }

  async function fetchShipmentByCode(code: string): Promise<ShipmentResponse> {
    if (!session) throw new Error('Session is required');
    const shipment = await request<ShipmentResponse>(`/merchant/shipment/shipments/${encodeURIComponent(normalizeCode(code))}`, { method: 'GET' }, session.accessToken);
    if (!isShipmentOwnedByUser(shipment, session.user)) {
      throw new Error('Bạn không có quyền xem shipment này.');
    }
    upsertShipment(shipment);
    return shipment;
  }

  async function openShipmentDetail(code: string): Promise<void> {
    const normalized = normalizeCode(code);
    if (!normalized) return;
    setSelectedShipmentCode(normalized);
    setActiveView('shipment-detail');
    if (!shipments.some((item) => item.code === normalized)) {
      try {
        await fetchShipmentByCode(normalized);
      } catch (error) {
        pushNotification('error', 'Không tải được shipment', extractErrorMessage(error));
      }
    }
  }

  async function cancelShipment(code: string, reason: string): Promise<void> {
    if (!session) return;
    const cancelled = await request<ShipmentResponse>(`/merchant/shipment/shipments/${encodeURIComponent(normalizeCode(code))}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() || null }),
    }, session.accessToken);
    upsertShipment(cancelled);
    setSelectedShipmentCode(cancelled.code);
  }

  async function loadDetailTracking(code: string): Promise<void> {
    if (!session) return;
    setDetailTrackError(null);
    const result = await fetchTrackingSnapshot(code);
    setDetailTrackCurrent(result.current);
    setDetailTrackTimeline(result.timeline);
    setDetailTrackError(result.error);
  }

  async function fetchTrackingSnapshot(code: string): Promise<{
    current: TrackingCurrent | null;
    timeline: TimelineEvent[];
    error: string | null;
  }> {
    if (!session) {
      return {
        current: null,
        timeline: [],
        error: 'Session is required',
      };
    }

    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      return {
        current: null,
        timeline: [],
        error: 'Cần nhập shipment code',
      };
    }

    const [currentRes, timelineRes] = await Promise.allSettled([
      request<TrackingCurrent>(
        `/merchant/tracking/tracking/${encodeURIComponent(normalizedCode)}/current`,
        { method: 'GET' },
        session.accessToken,
      ),
      request<TimelineEvent[]>(
        `/merchant/tracking/tracking/${encodeURIComponent(normalizedCode)}/timeline`,
        { method: 'GET' },
        session.accessToken,
      ),
    ]);

    if (currentRes.status === 'fulfilled' || timelineRes.status === 'fulfilled') {
      return {
        current: currentRes.status === 'fulfilled' ? currentRes.value : null,
        timeline: timelineRes.status === 'fulfilled' ? timelineRes.value : [],
        error: null,
      };
    }

    const internalErrors = [
      currentRes.status === 'rejected'
        ? extractErrorMessage(currentRes.reason)
        : null,
      timelineRes.status === 'rejected'
        ? extractErrorMessage(timelineRes.reason)
        : null,
    ].filter((message): message is string => Boolean(message));

    try {
      const publicSnapshot = await request<PublicTrackingSnapshotResponse>(
        `/public/tracking/public/track/${encodeURIComponent(normalizedCode)}`,
        { method: 'GET' },
        session.accessToken,
      );

      if (publicSnapshot.current || publicSnapshot.timeline.length > 0) {
        return {
          current: publicSnapshot.current,
          timeline: publicSnapshot.timeline,
          error: null,
        };
      }
    } catch (publicError) {
      internalErrors.push(extractErrorMessage(publicError));
    }

    const fallback = buildFallbackTrackingSnapshot(normalizedCode);
    if (fallback.current || fallback.timeline.length > 0) {
      return {
        current: fallback.current,
        timeline: fallback.timeline,
        error: null,
      };
    }

    return {
      current: null,
      timeline: [],
      error: internalErrors.join(' | '),
    };
  }

  async function saveDetailUpdate(): Promise<void> {
    if (!session || !selectedShipment) return;
    setDetailUpdating(true);
    setDetailError(null);
    setDetailSuccess(null);
    try {
      const metadata = asRecord(selectedShipment.shipment.metadata) ?? {};
      const receiver = asRecord(metadata.receiver) ?? {};
      const updated = await request<ShipmentResponse>(`/merchant/shipment/shipments/${encodeURIComponent(selectedShipment.shipment.code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            receiver: {
              ...receiver,
              phone: detailReceiverPhone.trim() || null,
              address: detailReceiverAddress.trim() || null,
            },
            deliveryNote: detailDeliveryNote.trim() || null,
          },
        }),
      }, session.accessToken);
      upsertShipment(updated);
      setDetailSuccess(`Đã cập nhật ${updated.code}`);
    } catch (error) {
      setDetailError(extractErrorMessage(error));
    } finally {
      setDetailUpdating(false);
    }
  }

  async function submitPickupRequest(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    if (!session) return;
    setPickupLoading(true);
    setPickupMessage(null);
    try {
      const codes = Array.from(new Set(pickupShipmentCodes.split(/[\s,;\n]+/).map((item) => normalizeCode(item)).filter(Boolean)));
      if (codes.length === 0) throw new Error('Cần ít nhất 1 shipment code');
      const pickup = await request<PickupRequest>('/merchant/pickup/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupCode: generatePickupCode(),
          requesterName: pickupRequesterName.trim() || session.user.username,
          contactPhone: pickupContactPhone.trim() || null,
          pickupAddress: pickupAddress.trim() || profile.defaultPickupAddress || null,
          note: `${pickupNote.trim()} | desired=${pickupDesiredTime || 'N/A'}`,
          items: codes.map((shipmentCode) => ({ shipmentCode, quantity: 1 })),
        }),
      }, session.accessToken);
      setPickups((prev) => [pickup, ...prev]);
      setPickupShipmentCodes('');
      setPickupMessage(`Đã tạo pickup ${pickup.pickupCode}`);
    } catch (error) {
      setPickupMessage(extractErrorMessage(error));
    } finally {
      setPickupLoading(false);
    }
  }

  async function lookupTracking(
    event?: FormEvent<HTMLFormElement>,
    requestedCode?: string,
  ): Promise<void> {
    event?.preventDefault();
    if (!session) return;
    setTrackingLoading(true);
    setTrackingError(null);
    const code = normalizeCode(requestedCode ?? trackingCode);
    const result = await fetchTrackingSnapshot(code);
    setTrackingCurrent(result.current);
    setTrackingTimeline(result.timeline);
    setTrackingError(result.error);
    setTrackingLoading(false);
  }

  async function quickTrackFromDashboard(
    event?: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event?.preventDefault();
    const code = normalizeCode(dashboardSearchCode);
    if (!code) {
      setTrackingCurrent(null);
      setTrackingTimeline([]);
      setTrackingError('Cần nhập shipment code');
      setActiveView('tracking');
      return;
    }

    setTrackingCode(code);
    setActiveView('tracking');
    await lookupTracking(undefined, code);
  }

  async function submitChangeRequest(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    if (!session) return;
    setChangeLoading(true);
    setChangeMessage(null);
    try {
      const code = normalizeCode(changeCode);
      if (!code || !changeValue.trim()) throw new Error('Cần mã shipment và nội dung thay đổi');
      const created = await request<ChangeRequest>('/merchant/shipment/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentCode: code, requestType: changeType, payload: { value: changeValue.trim() }, requestedBy: session.user.username }),
      }, session.accessToken);
      setChangeRequests((prev) => [created, ...prev]);
      setChangeMessage(`Đã tạo yêu cầu ${created.id}`);
      setChangeValue('');
    } catch (error) {
      setChangeMessage(extractErrorMessage(error));
    } finally {
      setChangeLoading(false);
    }
  }

  function createReturnRequest(event?: FormEvent<HTMLFormElement>): void {
    event?.preventDefault();
    const code = normalizeCode(returnCode);
    if (!code) return;
    setReturnRequests((prev) => [{ id: generateLocalId('return'), shipmentCode: code, reason: returnReason.trim() || 'Khách từ chối nhận hàng', expectedReturnAt: returnExpectedDate, status: 'PENDING', createdAt: new Date().toISOString() }, ...prev]);
    setReturnCode('');
    setReturnReason('');
    setReturnNotes('');
  }

  function saveDraft(): void {
    setDrafts((prev) => [{ id: generateLocalId('draft'), createdAt: new Date().toISOString(), name: draftName.trim() || `Draft ${new Date().toLocaleString()}`, quoteFee: effectiveFee, form: createForm }, ...prev].slice(0, 50));
    setDraftName('');
  }

  function printShipment(row: ShipmentRow): void {
    const readText = (value: unknown, fallback = ''): string => {
      if (typeof value !== 'string') {
        return fallback;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : fallback;
    };
    const compactCode = (value: string, fallback: string): string => {
      const normalized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      return normalized.length > 0 ? normalized.slice(0, 9) : fallback;
    };

    const metadata = asRecord(row.shipment.metadata);
    const senderMeta = asRecord(metadata?.sender);
    const receiverMeta = asRecord(metadata?.receiver);
    const routingMeta = asRecord(metadata?.routing);

    const senderHubCode = readText(senderMeta?.hubCode);
    const receiverHubCode = readText(receiverMeta?.hubCode);
    const originHubCode = readText(routingMeta?.originHubCode);
    const destinationHubCode = readText(routingMeta?.destinationHubCode);

    const routeMainCode =
      receiverHubCode ||
      destinationHubCode ||
      senderHubCode ||
      originHubCode ||
      readText(row.receiverRegion, 'HUB-NA');

    const zoneCode = readText(row.receiverRegion, 'ZONE-NA');
    const routeTag = compactCode(
      receiverHubCode || destinationHubCode || zoneCode,
      'ROUTE',
    );
    const sortCode = [
      `Hub đích: ${receiverHubCode || destinationHubCode || 'N/A'}`,
      `Khu vực: ${zoneCode || 'N/A'}`,
    ].join('\n');
    const deliveryInstruction =
      row.deliveryNote && row.deliveryNote !== '-'
        ? row.deliveryNote
        : 'Gọi trước khi giao. Không cho thử hàng.';
    const parcelNote = [
      `Loại hàng: ${row.itemType}`,
      `Khối lượng: ${row.weightKg} kg`,
      `COD: ${formatCurrency(row.codAmount)}`,
    ].join(' | ');

    const opened = openShippingLabelPrint({
      brandName: 'NEXUS LOGISTICS',
      serviceName: row.serviceType || 'STANDARD',
      shipmentCode: row.shipment.code,
      senderName: row.senderName,
      senderPhone: row.senderPhone,
      senderAddress: row.senderAddress,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      receiverAddress: row.receiverAddress,
      hubCode: routeMainCode,
      zoneCode,
      itemDescription: row.itemType,
      parcelNote,
      qrValue: row.shipment.code,
      routeTag,
      sortCode,
      codAmountText: formatCurrency(row.codAmount),
      createdAtText: formatDate(row.shipment.createdAt),
      deliveryInstruction,
      hotlineText: 'Hotline vận hành: 1900-1234',
    });

    if (!opened) {
      setPrintMessage('Trình duyệt đang chặn popup in. Hãy cho phép popup rồi thử lại.');
    }
  }

  function downloadCsv(): void {
    const header = ['tracking_code', 'receiver_name', 'receiver_phone', 'status', 'cod', 'fee', 'created_at'];
    const rows = shipmentRows.map((row) => [row.shipment.code, row.receiverName, row.receiverPhone, resolveShipmentStatusLabel(row.shipment), row.codAmount, row.feeEstimate, row.shipment.createdAt]);
    const csv = [header, ...rows].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shipments-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (booting) {
    return <div className="login-shell"><div className="login-card"><h1 className="brand-title">Merchant Console</h1><p className="muted">Đang khởi tạo...</p></div></div>;
  }

  if (!session) {
    return (
      <div className="login-shell">
        <div className="login-layout">
          <section className="login-hero">
            <div className="login-hero-top">
              <p className="login-kicker">NEXUS Logistic</p>
              <h1 className="brand-title">Merchant Portal</h1>
            </div>
            <div className="login-hero-copy">
              <h2 className="login-hero-title">Nền tảng logistics hiện đại cho merchant.</h2>
              <p className="login-hero-text">Theo dõi shipment, tạo yêu cầu lấy hàng và vận hành trên cùng một giao diện thống nhất.</p>
            </div>
            <div className="login-hero-stats">
              <div className="login-stat"><strong>10k+</strong><span>Merchant đang hoạt động</span></div>
              <div className="login-stat"><strong>24/7</strong><span>Hỗ trợ vận hành</span></div>
            </div>
          </section>
        <div className="login-card grid">
          <h1 className="brand-title">Merchant Login</h1>
          <p className="muted">Đăng nhập để vào dashboard merchant.</p>
          <form className="grid" onSubmit={handleLogin}>
            <input className="input" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="Tài khoản" />
            <input className="input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Mật khẩu" />
            <button className="btn btn-primary" type="submit" disabled={loginLoading}>{loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
          </form>
          {loginError ? <p className="message error">{loginError}</p> : null}
          <div className="login-footer"><span>NEXUS Merchant Workspace</span><span>Secure access</span></div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--stitch">
      <aside className="sidebar sidebar--stitch">
        <div className="brand-lockup brand-lockup--stitch"><h2 className="brand-title">NEXUS Logistic</h2><p className="brand-subtitle">Merchant Portal</p></div>
        <nav className="nav-list nav-list--stitch">{navItems.map((item) => <button key={item.id} className={`nav-btn nav-btn--stitch ${activeView === item.id ? 'active' : ''}`} onClick={() => setActiveView(item.id)}><span className="nav-btn__main"><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></span>{item.id === 'notifications' && unreadNotifications > 0 ? <span className="nav-counter">{unreadNotifications}</span> : null}</button>)}</nav>
        <div className="sidebar-actions sidebar-actions--stitch"><button className="btn btn-secondary sidebar-action" onClick={() => void refreshAllData(session.accessToken, session.user)} disabled={dataLoading}>{dataLoading ? 'Đang tải lại...' : 'Tải lại'}</button><button className="btn btn-danger sidebar-action" onClick={() => void handleLogout()}>Đăng xuất</button></div>
      </aside>

      <div className="main">
        <header className="topbar topbar--stitch"><div className="topbar-shell-copy"><strong className="topbar-title">{navItems.find((i) => i.id === activeView)?.label}</strong><div className="topbar-breadcrumb muted">{navItems.find((i) => i.id === activeView)?.subtitle}</div></div><div className="topbar-compact-actions"><input className="input topbar-search-input" placeholder="Tìm kiếm nhanh..." /><div className="topbar-icon-group"><span className="topbar-icon">?</span><span className="topbar-icon">⚙</span><span className="topbar-avatar">{(session.user.username ?? 'M').slice(0, 1).toUpperCase()}</span></div></div></header>
        <main className={`content ${activeView === 'change-requests' ? 'content--change' : ''} ${activeView === 'print' ? 'content--print' : ''} ${activeView === 'returns' ? 'content--returns' : ''} ${activeView === 'account' ? 'content--account' : ''}`}>
          {dataError ? <p className="message error">{dataError}</p> : null}

          {activeView === 'dashboard' ? <><section className="card"><h3>Tổng quan</h3><div className="metric-grid"><div className="metric"><div className="metric-title">Tổng số đơn hôm nay</div><div className="metric-value">{dashboardStats.totalToday}</div></div><div className="metric"><div className="metric-title">Đơn chờ pickup</div><div className="metric-value">{dashboardStats.waitingPickup}</div></div><div className="metric"><div className="metric-title">Đơn đang giao</div><div className="metric-value">{dashboardStats.inTransit}</div></div><div className="metric"><div className="metric-title">Đơn giao thành công</div><div className="metric-value">{dashboardStats.delivered}</div></div><div className="metric"><div className="metric-title">Thất bại / hoàn</div><div className="metric-value">{dashboardStats.failedOrReturn}</div></div></div></section><section className="card"><h3>Tìm nhanh theo mã vận đơn</h3><form className="btn-row" onSubmit={(e) => { void quickTrackFromDashboard(e); }}><input className="input" style={{ maxWidth: 320 }} value={dashboardSearchCode} onChange={(e) => setDashboardSearchCode(e.target.value)} placeholder="SHP..." /><button className="btn btn-primary" type="submit">Tra cứu vận đơn</button></form></section><section className="card"><h3>Đơn mới tạo gần đây</h3>{recentRows.length === 0 ? <div className="empty">Chưa có đơn hàng.</div> : <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Người nhận</th><th>SĐT</th><th>Trạng thái</th><th>Ngày tạo</th><th>Xem</th></tr></thead><tbody>{recentRows.map((row) => <tr key={row.shipment.id}><td>{row.shipment.code}</td><td>{row.receiverName}</td><td>{row.receiverPhone}</td><td><span className={resolveShipmentStatusClass(row.shipment)}>{resolveShipmentStatusLabel(row.shipment)}</span></td><td>{formatDate(row.shipment.createdAt)}</td><td><button className="btn btn-ghost" onClick={() => { void openShipmentDetail(row.shipment.code); }}>Xem</button></td></tr>)}</tbody></table></div>}</section></> : null}

          {activeView === 'create-shipment' ? (
            <section className="split-layout">
              <div className="card grid">
                <h3>{'T\u1ea1o \u0111\u01a1n h\u00e0ng'}</h3>
                {hubLocations.length === 0 ? (
                  <p className="message error">
                    {'Ch\u01b0a c\u00f3 hub h\u1ee3p l\u1ec7. Admin c\u1ea7n t\u1ea1o hub tr\u01b0\u1edbc \u0111\u1ec3 merchant ch\u1ecdn \u0111\u1ecba ch\u1ec9 g\u1eedi/nh\u1eadn.'}
                  </p>
                ) : null}
                {hubLocations.length > 0 && !lockedSenderHub ? (
                  <p className="message error">
                    {'T\u00e0i kho\u1ea3n n\u00e0y ch\u01b0a \u0111\u01b0\u1ee3c admin g\u00e1n khu v\u1ef1c/b\u01b0u c\u1ee5c g\u1eedi. Vui l\u00f2ng li\u00ean h\u1ec7 admin \u0111\u1ec3 c\u1eadp nh\u1eadt.'}
                  </p>
                ) : null}
                <div className="grid grid-4">
                  <input
                    className="input"
                    placeholder={'T\u00ean ng\u01b0\u1eddi g\u1eedi'}
                    value={createForm.senderName}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        senderName: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="input"
                    placeholder={'S\u0110T ng\u01b0\u1eddi g\u1eedi'}
                    value={createForm.senderPhone}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        senderPhone: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="input"
                    value={lockedSenderHub?.province ?? createForm.senderProvince}
                    readOnly
                    disabled
                    placeholder={'Khu v\u1ef1c g\u1eedi do admin c\u1ea5u h\u00ecnh'}
                  />
                  <input
                    className="input"
                    value={
                      lockedSenderHub
                        ? `${lockedSenderHub.hubCode} - ${lockedSenderHub.hubName}`
                        : createForm.senderHubCode
                    }
                    readOnly
                    disabled
                    placeholder={'B\u01b0u c\u1ee5c g\u1eedi do admin c\u1ea5u h\u00ecnh'}
                  />
                  <input
                    className="input"
                    placeholder={'\u0110\u1ecba ch\u1ec9 chi ti\u1ebft ng\u01b0\u1eddi g\u1eedi'}
                    value={createForm.senderAddressDetail}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        senderAddressDetail: event.target.value,
                      }))
                    }
                  />

                  <input
                    className="input"
                    placeholder={'T\u00ean ng\u01b0\u1eddi nh\u1eadn'}
                    value={createForm.receiverName}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        receiverName: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="input"
                    placeholder={'S\u0110T ng\u01b0\u1eddi nh\u1eadn'}
                    value={createForm.receiverPhone}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        receiverPhone: event.target.value,
                      }))
                    }
                  />
                  <select
                    className="select"
                    value={createForm.receiverProvince}
                    onChange={(event) => {
                      const receiverProvince = event.target.value;
                      setCreateForm((previous) => ({
                        ...previous,
                        receiverProvince,
                        receiverWard: '',
                        receiverHubCode: '',
                        receiverRegion: receiverProvince,
                        receiverAddress: '',
                      }));
                    }}
                  >
                    <option value="">{'Ch\u1ecdn t\u1ec9nh/th\u00e0nh nh\u1eadn'}</option>
                    {provinceOptions.map((province) => (
                      <option key={'receiver-' + province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <select
                    className="select"
                    value={selectedReceiverHub?.hubCode ?? ''}
                    disabled={!createForm.receiverProvince}
                    onChange={(event) => {
                      const selectedHub = findHubByCode(hubLocations, event.target.value);
                      setCreateForm((previous) => ({
                        ...previous,
                        receiverWard: selectedHub?.ward ?? '',
                        receiverHubCode: selectedHub?.hubCode ?? '',
                        receiverRegion: createForm.receiverProvince,
                      }));
                    }}
                  >
                    <option value="">{'Ch\u1ecdn ph\u01b0\u1eddng/x\u00e3 nh\u1eadn'}</option>
                    {receiverHubOptions.map((location) => (
                      <option key={'receiver-hub-' + location.hubCode} value={location.hubCode}>
                        {location.ward} - {location.hubName} ({location.hubCode})
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    placeholder={'\u0110\u1ecba ch\u1ec9 chi ti\u1ebft ng\u01b0\u1eddi nh\u1eadn'}
                    value={createForm.receiverAddressDetail}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        receiverAddressDetail: event.target.value,
                      }))
                    }
                  />

                  <input
                    className="input"
                    placeholder={'Lo\u1ea1i h\u00e0ng'}
                    value={createForm.itemType}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        itemType: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="input"
                    placeholder={'Kh\u1ed1i l\u01b0\u1ee3ng (kg)'}
                    value={createForm.weightKg}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        weightKg: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="input"
                    placeholder={'D\u00e0i (cm)'}
                    value={createForm.lengthCm}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        lengthCm: event.target.value,
                      }))
                    }
                    title={'Chi\u1ec1u d\u00e0i (cm)'}
                  />
                  <input
                    className="input"
                    placeholder={'R\u1ed9ng (cm)'}
                    value={createForm.widthCm}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        widthCm: event.target.value,
                      }))
                    }
                    title={'Chi\u1ec1u r\u1ed9ng (cm)'}
                  />
                  <input
                    className="input"
                    placeholder={'Cao (cm)'}
                    value={createForm.heightCm}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        heightCm: event.target.value,
                      }))
                    }
                    title={'Chi\u1ec1u cao (cm)'}
                  />
                  <input
                    className="input"
                    placeholder={'Ti\u1ec1n thu h\u1ed9 COD'}
                    value={createForm.codAmount}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        codAmount: event.target.value,
                      }))
                    }
                  />
                  <select
                    className="select"
                    value={createForm.serviceType}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        serviceType: event.target.value as CreateShipmentForm['serviceType'],
                      }))
                    }
                  >
                    <option value="STANDARD">STANDARD</option>
                    <option value="EXPRESS">EXPRESS</option>
                    <option value="SAME_DAY">SAME_DAY</option>
                  </select>
                </div>
                <textarea
                  className="textarea"
                  placeholder={'Ghi ch\u00fa giao h\u00e0ng'}
                  value={createForm.deliveryNote}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      deliveryNote: event.target.value,
                    }))
                  }
                />
                <p className="muted">{'K\u00edch th\u01b0\u1edbc ki\u1ec7n h\u00e0ng: D\u00e0i (cm), R\u1ed9ng (cm), Cao (cm)'}</p>
                <div className="btn-row">
                  <button className="btn btn-secondary" onClick={() => setQuotedFee(autoEstimatedFee)}>
                    {'T\u00ednh ph\u00ed t\u1ea1m t\u00ednh'}
                  </button>
                  <button className="btn btn-ghost" onClick={saveDraft}>
                    {'L\u01b0u nh\u00e1p'}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={createLoading || hubLocations.length === 0 || !lockedSenderHub}
                    onClick={() => {
                      void submitCreateShipment(false);
                    }}
                  >
                    {createLoading ? '\u0110ang t\u1ea1o...' : 'T\u1ea1o \u0111\u01a1n'}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={createLoading || hubLocations.length === 0 || !lockedSenderHub}
                    onClick={() => {
                      void submitCreateShipment(true);
                    }}
                  >
                    {'T\u1ea1o \u0111\u01a1n v\u00e0 y\u00eau c\u1ea7u pickup ngay'}
                  </button>
                </div>
                {createError ? <p className="message error">{createError}</p> : null}
                {createSuccess ? <p className="message success">{createSuccess}</p> : null}
              </div>
              <div className="grid">
                <div className="card">
                  <h3>{'T\u00f3m t\u1eaft \u0111\u01a1n h\u00e0ng'}</h3>
                  <p className="muted">
                    {'Ph\u00ed t\u1ea1m t\u00ednh: '}<strong>{formatCurrency(effectiveFee)}</strong>
                  </p>
                  <p className="muted">COD: {formatCurrency(codAmount)}</p>
                  <p className="muted">{'Hub g\u1eedi: '}{createForm.senderHubCode || 'Ch\u01b0a ch\u1ecdn'}</p>
                  <p className="muted">{'Hub nh\u1eadn: '}{createForm.receiverHubCode || 'Ch\u01b0a ch\u1ecdn'}</p>
                </div>
                <div className="card grid">
                  <h3>{'Nh\u00e1p \u0111\u00e3 l\u01b0u'}</h3>
                  <input
                    className="input"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder={'T\u00ean nh\u00e1p'}
                  />
                  {drafts.length === 0 ? (
                    <div className="empty">{'Ch\u01b0a c\u00f3 nh\u00e1p.'}</div>
                  ) : (
                    drafts.slice(0, 6).map((draft) => (
                      <div className="detail-box" key={draft.id}>
                        <strong>{draft.name}</strong>
                        <div className="muted">{formatDate(draft.createdAt)}</div>
                        <div className="btn-row">
                          <button
                            className="btn btn-ghost"
                            onClick={() => {
                              const draftForm = normalizeCreateForm(draft.form);
                              const senderProvince = lockedSenderHub?.province ?? draftForm.senderProvince;
                              const senderWard = lockedSenderHub?.ward ?? draftForm.senderWard;
                              setCreateForm({
                                ...draftForm,
                                senderProvince,
                                senderWard,
                                senderHubCode: lockedSenderHub?.hubCode ?? draftForm.senderHubCode,
                                senderAddress: [
                                  draftForm.senderAddressDetail.trim(),
                                  senderWard,
                                  senderProvince,
                                ]
                                  .filter(Boolean)
                                  .join(', '),
                              });
                              setQuotedFee(draft.quoteFee);
                            }}
                          >
                            {'T\u1ea3i l\u1ea1i'}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() =>
                              setDrafts((previous) =>
                                previous.filter((item) => item.id !== draft.id),
                              )
                            }
                          >
                            {'X\u00f3a'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          ) : null}
          {activeView === 'shipments' ? <>
            <section className="card shipment-list-hero">
              <div className="shipment-list-hero__copy">
                <p className="login-kicker">Shipment management</p>
                <h3>Danh sách shipment</h3>
                <p className="muted">Theo dõi, lọc và thao tác trên toàn bộ đơn hàng merchant trong cùng một bảng điều phối.</p>
              </div>
              <div className="shipment-list-hero__stats">
                <span className="badge">Hiển thị: {visibleRows.length}</span>
                <span className="badge">Tổng khớp: {filteredRows.length}</span>
                <span className="badge">Trang: {listPage}/{totalPages}</span>
              </div>
            </section>
            <section className="card shipment-filters">
              <div className="shipment-filters__header">
                <div>
                  <p className="login-kicker">Filters</p>
                  <h3>Bộ lọc đơn hàng</h3>
                </div>
                <div className="shipment-filters__summary muted">Tìm theo mã, tên người nhận, số điện thoại, trạng thái, dịch vụ, khu vực và thời gian tạo.</div>
              </div>
              <div className="shipment-filters__grid">
                <div className="shipment-field shipment-field--search">
                  <label className="label">Tìm kiếm</label>
                  <input className="input" placeholder="Tìm mã / tên / SĐT" value={listSearch} onChange={(e) => setListSearch(e.target.value)} />
                </div>
                <div className="shipment-field">
                  <label className="label">Trạng thái</label>
                  <select className="select" value={listStatus} onChange={(e) => setListStatus(e.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="CREATED">CREATED</option><option value="UPDATED">UPDATED</option><option value="WAITING_PICKUP">CHO_LAY_HANG</option><option value="DELIVERED">DELIVERED</option><option value="DELIVERY_FAILED">DELIVERY_FAILED</option><option value="RETURN_STARTED">RETURN_STARTED</option><option value="RETURN_COMPLETED">RETURN_COMPLETED</option><option value="CANCELLED">CANCELLED</option></select>
                </div>
                <div className="shipment-field">
                  <label className="label">Dịch vụ</label>
                  <select className="select" value={listService} onChange={(e) => setListService(e.target.value)}><option value="ALL">Tất cả dịch vụ</option>{serviceOptions.map((o) => <option key={o}>{o}</option>)}</select>
                </div>
                <div className="shipment-field">
                  <label className="label">Khu vực</label>
                  <select className="select" value={listRegion} onChange={(e) => setListRegion(e.target.value)}><option value="ALL">Tất cả khu vực</option>{regionOptions.map((o) => <option key={o}>{o}</option>)}</select>
                </div>
                <div className="shipment-field">
                  <label className="label">Từ ngày</label>
                  <input className="input" type="date" value={listFromDate} onChange={(e) => setListFromDate(e.target.value)} />
                </div>
                <div className="shipment-field">
                  <label className="label">Đến ngày</label>
                  <input className="input" type="date" value={listToDate} onChange={(e) => setListToDate(e.target.value)} />
                </div>
              </div>
            </section>
            <section className="card shipment-table-card">
              <div className="shipment-table-card__header">
                <div>
                  <p className="login-kicker">Data table</p>
                  <h3>Đơn hàng đang hiển thị</h3>
                </div>
                <div className="shipment-table-card__meta muted">Tổng số bản ghi khớp bộ lọc: {filteredRows.length}</div>
              </div>
              <div className="table-wrap shipment-table-wrap">
                <table className="shipment-table">
                  <thead>
                    <tr>
                      <th>Mã vận đơn</th>
                      <th>Người nhận</th>
                      <th>SĐT</th>
                      <th>Trạng thái</th>
                      <th>COD</th>
                      <th>Phí</th>
                      <th>Dịch vụ</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => <tr key={row.shipment.id}>
                      <td className="shipment-code-cell">{row.shipment.code}</td>
                      <td>
                        <div className="shipment-recipient">
                          <strong>{row.receiverName}</strong>
                        </div>
                      </td>
                      <td>{row.receiverPhone}</td>
                      <td><span className={resolveShipmentStatusClass(row.shipment)}>{resolveShipmentStatusLabel(row.shipment)}</span></td>
                      <td>{formatCurrency(row.codAmount)}</td>
                      <td>{formatCurrency(row.feeEstimate)}</td>
                      <td><span className="shipment-service-chip">{row.serviceType}</span></td>
                      <td>{formatDate(row.shipment.createdAt)}</td>
                      <td>
                        <div className="shipment-actions">
                          <button className="btn btn-ghost shipment-action-btn" onClick={() => { void openShipmentDetail(row.shipment.code); }}>Xem</button>
                          <button className="btn btn-secondary shipment-action-btn" onClick={() => { void openShipmentDetail(row.shipment.code); }}>Cập nhật</button>
                          <button className="btn btn-danger shipment-action-btn" onClick={() => { const reason = window.prompt('Lý do hủy đơn', '') ?? ''; void cancelShipment(row.shipment.code, reason); }}>Hủy</button>
                          <button className="btn btn-secondary shipment-action-btn" disabled={pickupByShipmentCode.has(normalizeCode(row.shipment.code))} onClick={() => { const normalizedShipmentCode = normalizeCode(row.shipment.code); if (pickupByShipmentCode.has(normalizedShipmentCode)) return; void createPickupForShipment(row.shipment.code, `manual pickup ${row.shipment.code}`).then((createdPickup) => { pushNotification('success', 'Đã tạo pickup', `Pickup ${createdPickup.pickupCode} cho ${row.shipment.code}`); }).catch((error) => { pushNotification('error', 'Không tạo được pickup', extractErrorMessage(error)); }); }}>{pickupByShipmentCode.has(normalizeCode(row.shipment.code)) ? 'Đã tạo pickup' : 'Tạo pickup'}</button>
                          <button className="btn btn-ghost shipment-action-btn" onClick={() => printShipment(row)}>In</button>
                        </div>
                      </td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              {visibleRows.length === 0 ? <div className="empty shipment-empty">Không có dữ liệu.</div> : null}
              <div className="shipment-pagination">
                <div className="shipment-pagination__summary muted">Hiển thị {(listPage - 1) * SHIPMENT_PAGE_SIZE + (visibleRows.length > 0 ? 1 : 0)} - {(listPage - 1) * SHIPMENT_PAGE_SIZE + visibleRows.length} trong tổng số {filteredRows.length} đơn khớp bộ lọc</div>
                <div className="shipment-pagination__controls">
                  <button className="btn btn-ghost shipment-pagination__btn" disabled={listPage <= 1} onClick={() => setListPage((p) => Math.max(p - 1, 1))}>Trước</button>
                  <span className="badge shipment-pagination__badge">Trang {listPage}/{totalPages}</span>
                  <button className="btn btn-ghost shipment-pagination__btn" disabled={listPage >= totalPages} onClick={() => setListPage((p) => Math.min(p + 1, totalPages))}>Sau</button>
                </div>
              </div>
            </section>
          </> : null}

          {activeView === 'shipment-detail' ? <section className="grid">{!selectedShipment ? <div className="card"><div className="empty">Chưa chọn shipment.</div></div> : <><div className="card"><h3>Chi tiết shipment {selectedShipment.shipment.code}</h3><div className="details-grid"><div className="detail-box"><div className="label">Người gửi</div><div>{selectedShipment.senderName}<br />{selectedShipment.senderPhone}<br />{selectedShipment.senderAddress}</div></div><div className="detail-box"><div className="label">Hub gửi</div><div>{selectedShipment.senderHubCode}<br />{selectedShipment.senderWard}, {selectedShipment.senderProvince}</div></div><div className="detail-box"><div className="label">Người nhận</div><div>{selectedShipment.receiverName}<br />{selectedShipment.receiverPhone}<br />{selectedShipment.receiverAddress}</div></div><div className="detail-box"><div className="label">Hub nhận</div><div>{selectedShipment.receiverHubCode}<br />{selectedShipment.receiverWard}, {selectedShipment.receiverProvince}</div></div><div className="detail-box"><div className="label">Hàng hóa</div><div>{selectedShipment.itemType}<br />{selectedShipment.weightKg}kg</div></div><div className="detail-box"><div className="label">COD / Phí</div><div>{formatCurrency(selectedShipment.codAmount)}<br />{formatCurrency(selectedShipment.feeEstimate)}</div></div><div className="detail-box"><div className="label">Dịch vụ</div><div>{selectedShipment.serviceType}</div></div><div className="detail-box"><div className="label">Pickup</div><div>{pickupByShipmentCode.get(normalizeCode(selectedShipment.shipment.code))?.pickupCode ?? 'Chưa tạo pickup'}</div></div></div><div className="btn-row" style={{ marginTop: 8 }}><span className={resolveShipmentStatusClass(selectedShipment.shipment)}>{resolveShipmentStatusLabel(selectedShipment.shipment)}</span><button className="btn btn-danger" onClick={() => { const reason = window.prompt('Lý do hủy đơn', '') ?? ''; void cancelShipment(selectedShipment.shipment.code, reason); }}>Hủy đơn</button><button className="btn btn-ghost" onClick={() => printShipment(selectedShipment)}>In vận đơn</button></div></div><div className="card grid"><h3>Sửa đơn nếu còn cho phép</h3><div className="grid grid-3"><input className="input" value={detailReceiverPhone} onChange={(e) => setDetailReceiverPhone(e.target.value)} placeholder="SĐT người nhận" /><input className="input" value={detailReceiverAddress} onChange={(e) => setDetailReceiverAddress(e.target.value)} placeholder="Địa chỉ người nhận" /><input className="input" value={detailDeliveryNote} onChange={(e) => setDetailDeliveryNote(e.target.value)} placeholder="Ghi chú giao hàng" /></div><div className="btn-row"><button className="btn btn-primary" disabled={detailUpdating} onClick={() => { void saveDetailUpdate(); }}>{detailUpdating ? 'Đang cập nhật...' : 'Sửa đơn'}</button><button className="btn btn-secondary" onClick={() => { setChangeCode(selectedShipment.shipment.code); setActiveView('change-requests'); }}>Yêu cầu đổi thông tin giao</button><button className="btn btn-secondary" onClick={() => { setReturnCode(selectedShipment.shipment.code); setActiveView('returns'); }}>Yêu cầu hoàn hàng</button></div>{detailError ? <p className="message error">{detailError}</p> : null}{detailSuccess ? <p className="message success">{detailSuccess}</p> : null}</div><div className="card"><h3>Timeline xử lý đơn</h3>{detailTrackError ? <p className="message error">{detailTrackError}</p> : null}<div className="timeline">{detailTrackTimeline.length === 0 ? <div className="empty">Chưa có tracking event.</div> : detailTrackTimeline.map((ev) => <div key={ev.id} className="timeline-item"><strong>{ev.eventType}</strong><div className="muted">{formatDate(ev.occurredAt)} | actor={ev.actor ?? 'system'} | loc={ev.locationText ?? ev.locationCode ?? 'N/A'}</div></div>)}</div>{detailTrackCurrent ? <p className="muted">Current: {detailTrackCurrent.currentStatus ?? 'N/A'} | Last event: {detailTrackCurrent.lastEventType ?? 'N/A'}</p> : null}</div></>}</section> : null}

          {activeView === 'pickups' ? <>
            <section className="card pickup-hero">
              <div className="pickup-hero__copy">
                <p className="login-kicker">Pickup flow</p>
                <h3>Tạo và quản lý yêu cầu lấy hàng</h3>
                <p className="muted">Tập hợp vận đơn, cấu hình thông tin lấy hàng và theo dõi toàn bộ pickup request trong cùng một giao diện điều phối.</p>
              </div>
              <div className="pickup-hero__stats">
                <span className="badge">Pickup hiện có: {pickupRows.length}</span>
                <span className="badge">Tổng pickup: {pickups.length}</span>
              </div>
            </section>
            <section className="card pickup-form-card">
              <div className="pickup-form-card__header">
                <div>
                  <p className="login-kicker">Create request</p>
                  <h3>Tạo yêu cầu pickup mới</h3>
                </div>
                <div className="pickup-form-card__note muted">Nhập danh sách mã vận đơn và thông tin liên hệ để gửi yêu cầu lấy hàng cho bưu tá.</div>
              </div>
              <form className="grid pickup-form" onSubmit={(e) => { void submitPickupRequest(e); }}>
                <div className="pickup-form__grid">
                  <div className="pickup-field pickup-field--span-2">
                    <label className="label">Danh sách mã vận đơn</label>
                    <textarea className="textarea pickup-textarea" value={pickupShipmentCodes} onChange={(e) => setPickupShipmentCodes(e.target.value)} placeholder="Danh sách mã vận đơn" />
                  </div>
                  <div className="pickup-field">
                    <label className="label">Người yêu cầu</label>
                    <input className="input" value={pickupRequesterName} onChange={(e) => setPickupRequesterName(e.target.value)} placeholder="Người yêu cầu" />
                  </div>
                  <div className="pickup-field">
                    <label className="label">SĐT liên hệ</label>
                    <input className="input" value={pickupContactPhone} onChange={(e) => setPickupContactPhone(e.target.value)} placeholder="SĐT liên hệ" />
                  </div>
                  <div className="pickup-field pickup-field--span-2">
                    <label className="label">Địa chỉ lấy hàng</label>
                    <input className="input" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Địa chỉ lấy hàng" />
                  </div>
                  <div className="pickup-field">
                    <label className="label">Thời gian mong muốn</label>
                    <input className="input" type="date" min={toInputDate(new Date())} value={pickupDesiredTime} onChange={(e) => setPickupDesiredTime(e.target.value)} />
                  </div>
                  <div className="pickup-field pickup-field--span-3">
                    <label className="label">Ghi chú courier</label>
                    <input className="input" value={pickupNote} onChange={(e) => setPickupNote(e.target.value)} placeholder="Ghi chú courier" />
                  </div>
                </div>
                <div className="pickup-form__actions">
                  <button className="btn btn-primary pickup-submit-btn" type="submit" disabled={pickupLoading}>{pickupLoading ? 'Đang tạo...' : 'Tạo yêu cầu lấy hàng'}</button>
                </div>
              </form>
              {pickupMessage ? <p className="message">{pickupMessage}</p> : null}
            </section>
            <section className="card pickup-table-card">
              <div className="pickup-table-card__header">
                <div>
                  <p className="login-kicker">Request list</p>
                  <h3>Danh sách yêu cầu pickup</h3>
                </div>
                <div className="pickup-table-card__controls">
                  <label className="label pickup-table-card__label">Trạng thái</label>
                  <select className="select pickup-table-card__select" value={pickupStatusFilter} onChange={(e) => setPickupStatusFilter(e.target.value)}><option value="ALL">Tất cả</option><option value="REQUESTED">chờ duyệt</option><option value="COMPLETED">đã lấy/hoàn tất</option><option value="CANCELLED">đã hủy</option></select>
                </div>
              </div>
              <div className="table-wrap pickup-table-wrap">
                <table className="pickup-table">
                  <thead>
                    <tr>
                      <th>Mã lấy hàng</th>
                      <th>Vận đơn</th>
                      <th>Trạng thái</th>
                      <th>Shipper</th>
                      <th>Ngày tạo</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickupRows.map((item) => {
                      const cancelBlockReason = resolvePickupCancelBlockReason(item);
                      return <tr key={item.id}>
                        <td className="pickup-code-cell">{item.pickupCode}</td>
                        <td>{item.items.map((it) => it.shipmentCode).join(', ') || '-'}</td>
                        <td><span className={statusClass(item.status)}>{item.status}</span></td>
                        <td><span className="pickup-shipper-chip">Chưa gán</span></td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          <div className="pickup-actions">
                            <button className="btn btn-danger pickup-action-btn" title={cancelBlockReason ?? undefined} disabled={Boolean(cancelBlockReason)} onClick={() => { if (!session || cancelBlockReason) return; const reason = window.prompt('Lý do hủy pickup', '') ?? ''; void request<PickupRequest>(`/merchant/pickup/pickups/${encodeURIComponent(item.id)}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason.trim() || null }) }, session.accessToken).then((cancelled) => setPickups((prev) => prev.map((pickup) => pickup.id === item.id ? cancelled : pickup))); }}>Hủy pickup</button>
                            {cancelBlockReason ? <div className="muted pickup-action-note">{cancelBlockReason}</div> : null}
                          </div>
                        </td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              {pickupRows.length === 0 ? <div className="empty pickup-empty">Chưa có yêu cầu pickup phù hợp bộ lọc.</div> : null}
            </section>
          </> : null}

          {activeView === 'tracking' ? <>
            <section className="card tracking-hero">
              <div className="tracking-hero__copy">
                <p className="login-kicker">Tracking lookup</p>
                <h3>Tra cứu vận đơn</h3>
                <p className="muted">Tra cứu nhanh trạng thái, vị trí hiện tại và toàn bộ timeline xử lý của shipment ngay trong merchant workspace.</p>
              </div>
              <div className="tracking-hero__stats">
                <span className="badge">Mã đang nhập: {trackingCode.trim() || 'N/A'}</span>
                <span className="badge">Số sự kiện: {trackingTimeline.length}</span>
              </div>
            </section>
            <section className="card tracking-search-card">
              <div className="tracking-search-card__header">
                <div>
                  <p className="login-kicker">Search</p>
                  <h3>Tra cứu nội bộ</h3>
                </div>
                <div className="tracking-search-card__hint muted">Nhập mã vận đơn để xem snapshot hiện tại và lịch sử di chuyển chi tiết.</div>
              </div>
              <form className="tracking-search-form" onSubmit={(e) => { void lookupTracking(e); }}>
                <div className="tracking-search-input">
                  <input className="input tracking-search-input__field" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Mã vận đơn" />
                </div>
                <button className="btn btn-primary tracking-search-btn" type="submit" disabled={trackingLoading}>{trackingLoading ? 'Đang tải...' : 'Tra cứu'}</button>
              </form>
              {trackingError ? <p className="message error">{trackingError}</p> : null}
            </section>
            <section className="tracking-summary-grid">
              <div className="card tracking-summary-card">
                <div className="label">Trạng thái hiện tại</div>
                <div className="tracking-summary-card__value">{trackingCurrent?.currentStatus ?? 'N/A'}</div>
              </div>
              <div className="card tracking-summary-card">
                <div className="label">Vị trí hiện tại</div>
                <div className="tracking-summary-card__value">{trackingCurrent?.currentLocationCode ?? 'N/A'}</div>
              </div>
              <div className="card tracking-summary-card">
                <div className="label">Sự kiện cuối</div>
                <div className="tracking-summary-card__value">{trackingCurrent?.lastEventType ?? 'N/A'}</div>
              </div>
              <div className="card tracking-summary-card">
                <div className="label">Thời điểm sự kiện cuối</div>
                <div className="tracking-summary-card__value">{formatDate(trackingCurrent?.lastEventAt ?? null)}</div>
              </div>
            </section>
            <section className="card tracking-timeline-card">
              <div className="tracking-timeline-card__header">
                <div>
                  <p className="login-kicker">Timeline</p>
                  <h3>Hành trình vận đơn</h3>
                </div>
                {trackingCurrent ? <span className="badge tracking-status-badge">{trackingCurrent.currentStatus ?? 'N/A'}</span> : null}
              </div>
              <div className="tracking-progress">
                {trackingTimeline.length === 0 ? <div className="empty tracking-empty">{trackingLoading ? 'Đang tải hành trình vận đơn...' : 'Chưa có timeline event.'}</div> : <div className="timeline tracking-timeline">{trackingTimeline.map((ev) => <div key={ev.id} className="timeline-item tracking-timeline-item"><strong>{ev.eventType}</strong><div className="muted">{formatDate(ev.occurredAt)}</div></div>)}</div>}
              </div>
            </section>
          </> : null}

          {activeView === 'change-requests' ? <>
            <form className="change-reference-layout" onSubmit={(e) => { void submitChangeRequest(e); }}>
              <section className="card change-search-card">
                <h3>Bước 1: Tìm kiếm đơn hàng</h3>
                <div className="change-search-row">
                  <div className="change-search-input">
                    <span className="change-search-input__icon">⌕</span>
                    <input className="input change-search-input__field" value={changeCode} onChange={(e) => setChangeCode(e.target.value)} placeholder="Nhập mã vận đơn (Ví dụ: NEX-123456789)" />
                  </div>
                  <button className="btn btn-primary change-search-btn" type="button">Tìm kiếm</button>
                </div>
              </section>

              <section className="change-reference-grid">
                <div className="card change-current-card">
                  <div className="change-card-title-row">
                    <span className="change-card-icon">i</span>
                    <h3>Thông tin hiện tại</h3>
                  </div>
                  <div className="change-info-grid">
                    <div className="change-field">
                      <label className="label">Tên người nhận</label>
                      <input className="input change-readonly-input" value={changeShipmentPreview?.receiverName ?? ''} placeholder="Chưa có dữ liệu đơn hàng" readOnly />
                    </div>
                    <div className="change-field">
                      <label className="label">Số điện thoại</label>
                      <input className="input change-readonly-input" value={changeShipmentPreview?.receiverPhone ?? ''} placeholder="Chưa có dữ liệu đơn hàng" readOnly />
                    </div>
                    <div className="change-field">
                      <label className="label">Địa chỉ giao hàng</label>
                      <textarea className="textarea change-readonly-input change-current-address" value={changeShipmentPreview?.receiverAddress ?? ''} placeholder="Chưa có dữ liệu đơn hàng" readOnly />
                    </div>
                  </div>
                </div>

                <div className="card change-new-card">
                  <div className="change-card-title-row">
                    <span className="change-card-icon change-card-icon--accent">✎</span>
                    <h3 className="change-accent-title">Thông tin mới</h3>
                  </div>
                  <div className="change-info-grid">
                    <div className="change-field">
                      <label className="label">Tên người nhận mới</label>
                      <input className="input" value="" placeholder="Giữ theo thông tin hiện tại" readOnly />
                    </div>
                    <div className="change-field">
                      <label className="label">Số điện thoại mới</label>
                      <input className={`input ${changeType === 'change.phone' ? '' : 'change-disabled-input'}`} value={changeType === 'change.phone' ? changeValue : ''} onChange={(e) => setChangeValue(e.target.value)} placeholder="Nhập số điện thoại mới" readOnly={changeType !== 'change.phone'} />
                    </div>
                    <div className="change-field">
                      <label className="label">Địa chỉ chi tiết mới</label>
                      <textarea className={`textarea change-new-address ${changeType === 'change.address' ? '' : 'change-disabled-input'}`} value={changeType === 'change.address' ? changeValue : ''} onChange={(e) => setChangeValue(e.target.value)} placeholder="Số nhà, tên đường, phường/xã..." readOnly={changeType !== 'change.address'} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="card change-reason-card">
                <div className="change-reference-form">
                  <div className="change-field">
                    <label className="label">Lý do thay đổi</label>
                    <select className="select" value={changeType} onChange={(e) => setChangeType(e.target.value)}>
                      <option value="change.phone">Khách hàng yêu cầu đổi số điện thoại</option>
                      <option value="change.address">Khách hàng yêu cầu đổi địa chỉ nhận hàng</option>
                      <option value="change.note">Khác / đổi ghi chú giao hàng</option>
                    </select>
                  </div>
                  <div className="change-field">
                    <label className="label">Chi tiết lý do</label>
                    <textarea className={`textarea ${changeType === 'change.note' ? '' : 'change-disabled-input'}`} value={changeType === 'change.note' ? changeValue : ''} onChange={(e) => setChangeValue(e.target.value)} placeholder="Chi tiết lý do (nếu có)..." readOnly={changeType !== 'change.note'} />
                  </div>
                </div>
                <div className="change-reference-actions">
                  <button className="btn btn-ghost" type="button">Hủy</button>
                  <button className="btn btn-primary change-submit-btn" type="submit" disabled={changeLoading}>{changeLoading ? 'Đang gửi...' : 'Gửi yêu cầu thay đổi'}</button>
                </div>
                {changeMessage ? <p className="message">{changeMessage}</p> : null}
              </section>
            </form>

            <section className="card change-history-card change-history-card--secondary">
              <div className="change-history-card__header">
                <div>
                  <p className="login-kicker">History</p>
                  <h3>Lịch sử yêu cầu đổi thông tin</h3>
                </div>
                <div className="change-history-card__controls">
                  <label className="label">Trạng thái</label>
                  <select className="select change-history-card__select" value={changeStatusFilter} onChange={(e) => setChangeStatusFilter(e.target.value)}><option value="ALL">Tất cả</option><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option></select>
                </div>
              </div>
              <div className="table-wrap change-table-wrap">
                <table className="change-table">
                  <thead>
                    <tr>
                      <th>Vận đơn</th>
                      <th>Thông tin cũ</th>
                      <th>Thông tin mới</th>
                      <th>Trạng thái</th>
                      <th>Ngày yêu cầu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeRows.map((item) => {
                      const historyShipment = shipmentRows.find((row) => row.shipment.code === normalizeCode(item.shipmentCode));
                      return <tr key={item.id}>
                        <td className="change-code-cell">{item.shipmentCode}</td>
                        <td>
                          <div className="change-history-meta">
                            <strong>{historyShipment?.receiverName ?? 'Thông tin hiện tại'}</strong>
                            <span>{historyShipment?.receiverPhone ?? '-'}</span>
                            <small>{historyShipment?.receiverAddress ?? '-'}</small>
                          </div>
                        </td>
                        <td>
                          <div className="change-history-meta change-history-meta--new">
                            <strong>{item.requestType}</strong>
                            <span>{typeof item.payload?.value === 'string' ? item.payload.value : '-'}</span>
                          </div>
                        </td>
                        <td><span className={statusClass(item.status)}>{item.status}</span></td>
                        <td>{formatDate(item.createdAt)}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              {changeRows.length === 0 ? <div className="empty change-empty">Chưa có yêu cầu thay đổi phù hợp bộ lọc.</div> : null}
            </section>
          </> : null}

          {activeView === 'returns' ? <section className="returns-layout">
            <div className="returns-top-grid">
              <div className="returns-main-column">
                <section className="card returns-search-card">
                  <div className="returns-step-header">
                    <span className="returns-step-badge">1</span>
                    <h3>Bước 1: Tìm kiếm đơn hàng cần hoàn</h3>
                  </div>
                  <div className="returns-search-row">
                    <div className="returns-search-input">
                      <span className="returns-search-icon">⌕</span>
                      <input className="input returns-search-field" value={returnCode} onChange={(e) => setReturnCode(e.target.value)} placeholder="Nhập mã vận đơn (VD: NX-889201...)" />
                    </div>
                    <button className="btn btn-primary returns-search-btn" type="button">Tìm kiếm</button>
                  </div>
                </section>

                <section className="card returns-order-card">
                  <div className="returns-order-card__header">
                    <h4>Thông tin đơn hàng</h4>
                    <span className="returns-order-status">{returnShipmentPreview ? resolveShipmentStatusLabel(returnShipmentPreview.shipment) : 'Chờ giao lại'}</span>
                  </div>
                  <div className="returns-order-grid">
                    <div className="returns-order-block">
                      <div>
                        <p className="muted">Người nhận</p>
                        <strong>{returnShipmentPreview?.receiverName ?? 'Chưa có dữ liệu đơn hàng'}</strong>
                      </div>
                      <div>
                        <p className="muted">Số điện thoại</p>
                        <strong>{returnShipmentPreview?.receiverPhone ?? '-'}</strong>
                      </div>
                    </div>
                    <div className="returns-order-block">
                      <div>
                        <p className="muted">Địa chỉ giao hàng</p>
                        <span>{returnShipmentPreview?.receiverAddress ?? 'Nhập mã vận đơn để xem thông tin.'}</span>
                      </div>
                      <div>
                        <p className="muted">Lịch sử giao hàng gần nhất</p>
                        <span className="returns-order-note">Dùng dữ liệu hiện có của app để gửi yêu cầu hoàn mà không đổi business flow.</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="card returns-form-card">
                  <div className="returns-step-header">
                    <span className="returns-step-badge">2</span>
                    <h3>Yêu cầu hoàn</h3>
                  </div>
                  <form className="returns-form" onSubmit={createReturnRequest}>
                    <div className="returns-field">
                      <label className="label">Lý do hoàn hàng</label>
                      <select className="select" value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                        <option value="">Chọn lý do hoàn hàng...</option>
                        <option value="Khách hàng hủy đơn">Khách hàng hủy đơn</option>
                        <option value="Không liên lạc được khách hàng">Không liên lạc được khách hàng</option>
                        <option value="Sai địa chỉ giao hàng">Sai địa chỉ giao hàng</option>
                        <option value="Hàng hóa bị hư hỏng">Hàng hóa bị hư hỏng</option>
                        <option value="Khách từ chối nhận hàng">Khách từ chối nhận hàng</option>
                      </select>
                    </div>
                    <div className="returns-field">
                      <label className="label">Ghi chú chi tiết</label>
                      <textarea className="textarea returns-notes" value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Nhập chi tiết yêu cầu hoàn hàng cho bưu tá..." />
                    </div>
                    <div className="returns-form-actions">
                      <button className="btn btn-ghost" type="button">Hủy</button>
                      <button className="btn btn-primary returns-submit-btn" type="submit">Gửi yêu cầu hoàn hàng</button>
                    </div>
                  </form>
                </section>
              </div>

              <div className="returns-side-column">
                <section className="card returns-info-card">
                  <div className="returns-info-card__header">
                    <span className="returns-info-icon">i</span>
                    <h4>Lưu ý quan trọng</h4>
                  </div>
                  <ul className="returns-info-list">
                    <li>Yêu cầu hoàn hàng áp dụng cho các đơn đang xử lý giao lại hoặc phát sinh nhu cầu hoàn từ merchant.</li>
                    <li>Sau khi gửi yêu cầu, đội vận hành sẽ kiểm tra và xác nhận theo quy trình hiện có.</li>
                    <li>Phí hoàn hàng vẫn tuân theo hợp đồng dịch vụ hiện tại của merchant.</li>
                    <li>Không có trường API mới được thêm trong pass UI này.</li>
                  </ul>
                </section>

                <section className="card returns-metric-card">
                  <p className="muted">Tỷ lệ hoàn hàng tháng này</p>
                  <div className="returns-metric-row">
                    <strong>4.2%</strong>
                    <span className="returns-metric-chip">+0.5%</span>
                  </div>
                  <div className="returns-metric-bar">
                    <span className="returns-metric-bar__fill" />
                  </div>
                </section>
              </div>
            </div>

            <section className="card returns-history-card">
              <div className="returns-history-card__header">
                <h3>Lịch sử yêu cầu hoàn hàng</h3>
                <select className="select returns-history-filter" value={returnStatusFilter} onChange={(e) => setReturnStatusFilter(e.target.value)}>
                  <option value="ALL">Tất cả</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="table-wrap returns-table-wrap">
                <table className="returns-table">
                  <thead>
                    <tr>
                      <th>Mã vận đơn</th>
                      <th>Ngày gửi yêu cầu</th>
                      <th>Lý do</th>
                      <th>Dự kiến hoàn</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnRows.map((item) => <tr key={item.id}>
                      <td className="returns-code-cell">{item.shipmentCode}</td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>{item.reason}</td>
                      <td>{item.expectedReturnAt}</td>
                      <td><span className={statusClass(item.status)}>{item.status}</span></td>
                      <td><div className="returns-actions"><button className="btn btn-ghost" onClick={() => setReturnRequests((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'IN_TRANSIT' } : r))}>Đang hoàn</button><button className="btn btn-secondary" onClick={() => setReturnRequests((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'COMPLETED' } : r))}>Hoàn tất</button><button className="btn btn-danger" onClick={() => setReturnRequests((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'CANCELLED' } : r))}>Hủy</button></div></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              {returnRows.length === 0 ? <div className="empty returns-empty">Chưa có yêu cầu hoàn hàng phù hợp bộ lọc.</div> : null}
            </section>
          </section> : null}

          {activeView === 'print' ? <section className="print-layout">
            <div className="print-main-column">
              <section className="card print-filters-card">
                <div className="print-filters-grid">
                  <div className="print-filter-block">
                    <label className="label">Tìm kiếm vận đơn</label>
                    <input className="input" value={printSingleCode} onChange={(e) => setPrintSingleCode(e.target.value)} placeholder="Nhập mã vận đơn (VD: NX123...)" />
                  </div>
                  <div className="print-filter-block">
                    <label className="label">Trạng thái in</label>
                    <div className="print-toggle-row">
                      <span className="print-toggle-chip print-toggle-chip--active">Tất cả</span>
                      <span className="print-toggle-chip">Chờ in</span>
                      <span className="print-toggle-chip">Đã in</span>
                    </div>
                  </div>
                  <div className="print-filter-block">
                    <label className="label">Mã vận đơn hàng loạt</label>
                    <textarea className="textarea print-bulk-input" value={printBulkCodes} onChange={(e) => setPrintBulkCodes(e.target.value)} placeholder="Nhập nhiều mã, cách nhau bằng dấu phẩy hoặc xuống dòng" />
                  </div>
                </div>
              </section>

              <section className="card print-table-card">
                <div className="print-table-card__header">
                  <div>
                    <p className="login-kicker">Ready to print</p>
                    <h3>Danh sách chờ in</h3>
                  </div>
                  <div className="print-table-card__meta muted">Hiển thị {Math.min(shipmentRows.length, 6)} trên {shipmentRows.length} vận đơn hiện có</div>
                </div>
                <div className="table-wrap print-table-wrap">
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th>Mã vận đơn</th>
                        <th>Người nhận</th>
                        <th>Dịch vụ</th>
                        <th>Trạng thái in</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipmentRows.slice(0, 6).map((row) => {
                        const isSelected = normalizeCode(printSingleCode) === normalizeCode(row.shipment.code);
                        return <tr key={row.shipment.id} className={isSelected ? 'print-row-selected' : ''}>
                          <td className="print-code-cell">{row.shipment.code}</td>
                          <td>
                            <div className="print-recipient-cell">
                              <strong>{row.receiverName}</strong>
                              <span>{row.receiverPhone}</span>
                            </div>
                          </td>
                          <td><span className="shipment-service-chip">{row.serviceType}</span></td>
                          <td><span className={`print-status ${isSelected ? 'print-status--pending' : 'print-status--muted'}`}>{isSelected ? 'Chờ in' : 'Sẵn sàng'}</span></td>
                          <td>{formatDate(row.shipment.createdAt)}</td>
                          <td><button className="btn btn-ghost print-row-action" onClick={() => setPrintSingleCode(row.shipment.code)}>Xem</button></td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
                {shipmentRows.length === 0 ? <div className="empty print-empty">Chưa có vận đơn để in.</div> : null}
              </section>
            </div>

            <aside className="card print-sidebar-card">
              <div className="print-sidebar-card__header">
                <span className="print-sidebar-icon">⌘</span>
                <h3>Cấu hình in</h3>
              </div>

              <div className="print-config-group">
                <label className="label">Khổ giấy</label>
                <div className="print-option-list">
                  <div className="print-option print-option--active">
                    <div>
                      <strong>A5 (Standard)</strong>
                      <span>Phù hợp in laser văn phòng</span>
                    </div>
                    <span className="print-option-dot" />
                  </div>
                  <div className="print-option">
                    <div>
                      <strong>K80 (Thermal)</strong>
                      <span>In nhiệt liên tục, tiết kiệm</span>
                    </div>
                  </div>
                  <div className="print-option">
                    <div>
                      <strong>100x150mm</strong>
                      <span>Chuẩn tem nhãn thương mại</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="print-config-group">
                <label className="label">Nội dung in</label>
                <select className="select">
                  <option>Vận đơn đầy đủ (Full)</option>
                  <option>Vận đơn rút gọn (Mini)</option>
                  <option>Chỉ mã QR (QR Only)</option>
                </select>
              </div>

              <div className="print-preview-card">
                <div className="print-preview-sheet">
                  <div className="print-preview-sheet__bar" />
                  <div className="print-preview-sheet__hero">
                    <div className="print-preview-sheet__qr">QR</div>
                    <div className="print-preview-sheet__copy">
                      <strong>{printPreviewRow?.shipment.code ?? 'Mã vận đơn'}</strong>
                      <span>{printPreviewRow?.receiverName ?? 'Người nhận'}</span>
                    </div>
                  </div>
                  <div className="print-preview-sheet__lines">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="print-preview-sheet__footer" />
                </div>
                <p className="muted">Bản xem trước khổ A5</p>
              </div>

              <div className="print-summary-row">
                <span>Vận đơn đã chọn:</span>
                <strong>{printBulkPreviewRows.length > 0 ? printBulkPreviewRows.length : printPreviewRow ? 1 : 0}</strong>
              </div>

              <div className="print-action-stack">
                <button className="btn btn-primary print-primary-btn" onClick={() => { const row = shipmentRows.find((r) => r.shipment.code === normalizeCode(printSingleCode)); if (!row) { setPrintMessage('Không tìm thấy shipment trong danh sách hiện tại.'); return; } printShipment(row); setPrintMessage(`Đã mở popup in cho ${row.shipment.code}`); }}>In 1 vận đơn</button>
                <button className="btn btn-secondary print-secondary-btn" onClick={() => { const codes = printBulkCodes.split(/[\s,;\n]+/).map((c) => normalizeCode(c)).filter(Boolean); codes.forEach((c) => { const row = shipmentRows.find((r) => r.shipment.code === c); if (row) printShipment(row); }); setPrintMessage(`Đã mở popup in cho ${codes.length} code.`); }}>In nhiều vận đơn</button>
                <div className="print-utility-row">
                  <button className="btn btn-ghost" onClick={downloadCsv}>Tải danh sách đơn</button>
                  <button className="btn btn-ghost" onClick={() => window.print()}>Xuất PDF</button>
                </div>
              </div>

              {printMessage ? <p className="message">{printMessage}</p> : null}
            </aside>
          </section> : null}

          {activeView === 'account' ? <section className="account-layout">
            <header className="account-page-header">
              <h2>Tài khoản</h2>
              <p className="muted">Quản lý thông tin định danh và cài đặt bảo mật của bạn.</p>
            </header>

            <div className="account-grid">
              <div className="account-main-column">
                <section className="card account-profile-card">
                  <div className="account-card-header">
                    <span className="account-card-icon">ID</span>
                    <h3>Thông tin tài khoản</h3>
                  </div>
                  <div className="account-profile-content">
                    <div className="account-avatar-block">
                      <div className="account-avatar">{(session.user.username ?? 'M').slice(0, 2).toUpperCase()}</div>
                      <button className="account-avatar-edit" type="button">Sửa</button>
                    </div>
                    <form className="account-profile-form" onSubmit={(e) => { e.preventDefault(); setAccountMessage('Đã lưu hồ sơ merchant.'); }}>
                      <div className="account-fields-grid">
                        <div className="account-field">
                          <label className="label">Tên Merchant</label>
                          <input className="input" value={profile.shopName} onChange={(e) => setProfile((p) => ({ ...p, shopName: e.target.value }))} placeholder="Tên cửa hàng" />
                        </div>
                        <div className="account-field">
                          <label className="label">Merchant ID</label>
                          <input className="input account-readonly-input" value={session.user.id} readOnly />
                        </div>
                        <div className="account-field">
                          <label className="label">Số điện thoại</label>
                          <input className="input" value={profile.contactPhone} onChange={(e) => setProfile((p) => ({ ...p, contactPhone: e.target.value }))} placeholder="SĐT liên hệ" />
                        </div>
                        <div className="account-field">
                          <label className="label">Email</label>
                          <input className="input" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
                        </div>
                        <div className="account-field account-field--span-2">
                          <label className="label">Địa chỉ kinh doanh / lấy hàng mặc định</label>
                          <textarea className="textarea account-address-field" value={profile.defaultPickupAddress} onChange={(e) => setProfile((p) => ({ ...p, defaultPickupAddress: e.target.value }))} placeholder="Địa chỉ lấy hàng mặc định" />
                        </div>
                      </div>
                      <div className="account-profile-actions">
                        <button className="btn btn-primary" type="submit">Lưu thay đổi</button>
                      </div>
                    </form>
                  </div>
                  {accountMessage ? <p className="message success">{accountMessage}</p> : null}
                </section>
              </div>

              <div className="account-side-column">
                <section className="card account-security-card">
                  <div className="account-card-header">
                    <span className="account-card-icon">PW</span>
                    <h3>Đổi mật khẩu</h3>
                  </div>
                  <form className="account-password-form" onSubmit={(e) => { e.preventDefault(); if (!passwordOld || !passwordNew || !passwordConfirm) { setPasswordMessage('Cần nhập đầy đủ thông tin'); return; } if (passwordNew !== passwordConfirm) { setPasswordMessage('Mật khẩu xác nhận không khớp'); return; } setPasswordMessage('Đã tiếp nhận yêu cầu đổi mật khẩu (scaffold: chưa có API).'); setPasswordOld(''); setPasswordNew(''); setPasswordConfirm(''); }}>
                    <div className="account-field">
                      <label className="label">Mật khẩu hiện tại</label>
                      <input className="input" type="password" value={passwordOld} onChange={(e) => setPasswordOld(e.target.value)} placeholder="Mật khẩu hiện tại" />
                    </div>
                    <div className="account-field">
                      <label className="label">Mật khẩu mới</label>
                      <input className="input" type="password" value={passwordNew} onChange={(e) => setPasswordNew(e.target.value)} placeholder="Mật khẩu mới" />
                      <span className="muted">Tối thiểu 8 ký tự, bao gồm chữ cái và số.</span>
                    </div>
                    <div className="account-field">
                      <label className="label">Xác nhận mật khẩu mới</label>
                      <input className="input" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Xác nhận mật khẩu mới" />
                    </div>
                    <button className="btn btn-ghost account-password-btn" type="submit">Cập nhật mật khẩu</button>
                  </form>
                  {passwordMessage ? <p className="message">{passwordMessage}</p> : null}
                </section>

                <section className="card account-session-card">
                  <div className="account-session-copy">
                    <h4>Trạng thái tài khoản</h4>
                    <div className="account-session-badge">Đã xác thực</div>
                  </div>
                  <div className="account-session-meta">
                    <div><span className="muted">Username</span><strong>{session.user.username}</strong></div>
                    <div><span className="muted">Roles</span><strong>{session.user.roles.join(', ')}</strong></div>
                    <div><span className="muted">Token hết hạn</span><strong>{formatDate(session.accessTokenExpiresAt)}</strong></div>
                  </div>
                </section>
              </div>
            </div>

            <footer className="account-footer muted">Bao mat thong tin merchant la uu tien hang dau cua Nexus Logistic.</footer>
          </section> : null}

          {activeView === 'notifications' ? <section className="notifications-layout">
            <div className="notifications-toolbar">
              <div className="notifications-tabs">
                <button className="notifications-tab notifications-tab--active" type="button">Tất cả</button>
                <button className="notifications-tab" type="button">Đơn hàng</button>
                <button className="notifications-tab" type="button">Hệ thống</button>
                <button className="notifications-tab" type="button">Khuyến mãi</button>
              </div>
              <button className="notifications-mark-all" onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}><span className="notifications-inline-icon">✓</span><span>Đánh dấu tất cả là đã đọc</span></button>
            </div>

            <div className="notifications-list">
              {notifications.length === 0 ? <div className="empty notifications-empty">Chưa có thông báo.</div> : notifications.map((n) => {
                const accentClass = !n.read ? 'notifications-card--unread' : 'notifications-card--read';
                let levelClass = 'info';
                let typeLabel = 'Hỗ trợ';
                let iconLabel = '•';
                if (n.level === 'success') {
                  levelClass = 'success';
                  typeLabel = 'Đơn hàng';
                  iconLabel = '✓';
                } else if (n.level === 'error') {
                  levelClass = 'error';
                  typeLabel = 'Hệ thống';
                  iconLabel = '!';
                } else if (n.level === 'info') {
                  levelClass = 'info';
                  typeLabel = 'Hỗ trợ';
                  iconLabel = '•';
                }
                return <article className={`notifications-card ${accentClass}`} key={n.id}>
                  {!n.read ? <div className="notifications-card-accent" /> : null}
                  <div className={`notifications-card-icon notifications-card-icon--${levelClass}`}>
                    <span>{iconLabel}</span>
                  </div>
                  <div className="notifications-card-body">
                    <div className="notifications-card-head">
                      <h3>{n.title}</h3>
                      <span className="notifications-card-time">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="notifications-card-description">{n.description}</p>
                    <div className="notifications-card-meta">
                      <span className={`notifications-chip notifications-chip--${levelClass}`}>{typeLabel}</span>
                      {!n.read ? <span className="notifications-unread-dot" /> : null}
                    </div>
                    <div className="notifications-card-actions">
                      <button className="btn btn-ghost" onClick={() => setNotifications((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))}>Đánh dấu đã đọc</button>
                      <button className="btn btn-danger" onClick={() => setNotifications((prev) => prev.filter((i) => i.id !== n.id))}>Xóa</button>
                    </div>
                  </div>
                </article>;
              })}
            </div>

            <div className="notifications-footer-bar">
              <span className="muted">Hiển thị {Math.min(notifications.length, 5)} trên tổng số {notifications.length} thông báo</span>
              <button className="btn btn-danger notifications-clear-btn" onClick={() => setNotifications([])}>Xóa toàn bộ</button>
            </div>
          </section> : null}
        </main>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Không tìm thấy phần tử #root');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <MerchantApp />
  </React.StrictMode>,
);





