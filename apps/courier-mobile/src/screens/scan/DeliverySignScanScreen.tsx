import React from 'react';
import {
  ActivityIndicator,
  Pressable,
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

import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { shipmentApi } from '../../features/shipment/shipment.api';
import { tasksApi } from '../../features/tasks/tasks.api';
import type { TaskDto } from '../../features/tasks/tasks.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { resolveCourierId } from '../../utils/courier';
import { appEnv } from '../../utils/env';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'DeliverySignScan'>;

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.';
}

function findDeliveryTaskByShipment(
  tasks: TaskDto[],
  shipmentCode: string,
): TaskDto | null {
  const normalizedShipmentCode = normalizeCode(shipmentCode);

  return (
    tasks.find(
      (task) =>
        task.taskType === 'DELIVERY' &&
        task.shipmentCode &&
        normalizeCode(task.shipmentCode) === normalizedShipmentCode &&
        task.status !== 'COMPLETED' &&
        task.status !== 'CANCELLED',
    ) ?? null
  );
}

export function DeliverySignScanScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const [permission, requestPermission] = useCameraPermissions();

  const accessToken = session?.tokens.accessToken ?? null;
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);

  const [isVerifyingScan, setIsVerifyingScan] = React.useState(false);
  const [scanLocked, setScanLocked] = React.useState(false);
  const [isCameraCollapsed, setIsCameraCollapsed] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const scanCooldownRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRouteCodeHandledRef = React.useRef(false);

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

  const openDeliveryProof = React.useCallback(
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

      setIsVerifyingScan(true);
      setErrorMessage(null);
      setInfoMessage(`Đang xác minh ${shipmentCode}...`);

      try {
        await shipmentApi.getShipmentDetail(accessToken, shipmentCode);

        let deliveryTask: TaskDto | null = null;
        try {
          const assignedTasks = await tasksApi.listAssignedTasks(accessToken, courierId);
          deliveryTask = findDeliveryTaskByShipment(assignedTasks, shipmentCode);
        } catch {
          deliveryTask = null;
        }

        navigation.replace('DeliveryProof', {
          taskId: deliveryTask?.id,
          taskCode: deliveryTask?.taskCode,
          shipmentCode,
        });
      } catch (error) {
        setErrorMessage(
          `Không tìm thấy hoặc không xác minh được mã ${shipmentCode}: ${toErrorMessage(error)}`,
        );
        setInfoMessage(null);
      } finally {
        setIsVerifyingScan(false);
      }
    },
    [accessToken, courierId, navigation, setGlobalError],
  );

  React.useEffect(() => {
    if (initialRouteCodeHandledRef.current) {
      return;
    }

    initialRouteCodeHandledRef.current = true;

    if (route.params?.shipmentCode) {
      void openDeliveryProof(route.params.shipmentCode);
    }
  }, [openDeliveryProof, route.params?.shipmentCode]);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked || isVerifyingScan) {
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

    void openDeliveryProof(parsed.value);
  };

  const cameraIsReady = permission?.granted === true;

  return (
    <View style={styles.container}>
      {isCameraCollapsed ? (
        <Pressable
          onPress={() => setIsCameraCollapsed(false)}
          style={styles.collapsedCameraBar}
        >
          <Ionicons name="camera-outline" size={20} color="#1D4ED8" />
          <Text style={styles.collapsedCameraBarText}>Bật camera để quét ký nhận</Text>
          <Ionicons name="chevron-down" size={16} color="#64748B" style={styles.expandIcon} />
        </Pressable>
      ) : (
        <View style={styles.cameraSection}>
          <Text style={styles.cameraTitle}>Quét ký nhận</Text>
          <View style={styles.cameraFrame}>
            {permission && cameraIsReady ? (
              <Pressable
                onPress={() => setIsCameraCollapsed(true)}
                style={styles.collapseCameraButton}
              >
                <Ionicons name="eye-off-outline" size={14} color="#FFFFFF" />
                <Text style={styles.collapseButtonText}>Ẩn cam</Text>
              </Pressable>
            ) : null}

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

            {isVerifyingScan ? (
              <View style={styles.cameraOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.cameraOverlayText}>Đang xác minh mã...</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cameraHint}>
            Camera tự mở. Quét mã vận đơn, hệ thống sẽ mở thông tin đơn hàng để chụp minh chứng ký nhận.
          </Text>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Đơn hàng chờ ký nhận</Text>
        <Text style={styles.infoHint}>
          Sau khi quét thành công, màn hình thông tin đơn hàng sẽ hiển thị người nhận,
          số điện thoại, địa chỉ và khu vực chụp ảnh minh chứng.
        </Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Chưa có mã vận đơn</Text>
          <Text style={styles.emptyText}>
            Đưa barcode/QR vào khung camera để bắt đầu ký nhận.
          </Text>
        </View>
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
  cameraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cameraFrame: {
    flex: 1,
    marginTop: 8,
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
  infoSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    ...theme.shadow.sm,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoHint: {
    marginTop: 6,
    color: '#475569',
    lineHeight: 19,
    fontSize: 13,
  },
  errorText: {
    marginTop: 10,
    color: '#B91C1C',
    fontSize: 13,
  },
  infoText: {
    marginTop: 10,
    color: '#0F766E',
    fontSize: 13,
  },
  emptyState: {
    marginTop: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  emptyTitle: {
    color: '#0F172A',
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  collapsedCameraBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    ...theme.shadow.sm,
  },
  collapsedCameraBarText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 14,
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  collapseCameraButton: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    zIndex: 10,
  },
  collapseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
