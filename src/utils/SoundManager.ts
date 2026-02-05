import { Platform, Vibration } from 'react-native';

// Minimal SoundManager - only vibration, no sound dependencies
class SoundManagerClass {
    // Light vibration for taps on cards/buttons
    async vibrateTap() {
        if (Platform.OS === 'web') return;
        try {
            Vibration.vibrate(10);
        } catch (error) {
            // Silent fail
        }
    }

    // Medium vibration for next step / navigation
    async vibrateNext() {
        if (Platform.OS === 'web') return;
        try {
            Vibration.vibrate(20);
        } catch (error) {
            // Silent fail
        }
    }

    // Success vibration pattern
    async vibrateSuccess() {
        if (Platform.OS === 'web') return;
        try {
            Vibration.vibrate([0, 50, 100, 50]);
        } catch (error) {
            // Silent fail
        }
    }

    // Error vibration pattern
    async vibrateError() {
        if (Platform.OS === 'web') return;
        try {
            Vibration.vibrate([0, 100, 50, 100]);
        } catch (error) {
            // Silent fail
        }
    }

    // Combined methods for backward compatibility
    async init() {
        // No-op - kept for compatibility
    }

    async playTap() {
        // Disabled
    }

    async playNext() {
        // Disabled
    }

    async playSuccess() {
        // Disabled
    }

    async playError() {
        // Disabled
    }

    async playWhoosh() {
        // Disabled
    }
}

export const SoundManager = new SoundManagerClass();
