import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';

interface FieldVisitsTabProps {
    visits: any[];
    onNavigate: (screen: string, params?: any) => void;
    onDownloadVisit: (visit: any) => void;
    onSetActiveTab: (tab: any) => void;
    sortOrder: 'newest' | 'oldest';
    setSortOrder: (order: 'newest' | 'oldest') => void;
}

export const SubBranchFieldVisitsTab = React.memo(({
    visits,
    onNavigate,
    onDownloadVisit,
    onSetActiveTab,
    sortOrder,
    setSortOrder
}: FieldVisitsTabProps) => {

    const renderVisitItem = ({ item, index }: { item: any, index: number }) => {
        const date = new Date(item.dateOfVisit || item.visitDate || item.createdAt);
        const type = item.propertyType || item.visitType || 'Inspection';
        
        return (
            <View key={item.id || index.toString()} style={styles.listItem}>
                <View style={[styles.listIcon, { backgroundColor: THEME.colors.mintLight }]}>
                    <MaterialCommunityIcons
                        name={type === 'Residential' ? 'home-outline' : 'factory'}
                        size={20}
                        color={THEME.colors.primary}
                    />
                </View>
                <View style={[styles.listInfo, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                        {item.clientCompanyName || item.contactPersonName || item.siteName || item.companyBuildingName || 'Unknown Site'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.listSub, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                            {item.city || item.industryType || 'No Location'}
                        </Text>
                        <View style={[styles.countdownBadge, { backgroundColor: THEME.colors.primary + '15' }]}>
                            <Text style={[styles.countdownText, { color: THEME.colors.primary, fontSize: 10 }]}>
                                {type}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.listAmount, { minWidth: 70 }]}>
                    <Text style={[styles.amountText, { fontSize: 13 }]} numberOfLines={1}>{item.id?.slice(0, 8)}</Text>
                    <Text style={styles.dateText}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                </View>
                <Pressable
                    onPress={() => onDownloadVisit(item)}
                    style={({ pressed }) => [
                        styles.downloadIconBtn,
                        pressed && { opacity: 0.7 }
                    ]}
                >
                    <MaterialCommunityIcons name="file-download-outline" size={22} color={THEME.colors.primary} />
                </Pressable>
                <MaterialCommunityIcons name="chevron-right" size={18} color={THEME.colors.textSecondary} />
            </View>
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
                    <Text style={styles.sectionTitle}>Field Visits</Text>
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

            <GlassPanel style={styles.listContainer}>
                {visits.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={THEME.colors.textSecondary} />
                        <Text style={styles.emptyText}>No field visits found</Text>
                    </View>
                ) : (
                    <View>
                        {visits.map((item, index) => renderVisitItem({ item, index }))}
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
    listAmount: { alignItems: 'flex-end', marginLeft: 12, minWidth: 80 },
    amountText: { fontSize: 14, fontFamily: THEME.fonts.black, color: THEME.colors.text },
    dateText: { fontSize: 10, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary },
    countdownBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    countdownText: { fontSize: 10, fontFamily: THEME.fonts.bold },
    downloadIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: THEME.colors.textSecondary, fontSize: 14, fontFamily: THEME.fonts.semiBold },
});
