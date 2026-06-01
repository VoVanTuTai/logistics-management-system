import { Vibration } from 'react-native';

type AudioModule = typeof import('expo-audio');
type AudioPlayer = ReturnType<AudioModule['createAudioPlayer']>;
type FeedbackAudio = {
  success: AudioPlayer;
  warning: AudioPlayer;
};

const successSource = require('../assets/sounds/scan-success.wav');
const warningSource = require('../assets/sounds/scan-warning.wav');

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

async function playAudioFeedback(kind: 'success' | 'warning') {
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
    console.warn('[scan-feedback] Unable to play scan sound.', error);
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
