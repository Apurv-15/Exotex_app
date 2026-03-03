import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// @ts-ignore
const NotifySound = require('../assets/sounds/notify_sound.mp3');

/**
 * Plays the notify_sound.mp3 on successful form submission.
 * Extremely resilient: If audio fails for any reason, it fails silently 
 * without affecting the app's performance or UI.
 */
export async function playNotifySound(): Promise<void> {
    // Web playback or missing audio modules - return immediately
    if (Platform.OS === 'web') return;

    let sound: Audio.Sound | null = null;

    // We wrap the entire process in a single try-catch with a focus on non-blocking
    try {
        // Configure audio mode without awaiting indefinitely
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        }).catch(err => console.warn('[SoundManager] Mode failure:', err));

        // Create and play the sound
        // We use a safe loading pattern
        const result = await Audio.Sound.createAsync(
            NotifySound,
            { shouldPlay: true, volume: 0.8 },
            (status) => {
                // Auto-cleanup when finished
                if (status.isLoaded && status.didJustFinish) {
                    sound?.unloadAsync().catch(() => { });
                }
            }
        ).catch(err => {
            // If creation fails, we just log and move on - no hang
            console.warn('[SoundManager] Load failure:', err);
            return null;
        });

        if (result) {
            sound = result.sound;
        }

    } catch (error) {
        // Fatal catch-all: Ensure the app never hangs or crashes due to audio
        console.warn('[SoundManager] Global silent failure:', error);
    }
}

