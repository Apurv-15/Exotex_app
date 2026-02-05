import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/theme';

export default function MeshBackground({ children }: { children?: React.ReactNode }) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#D8F3DC', '#E8F8EB', '#F0FAF2', '#F7FCF8', '#FFFFFF']}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    content: {
        flex: 1,
        zIndex: 10,
    },
});
