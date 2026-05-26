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
import { Ionicons } from '@expo/vector-icons';
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';

import { manifestApi } from '../../features/manifest/manifest.api';
import type { BagManifestDto } from '../../features/manifest/manifest.types';
import { submitHubScanAction } from '../../features/scan/hub.api';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import {
  parseVehicleLabel,
  type VehicleLabelInfo,
} from '../../features/scan/vehicle-label';
import {
  upsertVehicleLoadRecord,
  type VehicleLoadedBag,
  type VehicleLoadedLooseShipment,
} from '../../features/scan/vehicle-load.storage';
import { ApiClientError } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { resolveCourierDisplayName } from '../../utils/courier';
import { createIdempotencyKey } from '../../utils/idempotency';

type SendItemType = 'BAG' | 'SHIPMENT';

interface SendGoodsItem {
  type: SendItemType;
  code: string;
  scannedAt: string;
}

const BAG_CODE_REGEX = /^MB\d{10}$/;

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function isBagCode(value: string): boolean {
  return BAG_CODE_REGEX.test(normalizeCode(value));
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

function resolveBagManifest(
  manifests: BagManifestDto[],
  bagCode: string,
): BagManifestDto | null {
  const normalizedBagCode = normalizeCode(bagCode);

  return (
    manifests.find(
      (manifest) => normalizeCode(manifest.manifestCode) === normalizedBagCode,
    ) ?? null
  );
}

function buildSyncedVehicleInfo(
  scannedVehicleInfo: VehicleLabelInfo,
  manifest: BagManifestDto,
): VehicleLabelInfo {
  return {
    ...scannedVehicleInfo,
    vehicleCode: normalizeCode(manifest.manifestCode || scannedVehicleInfo.vehicleCode),
    originHubCode:
      manifest.originHubCode?.trim().toUpperCase() ||
      scannedVehicleInfo.originHubCode ||
      'UNKNOWN',
    destinationHubCode:
      manifest.destinationHubCode?.trim().toUpperCase() ||
      scannedVehicleInfo.destinationHubCode ||
      'UNKNOWN',
  };
}

function appendNoteSegment(segments: string[], key: string, value: string | null | undefined) {
  const normalizedValue = value?.trim();
  if (normalizedValue) {
    segments.push(`${key}=${normalizedValue}`);
  }
}

export function SendGoodsScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const [permission, requestPermission] = useCameraPermissions();

  const [vehicleInfo, setVehicleInfo] = React.useState<VehicleLabelInfo | null>(null);
  const [manualVehicleInput, setManualVehicleInput] = React.useState('');
  const [manualCodeInput, setManualCodeInput] = React.useState('');
  const [items, setItems] = React.useState<SendGoodsItem[]>([]);
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [screenMessage, setScreenMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scanLocked, setScanLocked] = React.useState(false);
  const scanCooldownRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const accessToken = session?.tokens.accessToken ?? null;
  const employeeCode = session?.user.username ?? session?.user.id ?? null;
  const employeeName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId: session?.user.id,
  });
  const employeeHubCode = session?.user.hubCodes?.[0] ?? vehicleInfo?.originHubCode ?? null;
  const actor = employeeCode;
  const cameraIsReady = permission?.granted === true;
  const hasVehicleInfo = Boolean(vehicleInfo);
  const selectedCount = selectedCodes.size;

  const buildSendGoodsNote = React.useCallback(
    (input: {
      prefix: 'SEND_GOODS' | 'SEND_GOODS_BAG';
      vehicle: VehicleLabelInfo;
      bagCode?: string | null;
    }): string => {
      const typeLabel = input.prefix === 'SEND_GOODS' ? 'Gửi kiện rời' : 'Gửi bao hàng';
      const bagInfo = input.bagCode ? ` | Bao: ${input.bagCode}` : '';
      const originHubCode =
        input.vehicle.originHubCode !== 'UNKNOWN'
          ? input.vehicle.originHubCode
          : employeeHubCode ?? 'UNKNOWN';
      const destinationHubCode = input.vehicle.destinationHubCode || 'UNKNOWN';
      const licensePlate =
        input.vehicle.licensePlate !== 'UNKNOWN' ? ` (${input.vehicle.licensePlate})` : '';
      
      return `${typeLabel}: [${originHubCode}] -> [${destinationHubCode}] | Nhân viên: ${employeeName} | Mã NV: ${employeeCode} | Mã hub: ${employeeHubCode} | Xe: ${input.vehicle.vehicleCode}${licensePlate}${bagInfo}`;
    },
    [employeeCode, employeeHubCode, employeeName],
  );

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

  const appendSendItem = React.useCallback(
    (rawCode: string) => {
      if (!hasVehicleInfo) {
        setScreenMessage('Vui lòng quét tem xe trước khi quét tem bao hoặc mã kiện.');
        return;
      }

      const normalizedCode = normalizeCode(rawCode);
      if (!normalizedCode) {
        setScreenMessage('Mã không hợp lệ.');
        return;
      }

      const itemType: SendItemType = isBagCode(normalizedCode) ? 'BAG' : 'SHIPMENT';

      setItems((currentItems) => {
        const duplicated = currentItems.some((item) => item.code === normalizedCode);
        if (duplicated) {
          setScreenMessage(`${normalizedCode} đã có trong danh sách gửi hàng.`);
          return currentItems;
        }

        setManualCodeInput('');
        setScreenMessage(
          itemType === 'BAG'
            ? `Đã thêm tem bao ${normalizedCode}.`
            : `Đã thêm kiện rời ${normalizedCode}.`,
        );

        return [
          {
            type: itemType,
            code: normalizedCode,
            scannedAt: new Date().toISOString(),
          },
          ...currentItems,
        ];
      });
    },
    [hasVehicleInfo],
  );

  const applyVehicleLabel = React.useCallback(async (rawValue: string) => {
    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    const nextVehicleInfo = parseVehicleLabel(rawValue);
    if (!nextVehicleInfo) {
      setScreenMessage('Tem xe không hợp lệ. Vui lòng quét hoặc nhập đúng mã tem xe.');
      return;
    }

    try {
      const manifest = await manifestApi.detailByCode(accessToken, nextVehicleInfo.vehicleCode);
      const syncedVehicleInfo = buildSyncedVehicleInfo(nextVehicleInfo, manifest);
      setVehicleInfo(syncedVehicleInfo);
      setManualVehicleInput('');
      setScreenMessage(`Đã nhận tem xe ${syncedVehicleInfo.vehicleCode} từ hệ thống.`);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        setVehicleInfo(null);
        setScreenMessage(
          `Tem xe ${nextVehicleInfo.vehicleCode} chưa được tạo hoặc chưa đồng bộ trên Ops Web. Vui lòng tạo tem xe ở Ops rồi quét lại.`,
        );
        return;
      }

      const message = error instanceof Error ? error.message : 'Không kiểm tra được tem xe.';
      setScreenMessage(message);
      setGlobalError(message);
    }
  }, [accessToken, setGlobalError]);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked || isSubmitting) {
      return;
    }

    lockScanner();

    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });
    const scannedValue = parsed?.value ?? result.data;

    if (!hasVehicleInfo) {
      void applyVehicleLabel(scannedValue);
      return;
    }

    if (!parsed) {
      setScreenMessage('Không đọc được mã tem bao/kiện hợp lệ. Vui lòng thử lại.');
      return;
    }

    appendSendItem(parsed.value);
  };

  const addItemManually = () => {
    appendSendItem(manualCodeInput);
  };

  const addVehicleManually = () => {
    void applyVehicleLabel(manualVehicleInput);
  };

  const resetVehicle = () => {
    setVehicleInfo(null);
    setItems([]);
    setSelectedCodes(new Set());
    setManualVehicleInput('');
    setManualCodeInput('');
    setScreenMessage('Đã làm mới tem xe và danh sách gửi hàng.');
  };

  const toggleSelected = (itemCode: string) => {
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (next.has(itemCode)) {
        next.delete(itemCode);
      } else {
        next.add(itemCode);
      }
      return next;
    });
  };

  const deleteSelectedItems = () => {
    if (selectedCodes.size === 0) {
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => !selectedCodes.has(item.code)));
    setScreenMessage(`Đã xoá ${selectedCodes.size} mã khỏi danh sách.`);
    setSelectedCodes(new Set());
  };

  const submitSendGoods = async () => {
    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!vehicleInfo) {
      setScreenMessage('Vui lòng quét tem xe trước khi xác nhận gửi hàng.');
      return;
    }

    if (items.length === 0) {
      setScreenMessage('Vui lòng quét ít nhất một tem bao hoặc kiện rời.');
      return;
    }

    setIsSubmitting(true);
    setScreenMessage(null);

    const successCodes: string[] = [];
    const failedCodes: Array<{ code: string; reason: string }> = [];
    const loadedLooseShipments: VehicleLoadedLooseShipment[] = [];
    const loadedBagByCode = new Map<string, VehicleLoadedBag>();
    const outboundLocationCode =
      vehicleInfo.originHubCode !== 'UNKNOWN'
        ? vehicleInfo.originHubCode
        : employeeHubCode ?? 'UNKNOWN';

    try {
      const bagItems = items.filter((item) => item.type === 'BAG');
      const manifests = bagItems.length > 0 ? await manifestApi.list(accessToken) : [];

      for (const item of items) {
        if (item.type === 'SHIPMENT') {
          try {
            await submitHubScanAction(accessToken, {
              mode: 'OUTBOUND',
              shipmentCode: item.code,
              locationCode: outboundLocationCode,
              manifestCode: null,
              actor,
              note: buildSendGoodsNote({
                prefix: 'SEND_GOODS',
                vehicle: vehicleInfo,
              }),
              occurredAt: new Date().toISOString(),
              idempotencyKey: createIdempotencyKey('send-goods-shipment'),
            });
            successCodes.push(item.code);
            loadedLooseShipments.push({
              shipmentCode: item.code,
              loadedAt: new Date().toISOString(),
            });
          } catch (error) {
            failedCodes.push({
              code: item.code,
              reason: error instanceof Error ? error.message : 'Không gửi được kiện rời.',
            });
          }
          continue;
        }

        const manifest = resolveBagManifest(manifests, item.code);
        if (!manifest) {
          failedCodes.push({
            code: item.code,
            reason: 'Không tìm thấy tem bao trên hệ thống.',
          });
          continue;
        }

        if (manifest.items.length === 0) {
          failedCodes.push({
            code: item.code,
            reason: 'Bao chưa có kiện hàng.',
          });
          continue;
        }

        for (const manifestItem of manifest.items) {
          try {
            await submitHubScanAction(accessToken, {
              mode: 'OUTBOUND',
              shipmentCode: manifestItem.shipmentCode,
              locationCode: outboundLocationCode,
              manifestCode: manifest.manifestCode,
              actor,
              note: buildSendGoodsNote({
                prefix: 'SEND_GOODS_BAG',
                vehicle: vehicleInfo,
                bagCode: manifest.manifestCode,
              }),
              occurredAt: new Date().toISOString(),
              idempotencyKey: createIdempotencyKey('send-goods-bag'),
            });
            successCodes.push(manifestItem.shipmentCode);
            const existingBag = loadedBagByCode.get(manifest.manifestCode);
            loadedBagByCode.set(manifest.manifestCode, {
              bagCode: manifest.manifestCode,
              shipmentCodes: [
                ...(existingBag?.shipmentCodes ?? []),
                manifestItem.shipmentCode,
              ],
              loadedAt: existingBag?.loadedAt ?? new Date().toISOString(),
            });
          } catch (error) {
            failedCodes.push({
              code: `${item.code}/${manifestItem.shipmentCode}`,
              reason: error instanceof Error ? error.message : 'Không gửi được kiện trong bao.',
            });
          }
        }
      }

      if (successCodes.length > 0) {
        await upsertVehicleLoadRecord({
          vehicle: vehicleInfo,
          bagItems: Array.from(loadedBagByCode.values()),
          looseShipments: loadedLooseShipments,
          employeeCode,
          employeeName,
          hubCode: employeeHubCode,
        });
      }

      if (failedCodes.length > 0) {
        setScreenMessage(
          `Đã gửi ${successCodes.length} kiện, lỗi ${failedCodes.length}: ${failedCodes
            .slice(0, 2)
            .map((item) => `${item.code} (${item.reason})`)
            .join('; ')}`,
        );
        return;
      }

      setScreenMessage(
        `Đã gửi hàng thành công: ${successCodes.length} kiện lên xe ${vehicleInfo.vehicleCode}.`,
      );
      setItems([]);
      setSelectedCodes(new Set());
      setManualCodeInput('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gửi hàng thất bại.';
      setScreenMessage(message);
      setGlobalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Cần cấp quyền camera để quét tem xe, tem bao và mã kiện.
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

          {isSubmitting ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>Đang xác nhận gửi hàng...</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cameraHint}>
          Quét tem xe trước, sau đó quét tem bao hoặc kiện rời để đưa vào danh sách.
        </Text>
      </View>

      <View style={styles.workSection}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Gửi hàng</Text>
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

        <View style={[styles.vehicleCard, vehicleInfo && styles.vehicleCardReady]}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleHeaderCopy}>
              <Text style={styles.vehicleTitle}>Tem xe</Text>
              <Text style={styles.vehicleSubtitle}>
                {vehicleInfo
                  ? 'Đã kiểm tra với hệ thống Ops'
                  : 'Quét tem xe do Ops tạo trước khi thêm hàng'}
              </Text>
            </View>
            <Pressable onPress={resetVehicle}>
              <Text style={styles.resetText}>Làm mới</Text>
            </Pressable>
          </View>
          {vehicleInfo ? (
            <View style={styles.vehicleGrid}>
              <View style={styles.vehicleInfoCell}>
                <Text style={styles.infoLabel}>Mã tem xe</Text>
                <Text style={styles.infoValue}>{vehicleInfo.vehicleCode}</Text>
              </View>
              <View style={styles.vehicleInfoCell}>
                <Text style={styles.infoLabel}>Hub đi</Text>
                <Text style={styles.infoValue}>
                  {vehicleInfo.originHubCode !== 'UNKNOWN'
                    ? vehicleInfo.originHubCode
                    : employeeHubCode ?? 'Chưa có'}
                </Text>
              </View>
              <View style={styles.vehicleInfoCell}>
                <Text style={styles.infoLabel}>Hub đến</Text>
                <Text style={styles.infoValue}>
                  {vehicleInfo.destinationHubCode !== 'UNKNOWN'
                    ? vehicleInfo.destinationHubCode
                    : 'Chưa có'}
                </Text>
              </View>
              <View style={styles.vehicleInfoCell}>
                <Text style={styles.infoLabel}>Biển số</Text>
                <Text style={styles.infoValue}>
                  {vehicleInfo.licensePlate !== 'UNKNOWN' ? vehicleInfo.licensePlate : 'Chưa có'}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.vehicleScanHint}>
                <View style={styles.vehicleScanIcon}>
                  <Ionicons name="qr-code-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.vehicleEmptyText}>
                  Hướng camera vào QR tem xe. Mobile sẽ đối chiếu mã này với Ops trước khi cho gửi hàng.
                </Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  value={manualVehicleInput}
                  onChangeText={setManualVehicleInput}
                  placeholder="Nhập mã tem xe"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.fieldInput, styles.codeInput]}
                  autoCapitalize="characters"
                />
                <Pressable onPress={addVehicleManually} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Kiểm tra</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Tem bao hoặc mã kiện rời</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={manualCodeInput}
              onChangeText={setManualCodeInput}
              placeholder="MB1234567890 hoặc SHP..."
              placeholderTextColor="#9CA3AF"
              style={[
                styles.fieldInput,
                styles.codeInput,
                !hasVehicleInfo && styles.fieldInputDisabled,
              ]}
              autoCapitalize="characters"
              editable={hasVehicleInfo}
            />
            <Pressable
              disabled={!hasVehicleInfo}
              onPress={addItemManually}
              style={[styles.addButton, !hasVehicleInfo && styles.addButtonDisabled]}
            >
              <Text style={styles.addButtonText}>Thêm</Text>
            </Pressable>
          </View>
        </View>

        {screenMessage ? <Text style={styles.messageText}>{screenMessage}</Text> : null}

        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Danh sách gửi hàng ({items.length})</Text>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có tem bao hoặc kiện rời nào.</Text>
            </View>
          ) : (
            items.map((item, index) => {
              const selected = selectedCodes.has(item.code);

              return (
                <Pressable
                  key={`${item.code}-${item.scannedAt}`}
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
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemCodeText}>{item.code}</Text>
                      <Text
                        style={[
                          styles.itemTypeBadge,
                          item.type === 'BAG' ? styles.bagBadge : styles.shipmentBadge,
                        ]}
                      >
                        {item.type === 'BAG' ? 'Bao' : 'Kiện rời'}
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
          disabled={isSubmitting || !hasVehicleInfo || items.length === 0}
          onPress={() => {
            void submitSendGoods();
          }}
          style={[
            styles.uploadButton,
            (isSubmitting || !hasVehicleInfo || items.length === 0) &&
              styles.uploadButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Xác nhận gửi hàng</Text>
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
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  vehicleHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  vehicleTitle: {
    color: '#0F172A',
    fontWeight: '800',
  },
  vehicleSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  resetText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 12,
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
  vehicleEmptyText: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  vehicleScanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    padding: 10,
  },
  vehicleScanIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldRow: {
    marginTop: 10,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldInput: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  fieldInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  codeInput: {
    flex: 1,
  },
  addButton: {
    minWidth: 72,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  messageText: {
    marginTop: 10,
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  listHeaderRow: {
    marginTop: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
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
    minHeight: 94,
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
  bagBadge: {
    color: '#92400E',
    backgroundColor: '#FEF3C7',
  },
  shipmentBadge: {
    color: '#065F46',
    backgroundColor: '#D1FAE5',
  },
  itemTimeText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  uploadButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  uploadButtonDisabled: {
    opacity: 0.4,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
