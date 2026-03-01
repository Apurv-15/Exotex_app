import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { THEME } from '../constants/theme';

interface FloatingTabBarProps {
    activeTab: 'home' | 'create' | 'fieldvisit' | 'quotation';
    onTabPress: (tab: 'home' | 'create' | 'fieldvisit' | 'quotation') => void;
}

const { width } = Dimensions.get('window');

export default function FloatingTabBar({ activeTab, onTabPress }: FloatingTabBarProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;



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
                    size={22}
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
            <TabButton tab="home" label="Home" icon="view-grid-outline" activeIcon="view-grid" />
            <TabButton tab="quotation" label="Quote" icon="file-document-outline" activeIcon="file-document" />
            <TabButton tab="create" label="Create" icon="plus-box-outline" activeIcon="plus-box" />
            <TabButton tab="fieldvisit" label="Visit" icon="chart-box-outline" activeIcon="chart-bar" />
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
        bottom: Platform.OS === 'ios' ? 15 : 10,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    blurContainer: {
        borderRadius: 35,
        width: '100%',
        maxWidth: 360,
        height: 64,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...THEME.shadows.small,
    },
    androidContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 35,
        width: '100%',
        maxWidth: 360,
        height: 60,
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
        padding: 2,
    },


    tabLabel: {
        fontSize: 9,
        fontFamily: THEME.fonts.bold,
        marginTop: 1,
    },

});

