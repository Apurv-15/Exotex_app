import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../constants/config';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color?: string;
    style?: ViewStyle;
}

export default function DashboardCard({ title, value, icon, color = THEME.colors.primary, style }: DashboardCardProps) {
    return (
        <View style={[styles.card, style]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: THEME.borderRadius.l,
        padding: THEME.spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: THEME.spacing.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.m,
    },
    content: {
        flex: 1,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: THEME.colors.text,
        marginBottom: 2,
    },
    title: {
        fontSize: 13,
        color: THEME.colors.textSecondary,
        fontWeight: '500',
    },
});
