import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BarcodeScanningResult } from 'expo-camera';

import { theme } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { ScanActionGrid } from '../../components/scan/ScanActionGrid';
import type { ScanActionItemData } from '../../components/scan/ScanActionItem';
import { CameraScannerModal } from '../../components/scan/CameraScannerModal';
import type { AppNavigatorParamList } from '../../navigation/types';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';

const HEADER_GRADIENT_STOPS = [
  '#0A1D36',
  '#0C2340',
  '#112C4F',
  '#15345E',
  '#1A406D',
] as const;

const actions: ScanActionItemData[] = [
  {
    id: 'ky-nhan',
    label: 'Ký nhận',
    iconName: 'document-text-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'ky-nhan-chuyen-hoan',
    label: 'Ký nhận chuyển hoàn',
    iconName: 'return-up-back-outline',
    iconColor: '#0A6E89',
    iconBgColor: '#E1F8FA',
  },
  {
    id: 'nhan-kien',
    label: 'Nhận kiện',
    iconName: 'cube-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'dong-bao',
    label: 'Đóng bao',
    iconName: 'archive-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
  },
  {
    id: 'go-bao',
    label: 'Gỡ bao',
    iconName: 'folder-open-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'phat-hang',
    label: 'Phát hàng',
    iconName: 'paper-plane-outline',
    iconColor: '#0A6E89',
    iconBgColor: '#E1F8FA',
  },
  {
    id: 'van-de',
    label: 'Vấn đề',
    iconName: 'alert-circle-outline',
    iconColor: '#C25B12',
    iconBgColor: '#FFEDD5',
  },
  {
    id: 'gui-kien',
    label: 'Gửi kiện',
    iconName: 'send-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'kien-den',
    label: 'Kiện đến',
    iconName: 'download-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'xe-den',
    label: 'Xe đến',
    iconName: 'car-outline',
    iconColor: '#0A6E89',
    iconBgColor: '#E1F8FA',
  },
  {
    id: 'xe-di',
    label: 'Xe đi',
    iconName: 'car-sport-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'kiem-ton-kho',
    label: 'Kiểm tồn kho',
    iconName: 'clipboard-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
  },
  {
    id: 'nhan-hang-cb',
    label: 'Nhận hàng CB',
    iconName: 'briefcase-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'tem-hang-gia-tri-cao',
    label: 'Tem hàng giá trị cao',
    iconName: 'pricetag-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'kiem-tra-tem-gia-tri-cao',
    label: 'Kiểm tra tem giá trị cao',
    iconName: 'shield-checkmark-outline',
    iconColor: '#0A6E89',
    iconBgColor: '#E1F8FA',
  },
];

export function ScanScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const displayName = session?.user.username ?? 'Courier';
  const hubName = `Mã courier: ${appEnv.courierId}`;

  const [scannerVisible, setScannerVisible] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<ScanActionItemData | null>(
    null,
  );
  const [scannerError, setScannerError] = React.useState<string | null>(null);
  const [lastScanMessage, setLastScanMessage] = React.useState<string | null>(null);

  const handlePressAction = (action: ScanActionItemData) => {
    if (action.id === 'dong-bao') {
      navigation.navigate('BagSeal');
      return;
    }

    setScannerError(null);
    setPendingAction(action);
    setScannerVisible(true);
  };

  const handleCloseScanner = () => {
    setScannerVisible(false);
    setPendingAction(null);
  };

  const handleScanned = (result: BarcodeScanningResult) => {
    if (!pendingAction) {
      return;
    }

    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

    if (!parsed) {
      setScannerError('Không đọc được mã hợp lệ. Vui lòng thử lại.');
      return;
    }

    setScannerVisible(false);
    setLastScanMessage(
      `${pendingAction.label}: ${parsed.format} - ${parsed.value}`,
    );

    if (pendingAction.id === 'nhan-kien') {
      navigation.navigate('PickupScan', {
        shipmentCode: parsed.value,
      });
      setPendingAction(null);
      return;
    }

    if (pendingAction.id === 'kien-den' || pendingAction.id === 'xe-den') {
      navigation.navigate('HubScan', {
        mode: 'INBOUND',
        shipmentCode: parsed.value,
      });
      setPendingAction(null);
      return;
    }

    if (pendingAction.id === 'xe-di' || pendingAction.id === 'gui-kien') {
      navigation.navigate('HubScan', {
        mode: 'OUTBOUND',
        shipmentCode: parsed.value,
      });
      setPendingAction(null);
      return;
    }

    Alert.alert(
      pendingAction.label,
      `Đã quét ${parsed.format}: ${parsed.value}\nTODO: nối API action này khi contract sẵn sàng.`,
    );
    setPendingAction(null);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <CameraScannerModal
          visible={scannerVisible}
          title={pendingAction ? `Quét mã - ${pendingAction.label}` : 'Quét mã'}
          helperText="Bấm action bất kỳ trong grid để mở camera quét QR/barcode."
          onClose={handleCloseScanner}
          onScanned={handleScanned}
        />

        <View style={styles.headerWrap}>
          <View style={styles.gradientLayer}>
            {HEADER_GRADIENT_STOPS.map((color) => (
              <View key={color} style={[styles.gradientBand, { backgroundColor: color }]} />
            ))}
          </View>

          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <View style={styles.userBlock}>
                <Text style={styles.greeting}>Xin chào</Text>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.hubName}>{hubName}</Text>
              </View>

              <View style={styles.scanBadge}>
                <Ionicons name="scan" size={20} color="#D8E7FA" />
                <Text style={styles.scanBadgeText}>Scan Ops</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thao tác quét mã</Text>
            <Text style={styles.sectionSubtitle}>
              Chọn action bất kỳ, camera sẽ mở để quét trước khi xử lý.
            </Text>
          </View>

          {scannerError ? <Text style={styles.errorText}>{scannerError}</Text> : null}
          {lastScanMessage ? <Text style={styles.infoText}>{lastScanMessage}</Text> : null}

          <ScanActionGrid actions={actions} onPressAction={handlePressAction} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerWrap: {
    minHeight: 152,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    ...theme.shadow.md,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBand: {
    flex: 1,
  },
  headerContent: {
    minHeight: 152,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    justifyContent: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  userBlock: {
    flex: 1,
    paddingRight: theme.spacing.xs,
  },
  greeting: {
    ...theme.typography.body.md,
    color: '#C2D8F8',
  },
  userName: {
    ...theme.typography.title.sm,
    color: theme.colors.textInverse,
    marginTop: 2,
  },
  hubName: {
    ...theme.typography.caption.md,
    color: '#AFC5E8',
    marginTop: 4,
  },
  scanBadge: {
    minWidth: 94,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(176, 205, 241, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  scanBadgeText: {
    ...theme.typography.caption.sm,
    color: '#D8E7FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  sectionSubtitle: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  infoText: {
    ...theme.typography.caption.md,
    color: theme.colors.info,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption.md,
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
  },
});
