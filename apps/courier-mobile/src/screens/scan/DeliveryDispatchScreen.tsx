import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';

import { authApi } from '../../features/auth/auth.api';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { resolveShipmentScanCode } from '../../features/scan/shipment-code';
import { scanApi } from '../../features/scan/scan.api';
import type { CurrentLocationDto } from '../../features/scan/scan.types';
import { shipmentApi } from '../../features/shipment/shipment.api';
import type { ShipmentDto, ShipmentMetadata } from '../../features/shipment/shipment.types';
import { tasksApi } from '../../features/tasks/tasks.api';
import type { TaskAssignmentDto, TaskDto } from '../../features/tasks/tasks.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { ApiClientError } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { resolveCourierDisplayName, resolveCourierId } from '../../utils/courier';
import { appEnv } from '../../utils/env';
import { playScanSuccessSound, playScanWarningSound } from '../../utils/scanSoundFeedback';

interface CourierOption {
  courierId: string;
  label: string;
  hubCodes: string[];
  isSelf?: boolean;
}

interface DispatchScanItemPreview {
  loading: boolean;
  found: boolean;
  statusLabel?: string;
  receiverName?: string;
  receiverAddress?: string;
  codAmount?: number | null;
  warning?: string | null;
}

interface DispatchScanItem {
  shipmentCode: string;
  scannedAt: string;
  preview?: DispatchScanItemPreview;
}

interface DispatchFailurePreview {
  shipmentCode: string;
  reason: string;
}

interface DispatchDraft {
  selectedCourier: CourierOption | null;
  courierSearch: string;
  items: Array<{ shipmentCode: string; scannedAt: string }>;
}

