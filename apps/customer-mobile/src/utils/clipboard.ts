import { Clipboard, Platform, ToastAndroid } from 'react-native';

export function copyToClipboard(text: string, label = 'mã vận đơn'): void {
  if (!text) return;
  try {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`Đã sao chép ${label}: ${text}`, ToastAndroid.SHORT);
    }
  } catch {
    // Ignore clipboard error
  }
}

