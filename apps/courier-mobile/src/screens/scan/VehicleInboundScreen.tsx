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
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';

import {
  readVehicleDepartureRecords,
  type VehicleDepartureRecord,
  type VehicleDepartureSeal,
} from '../../features/scan/vehicle-departure.storage';
import {
  saveVehicleArrivalRecord,
} from '../../features/scan/vehicle-arrival.storage';
import { manifestApi } from '../../features/manifest/manifest.api';
import {
  parseVehicleLabel,
  type VehicleLabelInfo,
} from '../../features/scan/vehicle-label';
import {
  findVehicleLoadRecord,
  markVehicleLoadArrivedAtHub,
  type VehicleLoadRecord,
} from '../../features/scan/vehicle-load.storage';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import {
  buildVehicleInboundAuditNote,
  resolveCourierDisplayName,
  resolveCourierId,
} from '../../utils/courier';
import { appEnv } from '../../utils/env';
import { createIdempotencyKey } from '../../utils/idempotency';

type VehicleInboundStep = 'VEHICLE' | 'PROOF' | 'SEAL';

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
  return error instanceof Error ? error.message : 'Không lưu được xe đến.';
}

function findLatestDeparture(
  records: VehicleDepartureRecord[],
  vehicleCode: string,
): VehicleDepartureRecord | null {
  const normalizedVehicleCode = normalizeCode(vehicleCode);
  const matchedRecords = records.filter(
    (record) => normalizeCode(record.vehicle.vehicleCode) === normalizedVehicleCode,
  );

  return (
    matchedRecords.sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0] ?? null
  );
}

function compareSealCodes(scannedCodes: string[], expectedCodes: string[]): boolean {
  if (scannedCodes.length === 0 || expectedCodes.length === 0) {
    return false;
  }

  const scannedSet = new Set(scannedCodes.map(normalizeCode));
  const expectedSet = new Set(expectedCodes.map(normalizeCode));

  return (
    scannedSet.size === expectedSet.size &&
    Array.from(expectedSet).every((code) => scannedSet.has(code))
  );
}

function toVehicleStatusLabel(status: VehicleLoadRecord['status'] | null): string {
  if (status === 'OPEN') {
    return 'Đang mở';
  }

  if (status === 'IN_TRANSIT') {
    return 'Đang luân chuyển';
  }

  if (status === 'ARRIVED_AT_HUB') {
    return 'Đã đến hub';
  }

  return 'Chưa có dữ liệu';
}

