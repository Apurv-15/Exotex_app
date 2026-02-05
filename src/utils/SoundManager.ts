import { Audio } from 'expo-av';
import { Platform, Vibration } from 'react-native';

type SoundType = 'tap' | 'next' | 'success' | 'error' | 'whoosh';

// Try to import Haptics - may not be available in all builds
let Haptics: any = null;
try {
    Haptics = require('expo-haptics');
} catch {
    console.log('expo-haptics not available - using basic vibration');
}

class SoundManagerClass {
    private isInitialized = false;
    private isSoundEnabled = true;
    private loadedSounds: { [key: string]: Audio.Sound } = {};

    async init() {
        if (this.isInitialized || Platform.OS === 'web') return;

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });
            this.isInitialized = true;

            // Try to pre-load sounds (optional - won't crash if files missing)
            await this.preloadSounds();
        } catch (error) {
            console.warn('Sound init error:', error);
            this.isSoundEnabled = false;
        }
    }

    private async preloadSounds() {
        // Sound files are optional - app works with haptics only
        const soundFiles: { [key: string]: any } = {};

        // Sounds disabled until files are added to prevent crashes
        // Uncomment when sound files are available:
        /*
        try {
            // Try to load whoosh sound
            soundFiles.whoosh = require('../assets/sounds/whoosh.mp3');
        } catch {
            console.log('Whoosh sound not found - using haptics only');
        }
        
        try {
            // Try to load success sound
            soundFiles.success = require('../assets/sounds/success.mp3');
        } catch {
            console.log('Success sound not found - using haptics only');
        }
        */

        for (const [key, source] of Object.entries(soundFiles)) {
            try {
                const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
                this.loadedSounds[key] = sound;
            } catch (error) {
                console.warn(`Failed to load ${key} sound:`, error);
            }
        }
    }

    private async playSound(soundKey: string) {
        if (!this.isSoundEnabled || Platform.OS === 'web') return;

        try {
            const sound = this.loadedSounds[soundKey];
            if (sound) {
                await sound.setPositionAsync(0);
                await sound.playAsync();
            }
        } catch (error) {
            // Silent fail - haptics will still work
        }
    }

    // Haptic feedback for taps on cards/buttons
    async vibrateTap() {
        if (Platform.OS === 'web') return;

        try {
            if (Haptics) {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
                Vibration.vibrate(10);
            }
        } catch {
            // Fallback to basic vibration
            Vibration.vibrate(10);
        }
    }

    // Medium haptic for next step / navigation
    async vibrateNext() {
        if (Platform.OS === 'web') return;

        try {
            if (Haptics) {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
                Vibration.vibrate(20);
            }
        } catch {
            Vibration.vibrate(20);
        }
    }

    // Success haptic pattern
    async vibrateSuccess() {
        if (Platform.OS === 'web') return;

        try {
            if (Haptics) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Vibration.vibrate([0, 50, 100, 50]);
            }
        } catch {
            Vibration.vibrate([0, 50, 100, 50]);
        }
    }

    // Error haptic pattern
    async vibrateError() {
        if (Platform.OS === 'web') return;

        try {
            if (Haptics) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else {
                Vibration.vibrate([0, 100, 50, 100]);
            }
        } catch {
            Vibration.vibrate([0, 100, 50, 100]);
        }
    }

    // Combined methods for backward compatibility
    async playTap() {
        await this.vibrateTap();
    }

    async playNext() {
        await this.vibrateNext();
        await this.playSound('whoosh');
    }

    async playSuccess() {
        await this.vibrateSuccess();
        await this.playSound('success');
    }

    async playError() {
        await this.vibrateError();
    }

    // Whoosh effect for form submissions
    async playWhoosh() {
        await this.vibrateNext();
        await this.playSound('whoosh');
    }
}

export const SoundManager = new SoundManagerClass();
