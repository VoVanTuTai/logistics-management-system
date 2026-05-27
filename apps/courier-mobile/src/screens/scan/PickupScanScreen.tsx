import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';

import { submitPickupScanAction } from '../../features/scan/pickup.api';
import { enqueuePickupScanOffline } from '../../features/scan/pickup.offline';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import type { PickupScanCommand } from '../../features/scan/pickup.types';
import { useAuthStore } from '../../features/auth/auth.store';
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
import { buildPickupReceiveAuditNote, resolveCourierId } from '../../utils/courier';
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
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.';
}

export function PickupScanScreen({ route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const getValidAccessToken = useAuthStore((state) => state.getValidAccessToken);
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const proofCameraRef = React.useRef<CameraView | null>(null);

  const accessToken = session?.tokens.accessToken ?? null;
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const assignedHubCodes = React.useMemo(
    () => (session?.user.hubCodes ?? []).map((hubCode) => normalizeCode(hubCode)),
    [session?.user.hubCodes],
  );
  const receiveHubCode = assignedHubCodes[0] ?? null;
  const routeShipmentCode = normalizeOptionalCode(route.params?.shipmentCode);
  const isTaskReceiveMode = Boolean(route.params?.taskId && routeShipmentCode);

  const [pickedShipments, setPickedShipments] = React.useState<PickedShipmentItem[]>([]);
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [isVerifyingScan, setIsVerifyingScan] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isCapturingProof, setIsCapturingProof] = React.useState(false);
  const [proofPhotoUri, setProofPhotoUri] = React.useState<string | null>(null);
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
        setErrorMessage('Mã vận đơn không hợp lệ.');
        return;
      }

      if (!accessToken) {
        setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      const hasAlreadyScanned = pickedShipments.some(
        (item) => normalizeCode(item.code) === shipmentCode,
      );
      if (hasAlreadyScanned) {
        setInfoMessage(`Mã vận đơn ${shipmentCode} đã tồn tại trong danh sách.`);
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
          `Không tìm thấy hoặc không xác minh được mã ${shipmentCode}: ${toErrorMessage(error)}`,
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

    if (routeShipmentCode && isTaskReceiveMode) {
      setPickedShipments([
        {
          code: routeShipmentCode,
          verifiedAt: new Date().toISOString(),
        },
      ]);
      setInfoMessage(
        `Đã lấy mã ${routeShipmentCode} từ nhiệm vụ Đợi lấy. Không cần quét lại, bấm xác nhận để nhận hàng.`,
      );
      return;
    }

    if (routeShipmentCode) {
      void verifyAndAppendShipmentCode(routeShipmentCode);
    }
  }, [isTaskReceiveMode, routeShipmentCode, verifyAndAppendShipmentCode]);

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
      setErrorMessage('Không đọc được mã hợp lệ. Vui lòng thử lại.');
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

  const capturePickupProof = React.useCallback(async () => {
    if (!isTaskReceiveMode) {
      return;
    }

    if (!proofCameraRef.current) {
      setErrorMessage('Camera chưa sẵn sàng để chụp minh chứng.');
      return;
    }

    setIsCapturingProof(true);
    setErrorMessage(null);

    try {
      const picture = await proofCameraRef.current.takePictureAsync({
        quality: 0.6,
      });

      if (!picture.uri) {
        throw new Error('Không chụp được minh chứng.');
      }

      setProofPhotoUri(picture.uri);
      setInfoMessage('Đã chụp minh chứng nhận hàng.');
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsCapturingProof(false);
    }
  }, [isTaskReceiveMode]);

  const uploadAll = async () => {
    if (!session) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (pickedShipments.length === 0) {
      setErrorMessage('Chưa có mã vận đơn để tải lên.');
      return;
    }

    if (isTaskReceiveMode && !proofPhotoUri) {
      setErrorMessage('Vui lòng chụp minh chứng trước khi xác nhận nhận hàng.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const successCodes: string[] = [];
    const queuedCodes: string[] = [];
    const failedCodes: Array<{ code: string; reason: string }> = [];
    let routeTaskCompleted = false;
    let routeTaskCompleteFailed = false;
    let currentAccessToken: string;

    try {
      currentAccessToken = await getValidAccessToken();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setIsUploading(false);
      return;
    }

    for (const item of pickedShipments) {
      const baseNote = buildPickupReceiveAuditNote({
        displayName: session?.user.displayName,
        username: session?.user.username,
        courierId,
        hubCode: receiveHubCode,
      });
      const command: PickupScanCommand = {
        shipmentCode: item.code,
        locationCode: receiveHubCode,
        note:
          isTaskReceiveMode && proofPhotoUri
            ? `${baseNote} | Minh chứng: ${proofPhotoUri}`
            : baseNote,
        actor: (courierId || session?.user.username) ?? null,
        occurredAt: new Date().toISOString(),
        idempotencyKey: createIdempotencyKey('pickup-scan-batch'),
      };

      try {
        const shipment = await shipmentApi.getShipmentDetail(currentAccessToken, item.code);
        const currentLocation = await getCurrentLocationOrNull(currentAccessToken, item.code);
        const shouldValidatePickupAssignment = isHomePickupShipment(shipment.metadata);
        const assignedPickupTasks = shouldValidatePickupAssignment
          ? await tasksApi.listAssignedTasks(currentAccessToken, courierId)
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

        await submitPickupScanAction(currentAccessToken, command);
        successCodes.push(item.code);

        const shouldCompleteRouteTask =
          route.params?.taskId &&
          (!routeShipmentCode || normalizeCode(item.code) === routeShipmentCode);

        if (shouldCompleteRouteTask && !routeTaskCompleted) {
          try {
            await tasksApi.updateTaskStatus(currentAccessToken, route.params.taskId, 'COMPLETED');
            routeTaskCompleted = true;
          } catch {
            routeTaskCompleteFailed = true;
          }
        }
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
      setProofPhotoUri(null);
      setSelectedCodes(new Set());
      setInfoMessage(
        `Đã cập nhật nhận hàng ${successCodes.length} mã` +
          (queuedCodes.length > 0
            ? `, ${queuedCodes.length} mã được lưu offline.`
            : '.') +
          (routeTaskCompleted
            ? ' Task Đợi lấy đã chuyển hoàn tất.'
            : routeTaskCompleteFailed
              ? ' Chưa cập nhật được trạng thái task, vui lòng tải lại và thử lại.'
              : ''),
      );
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (route.params?.taskId) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', 'detail', route.params.taskId],
        });
      }
      successCodes.forEach((shipmentCode) => {
        void queryClient.invalidateQueries({
          queryKey: ['shipment', 'detail', shipmentCode],
        });
      });
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
      `Có ${failedCodes.length} mã tải lên thất bại: ${failedCodes
        .map((item) => `${item.code} (${item.reason})`)
        .join(', ')}`,
    );

    setInfoMessage(
      `Đã cập nhật nhận hàng ${successCodes.length} mã` +
        (queuedCodes.length > 0
          ? `, ${queuedCodes.length} mã được lưu offline.`
          : '.') +
        (routeTaskCompleted
          ? ' Task Đợi lấy đã chuyển hoàn tất.'
          : routeTaskCompleteFailed
            ? ' Chưa cập nhật được trạng thái task, vui lòng tải lại và thử lại.'
            : ''),
    );
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    if (route.params?.taskId) {
      await queryClient.invalidateQueries({
        queryKey: ['tasks', 'detail', route.params.taskId],
      });
    }
    successCodes.forEach((shipmentCode) => {
      void queryClient.invalidateQueries({
        queryKey: ['shipment', 'detail', shipmentCode],
      });
    });

    setIsUploading(false);
  };

  const cameraIsReady = permission?.granted === true;

  return (
    <View style={styles.container}>
      {isTaskReceiveMode ? (
        <View style={styles.taskModePanel}>
          <View style={styles.taskReceiveSection}>
            <View style={styles.taskReceiveIcon}>
              <Ionicons name="cube-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.taskReceiveBody}>
              <Text style={styles.taskReceiveTitle}>Nhận hàng từ nhiệm vụ Đợi lấy</Text>
              <Text style={styles.taskReceiveText}>
                Mã vận đơn đã có trong nhiệm vụ nên không cần quét lại. Chụp minh chứng rồi bấm xác nhận.
              </Text>
            </View>
          </View>

          <View style={styles.proofSection}>
            <View style={styles.proofHeader}>
              <View>
                <Text style={styles.proofTitle}>Minh chứng nhận hàng</Text>
                <Text style={styles.proofHint}>Bắt buộc chụp ảnh hàng đã lấy trước khi xác nhận.</Text>
              </View>
              {proofPhotoUri ? (
                <Ionicons name="checkmark-circle" size={22} color="#0F766E" />
              ) : (
                <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
              )}
            </View>

            <View style={styles.proofCameraFrame}>
              {!permission ? (
                <View style={styles.cameraPlaceholder}>
                  <ActivityIndicator size="small" color="#E2E8F0" />
                  <Text style={styles.cameraPlaceholderText}>Đang kiểm tra quyền camera...</Text>
                </View>
              ) : null}

              {permission && !cameraIsReady ? (
                <View style={styles.cameraPlaceholder}>
                  <Text style={styles.cameraPlaceholderText}>
                    Cần cấp quyền camera để chụp minh chứng nhận hàng.
                  </Text>
                  {permission.canAskAgain ? (
                    <Pressable onPress={requestPermission} style={styles.permissionButton}>
                      <Text style={styles.permissionButtonText}>Cấp quyền camera</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {permission && cameraIsReady && !proofPhotoUri ? (
                <CameraView ref={proofCameraRef} style={styles.camera} facing="back" />
              ) : null}

              {proofPhotoUri ? (
                <Image source={{ uri: proofPhotoUri }} style={styles.proofImage} />
              ) : null}
            </View>

            <Pressable
              disabled={!cameraIsReady || isCapturingProof || isUploading}
              onPress={() => {
                void capturePickupProof();
              }}
              style={[
                styles.captureProofButton,
                (!cameraIsReady || isCapturingProof || isUploading) &&
                  styles.captureProofButtonDisabled,
              ]}
            >
              {isCapturingProof ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.captureProofButtonText}>
                    {proofPhotoUri ? 'Chụp lại minh chứng' : 'Chụp minh chứng'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.cameraSection}>
          <View style={styles.cameraFrame}>
            {!permission ? (
              <View style={styles.cameraPlaceholder}>
                <ActivityIndicator size="small" color="#E2E8F0" />
                <Text style={styles.cameraPlaceholderText}>Đang kiểm tra quyền camera...</Text>
              </View>
            ) : null}

            {permission && !cameraIsReady ? (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.cameraPlaceholderText}>
                  Cần cấp quyền camera để quét mã vận đơn.
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

            {isVerifyingScan || isUploading ? (
              <View style={styles.cameraOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.cameraOverlayText}>
                  {isUploading ? 'Đang tải lên...' : 'Đang xác minh mã...'}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cameraHint}>
            Camera tự mở. Quét mã vận đơn, hệ thống sẽ kiểm tra điều kiện rồi tự thêm vào danh sách.
          </Text>
        </View>
      )}

      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.screenTitle}>Nhận hàng</Text>
          {!isTaskReceiveMode ? (
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
          ) : null}
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
                  disabled={isTaskReceiveMode}
                  onPress={() => toggleSelected(item.code)}
                  style={[
                    styles.listItem,
                    selected && !isTaskReceiveMode && styles.listItemSelected,
                  ]}
                >
                  {!isTaskReceiveMode ? (
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>
                  ) : null}
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
          disabled={
            isUploading ||
            isVerifyingScan ||
            pickedShipments.length === 0 ||
            (isTaskReceiveMode && !proofPhotoUri)
          }
          onPress={() => {
            void uploadAll();
          }}
          style={[
            styles.uploadButton,
            (isUploading ||
              isVerifyingScan ||
              pickedShipments.length === 0 ||
              (isTaskReceiveMode && !proofPhotoUri)) &&
              styles.uploadButtonDisabled,
          ]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Xác nhận nhận hàng ({pickedShipments.length} đơn)</Text>
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
  taskModePanel: {
    gap: 10,
  },
  taskReceiveSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    ...theme.shadow.sm,
  },
  taskReceiveIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  taskReceiveBody: {
    flex: 1,
  },
  taskReceiveTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  taskReceiveText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  proofSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    ...theme.shadow.sm,
  },
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  proofTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  proofHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  proofCameraFrame: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  captureProofButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureProofButtonDisabled: {
    opacity: 0.45,
  },
  captureProofButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
