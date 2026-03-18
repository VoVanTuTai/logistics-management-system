import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';
import {
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

const STORAGE_KEY_SESSION = 'merchant-web.session.v1';
const STORAGE_KEY_DRAFTS = 'merchant-web.shipment-drafts.v1';
const STORAGE_KEY_NOTIFICATIONS = 'merchant-web.notifications.v1';
const STORAGE_KEY_RETURNS = 'merchant-web.return-requests.v1';
const STORAGE_KEY_PROFILE = 'merchant-web.profile.v1';
const SHIPMENT_PAGE_SIZE = 8;

function MerchantApp(): React.JSX.Element {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<MerchantSession | null>(null);
  const [activeView, setActiveView] = useState<ViewId>('dashboard');

  const [loginUsername, setLoginUsername] = useState('merchant.demo');
  const [loginPassword, setLoginPassword] = useState('merchant123456');
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

  const navItems: Array<{ id: ViewId; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'create-shipment', label: 'Tạo đơn hàng' },
    { id: 'shipments', label: 'Danh sách đơn hàng' },
    { id: 'pickups', label: 'Pickup requests' },
    { id: 'tracking', label: 'Tra cứu / Tracking' },
    { id: 'change-requests', label: 'Yêu cầu đổi thông tin giao' },
    { id: 'returns', label: 'Yêu cầu hoàn hàng' },
    { id: 'print', label: 'In vận đơn' },
    { id: 'account', label: 'Tài khoản' },
    { id: 'notifications', label: 'Thông báo' },
  ];

  const shipmentRows = useMemo(() => shipments.map((s) => extractShipmentRow(s)), [shipments]);
  const selectedShipment = useMemo(
    () => shipmentRows.find((r) => r.shipment.code === normalizeCode(selectedShipmentCode)) ?? null,
    [shipmentRows, selectedShipmentCode],
  );
  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const autoEstimatedFee = useMemo(() => computeEstimatedFee(createForm), [createForm]);
  const effectiveFee = quotedFee ?? autoEstimatedFee;

  const dashboardStats = useMemo(
    () => ({
      totalToday: shipments.filter((s) => isToday(s.createdAt)).length,
      waitingPickup: shipments.filter((s) => ['CREATED', 'UPDATED'].includes(s.currentStatus)).length,
      inTransit: shipments.filter((s) => ['PICKUP_COMPLETED', 'TASK_ASSIGNED', 'MANIFEST_SEALED', 'MANIFEST_RECEIVED', 'SCAN_INBOUND', 'SCAN_OUTBOUND'].includes(s.currentStatus)).length,
      delivered: shipments.filter((s) => s.currentStatus === 'DELIVERED').length,
      failedOrReturn: shipments.filter((s) => ['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED', 'RETURN_COMPLETED', 'CANCELLED'].includes(s.currentStatus)).length,
    }),
    [shipments],
  );

  const serviceOptions = useMemo(() => Array.from(new Set(shipmentRows.map((r) => r.serviceType).filter(Boolean))), [shipmentRows]);
  const regionOptions = useMemo(() => Array.from(new Set(shipmentRows.map((r) => r.receiverRegion).filter((r) => r && r !== '-'))), [shipmentRows]);

  const filteredRows = useMemo(() => {
    const keyword = listSearch.trim().toLowerCase();
    return shipmentRows.filter((row) => {
      const created = new Date(row.shipment.createdAt);
      const textOk = !keyword || row.shipment.code.toLowerCase().includes(keyword) || row.receiverName.toLowerCase().includes(keyword) || row.receiverPhone.toLowerCase().includes(keyword);
      const statusOk = listStatus === 'ALL' || row.shipment.currentStatus === listStatus;
      const serviceOk = listService === 'ALL' || row.serviceType === listService;
      const regionOk = listRegion === 'ALL' || row.receiverRegion === listRegion;
      const fromOk = !listFromDate || created >= new Date(`${listFromDate}T00:00:00`);
      const toOk = !listToDate || created <= new Date(`${listToDate}T23:59:59`);
      return textOk && statusOk && serviceOk && regionOk && fromOk && toOk;
    });
  }, [shipmentRows, listSearch, listStatus, listService, listRegion, listFromDate, listToDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / SHIPMENT_PAGE_SIZE));
  const visibleRows = useMemo(() => filteredRows.slice((listPage - 1) * SHIPMENT_PAGE_SIZE, listPage * SHIPMENT_PAGE_SIZE), [filteredRows, listPage]);
  const recentRows = useMemo(() => shipmentRows.slice(0, 8), [shipmentRows]);
  const pickupRows = useMemo(() => pickups.filter((p) => (pickupStatusFilter === 'ALL' ? true : p.status === pickupStatusFilter)), [pickups, pickupStatusFilter]);
  const changeRows = useMemo(() => changeRequests.filter((c) => (changeStatusFilter === 'ALL' ? true : c.status === changeStatusFilter)), [changeRequests, changeStatusFilter]);
  const returnRows = useMemo(() => returnRequests.filter((r) => (returnStatusFilter === 'ALL' ? true : r.status === returnStatusFilter)), [returnRequests, returnStatusFilter]);

  useEffect(() => setListPage(1), [listSearch, listStatus, listService, listRegion, listFromDate, listToDate]);

  useEffect(() => {
    if (!selectedShipment) return;
    setDetailReceiverPhone(selectedShipment.receiverPhone === '-' ? '' : selectedShipment.receiverPhone);
    setDetailReceiverAddress(selectedShipment.receiverAddress === '-' ? '' : selectedShipment.receiverAddress);
    setDetailDeliveryNote(selectedShipment.deliveryNote === '-' ? '' : selectedShipment.deliveryNote);
  }, [selectedShipment?.shipment.code, selectedShipment?.shipment.updatedAt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setDrafts(parseStorage(window.localStorage.getItem(STORAGE_KEY_DRAFTS), []));
    setNotifications(parseStorage(window.localStorage.getItem(STORAGE_KEY_NOTIFICATIONS), []));
    setReturnRequests(parseStorage(window.localStorage.getItem(STORAGE_KEY_RETURNS), []));
    setProfile(parseStorage(window.localStorage.getItem(STORAGE_KEY_PROFILE), DEFAULT_PROFILE));

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
        await refreshAllData(nextSession.accessToken);
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
    window.localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (!session || !selectedShipmentCode || activeView !== 'shipment-detail') return;
    void loadDetailTracking(selectedShipmentCode);
  }, [session?.accessToken, selectedShipmentCode, activeView]);

  function pushNotification(level: NotificationItem['level'], title: string, description: string): void {
    setNotifications((prev) => [{ id: generateLocalId('notify'), level, title, description, createdAt: new Date().toISOString(), read: false }, ...prev].slice(0, 120));
  }

  function upsertShipment(shipment: ShipmentResponse): void {
    setShipments((prev) => {
      const idx = prev.findIndex((item) => item.code === shipment.code);
      if (idx === -1) return [shipment, ...prev];
      const next = [...prev];
      next[idx] = shipment;
      return next;
    });
  }

  async function refreshAllData(accessToken: string): Promise<void> {
    setDataLoading(true);
    setDataError(null);
    const [shipRes, pickupRes, changeRes] = await Promise.allSettled([
      request<ShipmentResponse[]>('/merchant/shipment/shipments', { method: 'GET' }, accessToken),
      request<PickupRequest[]>('/merchant/pickup/pickups', { method: 'GET' }, accessToken),
      request<ChangeRequest[]>('/merchant/shipment/change-requests', { method: 'GET' }, accessToken),
    ]);

    if (shipRes.status === 'fulfilled') setShipments(shipRes.value);
    if (pickupRes.status === 'fulfilled') setPickups(pickupRes.value);
    if (changeRes.status === 'fulfilled') setChangeRequests(changeRes.value);

    if (shipRes.status === 'rejected') setDataError(extractErrorMessage(shipRes.reason));
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
      await refreshAllData(nextSession.accessToken);
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
    setActiveView('dashboard');
  }

  async function createPickupForShipment(code: string, note: string): Promise<PickupRequest> {
    if (!session) throw new Error('Session is required');
    const pickup = await request<PickupRequest>('/merchant/pickup/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupCode: generatePickupCode(),
        requesterName: pickupRequesterName.trim() || createForm.senderName.trim() || session.user.username,
        contactPhone: pickupContactPhone.trim() || createForm.senderPhone.trim() || profile.contactPhone || null,
        pickupAddress: pickupAddress.trim() || createForm.senderAddress.trim() || profile.defaultPickupAddress || null,
        note: `${note} | desired=${pickupDesiredTime || 'N/A'}`,
        items: [{ shipmentCode: normalizeCode(code), quantity: 1 }],
      }),
    }, session.accessToken);
    setPickups((prev) => [pickup, ...prev]);
    return pickup;
  }

  async function submitCreateShipment(withPickup: boolean): Promise<void> {
    if (!session) return;
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const payload: Record<string, unknown> = { metadata: buildShipmentMetadata(createForm, effectiveFee) };
      const code = normalizeCode(createForm.manualCode);
      if (code) payload.code = code;
      const created = await request<ShipmentResponse>('/merchant/shipment/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, session.accessToken);

      upsertShipment(created);
      setSelectedShipmentCode(created.code);
      setCreateSuccess(`Đã tạo shipment ${created.code}`);
      if (withPickup) {
        const pickup = await createPickupForShipment(created.code, `auto pickup ${created.code}`);
        setCreateSuccess(`Đã tạo shipment ${created.code} và pickup ${pickup.pickupCode}`);
      }
      setCreateForm(DEFAULT_CREATE_FORM);
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

    return {
      current: currentRes.status === 'fulfilled' ? currentRes.value : null,
      timeline: timelineRes.status === 'fulfilled' ? timelineRes.value : [],
      error:
        currentRes.status === 'rejected' && timelineRes.status === 'rejected'
          ? `${extractErrorMessage(currentRes.reason)} | ${extractErrorMessage(timelineRes.reason)}`
          : null,
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
  }

  function saveDraft(): void {
    setDrafts((prev) => [{ id: generateLocalId('draft'), createdAt: new Date().toISOString(), name: draftName.trim() || `Draft ${new Date().toLocaleString()}`, quoteFee: effectiveFee, form: createForm }, ...prev].slice(0, 50));
    setDraftName('');
  }

  function printShipment(row: ShipmentRow): void {
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) return;
    popup.document.write(`<html><head><title>${row.shipment.code}</title></head><body style="font-family:Arial;padding:20px"><h2>Vận đơn ${row.shipment.code}</h2><p>Người gửi: ${row.senderName} - ${row.senderPhone}</p><p>Người nhận: ${row.receiverName} - ${row.receiverPhone}</p><p>Dịch vụ: ${row.serviceType}</p><p>COD: ${formatCurrency(row.codAmount)}</p><p>Trạng thái: ${row.shipment.currentStatus}</p><script>window.onload=function(){window.print();}<\/script></body></html>`);
    popup.document.close();
  }

  function downloadCsv(): void {
    const header = ['tracking_code', 'receiver_name', 'receiver_phone', 'status', 'cod', 'fee', 'created_at'];
    const rows = shipmentRows.map((row) => [row.shipment.code, row.receiverName, row.receiverPhone, row.shipment.currentStatus, row.codAmount, row.feeEstimate, row.shipment.createdAt]);
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
        <div className="login-card grid">
          <h1 className="brand-title">Merchant Login</h1>
          <p className="muted">Đăng nhập để vào dashboard merchant.</p>
          <form className="grid" onSubmit={handleLogin}>
            <input className="input" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="Username" />
            <input className="input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" />
            <button className="btn btn-primary" type="submit" disabled={loginLoading}>{loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
          </form>
          {loginError ? <p className="message error">{loginError}</p> : null}
          <p className="muted">Seed account: merchant.demo / merchant123456</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div><h2 className="brand-title">Merchant Hub</h2><p className="brand-subtitle">Logistics Management System</p></div>
        <div className="session-box"><div>{session.user.username}</div><div>roles: {session.user.roles.join(', ')}</div><div>token exp: {formatDate(session.accessTokenExpiresAt)}</div></div>
        <nav className="nav-list">{navItems.map((item) => <button key={item.id} className={`nav-btn ${activeView === item.id ? 'active' : ''}`} onClick={() => setActiveView(item.id)}>{item.label}{item.id === 'notifications' && unreadNotifications > 0 ? ` [${unreadNotifications}]` : ''}</button>)}</nav>
        <div className="btn-row"><button className="btn btn-secondary" onClick={() => void refreshAllData(session.accessToken)} disabled={dataLoading}>{dataLoading ? 'Refreshing...' : 'Refresh'}</button><button className="btn btn-danger" onClick={() => void handleLogout()}>Logout</button></div>
      </aside>

      <div className="main">
        <header className="topbar"><div><strong>{navItems.find((i) => i.id === activeView)?.label}</strong><div className="muted">{new Date().toLocaleString()}</div></div><div className="btn-row"><span className="badge">Shipments: {shipments.length}</span><span className="badge">Pickups: {pickups.length}</span><span className="badge">Changes: {changeRequests.length}</span></div></header>
        <main className="content">
          {dataError ? <p className="message error">{dataError}</p> : null}

          {activeView === 'dashboard' ? <><section className="card"><h3>Dashboard</h3><div className="metric-grid"><div className="metric"><div className="metric-title">Tổng số đơn hôm nay</div><div className="metric-value">{dashboardStats.totalToday}</div></div><div className="metric"><div className="metric-title">Đơn chờ pickup</div><div className="metric-value">{dashboardStats.waitingPickup}</div></div><div className="metric"><div className="metric-title">Đơn đang giao</div><div className="metric-value">{dashboardStats.inTransit}</div></div><div className="metric"><div className="metric-title">Đơn giao thành công</div><div className="metric-value">{dashboardStats.delivered}</div></div><div className="metric"><div className="metric-title">Thất bại / hoàn</div><div className="metric-value">{dashboardStats.failedOrReturn}</div></div></div></section><section className="card"><h3>Tìm nhanh theo mã vận đơn</h3><form className="btn-row" onSubmit={(e) => { void quickTrackFromDashboard(e); }}><input className="input" style={{ maxWidth: 320 }} value={dashboardSearchCode} onChange={(e) => setDashboardSearchCode(e.target.value)} placeholder="SHP..." /><button className="btn btn-primary" type="submit">Tra cứu tracking</button></form></section><section className="card"><h3>Đơn mới tạo gần đây</h3>{recentRows.length === 0 ? <div className="empty">Chưa có shipment.</div> : <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Người nhận</th><th>SĐT</th><th>Trạng thái</th><th>Ngày tạo</th><th>Xem</th></tr></thead><tbody>{recentRows.map((row) => <tr key={row.shipment.id}><td>{row.shipment.code}</td><td>{row.receiverName}</td><td>{row.receiverPhone}</td><td><span className={statusClass(row.shipment.currentStatus)}>{row.shipment.currentStatus}</span></td><td>{formatDate(row.shipment.createdAt)}</td><td><button className="btn btn-ghost" onClick={() => { void openShipmentDetail(row.shipment.code); }}>Xem</button></td></tr>)}</tbody></table></div>}</section></> : null}

          {activeView === 'create-shipment' ? <section className="split-layout"><div className="card grid"><h3>Tạo shipment</h3><div className="grid grid-4"><input className="input" placeholder="Mã đơn (optional)" value={createForm.manualCode} onChange={(e) => setCreateForm((p) => ({ ...p, manualCode: e.target.value }))} /><input className="input" placeholder="Tên người gửi" value={createForm.senderName} onChange={(e) => setCreateForm((p) => ({ ...p, senderName: e.target.value }))} /><input className="input" placeholder="SĐT người gửi" value={createForm.senderPhone} onChange={(e) => setCreateForm((p) => ({ ...p, senderPhone: e.target.value }))} /><input className="input" placeholder="Địa chỉ gửi" value={createForm.senderAddress} onChange={(e) => setCreateForm((p) => ({ ...p, senderAddress: e.target.value }))} /><input className="input" placeholder="Tên người nhận" value={createForm.receiverName} onChange={(e) => setCreateForm((p) => ({ ...p, receiverName: e.target.value }))} /><input className="input" placeholder="SĐT người nhận" value={createForm.receiverPhone} onChange={(e) => setCreateForm((p) => ({ ...p, receiverPhone: e.target.value }))} /><input className="input" placeholder="Khu vực" value={createForm.receiverRegion} onChange={(e) => setCreateForm((p) => ({ ...p, receiverRegion: e.target.value }))} /><input className="input" placeholder="Địa chỉ nhận" value={createForm.receiverAddress} onChange={(e) => setCreateForm((p) => ({ ...p, receiverAddress: e.target.value }))} /><input className="input" placeholder="Loại hàng" value={createForm.itemType} onChange={(e) => setCreateForm((p) => ({ ...p, itemType: e.target.value }))} /><input className="input" placeholder="Khối lượng" value={createForm.weightKg} onChange={(e) => setCreateForm((p) => ({ ...p, weightKg: e.target.value }))} /><input className="input" placeholder="Dài" value={createForm.lengthCm} onChange={(e) => setCreateForm((p) => ({ ...p, lengthCm: e.target.value }))} /><input className="input" placeholder="Rộng" value={createForm.widthCm} onChange={(e) => setCreateForm((p) => ({ ...p, widthCm: e.target.value }))} /><input className="input" placeholder="Cao" value={createForm.heightCm} onChange={(e) => setCreateForm((p) => ({ ...p, heightCm: e.target.value }))} /><input className="input" placeholder="Giá trị hàng" value={createForm.declaredValue} onChange={(e) => setCreateForm((p) => ({ ...p, declaredValue: e.target.value }))} /><select className="select" value={createForm.serviceType} onChange={(e) => setCreateForm((p) => ({ ...p, serviceType: e.target.value as CreateShipmentForm['serviceType'] }))}><option value="STANDARD">STANDARD</option><option value="EXPRESS">EXPRESS</option><option value="SAME_DAY">SAME_DAY</option></select><input className="input" placeholder="COD" value={createForm.codAmount} onChange={(e) => setCreateForm((p) => ({ ...p, codAmount: e.target.value }))} /></div><textarea className="textarea" placeholder="Ghi chú giao" value={createForm.deliveryNote} onChange={(e) => setCreateForm((p) => ({ ...p, deliveryNote: e.target.value }))} /><div className="btn-row"><button className="btn btn-secondary" onClick={() => setQuotedFee(autoEstimatedFee)}>Tính phí tạm tính</button><button className="btn btn-ghost" onClick={saveDraft}>Lưu nháp</button><button className="btn btn-primary" disabled={createLoading} onClick={() => { void submitCreateShipment(false); }}>{createLoading ? 'Đang tạo...' : 'Tạo đơn'}</button><button className="btn btn-primary" disabled={createLoading} onClick={() => { void submitCreateShipment(true); }}>Tạo và yêu cầu pickup ngay</button></div>{createError ? <p className="message error">{createError}</p> : null}{createSuccess ? <p className="message success">{createSuccess}</p> : null}</div><div className="grid"><div className="card"><h3>Tóm tắt phí</h3><p className="muted">Phí tạm tính: <strong>{formatCurrency(effectiveFee)}</strong></p><p className="muted">Dịch vụ: {createForm.serviceType}</p></div><div className="card grid"><h3>Draft đã lưu</h3><input className="input" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Tên draft" />{drafts.length === 0 ? <div className="empty">Chưa có draft.</div> : drafts.slice(0, 6).map((d) => <div className="detail-box" key={d.id}><strong>{d.name}</strong><div className="muted">{formatDate(d.createdAt)}</div><div className="btn-row"><button className="btn btn-ghost" onClick={() => { setCreateForm(d.form); setQuotedFee(d.quoteFee); }}>Tải lại</button><button className="btn btn-danger" onClick={() => setDrafts((p) => p.filter((item) => item.id !== d.id))}>Xóa</button></div></div>)}</div></div></section> : null}

          {activeView === 'shipments' ? <><section className="card grid"><h3>Danh sách shipment</h3><div className="grid grid-4"><input className="input" placeholder="Search code / tên / SĐT" value={listSearch} onChange={(e) => setListSearch(e.target.value)} /><select className="select" value={listStatus} onChange={(e) => setListStatus(e.target.value)}><option value="ALL">All status</option><option value="CREATED">CREATED</option><option value="UPDATED">UPDATED</option><option value="DELIVERED">DELIVERED</option><option value="DELIVERY_FAILED">DELIVERY_FAILED</option><option value="RETURN_STARTED">RETURN_STARTED</option><option value="RETURN_COMPLETED">RETURN_COMPLETED</option><option value="CANCELLED">CANCELLED</option></select><select className="select" value={listService} onChange={(e) => setListService(e.target.value)}><option value="ALL">All service</option>{serviceOptions.map((o) => <option key={o}>{o}</option>)}</select><select className="select" value={listRegion} onChange={(e) => setListRegion(e.target.value)}><option value="ALL">All region</option>{regionOptions.map((o) => <option key={o}>{o}</option>)}</select><input className="input" type="date" value={listFromDate} onChange={(e) => setListFromDate(e.target.value)} /><input className="input" type="date" value={listToDate} onChange={(e) => setListToDate(e.target.value)} /></div></section><section className="card"><div className="table-wrap"><table><thead><tr><th>Mã vận đơn</th><th>Người nhận</th><th>SĐT</th><th>Trạng thái</th><th>COD</th><th>Phí</th><th>Dịch vụ</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.shipment.id}><td>{row.shipment.code}</td><td>{row.receiverName}</td><td>{row.receiverPhone}</td><td><span className={statusClass(row.shipment.currentStatus)}>{row.shipment.currentStatus}</span></td><td>{formatCurrency(row.codAmount)}</td><td>{formatCurrency(row.feeEstimate)}</td><td>{row.serviceType}</td><td>{formatDate(row.shipment.createdAt)}</td><td><div className="btn-row"><button className="btn btn-ghost" onClick={() => { void openShipmentDetail(row.shipment.code); }}>Xem</button><button className="btn btn-secondary" onClick={() => { void openShipmentDetail(row.shipment.code); }}>Cập nhật</button><button className="btn btn-danger" onClick={() => { const reason = window.prompt('Lý do hủy đơn', '') ?? ''; void cancelShipment(row.shipment.code, reason); }}>Hủy</button><button className="btn btn-secondary" onClick={() => { void createPickupForShipment(row.shipment.code, `manual pickup ${row.shipment.code}`); }}>Tạo pickup</button><button className="btn btn-ghost" onClick={() => printShipment(row)}>In</button></div></td></tr>)}</tbody></table></div>{visibleRows.length === 0 ? <div className="empty">Không có dữ liệu.</div> : null}<div className="btn-row" style={{ marginTop: 8 }}><button className="btn btn-ghost" disabled={listPage <= 1} onClick={() => setListPage((p) => Math.max(p - 1, 1))}>Prev</button><span className="badge">Page {listPage}/{totalPages}</span><button className="btn btn-ghost" disabled={listPage >= totalPages} onClick={() => setListPage((p) => Math.min(p + 1, totalPages))}>Next</button></div></section></> : null}

          {activeView === 'shipment-detail' ? <section className="grid">{!selectedShipment ? <div className="card"><div className="empty">Chưa chọn shipment.</div></div> : <><div className="card"><h3>Chi tiết shipment {selectedShipment.shipment.code}</h3><div className="details-grid"><div className="detail-box"><div className="label">Người gửi</div><div>{selectedShipment.senderName}<br />{selectedShipment.senderPhone}</div></div><div className="detail-box"><div className="label">Người nhận</div><div>{selectedShipment.receiverName}<br />{selectedShipment.receiverPhone}</div></div><div className="detail-box"><div className="label">Hàng hóa</div><div>{selectedShipment.itemType}<br />{selectedShipment.weightKg}kg</div></div><div className="detail-box"><div className="label">COD / Phí</div><div>{formatCurrency(selectedShipment.codAmount)}<br />{formatCurrency(selectedShipment.feeEstimate)}</div></div></div><div className="btn-row" style={{ marginTop: 8 }}><span className={statusClass(selectedShipment.shipment.currentStatus)}>{selectedShipment.shipment.currentStatus}</span><button className="btn btn-danger" onClick={() => { const reason = window.prompt('Lý do hủy đơn', '') ?? ''; void cancelShipment(selectedShipment.shipment.code, reason); }}>Hủy đơn</button><button className="btn btn-ghost" onClick={() => printShipment(selectedShipment)}>In vận đơn</button></div></div><div className="card grid"><h3>Sửa đơn nếu còn cho phép</h3><div className="grid grid-3"><input className="input" value={detailReceiverPhone} onChange={(e) => setDetailReceiverPhone(e.target.value)} placeholder="SĐT người nhận" /><input className="input" value={detailReceiverAddress} onChange={(e) => setDetailReceiverAddress(e.target.value)} placeholder="Địa chỉ người nhận" /><input className="input" value={detailDeliveryNote} onChange={(e) => setDetailDeliveryNote(e.target.value)} placeholder="Ghi chú giao hàng" /></div><div className="btn-row"><button className="btn btn-primary" disabled={detailUpdating} onClick={() => { void saveDetailUpdate(); }}>{detailUpdating ? 'Đang cập nhật...' : 'Sửa đơn'}</button><button className="btn btn-secondary" onClick={() => { setChangeCode(selectedShipment.shipment.code); setActiveView('change-requests'); }}>Yêu cầu đổi thông tin giao</button><button className="btn btn-secondary" onClick={() => { setReturnCode(selectedShipment.shipment.code); setActiveView('returns'); }}>Yêu cầu hoàn hàng</button></div>{detailError ? <p className="message error">{detailError}</p> : null}{detailSuccess ? <p className="message success">{detailSuccess}</p> : null}</div><div className="card"><h3>Timeline xử lý đơn</h3>{detailTrackError ? <p className="message error">{detailTrackError}</p> : null}<div className="timeline">{detailTrackTimeline.length === 0 ? <div className="empty">Chưa có tracking event.</div> : detailTrackTimeline.map((ev) => <div key={ev.id} className="timeline-item"><strong>{ev.eventType}</strong><div className="muted">{formatDate(ev.occurredAt)} | actor={ev.actor ?? 'system'} | loc={ev.locationCode ?? 'N/A'}</div></div>)}</div>{detailTrackCurrent ? <p className="muted">Current: {detailTrackCurrent.currentStatus ?? 'N/A'} | Last event: {detailTrackCurrent.lastEventType ?? 'N/A'}</p> : null}</div></>}</section> : null}

          {activeView === 'pickups' ? <><section className="card"><h3>Tạo và quản lý pickup request</h3><form className="grid" onSubmit={(e) => { void submitPickupRequest(e); }}><div className="grid grid-3"><textarea className="textarea" value={pickupShipmentCodes} onChange={(e) => setPickupShipmentCodes(e.target.value)} placeholder="Danh sách shipment code" /><input className="input" value={pickupRequesterName} onChange={(e) => setPickupRequesterName(e.target.value)} placeholder="Người yêu cầu" /><input className="input" value={pickupContactPhone} onChange={(e) => setPickupContactPhone(e.target.value)} placeholder="SĐT liên hệ" /><input className="input" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Địa chỉ pickup" /><input className="input" value={pickupDesiredTime} onChange={(e) => setPickupDesiredTime(e.target.value)} placeholder="Thời gian mong muốn" /><input className="input" value={pickupNote} onChange={(e) => setPickupNote(e.target.value)} placeholder="Ghi chú courier" /></div><button className="btn btn-primary" type="submit" disabled={pickupLoading}>{pickupLoading ? 'Đang tạo...' : 'Tạo pickup request'}</button></form>{pickupMessage ? <p className="message">{pickupMessage}</p> : null}</section><section className="card"><div className="btn-row"><select className="select" style={{ maxWidth: 220 }} value={pickupStatusFilter} onChange={(e) => setPickupStatusFilter(e.target.value)}><option value="ALL">All</option><option value="REQUESTED">pending/requested</option><option value="COMPLETED">picked_up/completed</option><option value="CANCELLED">cancelled</option></select></div><div className="table-wrap"><table><thead><tr><th>Pickup code</th><th>Shipment(s)</th><th>Trạng thái</th><th>Courier</th><th>Ngày tạo</th><th>Hành động</th></tr></thead><tbody>{pickupRows.map((item) => <tr key={item.id}><td>{item.pickupCode}</td><td>{item.items.map((it) => it.shipmentCode).join(', ') || '-'}</td><td><span className={statusClass(item.status)}>{item.status}</span></td><td>Chưa gán</td><td>{formatDate(item.createdAt)}</td><td><button className="btn btn-danger" disabled={item.status !== 'REQUESTED'} onClick={() => { if (!session) return; const reason = window.prompt('Lý do hủy pickup', '') ?? ''; void request<PickupRequest>(`/merchant/pickup/pickups/${encodeURIComponent(item.id)}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason.trim() || null }) }, session.accessToken).then((cancelled) => setPickups((prev) => prev.map((pickup) => pickup.id === item.id ? cancelled : pickup))); }}>Hủy pickup</button></td></tr>)}</tbody></table></div></section></> : null}

          {activeView === 'tracking' ? <><section className="card"><h3>Tracking / tra cứu nội bộ</h3><form className="btn-row" onSubmit={(e) => { void lookupTracking(e); }}><input className="input" style={{ maxWidth: 320 }} value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Shipment code" /><button className="btn btn-primary" type="submit" disabled={trackingLoading}>{trackingLoading ? 'Đang tải...' : 'Tra cứu'}</button></form>{trackingError ? <p className="message error">{trackingError}</p> : null}</section><section className="card"><div className="details-grid"><div className="detail-box"><div className="label">Current status</div><div>{trackingCurrent?.currentStatus ?? 'N/A'}</div></div><div className="detail-box"><div className="label">Current location</div><div>{trackingCurrent?.currentLocationCode ?? 'N/A'}</div></div><div className="detail-box"><div className="label">Last event</div><div>{trackingCurrent?.lastEventType ?? 'N/A'}</div></div><div className="detail-box"><div className="label">Last event at</div><div>{formatDate(trackingCurrent?.lastEventAt ?? null)}</div></div></div><div className="timeline" style={{ marginTop: 8 }}>{trackingTimeline.length === 0 ? <div className="empty">Chưa có timeline event.</div> : trackingTimeline.map((ev) => <div key={ev.id} className="timeline-item"><strong>{ev.eventType}</strong><div className="muted">{formatDate(ev.occurredAt)} | actor={ev.actor ?? 'system'} | location={ev.locationCode ?? 'N/A'}</div></div>)}</div></section></> : null}

          {activeView === 'change-requests' ? <><section className="card"><h3>Quản lý yêu cầu thay đổi giao hàng</h3><form className="grid" onSubmit={(e) => { void submitChangeRequest(e); }}><div className="grid grid-3"><input className="input" value={changeCode} onChange={(e) => setChangeCode(e.target.value)} placeholder="Shipment code" /><select className="select" value={changeType} onChange={(e) => setChangeType(e.target.value)}><option value="change.phone">Đổi số điện thoại</option><option value="change.address">Đổi địa chỉ giao</option><option value="change.note">Đổi ghi chú giao</option></select><input className="input" value={changeValue} onChange={(e) => setChangeValue(e.target.value)} placeholder="Giá trị mới" /></div><button className="btn btn-primary" type="submit" disabled={changeLoading}>{changeLoading ? 'Đang gửi...' : 'Tạo yêu cầu thay đổi'}</button></form>{changeMessage ? <p className="message">{changeMessage}</p> : null}</section><section className="card"><div className="btn-row"><select className="select" style={{ maxWidth: 220 }} value={changeStatusFilter} onChange={(e) => setChangeStatusFilter(e.target.value)}><option value="ALL">All</option><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option></select></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Shipment</th><th>Type</th><th>Status</th><th>Requested by</th><th>Created</th></tr></thead><tbody>{changeRows.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.shipmentCode}</td><td>{item.requestType}</td><td><span className={statusClass(item.status)}>{item.status}</span></td><td>{item.requestedBy ?? '-'}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div></section></> : null}

          {activeView === 'returns' ? <><section className="card"><h3>Quản lý yêu cầu hoàn hàng</h3><form className="grid" onSubmit={createReturnRequest}><div className="grid grid-3"><input className="input" value={returnCode} onChange={(e) => setReturnCode(e.target.value)} placeholder="Shipment code" /><input className="input" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Lý do hoàn" /><input className="input" type="date" value={returnExpectedDate} onChange={(e) => setReturnExpectedDate(e.target.value)} /></div><button className="btn btn-primary" type="submit">Tạo yêu cầu hoàn hàng</button></form></section><section className="card"><div className="btn-row"><select className="select" style={{ maxWidth: 220 }} value={returnStatusFilter} onChange={(e) => setReturnStatusFilter(e.target.value)}><option value="ALL">All</option><option value="PENDING">PENDING</option><option value="IN_TRANSIT">IN_TRANSIT</option><option value="COMPLETED">COMPLETED</option><option value="CANCELLED">CANCELLED</option></select></div><div className="table-wrap"><table><thead><tr><th>Shipment</th><th>Lý do</th><th>Dự kiến hoàn</th><th>Trạng thái</th><th>Ngày tạo</th><th>Hành động</th></tr></thead><tbody>{returnRows.map((item) => <tr key={item.id}><td>{item.shipmentCode}</td><td>{item.reason}</td><td>{item.expectedReturnAt}</td><td><span className={statusClass(item.status)}>{item.status}</span></td><td>{formatDate(item.createdAt)}</td><td><div className="btn-row"><button className="btn btn-ghost" onClick={() => setReturnRequests((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'IN_TRANSIT' } : r))}>In transit</button><button className="btn btn-secondary" onClick={() => setReturnRequests((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'COMPLETED' } : r))}>Completed</button><button className="btn btn-danger" onClick={() => setReturnRequests((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'CANCELLED' } : r))}>Cancel</button></div></td></tr>)}</tbody></table></div></section></> : null}

          {activeView === 'print' ? <section className="card grid"><h3>In vận đơn / chứng từ</h3><div className="grid grid-2"><div className="grid"><input className="input" value={printSingleCode} onChange={(e) => setPrintSingleCode(e.target.value)} placeholder="In 1 vận đơn" /><button className="btn btn-primary" onClick={() => { const row = shipmentRows.find((r) => r.shipment.code === normalizeCode(printSingleCode)); if (!row) { setPrintMessage('Không tìm thấy shipment trong danh sách hiện tại.'); return; } printShipment(row); setPrintMessage(`Đã mở popup in cho ${row.shipment.code}`); }}>In 1 vận đơn</button></div><div className="grid"><textarea className="textarea" value={printBulkCodes} onChange={(e) => setPrintBulkCodes(e.target.value)} placeholder="In nhiều vận đơn" /><button className="btn btn-secondary" onClick={() => { const codes = printBulkCodes.split(/[\s,;\n]+/).map((c) => normalizeCode(c)).filter(Boolean); codes.forEach((c) => { const row = shipmentRows.find((r) => r.shipment.code === c); if (row) printShipment(row); }); setPrintMessage(`Đã mở popup in cho ${codes.length} code.`); }}>In nhiều vận đơn</button></div></div><div className="btn-row"><button className="btn btn-ghost" onClick={downloadCsv}>Tải danh sách đơn</button><button className="btn btn-ghost" onClick={() => window.print()}>Xuất PDF (print dialog)</button></div>{printMessage ? <p className="message">{printMessage}</p> : null}</section> : null}

          {activeView === 'account' ? <><section className="card"><h3>Hồ sơ merchant</h3><form className="grid" onSubmit={(e) => { e.preventDefault(); setAccountMessage('Đã lưu hồ sơ merchant.'); }}><div className="grid grid-2"><input className="input" value={profile.shopName} onChange={(e) => setProfile((p) => ({ ...p, shopName: e.target.value }))} placeholder="Tên cửa hàng" /><input className="input" value={profile.contactPhone} onChange={(e) => setProfile((p) => ({ ...p, contactPhone: e.target.value }))} placeholder="SĐT liên hệ" /><input className="input" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="Email" /><input className="input" value={profile.defaultPickupAddress} onChange={(e) => setProfile((p) => ({ ...p, defaultPickupAddress: e.target.value }))} placeholder="Địa chỉ lấy hàng mặc định" /></div><button className="btn btn-primary" type="submit">Lưu hồ sơ</button></form>{accountMessage ? <p className="message success">{accountMessage}</p> : null}</section><section className="card"><h3>Đổi mật khẩu</h3><form className="grid grid-3" onSubmit={(e) => { e.preventDefault(); if (!passwordOld || !passwordNew || !passwordConfirm) { setPasswordMessage('Cần nhập đầy đủ thông tin'); return; } if (passwordNew !== passwordConfirm) { setPasswordMessage('Mật khẩu xác nhận không khớp'); return; } setPasswordMessage('Đã tiếp nhận yêu cầu đổi mật khẩu (scaffold: chưa có API).'); setPasswordOld(''); setPasswordNew(''); setPasswordConfirm(''); }}><input className="input" type="password" value={passwordOld} onChange={(e) => setPasswordOld(e.target.value)} placeholder="Mật khẩu hiện tại" /><input className="input" type="password" value={passwordNew} onChange={(e) => setPasswordNew(e.target.value)} placeholder="Mật khẩu mới" /><input className="input" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Xác nhận mật khẩu mới" /><button className="btn btn-primary" type="submit">Đổi mật khẩu</button></form>{passwordMessage ? <p className="message">{passwordMessage}</p> : null}</section></> : null}

          {activeView === 'notifications' ? <section className="card"><h3>Thông báo</h3><div className="btn-row"><button className="btn btn-ghost" onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}>Đánh dấu đã đọc tất cả</button><button className="btn btn-danger" onClick={() => setNotifications([])}>Xóa toàn bộ</button></div><div className="grid" style={{ marginTop: 8 }}>{notifications.length === 0 ? <div className="empty">Chưa có thông báo.</div> : notifications.map((n) => <div className="detail-box" key={n.id}><strong>{n.title}</strong><div className="muted">{n.description}</div><div className="muted">{formatDate(n.createdAt)} | {n.read ? 'Đã đọc' : 'Chưa đọc'}</div><div className="btn-row"><button className="btn btn-ghost" onClick={() => setNotifications((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))}>Đánh dấu đã đọc</button><button className="btn btn-danger" onClick={() => setNotifications((prev) => prev.filter((i) => i.id !== n.id))}>Xóa</button></div></div>)}</div></section> : null}
        </main>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <MerchantApp />
  </React.StrictMode>,
);
