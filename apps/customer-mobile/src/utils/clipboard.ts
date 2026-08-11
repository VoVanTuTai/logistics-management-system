import { Alert, Clipboard } from 'react-native';

export function copyToClipboard(text: string, label = 'mã vận đơn'): void {
  if (!text) return;
  try {
    Clipboard.setString(text);
    Alert.alert('Đã sao chép', `Đã sao chép ${label}: ${text}`);
  } catch {
    Alert.alert('Mã vận đơn', text);
  }
}
