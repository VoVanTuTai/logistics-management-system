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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';

import { authApi } from '../../features/auth/auth.api';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { scanApi } from '../../features/scan/scan.api';
import type { CurrentLocationDto } from '../../features/scan/scan.types';
import { shipmentApi } from '../../features/shipment/shipment.api';
import type { ShipmentDto, ShipmentMetadata } from '../../features/shipment/shipment.types';
import { tasksApi } from '../../features/tasks/tasks.api';
import type { TaskAssignmentDto, TaskDto } from '../../features/tasks/tasks.types';
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
}

interface DispatchScanItem {
  shipmentCode: string;
  scannedAt: string;
}

interface DispatchFailurePreview {
  shipmentCode: string;
  reason: string;
}

interface DispatchDraft {
  selectedCourier: CourierOption | null;
  courierSearch: string;
  items: DispatchScanItem[];
}

const DISPATCH_DRAFT_STORAGE_KEY = 'courier-mobile:delivery-dispatch-draft:v1';
const TERMINAL_TASK_STATUSES = new Set(['COMPLETED', 'CANCELLED']);
const DELIVERY_DISPATCH_STATUSES = new Set([
  'MANIFEST_UNSEALED',
  'MANIFEST_RECEIVED',
  'SCAN_INBOUND',
  'INVENTORY_CHECK',
]);
const DELIVERY_DISPATCH_BLOCKED_STATUSES = new Set([
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'CANCELLED',
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

function readMetadataPath(
  metadata: ShipmentMetadata | null,
  path: string,
): unknown {
  if (!metadata) {
    return null;
  }

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

function readMetadataString(
  metadata: ShipmentMetadata | null,
  paths: string[],
): string | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
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

function validateShipmentForDeliveryDispatch(
  shipment: ShipmentDto,
  input: {
    assignedHubCodes: string[];
    currentLocation: CurrentLocationDto | null;
    hasOpenDeliveryTask: boolean;
  },
): string | null {
  const shipmentCode = normalizeCode(shipment.code);
  const status = normalizeCode(shipment.currentStatus);

  if (DELIVERY_DISPATCH_BLOCKED_STATUSES.has(status)) {
    return `Đơn ${shipmentCode} không thể phát hàng vì đang ở trạng thái ${shipment.currentStatus}.`;
  }

  const statusAllowed =
    DELIVERY_DISPATCH_STATUSES.has(status) ||
    (status === 'TASK_ASSIGNED' && input.hasOpenDeliveryTask);
  if (!statusAllowed) {
    return `Đơn ${shipmentCode} chưa ở trạng thái được phép phát hàng (${shipment.currentStatus}).`;
  }

  if (input.assignedHubCodes.length === 0) {
    return 'Tài khoản chưa được gán hub nên không thể bàn giao phát hàng.';
  }

  const shipmentHubCodes = collectShipmentHubCodes(shipment, input.currentLocation);
  if (
    shipmentHubCodes.length > 0 &&
    !shipmentHubCodes.some((hubCode) => input.assignedHubCodes.includes(hubCode))
  ) {
    return `Đơn ${shipmentCode} đang thuộc hub ${shipmentHubCodes.join(', ')}, không thuộc hub của tài khoản này.`;
  }

  if (shipmentHubCodes.length === 0) {
    return `Đơn ${shipmentCode} chưa có thông tin hub hiện tại để xác thực phát hàng.`;
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

function getActiveAssignment(task: TaskDto): TaskAssignmentDto | null {
  return (
    task.assignments.find((assignment) => assignment.unassignedAt === null) ??
    null
  );
}

function pickOpenDeliveryTask(tasks: TaskDto[]): TaskDto | null {
  const openTasks = tasks
    .filter(
      (task) =>
        task.taskType === 'DELIVERY' &&
        !TERMINAL_TASK_STATUSES.has(task.status),
    )
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

function isDispatchScanItem(value: unknown): value is DispatchScanItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.shipmentCode === 'string' && typeof record.scannedAt === 'string';
}

function isCourierOption(value: unknown): value is CourierOption {
  if (!value || typeof value !== 'object') {
    return false;
  }

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
  if (!rawDraft) {
    return null;
  }

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

    return {
      selectedCourier,
      courierSearch,
      items,
    };
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
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();

  const accessToken = session?.tokens.accessToken ?? null;
  const user = session?.user ?? null;
  const assignedHubCodes = React.useMemo(
    () =>
      (user?.hubCodes ?? [])
        .map((hubCode) => normalizeCode(hubCode))
        .filter(Boolean),
    [user?.hubCodes],
  );
  const actorCode = resolveCourierId(appEnv.courierId, user?.username) || user?.id || 'N/A';
  const actorName = resolveCourierDisplayName({
    displayName: user?.displayName,
    username: user?.username,
    courierId: actorCode,
  });
  const actorHubCode = assignedHubCodes[0] ?? null;

  const [courierSearch, setCourierSearch] = React.useState('');
  const [selectedCourier, setSelectedCourier] = React.useState<CourierOption | null>(
    null,
  );
  const [manualShipmentCode, setManualShipmentCode] = React.useState('');
  const [items, setItems] = React.useState<DispatchScanItem[]>([]);
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [failurePreview, setFailurePreview] = React.useState<DispatchFailurePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scanLocked, setScanLocked] = React.useState(false);
  const scanCooldownRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftLoadedRef = React.useRef(false);

  const courierOptionsQuery = useQuery({
    queryKey: ['auth', 'couriers-by-hub', assignedHubCodes],
    queryFn: async () => {
      if (!accessToken) {
        return [];
      }

      const usersByHub = await Promise.all(
        assignedHubCodes.map((hubCode) =>
          authApi.listUsers(accessToken, {
            roleGroup: 'SHIPPER',
            status: 'ACTIVE',
            hubCode,
          }),
        ),
      );

      const merged = new Map<string, CourierOption>();
      for (const users of usersByHub) {
        for (const courier of users) {
          const courierId = courier.username.trim();
          if (!courierId) {
            continue;
          }

          const label = courier.displayName?.trim()
            ? `${courier.displayName.trim()} (${courierId})`
            : courierId;

          merged.set(courierId, {
            courierId,
            label,
            hubCodes: courier.hubCodes,
          });
        }
      }

      return Array.from(merged.values()).sort((left, right) =>
        left.courierId.localeCompare(right.courierId),
      );
    },
    enabled: Boolean(accessToken) && assignedHubCodes.length > 0,
  });

  const filteredCouriers = React.useMemo(() => {
    const keyword = normalizeSearch(courierSearch);
    const couriers = courierOptionsQuery.data ?? [];

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
  }, [courierOptionsQuery.data, courierSearch]);

  const selectedCount = selectedCodes.size;
  const canScan = Boolean(selectedCourier) && !isSubmitting;
  const cameraIsReady = permission?.granted === true;

  React.useEffect(() => {
    void loadDispatchDraft().then((draft) => {
      if (draft) {
        setSelectedCourier(draft.selectedCourier);
        setCourierSearch(draft.courierSearch);
        setItems(draft.items);
        if (draft.items.length > 0) {
          setMessage(`Đã khôi phục ${draft.items.length} vận đơn phát hàng chưa bàn giao.`);
        }
      }

      draftLoadedRef.current = true;
    });

    return () => {
      if (scanCooldownRef.current) {
        clearTimeout(scanCooldownRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!draftLoadedRef.current) {
      return;
    }

    void saveDispatchDraft({
      selectedCourier,
      courierSearch,
      items,
    });
  }, [courierSearch, items, selectedCourier]);

  React.useEffect(() => {
    if (failurePreview.length === 0) {
      return;
    }

    const shipmentCodes = new Set(items.map((item) => item.shipmentCode));
    setFailurePreview((current) =>
      current.filter((failure) => shipmentCodes.has(failure.shipmentCode)),
    );
  }, [failurePreview.length, items]);

  const lockScanner = React.useCallback(() => {
    setScanLocked(true);

    if (scanCooldownRef.current) {
      clearTimeout(scanCooldownRef.current);
    }

    scanCooldownRef.current = setTimeout(() => {
      setScanLocked(false);
    }, 850);
  }, []);

  const chooseCourier = (courier: CourierOption) => {
    setSelectedCourier(courier);
    setCourierSearch(courier.label);
    setMessage(`Đã chọn courier ${courier.courierId}.`);
    setErrorMessage(null);
    setFailurePreview([]);
  };

  const appendShipmentCode = React.useCallback(
    (rawValue: string) => {
      if (!selectedCourier) {
        playScanWarningSound();
        setErrorMessage('Vui lòng chọn courier trước khi quét vận đơn.');
        return;
      }

      const shipmentCode = normalizeCode(rawValue);
      if (!shipmentCode) {
        playScanWarningSound();
        setErrorMessage('Mã vận đơn không hợp lệ.');
        return;
      }

      setItems((currentItems) => {
        const duplicated = currentItems.some(
          (item) => item.shipmentCode === shipmentCode,
        );
        if (duplicated) {
          playScanWarningSound();
          setMessage(`${shipmentCode} đã có trong danh sách phát hàng.`);
          setErrorMessage(null);
          return currentItems;
        }

        setManualShipmentCode('');
        playScanSuccessSound();
        setMessage(`Đã thêm vận đơn ${shipmentCode}.`);
        setErrorMessage(null);
        setFailurePreview((current) =>
          current.filter((failure) => failure.shipmentCode !== shipmentCode),
        );

        return [
          {
            shipmentCode,
            scannedAt: new Date().toISOString(),
          },
          ...currentItems,
        ];
      });
    },
    [selectedCourier],
  );

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked || !canScan) {
      return;
    }

    lockScanner();

    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

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
      if (next.has(shipmentCode)) {
        next.delete(shipmentCode);
      } else {
        next.add(shipmentCode);
      }
      return next;
    });
  };

  const deleteSelectedItems = () => {
    if (selectedCodes.size === 0) {
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((item) => !selectedCodes.has(item.shipmentCode)),
    );
    setMessage(`Đã xoá ${selectedCodes.size} mã khỏi danh sách.`);
    setFailurePreview((current) =>
      current.filter((failure) => !selectedCodes.has(failure.shipmentCode)),
    );
    setSelectedCodes(new Set());
  };

  const buildDispatchNote = (shipmentCode: string): string =>
    [
      'Bàn giao phát từ courier mobile',
      `Vận đơn: ${shipmentCode}`,
      `Nhân viên: ${actorName}`,
      `Mã NV: ${actorCode}`,
      `Mã hub: ${actorHubCode ?? 'N/A'}`,
      selectedCourier ? `Courier: ${selectedCourier.courierId}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

  const submitDispatch = async () => {
    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!selectedCourier) {
      setErrorMessage('Vui lòng chọn courier nhận đơn phát.');
      return;
    }

    if (assignedHubCodes.length === 0) {
      setErrorMessage('Tài khoản chưa được gán hub nên không thể bàn giao phát hàng.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Vui lòng quét ít nhất một mã vận đơn.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    setFailurePreview([]);

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
          let task = pickOpenDeliveryTask(existingTasks);
          const validationError = validateShipmentForDeliveryDispatch(shipment, {
            assignedHubCodes,
            currentLocation,
            hasOpenDeliveryTask: Boolean(task),
          });

          if (validationError) {
            throw new Error(validationError);
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
            });
          } else if (activeAssignment.courierId !== selectedCourier.courierId) {
            await tasksApi.reassignTask(accessToken, {
              taskId: task.id,
              courierId: selectedCourier.courierId,
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

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });

      if (failedCodes.length > 0) {
        setFailurePreview(failedCodes);
        setErrorMessage(
          `Đã bàn giao ${successCodes.length} đơn, còn ${failedCodes.length} đơn cần kiểm tra.`,
        );
        setItems((currentItems) =>
          currentItems.filter((item) =>
            failedCodes.some((failed) => failed.shipmentCode === item.shipmentCode),
          ),
        );
        setSelectedCodes(new Set());
        return;
      }

      setMessage(
        `Đã bàn giao ${successCodes.length} vận đơn cho courier ${selectedCourier.courierId}.`,
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
              <Text style={styles.cameraOverlayText}>Chọn courier trước khi quét</Text>
            </View>
          ) : null}

          {isSubmitting ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>Đang bàn giao phát hàng...</Text>
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
            <Text style={styles.screenTitle}>Phát hàng</Text>
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
          <Text style={styles.fieldLabel}>Courier nhận phát</Text>
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
              placeholder="Tìm theo tên hoặc mã courier"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>
          {courierOptionsQuery.isLoading ? (
            <Text style={styles.helperText}>Đang tải danh sách courier trong hub...</Text>
          ) : null}
          {courierOptionsQuery.isError ? (
            <Text style={styles.errorText}>{toErrorMessage(courierOptionsQuery.error)}</Text>
          ) : null}
          {assignedHubCodes.length === 0 ? (
            <Text style={styles.helperText}>
              Tài khoản chưa được gán hub nên chưa thể tải courier và phát hàng.
            </Text>
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
                      <Text style={styles.suggestionLabel}>{courier.label}</Text>
                      <Text style={styles.suggestionMeta}>
                        {courier.hubCodes.join(', ') || 'Không có hub'}
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
            <Text style={styles.helperText}>Không có courier phù hợp trong hub.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Mã vận đơn</Text>
          <View style={styles.inputRow}>
            <TextInput
              testID="delivery-dispatch-shipment-code-input"
              accessibilityLabel="Mã vận đơn phát hàng"
              value={manualShipmentCode}
              onChangeText={setManualShipmentCode}
              placeholder="Nhập hoặc quét mã vận đơn"
              placeholderTextColor="#9CA3AF"
              style={[styles.fieldInput, !selectedCourier && styles.fieldInputDisabled]}
              autoCapitalize="characters"
              editable={Boolean(selectedCourier)}
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

        {message ? <Text style={styles.infoText}>{message}</Text> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {failurePreview.length > 0 ? (
          <View style={styles.failurePreviewCard}>
            <View style={styles.failurePreviewHeader}>
              <Ionicons name="warning-outline" size={18} color="#B91C1C" />
              <Text style={styles.failurePreviewTitle}>Vận đơn chưa bàn giao được</Text>
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
          <Text style={styles.listTitle}>Danh sách phát</Text>
          <Text style={styles.listCount}>{items.length} vận đơn</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barcode-outline" size={28} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Chưa có mã vận đơn nào.</Text>
          </View>
        ) : (
          <View style={styles.itemList}>
            {items.map((item) => {
              const selected = selectedCodes.has(item.shipmentCode);
              return (
                <Pressable
                  key={item.shipmentCode}
                  onPress={() => toggleSelected(item.shipmentCode)}
                  style={[styles.dispatchItem, selected && styles.dispatchItemSelected]}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <View style={styles.dispatchItemContent}>
                    <Text style={styles.shipmentCode}>{item.shipmentCode}</Text>
                    <Text style={styles.scannedAt}>
                      Quét lúc {formatScannedAt(item.scannedAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          testID="delivery-dispatch-submit-button"
          accessibilityLabel="Bàn giao đơn phát hàng"
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
            <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.submitButtonText}>
            Bàn giao {items.length > 0 ? `${items.length} ` : ''}đơn
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  centerTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  centerText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
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
    ...StyleSheet.absoluteFillObject,
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
  fieldLabel: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
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
  infoText: {
    ...theme.typography.caption.md,
    color: theme.colors.info,
    marginBottom: theme.spacing.sm,
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
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  emptyText: {
    ...theme.typography.body.sm,
    color: theme.colors.textMuted,
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
  shipmentCode: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textPrimary,
  },
  scannedAt: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
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
