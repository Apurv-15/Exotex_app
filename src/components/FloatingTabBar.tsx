import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { THEME } from '../constants/theme';

interface FloatingTabBarProps {
    activeTab: 'home' | 'create' | 'fieldvisit' | 'quotation';
    onTabPress: (tab: 'home' | 'create' | 'fieldvisit' | 'quotation') => void;
}

export default function FloatingTabBar({ activeTab, onTabPress }: FloatingTabBarProps) {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const barMaxWidth = isTablet ? 520 : 360;
    const barHeight = isTablet ? 72 : (Platform.OS === 'ios' ? 64 : 60);
    const iconSize = isTablet ? 26 : 22;
    const labelSize = isTablet ? 11 : 9;

    const TabButton = ({
        tab,
        label,
        icon,
        activeIcon,
        isPlaceholder = false
    }: {
        tab?: 'home' | 'fieldvisit' | 'create' | 'quotation';
        label: string;
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
        isPlaceholder?: boolean;
    }) => {
        const isActive = !isPlaceholder && activeTab === tab;
        return (
            <Pressable
                onPress={() => !isPlaceholder && tab && onTabPress(tab as any)}
                style={({ pressed }) => [
                    styles.tabButton,
                    pressed && !isPlaceholder && { transform: [{ scale: 0.95 }] },
                    isPlaceholder && { opacity: 0.6 }
                ]}
            >
                <MaterialCommunityIcons
                    name={isActive ? activeIcon : icon}
                    size={iconSize}
                    color={isActive ? '#059669' : '#94A3B8'}
                />
                <Text style={[
                    styles.tabLabel,
                    { color: isActive ? '#059669' : '#94A3B8', fontSize: labelSize }
                ]}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    const TabBarContent = () => (
        <View style={[styles.tabBarInner, { height: barHeight }]}>
            <TabButton tab="home" label="Home" icon="view-grid-outline" activeIcon="view-grid" />
            <TabButton tab="quotation" label="Quote" icon="file-document-outline" activeIcon="file-document" />
            <TabButton tab="create" label="Create" icon="plus-box-outline" activeIcon="plus-box" />
            <TabButton tab="fieldvisit" label="Visit" icon="chart-box-outline" activeIcon="chart-bar" />
        </View>
    );

    return (
        <View style={styles.container}>
            {Platform.OS === 'ios' ? (
                <BlurView intensity={90} tint="light" style={[styles.blurContainer, { maxWidth: barMaxWidth, height: barHeight }]}>
                    <TabBarContent />
                </BlurView>
            ) : (
                <View style={[styles.androidContainer, { maxWidth: barMaxWidth, height: barHeight }]}>
                    <TabBarContent />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 15 : 10,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    blurContainer: {
        borderRadius: 35,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...THEME.shadows.small,
    },
    androidContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 35,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    tabBarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    tabLabel: {
        fontFamily: THEME.fonts.bold,
        marginTop: 1,
    },
});
