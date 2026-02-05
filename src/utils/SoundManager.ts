import { Audio } from 'expo-av';
import { Platform, Vibration } from 'react-native';

type SoundType = 'tap' | 'next' | 'success' | 'error' | 'whoosh';

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

            // Pre-load sounds (optional - app works without them)
            await this.preloadSounds();
        } catch (error) {
            console.warn('Sound init error:', error);
            this.isSoundEnabled = false;
        }
    }

    private async preloadSounds() {
        // Sound files - app works with vibration only if files are missing
        const soundFiles: { [key: string]: any } = {};

        try {
            // Try to load whoosh sound
            soundFiles.whoosh = require('../assets/sounds/whoosh.mp3');
        } catch {
            console.log('Whoosh sound not found - using vibration only');
        }

        try {
            // Try to load success sound
            soundFiles.success = require('../assets/sounds/success.mp3');
        } catch {
            console.log('Success sound not found - using vibration only');
        }

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
            // Silent fail - vibration will still work
        }
    }

    // Light vibration for taps on cards/buttons
    async vibrateTap() {
        if (Platform.OS === 'web') return;
        try {
            Vibration.vibrate(10);
        } catch (error) {
            console.warn('Vibration error:', error);
        }
    }

    // Medium vibration for next step / navigation
    async vibrateNext() {
        if (Platform.OS === 'web') return;
        try {
            Vibration.vibrate(20);
        } catch (error) {
            console.warn('Vibration error:', error);
        }
    }

    // Success vibration pattern
    async vibrateSuccess() {
        if (Platform.OS === 'web') return;
        try {
            // Pattern: wait, vibrate, wait, vibrate (creates a nice success feel)
            Vibration.vibrate([0, 50, 100, 50]);
        } catch (error) {
            console.warn('Vibration error:', error);
        }
    }

    // Error vibration pattern
    async vibrateError() {
        if (Platform.OS === 'web') return;
        try {
            // Pattern: longer vibrations for error (more intense feeling)
            Vibration.vibrate([0, 100, 50, 100]);
        } catch (error) {
            console.warn('Vibration error:', error);
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
