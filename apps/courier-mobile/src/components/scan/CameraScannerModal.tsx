import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';

interface CameraScannerModalProps {
  visible: boolean;
  title: string;
  helperText?: string;
  onClose: () => void;
  onScanned: (result: BarcodeScanningResult) => void;
}

export function CameraScannerModal({
  visible,
  title,
  helperText,
  onClose,
  onScanned,
}: CameraScannerModalProps): React.JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setHasScanned(false);
    }
  }, [visible]);

  const handleBarCodeScanned = React.useCallback(
    (result: BarcodeScanningResult) => {
      if (hasScanned) {
        return;
      }

      setHasScanned(true);
      onScanned(result);
    },
    [hasScanned, onScanned],
  );

  const canUseCamera = permission?.granted === true;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

          <View style={styles.cameraContainer}>
            {!permission ? (
              <View style={styles.centered}>
                <ActivityIndicator color="#0F172A" />
                <Text style={styles.stateText}>Checking camera permission...</Text>
              </View>
            ) : null}

            {permission && !canUseCamera ? (
              <View style={styles.centered}>
                <Text style={styles.stateText}>
                  Camera permission is required to scan barcode.
                </Text>
                {permission.canAskAgain ? (
                  <Pressable style={styles.secondaryButton} onPress={requestPermission}>
                    <Text style={styles.secondaryButtonText}>Grant permission</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {permission && canUseCamera ? (
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
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => setHasScanned(false)}
            >
              <Text style={styles.primaryButtonText}>Scan again</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  helperText: {
    color: '#475569',
  },
  cameraContainer: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  camera: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  stateText: {
    color: '#E2E8F0',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
