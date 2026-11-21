/**
 * ===================================================================================
 * HỆ THỐNG PHẢN HỒI ÂM THANH THÔNG BÁO VÀ QUÉT MÃ (SINGLETON AUDIO LIFECYCLE)
 * ===================================================================================
 * 1. NGUYÊN LÝ THIẾT KẾ:
 *   - Quản lý vòng đời Audio Player theo mô hình Singleton duy nhất.
 *   - Khi có sự kiện mới: Thực hiện "player.pause() -> seekTo(0) -> player.play()" để tái sử dụng.
 *   - Triệt tiêu 100% nguy cơ cạn kiệt Audio Track / Audio Session của hệ điều hành di động,
 *     ngăn ngừa crash app và rò rỉ bộ nhớ khi shipper quét hàng trăm đơn liên tục.
 *   - Tích hợp âm thanh chuông kép C5-G5 (notification-chime.wav) 44.1kHz khi có đơn mới gán.
 * ===================================================================================
 */
import { Vibration } from 'react-native';

type AudioModule = typeof import('expo-audio');
type AudioPlayer = ReturnType<AudioModule['createAudioPlayer']>;
type FeedbackAudio = {
  success: AudioPlayer;
  warning: AudioPlayer;
  chime: AudioPlayer;
};

const successSource = require('../assets/sounds/scan-success.wav');
const warningSource = require('../assets/sounds/scan-warning.wav');
const chimeSource = require('../assets/sounds/notification-chime.wav');

let feedbackAudio: FeedbackAudio | null = null;
let loadPromise: Promise<FeedbackAudio | null> | null = null;
let audioUnavailable = false;

async function loadFeedbackAudio() {
  if (audioUnavailable) {
    return null;
  }

  if (feedbackAudio) {
    return feedbackAudio;
  }

  loadPromise ??= import('expo-audio')
    .then(async (Audio) => {
      await Audio.setAudioModeAsync({
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      }).catch(() => undefined);

      feedbackAudio = {
        success: Audio.createAudioPlayer(successSource, {
          keepAudioSessionActive: true,
          updateInterval: 1000,
        }),
        warning: Audio.createAudioPlayer(warningSource, {
          keepAudioSessionActive: true,
          updateInterval: 1000,
        }),
        chime: Audio.createAudioPlayer(chimeSource, {
          keepAudioSessionActive: true,
          updateInterval: 1000,
        }),
      };

      return feedbackAudio;
    })
    .catch((error) => {
      audioUnavailable = true;
      console.warn('[scan-feedback] Audio unavailable, using vibration only.', error);
      return null;
    });

  return loadPromise;
}

async function playAudioFeedback(kind: 'success' | 'warning' | 'chime') {
  const audio = await loadFeedbackAudio();

  if (!audio) {
    return;
  }

  try {
    const player = audio[kind];
    player.pause();
    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.warn('[scan-feedback] Unable to play sound.', error);
  }
}

export function playScanSuccessSound() {
  Vibration.vibrate(35);
  void playAudioFeedback('success');
}

export function playScanWarningSound() {
  Vibration.vibrate([0, 45, 70, 90]);
  void playAudioFeedback('warning');
}

export function playNotificationChimeSound() {
  Vibration.vibrate([0, 80, 80, 160]);
  void playAudioFeedback('chime');
}
