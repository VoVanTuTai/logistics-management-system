import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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

import { submitPickupScanAction } from '../../features/scan/pickup.api';
import { enqueuePickupScanOffline } from '../../features/scan/pickup.offline';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import type { PickupScanCommand } from '../../features/scan/pickup.types';
import { shipmentApi } from '../../features/shipment/shipment.api';
import type { AppNavigatorParamList } from '../../navigation/types';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'PickupScan'>;

interface PickedShipmentItem {
  code: string;
  verifiedAt: string;
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
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

  const [pickedShipments, setPickedShipments] = React.useState<PickedShipmentItem[]>([]);
  const [isVerifyingScan, setIsVerifyingScan] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
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
        await shipmentApi.getShipmentDetail(accessToken, shipmentCode);

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

        setInfoMessage(`Da xac nhan ton tai va them ${shipmentCode} vao danh sach.`);
      } catch (error) {
        setErrorMessage(
          `Khong tim thay hoac khong xac minh duoc ma ${shipmentCode}: ${toErrorMessage(error)}`,
        );
      } finally {
        setIsVerifyingScan(false);
      }
    },
    [accessToken, pickedShipments, setGlobalError],
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

  const clearList = () => {
    setPickedShipments([]);
    setErrorMessage(null);
    setInfoMessage('Da xoa danh sach ma van don da quet.');
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
        locationCode: null,
        note: 'PICKUP_CONFIRMED_FROM_SCAN_PAGE',
        actor: session?.user.username ?? null,
        occurredAt: new Date().toISOString(),
        idempotencyKey: createIdempotencyKey('pickup-scan-batch'),
      };

      try {
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
      setInfoMessage(
        `Da cap nhat nhan kien ${successCodes.length} ma` +
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

    setErrorMessage(
      `Co ${failedCodes.length} ma tai len that bai: ${failedCodes
        .map((item) => `${item.code} (${item.reason})`)
        .join(', ')}`,
    );

    setInfoMessage(
      `Da cap nhat nhan kien ${successCodes.length} ma` +
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
        <Text style={styles.cameraTitle}>Quet nhan kien</Text>
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
          Camera tu mo. Quet ma van don, he thong se kiem tra ton tai roi tu them vao danh sach.
        </Text>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Danh sach van don ({pickedShipments.length})</Text>
          <Pressable onPress={clearList} disabled={pickedShipments.length === 0}>
            <Text style={styles.clearText}>Lam moi</Text>
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
              <Text style={styles.emptyText}>Chua co ma van don nao duoc quet.</Text>
            </View>
          ) : (
            pickedShipments.map((item, index) => (
              <View key={`${item.code}-${item.verifiedAt}`} style={styles.listItem}>
                <View style={styles.listIndex}>
                  <Text style={styles.listIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listCode}>{item.code}</Text>
                  <Text style={styles.listTime}>Quet luc {formatScannedAt(item.verifiedAt)}</Text>
                </View>
                <Text style={styles.verifiedBadge}>Da xac minh</Text>
              </View>
            ))
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
            <Text style={styles.uploadButtonText}>Tai len va cap nhat trang thai nhan kien</Text>
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
  listSection: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    ...theme.shadow.sm,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
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
