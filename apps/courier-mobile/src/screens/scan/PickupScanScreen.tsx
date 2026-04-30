import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';

import { submitPickupScanAction } from '../../features/scan/pickup.api';
import { enqueuePickupScanOffline } from '../../features/scan/pickup.offline';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import type { PickupScanCommand } from '../../features/scan/pickup.types';
import { scanApi } from '../../features/scan/scan.api';
import type { CurrentLocationDto } from '../../features/scan/scan.types';
import { shipmentApi } from '../../features/shipment/shipment.api';
import type { ShipmentDto, ShipmentMetadata } from '../../features/shipment/shipment.types';
import { tasksApi } from '../../features/tasks/tasks.api';
import type { TaskDto } from '../../features/tasks/tasks.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { ApiClientError, shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { resolveCourierId } from '../../utils/courier';
import { appEnv } from '../../utils/env';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'PickupScan'>;

interface PickedShipmentItem {
  code: string;
  verifiedAt: string;
}

const RECEIVED_OR_LATER_STATUSES = new Set([
  'PICKUP_COMPLETED',
  'MANIFEST_SEALED',
  'MANIFEST_RECEIVED',
  'SCAN_INBOUND',
  'SCAN_OUTBOUND',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
]);

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeOptionalCode(value: string | null | undefined): string | null {
  const normalized = normalizeCode(value ?? '');
  return normalized.length > 0 ? normalized : null;
}

