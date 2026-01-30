import React, { useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface FloatingTabBarProps {
    activeTab: 'home' | 'create' | 'fieldvisit';
    onTabPress: (tab: 'home' | 'create' | 'fieldvisit') => void;
}

export default function FloatingTabBar({ activeTab, onTabPress }: FloatingTabBarProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Subtle pulse animation for center button
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

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
        icon,
        activeIcon
    }: {
        tab: 'home' | 'fieldvisit';
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
    }) => {
        const isActive = activeTab === tab;
        return (
            <Pressable
                onPress={() => onTabPress(tab)}
                style={({ pressed }) => [
                    styles.tabButton,
                    pressed && { transform: [{ scale: 0.95 }] }
                ]}
            >
                <View style={[styles.tabIconContainer, isActive && styles.tabIconActive]}>
                    <MaterialCommunityIcons
                        name={isActive ? activeIcon : icon}
                        size={24}
                        color={isActive ? '#7C3AED' : '#9CA3AF'}
                    />
                </View>
                {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
        );
    };

    const TabBarContent = () => (
        <View style={styles.tabBarInner}>
            {/* Home Tab */}
            <TabButton tab="home" icon="home-outline" activeIcon="home" />

            {/* Center Create Button */}
            <View style={styles.centerButtonContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Pressable onPress={handleCenterPress}>
                        <Animated.View style={[styles.centerButton, { transform: [{ scale: scaleAnim }] }]}>
                            <LinearGradient
                                colors={['#7C3AED', '#5B21B6']}
                                style={styles.centerGradient}
                            >
                                <MaterialCommunityIcons name="plus" size={28} color="white" />
                            </LinearGradient>
                        </Animated.View>
                    </Pressable>
                </Animated.View>
            </View>

            {/* Field Visit Tab */}
            <TabButton tab="fieldvisit" icon="clipboard-text-outline" activeIcon="clipboard-text" />
        </View>
    );

    if (Platform.OS === 'ios') {
        return (
            <View style={styles.container}>
                <BlurView intensity={80} tint="light" style={styles.blurContainer}>
                    <TabBarContent />
                </BlurView>
            </View>
        );
    }

    // For Android and Web - use semi-transparent background
    return (
        <View style={styles.container}>
            <View style={styles.androidContainer}>
                <TabBarContent />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'web' ? 20 : 30,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    blurContainer: {
        borderRadius: 28,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 320,
    },
    androidContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 28,
        width: '100%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    tabBarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    tabIconContainer: {
        padding: 8,
        borderRadius: 16,
    },
    tabIconActive: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#7C3AED',
        marginTop: 4,
    },
    centerButtonContainer: {
        marginTop: -30,
    },
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    centerGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
    },
});
