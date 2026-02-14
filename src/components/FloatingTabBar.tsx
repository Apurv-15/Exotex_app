import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { THEME } from '../constants/theme';

interface FloatingTabBarProps {
    activeTab: 'home' | 'create' | 'fieldvisit';
    onTabPress: (tab: 'home' | 'create' | 'fieldvisit') => void;
}

const { width } = Dimensions.get('window');

export default function FloatingTabBar({ activeTab, onTabPress }: FloatingTabBarProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleCenterPress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        onTabPress('create');
    };

    const TabButton = ({
        tab,
        label,
        icon,
        activeIcon,
        isPlaceholder = false
    }: {
        tab?: 'home' | 'fieldvisit' | 'create';
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
                    size={26}
                    color={isActive ? '#059669' : '#94A3B8'}
                />
                <Animated.Text style={[
                    styles.tabLabel,
                    { color: isActive ? '#059669' : '#94A3B8' }
                ]}>
                    {label}
                </Animated.Text>
            </Pressable>
        );
    };

    const TabBarContent = () => (
        <View style={styles.tabBarInner}>
            {/* Left side: Home */}
            <View style={styles.sideGroup}>
                <TabButton tab="home" label="Home" icon="view-grid-outline" activeIcon="view-grid" />
            </View>

            {/* Center: Create */}
            <View style={styles.centerButtonOuter}>
                <Pressable onPress={handleCenterPress} style={{ alignItems: 'center' }}>
                    <Animated.View style={[styles.centerButton, { transform: [{ scale: scaleAnim }] }]}>
                        <MaterialCommunityIcons name="plus" size={32} color="#065F46" />
                    </Animated.View>
                    <Text style={styles.centerLabel}>Create</Text>
                </Pressable>
            </View>

            {/* Right side: Field Visit */}
            <View style={styles.sideGroup}>
                <TabButton tab="fieldvisit" label="Visit" icon="chart-box-outline" activeIcon="chart-bar" />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {Platform.OS === 'ios' ? (
                <BlurView intensity={90} tint="light" style={styles.blurContainer}>
                    <TabBarContent />
                </BlurView>
            ) : (
                <View style={styles.androidContainer}>
                    <TabBarContent />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    blurContainer: {
        borderRadius: 45,
        width: '100%',
        maxWidth: 360,
        height: 80,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...THEME.shadows.small,
    },
    androidContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 45,
        width: '100%',
        maxWidth: 360,
        height: 75,
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
        height: '100%',
        paddingHorizontal: 20,
    },
    sideGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'space-around',
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
    },
    centerButtonOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F7FCF8',
        marginTop: -40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 6,
        borderColor: '#F7FCF8',
        ...THEME.shadows.small,
        shadowRadius: 10,
        shadowOpacity: 0.15,
    },
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#98D8B1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    tabLabel: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
        marginTop: 2,
    },
    centerLabel: {
        fontSize: 11,
        fontFamily: THEME.fonts.bold,
        color: '#065F46',
        marginTop: 2,
    },
});

