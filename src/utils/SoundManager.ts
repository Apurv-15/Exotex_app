import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

// @ts-ignore
const NotifySound = require('../assets/sounds/notify_sound.mp3');

/**
 * Plays the notify_sound.mp3 on successful form submission.
 * Extremely resilient: If audio fails for any reason, it fails silently 
 * without affecting the app's performance or UI.
 * 
 * Migrated to expo-audio (SDK 54+) to replace deprecated expo-av.
 */
export async function playNotifySound(): Promise<void> {
    // Web playback or missing audio modules - return immediately
    if (Platform.OS === 'web') return;

    // We wrap the entire process in a try-catch with a focus on non-blocking
    try {
        // Create the audio player
        // The new expo-audio API returns a player immediately
        const player = createAudioPlayer(NotifySound);
        
        // Play the sound
        player.play();

        // Note: expo-audio manages the player lifecycle. 
        // For a short notification sound, we don't need to manually unload 
        // immediately as it's handled by the OS/Package more efficiently now.
        
    } catch (error) {
        // Fatal catch-all: Ensure the app never hangs or crashes due to audio
        console.warn('[SoundManager] Expo Audio failure:', error);
    }
}

