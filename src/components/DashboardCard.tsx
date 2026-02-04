import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlassPanel from './GlassPanel';

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color?: string;
    style?: ViewStyle;
}

export default function DashboardCard({ title, value, icon, color = THEME.colors.primary, style }: DashboardCardProps) {
    return (
        <GlassPanel style={[styles.card, style]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
            </View>
        </GlassPanel>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: THEME.spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.m,
        borderRadius: THEME.borderRadius.xl,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.m,
    },
    content: {
        flex: 1,
    },
    value: {
        fontSize: 28,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
        marginBottom: 2,
    },
    title: {
        fontSize: 13,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
