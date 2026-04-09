import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';

interface PendingTabProps {
    pendingSales: any[];
    onNavigate: (screen: string, params?: any) => void;
    onUpdatePayment: (sale: any) => void;
    onSetActiveTab: (tab: any) => void;
    calculateDaysRemaining: (date: string) => any;
    sortOrder: 'newest' | 'oldest';
    setSortOrder: (order: 'newest' | 'oldest') => void;
}

export const SubBranchPendingTab = React.memo(({
    pendingSales,
    onNavigate,
    onUpdatePayment,
    onSetActiveTab,
    calculateDaysRemaining,
    sortOrder,
    setSortOrder
}: PendingTabProps) => {

    const renderPendingItem = ({ item }: { item: any }) => {
        const countdown = calculateDaysRemaining(item.saleDate);
        return (
            <Pressable
                key={item.id || item.invoiceNumber}
                style={styles.listItem}
                onPress={() => onUpdatePayment(item)}
            >
                <View style={[styles.listIcon, { backgroundColor: '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#D97706" />
                </View>
                <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{item.productModel}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.listSub, { flex: 1 }]} numberOfLines={1}>
                            {item.customerName} • {item.city}
                        </Text>
                        <View style={[styles.countdownBadge, { backgroundColor: countdown.color + '20' }]}>
                            <Text style={[styles.countdownText, { color: countdown.color }]}>
                                {countdown.label}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.dateText, { marginTop: 4 }]}>Invoice: {item.invoiceNumber}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={THEME.colors.textSecondary} />
            </Pressable>
        );
    };

    return (
        <View style={{ paddingBottom: 80 }}>
            <View style={styles.recentHeader}>
                <Pressable
                    onPress={() => onSetActiveTab('Dashboard')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={THEME.colors.text} />
                    <Text style={styles.sectionTitle}>Pending Warranties</Text>
                </Pressable>
                <View style={{ backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: '#D97706', fontSize: 10, fontFamily: THEME.fonts.bold }}>{pendingSales.length} Total</Text>
                </View>
            </View>

            <View style={styles.sortContainer}>
                <Pressable
                    onPress={() => setSortOrder('newest')}
                    style={[styles.sortBtn, sortOrder === 'newest' && styles.sortBtnActive]}
                >
                    <MaterialIcons name="arrow-downward" size={16} color={sortOrder === 'newest' ? 'white' : THEME.colors.textSecondary} />
                    <Text style={[styles.sortBtnText, sortOrder === 'newest' && styles.sortBtnTextActive]}>Newest First</Text>
                </Pressable>
                <Pressable
                    onPress={() => setSortOrder('oldest')}
                    style={[styles.sortBtn, sortOrder === 'oldest' && styles.sortBtnActive]}
                >
                    <MaterialIcons name="arrow-upward" size={16} color={sortOrder === 'oldest' ? 'white' : THEME.colors.textSecondary} />
                    <Text style={[styles.sortBtnText, sortOrder === 'oldest' && styles.sortBtnTextActive]}>Oldest First</Text>
                </Pressable>
            </View>

            <GlassPanel style={styles.listContainer}>
                {pendingSales.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="check-all" size={48} color={THEME.colors.success} />
                        <Text style={styles.emptyText}>All sales are processed!</Text>
                    </View>
                ) : (
                    <View>
                        {pendingSales.map((item) => renderPendingItem({ item }))}
                    </View>
                )}
            </GlassPanel>
        </View>
    );
});

const styles = StyleSheet.create({
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontFamily: THEME.fonts.black, color: THEME.colors.text },
    sortContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 4 },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: THEME.colors.glassBackground, borderWidth: 1, borderColor: THEME.colors.glassBorder },
    sortBtnActive: { backgroundColor: THEME.colors.secondary, borderColor: THEME.colors.secondary },
    sortBtnText: { fontSize: 12, color: THEME.colors.textSecondary, fontWeight: '500' },
    sortBtnTextActive: { color: 'white', fontWeight: '600' },
    listContainer: { padding: 8, borderRadius: 24 },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    listIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    listInfo: { flex: 1, paddingRight: 8 },
    listTitle: { fontSize: 14, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    listSub: { fontSize: 10, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary, textTransform: 'uppercase' },
    dateText: { fontSize: 10, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary },
    countdownBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    countdownText: { fontSize: 10, fontFamily: THEME.fonts.bold },
    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: THEME.colors.textSecondary, fontSize: 14, fontFamily: THEME.fonts.semiBold },
});
