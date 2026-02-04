import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { THEME } from '../constants/theme';

interface GlassPanelProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
}

export default function GlassPanel({ children, style, intensity = 20 }: GlassPanelProps) {
    if (Platform.OS === 'ios') {
        return (
            <BlurView intensity={intensity} style={[styles.container, style]} tint="light">
                {children}
            </BlurView>
        );
    }

    // Android fallback (or Web) - Semi-transparent background
    return (
        <View style={[styles.container, styles.androidFallback, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: THEME.borderRadius.xl,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        overflow: 'hidden',
        // Common shadow
        ...THEME.shadows.glass,
    },
    androidFallback: {
        backgroundColor: THEME.colors.glassBackground,
    }
});
