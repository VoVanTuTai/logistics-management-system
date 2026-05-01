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
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { resolveCourierDisplayName } from '../../utils/courier';

interface RemovedShipmentItem {
  code: string;
  scannedAt: string;
}

const BAG_CODE_REGEX = /^MB\d{10}$/;

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function isValidBagCode(value: string): boolean {
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

export function BagUnsealScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const [permission, requestPermission] = useCameraPermissions();

  const [bagCode, setBagCode] = React.useState('');
  const [shipmentCodeInput, setShipmentCodeInput] = React.useState('');
  const [removedShipments, setRemovedShipments] = React.useState<RemovedShipmentItem[]>([]);
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
  const processingHubCode = session?.user.hubCodes?.[0] ?? null;
  const normalizedBagCode = normalizeCode(bagCode);
  const hasValidBagCode = isValidBagCode(normalizedBagCode);
  const cameraIsReady = permission?.granted === true;
  const selectedCount = selectedCodes.size;
  const bagCodeError =
    normalizedBagCode.length > 0 && !hasValidBagCode
      ? 'Tem bao phải đúng định dạng MB + 10 chữ số.'
      : null;

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

  const appendRemovedShipmentCode = React.useCallback(
    (rawCode: string) => {
      if (!hasValidBagCode) {
        setScreenMessage('Vui lòng quét hoặc nhập tem bao hợp lệ trước khi quét mã vận đơn.');
        return;
      }

      const normalizedCode = normalizeCode(rawCode);
      if (!normalizedCode) {
        setScreenMessage('Mã vận đơn không hợp lệ.');
        return;
      }

      setRemovedShipments((currentItems) => {
        const duplicated = currentItems.some(
          (item) => normalizeCode(item.code) === normalizedCode,
        );

        if (duplicated) {
          setScreenMessage(`Mã vận đơn ${normalizedCode} đã có trong danh sách gỡ bao.`);
          return currentItems;
        }

        setShipmentCodeInput('');
        setScreenMessage(`Đã thêm mã vận đơn ${normalizedCode} vào danh sách gỡ bao.`);

        return [
          {
            code: normalizedCode,
            scannedAt: new Date().toISOString(),
          },
          ...currentItems,
        ];
      });
    },
    [hasValidBagCode],
  );

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked || isSubmitting) {
      return;
    }

    lockScanner();

    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

    if (!parsed) {
      setScreenMessage('Không đọc được mã hợp lệ. Vui lòng thử lại.');
      return;
    }

    const normalizedValue = normalizeCode(parsed.value);
    if (isValidBagCode(normalizedValue)) {
      setBagCode(normalizedValue);
      setScreenMessage(`Đã nhận tem bao ${normalizedValue}.`);
      return;
    }

    appendRemovedShipmentCode(normalizedValue);
  };

  const addShipmentManually = () => {
    appendRemovedShipmentCode(shipmentCodeInput);
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

    setRemovedShipments((currentItems) =>
      currentItems.filter((item) => !selectedCodes.has(normalizeCode(item.code))),
    );
    setScreenMessage(`Đã xoá ${selectedCodes.size} mã vận đơn khỏi danh sách.`);
    setSelectedCodes(new Set());
  };

  const resolveBagManifest = (
    manifests: BagManifestDto[],
    scannedBagCode: string,
  ): BagManifestDto | null => {
    const normalizedCode = normalizeCode(scannedBagCode);

    return (
      manifests.find(
        (manifest) => normalizeCode(manifest.manifestCode) === normalizedCode,
      ) ?? null
    );
  };

  const submitRemoveShipments = async () => {
    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!hasValidBagCode) {
      setScreenMessage('Vui lòng quét hoặc nhập tem bao hợp lệ trước khi tải lên.');
      return;
    }

    if (removedShipments.length === 0) {
      setScreenMessage('Vui lòng quét ít nhất một mã vận đơn cần gỡ khỏi bao.');
      return;
    }

    setIsSubmitting(true);
    setScreenMessage(null);

    try {
      const manifests = await manifestApi.list(accessToken);
      const bagManifest = resolveBagManifest(manifests, normalizedBagCode);

      if (!bagManifest) {
        setScreenMessage(`Không tìm thấy tem bao ${normalizedBagCode} trên hệ thống.`);
        return;
      }

      const shipmentCodes = removedShipments.map((item) => item.code);
      const accountabilityNote = [
        'UNBAGGED_FROM_COURIER_APP',
        `employeeCode=${employeeCode ?? 'UNKNOWN'}`,
        `employeeName=${employeeName}`,
        `hubCode=${processingHubCode ?? 'UNKNOWN'}`,
      ].join('; ');

      await manifestApi.removeShipments(accessToken, bagManifest.id, {
        shipmentCodes,
        note: accountabilityNote,
        unsealedBy: employeeCode,
        unsealedByName: employeeName,
        processingHubCode,
      });

      setScreenMessage(
        `Đã gỡ ${shipmentCodes.length} mã vận đơn khỏi bao ${bagManifest.manifestCode}.`,
      );
      setRemovedShipments([]);
      setSelectedCodes(new Set());
      setShipmentCodeInput('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gỡ bao thất bại.';
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
                Cần cấp quyền camera để quét tem bao và mã vận đơn.
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
              <Text style={styles.cameraOverlayText}>Đang xác nhận gỡ bao...</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cameraHint}>
          Quét tem bao trước. Sau đó quét mã vận đơn, mã hợp lệ sẽ chuyển xuống danh sách.
        </Text>
      </View>

      <View style={styles.workSection}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Gỡ bao</Text>
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

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Tem bao</Text>
          <TextInput
            value={normalizedBagCode}
            onChangeText={(value) => setBagCode(normalizeCode(value))}
            placeholder="MB1234567890"
            placeholderTextColor="#9CA3AF"
            style={styles.fieldInput}
            autoCapitalize="characters"
          />
          {bagCodeError ? <Text style={styles.errorText}>{bagCodeError}</Text> : null}
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Mã vận đơn cần gỡ</Text>
          <View style={styles.shipmentInputRow}>
            <TextInput
              value={shipmentCodeInput}
              onChangeText={setShipmentCodeInput}
              placeholder="Nhập hoặc quét mã vận đơn"
              placeholderTextColor="#9CA3AF"
              style={[
                styles.fieldInput,
                styles.shipmentInput,
                !hasValidBagCode && styles.fieldInputDisabled,
              ]}
              autoCapitalize="characters"
              editable={hasValidBagCode}
            />
            <Pressable
              disabled={!hasValidBagCode}
              onPress={addShipmentManually}
              style={[
                styles.addButton,
                !hasValidBagCode && styles.addButtonDisabled,
              ]}
            >
              <Text style={styles.addButtonText}>Thêm</Text>
            </Pressable>
          </View>
        </View>

        {screenMessage ? <Text style={styles.messageText}>{screenMessage}</Text> : null}

        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>
            Danh sách mã vận đơn cần gỡ ({removedShipments.length})
          </Text>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {removedShipments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có mã vận đơn nào.</Text>
            </View>
          ) : (
            removedShipments.map((item, index) => {
              const selected = selectedCodes.has(normalizeCode(item.code));

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
                    <Text style={styles.shipmentCodeText}>{item.code}</Text>
                    <Text style={styles.shipmentTimeText}>
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
          disabled={isSubmitting || !hasValidBagCode || removedShipments.length === 0}
          onPress={() => {
            void submitRemoveShipments();
          }}
          style={[
            styles.uploadButton,
            (isSubmitting || !hasValidBagCode || removedShipments.length === 0) &&
              styles.uploadButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Xác nhận gỡ bao</Text>
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
  fieldRow: {
    marginTop: 10,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
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
  shipmentInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shipmentInput: {
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
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
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
  shipmentCodeText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  shipmentTimeText: {
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
