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
import type { BarcodeScanningResult } from 'expo-camera';

import { CameraScannerModal } from '../../components/scan/CameraScannerModal';
import { manifestApi } from '../../features/manifest/manifest.api';
import type { BagManifestDto } from '../../features/manifest/manifest.types';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';

type ScannerMode = 'BAG' | 'SHIPMENT';

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

  const [bagCode, setBagCode] = React.useState('');
  const [shipmentCodeInput, setShipmentCodeInput] = React.useState('');
  const [removedShipments, setRemovedShipments] = React.useState<RemovedShipmentItem[]>([]);
  const [scannerMode, setScannerMode] = React.useState<ScannerMode | null>(null);
  const [scannerVisible, setScannerVisible] = React.useState(false);
  const [screenMessage, setScreenMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const accessToken = session?.tokens.accessToken ?? null;
  const normalizedBagCode = normalizeCode(bagCode);
  const hasValidBagCode = isValidBagCode(normalizedBagCode);
  const bagCodeError =
    normalizedBagCode.length > 0 && !hasValidBagCode
      ? 'Ma bao phai dung dinh dang MB + 10 chu so (vi du: MB1234567890).'
      : null;

  const closeScanner = () => {
    setScannerVisible(false);
    setScannerMode(null);
  };

  const openScanner = (mode: ScannerMode) => {
    if (mode === 'SHIPMENT' && !hasValidBagCode) {
      setScreenMessage(
        'Vui long quet ma bao hop le (MB + 10 chu so) truoc khi quet ma van don.',
      );
      return;
    }

    setScreenMessage(null);
    setScannerMode(mode);
    setScannerVisible(true);
  };

  const appendRemovedShipmentCode = React.useCallback(
    (rawCode: string) => {
      if (!hasValidBagCode) {
        setScreenMessage(
          'Vui long quet ma bao hop le (MB + 10 chu so) truoc khi them ma van don.',
        );
        return;
      }

      const normalizedCode = normalizeCode(rawCode);
      if (!normalizedCode) {
        setScreenMessage('Ma van don khong hop le.');
        return;
      }

      setRemovedShipments((currentItems) => {
        const duplicated = currentItems.some(
          (item) => normalizeCode(item.code) === normalizedCode,
        );

        if (duplicated) {
          setScreenMessage(`Ma van don ${normalizedCode} da co trong danh sach go bao.`);
          return currentItems;
        }

        setScreenMessage(`Da them ma van don ${normalizedCode} vao danh sach go bao.`);

        return [
          ...currentItems,
          {
            code: normalizedCode,
            scannedAt: new Date().toISOString(),
          },
        ];
      });
    },
    [hasValidBagCode],
  );

  const onScanned = (result: BarcodeScanningResult) => {
    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

    if (!parsed) {
      setScreenMessage('Khong doc duoc ma hop le. Vui long thu lai.');
      return;
    }

    if (scannerMode === 'BAG') {
      const nextBagCode = normalizeCode(parsed.value);
      if (!isValidBagCode(nextBagCode)) {
        setScreenMessage('Ma bao khong hop le. Vui long quet dung MB + 10 chu so.');
        return;
      }

      setBagCode(nextBagCode);
      setScreenMessage(`Da nhan ma bao: ${nextBagCode}`);
      closeScanner();
      return;
    }

    if (scannerMode === 'SHIPMENT') {
      if (!hasValidBagCode) {
        setScreenMessage(
          'Vui long quet ma bao hop le (MB + 10 chu so) truoc khi quet ma van don.',
        );
        return;
      }

      appendRemovedShipmentCode(parsed.value);
      closeScanner();
    }
  };

  const removeShipmentCode = (shipmentCode: string) => {
    const normalizedTarget = normalizeCode(shipmentCode);
    setRemovedShipments((currentItems) =>
      currentItems.filter((item) => normalizeCode(item.code) !== normalizedTarget),
    );
  };

  const addShipmentManually = () => {
    if (!hasValidBagCode) {
      setScreenMessage(
        'Vui long quet ma bao hop le (MB + 10 chu so) truoc khi them ma van don.',
      );
      return;
    }

    appendRemovedShipmentCode(shipmentCodeInput);
    setShipmentCodeInput('');
  };

  const clearAll = () => {
    setBagCode('');
    setRemovedShipments([]);
    setShipmentCodeInput('');
    setScreenMessage('Da lam moi man hinh go bao.');
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
      setGlobalError('Phien dang nhap da het han. Vui long dang nhap lai.');
      return;
    }

    if (!hasValidBagCode) {
      setScreenMessage('Vui long quet ma bao hop le (MB + 10 chu so) truoc khi tai len.');
      return;
    }

    if (removedShipments.length === 0) {
      setScreenMessage('Vui long quet it nhat mot ma van don can go khoi bao.');
      return;
    }

    setIsSubmitting(true);
    setScreenMessage(null);

    try {
      const manifests = await manifestApi.list(accessToken);
      const bagManifest = resolveBagManifest(manifests, normalizedBagCode);

      if (!bagManifest) {
        setScreenMessage(`Khong tim thay ma bao ${normalizedBagCode} tren he thong.`);
        return;
      }

      const shipmentCodes = removedShipments.map((item) => item.code);
      await manifestApi.removeShipments(accessToken, bagManifest.id, {
        shipmentCodes,
        note: 'UNBAGGED_FROM_COURIER_APP',
      });

      setScreenMessage(
        `Da go ${shipmentCodes.length} ma van don khoi bao ${bagManifest.manifestCode}.`,
      );
      setRemovedShipments([]);
      setShipmentCodeInput('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Go bao that bai.';
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
        title={scannerMode === 'BAG' ? 'Quet ma bao' : 'Quet ma van don can go'}
        helperText={
          scannerMode === 'BAG'
            ? 'Quet lan dau ma bao theo dinh dang MB + 10 chu so.'
            : 'Chi quet ma van don sau khi da co ma bao hop le.'
        }
        onClose={closeScanner}
        onScanned={onScanned}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Go bao</Text>
        <Text style={styles.screenHint}>
          Quet lan dau la ma bao (MB + 10 chu so), sau do quet tung ma van don de lay ra ngoai.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ma bao</Text>
            <TextInput
              value={normalizedBagCode}
              onChangeText={(value) => setBagCode(normalizeCode(value))}
              placeholder="MB1234567890"
              placeholderTextColor="#9CA3AF"
              style={styles.fieldInput}
              autoCapitalize="characters"
            />
            <Text style={styles.hintText}>Dinh dang: MB + 10 chu so.</Text>
            {bagCodeError ? <Text style={styles.errorHintText}>{bagCodeError}</Text> : null}
          </View>

          <Pressable onPress={() => openScanner('BAG')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Quet ma bao (lan dau)</Text>
          </Pressable>

          <View style={styles.separator} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ma van don lay ra</Text>
            <TextInput
              value={shipmentCodeInput}
              onChangeText={setShipmentCodeInput}
              placeholder="Nhap ma van don"
              placeholderTextColor="#9CA3AF"
              style={[styles.fieldInput, !hasValidBagCode && styles.fieldInputDisabled]}
              autoCapitalize="characters"
              editable={hasValidBagCode}
            />
            {!hasValidBagCode ? (
              <Text style={styles.lockHintText}>
                Can co ma bao hop le truoc khi quet/them ma van don.
              </Text>
            ) : null}
          </View>

          <View style={styles.inlineActionRow}>
            <Pressable
              disabled={!hasValidBagCode}
              onPress={addShipmentManually}
              style={[
                styles.inlineActionButton,
                styles.inlinePrimaryAction,
                !hasValidBagCode && styles.inlineActionDisabled,
              ]}
            >
              <Text style={styles.inlineActionText}>Them ma</Text>
            </Pressable>
            <Pressable
              disabled={!hasValidBagCode}
              onPress={() => openScanner('SHIPMENT')}
              style={[
                styles.inlineActionButton,
                styles.inlineSecondaryAction,
                !hasValidBagCode && styles.inlineActionDisabled,
              ]}
            >
              <Text style={styles.inlineActionSecondaryText}>Quet ma van don</Text>
            </Pressable>
          </View>

          {screenMessage ? <Text style={styles.messageText}>{screenMessage}</Text> : null}
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Danh sach ma van don go ({removedShipments.length})</Text>
            <Pressable onPress={clearAll}>
              <Text style={styles.clearText}>Lam moi</Text>
            </Pressable>
          </View>

          {removedShipments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chua co ma van don nao.</Text>
            </View>
          ) : (
            <View style={styles.chipWrap}>
              {removedShipments.map((item) => (
                <View key={`${item.code}-${item.scannedAt}`} style={styles.shipmentChip}>
                  <View style={styles.shipmentChipBody}>
                    <Text style={styles.shipmentCodeText}>{item.code}</Text>
                    <Text style={styles.shipmentTimeText}>{formatScannedAt(item.scannedAt)}</Text>
                  </View>
                  <Pressable
                    onPress={() => removeShipmentCode(item.code)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>x</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

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
            <Text style={styles.uploadButtonText}>Xac nhan go bao</Text>
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
  fieldInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  hintText: {
    color: '#4B5563',
    fontSize: 13,
    marginTop: 2,
  },
  errorHintText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
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
  inlineActionDisabled: {
    opacity: 0.45,
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
  lockHintText: {
    color: '#92400E',
    fontSize: 13,
    marginTop: 2,
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
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  uploadButtonDisabled: {
    opacity: 0.4,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
