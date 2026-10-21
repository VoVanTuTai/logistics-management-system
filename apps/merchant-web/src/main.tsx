import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';
import { MerchantLoginForm } from './features/auth/MerchantLoginForm';
import { MerchantSidebar } from './components/layout/MerchantSidebar';
import { MerchantHeader } from './components/layout/MerchantHeader';
import { MerchantDashboardView } from './features/dashboard/MerchantDashboardView';
import { MerchantAccountView } from './features/account/MerchantAccountView';
import { MerchantNotificationsView } from './features/notifications/MerchantNotificationsView';
import { CreateShipmentView } from './features/shipments/CreateShipmentView';
import { PrintShipmentView } from './features/shipments/PrintShipmentView';
import { ShipmentDetailView } from './features/shipments/ShipmentDetailView';
import { ShipmentListView } from './features/shipments/ShipmentListView';
import { ChangeRequestView } from './features/requests/ChangeRequestView';
import { ReturnRequestView } from './features/requests/ReturnRequestView';
import { PickupRequestView } from './features/pickups/PickupRequestView';
import { TrackingLookupView } from './features/tracking/TrackingLookupView';
import { ClaimsView } from './features/claims/ClaimsView';
import { MerchantFinanceView } from './features/finance/MerchantFinanceView';
import { BankProfileModal } from './features/finance/BankProfileModal';
import { SettlementBatchDetailModal } from './features/finance/SettlementBatchDetailModal';
import { TopupVietQRModal } from './features/finance/TopupVietQRModal';
import {
  asNumber,
  asRecord,
  buildShipmentMetadata,
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
  requestPricingQuote,
  statusClass,
  toInputDate,
} from './api';
import type {
  ChangeRequest,
  ClaimIncidentType,
  ClaimStatus,
  CreateShipmentForm,
  IntrospectResponse,
  LoginResponse,
  MerchantClaim,
  MerchantProfile,
  MerchantSession,
  NotificationItem,
  PickupRequest,
  PricingQuoteResponse,
  ResponsibleParty,
  ReturnRequest,
  ShipmentDraft,
  ShipmentResponse,
  ShipmentRow,
  TimelineEvent,
  TrackingCurrent,
  ViewId,
} from './types';
import { DEFAULT_CREATE_FORM, DEFAULT_PROFILE } from './types';
import {
  openMultiShippingLabelPrint,
  openShippingLabelPrint,
  resolveRouteAndCourier,
  type ShippingLabelPrintPayload,
} from './printing/shippingLabelPrint';

import type {
  ConfigApiRecord,
  FinancialLedgerEntry,
  HubApiRecord,
  HubLocationOption,
  MerchantBankProfile,
  MerchantProfileApiRecord,
  MerchantProfileConfigPayload,
  MerchantRegionCode,
  PublicTrackingSnapshotResponse,
  RememberedMerchantCredentials,
  ReturnCaseApiRecord,
  SettlementBatch,
  StoredMerchantSession,
} from './types';
export type { SettlementBatch, FinancialLedgerEntry, MerchantBankProfile };
import {
  ACCESS_TOKEN_REFRESH_WINDOW_MS,
  CLIENT_SESSION_TTL_MS,
  MERCHANT_PROFILE_KEY_PREFIX,
  MERCHANT_PROFILE_SCOPE,
  REMEMBERED_CREDENTIALS_STORAGE_KEY,
  SHIPMENT_PAGE_SIZE,
  STORAGE_KEY_DRAFTS,
  STORAGE_KEY_NOTIFICATIONS,
  STORAGE_KEY_PROFILE,
  STORAGE_KEY_PROFILE_PREFIX,
  STORAGE_KEY_RETURNS,
  STORAGE_KEY_SESSION,
} from './utils/session.utils';
import { DELIVERY_INFO_CHANGE_BLOCKED_STATUSES } from './utils/shipment.utils';


import {
  escapeRegExp,
  findHubByCode,
  findHubByProvince,
  findHubByProvinceWard,
  geocodeAddress,
  normalizeLocationKey,
  parseHubLocation,
  resolveHubByRegion,
  resolveProvinceLabel,
  resolveRegionCode,
  resolveRegionCodeByZoneCode,
  resolveRegionLabel,
  resolveSelectedHub,
  splitDefaultPickupAddress,
  composeDefaultPickupAddress,
} from './utils/location.utils';


import {
  PRICING_METRO_CITIES,
  computeAccurateEstimatedFee,
} from './utils/pricing.utils';
import {
  buildMerchantProfileKey,
  buildProfileStorageKey,
} from './utils/session.utils';


import {
  assertMerchantUser,
  clearRememberedCredentials,
  formatMerchantAuthErrorMessage,
  getRememberedCredentials,
  isClientSessionExpired,
  isTokenExpired,
  mapLoginResponseToMerchantSession,
  mapMerchantProfileRecord,
  parseMerchantProfileConfig,
  readStoredMerchantSession,
  refreshMerchantSession,
  saveRememberedCredentials,
  shouldRefreshAccessToken,
  writeStoredMerchantSession,
} from './utils/session.utils';


import {
  buildChangeRequestPayload,
  filterPickupRequestsByUser,
  isReturnRequestAllowed,
  isShipmentOwnedByUser,
  mapReturnCaseToRequest,
  normalizeCreateForm,
  normalizeMerchantIdentity,
  normalizePhone,
  parseReturnCaseNote,
} from './utils/shipment.utils';











