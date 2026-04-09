import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';

interface ComplaintsTabProps {
    complaints: any[];
    onNavigate: (screen: string, params?: any) => void;
    onDownloadComplaint: (complaint: any) => void;
    onSetActiveTab: (tab: any) => void;
    sortOrder: 'newest' | 'oldest';
    setSortOrder: (order: 'newest' | 'oldest') => void;
}

export const SubBranchComplaintsTab = React.memo(({
    complaints,
    onNavigate,
    onDownloadComplaint,
    onSetActiveTab,
    sortOrder,
    setSortOrder
}: ComplaintsTabProps) => {

    const renderComplaintItem = ({ item, index }: { item: any, index: number }) => {
        const isResolved = item.status === 'Resolved' || item.status === 'Closed';
        return (
            <Pressable
                style={styles.listItem}
                onPress={() => onNavigate('RaiseComplaintStep2', {
                    complaint: item,
                    clientData: {
                        invoiceNumber: item.invoiceNo,
                        customerName: item.customerName,
                        phone: item.customerPhone,
                        email: item.customerEmail,
                        city: item.city
                    }
                })}
            >
                <View style={[styles.listIcon, { backgroundColor: isResolved ? THEME.colors.mintLight : '#FEE2E2' }]}>
                    <MaterialIcons
                        name={isResolved ? "check-circle" : "warning"}
                        size={20}
                        color={isResolved ? THEME.colors.success : '#EF4444'}
                    />
                </View>
                <View style={[styles.listInfo, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.listTitle} numberOfLines={1}>{item.customerName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.countdownBadge, { backgroundColor: isResolved ? THEME.colors.success + '20' : '#EF444420' }]}>
                            <Text style={[styles.countdownText, { color: isResolved ? THEME.colors.success : '#EF4444' }]} numberOfLines={1}>
                                {item.status}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>{new Date(item.dateOfComplaint).toLocaleDateString()}</Text>
                    </View>
                </View>
                <Pressable
                    onPress={() => onDownloadComplaint(item)}
                    style={{ padding: 8 }}
                >
                    <MaterialCommunityIcons name="file-download-outline" size={24} color={THEME.colors.primary} />
                </Pressable>
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
                    <Text style={styles.sectionTitle}>Complaints Hub</Text>
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
                {complaints.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="check-circle-outline" size={48} color={THEME.colors.success} />
                        <Text style={styles.emptyText}>No complaints found</Text>
                    </View>
                ) : (
                    <View>
                        {complaints.map((item, index) => renderComplaintItem({ item, index }))}
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
    listHeader: { marginBottom: 16 },
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