export function VehicleInboundScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView | null>(null);

  const [vehicleInfo, setVehicleInfo] = React.useState<VehicleLabelInfo | null>(null);
  const [vehicleLoadRecord, setVehicleLoadRecord] =
    React.useState<VehicleLoadRecord | null>(null);
  const [departureRecord, setDepartureRecord] =
    React.useState<VehicleDepartureRecord | null>(null);
  const [proofPhotoUri, setProofPhotoUri] = React.useState<string | null>(null);
  const [sealCodes, setSealCodes] = React.useState<VehicleDepartureSeal[]>([]);
  const [selectedSealCodes, setSelectedSealCodes] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [screenMessage, setScreenMessage] = React.useState<string | null>(null);
  const [scanLocked, setScanLocked] = React.useState(false);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const scanCooldownRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const employeeName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });
  const hubCode = session?.user.hubCodes?.[0]?.trim().toUpperCase() ?? null;
  const cameraIsReady = permission?.granted === true;
  const selectedCount = selectedSealCodes.size;
  const currentStep: VehicleInboundStep = !vehicleInfo
    ? 'VEHICLE'
    : proofPhotoUri
      ? 'SEAL'
      : 'PROOF';
  const expectedSealCodes =
    departureRecord?.sealCodes.map((item) => item.code) ?? [];
  const scannedSealCodes = sealCodes.map((item) => item.code);
  const sealMatched = compareSealCodes(scannedSealCodes, expectedSealCodes);
  const canConfirm = Boolean(vehicleInfo && proofPhotoUri && sealCodes.length > 0);

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

  const resetVehicleInbound = () => {
    setVehicleInfo(null);
    setVehicleLoadRecord(null);
    setDepartureRecord(null);
    setProofPhotoUri(null);
    setSealCodes([]);
    setSelectedSealCodes(new Set());
    setScreenMessage('Đã làm mới luồng xe đến.');
  };

  const appendSealCode = React.useCallback((rawCode: string) => {
    const normalizedCode = normalizeCode(rawCode);
    if (!normalizedCode) {
      setScreenMessage('Mã seal xe không hợp lệ.');
      return;
    }

    setSealCodes((currentCodes) => {
      const duplicated = currentCodes.some((item) => item.code === normalizedCode);
      if (duplicated) {
        setScreenMessage(`${normalizedCode} đã có trong danh sách seal xe.`);
        return currentCodes;
      }

      setScreenMessage(`Đã thêm seal xe ${normalizedCode}.`);
      return [
        {
          code: normalizedCode,
          scannedAt: new Date().toISOString(),
        },
        ...currentCodes,
      ];
    });
  }, []);

  const applyVehicleLabel = React.useCallback(async (rawValue: string) => {
    const nextVehicleInfo = parseVehicleLabel(rawValue);
    if (!nextVehicleInfo) {
      setScreenMessage('Tem xe không hợp lệ. Vui lòng quét đúng mã tem xe.');
      return;
    }

    const [nextLoadRecord, departureRecords] = await Promise.all([
      findVehicleLoadRecord(nextVehicleInfo.vehicleCode),
      readVehicleDepartureRecords(),
    ]);
    const nextDepartureRecord = findLatestDeparture(
      departureRecords,
      nextVehicleInfo.vehicleCode,
    );

    setVehicleInfo(nextVehicleInfo);
    setVehicleLoadRecord(nextLoadRecord);
    setDepartureRecord(nextDepartureRecord);

    if (!nextDepartureRecord) {
      setScreenMessage(
        `Đã nhận tem xe ${nextVehicleInfo.vehicleCode}, chưa có dữ liệu xe đi để đối chứng seal trên thiết bị này.`,
      );
      return;
    }

    setScreenMessage(
      `Đã nhận tem xe ${nextVehicleInfo.vehicleCode}. Cần đối chứng ${nextDepartureRecord.sealCodes.length} seal xe.`,
    );
  }, []);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked || isSaving || isCapturing || currentStep === 'PROOF') {
      return;
    }

    lockScanner();

    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });
    const scannedValue = parsed?.value ?? result.data;

    if (currentStep === 'VEHICLE') {
      void applyVehicleLabel(scannedValue);
      return;
    }

    appendSealCode(scannedValue);
  };

  const captureProof = React.useCallback(async () => {
    if (!vehicleInfo) {
      setScreenMessage('Vui lòng quét tem xe trước khi chụp minh chứng.');
      return;
    }

    if (!cameraRef.current) {
      setScreenMessage('Camera chưa sẵn sàng.');
      return;
    }

    setIsCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.6,
      });

      if (!picture.uri) {
        throw new Error('Không chụp được minh chứng.');
      }

      setProofPhotoUri(picture.uri);
      setScreenMessage('Đã chụp minh chứng seal xe còn nguyên. Tiếp tục quét seal xe.');
    } catch (error) {
      setScreenMessage(toErrorMessage(error));
    } finally {
      setIsCapturing(false);
    }
  }, [vehicleInfo]);

  const toggleSelectedSeal = (sealCode: string) => {
    setSelectedSealCodes((current) => {
      const next = new Set(current);
      if (next.has(sealCode)) {
        next.delete(sealCode);
      } else {
        next.add(sealCode);
      }
      return next;
    });
  };

  const deleteSelectedSeals = () => {
    if (selectedSealCodes.size === 0) {
      return;
    }

    setSealCodes((currentCodes) =>
      currentCodes.filter((item) => !selectedSealCodes.has(item.code)),
    );
    setScreenMessage(`Đã xoá ${selectedSealCodes.size} seal xe khỏi danh sách.`);
    setSelectedSealCodes(new Set());
  };

  const confirmVehicleInbound = async () => {
    if (!vehicleInfo) {
      setScreenMessage('Vui lòng quét tem xe trước khi xác nhận xe đến.');
      return;
    }

    if (!proofPhotoUri) {
      setScreenMessage('Vui lòng chụp minh chứng seal xe còn nguyên.');
      return;
    }

    if (sealCodes.length === 0) {
      setScreenMessage('Vui lòng quét ít nhất một seal xe.');
      return;
    }

    setIsSaving(true);
    setScreenMessage(null);

    try {
      const note = buildVehicleInboundAuditNote({
        displayName: session?.user.displayName,
        username: session?.user.username,
        courierId,
        hubCode,
        vehicleCode: vehicleInfo.vehicleCode,
        licensePlate: vehicleInfo.licensePlate,
        sealCodes: scannedSealCodes,
        sealMatched,
      });

      await saveVehicleArrivalRecord({
        id: createIdempotencyKey('vehicle-inbound'),
        vehicle: vehicleInfo,
        proofPhotoUri,
        scannedSealCodes: sealCodes,
        expectedSealCodes,
        sealMatched,
        note,
        employeeCode: courierId || session?.user.username || null,
        employeeName,
        hubCode,
        arrivedAt: new Date().toISOString(),
      });
      const nextLoadRecord = await markVehicleLoadArrivedAtHub(
        vehicleInfo.vehicleCode,
        hubCode,
      );

      const manifests = await manifestApi.list(session?.tokens.accessToken as string);
      const manifest = manifests.find(m => m.manifestCode === vehicleInfo.vehicleCode);
      if (manifest) {
        await manifestApi.receive(session?.tokens.accessToken as string, manifest.id, {
          receivedBy: courierId,
          receivedByName: employeeName,
          processingHubCode: hubCode,
          note: `Xe đến: ${vehicleInfo.vehicleCode} | Biển số: ${vehicleInfo.licensePlate} | Khớp seal: ${sealMatched}`,
        });
      }

      setVehicleLoadRecord(nextLoadRecord ?? vehicleLoadRecord);
      setScreenMessage(
        `Đã xác nhận xe đến ${vehicleInfo.vehicleCode}. Tem xe chuyển sang Đã đến hub.` +
          (sealMatched ? ' Seal khớp.' : ' Seal cần kiểm tra.'),
      );
      setVehicleInfo(null);
      setVehicleLoadRecord(null);
      setDepartureRecord(null);
      setProofPhotoUri(null);
      setSealCodes([]);
      setSelectedSealCodes(new Set());
    } catch (error) {
      const message = toErrorMessage(error);
      setScreenMessage(message);
      setGlobalError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const cameraHint =
    currentStep === 'VEHICLE'
      ? 'Quét mã tem xe khi xe đến hub.'
      : currentStep === 'PROOF'
        ? 'Chụp minh chứng seal xe còn nguyên trước khi quét seal.'
        : 'Quét seal xe, mỗi mã hợp lệ sẽ tự động thêm vào danh sách.';

  return (
    <View style={styles.container}>
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
                Cần cấp quyền camera để quét tem xe, chụp minh chứng và quét seal xe.
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
              ref={cameraRef}
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
              onBarcodeScanned={
                currentStep === 'PROOF' ? undefined : handleBarCodeScanned
              }
            />
          ) : null}

          {proofPhotoUri && currentStep === 'SEAL' ? (
            <Image source={{ uri: proofPhotoUri }} style={styles.proofThumb} />
          ) : null}

          {currentStep === 'PROOF' && cameraIsReady ? (
            <View style={styles.captureBar}>
              <Pressable
                disabled={isCapturing}
                onPress={() => {
                  void captureProof();
                }}
                style={[styles.captureButton, isCapturing && styles.buttonDisabled]}
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.captureButtonText}>Chụp minh chứng</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}

          {isSaving ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>Đang xác nhận xe đến...</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cameraHint}>{cameraHint}</Text>
      </View>

      <View style={styles.workSection}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Xe đến</Text>
          <Pressable onPress={resetVehicleInbound}>
            <Text style={styles.resetText}>Làm mới</Text>
          </Pressable>
        </View>

        <View style={[styles.vehicleCard, vehicleInfo && styles.vehicleCardReady]}>
          <Text style={styles.vehicleTitle}>Tem xe</Text>
          {vehicleInfo ? (
            <>
              <View style={styles.vehicleGrid}>
                <View style={styles.vehicleInfoCell}>
                  <Text style={styles.infoLabel}>Mã tem xe</Text>
                  <Text style={styles.infoValue}>{vehicleInfo.vehicleCode}</Text>
                </View>
                <View style={styles.vehicleInfoCell}>
                  <Text style={styles.infoLabel}>Hub đi</Text>
                  <Text style={styles.infoValue}>{vehicleInfo.originHubCode}</Text>
                </View>
                <View style={styles.vehicleInfoCell}>
                  <Text style={styles.infoLabel}>Hub đến</Text>
                  <Text style={styles.infoValue}>{vehicleInfo.destinationHubCode}</Text>
                </View>
                <View style={styles.vehicleInfoCell}>
                  <Text style={styles.infoLabel}>Biển số</Text>
                  <Text style={styles.infoValue}>{vehicleInfo.licensePlate}</Text>
                </View>
              </View>
              <Text style={styles.loadSummaryText}>
                Trạng thái tem xe: {toVehicleStatusLabel(vehicleLoadRecord?.status ?? null)}
                {' | '}
                Hub thao tác: {hubCode ?? 'N/A'}
                {' | '}
                Seal dự kiến: {expectedSealCodes.length}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyGuide}>Chưa có tem xe. Hãy quét mã tem xe bằng camera.</Text>
          )}
        </View>

        <View style={[styles.proofCard, proofPhotoUri && styles.proofCardReady]}>
          <View style={styles.proofHeader}>
            <Text style={styles.vehicleTitle}>Minh chứng</Text>
            {proofPhotoUri ? (
              <Pressable onPress={() => setProofPhotoUri(null)}>
                <Text style={styles.resetText}>Chụp lại</Text>
              </Pressable>
            ) : null}
          </View>
          {proofPhotoUri ? (
            <Text style={styles.proofReadyText}>Đã chụp minh chứng seal xe còn nguyên.</Text>
          ) : (
            <Text style={styles.emptyGuide}>Sau khi quét tem xe, bấm chụp minh chứng trên khung camera.</Text>
          )}
        </View>

        {screenMessage ? <Text style={styles.messageText}>{screenMessage}</Text> : null}

        <View style={styles.sealCompareRow}>
          <Text style={[styles.sealCompareText, sealMatched && styles.sealCompareMatched]}>
            {expectedSealCodes.length === 0
              ? 'Chưa có dữ liệu seal xuất bến để đối chứng.'
              : sealMatched
                ? 'Seal khớp với lúc xe đi.'
                : 'Seal chưa khớp hoặc còn thiếu.'}
          </Text>
        </View>

        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Danh sách seal xe ({sealCodes.length})</Text>
          <Pressable
            disabled={selectedCount === 0}
            onPress={deleteSelectedSeals}
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

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {sealCodes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có mã seal xe nào.</Text>
            </View>
          ) : (
            sealCodes.map((item, index) => {
              const selected = selectedSealCodes.has(item.code);
              const expected = expectedSealCodes
                .map(normalizeCode)
                .includes(normalizeCode(item.code));

              return (
                <Pressable
                  key={`${item.code}-${item.scannedAt}`}
                  onPress={() => toggleSelectedSeal(item.code)}
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
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemCodeText}>{item.code}</Text>
                      <Text
                        style={[
                          styles.itemTypeBadge,
                          expected ? styles.expectedBadge : styles.warningBadge,
                        ]}
                      >
                        {expected ? 'Khớp' : 'Cần kiểm tra'}
                      </Text>
                    </View>
                    <Text style={styles.itemTimeText}>
                      Quét lúc {formatScannedAt(item.scannedAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Pressable
          disabled={isSaving || !canConfirm}
          onPress={() => {
            void confirmVehicleInbound();
          }}
          style={[
            styles.uploadButton,
            (isSaving || !canConfirm) && styles.uploadButtonDisabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Xác nhận xe đến</Text>
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
  proofThumb: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 72,
    height: 96,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  captureBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    alignItems: 'center',
  },
  captureButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cameraHint: {
    marginTop: 8,
    color: '#475569',
    fontSize: 12,
  },
  workSection: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    paddingBottom: 78,
    ...theme.shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  resetText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 12,
  },
  vehicleCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    gap: 8,
  },
  vehicleCardReady: {
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  vehicleTitle: {
    color: '#0F172A',
    fontWeight: '800',
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleInfoCell: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 2,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    color: '#0F172A',
    fontWeight: '800',
  },
  emptyGuide: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  loadSummaryText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  proofCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    gap: 6,
  },
  proofCardReady: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  proofReadyText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '700',
  },
  messageText: {
    marginTop: 10,
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  sealCompareRow: {
    marginTop: 10,
  },
  sealCompareText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },
  sealCompareMatched: {
    color: '#047857',
  },
  listHeaderRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  listTitle: {
    fontSize: 16,
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
  listScroll: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    gap: 8,
    paddingBottom: 10,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    minHeight: 88,
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
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemCodeText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  itemTypeBadge: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '800',
  },
  expectedBadge: {
    color: '#065F46',
    backgroundColor: '#D1FAE5',
  },
  warningBadge: {
    color: '#92400E',
    backgroundColor: '#FEF3C7',
  },
  itemTimeText: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...theme.shadow.md,
  },
  uploadButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.45,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
