import { Audio } from 'expo-av';
import { Platform } from 'react-native';

type SoundType = 'tap' | 'next' | 'success' | 'error';

class SoundManagerClass {
    private isInitialized = false;
    private isSoundEnabled = true;

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
        } catch (error) {
            console.warn('Sound init error:', error);
            this.isSoundEnabled = false;
        }
    }

    async play(type: SoundType) {
        // Sounds are disabled for now to avoid network errors
        // Can be re-enabled with local sound files
        return;
    }

    async playTap() {
        return;
    }

    async playNext() {
        return;
    }

    async playSuccess() {
        return;
    }

    async playError() {
        return;
    }
}

export const SoundManager = new SoundManagerClass();