function MerchantApp(): React.JSX.Element {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<MerchantSession | null>(null);
  const [activeView, setActiveView] = useState<ViewId>('dashboard');

  const remembered = useMemo(() => getRememberedCredentials(), []);
  const [loginUsername, setLoginUsername] = useState(remembered?.username ?? '');
  const [loginPassword, setLoginPassword] = useState(remembered?.password ?? '');
  const [rememberMe, setRememberMe] = useState(remembered ? remembered.rememberMe : true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = getRememberedCredentials();
    if (saved && saved.rememberMe) {
      if (saved.username) setLoginUsername(saved.username);
      if (saved.password) setLoginPassword(saved.password);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!loginError) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLoginError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loginError]);

  const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateShipmentForm>(DEFAULT_CREATE_FORM);
  const [quotedFee, setQuotedFee] = useState<number | null>(null);
  const [pricingQuote, setPricingQuote] = useState<PricingQuoteResponse | null>(null);
  const [showMerchantFormulaHelp, setShowMerchantFormulaHelp] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
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
  const [pickupNote, setPickupNote] = useState('');
  const [pickupStatusFilter, setPickupStatusFilter] = useState('ALL');
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupMessage, setPickupMessage] = useState<string | null>(null);
  const [dispatchTasks, setDispatchTasks] = useState<any[]>([]);
  const [shippers, setShippers] = useState<any[]>([]);

  const [trackingCode, setTrackingCode] = useState('');
  const [trackingCurrent, setTrackingCurrent] = useState<TrackingCurrent | null>(null);
  const [trackingTimeline, setTrackingTimeline] = useState<TimelineEvent[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

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
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnMessage, setReturnMessage] = useState<string | null>(null);

  const [printSingleCode, setPrintSingleCode] = useState('');
  const [printBulkCodes, setPrintBulkCodes] = useState('');
  const [printMessage, setPrintMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<MerchantProfile>(DEFAULT_PROFILE);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const [passwordOld, setPasswordOld] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showTopupModal, setShowTopupModal] = useState(false);

  // Claims & Disputes State
  const [claims, setClaims] = useState<MerchantClaim[]>([]);
  const [claimShipmentCode, setClaimShipmentCode] = useState('');
  const [claimIncidentType, setClaimIncidentType] = useState<ClaimIncidentType>('DAMAGE');
  const [claimRequestedAmount, setClaimRequestedAmount] = useState('');
  const [claimDamageDesc, setClaimDamageDesc] = useState('');
  const [claimPackageDesc, setClaimPackageDesc] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [selectedClaimDetail, setSelectedClaimDetail] = useState<MerchantClaim | null>(null);
  const [claimSearch, setClaimSearch] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('ALL');
  const [isCreateClaimOpen, setIsCreateClaimOpen] = useState(false);

  // Finance & Settlement State
  const [financeSubTab, setFinanceSubTab] = useState<'overview' | 'batches' | 'ledger' | 'settings'>('overview');
  const [financeLedgerSearch, setFinanceLedgerSearch] = useState('');
  const [financeLedgerTypeFilter, setFinanceLedgerTypeFilter] = useState('ALL');
  const [financeBatchStatusFilter, setFinanceBatchStatusFilter] = useState('ALL');
  const [selectedSettlementBatch, setSelectedSettlementBatch] = useState<SettlementBatch | null>(null);
  const [isEditingBankModalOpen, setIsEditingBankModalOpen] = useState(false);

  const [merchantBankProfile, setMerchantBankProfile] = useState<MerchantBankProfile>(() => {
    try {
      const saved = localStorage.getItem('nexus_merchant_bank_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      bankName: 'Techcombank',
      accountNumber: '19036788992011',
      accountHolder: 'NEXUS MERCHANT PARTNER',
      branch: 'Hội sở chính / CN Sài Gòn',
      payoutSchedule: 'MWF',
      autoPayout: true,
    };
  });

  const [editBankForm, setEditBankForm] = useState<MerchantBankProfile>(merchantBankProfile);

  const navItems: Array<{ id: ViewId; label: string; icon: string; subtitle: string }> = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'dashboard', subtitle: 'Merchant Portal > Tổng quan' },
    { id: 'create-shipment', label: 'Tạo đơn hàng', icon: 'add_box', subtitle: 'Đơn hàng > Tạo đơn hàng' },
    { id: 'shipments', label: 'Danh sách đơn hàng', icon: 'inventory_2', subtitle: 'Đơn hàng > Danh sách đơn hàng' },
    { id: 'pickups', label: 'Yêu cầu lấy hàng', icon: 'local_shipping', subtitle: 'Đơn hàng > Yêu cầu lấy hàng' },
    { id: 'tracking', label: 'Tra cứu vận đơn', icon: 'search', subtitle: 'Đơn hàng > Tra cứu vận đơn' },
    { id: 'returns', label: 'Yêu cầu hoàn hàng', icon: 'assignment_return', subtitle: 'Đơn hàng > Yêu cầu hoàn hàng' },
    { id: 'claims', label: 'Khiếu nại & Bồi thường', icon: 'gavel', subtitle: 'Khiếu nại & Đền bù > Quản lý sự cố' },
    { id: 'finance', label: 'Đối soát & Tài chính', icon: 'account_balance_wallet', subtitle: 'Tài chính > Quản lý tiền hàng & Đối soát COD' },
    { id: 'print', label: 'In vận đơn', icon: 'print', subtitle: 'Đơn hàng > In vận đơn' },
    { id: 'account', label: 'Tài khoản', icon: 'person', subtitle: 'Tài khoản > Hồ sơ merchant' },
    { id: 'notifications', label: 'Thông báo', icon: 'notifications', subtitle: 'Hệ thống > Thông báo' },
  ];

  const shipmentRows = useMemo(() => shipments.map((s) => extractShipmentRow(s)), [shipments]);

  interface NavGroupItem {
    id: ViewId;
    label: string;
    icon: string;
    badge?: string;
    badgeType?: 'hot' | 'cod' | 'count';
  }

  interface NavGroup {
    groupTitle: string;
    items: NavGroupItem[];
  }

  const navGroups: NavGroup[] = useMemo(() => [
    {
      groupTitle: 'Tổng quan & Tra cứu',
      items: [
        { id: 'dashboard', label: 'Tổng quan vận hành', icon: 'dashboard' },
        { id: 'tracking', label: 'Tra cứu hành trình', icon: 'travel_explore' },
      ],
    },
    {
      groupTitle: 'Vận hành đơn hàng',
      items: [
        { id: 'create-shipment', label: 'Tạo đơn hàng mới', icon: 'add_circle', badge: 'Mới', badgeType: 'hot' },
        { id: 'shipments', label: 'Danh sách đơn hàng', icon: 'inventory_2', badge: shipmentRows.length > 0 ? String(shipmentRows.length) : undefined, badgeType: 'count' },
        { id: 'pickups', label: 'Yêu cầu lấy hàng', icon: 'local_shipping' },
        { id: 'print', label: 'In vận đơn hàng loạt', icon: 'print' },
      ],
    },
    {
      groupTitle: 'Xử lý sau giao & Sự cố',
      items: [
        { id: 'returns', label: 'Yêu cầu hoàn hàng', icon: 'assignment_return' },
        { id: 'claims', label: 'Khiếu nại & Bồi thường', icon: 'gavel' },
      ],
    },
    {
      groupTitle: 'Tài chính & Cấu hình',
      items: [
        { id: 'finance', label: 'Đối soát & Tài chính', icon: 'account_balance_wallet', badge: 'COD', badgeType: 'cod' },
        { id: 'account', label: 'Tài khoản & Hợp đồng', icon: 'manage_accounts' },
        { id: 'notifications', label: 'Thông báo hệ thống', icon: 'notifications' },
      ],
    },
  ], [shipmentRows.length]);

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
  const trackingShipmentRow = useMemo(() => {
    const code = normalizeCode(trackingCurrent?.shipmentCode ?? trackingCode);
    if (!code) {
      return null;
    }

    return shipmentRows.find((row) => normalizeCode(row.shipment.code) === code) ?? null;
  }, [shipmentRows, trackingCode, trackingCurrent]);
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
  const selectedAccountProvinceHub = useMemo(
    () => findHubByProvince(hubLocations, profile.defaultPickupProvince),
    [hubLocations, profile.defaultPickupProvince],
  );
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
  const autoEstimatedFee = useMemo(() => {
    return computeAccurateEstimatedFee(
      createForm,
      lockedSenderHub?.province ?? createForm.senderProvince,
      selectedReceiverHub?.province ?? createForm.receiverProvince,
    );
  }, [createForm, lockedSenderHub, selectedReceiverHub]);
  const effectiveFee = pricingQuote?.totalFee ?? quotedFee ?? autoEstimatedFee;
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
  const trackingPickupRequest = useMemo(() => {
    const code = normalizeCode(trackingShipmentRow?.shipment.code ?? trackingCurrent?.shipmentCode ?? trackingCode);
    return code ? pickupByShipmentCode.get(code) ?? null : null;
  }, [pickupByShipmentCode, trackingCode, trackingCurrent, trackingShipmentRow]);
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
  const pickupSelectableRows = useMemo(
    () =>
      shipmentRows.filter(
        (row) => !pickupByShipmentCode.has(normalizeCode(row.shipment.code)),
      ),
    [shipmentRows, pickupByShipmentCode],
  );
  const selectedPickupCodeSet = useMemo(() => {
    const codes = pickupShipmentCodes
      .split(/[\s,;\n]+/)
      .map((code) => normalizeCode(code))
      .filter(Boolean);

    return new Set(codes);
  }, [pickupShipmentCodes]);
  const selectedPickupRows = useMemo(
    () =>
      pickupSelectableRows.filter((row) =>
        selectedPickupCodeSet.has(normalizeCode(row.shipment.code)),
      ),
    [pickupSelectableRows, selectedPickupCodeSet],
  );
  const allPickupRowsSelected =
    pickupSelectableRows.length > 0 &&
    pickupSelectableRows.every((row) =>
      selectedPickupCodeSet.has(normalizeCode(row.shipment.code)),
    );
  const changeRows = useMemo(() => changeRequests.filter((c) => (changeStatusFilter === 'ALL' ? true : c.status === changeStatusFilter)), [changeRequests, changeStatusFilter]);
  const returnRows = useMemo(() => returnRequests.filter((r) => (returnStatusFilter === 'ALL' ? true : r.status === returnStatusFilter)), [returnRequests, returnStatusFilter]);

  function formatPickupWindowDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function resolvePickupWindowForShipment(row: ShipmentRow): string {
    const createdAt = new Date(row.shipment.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return 'Tự động theo giờ tạo đơn';
    }

    if (createdAt.getHours() < 12) {
      return `Lấy trong ngày ${formatPickupWindowDate(createdAt)}`;
    }

    const tomorrowNoon = new Date(createdAt);
    tomorrowNoon.setDate(tomorrowNoon.getDate() + 1);
    return `Lấy trước 12:00 trưa ${formatPickupWindowDate(tomorrowNoon)}`;
  }

  function resolvePickupWindowSummary(rows: ShipmentRow[]): string {
    if (rows.length === 0) {
      return 'Chọn đơn để hệ thống tự tính thời gian lấy hàng';
    }

    const uniqueWindows = Array.from(new Set(rows.map(resolvePickupWindowForShipment)));
    if (uniqueWindows.length === 1) {
      return uniqueWindows[0] ?? 'Tự động theo giờ tạo đơn';
    }

    return uniqueWindows.map((window) => {
      const count = rows.filter((row) => resolvePickupWindowForShipment(row) === window).length;
      return `${count} đơn: ${window}`;
    }).join(' · ');
  }

  const selectedPickupWindowSummary = resolvePickupWindowSummary(selectedPickupRows);

  function resolveShipperForPickup(pickup: PickupRequest): string {
    const task = dispatchTasks.find(
      (t) =>
        t.pickupRequestId === pickup.id ||
        (t.shipmentCode && pickup.items?.some((pi) => normalizeCode(pi.shipmentCode) === normalizeCode(t.shipmentCode)))
    );
    if (!task) {
      return 'Chưa gán';
    }

    const activeAssignment = task.assignments?.find(
      (a: any) => !a.unassignedAt
    );
    if (!activeAssignment) {
      return 'Chưa gán';
    }

    const courierId = activeAssignment.courierId;
    const shipper = shippers.find(
      (s) => normalizeCode(s.username) === normalizeCode(courierId)
    );

    if (shipper && shipper.displayName) {
      return `${courierId} - ${shipper.displayName}`;
    }

    return courierId;
  }

  function togglePickupShipmentSelection(code: string, checked: boolean): void {
    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      return;
    }

    setPickupShipmentCodes((previous) => {
      const nextCodes = new Set(
        previous
          .split(/[\s,;\n]+/)
          .map((item) => normalizeCode(item))
          .filter(Boolean),
      );

      if (checked) {
        nextCodes.add(normalizedCode);
      } else {
        nextCodes.delete(normalizedCode);
      }

      return Array.from(nextCodes).join('\n');
    });
  }

  function toggleAllPickupShipments(checked: boolean): void {
    setPickupShipmentCodes(
      checked
        ? pickupSelectableRows.map((row) => normalizeCode(row.shipment.code)).join('\n')
        : '',
    );
  }

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
      case 'MANIFEST_UNSEALED':
        return 'Gỡ bao';
      case 'SEND_GOODS':
        return 'Đã gửi hàng';
      case 'SCAN_INBOUND':
        return 'Hàng đến';
      case 'SCAN_OUTBOUND':
        return 'Gửi hàng';
      case 'INVENTORY_CHECK':
        return 'Kiểm tồn kho';
      case 'TASK_ASSIGNED':
      case 'OUT_FOR_DELIVERY':
        return 'Phát hàng';
      case 'DELIVERED':
        return 'Ký nhận';
      case 'DELIVERY_FAILED':
        return 'Ghi nhận vấn đề';
      case 'NDR_CREATED':
        return 'Cần xử lý NDR';
      case 'EXCEPTION':
        return 'Sự cố ngoại lệ';
      case 'RETURN_STARTED':
        return 'Đang hoàn hàng';
      case 'RETURN_COMPLETED':
        return 'Đã hoàn hàng';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return shipment.currentStatus;
    }
  }

  function resolveShipmentStatusClass(shipment: ShipmentResponse): string {
    return resolveShipmentStatusCode(shipment) === 'WAITING_PICKUP'
      ? statusClass('UPDATED')
      : statusClass(shipment.currentStatus);
  }

  function resolveDeliveryInfoChangeBlockReason(row: ShipmentRow | null): string | null {
    if (!row) {
      return null;
    }

    if (DELIVERY_INFO_CHANGE_BLOCKED_STATUSES.has(row.shipment.currentStatus)) {
      return 'Chỉ được đổi thông tin giao trước khi đơn hàng được phân công đi phát.';
    }

    return null;
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

  function formatTrackingEventName(eventType: string): string {
    const map: Record<string, string> = {
      CREATED: 'Tạo đơn hàng',
      SHIPMENT_CREATED: 'Đã tạo vận đơn',
      PICKUP_REQUESTED: 'Tạo yêu cầu lấy hàng',
      TASK_ASSIGNED: 'Đã phân công shipper',
      PICKUP_ASSIGNED: 'Đã phân công shipper lấy hàng',
      PICKED_UP: 'Shipper đã lấy hàng',
      PICKUP_COMPLETED: 'Lấy hàng thành công',
      IN_HUB_SENDER: 'Nhập kho gửi (Sender Hub)',
      HUB_INBOUND: 'Hàng nhập kho trung chuyển',
      SCAN_INBOUND: 'Quét hàng nhập kho',
      MANIFEST_SEALED: 'Đóng bao / Niêm phong chuyến xe',
      MANIFEST_RECEIVED: 'Nhận bao hàng luân chuyển',
      MANIFEST_UNSEALED: 'Mở niêm phong chuyến xe',
      SEND_GOODS: 'Chuyển hàng sang chặng tiếp',
      IN_TRANSIT: 'Đang vận chuyển liên kho',
      HUB_OUTBOUND: 'Xuất kho luân chuyển',
      SCAN_OUTBOUND: 'Quét xuất kho chuyển tiếp',
      IN_HUB_RECEIVER: 'Hàng đến kho đích (Receiver Hub)',
      OUT_FOR_DELIVERY: 'Shipper đang giao hàng',
      DELIVERED: 'Giao hàng thành công (Ký nhận)',
      DELIVERY_FAILED: 'Giao hàng không thành công',
      NDR_CREATED: 'Báo cáo giao không thành (NDR)',
      RETURN_INITIATED: 'Bắt đầu quy trình hoàn hàng',
      RETURN_STARTED: 'Đang chuyển hoàn về người gửi',
      RETURN_COMPLETED: 'Đã hoàn hàng về người gửi',
      CANCELLED: 'Đã hủy đơn hàng',
    };
    return map[eventType.toUpperCase()] ?? eventType.replace(/_/g, ' ');
  }

  function getTrackingEventIcon(eventType: string): string {
    const upper = eventType.toUpperCase();
    if (upper.includes('DELIVERED') && !upper.includes('FAIL')) return 'check_circle';
    if (upper.includes('FAIL') || upper.includes('CANCEL') || upper.includes('NDR')) return 'error';
    if (upper.includes('OUT_FOR_DELIVERY')) return 'local_shipping';
    if (upper.includes('HUB') || upper.includes('INBOUND') || upper.includes('OUTBOUND')) return 'warehouse';
    if (upper.includes('TRANSIT') || upper.includes('MANIFEST') || upper.includes('SEND_GOODS')) return 'move_to_inbox';
    if (upper.includes('PICK')) return 'inventory_2';
    if (upper.includes('RETURN')) return 'assignment_return';
    return 'event_note';
  }

  const dashboardStats = useMemo(
    () => ({
      totalToday: shipments.filter((s) => isToday(s.createdAt)).length,
      waitingPickup: shipments.filter((s) => resolveShipmentStatusCode(s) === 'WAITING_PICKUP').length,
      inTransit: shipments.filter((s) => ['PICKUP_COMPLETED', 'TASK_ASSIGNED', 'MANIFEST_SEALED', 'MANIFEST_RECEIVED', 'MANIFEST_UNSEALED', 'SEND_GOODS', 'SCAN_INBOUND', 'SCAN_OUTBOUND', 'IN_TRANSIT', 'INVENTORY_CHECK'].includes(s.currentStatus)).length,
      delivered: shipments.filter((s) => s.currentStatus === 'DELIVERED').length,
      failedOrReturn: shipments.filter((s) => ['DELIVERY_FAILED', 'NDR_CREATED', 'EXCEPTION', 'RETURN_STARTED', 'RETURN_COMPLETED', 'CANCELLED'].includes(s.currentStatus)).length,
    }),
    [shipments, pickupByShipmentCode],
  );

  const dashboardInsights = useMemo(() => {
    const formatLocalDateKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const statusGroups = [
      { key: 'waiting', label: 'Chờ pickup', color: '#8b5f07', count: 0 },
      { key: 'transit', label: 'Đang giao', color: '#0059b8', count: 0 },
      { key: 'delivered', label: 'Đã giao', color: '#127a56', count: 0 },
      { key: 'issue', label: 'Vấn đề / hoàn', color: '#ba1a1a', count: 0 },
      { key: 'created', label: 'Mới tạo', color: '#7c8aa2', count: 0 },
    ];
    const statusByKey = new Map(statusGroups.map((item) => [item.key, item]));

    for (const row of shipmentRows) {
      const status = resolveShipmentStatusCode(row.shipment);
      if (status === 'WAITING_PICKUP') {
        statusByKey.get('waiting')!.count += 1;
      } else if (['PICKUP_COMPLETED', 'TASK_ASSIGNED', 'MANIFEST_SEALED', 'MANIFEST_RECEIVED', 'MANIFEST_UNSEALED', 'SEND_GOODS', 'SCAN_INBOUND', 'SCAN_OUTBOUND', 'IN_TRANSIT', 'INVENTORY_CHECK', 'OUT_FOR_DELIVERY'].includes(status)) {
        statusByKey.get('transit')!.count += 1;
      } else if (status === 'DELIVERED') {
        statusByKey.get('delivered')!.count += 1;
      } else if (['DELIVERY_FAILED', 'NDR_CREATED', 'EXCEPTION', 'RETURN_STARTED', 'RETURN_COMPLETED', 'CANCELLED'].includes(status)) {
        statusByKey.get('issue')!.count += 1;
      } else {
        statusByKey.get('created')!.count += 1;
      }
    }

    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dailySeries = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(dayStart);
      date.setDate(dayStart.getDate() - (6 - index));
      const key = formatLocalDateKey(date);
      return {
        key,
        label: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        shortDate: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        orders: 0,
        fee: 0,
      };
    });
    const dailyByKey = new Map(dailySeries.map((item) => [item.key, item]));

    let totalFee = 0;
    let totalCod = 0;
    let deliveredCod = 0;

    for (const row of shipmentRows) {
      totalFee += row.feeEstimate;
      totalCod += row.codAmount;
      if (row.shipment.currentStatus === 'DELIVERED') {
        deliveredCod += row.codAmount;
      }

      const createdAt = new Date(row.shipment.createdAt);
      const key = Number.isNaN(createdAt.getTime()) ? '' : formatLocalDateKey(createdAt);
      const dailyItem = dailyByKey.get(key);
      if (dailyItem) {
        dailyItem.orders += 1;
        dailyItem.fee += row.feeEstimate;
      }
    }

    const maxDailyOrders = Math.max(1, ...dailySeries.map((item) => item.orders));
    const maxDailyFee = Math.max(1, ...dailySeries.map((item) => item.fee));
    const totalShipments = shipmentRows.length;
    const deliveryRate = totalShipments > 0 ? Math.round((dashboardStats.delivered / totalShipments) * 100) : 0;
    const issueRate = totalShipments > 0 ? Math.round((dashboardStats.failedOrReturn / totalShipments) * 100) : 0;
    const cashItems = [
      { label: 'COD thu hộ', value: totalCod, color: '#0052cc' },
      { label: 'COD đã giao', value: deliveredCod, color: '#127a56' },
      { label: 'Phí vận chuyển ước tính', value: totalFee, color: '#006477' },
    ];
    const maxCashValue = Math.max(1, ...cashItems.map((item) => item.value));

    let progress = 0;
    const donutGradient =
      totalShipments === 0
        ? '#e1e8ff'
        : `conic-gradient(${statusGroups
            .map((item) => {
              const start = progress;
              progress += (item.count / totalShipments) * 100;
              return `${item.color} ${start}% ${progress}%`;
            })
            .join(', ')})`;

    const netBalance = deliveredCod - totalFee;
    const isNegativeBalanceLocked = netBalance < -500_000;

    return {
      dailySeries,
      maxDailyOrders,
      maxDailyFee,
      statusGroups,
      totalFee,
      totalCod,
      deliveredCod,
      netBalance,
      isNegativeBalanceLocked,
      deliveryRate,
      issueRate,
      cashItems,
      maxCashValue,
      donutGradient,
    };
  }, [shipmentRows, dashboardStats.delivered, dashboardStats.failedOrReturn, pickupByShipmentCode]);

  const insights = dashboardInsights;

  // Financial Ledger Calculation (Real-time Statement)
  const financialLedger = useMemo<FinancialLedgerEntry[]>(() => {
    const entries: Array<Omit<FinancialLedgerEntry, 'balanceAfter'> & { timestamp: number }> = [];

    // 1. Shipments: Fees and Delivered COD
    shipmentRows.forEach((row, idx) => {
      const ship = row.shipment;
      const createdTime = new Date(ship.createdAt).getTime() || (Date.now() - (idx + 1) * 3600000);
      const updatedTime = new Date(ship.updatedAt).getTime() || (createdTime + 1800000);

      // Cước phí vận chuyển (Trừ tiền)
      if (row.feeEstimate > 0) {
        entries.push({
          id: `FEE-${ship.code}`,
          timestamp: createdTime,
          occurredAt: ship.createdAt,
          type: 'SHIPPING_FEE',
          title: `Cước vận chuyển đơn hàng #${ship.code}`,
          shipmentCode: ship.code,
          amount: -Math.abs(row.feeEstimate),
          note: `${row.serviceType || 'Tiêu chuẩn'} - ${row.weightKg}kg`,
        });
      }

      // Tiền thu hộ COD khi phát thành công (Cộng tiền)
      const st = String(ship.currentStatus ?? '').toUpperCase();
      if (st.includes('DELIVERED') && row.codAmount > 0) {
        entries.push({
          id: `COD-${ship.code}`,
          timestamp: updatedTime,
          occurredAt: ship.updatedAt,
          type: 'COD_COLLECTED',
          title: `Thu hộ COD đơn hàng #${ship.code}`,
          shipmentCode: ship.code,
          amount: Math.abs(row.codAmount),
          note: `Giao thành công cho ${row.receiverName}`,
        });
      }

      // Phí chuyển hoàn 50% nếu đơn thất bại/hoàn trả
      if (st.includes('RETURN') || st.includes('FAIL')) {
        const returnFee = Math.round(row.feeEstimate * 0.5);
        if (returnFee > 0) {
          entries.push({
            id: `RET-${ship.code}`,
            timestamp: updatedTime + 1000,
            occurredAt: ship.updatedAt,
            type: 'RETURN_FEE',
            title: `Phí chuyển hoàn 50% đơn #${ship.code}`,
            shipmentCode: ship.code,
            amount: -Math.abs(returnFee),
            note: 'Chuyển hoàn kho người gửi',
          });
        }
      }
    });

    // 2. Claim compensations (Cộng tiền bồi thường)
    claims.forEach((claim) => {
      if (
        (claim.status === 'PAYMENT_APPROVED' || claim.status === 'SETTLED' || claim.status === 'ADJUDICATED') &&
        (claim.approvedCompensationAmount ?? 0) > 0
      ) {
        const time = new Date(claim.adjudicatedAt || claim.createdAt).getTime();
        entries.push({
          id: `CLM-${claim.claimCode}`,
          timestamp: time,
          occurredAt: claim.adjudicatedAt || claim.createdAt,
          type: 'CLAIM_COMPENSATION',
          title: `Bồi thường sự cố khiếu nại #${claim.claimCode}`,
          shipmentCode: claim.shipmentCode,
          amount: Math.abs(claim.approvedCompensationAmount),
          note: `${claim.incidentType} - Đã thẩm định chấp thuận`,
        });
      }
    });

    // Sắp xếp thời gian tăng dần để cộng dồn số dư chính xác
    entries.sort((a, b) => a.timestamp - b.timestamp);

    let running = 0;
    const computed: FinancialLedgerEntry[] = entries.map((item) => {
      running += item.amount;
      return {
        id: item.id,
        occurredAt: item.occurredAt,
        type: item.type,
        title: item.title,
        shipmentCode: item.shipmentCode,
        amount: item.amount,
        balanceAfter: running,
        note: item.note,
      };
    });

    // Trả về thời gian giảm dần (giao dịch mới nhất lên đầu)
    return computed.reverse();
  }, [shipmentRows, claims]);

  // Settlement Batches (Kỳ đối soát định kỳ T2 - T4 - T6)
  const settlementBatches = useMemo<SettlementBatch[]>(() => {
    const deliveredRows = shipmentRows.filter((r) => {
      const st = String(r.shipment.currentStatus ?? '').toUpperCase();
      return st.includes('DELIVERED');
    });

    const half = Math.ceil(deliveredRows.length / 2);
    const batchCurrentRows = deliveredRows.slice(0, half > 0 ? half : deliveredRows.length);
    const batchPastRows = deliveredRows.slice(half > 0 ? half : 0);

    const makeBatch = (
      code: string,
      cycleName: string,
      fromDate: string,
      toDate: string,
      payoutDate: string,
      items: typeof deliveredRows,
      status: 'PAID' | 'PROCESSING' | 'PENDING',
      transferRef?: string,
    ): SettlementBatch => {
      const codTotal = items.reduce((sum, r) => sum + r.codAmount, 0);
      const feeTotal = items.reduce((sum, r) => sum + r.feeEstimate, 0);
      const returnFeeTotal = 0;
      const netPayout = codTotal - feeTotal - returnFeeTotal;
      return {
        id: code,
        code,
        cycleName,
        fromDate,
        toDate,
        payoutDate,
        orderCount: items.length,
        codTotal,
        feeTotal,
        returnFeeTotal,
        netPayout,
        status,
        bankInfo: `${merchantBankProfile.bankName} •••• ${merchantBankProfile.accountNumber.slice(-4)}`,
        transferRef,
        shipmentCodes: items.map((r) => r.shipment.code),
      };
    };

    const batches: SettlementBatch[] = [];

    // Kỳ hiện tại: Đang xử lý
    batches.push(
      makeBatch(
        'ST-20261016-01',
        'Kỳ Thứ 6 (14/10 - 16/10/2026)',
        '2026-10-14',
        '2026-10-16',
        '2026-10-16 17:00',
        batchCurrentRows.length > 0 ? batchCurrentRows : deliveredRows,
        'PROCESSING',
        undefined,
      ),
    );

    // Kỳ trước: Đã chi trả thành công
    batches.push(
      makeBatch(
        'ST-20261014-01',
        'Kỳ Thứ 4 (11/10 - 13/10/2026)',
        '2026-10-11',
        '2026-10-13',
        '2026-10-14 16:30',
        batchPastRows.length > 0 ? batchPastRows : deliveredRows.slice(0, 1),
        'PAID',
        'NEXUS_BATCH_99210384',
      ),
    );

    return batches;
  }, [shipmentRows, merchantBankProfile]);

  // Export Settlement Batch to CSV (BOM UTF-8 standard for Excel)
  const exportBatchToCsv = (batch: SettlementBatch) => {
    const items = shipmentRows.filter((r) => batch.shipmentCodes.includes(r.shipment.code));
    const headers = [
      'Mã vận đơn',
      'Ngày tạo đơn',
      'Người nhận',
      'Số điện thoại',
      'Địa chỉ giao',
      'Tiền COD thu hộ (VNĐ)',
      'Cước vận chuyển (VNĐ)',
      'Thực nhận (VNĐ)',
      'Trạng thái đơn',
    ];

    const rows = items.map((r) => [
      r.shipment.code,
      formatDate(r.shipment.createdAt),
      `"${r.receiverName.replace(/"/g, '""')}"`,
      r.receiverPhone,
      `"${r.receiverAddress.replace(/"/g, '""')}"`,
      r.codAmount,
      r.feeEstimate,
      r.codAmount - r.feeEstimate,
      resolveShipmentStatusLabel(r.shipment),
    ]);

    const csvContent =
      '\uFEFF' +
      [
        `BẢNG KÊ ĐỐI SOÁT CHI TIẾT - PHIÊN ${batch.code}`,
        `Kỳ đối soát: ${batch.cycleName}`,
        `Ngày chi trả: ${batch.payoutDate}`,
        `Tổng tiền COD: ${batch.codTotal} VNĐ`,
        `Tổng cước cấn trừ: ${batch.feeTotal} VNĐ`,
        `Thực nhận: ${batch.netPayout} VNĐ`,
        `Tài khoản thụ hưởng: ${batch.bankInfo}`,
        '',
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_ke_doi_soat_${batch.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Full Ledger to CSV
  const exportAllLedgerCsv = () => {
    const headers = [
      'Thời gian',
      'Mã giao dịch',
      'Loại giao dịch',
      'Nội dung',
      'Mã vận đơn',
      'Biến động (VNĐ)',
      'Số dư sau GD (VNĐ)',
      'Ghi chú',
    ];

    const rows = financialLedger.map((e) => [
      formatDate(e.occurredAt),
      e.id,
      e.type,
      `"${e.title.replace(/"/g, '""')}"`,
      e.shipmentCode || '-',
      e.amount,
      e.balanceAfter,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [
        `SỔ CÁI BIẾN ĐỘNG TÀI CHÍNH NEXUS LOGISTICS - ${merchantBankProfile.accountHolder}`,
        `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`,
        `Số dư hiện tại: ${insights.netBalance} VNĐ`,
        '',
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `So_cai_tai_chinh_Nexus_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Save Bank Profile
  const handleSaveBankProfile = (e: FormEvent) => {
    e.preventDefault();
    setMerchantBankProfile(editBankForm);
    try {
      localStorage.setItem('nexus_merchant_bank_settings', JSON.stringify(editBankForm));
    } catch {
      // ignore
    }
    setIsEditingBankModalOpen(false);
    alert('Đã cập nhật tài khoản ngân hàng thụ hưởng thành công!');
  };

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
    const parsedDefaultAddress = splitDefaultPickupAddress(defaultAddress, provinceOptions);
    const defaultProvince = parsedDefaultAddress.province || lockedSenderHub.province;
    const defaultProfileAddressDetail =
      defaultAddressDetail || parsedDefaultAddress.addressDetail;
    const defaultProfileAddress =
      composeDefaultPickupAddress(defaultProfileAddressDetail, defaultProvince) ||
      defaultAddress ||
      lockedSenderHub.fullAddress;

    setCreateForm((previous) => {
      const next = { ...previous };
      let hasChanges = false;

      const targetSenderName = defaultSenderName || previous.senderName;
      if (targetSenderName && next.senderName !== targetSenderName) {
        next.senderName = targetSenderName;
        hasChanges = true;
      }
      const targetSenderPhone = defaultSenderPhone || previous.senderPhone;
      if (targetSenderPhone && next.senderPhone !== targetSenderPhone) {
        next.senderPhone = targetSenderPhone;
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
      const targetAddressDetail = defaultProfileAddressDetail || defaultAddressDetail || defaultAddress;
      if (targetAddressDetail && next.senderAddressDetail !== targetAddressDetail) {
        next.senderAddressDetail = targetAddressDetail;
        hasChanges = true;
      }
      const targetAddress = defaultProfileAddress || defaultAddress;
      if (targetAddress && next.senderAddress !== targetAddress) {
        next.senderAddress = targetAddress;
        hasChanges = true;
      }
      const targetLat =
        merchantProfileConfig?.latitude ??
        lockedSenderHub.latitude ??
        undefined;
      const targetLng =
        merchantProfileConfig?.longitude ??
        lockedSenderHub.longitude ??
        undefined;
      if (next.senderLatitude !== targetLat) {
        next.senderLatitude = targetLat;
        hasChanges = true;
      }
      if (next.senderLongitude !== targetLng) {
        next.senderLongitude = targetLng;
        hasChanges = true;
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
        defaultPickupProvince: defaultProvince || previous.defaultPickupProvince,
        defaultPickupAddressDetail:
          defaultProfileAddressDetail || previous.defaultPickupAddressDetail,
        defaultPickupAddress:
          defaultProfileAddress ||
          previous.defaultPickupAddress ||
          lockedSenderHub.fullAddress,
        latitude:
          merchantProfileConfig?.latitude ??
          lockedSenderHub.latitude ??
          previous.latitude,
        longitude:
          merchantProfileConfig?.longitude ??
          lockedSenderHub.longitude ??
          previous.longitude,
      };

      if (
        nextProfile.shopName === previous.shopName &&
        nextProfile.contactPhone === previous.contactPhone &&
        nextProfile.defaultPickupProvince === previous.defaultPickupProvince &&
        nextProfile.defaultPickupAddressDetail === previous.defaultPickupAddressDetail &&
        nextProfile.defaultPickupAddress === previous.defaultPickupAddress &&
        nextProfile.latitude === previous.latitude &&
        nextProfile.longitude === previous.longitude
      ) {
        return previous;
      }

      return nextProfile;
    });
  }, [
    session,
    lockedSenderHub,
    merchantProfileConfig,
    provinceOptions,
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
    // Legacy shared profile key caused data leakage between merchant accounts.
    window.localStorage.removeItem(STORAGE_KEY_PROFILE);

    const stored = readStoredMerchantSession();
    const storedSession = stored?.session ?? null;
    if (!storedSession) {
      setBooting(false);
      return;
    }

    (async () => {
      try {
        if (stored && isClientSessionExpired(stored.storedAt)) {
          throw new Error('Phiên đăng nhập đã quá 24 giờ. Vui lòng đăng nhập lại.');
        }

        let nextSession = shouldRefreshAccessToken(storedSession)
          ? await refreshMerchantSession(storedSession)
          : storedSession;

        try {
          const introspect = await request<IntrospectResponse>('/merchant/auth/auth/introspect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: nextSession.accessToken }),
          });

          if (!introspect.active || !introspect.user) {
            nextSession = await refreshMerchantSession(nextSession);
          } else {
            assertMerchantUser(introspect.user);
            nextSession = {
              ...nextSession,
              user: introspect.user,
              accessTokenExpiresAt:
                introspect.accessTokenExpiresAt ?? nextSession.accessTokenExpiresAt,
            };
          }
        } catch {
          nextSession = await refreshMerchantSession(nextSession);
        }

        setSession(nextSession);
        await refreshAllData(nextSession.accessToken, nextSession.user).catch((error) => {
          setDataError(extractErrorMessage(error));
        });
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
    if (booting) {
      return;
    }

    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY_SESSION);
      return;
    }
    writeStoredMerchantSession(session);
  }, [booting, session]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const accessTokenExpiresAt = new Date(session.accessTokenExpiresAt).getTime();
    const delayMs = Number.isNaN(accessTokenExpiresAt)
      ? 0
      : Math.max(accessTokenExpiresAt - Date.now() - ACCESS_TOKEN_REFRESH_WINDOW_MS, 0);

    const timeoutId = window.setTimeout(() => {
      void refreshMerchantSession(session)
        .then((nextSession) => {
          setSession(nextSession);
        })
        .catch(() => {
          window.localStorage.removeItem(STORAGE_KEY_SESSION);
          setSession(null);
        });
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
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
    if (!session) {
      setProfile(DEFAULT_PROFILE);
      return;
    }
    setProfile(DEFAULT_PROFILE);
  }, [session?.user.username]);

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
    const [shipRes, pickupRes, changeRes, hubsRes, profileRes, returnRes, tasksRes, shippersRes, claimsRes] = await Promise.allSettled([
      request<ShipmentResponse[]>('/merchant/shipment/shipments', { method: 'GET' }, accessToken),
      request<PickupRequest[]>('/merchant/pickup/pickups', { method: 'GET' }, accessToken),
      request<ChangeRequest[]>('/merchant/shipment/change-requests', { method: 'GET' }, accessToken),
      request<HubApiRecord[]>('/merchant/masterdata/hubs?isActive=true', { method: 'GET' }, accessToken),
      request<MerchantProfileApiRecord>(
        `/merchant/masterdata/merchant-profiles/by-username/${encodeURIComponent(user.username)}`,
        { method: 'GET' },
        accessToken,
      ),
      request<ReturnCaseApiRecord[]>('/merchant/delivery/returns', { method: 'GET' }, accessToken),
      request<any[]>('/merchant/dispatch/tasks?taskType=PICKUP', { method: 'GET' }, accessToken),
      request<any[]>('/merchant/auth/auth/users?roleGroup=SHIPPER', { method: 'GET' }, accessToken),
      request<MerchantClaim[]>('/merchant/shipment/claims', { method: 'GET' }, accessToken),
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
    const ownedShipmentCodes = new Set(
      ownedShipments.map((shipment) => normalizeCode(shipment.code)),
    );

    if (changeRes.status === 'fulfilled') {
      setChangeRequests(
        changeRes.value.filter((item) =>
          ownedShipmentCodes.has(normalizeCode(item.shipmentCode)),
        ),
      );
    }
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
      const resolvedProfile = mapMerchantProfileRecord(profileRes.value);
      setMerchantProfileConfig(resolvedProfile);
    } else {
      setMerchantProfileConfig(null);
    }
    if (returnRes.status === 'fulfilled') {
      setReturnRequests(
        returnRes.value
          .filter((item) => ownedShipmentCodes.has(normalizeCode(item.shipmentCode)))
          .map(mapReturnCaseToRequest),
      );
    }

    if (claimsRes.status === 'fulfilled') {
      const items = claimsRes.value.filter((claim) =>
        ownedShipments.length === 0 || ownedShipmentCodes.has(normalizeCode(claim.shipmentCode))
      );
      setClaims(items);
    } else {
      setClaims([]);
    }

    if (tasksRes.status === 'fulfilled') {
      setDispatchTasks(tasksRes.value);
    } else {
      setDispatchTasks([]);
    }
    if (shippersRes.status === 'fulfilled') {
      setShippers(shippersRes.value);
    } else {
      setShippers([]);
    }

    if (shipRes.status === 'rejected') setDataError(extractErrorMessage(shipRes.reason));
    if (hubsRes.status === 'rejected') {
      setDataError((previous) => previous ?? extractErrorMessage(hubsRes.reason));
    }
    setDataLoading(false);
  }

  function fillDemoAccount(code: string, pass = 'password') {
    setLoginUsername(code);
    setLoginPassword(pass);
    setLoginError(null);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      let resolvedUsername = loginUsername.trim();

      // Hỗ trợ map thông minh nếu người dùng/thầy nhập dạng Email hoặc Email demo
      const demoEmailMap: Record<string, string> = {
        'nexus.merchant@example.com': '41100001',
        'merchant@nexus.vn': '41100001',
        'merchant.hanoi@nexus.vn': '41100001',
        'merchant.hcm@nexus.vn': '41100079',
        'merchant.danang@nexus.vn': '41100048',
        'shop.hoankiem@nexus.vn': '41100001',
        'shop.benthanh@nexus.vn': '41100079',
        'shop.haichau@nexus.vn': '41100048',
      };

      if (demoEmailMap[resolvedUsername.toLowerCase()]) {
        resolvedUsername = demoEmailMap[resolvedUsername.toLowerCase()];
      } else if (resolvedUsername.includes('@')) {
        const prefix = resolvedUsername.split('@')[0].trim();
        if (prefix) {
          resolvedUsername = prefix;
        }
      }

      const result = await request<LoginResponse>('/merchant/auth/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: resolvedUsername,
          password: loginPassword,
          roleGroup: 'MERCHANT',
        }),
      });

      if (rememberMe) {
        saveRememberedCredentials({
          username: loginUsername.trim(),
          password: loginPassword,
          rememberMe: true,
        });
      } else {
        clearRememberedCredentials();
      }

      const nextSession = mapLoginResponseToMerchantSession(result);
      setSession(nextSession);
      await refreshAllData(nextSession.accessToken, nextSession.user);
      setActiveView('dashboard');
      pushNotification('success', 'Đăng nhập thành công', `Xin chào ${nextSession.user.displayName || nextSession.user.username}`);
    } catch (error) {
      setLoginError(formatMerchantAuthErrorMessage(extractErrorMessage(error)));
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

    const pickupRow = shipmentRows.find(
      (row) => normalizeCode(row.shipment.code) === normalizedShipmentCode,
    );
    const desiredWindow = pickupRow
      ? resolvePickupWindowForShipment(pickupRow)
      : 'Tự động theo giờ tạo đơn';

    const pickup = await request<PickupRequest>('/merchant/pickup/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupCode: generatePickupCode(),
        requesterName: pickupRequesterName.trim() || createForm.senderName.trim() || session.user.username,
        contactPhone: pickupContactPhone.trim() || createForm.senderPhone.trim() || profile.contactPhone || null,
        pickupAddress: pickupAddress.trim() || senderComposedAddress || profile.defaultPickupAddress || null,
        note: `${note} | desired=${desiredWindow}`,
        items: [{ shipmentCode: normalizedShipmentCode, quantity: 1 }],
      }),
    }, session.accessToken);
    setPickups((prev) => [pickup, ...prev]);
    return pickup;
  }

  async function quoteCreateShipmentFee(
    form?: CreateShipmentForm,
    options: { updateUi?: boolean } = {},
  ): Promise<PricingQuoteResponse> {
    if (!session) {
      throw new Error('Session is required');
    }

    const targetReceiverProv = selectedReceiverHub?.province || createForm.receiverProvince;
    const targetSenderProv = lockedSenderHub?.province || createForm.senderProvince;
    const effectiveForm: CreateShipmentForm = form ?? {
      ...createForm,
      senderProvince: targetSenderProv,
      senderHubCode: lockedSenderHub?.hubCode || createForm.senderHubCode,
      receiverProvince: targetReceiverProv,
      receiverRegion: targetReceiverProv,
      receiverHubCode: selectedReceiverHub?.hubCode || createForm.receiverHubCode,
      receiverWard: selectedReceiverHub?.ward || createForm.receiverWard,
    };

    const shouldUpdateUi = options.updateUi ?? true;

    if (shouldUpdateUi) {
      setQuoteLoading(true);
      setQuoteError(null);
    }

    try {
      const quote = await requestPricingQuote(effectiveForm, session.accessToken);

      if (shouldUpdateUi) {
        setPricingQuote(quote);
        setQuotedFee(quote.totalFee);
      }

      return quote;
    } catch (error) {
      const message = extractErrorMessage(error);

      if (shouldUpdateUi) {
        setQuoteError(message);
      }

      throw error;
    } finally {
      if (shouldUpdateUi) {
        setQuoteLoading(false);
      }
    }
  }

  // Tự động báo giá (debounce) thời gian thực khi Merchant điều chỉnh thông số đơn hàng
  useEffect(() => {
    if (activeView !== 'create-shipment' || !session) {
      return;
    }

    const targetReceiverProv = selectedReceiverHub?.province || createForm.receiverProvince;
    const weightNum = Number(createForm.weightKg || 0);

    if (!targetReceiverProv || weightNum <= 0) {
      setPricingQuote(null);
      setQuotedFee(null);
      return;
    }

    const timer = setTimeout(() => {
      void quoteCreateShipmentFee(undefined, { updateUi: true }).catch(() => {
        // Fallback tự động hiển thị autoEstimatedFee nếu mạng gián đoạn
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    activeView,
    session,
    lockedSenderHub,
    selectedReceiverHub,
    createForm.receiverProvince,
    createForm.receiverHubCode,
    createForm.weightKg,
    createForm.lengthCm,
    createForm.widthCm,
    createForm.heightCm,
    createForm.serviceType,
    createForm.codAmount,
  ]);

  async function submitCreateShipment(withPickup: boolean): Promise<void> {
    if (!session) return;
    if (insights.isNegativeBalanceLocked) {
      setCreateError(
        `Số dư công nợ của tài khoản đang ở mức ${formatCurrency(insights.netBalance)} (vượt hạn mức âm tối đa -500.000đ). Vui lòng thanh toán nợ cước qua VietQR để tiếp tục tạo đơn.`,
      );
      setShowTopupModal(true);
      return;
    }
    if (hubLocations.length === 0) {
      setCreateError('Chưa có hub hoạt động. Vui lòng cấu hình hub ở trang Admin.');
      return;
    }

    const effectiveSenderAddressDetail =
      profile.defaultPickupAddressDetail.trim() ||
      createForm.senderAddressDetail.trim();
    const effectiveSenderAddress =
      profile.defaultPickupAddress.trim() ||
      createForm.senderAddress.trim();

    if (!effectiveSenderAddressDetail && !effectiveSenderAddress) {
      setCreateError('Merchant chưa có địa chỉ lấy hàng hợp đồng. Vui lòng vào mục Hồ sơ để thiết lập.');
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

    const senderName =
      profile.shopName.trim() ||
      session.user.displayName?.trim() ||
      createForm.senderName.trim() ||
      session.user.username;
    const senderPhone =
      profile.contactPhone.trim() ||
      session.user.phone?.trim() ||
      createForm.senderPhone.trim();

    const normalizedSenderAddress =
      effectiveSenderAddress ||
      [
        effectiveSenderAddressDetail,
        senderHub.ward,
        senderHub.province,
      ]
        .filter(Boolean)
        .join(', ');

    const normalizedForm: CreateShipmentForm = {
      ...createForm,
      senderName,
      senderPhone,
      senderAddressDetail: effectiveSenderAddressDetail || effectiveSenderAddress,
      senderAddress: normalizedSenderAddress,
      senderProvince: senderHub.province,
      senderWard: senderHub.ward,
      senderHubCode: senderHub.hubCode,
      senderLatitude:
        profile.latitude ??
        merchantProfileConfig?.latitude ??
        senderHub.latitude ??
        undefined,
      senderLongitude:
        profile.longitude ??
        merchantProfileConfig?.longitude ??
        senderHub.longitude ??
        undefined,
      receiverProvince: receiverHub.province,
      receiverWard: receiverHub.ward,
      receiverHubCode: receiverHub.hubCode,
      receiverLatitude: receiverHub.latitude ?? undefined,
      receiverLongitude: receiverHub.longitude ?? undefined,
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
      const pricingQuoteForCreate = await quoteCreateShipmentFee(normalizedForm, {
        updateUi: false,
      });
      const payload: Record<string, unknown> = {
        pickupLatitude: normalizedForm.senderLatitude ?? undefined,
        pickupLongitude: normalizedForm.senderLongitude ?? undefined,
        deliveryLatitude: normalizedForm.receiverLatitude ?? undefined,
        deliveryLongitude: normalizedForm.receiverLongitude ?? undefined,
        metadata: buildShipmentMetadata(normalizedForm, pricingQuoteForCreate.totalFee, {
          username: session.user.username,
          userId: session.user.id,
        }, pricingQuoteForCreate),
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
      setPricingQuote(null);
      setQuoteError(null);
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
    const normalizedCode = normalizeCode(code);
    const shipment = shipments.find((item) => normalizeCode(item.code) === normalizedCode);
    if (!shipment || !isShipmentOwnedByUser(shipment, session.user)) {
      pushNotification('error', 'Khong the huy don', 'Shipment khong thuoc tai khoan merchant hien tai.');
      return;
    }

    const cancelled = await request<ShipmentResponse>(`/merchant/shipment/shipments/${encodeURIComponent(normalizedCode)}/cancel`, {
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
      if (!isShipmentOwnedByUser(selectedShipment.shipment, session.user)) {
        throw new Error('Shipment khong thuoc tai khoan merchant hien tai.');
      }
      const changeBlockReason = resolveDeliveryInfoChangeBlockReason(selectedShipment);
      if (changeBlockReason) {
        throw new Error(changeBlockReason);
      }

      const created = await request<ChangeRequest>('/merchant/shipment/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentCode: selectedShipment.shipment.code,
          requestType: 'change.delivery_info',
          payload: {
            value: [
              detailReceiverPhone.trim(),
              detailReceiverAddress.trim(),
              detailDeliveryNote.trim(),
            ].filter(Boolean).join(' | '),
            receiverPhone: detailReceiverPhone.trim() || null,
            receiverAddress: detailReceiverAddress.trim() || null,
            deliveryNote: detailDeliveryNote.trim() || null,
          },
          requestedBy: session.user.username,
        }),
      }, session.accessToken);
      setChangeRequests((prev) => [created, ...prev]);
      setDetailSuccess(`Da tao yeu cau thay doi ${created.id}`);
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
      const selectableCodes = new Set(
        pickupSelectableRows.map((row) => normalizeCode(row.shipment.code)),
      );
      const codes = Array.from(new Set(pickupShipmentCodes.split(/[\s,;\n]+/).map((item) => normalizeCode(item)).filter(Boolean)))
        .filter((code) => selectableCodes.has(code));
      if (codes.length === 0) throw new Error('Vui lòng chọn ít nhất 1 đơn hàng để yêu cầu lấy hàng');
      const requestedRows = pickupSelectableRows.filter((row) =>
        codes.includes(normalizeCode(row.shipment.code)),
      );
      const pickup = await request<PickupRequest>('/merchant/pickup/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupCode: generatePickupCode(),
          requesterName: pickupRequesterName.trim() || session.user.username,
          contactPhone: pickupContactPhone.trim() || null,
          pickupAddress: pickupAddress.trim() || profile.defaultPickupAddress || null,
          note: `${pickupNote.trim()} | desired=${resolvePickupWindowSummary(requestedRows)}`,
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
      if (!code || !changeValue.trim()) throw new Error('Can ma shipment va noi dung thay doi');
      const shipment = shipments.find((item) => normalizeCode(item.code) === code);
      if (!shipment || !isShipmentOwnedByUser(shipment, session.user)) {
        throw new Error('Shipment khong thuoc tai khoan merchant hien tai.');
      }
      const changeBlockReason = resolveDeliveryInfoChangeBlockReason(
        shipmentRows.find((row) => normalizeCode(row.shipment.code) === code) ?? null,
      );
      if (changeBlockReason) {
        throw new Error(changeBlockReason);
      }
      const created = await request<ChangeRequest>('/merchant/shipment/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentCode: code,
          requestType: changeType,
          payload: buildChangeRequestPayload(changeType, changeValue),
          requestedBy: session.user.username,
        }),
      }, session.accessToken);
      setChangeRequests((prev) => [created, ...prev]);
      setChangeMessage(`Da tao yeu cau ${created.id}`);
      setChangeValue('');
    } catch (error) {
      setChangeMessage(extractErrorMessage(error));
    } finally {
      setChangeLoading(false);
    }
  }

  async function createReturnRequest(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    if (!session) return;
    const code = normalizeCode(returnCode);
    if (!code) return;
    setReturnLoading(true);
    setReturnMessage(null);
    try {
      const shipment = shipments.find((item) => normalizeCode(item.code) === code);
      if (!shipment || !isShipmentOwnedByUser(shipment, session.user)) {
        throw new Error('Shipment khong thuoc tai khoan merchant hien tai.');
      }
      if (!isReturnRequestAllowed(shipment)) {
        throw new Error('Đơn đã giao thành công, đã hoàn tất hoàn hoặc đã hủy nên không thể yêu cầu hoàn hàng.');
      }

      const reason = returnReason.trim() || 'Merchant requested return';
      const returnCase = await request<ReturnCaseApiRecord>('/merchant/delivery/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentCode: code,
          note: `reason=${reason} | expected=${returnExpectedDate || 'N/A'} | note=${returnNotes.trim() || 'N/A'} | requestedBy=${session.user.username}`,
        }),
      }, session.accessToken);
      const mappedReturn = mapReturnCaseToRequest(returnCase);
      setReturnRequests((prev) => [
        mappedReturn,
        ...prev.filter((item) => item.id !== mappedReturn.id),
      ]);
      setReturnMessage(`Đã tạo và duyệt yêu cầu hoàn ${returnCase.id}. Vận đơn sẽ bị chặn thao tác thường để OPS in tem chuyển hoàn.`);
      setReturnCode('');
      setReturnReason('');
      setReturnNotes('');
    } catch (error) {
      setReturnMessage(extractErrorMessage(error));
    } finally {
      setReturnLoading(false);
    }
  }

  async function submitCreateClaim(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    if (!session) return;
    if (!claimShipmentCode.trim()) {
      setClaimError('Vui lòng nhập Mã vận đơn cần khiếu nại.');
      return;
    }
    if (!claimDamageDesc.trim()) {
      setClaimError('Vui lòng mô tả chi tiết sự cố / tình trạng hư hỏng.');
      return;
    }

    setClaimSubmitting(true);
    setClaimError(null);
    setClaimMessage(null);

    const code = normalizeCode(claimShipmentCode);
    const targetShipment = shipmentRows.find((r) => r.shipment.code === code);

    const payload = {
      shipmentCode: code,
      incidentType: claimIncidentType,
      claimRequestedAmount: Number(claimRequestedAmount) || 0,
      damageDescription: claimDamageDesc.trim(),
      packageDescription: claimPackageDesc.trim() || targetShipment?.itemType || 'Bưu kiện thương mại điện tử',
      originHubCode: targetShipment?.senderHubCode || 'HUB_TAN_BINH',
      destinationHubCode: targetShipment?.receiverHubCode || 'HUB_TAN_BINH',
      reportedBy: session.user.username,
      declaredValue: targetShipment?.declaredValue || 0,
      codAmount: targetShipment?.codAmount || 0,
    };

    try {
      const created = await request<MerchantClaim>(
        '/merchant/shipment/claims',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        session.accessToken,
      );

      setClaims((prev) => [created, ...prev]);
      setClaimMessage(`Tạo yêu cầu khiếu nại bồi thường [${created.claimCode}] thành công! Hồ sơ đã được chuyển giao Ban Giám Định Trách Nhiệm.`);
      setClaimShipmentCode('');
      setClaimRequestedAmount('');
      setClaimDamageDesc('');
      setClaimPackageDesc('');
      setIsCreateClaimOpen(false);
      setSelectedClaimDetail(created);
    } catch (err) {
      setClaimError(extractErrorMessage(err));
    } finally {
      setClaimSubmitting(false);
    }
  }

  async function saveAccountProfile(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    if (!session) return;
    setAccountSaving(true);
    setAccountMessage(null);
    try {
      const selectedProfileHub = selectedAccountProvinceHub;
      const normalizedDefaultPickupAddress = composeDefaultPickupAddress(
        profile.defaultPickupAddressDetail,
        profile.defaultPickupProvince,
      );
      if (profile.defaultPickupAddressDetail.trim() && !profile.defaultPickupProvince.trim()) {
        setAccountMessage('Vui lòng chọn Tỉnh/Thành tại Việt Nam cho địa chỉ lấy hàng.');
        setAccountSaving(false);
        return;
      }
      if (profile.defaultPickupProvince.trim() && !selectedProfileHub) {
        setAccountMessage('Tỉnh/Thành đã chọn chưa có bưu cục active. Vui lòng liên hệ admin.');
        setAccountSaving(false);
        return;
      }

      // Geocode the address to obtain GPS coordinates for automated courier dispatch
      let geocodedCoords: { latitude: number | null; longitude: number | null } = {
        latitude: profile.latitude ?? selectedProfileHub?.latitude ?? null,
        longitude: profile.longitude ?? selectedProfileHub?.longitude ?? null,
      };
      if (normalizedDefaultPickupAddress) {
        geocodedCoords = await geocodeAddress(normalizedDefaultPickupAddress, selectedProfileHub);
      }

      const updatedUser = await request<MerchantSession['user']>('/merchant/auth/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session.accessToken,
          displayName: profile.shopName.trim() || null,
          phone: profile.contactPhone.trim() || null,
        }),
      }, session.accessToken);

      setSession((previous) =>
        previous
          ? {
              ...previous,
              user: updatedUser,
            }
          : previous,
      );

      let profileNote = '';
      if (merchantProfileConfig) {
        const savedProfile = await request<MerchantProfileApiRecord>(
          `/merchant/masterdata/merchant-profiles/by-username/${encodeURIComponent(session.user.username)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: session.user.username,
              citizenId: merchantProfileConfig.citizenId,
              regionCode: selectedProfileHub?.regionCode ?? merchantProfileConfig.regionCode,
              regionLabel:
                selectedProfileHub?.regionCode && selectedProfileHub.regionCode !== merchantProfileConfig.regionCode
                  ? resolveRegionLabel(selectedProfileHub.regionCode)
                  : merchantProfileConfig.regionLabel,
              defaultHubCode: selectedProfileHub?.hubCode ?? merchantProfileConfig.defaultHubCode,
              defaultHubName: selectedProfileHub?.hubName ?? merchantProfileConfig.defaultHubName,
              defaultSenderAddress: normalizedDefaultPickupAddress || null,
              latitude: geocodedCoords.latitude,
              longitude: geocodedCoords.longitude,
            }),
          },
          session.accessToken,
        );
        const mapped = mapMerchantProfileRecord(savedProfile);
        setMerchantProfileConfig(mapped);
        const finalLat = savedProfile.latitude ?? geocodedCoords.latitude ?? profile.latitude;
        const finalLng = savedProfile.longitude ?? geocodedCoords.longitude ?? profile.longitude;
        setProfile((previous) => ({
          ...previous,
          defaultPickupAddress: normalizedDefaultPickupAddress,
          latitude: finalLat ?? undefined,
          longitude: finalLng ?? undefined,
        }));
        setCreateForm((previous) => ({
          ...previous,
          senderName: profile.shopName.trim() || previous.senderName,
          senderPhone: profile.contactPhone.trim() || previous.senderPhone,
          senderProvince: selectedProfileHub?.province ?? previous.senderProvince,
          senderWard: selectedProfileHub?.ward ?? previous.senderWard,
          senderHubCode: selectedProfileHub?.hubCode ?? previous.senderHubCode,
          senderAddressDetail: profile.defaultPickupAddressDetail,
          senderAddress: normalizedDefaultPickupAddress,
          senderLatitude: finalLat ?? undefined,
          senderLongitude: finalLng ?? undefined,
        }));
      } else if (normalizedDefaultPickupAddress) {
        profileNote = ' Merchant profile chua co citizenId/region nen dia chi mac dinh can ops seed truoc.';
      }

      const coordInfo =
        geocodedCoords.latitude && geocodedCoords.longitude
          ? ` [Tọa độ GPS đã xác thực: ${geocodedCoords.latitude.toFixed(4)}, ${geocodedCoords.longitude.toFixed(4)}]`
          : '';
      setAccountMessage(`Đã lưu hồ sơ merchant thành công.${coordInfo}${profileNote}`);
    } catch (error) {
      setAccountMessage(extractErrorMessage(error));
    } finally {
      setAccountSaving(false);
    }
  }

  async function changeAccountPassword(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    if (!session) return;
    setPasswordMessage(null);
    if (!passwordOld || !passwordNew || !passwordConfirm) {
      setPasswordMessage('Can nhap day du thong tin');
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordMessage('Mat khau xac nhan khong khop');
      return;
    }
    setPasswordSaving(true);
    try {
      await request<{ changed: boolean; userId: string | null }>('/merchant/auth/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session.accessToken,
          currentPassword: passwordOld,
          newPassword: passwordNew,
        }),
      }, session.accessToken);
      setPasswordMessage('Da cap nhat mat khau.');
      setPasswordOld('');
      setPasswordNew('');
      setPasswordConfirm('');
    } catch (error) {
      setPasswordMessage(extractErrorMessage(error));
    } finally {
      setPasswordSaving(false);
    }
  }

  function saveDraft(): void {
    setDrafts((prev) => [{ id: generateLocalId('draft'), createdAt: new Date().toISOString(), name: draftName.trim() || `Draft ${new Date().toLocaleString()}`, quoteFee: effectiveFee, form: createForm }, ...prev].slice(0, 50));
    setDraftName('');
  }

  function buildShippingLabelPayload(row: ShipmentRow): ShippingLabelPrintPayload {
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

    const resolvedPickup = resolveRouteAndCourier(
      row.senderAddress,
      row.senderWard,
      undefined,
      senderHubCode,
      true,
    );
    const resolvedDelivery = resolveRouteAndCourier(
      row.receiverAddress,
      row.receiverWard,
      undefined,
      receiverHubCode || destinationHubCode,
      false,
    );

    const pickupRouteName =
      readText(metadata?.pickupRouteName) ||
      readText(metadata?.pickupRouteCode) ||
      readText(routingMeta?.pickupRouteName) ||
      resolvedPickup.routeName;

    const pickupCourierId =
      readText(metadata?.pickupCourierId) ||
      readText(metadata?.courierId) ||
      readText(senderMeta?.courierId) ||
      resolvedPickup.courierId;

    const deliveryRouteName =
      readText(metadata?.deliveryRouteName) ||
      readText(metadata?.deliveryRouteCode) ||
      readText(routingMeta?.deliveryRouteName) ||
      resolvedDelivery.routeName;

    const deliveryCourierId =
      readText(metadata?.deliveryCourierId) ||
      readText(receiverMeta?.courierId) ||
      resolvedDelivery.courierId;

    return {
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
      pickupRouteName,
      pickupCourierId,
      deliveryRouteName,
      deliveryCourierId,
    };
  }

  function printShipment(row: ShipmentRow): void {
    const payload = buildShippingLabelPayload(row);
    const opened = openShippingLabelPrint(payload);
    if (!opened) {
      setPrintMessage('Trình duyệt đang chặn popup in. Hãy cho phép popup rồi thử lại.');
    }
  }

  function printMultipleShipments(rows: ShipmentRow[]): void {
    if (rows.length === 0) {
      setPrintMessage('Không tìm thấy vận đơn nào phù hợp để in.');
      return;
    }
    const payloads = rows.map((r) => buildShippingLabelPayload(r));
    const opened = openMultiShippingLabelPrint(payloads);
    if (!opened) {
      setPrintMessage('Trình duyệt đang chặn popup in. Hãy cho phép popup rồi thử lại.');
    } else {
      setPrintMessage(`Đã mở popup in cho ${rows.length} vận đơn.`);
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

  function exportPdf(): void {
    const targetRows =
      printBulkPreviewRows.length > 0
        ? printBulkPreviewRows
        : printPreviewRow
        ? [printPreviewRow]
        : shipmentRows.length > 0
        ? [shipmentRows[0]]
        : [];

    if (targetRows.length === 0) {
      setPrintMessage('Chưa có vận đơn nào để xuất PDF.');
      return;
    }

    const payloads = targetRows.map(buildShippingLabelPayload);
    const opened = openMultiShippingLabelPrint(payloads);
    if (!opened) {
      setPrintMessage('Trình duyệt đang chặn popup in. Hãy cho phép popup để xuất PDF.');
    } else {
      setPrintMessage(
        `Đã mở tài liệu xuất PDF cho ${targetRows.length} vận đơn. Chọn "Save as PDF" / "Lưu dưới dạng PDF" tại mục máy in để lưu file.`,
      );
    }
  }

  if (booting) {
    return <div className="login-shell"><div className="login-card"><h1 className="brand-title">Merchant Console</h1><p className="muted">Đang khởi tạo...</p></div></div>;
  }

  if (!session) {
    return (
      <MerchantLoginForm
        loginUsername={loginUsername}
        loginPassword={loginPassword}
        rememberMe={rememberMe}
        loginLoading={loginLoading}
        loginError={loginError}
        showPassword={showPassword}
        onUsernameChange={setLoginUsername}
        onPasswordChange={setLoginPassword}
        onRememberMeChange={setRememberMe}
        onToggleShowPassword={() => setShowPassword(!showPassword)}
        onClearLoginError={() => setLoginError(null)}
        onSubmit={handleLogin}
        onFillDemoAccount={fillDemoAccount}
      />
    );
  }

  return (
    <div className="app-shell app-shell--stitch">
      <MerchantSidebar
        lockedSenderHub={lockedSenderHub}
        activeView={activeView}
        navGroups={navGroups}
        unreadNotifications={unreadNotifications}
        dataLoading={dataLoading}
        onSelectView={setActiveView}
        onRefreshData={() => void refreshAllData(session.accessToken, session.user)}
        onLogout={() => void handleLogout()}
      />

      <div className="main">
        <MerchantHeader
          activeView={activeView}
          navItems={navItems}
          netBalance={insights.netBalance}
          lockedSenderHub={lockedSenderHub}
          unreadNotifications={unreadNotifications}
          username={session.user.username}
          onSelectView={setActiveView}
        />
        <main className={`content ${activeView === 'change-requests' ? 'content--change' : ''} ${activeView === 'print' ? 'content--print' : ''} ${activeView === 'returns' ? 'content--returns' : ''} ${activeView === 'account' ? 'content--account' : ''} ${activeView === 'finance' ? 'content--finance' : ''}`}>
          {dataError ? <p className="message error">{dataError}</p> : null}

          {insights.isNegativeBalanceLocked ? (
            <div className="merchant-debt-warning-banner" style={{ marginBottom: '16px', padding: '16px 20px', borderRadius: '12px', background: '#FEF2F2', border: '1.5px solid #F87171', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#DC2626' }}>warning</span>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#991B1B' }}>CẢNH BÁO NỢ CƯỚC VƯỢT HẠN MỨC CHO PHÉP</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D' }}>
                    Số dư công nợ hiện tại: <strong style={{ color: '#DC2626' }}>{formatCurrency(insights.netBalance)}</strong> (vượt trần nợ âm tối đa -500.000đ). Hệ thống tạm thời khóa quyền tạo đơn mới.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                style={{ whiteSpace: 'nowrap', backgroundColor: '#DC2626', borderColor: '#DC2626', color: '#FFFFFF', padding: '10px 16px', fontWeight: 700, borderRadius: '8px' }}
                onClick={() => setShowTopupModal(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>qr_code_2</span>
                <span>Nạp tiền / Thanh toán nợ VietQR</span>
              </button>
            </div>
          ) : null}

          {insights.issueRate > 20 && shipmentRows.length >= 5 ? (
            <div className="merchant-risk-warning-banner" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#92400E' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#D97706' }}>shield_with_heart</span>
              <div>
                <strong>Cảnh báo rủi ro hoàn hàng ({insights.issueRate}%):</strong> Tỷ lệ giao không thành công hoặc chuyển hoàn của Shop đang cao hơn mức khuyến nghị (20%). Quý khách nên rà soát lại thông tin khách hàng, số điện thoại hoặc yêu cầu đặt cọc cước với các đơn hàng giá trị cao.
              </div>
            </div>
          ) : null}

          {activeView === 'dashboard' ? (
            <MerchantDashboardView
              dashboardSearchCode={dashboardSearchCode}
              onDashboardSearchCodeChange={setDashboardSearchCode}
              onQuickTrackFromDashboard={quickTrackFromDashboard}
              profile={profile}
              merchantProfileConfig={merchantProfileConfig}
              lockedSenderHub={lockedSenderHub}
              selectedAccountProvinceHub={selectedAccountProvinceHub}
              session={session}
              resolveRouteAndCourier={resolveRouteAndCourier}
              onNavigateView={setActiveView}
              dashboardStats={dashboardStats}
              dashboardInsights={dashboardInsights}
              shipmentRows={shipmentRows}
              recentRows={recentRows}
              resolveShipmentStatusClass={resolveShipmentStatusClass}
              resolveShipmentStatusLabel={resolveShipmentStatusLabel}
              onOpenShipmentDetail={(shipmentCode) => {
                void openShipmentDetail(shipmentCode);
              }}
            />
          ) : null}

          {activeView === 'create-shipment' ? (
            <CreateShipmentView
              hubLocations={hubLocations}
              lockedSenderHub={lockedSenderHub}
              profile={profile}
              session={session}
              createForm={createForm}
              setCreateForm={setCreateForm}
              provinceOptions={provinceOptions}
              receiverHubOptions={receiverHubOptions}
              selectedReceiverHub={selectedReceiverHub}
              pricingQuote={pricingQuote}
              effectiveFee={effectiveFee}
              codAmount={codAmount}
              showMerchantFormulaHelp={showMerchantFormulaHelp}
              setShowMerchantFormulaHelp={setShowMerchantFormulaHelp}
              quoteLoading={quoteLoading}
              createLoading={createLoading}
              quoteError={quoteError}
              createError={createError}
              createSuccess={createSuccess}
              insights={insights}
              draftName={draftName}
              setDraftName={setDraftName}
              drafts={drafts}
              setDrafts={setDrafts}
              merchantProfileConfig={merchantProfileConfig}
              setQuotedFee={setQuotedFee}
              quoteCreateShipmentFee={() => {
                void quoteCreateShipmentFee();
              }}
              saveDraft={saveDraft}
              submitCreateShipment={submitCreateShipment}
              onNavigateView={setActiveView}
              findHubByCode={(locations, code) => (code ? findHubByCode(locations, code) : null)}
            />
          ) : null}
          {activeView === 'shipments' ? (
            <ShipmentListView
              visibleRows={visibleRows}
              filteredRows={filteredRows}
              listPage={listPage}
              totalPages={totalPages}
              listSearch={listSearch}
              listStatus={listStatus}
              listService={listService}
              listRegion={listRegion}
              listFromDate={listFromDate}
              listToDate={listToDate}
              serviceOptions={serviceOptions}
              regionOptions={regionOptions}
              pickupByShipmentCode={pickupByShipmentCode}
              onSearchChange={setListSearch}
              onStatusChange={setListStatus}
              onServiceChange={setListService}
              onRegionChange={setListRegion}
              onFromDateChange={setListFromDate}
              onToDateChange={setListToDate}
              onPageChange={setListPage}
              resolveShipmentStatusClass={resolveShipmentStatusClass}
              resolveShipmentStatusLabel={resolveShipmentStatusLabel}
              onOpenShipmentDetail={(code) => {
                void openShipmentDetail(code);
              }}
              onPrintShipment={printShipment}
              onCreatePickupForShipment={(code) => {
                const normalizedShipmentCode = normalizeCode(code);
                if (pickupByShipmentCode.has(normalizedShipmentCode)) return;
                void createPickupForShipment(code, `manual pickup ${code}`)
                  .then((createdPickup) => {
                    pushNotification('success', 'Đã tạo pickup', `Pickup ${createdPickup.pickupCode} cho ${code}`);
                  })
                  .catch((error) => {
                    pushNotification('error', 'Không tạo được pickup', extractErrorMessage(error));
                  });
              }}
              onCancelShipment={(code) => {
                const reason = window.prompt('Lý do hủy đơn', '') ?? '';
                void cancelShipment(code, reason);
              }}
            />
          ) : null}

          {activeView === 'shipment-detail' ? (
            <ShipmentDetailView
              selectedShipment={selectedShipment}
              pickupByShipmentCode={pickupByShipmentCode}
              detailReceiverPhone={detailReceiverPhone}
              detailReceiverAddress={detailReceiverAddress}
              detailDeliveryNote={detailDeliveryNote}
              detailUpdating={detailUpdating}
              detailError={detailError}
              detailSuccess={detailSuccess}
              detailTrackError={detailTrackError}
              detailTrackTimeline={detailTrackTimeline}
              detailTrackCurrent={detailTrackCurrent}
              resolveShipmentStatusClass={resolveShipmentStatusClass}
              resolveShipmentStatusLabel={resolveShipmentStatusLabel}
              resolveDeliveryInfoChangeBlockReason={resolveDeliveryInfoChangeBlockReason}
              onReceiverPhoneChange={setDetailReceiverPhone}
              onReceiverAddressChange={setDetailReceiverAddress}
              onDeliveryNoteChange={setDetailDeliveryNote}
              onSaveDetailUpdate={saveDetailUpdate}
              onCancelShipment={(code) => {
                const reason = window.prompt('Lý do hủy đơn', '') ?? '';
                void cancelShipment(code, reason);
              }}
              onPrintShipment={printShipment}
              onRequestReturn={(code) => {
                setReturnCode(code);
                setActiveView('returns');
              }}
              onCreateClaim={(code) => {
                setClaimShipmentCode(code);
                setIsCreateClaimOpen(true);
                setActiveView('claims');
              }}
            />
          ) : null}

          {activeView === 'pickups' ? (
            <PickupRequestView
              pickupRows={pickupRows}
              pickups={pickups}
              pickupSelectableRows={pickupSelectableRows}
              allPickupRowsSelected={allPickupRowsSelected}
              selectedPickupCodeSet={selectedPickupCodeSet}
              selectedPickupRows={selectedPickupRows}
              selectedPickupWindowSummary={selectedPickupWindowSummary}
              pickupLoading={pickupLoading}
              pickupMessage={pickupMessage}
              pickupStatusFilter={pickupStatusFilter}
              resolvePickupWindowForShipment={resolvePickupWindowForShipment}
              resolveShipmentStatusClass={resolveShipmentStatusClass}
              resolveShipmentStatusLabel={resolveShipmentStatusLabel}
              resolvePickupCancelBlockReason={resolvePickupCancelBlockReason}
              resolveShipperForPickup={resolveShipperForPickup}
              onToggleAllPickupShipments={toggleAllPickupShipments}
              onTogglePickupShipmentSelection={togglePickupShipmentSelection}
              onSubmitPickupRequest={submitPickupRequest}
              onPickupStatusFilterChange={setPickupStatusFilter}
              onCancelPickup={(item) => {
                if (!session) return;
                const reason = window.prompt('Lý do hủy pickup', '') ?? '';
                void request<PickupRequest>(
                  `/merchant/pickup/pickups/${encodeURIComponent(item.id)}/cancel`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: reason.trim() || null }),
                  },
                  session.accessToken,
                ).then((cancelled) =>
                  setPickups((prev) =>
                    prev.map((pickup) => (pickup.id === item.id ? cancelled : pickup)),
                  ),
                );
              }}
            />
          ) : null}

          {activeView === 'tracking' ? (
            <TrackingLookupView
              trackingCode={trackingCode}
              trackingLoading={trackingLoading}
              trackingError={trackingError}
              shipments={shipments}
              shipmentRows={shipmentRows}
              trackingCurrent={trackingCurrent}
              trackingShipmentRow={trackingShipmentRow}
              trackingPickupRequest={trackingPickupRequest}
              trackingTimeline={trackingTimeline}
              copiedTracking={copiedTracking}
              resolveShipmentStatusClass={resolveShipmentStatusClass}
              resolveShipmentStatusLabel={resolveShipmentStatusLabel}
              onTrackingCodeChange={setTrackingCode}
              onLookupTracking={lookupTracking}
              onSetCopiedTracking={setCopiedTracking}
              onOpenShipmentDetail={(code) => {
                void openShipmentDetail(code);
              }}
              onPrintShipment={printShipment}
            />
          ) : null}

          {activeView === 'change-requests' ? (
            <ChangeRequestView onBackToShipments={() => setActiveView('shipments')} />
          ) : null}

          {activeView === 'returns' ? (
            <ReturnRequestView
              returnCode={returnCode}
              returnShipmentPreview={returnShipmentPreview}
              returnReason={returnReason}
              returnNotes={returnNotes}
              returnLoading={returnLoading}
              returnMessage={returnMessage}
              returnStatusFilter={returnStatusFilter}
              returnRows={returnRows}
              onReturnCodeChange={setReturnCode}
              onReturnReasonChange={setReturnReason}
              onReturnNotesChange={setReturnNotes}
              onReturnStatusFilterChange={setReturnStatusFilter}
              onSubmitReturn={createReturnRequest}
              onOpenShipmentDetail={(shipmentCode) => {
                void openShipmentDetail(shipmentCode);
              }}
              onLookupTracking={(shipmentCode) => {
                setTrackingCode(shipmentCode);
                setActiveView('tracking');
                void lookupTracking(undefined, shipmentCode);
              }}
            />
          ) : null}

          {activeView === 'claims' ? (
            <ClaimsView
              claims={claims}
              claimMessage={claimMessage}
              claimError={claimError}
              claimSearch={claimSearch}
              claimStatusFilter={claimStatusFilter}
              selectedClaimDetail={selectedClaimDetail}
              isCreateClaimOpen={isCreateClaimOpen}
              claimShipmentCode={claimShipmentCode}
              claimIncidentType={claimIncidentType}
              claimRequestedAmount={claimRequestedAmount}
              claimPackageDesc={claimPackageDesc}
              claimDamageDesc={claimDamageDesc}
              claimSubmitting={claimSubmitting}
              shipmentRows={shipmentRows}
              onSetIsCreateClaimOpen={setIsCreateClaimOpen}
              onSetSelectedClaimDetail={setSelectedClaimDetail}
              onSetClaimSearch={setClaimSearch}
              onSetClaimStatusFilter={setClaimStatusFilter}
              onSetClaimShipmentCode={setClaimShipmentCode}
              onSetClaimIncidentType={setClaimIncidentType}
              onSetClaimRequestedAmount={setClaimRequestedAmount}
              onSetClaimPackageDesc={setClaimPackageDesc}
              onSetClaimDamageDesc={setClaimDamageDesc}
              onSubmitCreateClaim={submitCreateClaim}
              onOpenShipmentDetail={(shipmentCode) => {
                void openShipmentDetail(shipmentCode);
              }}
              resolveShipmentStatusLabel={resolveShipmentStatusLabel}
            />
          ) : null}

          {activeView === 'finance' ? (
            <MerchantFinanceView
              insights={insights}
              merchantBankProfile={merchantBankProfile}
              settlementBatches={settlementBatches}
              financialLedger={financialLedger}
              financeSubTab={financeSubTab}
              financeBatchStatusFilter={financeBatchStatusFilter}
              financeLedgerSearch={financeLedgerSearch}
              financeLedgerTypeFilter={financeLedgerTypeFilter}
              exportAllLedgerCsv={exportAllLedgerCsv}
              exportBatchToCsv={exportBatchToCsv}
              onSetFinanceSubTab={setFinanceSubTab}
              onSetFinanceBatchStatusFilter={setFinanceBatchStatusFilter}
              onSetFinanceLedgerSearch={setFinanceLedgerSearch}
              onSetFinanceLedgerTypeFilter={setFinanceLedgerTypeFilter}
              onOpenEditBankModal={() => {
                setEditBankForm(merchantBankProfile);
                setIsEditingBankModalOpen(true);
              }}
              onShowTopupModal={() => setShowTopupModal(true)}
              onSelectSettlementBatch={setSelectedSettlementBatch}
              onOpenShipmentDetail={(shipmentCode) => {
                void openShipmentDetail(shipmentCode);
              }}
            />
          ) : null}

          {activeView === 'print' ? (
            <PrintShipmentView
              shipmentRows={shipmentRows}
              printSingleCode={printSingleCode}
              printBulkCodes={printBulkCodes}
              printPreviewRow={printPreviewRow}
              printBulkPreviewRows={printBulkPreviewRows}
              printMessage={printMessage}
              onPrintSingleCodeChange={setPrintSingleCode}
              onPrintBulkCodesChange={setPrintBulkCodes}
              onPrintSingle={() => {
                const row = shipmentRows.find((r) => r.shipment.code === normalizeCode(printSingleCode));
                if (!row) {
                  setPrintMessage('Không tìm thấy shipment trong danh sách hiện tại.');
                  return;
                }
                printShipment(row);
                setPrintMessage(`Đã mở popup in cho ${row.shipment.code}`);
              }}
              onPrintBulk={() => {
                const codes = printBulkCodes
                  .split(/[\s,;\n]+/)
                  .map((c) => normalizeCode(c))
                  .filter(Boolean);
                if (codes.length === 0) {
                  setPrintMessage('Vui lòng nhập ít nhất 1 mã vận đơn để in.');
                  return;
                }
                if (printBulkPreviewRows.length === 0) {
                  setPrintMessage('Không tìm thấy vận đơn nào phù hợp với danh sách mã đã nhập.');
                  return;
                }
                printMultipleShipments(printBulkPreviewRows);
                if (printBulkPreviewRows.length < codes.length) {
                  setPrintMessage(`Đã mở popup in cho ${printBulkPreviewRows.length}/${codes.length} mã tìm thấy.`);
                } else {
                  setPrintMessage(`Đã mở popup in cho toàn bộ ${printBulkPreviewRows.length} vận đơn.`);
                }
              }}
              onDownloadCsv={downloadCsv}
              onExportPdf={exportPdf}
            />
          ) : null}

          {activeView === 'account' ? (
            <MerchantAccountView
              session={session}
              profile={profile}
              onProfileChange={setProfile}
              selectedAccountProvinceHub={selectedAccountProvinceHub}
              accountSaving={accountSaving}
              accountMessage={accountMessage}
              onSaveAccountProfile={saveAccountProfile}
              passwordOld={passwordOld}
              passwordNew={passwordNew}
              passwordConfirm={passwordConfirm}
              passwordSaving={passwordSaving}
              passwordMessage={passwordMessage}
              onPasswordOldChange={setPasswordOld}
              onPasswordNewChange={setPasswordNew}
              onPasswordConfirmChange={setPasswordConfirm}
              onChangeAccountPassword={changeAccountPassword}
            />
          ) : null}

          {activeView === 'notifications' ? (
            <MerchantNotificationsView
              notifications={notifications}
              onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
              onMarkItemRead={(id) => setNotifications((prev) => prev.map((i) => i.id === id ? { ...i, read: true } : i))}
              onDeleteItem={(id) => setNotifications((prev) => prev.filter((i) => i.id !== id))}
              onClearAll={() => setNotifications([])}
            />
          ) : null}
        </main>
      </div>

      <BankProfileModal
        isOpen={isEditingBankModalOpen}
        onClose={() => setIsEditingBankModalOpen(false)}
        editBankForm={editBankForm}
        setEditBankForm={setEditBankForm}
        onSaveBankProfile={handleSaveBankProfile}
      />

      <SettlementBatchDetailModal
        batch={selectedSettlementBatch}
        onClose={() => setSelectedSettlementBatch(null)}
        shipmentRows={shipmentRows}
        onExportBatchToCsv={exportBatchToCsv}
      />

      <TopupVietQRModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        netBalance={insights.netBalance}
        username={session?.user?.username}
      />
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
