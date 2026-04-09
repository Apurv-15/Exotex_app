import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';

interface QuotationsTabProps {
    quotations: any[];
    onNavigate: (screen: string, params?: any) => void;
    onDownloadQuotation: (quotation: any) => void;
    onSetActiveTab: (tab: any) => void;
    sortOrder: 'newest' | 'oldest';
    setSortOrder: (order: 'newest' | 'oldest') => void;
}

export const SubBranchQuotationsTab = React.memo(({
    quotations,
    onNavigate,
    onDownloadQuotation,
    onSetActiveTab,
    sortOrder,
    setSortOrder
}: QuotationsTabProps) => {

    const renderQuotationItem = ({ item, index }: { item: any, index: number }) => {
        return (
            <Pressable
                key={item.id || index.toString()}
                style={({ pressed }) => [
                    styles.listItem,
                    pressed && { backgroundColor: 'rgba(255,255,255,0.4)' },
                ]}
                onPress={() => onDownloadQuotation(item)}
            >
                <View style={[styles.listIcon, { backgroundColor: '#E0F2FE' }]}>
                    <MaterialCommunityIcons
                        name="receipt"
                        size={20}
                        color="#0EA5E9"
                    />
                </View>
                <View style={[styles.listInfo, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.listTitle} numberOfLines={1}>{item.customerName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.countdownBadge, { backgroundColor: '#E0F2FE' }]}>
                            <Text style={[styles.countdownText, { color: '#0EA5E9' }]} numberOfLines={1}>
                                {item.quotationNo || item.id?.slice(0, 8)}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>{new Date(item.createdAt || item.quotationDate).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                    <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
                        <Text style={[styles.amountText, { fontSize: 13, color: THEME.colors.text }]} numberOfLines={1}>
                            ₹{(() => {
                                const rate = parseFloat(item.rate || '0') || 0;
                                const qty = parseFloat(item.qty || '0') || 0;
                                const disc = parseFloat(item.discountPerc || '0') || 0;
                                const discounted = rate * (1 - disc / 100);
                                const total = Math.round((discounted * qty) * 1.18);
                                return total.toLocaleString('en-IN');
                            })()}
                        </Text>
                    </View>
                    <View style={{ padding: 4 }}>
                        <MaterialCommunityIcons name="file-download-outline" size={20} color={THEME.colors.primary} />
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={THEME.colors.textSecondary} />
                </View>
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
                    <Text style={styles.sectionTitle}>Quotations</Text>
                </Pressable>
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

            <GlassPanel style={{ padding: 8 }}>
                {quotations.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="receipt" size={48} color={THEME.colors.textSecondary} />
                        <Text style={styles.emptyText}>No quotations found</Text>
                    </View>
                ) : (
                    <View>
                        {quotations.map((item, index) => renderQuotationItem({ item, index }))}
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
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    listIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    listInfo: { flex: 1, paddingRight: 8 },
    listTitle: { fontSize: 14, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    listSub: { fontSize: 10, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary, textTransform: 'uppercase' },
    dateText: { fontSize: 10, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary },
    amountText: { fontSize: 14, fontFamily: THEME.fonts.black, color: THEME.colors.text },
    countdownBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    countdownText: { fontSize: 10, fontFamily: THEME.fonts.bold },
    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: THEME.colors.textSecondary, fontSize: 14, fontFamily: THEME.fonts.semiBold },
});
