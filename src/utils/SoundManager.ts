import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// @ts-ignore
const NotifySound = require('../assets/sounds/notify_sound.mp3');

/**
 * Plays the notify_sound.mp3 on successful form submission.
 * Safe to call on web (no-op) and auto-releases memory after playback.
 */
export async function playNotifySound(): Promise<void> {
    // Web playback is handled differently — skip for now to avoid errors
    if (Platform.OS === 'web') return;

    let sound: Audio.Sound | null = null;
    try {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true, // Play even when ringer is off on iOS
            staysActiveInBackground: false,
        });

        const { sound: loadedSound } = await Audio.Sound.createAsync(NotifySound, {
            shouldPlay: true,
            volume: 0.8,
        });
        sound = loadedSound;

        // Auto-release after playback finishes
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound?.unloadAsync().catch(() => { });
            }
        });
    } catch (error) {
        // Never crash the app over a missing sound
        console.warn('[SoundManager] Could not play notify sound:', error);
    }
}
