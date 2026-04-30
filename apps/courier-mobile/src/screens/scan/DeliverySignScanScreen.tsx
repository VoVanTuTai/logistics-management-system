import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  return error instanceof Error ? error.message : 'Co loi xay ra.';
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
        setErrorMessage('Ma van don khong hop le.');
        return;
      }

      if (!accessToken) {
        setGlobalError('Phien dang nhap da het han. Vui long dang nhap lai.');
        return;
      }

      setIsVerifyingScan(true);
      setErrorMessage(null);
      setInfoMessage(`Dang xac minh ${shipmentCode}...`);

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
          `Khong tim thay hoac khong xac minh duoc ma ${shipmentCode}: ${toErrorMessage(error)}`,
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
      setErrorMessage('Khong doc duoc ma hop le. Vui long thu lai.');
      return;
    }

    void openDeliveryProof(parsed.value);
  };

  const cameraIsReady = permission?.granted === true;

  return (
    <View style={styles.container}>
      <View style={styles.cameraSection}>
        <Text style={styles.cameraTitle}>Quet ky nhan</Text>
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

          {isVerifyingScan ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>Dang xac minh ma...</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cameraHint}>
          Camera tu mo. Quet ma van don, he thong se mo thong tin don hang de chup minh chung ky nhan.
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Don hang cho ky nhan</Text>
        <Text style={styles.infoHint}>
          Sau khi quet thanh cong, man hinh thong tin don hang se hien thi nguoi nhan,
          so dien thoai, dia chi va khu vuc chup anh minh chung.
        </Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Chua co ma van don</Text>
          <Text style={styles.emptyText}>
            Dua barcode/QR vao khung camera de bat dau ky nhan.
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
});