const DISPATCH_DRAFT_STORAGE_KEY = 'courier-mobile:delivery-dispatch-draft:v1';
const TERMINAL_TASK_STATUSES = new Set(['COMPLETED', 'CANCELLED']);
const DELIVERY_DISPATCH_ALLOWED_STATUSES = new Set([
  'MANIFEST_UNSEALED',
  'MANIFEST_RECEIVED',
  'SCAN_INBOUND',
  'INVENTORY_CHECK',
  'PICKUP_COMPLETED',
  'CREATED',
  'UPDATED',
  'IN_TRANSIT',
  'SEND_GOODS',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
  'TASK_ASSIGNED',
]);
const DELIVERY_DISPATCH_BLOCKED_STATUSES = new Set([
  'DELIVERED',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'CANCELLED',
]);
const STATUS_NEEDS_FRESH_DELIVERY_TASK = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'INVENTORY_CHECK',
  'SCAN_INBOUND',
  'EXCEPTION',
]);

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function normalizeSearch(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeOptionalCode(value: string | null | undefined): string | null {
  const normalizedCode = normalizeCode(value);
  return normalizedCode.length > 0 ? normalizedCode : null;
}

function readMetadataPath(metadata: ShipmentMetadata | null, path: string): unknown {
  if (!metadata) return null;
  const keys = path.split('.');
  let cursor: unknown = metadata;
  for (const key of keys) {
    if (!cursor || typeof cursor !== 'object' || !(key in cursor)) {
      return null;
    }
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

function readMetadataString(metadata: ShipmentMetadata | null, paths: string[]): string | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function readMetadataNumber(metadata: ShipmentMetadata | null, paths: string[]): number | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function collectShipmentHubCodes(
  shipment: ShipmentDto,
  currentLocation: CurrentLocationDto | null,
): string[] {
  const candidates = [
    currentLocation?.locationCode,
    readMetadataString(shipment.metadata, [
      'currentHubCode',
      'location.current',
      'location.hubCode',
      'hub.code',
      'routing.destinationHubCode',
      'destinationHubCode',
      'receiver.hubCode',
      'receiverHubCode',
      'delivery.hubCode',
    ]),
  ];

  return Array.from(
    new Set(candidates.map((value) => normalizeOptionalCode(value)).filter(Boolean)),
  ) as string[];
}

function hubsAreCompatible(shipmentHubCodes: string[], allowedHubCodes: string[]): boolean {
  if (shipmentHubCodes.length === 0 || allowedHubCodes.length === 0) {
    return true;
  }

  for (const sHub of shipmentHubCodes) {
    for (const aHub of allowedHubCodes) {
      if (sHub === aHub) return true;
      // Support matching ward hub <-> provincial hub prefix (e.g. 07901W001 <-> 003079B001)
      if (sHub.length >= 6 && aHub.length >= 6) {
        const sProv = sHub.slice(0, 3);
        const aProv = aHub.slice(0, 3);
        if (sProv === aProv) return true;
      }
    }
  }
  return false;
}

function validateShipmentForDeliveryDispatch(
  shipment: ShipmentDto,
  input: {
    assignedHubCodes: string[];
    courierHubCodes: string[];
    currentLocation: CurrentLocationDto | null;
  },
): string | null {
  const shipmentCode = normalizeCode(shipment.code);
  const status = normalizeCode(shipment.currentStatus);

  if (DELIVERY_DISPATCH_BLOCKED_STATUSES.has(status)) {
    return `Đơn ${shipmentCode} không thể phát hàng vì đang ở trạng thái ${shipment.currentStatus}.`;
  }

  if (!DELIVERY_DISPATCH_ALLOWED_STATUSES.has(status)) {
    return `Đơn ${shipmentCode} chưa ở trạng thái cho phép phát hàng (${shipment.currentStatus}).`;
  }

  const combinedAllowedHubs = Array.from(
    new Set([...input.assignedHubCodes, ...input.courierHubCodes].map(normalizeCode).filter(Boolean)),
  );
  const shipmentHubCodes = collectShipmentHubCodes(shipment, input.currentLocation);

  if (combinedAllowedHubs.length > 0 && shipmentHubCodes.length > 0 && !hubsAreCompatible(shipmentHubCodes, combinedAllowedHubs)) {
    return `Đơn ${shipmentCode} đang thuộc hub ${shipmentHubCodes.join(', ')}, khác phạm vi bưu cục (${combinedAllowedHubs.join(', ')}).`;
  }

  return null;
}

async function getCurrentLocationOrNull(
  accessToken: string,
  shipmentCode: string,
): Promise<CurrentLocationDto | null> {
  try {
    return await scanApi.getCurrentLocation(accessToken, shipmentCode);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

function formatScannedAt(isoTime: string): string {
  const parsed = new Date(isoTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoTime;
  }
  return parsed.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatCodAmount(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || amount <= 0) {
    return '0đ (Không thu hộ)';
  }
  return `${amount.toLocaleString('vi-VN')}đ`;
}

function getActiveAssignment(task: TaskDto): TaskAssignmentDto | null {
  return task.assignments.find((assignment) => assignment.unassignedAt === null) ?? null;
}

function pickOpenDeliveryTask(tasks: TaskDto[]): TaskDto | null {
  const openTasks = tasks
    .filter((task) => task.taskType === 'DELIVERY' && !TERMINAL_TASK_STATUSES.has(task.status))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return openTasks[0] ?? null;
}

function generateDeliveryTaskCode(shipmentCode: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const normalizedShipmentCode = normalizeCode(shipmentCode)
    .replace(/[^A-Z0-9]/g, '')
    .slice(-6);
  return `DLV-${normalizedShipmentCode || 'SHIP'}-${timestamp}`;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.';
}

function isDispatchScanItem(value: unknown): value is { shipmentCode: string; scannedAt: string } {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.shipmentCode === 'string' && typeof record.scannedAt === 'string';
}

function isCourierOption(value: unknown): value is CourierOption {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.courierId === 'string' &&
    typeof record.label === 'string' &&
    Array.isArray(record.hubCodes) &&
    record.hubCodes.every((hubCode) => typeof hubCode === 'string')
  );
}

async function loadDispatchDraft(): Promise<DispatchDraft | null> {
  const rawDraft = await AsyncStorage.getItem(DISPATCH_DRAFT_STORAGE_KEY);
  if (!rawDraft) return null;

  try {
    const parsedDraft = JSON.parse(rawDraft) as Record<string, unknown>;
    const selectedCourier = isCourierOption(parsedDraft.selectedCourier)
      ? parsedDraft.selectedCourier
      : null;
    const items = Array.isArray(parsedDraft.items)
      ? parsedDraft.items.filter(isDispatchScanItem)
      : [];
    const courierSearch =
      typeof parsedDraft.courierSearch === 'string'
        ? parsedDraft.courierSearch
        : selectedCourier?.label ?? '';
    return { selectedCourier, courierSearch, items };
  } catch {
    await AsyncStorage.removeItem(DISPATCH_DRAFT_STORAGE_KEY);
    return null;
  }
}

async function saveDispatchDraft(draft: DispatchDraft): Promise<void> {
  if (!draft.selectedCourier && draft.items.length === 0 && draft.courierSearch.length === 0) {
    await AsyncStorage.removeItem(DISPATCH_DRAFT_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(DISPATCH_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function DeliveryDispatchScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();

  const accessToken = session?.tokens.accessToken ?? null;
  const user = session?.user ?? null;
  const assignedHubCodes = React.useMemo(
    () => (user?.hubCodes ?? []).map((hubCode) => normalizeCode(hubCode)).filter(Boolean),
    [user?.hubCodes],
  );
  const actorCode = resolveCourierId(appEnv.courierId, user?.username) || user?.id || '';
  const actorName = resolveCourierDisplayName({
    displayName: user?.displayName,
    username: user?.username,
    courierId: actorCode || 'N/A',
  });
  const actorHubCode = assignedHubCodes[0] ?? null;

  const selfCourierOption = React.useMemo<CourierOption | null>(() => {
    if (!actorCode) return null;
    return {
      courierId: actorCode,
      label: `${actorName} (${actorCode})`,
      hubCodes: assignedHubCodes,
      isSelf: true,
    };
  }, [actorCode, actorName, assignedHubCodes]);

  const [courierSearch, setCourierSearch] = React.useState('');
  const [selectedCourier, setSelectedCourier] = React.useState<CourierOption | null>(null);
  const [manualShipmentCode, setManualShipmentCode] = React.useState('');
  const [items, setItems] = React.useState<DispatchScanItem[]>([]);
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(() => new Set());
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [failurePreview, setFailurePreview] = React.useState<DispatchFailurePreview[]>([]);
  const [dispatchedToSelf, setDispatchedToSelf] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scanLocked, setScanLocked] = React.useState(false);
  const scanCooldownRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftLoadedRef = React.useRef(false);

  const courierOptionsQuery = useQuery({
    queryKey: ['auth', 'couriers-by-hub', assignedHubCodes],
    queryFn: async () => {
      if (!accessToken) return [];

      const hubList = assignedHubCodes.length > 0 ? assignedHubCodes : [undefined];
      const usersByHub = await Promise.all(
        hubList.map((hubCode) =>
          authApi.listUsers(accessToken, {
            roleGroup: 'SHIPPER',
            status: 'ACTIVE',
            ...(hubCode ? { hubCode } : {}),
          }),
        ),
      );

      const merged = new Map<string, CourierOption>();
      if (selfCourierOption) {
        merged.set(selfCourierOption.courierId, selfCourierOption);
      }

      for (const users of usersByHub) {
        for (const courier of users) {
          const courierId = courier.username.trim();
          if (!courierId) continue;

          const label = courier.displayName?.trim()
            ? `${courier.displayName.trim()} (${courierId})`
            : courierId;

          merged.set(courierId, {
            courierId,
            label,
            hubCodes: courier.hubCodes,
            isSelf: courierId === actorCode,
          });
        }
      }

      return Array.from(merged.values()).sort((left, right) => {
        if (left.isSelf && !right.isSelf) return -1;
        if (!left.isSelf && right.isSelf) return 1;
        return left.courierId.localeCompare(right.courierId);
      });
    },
    enabled: Boolean(accessToken),
  });

  const filteredCouriers = React.useMemo(() => {
    const keyword = normalizeSearch(courierSearch);
    const couriers = courierOptionsQuery.data ?? (selfCourierOption ? [selfCourierOption] : []);

    if (!keyword) {
      return couriers.slice(0, 8);
    }

    return couriers
      .filter(
        (courier) =>
          normalizeSearch(courier.label).includes(keyword) ||
          normalizeSearch(courier.courierId).includes(keyword),
      )
      .slice(0, 8);
  }, [courierOptionsQuery.data, courierSearch, selfCourierOption]);

  const selectedCount = selectedCodes.size;
  const canScan = Boolean(selectedCourier) && !isSubmitting;
  const cameraIsReady = permission?.granted === true;

  const hydrateItemPreview = React.useCallback(
    async (shipmentCode: string, courierTarget: CourierOption | null) => {
      if (!accessToken) return;
      try {
        const [shipment, currentLocation] = await Promise.all([
          shipmentApi.getShipmentDetail(accessToken, shipmentCode),
          getCurrentLocationOrNull(accessToken, shipmentCode),
        ]);
        const receiverName =
          readMetadataString(shipment.metadata, ['receiver.name', 'recipient.name', 'receiverName']) ??
          undefined;
        const receiverAddress =
          readMetadataString(shipment.metadata, [
            'deliveryAddress',
            'receiverAddress',
            'receiver.address',
            'recipient.address',
          ]) ?? undefined;
        const codAmount = readMetadataNumber(shipment.metadata, ['codAmount', 'cod.amount']);
        const warning = validateShipmentForDeliveryDispatch(shipment, {
          assignedHubCodes,
          courierHubCodes: courierTarget?.hubCodes ?? [],
          currentLocation,
        });

        setItems((current) =>
          current.map((entry) =>
            entry.shipmentCode === shipmentCode
              ? {
                  ...entry,
                  preview: {
                    loading: false,
                    found: true,
                    statusLabel: shipment.currentStatus,
                    receiverName,
                    receiverAddress,
                    codAmount,
                    warning,
                  },
                }
              : entry,
          ),
        );
      } catch (err) {
        setItems((current) =>
          current.map((entry) =>
            entry.shipmentCode === shipmentCode
              ? {
                  ...entry,
                  preview: {
                    loading: false,
                    found: false,
                    warning: toErrorMessage(err),
                  },
                }
              : entry,
          ),
        );
      }
    },
    [accessToken, assignedHubCodes],
  );

  React.useEffect(() => {
    void loadDispatchDraft().then((draft) => {
      if (draft) {
        setSelectedCourier(draft.selectedCourier);
        setCourierSearch(draft.courierSearch);
        const restoredItems: DispatchScanItem[] = draft.items.map((entry) => ({
          ...entry,
          preview: { loading: true, found: true },
        }));
        setItems(restoredItems);
        if (restoredItems.length > 0) {
          setMessage(`Đã khôi phục ${restoredItems.length} vận đơn đang quét dở.`);
          restoredItems.forEach((entry) => {
            void hydrateItemPreview(entry.shipmentCode, draft.selectedCourier);
          });
        }
      }
      draftLoadedRef.current = true;
    });

    return () => {
      if (scanCooldownRef.current) clearTimeout(scanCooldownRef.current);
    };
  }, [hydrateItemPreview]);

  React.useEffect(() => {
    if (!draftLoadedRef.current) return;
    void saveDispatchDraft({
      selectedCourier,
      courierSearch,
      items: items.map(({ shipmentCode, scannedAt }) => ({ shipmentCode, scannedAt })),
    });
  }, [courierSearch, items, selectedCourier]);

  React.useEffect(() => {
    if (failurePreview.length === 0) return;
    const shipmentCodes = new Set(items.map((item) => item.shipmentCode));
    setFailurePreview((current) =>
      current.filter((failure) => shipmentCodes.has(failure.shipmentCode)),
    );
  }, [failurePreview.length, items]);

  const lockScanner = React.useCallback(() => {
    setScanLocked(true);
    if (scanCooldownRef.current) clearTimeout(scanCooldownRef.current);
    scanCooldownRef.current = setTimeout(() => setScanLocked(false), 850);
  }, []);

  const chooseCourier = (courier: CourierOption) => {
    setSelectedCourier(courier);
    setCourierSearch(courier.label);
    setDispatchedToSelf(false);
    setMessage(
      courier.isSelf
        ? `Đã chọn tự nhận đơn về app của bạn (${courier.courierId}). Bắt đầu quét dồn mã vận đơn.`
        : `Đã chọn nhân viên phát hàng: ${courier.label}. Quét dồn các mã đơn hàng vào danh sách.`,
    );
    setErrorMessage(null);
    setFailurePreview([]);
  };

  const appendShipmentCode = React.useCallback(
    (rawValue: string) => {
      if (!selectedCourier) {
        playScanWarningSound();
        setErrorMessage('Vui lòng chọn nhân viên nhận phát trước khi quét mã.');
        return;
      }

      const scanCode = resolveShipmentScanCode(rawValue);
      const shipmentCode = scanCode?.shipmentCode ?? '';
      if (!shipmentCode) {
        playScanWarningSound();
        setErrorMessage('Mã vận đơn không hợp lệ.');
        return;
      }

      setItems((currentItems) => {
        const duplicated = currentItems.some((item) => item.shipmentCode === shipmentCode);
        if (duplicated) {
          playScanWarningSound();
          setMessage(`${shipmentCode} đã có trong danh sách quét dồn.`);
          setErrorMessage(null);
          return currentItems;
        }

        setManualShipmentCode('');
        setDispatchedToSelf(false);
        playScanSuccessSound();
        setMessage(`Đã thêm ${shipmentCode} vào danh sách phát (${currentItems.length + 1} đơn).`);
        setErrorMessage(null);
        setFailurePreview((current) =>
          current.filter((failure) => failure.shipmentCode !== shipmentCode),
        );

        void hydrateItemPreview(shipmentCode, selectedCourier);

        return [
          {
            shipmentCode,
            scannedAt: new Date().toISOString(),
            preview: { loading: true, found: true },
          },
          ...currentItems,
        ];
      });
    },
    [hydrateItemPreview, selectedCourier],
  );

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked || !canScan) return;
    lockScanner();

    const parsed = parsePickupScannedCode({ data: result.data, type: result.type });
    if (!parsed) {
      playScanWarningSound();
      setErrorMessage('Không đọc được mã vận đơn. Vui lòng thử lại.');
      return;
    }
    appendShipmentCode(parsed.value);
  };

  const addManualShipmentCode = () => {
    appendShipmentCode(manualShipmentCode);
  };

  const toggleSelected = (shipmentCode: string) => {
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (next.has(shipmentCode)) next.delete(shipmentCode);
      else next.add(shipmentCode);
      return next;
    });
  };

  const removeSingleItem = (shipmentCode: string) => {
    setItems((current) => current.filter((item) => item.shipmentCode !== shipmentCode));
    setSelectedCodes((current) => {
      const next = new Set(current);
      next.delete(shipmentCode);
      return next;
    });
    setFailurePreview((current) => current.filter((f) => f.shipmentCode !== shipmentCode));
  };

  const deleteSelectedItems = () => {
    if (selectedCodes.size === 0) return;
    setItems((currentItems) =>
      currentItems.filter((item) => !selectedCodes.has(item.shipmentCode)),
    );
    setMessage(`Đã xóa ${selectedCodes.size} mã khỏi danh sách.`);
    setFailurePreview((current) =>
      current.filter((failure) => !selectedCodes.has(failure.shipmentCode)),
    );
    setSelectedCodes(new Set());
  };

  const buildDispatchNote = (shipmentCode: string): string =>
    [
      'Phát hàng từ app courier mobile',
      `Vận đơn: ${shipmentCode}`,
      `Người thao tác: ${actorName}`,
      `Mã NV: ${actorCode || 'N/A'}`,
      `Mã hub: ${actorHubCode ?? 'N/A'}`,
      selectedCourier ? `Courier nhận phát: ${selectedCourier.courierId}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

  const submitDispatch = async () => {
    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    if (!selectedCourier) {
      setErrorMessage('Vui lòng chọn nhân viên cần phát.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Vui lòng quét ít nhất một mã vận đơn vào danh sách.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    setFailurePreview([]);
    setDispatchedToSelf(false);

    const successCodes: string[] = [];
    const failedCodes: DispatchFailurePreview[] = [];

    try {
      for (const item of [...items].reverse()) {
        try {
          const [shipment, currentLocation, existingTasks] = await Promise.all([
            shipmentApi.getShipmentDetail(accessToken, item.shipmentCode),
            getCurrentLocationOrNull(accessToken, item.shipmentCode),
            tasksApi.listTasks(accessToken, {
              taskType: 'DELIVERY',
              shipmentCode: item.shipmentCode,
            }),
          ]);

          const validationError = validateShipmentForDeliveryDispatch(shipment, {
            assignedHubCodes,
            courierHubCodes: selectedCourier.hubCodes,
            currentLocation,
          });
          if (validationError) {
            throw new Error(validationError);
          }

          let task = pickOpenDeliveryTask(existingTasks);
          const shipmentStatus = normalizeCode(shipment.currentStatus);
          const existingAssignment = task ? getActiveAssignment(task) : null;

          // If shipment was previously returned to hub / failed / checked in while keeping an old task on the same courier,
          // close the stale task and issue a fresh DELIVERY assignment so task.assigned updates status & pushes cleanly.
          if (
            task &&
            existingAssignment?.courierId === selectedCourier.courierId &&
            STATUS_NEEDS_FRESH_DELIVERY_TASK.has(shipmentStatus)
          ) {
            await tasksApi.updateTaskStatus(accessToken, task.id, 'CANCELLED');
            task = null;
          }

          if (!task) {
            task = await tasksApi.createTask(accessToken, {
              taskCode: generateDeliveryTaskCode(item.shipmentCode),
              taskType: 'DELIVERY',
              shipmentCode: item.shipmentCode,
              note: buildDispatchNote(item.shipmentCode),
            });
          }

          const activeAssignment = getActiveAssignment(task);
          if (!activeAssignment) {
            await tasksApi.assignTask(accessToken, {
              taskId: task.id,
              courierId: selectedCourier.courierId,
              hubCode: actorHubCode,
            });
          } else if (activeAssignment.courierId !== selectedCourier.courierId) {
            await tasksApi.reassignTask(accessToken, {
              taskId: task.id,
              courierId: selectedCourier.courierId,
              hubCode: actorHubCode,
            });
          }

          successCodes.push(item.shipmentCode);
        } catch (error) {
          failedCodes.push({
            shipmentCode: item.shipmentCode,
            reason: toErrorMessage(error),
          });
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['shipment'] }),
      ]);

      if (failedCodes.length > 0) {
        setFailurePreview(failedCodes);
        setErrorMessage(
          `Đã đẩy ${successCodes.length} đơn vào app ${selectedCourier.courierId}, còn ${failedCodes.length} đơn chưa đạt điều kiện.`,
        );
        setItems((currentItems) =>
          currentItems.filter((item) =>
            failedCodes.some((failed) => failed.shipmentCode === item.shipmentCode),
          ),
        );
        setSelectedCodes(new Set());
        return;
      }

      const isSelf = selectedCourier.courierId === actorCode;
      setDispatchedToSelf(isSelf);
      setMessage(
        isSelf
          ? `Đã nhận ${successCodes.length} đơn vào mục Nhiệm vụ phát của bạn.`
          : `Đã đẩy ${successCodes.length} đơn vào app nhân viên ${selectedCourier.label} (mục Đợi phát).`,
      );
      setItems([]);
      setSelectedCodes(new Set());
      setManualShipmentCode('');
      setFailurePreview([]);
    } catch (error) {
      const nextMessage = toErrorMessage(error);
      setErrorMessage(nextMessage);
      setFailurePreview([]);
      setGlobalError(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraSection}>
        <View style={[styles.cameraFrame, !canScan && styles.cameraFrameDisabled]}>
          {!permission ? (
            <View style={styles.cameraPlaceholder}>
              <ActivityIndicator size="small" color="#E2E8F0" />
              <Text style={styles.cameraPlaceholderText}>Đang kiểm tra quyền camera...</Text>
            </View>
          ) : null}

          {permission && !cameraIsReady ? (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderText}>
                Cần cấp quyền camera để quét mã vận đơn phát hàng.
              </Text>
              {permission.canAskAgain ? (
                <Pressable onPress={requestPermission} style={styles.permissionButton}>
                  <Text style={styles.permissionButtonText}>Cấp quyền camera</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {permission && cameraIsReady ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr',
                  'ean13',
                  'ean8',
                  'code39',
                  'code93',
                  'code128',
                  'upc_a',
                  'upc_e',
                ],
              }}
              onBarcodeScanned={handleBarCodeScanned}
            />
          ) : null}

          {!selectedCourier ? (
            <View style={styles.cameraOverlay}>
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>Chọn nhân viên phát hàng trước khi quét</Text>
            </View>
          ) : null}

          {isSubmitting ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>Đang đẩy nhiệm vụ vào app nhân viên...</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.workSection}
        contentContainerStyle={styles.workContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>Phát hàng tại bưu cục</Text>
            <Text style={styles.screenSubtitle}>
              Hub: {assignedHubCodes.join(', ') || 'Chưa gán hub'}
            </Text>
          </View>
          <Pressable
            disabled={selectedCount === 0}
            onPress={deleteSelectedItems}
            style={[
              styles.deleteButton,
              selectedCount === 0 && styles.deleteButtonDisabled,
            ]}
          >
            <Ionicons name="trash-outline" size={16} color="#B91C1C" />
            <Text style={styles.deleteButtonText}>
              Xóa{selectedCount > 0 ? ` ${selectedCount}` : ''}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>1. Nhân viên cần phát</Text>
            {selfCourierOption ? (
              <Pressable
                onPress={() => chooseCourier(selfCourierOption)}
                style={[
                  styles.selfPickButton,
                  selectedCourier?.courierId === selfCourierOption.courierId &&
                    styles.selfPickButtonActive,
                ]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={15}
                  color={
                    selectedCourier?.courierId === selfCourierOption.courierId
                      ? '#FFFFFF'
                      : theme.colors.primary
                  }
                />
                <Text
                  style={[
                    styles.selfPickText,
                    selectedCourier?.courierId === selfCourierOption.courierId &&
                      styles.selfPickTextActive,
                  ]}
                >
                  Nhận về tôi
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
            <TextInput
              testID="delivery-dispatch-courier-search-input"
              accessibilityLabel="Tìm courier nhận phát"
              value={courierSearch}
              onChangeText={(value) => {
                setCourierSearch(value);
                setSelectedCourier(null);
              }}
              placeholder="Tìm theo tên hoặc mã nhân viên"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>

          {courierOptionsQuery.isLoading ? (
            <Text style={styles.helperText}>Đang tải danh sách nhân viên trong bưu cục...</Text>
          ) : null}
          {courierOptionsQuery.isError ? (
            <Text style={styles.errorText}>{toErrorMessage(courierOptionsQuery.error)}</Text>
          ) : null}

          {filteredCouriers.length > 0 ? (
            <View style={styles.suggestionList}>
              {filteredCouriers.map((courier) => {
                const selected = selectedCourier?.courierId === courier.courierId;
                return (
                  <Pressable
                    testID={`delivery-dispatch-courier-option-${courier.courierId}`}
                    accessibilityLabel={`Chọn courier ${courier.label}`}
                    key={courier.courierId}
                    onPress={() => chooseCourier(courier)}
                    style={[
                      styles.suggestionItem,
                      selected && styles.suggestionItemSelected,
                    ]}
                  >
                    <View style={styles.suggestionAvatar}>
                      <Ionicons
                        name="bicycle-outline"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionLabel}>
                        {courier.label}{courier.isSelf ? ' • Tôi' : ''}
                      </Text>
                      <Text style={styles.suggestionMeta}>
                        {courier.hubCodes.join(', ') || 'Cùng bưu cục thao tác'}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : !courierOptionsQuery.isLoading ? (
            <Text style={styles.helperText}>Không tìm thấy nhân viên phù hợp.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>2. Quét dồn / nhập mã vận đơn</Text>
          <View style={styles.inputRow}>
            <TextInput
              testID="delivery-dispatch-shipment-code-input"
              accessibilityLabel="Mã vận đơn phát hàng"
              value={manualShipmentCode}
              onChangeText={setManualShipmentCode}
              placeholder={
                selectedCourier
                  ? 'Quét camera hoặc nhập mã rồi bấm Thêm'
                  : 'Chọn nhân viên trước để quét'
              }
              placeholderTextColor="#9CA3AF"
              style={[styles.fieldInput, !selectedCourier && styles.fieldInputDisabled]}
              autoCapitalize="characters"
              editable={Boolean(selectedCourier)}
              onSubmitEditing={addManualShipmentCode}
              returnKeyType="done"
            />
            <Pressable
              testID="delivery-dispatch-add-shipment-button"
              accessibilityLabel="Thêm mã vận đơn phát hàng"
              disabled={!selectedCourier}
              onPress={addManualShipmentCode}
              style={[styles.addButton, !selectedCourier && styles.addButtonDisabled]}
            >
              <Text style={styles.addButtonText}>Thêm</Text>
            </Pressable>
          </View>
        </View>

        {message ? (
          <View style={styles.successBanner}>
            <Text style={styles.infoText}>{message}</Text>
            {dispatchedToSelf ? (
              <Pressable
                onPress={() =>
                  navigation.navigate('TaskList', { initialTaskType: 'DELIVERY' })
                }
                style={styles.goToTasksButton}
              >
                <Text style={styles.goToTasksText}>Mở Nhiệm vụ phát</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {failurePreview.length > 0 ? (
          <View style={styles.failurePreviewCard}>
            <View style={styles.failurePreviewHeader}>
              <Ionicons name="warning-outline" size={18} color="#B91C1C" />
              <Text style={styles.failurePreviewTitle}>Vận đơn chưa đẩy được</Text>
            </View>
            {failurePreview.map((failure) => (
              <View key={failure.shipmentCode} style={styles.failurePreviewItem}>
                <Text style={styles.failureShipmentCode}>{failure.shipmentCode}</Text>
                <Text style={styles.failureReason}>{failure.reason}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Danh sách quét dồn</Text>
          <Text style={styles.listCount}>{items.length} vận đơn</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barcode-outline" size={28} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>
              Chưa có mã nào. Hãy chọn nhân viên và đưa camera vào mã vận đơn để quét liên tục.
            </Text>
          </View>
        ) : (
          <View style={styles.itemList}>
            {items.map((item) => {
              const selected = selectedCodes.has(item.shipmentCode);
              const warning = item.preview?.warning;
              return (
                <Pressable
                  key={item.shipmentCode}
                  onPress={() => toggleSelected(item.shipmentCode)}
                  style={[
                    styles.dispatchItem,
                    selected && styles.dispatchItemSelected,
                    warning ? styles.dispatchItemWarning : null,
                  ]}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                  </View>
                  <View style={styles.dispatchItemContent}>
                    <View style={styles.itemTopRow}>
                      <Text style={styles.shipmentCode}>{item.shipmentCode}</Text>
                      {item.preview?.statusLabel ? (
                        <View style={styles.statusChip}>
                          <Text style={styles.statusChipText}>{item.preview.statusLabel}</Text>
                        </View>
                      ) : null}
                    </View>
                    {item.preview?.loading ? (
                      <Text style={styles.scannedAt}>Đang kiểm tra thông tin đơn...</Text>
                    ) : item.preview?.found ? (
                      <>
                        <Text style={styles.previewMeta} numberOfLines={1}>
                          {item.preview.receiverName || 'Người nhận'} · COD{' '}
                          {formatCodAmount(item.preview.codAmount)}
                        </Text>
                        {item.preview.receiverAddress ? (
                          <Text style={styles.scannedAt} numberOfLines={1}>
                            {item.preview.receiverAddress}
                          </Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={styles.scannedAt}>
                        Quét lúc {formatScannedAt(item.scannedAt)}
                      </Text>
                    )}
                    {warning ? <Text style={styles.itemWarningText}>{warning}</Text> : null}
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => removeSingleItem(item.shipmentCode)}
                    style={styles.removeSingleButton}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          testID="delivery-dispatch-submit-button"
          accessibilityLabel="Xác nhận phát hàng"
          disabled={isSubmitting || !selectedCourier || items.length === 0}
          onPress={submitDispatch}
          style={[
            styles.submitButton,
            (isSubmitting || !selectedCourier || items.length === 0) &&
              styles.submitButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.submitButtonText}>
            Xác nhận phát hàng{items.length > 0 ? ` (${items.length} đơn)` : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  cameraSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  cameraFrame: {
    height: 168,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#111827',
    ...theme.shadow.md,
  },
  cameraFrameDisabled: {
    opacity: 0.92,
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  cameraPlaceholderText: {
    ...theme.typography.body.sm,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  permissionButton: {
    minHeight: 34,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  permissionButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.textInverse,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  cameraOverlayText: {
    ...theme.typography.caption.md,
    color: theme.colors.textInverse,
  },
  workSection: {
    flex: 1,
  },
  workContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  headerRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  screenTitle: {
    ...theme.typography.title.sm,
    color: theme.colors.textPrimary,
  },
  screenSubtitle: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxs,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.dangerSoft,
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
  deleteButtonText: {
    ...theme.typography.caption.md,
    color: '#B91C1C',
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  fieldLabel: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  selfPickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#EFF6FF',
  },
  selfPickButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  selfPickText: {
    ...theme.typography.caption.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  selfPickTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
  },
  suggestionList: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  suggestionItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  suggestionItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.infoSurface,
  },
  suggestionAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.infoSurface,
  },
  suggestionContent: {
    flex: 1,
    minWidth: 0,
  },
  suggestionLabel: {
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
  },
  suggestionMeta: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  fieldInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  fieldInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: theme.colors.textMuted,
  },
  addButton: {
    minWidth: 76,
    minHeight: 44,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.textInverse,
  },
  helperText: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  successBanner: {
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  infoText: {
    ...theme.typography.caption.md,
    color: theme.colors.info,
  },
  goToTasksButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  goToTasksText: {
    ...theme.typography.caption.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  errorText: {
    ...theme.typography.caption.md,
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  failurePreviewCard: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: '#FEF2F2',
    marginBottom: theme.spacing.md,
  },
  failurePreviewHeader: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  failurePreviewTitle: {
    ...theme.typography.subtitle.sm,
    color: '#991B1B',
  },
  failurePreviewItem: {
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    paddingTop: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  failureShipmentCode: {
    ...theme.typography.caption.md,
    color: '#7F1D1D',
  },
  failureReason: {
    ...theme.typography.body.sm,
    color: '#991B1B',
    marginTop: 2,
  },
  listHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  listTitle: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
  },
  listCount: {
    ...theme.typography.caption.md,
    color: theme.colors.info,
  },
  emptyState: {
    minHeight: 104,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  emptyText: {
    ...theme.typography.body.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  itemList: {
    gap: theme.spacing.sm,
  },
  dispatchItem: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  dispatchItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.infoSurface,
  },
  dispatchItemWarning: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
  },
  dispatchItemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  shipmentCode: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textPrimary,
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  previewMeta: {
    ...theme.typography.caption.md,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  scannedAt: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  itemWarningText: {
    ...theme.typography.caption.sm,
    color: '#B91C1C',
    marginTop: 4,
  },
  removeSingleButton: {
    padding: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  submitButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textInverse,
  },
});
