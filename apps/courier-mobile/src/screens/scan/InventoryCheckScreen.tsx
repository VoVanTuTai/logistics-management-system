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

import { submitHubScanAction } from '../../features/scan/hub.api';
import { enqueueHubScanOffline } from '../../features/scan/hub.offline';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import {
  buildInventoryCheckAuditNote,
  resolveCourierId,
} from '../../utils/courier';
import { appEnv } from '../../utils/env';
import { createIdempotencyKey } from '../../utils/idempotency';
import { uploadCourierImage } from '../../features/media/courier-media-upload.api';
import { playScanSuccessSound, playScanWarningSound } from '../../utils/scanSoundFeedback';

interface InventoryItem {
  code: string;
  scannedAt: string;
  photoUri?: string | null;
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
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.';
}

export function InventoryCheckScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<any>(null);

  const [manualCodeInput, setManualCodeInput] = React.useState('');
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [screenMessage, setScreenMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scanLocked, setScanLocked] = React.useState(false);
  const scanCooldownRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const accessToken = session?.tokens.accessToken ?? null;
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const hubCode = session?.user.hubCodes?.[0]?.trim().toUpperCase() ?? '';
  const actor = (courierId || session?.user.username) ?? null;
  const cameraIsReady = permission?.granted === true;
  const selectedCount = selectedCodes.size;
  const canSubmit = Boolean(accessToken) && hubCode.length > 0 && items.length > 0;

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

  const appendInventoryItem = React.useCallback((rawCode: string, photoUri?: string | null) => {
    const normalizedCode = normalizeCode(rawCode);
    if (!normalizedCode) {
      playScanWarningSound();
      setScreenMessage('Mã vận đơn không hợp lệ.');
      return;
    }

    setItems((currentItems) => {
      const duplicated = currentItems.some((item) => item.code === normalizedCode);
      if (duplicated) {
        playScanWarningSound();
        setScreenMessage(`${normalizedCode} đã có trong danh sách kiểm tồn.`);
        return currentItems;
      }

      setManualCodeInput('');
      playScanSuccessSound();
      setScreenMessage(`Đã thêm ${normalizedCode} vào danh sách kiểm tồn.`);

      return [
        {
          code: normalizedCode,
          scannedAt: new Date().toISOString(),
          photoUri: photoUri || null,
        },
        ...currentItems,
      ];
    });
  }, []);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanLocked || isSubmitting) {
      return;
    }

    lockScanner();

    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

    if (!parsed) {
      playScanWarningSound();
      setScreenMessage('Không đọc được mã vận đơn hợp lệ. Vui lòng thử lại.');
      return;
    }

    const normalizedCode = normalizeCode(parsed.value);

    let duplicated = false;
    setItems((currentItems) => {
      duplicated = currentItems.some((item) => item.code === normalizedCode);
      return currentItems;
    });

    if (duplicated) {
      playScanWarningSound();
      setScreenMessage(`${normalizedCode} đã có trong danh sách kiểm tồn.`);
      return;
    }

    let photoUri: string | null = null;
    if (cameraRef.current) {
      try {
        const picture = await cameraRef.current.takePictureAsync({
          quality: 0.6,
        });
        photoUri = picture.uri || null;
      } catch (err) {
        console.error('Failed to capture auto proof photo for inventory check:', err);
      }
    }

    appendInventoryItem(parsed.value, photoUri);
  };

  const addItemManually = () => {
    appendInventoryItem(manualCodeInput);
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

  const submitInventoryCheck = async () => {
    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!hubCode) {
      setScreenMessage('Tài khoản chưa có mã hub nên không thể xác nhận kiểm tồn.');
      return;
    }

    if (items.length === 0) {
      setScreenMessage('Vui lòng quét hoặc nhập ít nhất một mã vận đơn.');
      return;
    }

    setIsSubmitting(true);
    setScreenMessage(null);

    const successCodes: string[] = [];
    const queuedCodes: string[] = [];
    const failedCodes: Array<{ code: string; reason: string }> = [];

    for (const item of items) {
      let finalNote = buildInventoryCheckAuditNote({
        displayName: session?.user.displayName,
        username: session?.user.username,
        courierId,
        hubCode,
      });

      if (item.photoUri) {
        try {
          const publicUrl = await uploadCourierImage({
            accessToken,
            uri: item.photoUri,
            filename: `inventory-check-${item.code}.jpg`,
          });
          finalNote = `${finalNote} | Minh chứng: ${publicUrl}`;
        } catch (uploadError) {
          console.error('Failed to upload proof photo for inventory check:', uploadError);
          finalNote = `${finalNote} | Minh chứng: ${item.photoUri}`;
        }
      }

      const command = {
        mode: 'INBOUND' as const,
        shipmentCode: item.code,
        locationCode: hubCode,
        manifestCode: null,
        actor,
        note: finalNote,
        occurredAt: new Date().toISOString(),
        idempotencyKey: createIdempotencyKey('inventory-check'),
      };

      try {
        await submitHubScanAction(accessToken, command);
        successCodes.push(item.code);
      } catch (error) {
        if (shouldQueueOffline(error)) {
          await enqueueHubScanOffline(command);
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
      setItems([]);
      setSelectedCodes(new Set());
      setScreenMessage(
        `Đã xác nhận kiểm tồn ${successCodes.length} mã` +
          (queuedCodes.length > 0 ? `, ${queuedCodes.length} mã được lưu offline.` : '.'),
      );
      setIsSubmitting(false);
      return;
    }

    const failedCodeSet = new Set(failedCodes.map((item) => item.code));
    setItems((currentItems) =>
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
    setScreenMessage(
      `Đã xác nhận kiểm tồn ${successCodes.length} mã` +
        (queuedCodes.length > 0 ? `, ${queuedCodes.length} mã được lưu offline` : '') +
        `. Lỗi ${failedCodes.length}: ${failedCodes
          .slice(0, 2)
          .map((item) => `${item.code} (${item.reason})`)
          .join('; ')}`,
    );
    setIsSubmitting(false);
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
                Cần cấp quyền camera để quét mã vận đơn kiểm tồn.
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
              onBarcodeScanned={handleBarCodeScanned}
            />
          ) : null}

          {isSubmitting ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>Đang xác nhận kiểm tồn...</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cameraHint}>
          Quét mã vận đơn hoặc nhập tay, sau đó xác nhận kiểm tồn theo danh sách.
        </Text>
      </View>

      <View style={styles.workSection}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Kiểm tồn kho</Text>
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

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Mã vận đơn</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={manualCodeInput}
              onChangeText={setManualCodeInput}
              placeholder="SHP..."
              placeholderTextColor="#9CA3AF"
              style={[styles.fieldInput, styles.codeInput]}
              autoCapitalize="characters"
            />
            <Pressable onPress={addItemManually} style={styles.addButton}>
              <Text style={styles.addButtonText}>Thêm</Text>
            </Pressable>
          </View>
        </View>

        {screenMessage ? <Text style={styles.messageText}>{screenMessage}</Text> : null}

        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Danh sách kiểm tồn ({items.length})</Text>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có mã vận đơn nào.</Text>
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
                    <Text style={styles.itemCodeText}>{item.code}</Text>
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
          disabled={isSubmitting || !canSubmit}
          onPress={() => {
            void submitInventoryCheck();
          }}
          style={[
            styles.uploadButton,
            (isSubmitting || !canSubmit) && styles.uploadButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Xác nhận tồn kho</Text>
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
  itemCodeText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
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
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
