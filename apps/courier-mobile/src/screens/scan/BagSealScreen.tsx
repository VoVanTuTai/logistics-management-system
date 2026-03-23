import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { BarcodeScanningResult } from 'expo-camera';

import { CameraScannerModal } from '../../components/scan/CameraScannerModal';
import { manifestApi } from '../../features/manifest/manifest.api';
import type { BagManifestDto } from '../../features/manifest/manifest.types';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';

type ScannerMode = 'BAG' | 'SHIPMENT';

interface SealedShipmentItem {
  code: string;
  scannedAt: string;
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

export function BagSealScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);

  const [bagCode, setBagCode] = React.useState('');
  const [shipmentCodeInput, setShipmentCodeInput] = React.useState('');
  const [shipments, setShipments] = React.useState<SealedShipmentItem[]>([]);
  const [scannerMode, setScannerMode] = React.useState<ScannerMode | null>(null);
  const [scannerVisible, setScannerVisible] = React.useState(false);
  const [screenMessage, setScreenMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const accessToken = session?.tokens.accessToken ?? null;

  const closeScanner = () => {
    setScannerVisible(false);
    setScannerMode(null);
  };

  const openScanner = (mode: ScannerMode) => {
    setScreenMessage(null);
    setScannerMode(mode);
    setScannerVisible(true);
  };

  const appendShipmentCode = React.useCallback((rawCode: string) => {
    const normalizedCode = normalizeCode(rawCode);
    if (!normalizedCode) {
      setScreenMessage('Mã vận đơn không hợp lệ.');
      return;
    }

    setShipments((currentItems) => {
      const duplicated = currentItems.some(
        (item) => normalizeCode(item.code) === normalizedCode,
      );
      if (duplicated) {
        setScreenMessage(`Mã vận đơn ${normalizedCode} đã có trong danh sách.`);
        return currentItems;
      }

      setScreenMessage(`Đã thêm mã vận đơn ${normalizedCode}.`);
      return [
        ...currentItems,
        {
          code: normalizedCode,
          scannedAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const onScanned = (result: BarcodeScanningResult) => {
    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

    if (!parsed) {
      setScreenMessage('Không đọc được mã hợp lệ. Vui lòng thử lại.');
      return;
    }

    if (scannerMode === 'BAG') {
      const nextBagCode = normalizeCode(parsed.value);
      setBagCode(nextBagCode);
      setScreenMessage(`Đã nhận mã bao: ${nextBagCode}`);
      closeScanner();
      return;
    }

    if (scannerMode === 'SHIPMENT') {
      appendShipmentCode(parsed.value);
      closeScanner();
    }
  };

  const removeShipmentCode = (shipmentCode: string) => {
    const normalizedTarget = normalizeCode(shipmentCode);
    setShipments((currentItems) =>
      currentItems.filter((item) => normalizeCode(item.code) !== normalizedTarget),
    );
  };

  const addShipmentManually = () => {
    appendShipmentCode(shipmentCodeInput);
    setShipmentCodeInput('');
  };

  const clearAll = () => {
    setBagCode('');
    setShipments([]);
    setShipmentCodeInput('');
    setScreenMessage('Đã làm mới màn hình đóng bao.');
  };

  const resolveBagManifest = (
    manifests: BagManifestDto[],
    sealedBagCode: string,
  ): BagManifestDto | null => {
    const normalizedBagCode = normalizeCode(sealedBagCode);

    return (
      manifests.find(
        (manifest) => normalizeCode(manifest.manifestCode) === normalizedBagCode,
      ) ?? null
    );
  };

  const uploadBagManifest = async () => {
    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!bagCode.trim()) {
      setScreenMessage('Vui lòng quét mã bao trước khi tải lên.');
      return;
    }

    if (shipments.length === 0) {
      setScreenMessage('Vui lòng quét ít nhất một mã vận đơn.');
      return;
    }

    setIsSubmitting(true);
    setScreenMessage(null);

    try {
      const manifests = await manifestApi.list(accessToken);
      const bagManifest = resolveBagManifest(manifests, bagCode);
      if (!bagManifest) {
        setScreenMessage(`Không tìm thấy mã bao ${bagCode} trên hệ thống.`);
        return;
      }

      const shipmentCodes = shipments.map((item) => item.code);
      await manifestApi.addShipments(accessToken, bagManifest.id, {
        shipmentCodes,
        note: 'BAGGED_FROM_COURIER_APP',
      });

      setScreenMessage(
        `Tải lên thành công ${shipmentCodes.length} mã vận đơn vào bao ${bagManifest.manifestCode}.`,
      );
      setShipments([]);
      setShipmentCodeInput('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tải lên thất bại.';
      setScreenMessage(message);
      setGlobalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraScannerModal
        visible={scannerVisible}
        title={
          scannerMode === 'BAG'
            ? 'Quét mã bao'
            : 'Quét mã vận đơn'
        }
        helperText={
          scannerMode === 'BAG'
            ? 'Quét tem bao để lấy mã seal.'
            : 'Quét lần lượt các mã vận đơn cần đóng vào bao.'
        }
        onClose={closeScanner}
        onScanned={onScanned}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Đóng bao túi tái chế</Text>
        <Text style={styles.screenHint}>
          Quét mã bao trước, sau đó quét từng mã vận đơn và bấm tải lên.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Seal bao</Text>
            <TextInput
              value={bagCode}
              onChangeText={setBagCode}
              placeholder="Nhập hoặc quét tem bao"
              placeholderTextColor="#9CA3AF"
              style={styles.fieldInput}
              autoCapitalize="characters"
            />
          </View>

          <Pressable
            onPress={() => openScanner('BAG')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Quét mã bao</Text>
          </Pressable>

          <View style={styles.separator} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Mã vận đơn</Text>
            <TextInput
              value={shipmentCodeInput}
              onChangeText={setShipmentCodeInput}
              placeholder="Nhập mã vận đơn"
              placeholderTextColor="#9CA3AF"
              style={styles.fieldInput}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inlineActionRow}>
            <Pressable
              onPress={addShipmentManually}
              style={[styles.inlineActionButton, styles.inlinePrimaryAction]}
            >
              <Text style={styles.inlineActionText}>Thêm mã</Text>
            </Pressable>
            <Pressable
              onPress={() => openScanner('SHIPMENT')}
              style={[styles.inlineActionButton, styles.inlineSecondaryAction]}
            >
              <Text style={styles.inlineActionSecondaryText}>Quét mã vận đơn</Text>
            </Pressable>
          </View>

          {screenMessage ? <Text style={styles.messageText}>{screenMessage}</Text> : null}
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Danh sách mã vận đơn ({shipments.length})</Text>
            <Pressable onPress={clearAll}>
              <Text style={styles.clearText}>Làm mới</Text>
            </Pressable>
          </View>

          {shipments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có mã vận đơn nào.</Text>
            </View>
          ) : (
            <View style={styles.chipWrap}>
              {shipments.map((item) => (
                <View key={`${item.code}-${item.scannedAt}`} style={styles.shipmentChip}>
                  <View style={styles.shipmentChipBody}>
                    <Text style={styles.shipmentCodeText}>{item.code}</Text>
                    <Text style={styles.shipmentTimeText}>
                      {formatScannedAt(item.scannedAt)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeShipmentCode(item.code)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={isSubmitting || !bagCode.trim() || shipments.length === 0}
          onPress={() => {
            void uploadBagManifest();
          }}
          style={[
            styles.uploadButton,
            (isSubmitting || !bagCode.trim() || shipments.length === 0) &&
              styles.uploadButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Tải lên</Text>
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
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 108,
    gap: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  screenHint: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: -4,
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  fieldInput: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 18,
    color: '#111827',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 4,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlinePrimaryAction: {
    backgroundColor: theme.colors.primary,
  },
  inlineSecondaryAction: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  inlineActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  inlineActionSecondaryText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
  },
  messageText: {
    marginTop: 2,
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '600',
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  clearText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shipmentChip: {
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  shipmentChipBody: {
    flex: 1,
    gap: 2,
  },
  shipmentCodeText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  shipmentTimeText: {
    color: '#6B7280',
    fontSize: 12,
  },
  removeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
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
    fontSize: 22,
    fontWeight: '700',
  },
});

