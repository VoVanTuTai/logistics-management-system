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
import { resolveCourierDisplayName, resolveCourierId, buildBagUnsealAuditNote } from '../../utils/courier';
import { appEnv } from '../../utils/env';

interface RemovedShipmentItem {
  code: string;
  scannedAt: string;
}

const BAG_CODE_REGEX = /^MB\d{10}$/;
type ManifestLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

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
  const [bagManifest, setBagManifest] = React.useState<BagManifestDto | null>(null);
  const [manifestLoadStatus, setManifestLoadStatus] =
    React.useState<ManifestLoadStatus>('idle');
  const [manifestLoadError, setManifestLoadError] = React.useState<string | null>(null);
  const [screenMessage, setScreenMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scanLocked, setScanLocked] = React.useState(false);
  const scanCooldownRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const manifestRequestIdRef = React.useRef(0);

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
  const expectedShipmentCodes = React.useMemo(
    () =>
      (bagManifest?.items ?? [])
        .map((item) => normalizeCode(item.shipmentCode))
        .filter(Boolean),
    [bagManifest],
  );
  const expectedShipmentCodeSet = React.useMemo(
    () => new Set(expectedShipmentCodes),
    [expectedShipmentCodes],
  );
  const scannedShipmentCodes = React.useMemo(
    () => removedShipments.map((item) => normalizeCode(item.code)),
    [removedShipments],
  );
  const scannedShipmentCodeSet = React.useMemo(
    () => new Set(scannedShipmentCodes),
    [scannedShipmentCodes],
  );
  const matchedShipmentCodes = React.useMemo(
    () => scannedShipmentCodes.filter((code) => expectedShipmentCodeSet.has(code)),
    [expectedShipmentCodeSet, scannedShipmentCodes],
  );
  const unexpectedShipmentCodes = React.useMemo(
    () =>
      bagManifest
        ? scannedShipmentCodes.filter((code) => !expectedShipmentCodeSet.has(code))
        : [],
    [bagManifest, expectedShipmentCodeSet, scannedShipmentCodes],
  );
  const missingShipmentCodes = React.useMemo(
    () =>
      bagManifest
        ? expectedShipmentCodes.filter((code) => !scannedShipmentCodeSet.has(code))
        : [],
    [bagManifest, expectedShipmentCodes, scannedShipmentCodeSet],
  );
  const isManifestLoaded = manifestLoadStatus === 'loaded' && Boolean(bagManifest);
  const canSubmitUnseal =
    !isSubmitting &&
    hasValidBagCode &&
    isManifestLoaded &&
    matchedShipmentCodes.length > 0 &&
    unexpectedShipmentCodes.length === 0 &&
    missingShipmentCodes.length === 0;

  React.useEffect(() => {
    return () => {
      if (scanCooldownRef.current) {
        clearTimeout(scanCooldownRef.current);
      }
    };
  }, []);

  const resetScannedShipments = React.useCallback(() => {
    setRemovedShipments([]);
    setSelectedCodes(new Set());
    setShipmentCodeInput('');
  }, []);

  const resolveBagManifest = React.useCallback(
    (manifests: BagManifestDto[], scannedBagCode: string): BagManifestDto | null => {
      const normalizedCode = normalizeCode(scannedBagCode);

      return (
        manifests.find(
          (manifest) => normalizeCode(manifest.manifestCode) === normalizedCode,
        ) ?? null
      );
    },
    [],
  );

  const loadBagManifest = React.useCallback(
    async (scannedBagCode: string, options?: { showSuccess?: boolean }) => {
      if (!accessToken) {
        setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return null;
      }

      const normalizedCode = normalizeCode(scannedBagCode);
      if (!isValidBagCode(normalizedCode)) {
        return null;
      }

      manifestRequestIdRef.current += 1;
      const requestId = manifestRequestIdRef.current;
      setManifestLoadStatus('loading');
      setManifestLoadError(null);

      try {
        const manifests = await manifestApi.list(accessToken);
        const manifest = resolveBagManifest(manifests, normalizedCode);

        if (requestId !== manifestRequestIdRef.current) {
          return null;
        }

        if (!manifest) {
          const message = `Không tìm thấy tem bao ${normalizedCode} trên hệ thống.`;
          setBagManifest(null);
          setManifestLoadStatus('error');
          setManifestLoadError(message);
          setScreenMessage(message);
          return null;
        }

        setBagManifest(manifest);
        setManifestLoadStatus('loaded');
        setManifestLoadError(null);

        if (options?.showSuccess) {
          setScreenMessage(
            `Đã tải ${manifest.items.length} mã vận đơn dự kiến trong bao ${manifest.manifestCode}.`,
          );
        }

        return manifest;
      } catch (error) {
        if (requestId !== manifestRequestIdRef.current) {
          return null;
        }

        const message =
          error instanceof Error ? error.message : 'Không tải được dữ liệu tem bao.';
        setBagManifest(null);
        setManifestLoadStatus('error');
        setManifestLoadError(message);
        setScreenMessage(message);
        setGlobalError(message);
        return null;
      }
    },
    [accessToken, resolveBagManifest, setGlobalError],
  );

  React.useEffect(() => {
    if (!hasValidBagCode) {
      setBagManifest(null);
      setManifestLoadStatus(normalizedBagCode ? 'error' : 'idle');
      setManifestLoadError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      void loadBagManifest(normalizedBagCode).then(() => {
        if (cancelled) {
          return;
        }
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [hasValidBagCode, loadBagManifest, normalizedBagCode]);

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

      if (manifestLoadStatus === 'loading') {
        setScreenMessage('Đang tải danh sách vận đơn trong bao. Vui lòng chờ một chút.');
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

        const expectedMatched =
          !bagManifest || expectedShipmentCodeSet.has(normalizedCode);

        setShipmentCodeInput('');
        setScreenMessage(
          expectedMatched
            ? `Đã đối chiếu đúng mã ${normalizedCode} trong bao.`
            : `Mã ${normalizedCode} không có trong danh sách dự kiến của bao.`,
        );

        return [
          {
            code: normalizedCode,
            scannedAt: new Date().toISOString(),
          },
          ...currentItems,
        ];
      });
    },
    [bagManifest, expectedShipmentCodeSet, hasValidBagCode, manifestLoadStatus],
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
      if (normalizedValue !== normalizedBagCode) {
        resetScannedShipments();
      }
      setBagCode(normalizedValue);
      setScreenMessage(`Đã nhận tem bao ${normalizedValue}.`);
      void loadBagManifest(normalizedValue, { showSuccess: true });
      return;
    }

    appendRemovedShipmentCode(normalizedValue);
  };

  const addShipmentManually = () => {
    appendRemovedShipmentCode(shipmentCodeInput);
  };

  const onBagCodeChange = (value: string) => {
    const nextCode = normalizeCode(value);
    if (nextCode !== normalizedBagCode) {
      setBagManifest(null);
      setManifestLoadStatus(nextCode ? 'loading' : 'idle');
      setManifestLoadError(null);
      resetScannedShipments();
    }
    setBagCode(nextCode);
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

  const submitRemoveShipments = async () => {
    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!hasValidBagCode) {
      setScreenMessage('Vui lòng quét hoặc nhập tem bao hợp lệ trước khi tải lên.');
      return;
    }

    if (!isManifestLoaded || !bagManifest) {
      setScreenMessage('Chưa tải được danh sách vận đơn trong bao. Vui lòng thử tải lại tem bao.');
      return;
    }

    if (matchedShipmentCodes.length === 0) {
      setScreenMessage('Vui lòng quét ít nhất một mã vận đơn cần gỡ khỏi bao.');
      return;
    }

    if (unexpectedShipmentCodes.length > 0) {
      setScreenMessage(
        `Có ${unexpectedShipmentCodes.length} mã không thuộc bao. Hãy xoá mã ngoài bao trước khi xác nhận.`,
      );
      return;
    }

    if (missingShipmentCodes.length > 0) {
      setScreenMessage(
        `Còn thiếu ${missingShipmentCodes.length} mã expected. Hãy quét đủ trước khi xác nhận gỡ bao.`,
      );
      return;
    }

    setIsSubmitting(true);
    setScreenMessage(null);

    try {
      const shipmentCodes = matchedShipmentCodes;
      const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
      const note = buildBagUnsealAuditNote({
        displayName: session?.user?.displayName,
        username: session?.user?.username,
        courierId,
        hubCode: processingHubCode,
        bagCode: bagManifest.manifestCode,
      });

      await manifestApi.removeShipments(accessToken, bagManifest.id, {
        shipmentCodes,
        note,
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
      void loadBagManifest(normalizedBagCode);
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
            onChangeText={onBagCodeChange}
            placeholder="MB1234567890"
            placeholderTextColor="#9CA3AF"
            style={styles.fieldInput}
            autoCapitalize="characters"
          />
          {bagCodeError ? <Text style={styles.errorText}>{bagCodeError}</Text> : null}
          {hasValidBagCode ? (
            <View style={styles.manifestLookupRow}>
              <View style={styles.manifestLookupInfo}>
                <Text style={styles.manifestLookupTitle}>
                  {manifestLoadStatus === 'loading'
                    ? 'Đang tải danh sách expected...'
                    : isManifestLoaded
                      ? `Bao ${bagManifest?.manifestCode}`
                      : 'Chưa tải được danh sách expected'}
                </Text>
                <Text style={styles.manifestLookupSubtext}>
                  {isManifestLoaded
                    ? `${bagManifest?.status ?? '-'} | ${bagManifest?.originHubCode ?? '-'} -> ${bagManifest?.destinationHubCode ?? '-'}`
                    : manifestLoadError ?? 'Quét/nhập tem bao hợp lệ để đối chiếu vận đơn.'}
                </Text>
              </View>
              <Pressable
                disabled={manifestLoadStatus === 'loading'}
                onPress={() => {
                  void loadBagManifest(normalizedBagCode, { showSuccess: true });
                }}
                style={[
                  styles.reloadManifestButton,
                  manifestLoadStatus === 'loading' && styles.reloadManifestButtonDisabled,
                ]}
              >
                {manifestLoadStatus === 'loading' ? (
                  <ActivityIndicator size="small" color="#1E3A8A" />
                ) : (
                  <Text style={styles.reloadManifestButtonText}>Tải lại</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        {isManifestLoaded ? (
          <View style={styles.reconcileSummary}>
            <View style={styles.reconcileMetric}>
              <Text style={styles.reconcileMetricValue}>{expectedShipmentCodes.length}</Text>
              <Text style={styles.reconcileMetricLabel}>Expected</Text>
            </View>
            <View style={styles.reconcileMetric}>
              <Text style={styles.reconcileMetricValue}>{matchedShipmentCodes.length}</Text>
              <Text style={styles.reconcileMetricLabel}>Scanned đúng</Text>
            </View>
            <View
              style={[
                styles.reconcileMetric,
                missingShipmentCodes.length > 0 && styles.reconcileMetricWarning,
              ]}
            >
              <Text style={styles.reconcileMetricValue}>{missingShipmentCodes.length}</Text>
              <Text style={styles.reconcileMetricLabel}>Còn thiếu</Text>
            </View>
            <View
              style={[
                styles.reconcileMetric,
                unexpectedShipmentCodes.length > 0 && styles.reconcileMetricDanger,
              ]}
            >
              <Text style={styles.reconcileMetricValue}>{unexpectedShipmentCodes.length}</Text>
              <Text style={styles.reconcileMetricLabel}>Ngoài bao</Text>
            </View>
          </View>
        ) : null}

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
            Danh sách đã quét ({removedShipments.length})
          </Text>
          {missingShipmentCodes.length > 0 ? (
            <Text style={styles.listHint}>
              Còn thiếu: {missingShipmentCodes.slice(0, 4).join(', ')}
              {missingShipmentCodes.length > 4 ? ` +${missingShipmentCodes.length - 4}` : ''}
            </Text>
          ) : null}
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
              const isExpected = !isManifestLoaded || expectedShipmentCodeSet.has(normalizeCode(item.code));

              return (
                <Pressable
                  key={`${item.code}-${item.scannedAt}`}
                  onPress={() => toggleSelected(item.code)}
                  style={[
                    styles.listItem,
                    selected && styles.listItemSelected,
                    !isExpected && styles.listItemUnexpected,
                  ]}
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
                  <View
                    style={[
                      styles.reconcileBadge,
                      isExpected ? styles.reconcileBadgeMatched : styles.reconcileBadgeUnexpected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reconcileBadgeText,
                        !isExpected && styles.reconcileBadgeTextUnexpected,
                      ]}
                    >
                      {isExpected ? 'Khớp' : 'Ngoài bao'}
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
          disabled={!canSubmitUnseal}
          onPress={() => {
            void submitRemoveShipments();
          }}
          style={[
            styles.uploadButton,
            !canSubmitUnseal && styles.uploadButtonDisabled,
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
  manifestLookupRow: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manifestLookupInfo: {
    flex: 1,
    gap: 2,
  },
  manifestLookupTitle: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '800',
  },
  manifestLookupSubtext: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  reloadManifestButton: {
    minWidth: 66,
    minHeight: 34,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  reloadManifestButtonDisabled: {
    opacity: 0.55,
  },
  reloadManifestButtonText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '800',
  },
  reconcileSummary: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  reconcileMetric: {
    flex: 1,
    minHeight: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  reconcileMetricWarning: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
  },
  reconcileMetricDanger: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  reconcileMetricValue: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  reconcileMetricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
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
  listHint: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
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
  listItemUnexpected: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
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
  reconcileBadge: {
    minWidth: 62,
    minHeight: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  reconcileBadgeMatched: {
    backgroundColor: '#DCFCE7',
  },
  reconcileBadgeUnexpected: {
    backgroundColor: '#FEE2E2',
  },
  reconcileBadgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
  },
  reconcileBadgeTextUnexpected: {
    color: '#991B1B',
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