function readMetadataPath(
  metadata: ShipmentMetadata | null,
  path: string,
): unknown {
  if (!metadata) {
    return null;
  }

  const keys = path.split('.');
  let current: unknown = metadata;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
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

function readProcessingHubCode(metadata: ShipmentMetadata | null): string | null {
  return normalizeOptionalCode(
    readMetadataString(metadata, [
      'sender.hubCode',
      'routing.originHubCode',
      'originHubCode',
      'senderHubCode',
      'pickup.hubCode',
      'pickup.originHubCode',
      'location.hubCode',
      'hub.code',
    ]),
  );
}

function isHomePickupShipment(metadata: ShipmentMetadata | null): boolean {
  const classification = normalizeOptionalCode(
    readMetadataString(metadata, [
      'pickup.classification',
      'classification',
      'pickup.type',
      'pickupType',
    ]),
  );
  const source = normalizeOptionalCode(readMetadataString(metadata, ['source']));
  const pickupCode = readMetadataString(metadata, ['pickup.pickupCode', 'pickupCode']);

  return (
    classification === 'HOME_PICKUP' ||
    classification === 'PICKUP_AT_HOME' ||
    classification === 'LAY_HANG_TAI_NHA' ||
    source === 'MERCHANT-WEB' ||
    Boolean(pickupCode)
  );
}

function hasAssignedPickupTask(tasks: TaskDto[], shipmentCode: string): boolean {
  const normalizedShipmentCode = normalizeCode(shipmentCode);

  return tasks.some(
    (task) =>
      task.taskType === 'PICKUP' &&
      task.status === 'ASSIGNED' &&
      task.shipmentCode &&
      normalizeCode(task.shipmentCode) === normalizedShipmentCode,
  );
}

function validateShipmentForReceive(
  shipment: ShipmentDto,
  input: {
    assignedHubCodes: string[];
    assignedPickupTasks: TaskDto[];
    currentLocation: CurrentLocationDto | null;
  },
): string | null {
  const shipmentCode = normalizeCode(shipment.code);
  const status = normalizeCode(shipment.currentStatus);

  if (status === 'CANCELLED') {
    return `Đơn ${shipmentCode} đã bị hủy trước khi nhận hàng.`;
  }

  if (input.currentLocation?.lastScanType || RECEIVED_OR_LATER_STATUSES.has(status)) {
    return `Đơn ${shipmentCode} đã có trạng thái đã nhận hàng (${shipment.currentStatus}).`;
  }

  const processingHubCode = readProcessingHubCode(shipment.metadata);
  if (
    processingHubCode &&
    input.assignedHubCodes.length > 0 &&
    !input.assignedHubCodes.includes(processingHubCode)
  ) {
    return `Đơn ${shipmentCode} thuộc hub xử lý ${processingHubCode}, không thuộc hub của tài khoản này.`;
  }

  if (
    isHomePickupShipment(shipment.metadata) &&
    !hasAssignedPickupTask(input.assignedPickupTasks, shipmentCode)
  ) {
    return `Đơn ${shipmentCode} là đơn lấy hàng tại nhà. Vui lòng xử lý trong mục Đợi lấy khi đã được phân công.`;
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

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Co loi xay ra.';
}

export function PickupScanScreen({ route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const [permission, requestPermission] = useCameraPermissions();

  const accessToken = session?.tokens.accessToken ?? null;
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const assignedHubCodes = React.useMemo(
    () => (session?.user.hubCodes ?? []).map((hubCode) => normalizeCode(hubCode)),
    [session?.user.hubCodes],
  );

  const [pickedShipments, setPickedShipments] = React.useState<PickedShipmentItem[]>([]);
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [isVerifyingScan, setIsVerifyingScan] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [scanLocked, setScanLocked] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);

  const scanCooldownRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRouteCodeHandledRef = React.useRef(false);
  const selectedCount = selectedCodes.size;

  React.useEffect(() => {
    return () => {
      if (scanCooldownRef.current) {
        clearTimeout(scanCooldownRef.current);
      }
    };
  }, []);

  const lockScanner = React.useCallback(() => {
    setScanLocked(true);

    if (scanCooldownRef.current) {
      clearTimeout(scanCooldownRef.current);
    }

    scanCooldownRef.current = setTimeout(() => {
      setScanLocked(false);
    }, 850);
  }, []);

  const verifyAndAppendShipmentCode = React.useCallback(
    async (rawCode: string) => {
      const shipmentCode = normalizeCode(rawCode);

      if (!shipmentCode) {
        setErrorMessage('Ma van don khong hop le.');
        return;
      }

      if (!accessToken) {
        setGlobalError('Phien dang nhap da het han. Vui long dang nhap lai.');
        return;
      }

      const hasAlreadyScanned = pickedShipments.some(
        (item) => normalizeCode(item.code) === shipmentCode,
      );
      if (hasAlreadyScanned) {
        setInfoMessage(`Ma van don ${shipmentCode} da ton tai trong danh sach.`);
        return;
      }

      setIsVerifyingScan(true);
      setErrorMessage(null);

      try {
        const shipment = await shipmentApi.getShipmentDetail(accessToken, shipmentCode);
        const currentLocation = await getCurrentLocationOrNull(accessToken, shipmentCode);
        const shouldValidatePickupAssignment = isHomePickupShipment(shipment.metadata);
        const assignedPickupTasks = shouldValidatePickupAssignment
          ? await tasksApi.listAssignedTasks(accessToken, courierId)
          : [];
        const validationError = validateShipmentForReceive(shipment, {
          assignedHubCodes,
          assignedPickupTasks,
          currentLocation,
        });

        if (validationError) {
          setErrorMessage(validationError);
          setInfoMessage(null);
          return;
        }

        setPickedShipments((currentItems) => {
          if (
            currentItems.some(
              (item) => normalizeCode(item.code) === shipmentCode,
            )
          ) {
            return currentItems;
          }

          return [
            {
              code: shipmentCode,
              verifiedAt: new Date().toISOString(),
            },
            ...currentItems,
          ];
        });

        setInfoMessage(`Đã xác nhận và thêm ${shipmentCode} vào danh sách nhận hàng.`);
      } catch (error) {
        setErrorMessage(
          `Khong tim thay hoac khong xac minh duoc ma ${shipmentCode}: ${toErrorMessage(error)}`,
        );
      } finally {
        setIsVerifyingScan(false);
      }
    },
    [accessToken, assignedHubCodes, courierId, pickedShipments, setGlobalError],
  );

  React.useEffect(() => {
    if (initialRouteCodeHandledRef.current) {
      return;
    }

    initialRouteCodeHandledRef.current = true;

    if (route.params?.shipmentCode) {
      void verifyAndAppendShipmentCode(route.params.shipmentCode);
    }
  }, [route.params?.shipmentCode, verifyAndAppendShipmentCode]);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked || isVerifyingScan || isUploading) {
      return;
    }

    lockScanner();

    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

    if (!parsed) {
      setErrorMessage('Khong doc duoc ma hop le. Vui long thu lai.');
      return;
    }

    void verifyAndAppendShipmentCode(parsed.value);
  };

  const toggleSelected = (shipmentCode: string) => {
    const normalizedCode = normalizeCode(shipmentCode);
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (next.has(normalizedCode)) {
        next.delete(normalizedCode);
      } else {
        next.add(normalizedCode);
      }
      return next;
    });
  };

  const deleteSelectedShipments = () => {
    if (selectedCodes.size === 0) {
      return;
    }

    setPickedShipments((currentItems) =>
      currentItems.filter((item) => !selectedCodes.has(normalizeCode(item.code))),
    );
    setErrorMessage(null);
    setInfoMessage(`Đã xoá ${selectedCodes.size} mã vận đơn khỏi danh sách.`);
    setSelectedCodes(new Set());
  };

  const uploadAll = async () => {
    if (!accessToken) {
      setGlobalError('Phien dang nhap da het han. Vui long dang nhap lai.');
      return;
    }

    if (pickedShipments.length === 0) {
      setErrorMessage('Chua co ma van don de tai len.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const successCodes: string[] = [];
    const queuedCodes: string[] = [];
    const failedCodes: Array<{ code: string; reason: string }> = [];

    for (const item of pickedShipments) {
      const command: PickupScanCommand = {
        shipmentCode: item.code,
        locationCode: assignedHubCodes[0] ?? null,
        note: 'RECEIVE_GOODS_FROM_SCAN_PAGE',
        actor: session?.user.username ?? null,
        occurredAt: new Date().toISOString(),
        idempotencyKey: createIdempotencyKey('pickup-scan-batch'),
      };

      try {
        const shipment = await shipmentApi.getShipmentDetail(accessToken, item.code);
        const currentLocation = await getCurrentLocationOrNull(accessToken, item.code);
        const shouldValidatePickupAssignment = isHomePickupShipment(shipment.metadata);
        const assignedPickupTasks = shouldValidatePickupAssignment
          ? await tasksApi.listAssignedTasks(accessToken, courierId)
          : [];
        const validationError = validateShipmentForReceive(shipment, {
          assignedHubCodes,
          assignedPickupTasks,
          currentLocation,
        });

        if (validationError) {
          failedCodes.push({
            code: item.code,
            reason: validationError,
          });
          continue;
        }

        await submitPickupScanAction(accessToken, command);
        successCodes.push(item.code);
      } catch (error) {
        if (shouldQueueOffline(error)) {
          await enqueuePickupScanOffline(command);
          queuedCodes.push(item.code);
          continue;
        }

        failedCodes.push({
          code: item.code,
          reason: toErrorMessage(error),
        });
      }
    }

    if (failedCodes.length === 0) {
      setPickedShipments([]);
      setSelectedCodes(new Set());
      setInfoMessage(
        `Đã cập nhật nhận hàng ${successCodes.length} mã` +
          (queuedCodes.length > 0
            ? `, ${queuedCodes.length} ma duoc queue offline.`
            : '.'),
      );
      setIsUploading(false);
      return;
    }

    const failedCodeSet = new Set(failedCodes.map((item) => item.code));
    setPickedShipments((currentItems) =>
      currentItems.filter((item) => failedCodeSet.has(item.code)),
    );
    setSelectedCodes((currentCodes) => {
      const next = new Set<string>();
      currentCodes.forEach((code) => {
        if (failedCodeSet.has(code)) {
          next.add(code);
        }
      });
      return next;
    });

    setErrorMessage(
      `Co ${failedCodes.length} ma tai len that bai: ${failedCodes
        .map((item) => `${item.code} (${item.reason})`)
        .join(', ')}`,
    );

    setInfoMessage(
      `Đã cập nhật nhận hàng ${successCodes.length} mã` +
        (queuedCodes.length > 0
          ? `, ${queuedCodes.length} ma duoc queue offline.`
          : '.'),
    );

    setIsUploading(false);
  };

  const cameraIsReady = permission?.granted === true;

  return (
    <View style={styles.container}>
      <View style={styles.cameraSection}>
        <View style={styles.cameraFrame}>
          {!permission ? (
            <View style={styles.cameraPlaceholder}>
              <ActivityIndicator size="small" color="#E2E8F0" />
              <Text style={styles.cameraPlaceholderText}>Dang kiem tra quyen camera...</Text>
            </View>
          ) : null}

          {permission && !cameraIsReady ? (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderText}>
                Can cap quyen camera de quet ma van don.
              </Text>
              {permission.canAskAgain ? (
                <Pressable onPress={requestPermission} style={styles.permissionButton}>
                  <Text style={styles.permissionButtonText}>Cap quyen camera</Text>
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

          {isVerifyingScan || isUploading ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>
                {isUploading ? 'Dang tai len...' : 'Dang xac minh ma...'}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cameraHint}>
          Camera tự mở. Quét mã vận đơn, hệ thống sẽ kiểm tra điều kiện rồi tự thêm vào danh sách.
        </Text>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.screenTitle}>Nhận hàng</Text>
          <Pressable
            disabled={selectedCount === 0}
            onPress={deleteSelectedShipments}
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

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {pickedShipments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có mã vận đơn nào được quét.</Text>
            </View>
          ) : (
            pickedShipments.map((item, index) => {
              const selected = selectedCodes.has(normalizeCode(item.code));

              return (
                <Pressable
                  key={`${item.code}-${item.verifiedAt}`}
                  onPress={() => toggleSelected(item.code)}
                  style={[styles.listItem, selected && styles.listItemSelected]}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <View style={styles.listIndex}>
                    <Text style={styles.listIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.listBody}>
                    <Text style={styles.listCode}>{item.code}</Text>
                    <Text style={styles.listTime}>
                      Quét lúc {formatScannedAt(item.verifiedAt)}
                    </Text>
                  </View>
                  <Text style={styles.verifiedBadge}>Đã xác minh</Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <Pressable
          disabled={isUploading || isVerifyingScan || pickedShipments.length === 0}
          onPress={() => {
            void uploadAll();
          }}
          style={[
            styles.uploadButton,
            (isUploading || isVerifyingScan || pickedShipments.length === 0) &&
              styles.uploadButtonDisabled,
          ]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Tải lên và cập nhật trạng thái nhận hàng</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    gap: 10,
  },
  cameraSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    ...theme.shadow.sm,
  },
  cameraFrame: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraOverlayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  cameraPlaceholderText: {
    color: '#E2E8F0',
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  permissionButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  cameraHint: {
    marginTop: 8,
    color: '#475569',
    fontSize: 12,
  },
  listSection: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    ...theme.shadow.sm,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  deleteButton: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButtonDisabled: {
    opacity: 0.42,
  },
  deleteButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 8,
    color: '#B91C1C',
    fontSize: 13,
  },
  infoText: {
    marginTop: 8,
    color: '#0F766E',
    fontSize: 13,
  },
  listScroll: {
    flex: 1,
    marginTop: 10,
  },
  listContent: {
    gap: 8,
    paddingBottom: 12,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emptyText: {
    color: '#64748B',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  listItemSelected: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  listIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listIndexText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
  listBody: {
    flex: 1,
  },
  listCode: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  listTime: {
    color: '#64748B',
    marginTop: 2,
    fontSize: 12,
  },
  verifiedBadge: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadButton: {
    minHeight: 48,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.45,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});
