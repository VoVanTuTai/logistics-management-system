import { Vibration, Platform } from 'react-native';

/**
 * Phát âm thanh thông báo và rung phản hồi (Haptic & Audio Chime)
 * An toàn 100%, tự động fallback khi không có quyền hoặc trên môi trường không hỗ trợ.
 */
export function playCustomerNotificationSound(): void {
  try {
    // 1. Rung phản hồi haptic pattern
    Vibration.vibrate([0, 60, 60, 120]);

    // 2. Âm thanh Web Audio API khi chạy trên nền web/PWA
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Tone 1: C5 (523.25 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.18);

        // Tone 2: G5 (783.99 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.14);
        gain2.gain.setValueAtTime(0.22, now + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.14);
        osc2.stop(now + 0.55);
      }
    }
  } catch (error) {
    // Cơ chế an toàn: không bao giờ để lỗi âm thanh làm sập ứng dụng
    console.warn('[notificationSound] Audio playback skipped:', error);
  }
}
