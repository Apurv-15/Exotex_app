import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';
import { getRegionColor, calculateDaysPassed } from '../../constants/dashboard';

const { width: screenWidth } = Dimensions.get('window');

interface ComplaintsTabProps {
    complaintRegionStats: any[];
    displayComplaints: any[];
    selectedRegion: string | null;
    setSelectedRegion: (region: string | null) => void;
    setActiveTab: (tab: any) => void;
    handleDownloadComplaint: (complaint: any) => void;
    navigation: any;
    sortOrder: string;
    setSortOrder: (order: any) => void;
}

const SortControls = ({ sortOrder, setSortOrder }: { sortOrder: string; setSortOrder: (order: any) => void }) => (
    <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.tabSwitcherSmall}>
            <Pressable
                onPress={() => setSortOrder('newest')}
                style={[styles.smallTab, sortOrder === 'newest' && styles.smallTabActive]}
            >
                <Text style={[styles.smallTabText, sortOrder === 'newest' && styles.smallTabTextActive]}>Newest</Text>
            </Pressable>
            <Pressable
                onPress={() => setSortOrder('oldest')}
                style={[styles.smallTab, sortOrder === 'oldest' && styles.smallTabActive]}
            >
                <Text style={[styles.smallTabText, sortOrder === 'oldest' && styles.smallTabTextActive]}>Oldest</Text>
            </Pressable>
        </View>
    </View>
);

export const ComplaintsTab = React.memo(({
    complaintRegionStats,
    displayComplaints,
    selectedRegion,
    setSelectedRegion,
    setActiveTab,
    handleDownloadComplaint,
    navigation,
    sortOrder,
    setSortOrder
}: ComplaintsTabProps) => {
    return (
        <View style={{ paddingHorizontal: 4, marginBottom: 24 }}>
            <View style={styles.sectionHeader}>
                <Pressable
                    onPress={() => setActiveTab('Dashboard')}
                    style={({ pressed }) => [
                        { flexDirection: 'row', alignItems: 'center', gap: 8 },
                        pressed && { opacity: 0.7 }
                    ]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.text} />
                    <Text style={styles.sectionTitle}>Back to Dashboard</Text>
                </Pressable>
            </View>
            <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />

            {complaintRegionStats.length === 0 ? (
                <GlassPanel style={styles.emptyState}>
                    <MaterialCommunityIcons name="alert-circle-check-outline" size={48} color={THEME.colors.success} />
                    <Text style={styles.emptyText}>No active complaints! Great job.</Text>
                </GlassPanel>
            ) : (
                <>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={[styles.regionScroll, { marginBottom: 16 }]}
                        contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                    >
                        {complaintRegionStats.map(({ region, total, resolved, unresolved }: any) => {
                            const colors = getRegionColor(region);
                            const isSelected = selectedRegion === region;
                            return (
                                <Pressable key={region} onPress={() => setSelectedRegion(isSelected ? null : region)}>
                                    <GlassPanel
                                        style={[
                                            styles.regionCard,
                                            isSelected && styles.regionCardSelected,
                                            { width: screenWidth < 380 ? 140 : 160 }
                                        ]}
                                    >
                                        <View style={[styles.regionIcon, { backgroundColor: colors.bg }]}>
                                            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.text} />
                                        </View>
                                        <Text style={styles.regionName} numberOfLines={1}>{region}</Text>
                                        <Text style={styles.regionTotal} numberOfLines={1}>{total} Complaints</Text>
                                        <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                                            <View style={{ backgroundColor: THEME.colors.success + '20', paddingHorizontal: 4, borderRadius: 4 }}>
                                                <Text style={{ fontSize: 9, color: THEME.colors.success }}>{resolved} Res</Text>
                                            </View>
                                            <View style={{ backgroundColor: THEME.colors.error + '20', paddingHorizontal: 4, borderRadius: 4 }}>
                                                <Text style={{ fontSize: 9, color: THEME.colors.error }}>{unresolved} Unres</Text>
                                            </View>
                                        </View>
                                    </GlassPanel>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    <GlassPanel style={{ padding: 8 }}>
                        {displayComplaints.map((comp: any, idx: number) => {
                            const daysPassed = calculateDaysPassed(comp.dateOfComplaint);
                            const isResolved = comp.status === 'Resolved' || comp.status === 'Closed';
                            return (
                                <Pressable
                                    key={comp.id || idx}
                                    style={[styles.listItem, idx === displayComplaints.length - 1 && { borderBottomWidth: 0 }]}
                                    onPress={() => navigation.navigate('RaiseComplaintStep2', {
                                        complaint: comp,
                                        clientData: {
                                            invoiceNumber: comp.invoiceNo,
                                            customerName: comp.customerName,
                                            phone: comp.customerPhone,
                                            email: comp.customerEmail,
                                            branchId: (comp as any).branchId || comp.city || (comp as any).branch_id
                                        }
                                    })}
                                >
                                    <View style={[styles.listIcon, { backgroundColor: isResolved ? THEME.colors.mintLight : '#FEE2E2' }]}>
                                        <MaterialCommunityIcons
                                            name={isResolved ? "check-circle" : "alert-circle"}
                                            size={20}
                                            color={isResolved ? THEME.colors.success : THEME.colors.error}
                                        />
                                    </View>
                                    <View style={[styles.listContent, { marginRight: 8, flex: 1 }]}>
                                        <Text style={styles.listTitle} numberOfLines={1}>{comp.customerName}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <View style={[styles.tag, { backgroundColor: isResolved ? THEME.colors.success + '20' : THEME.colors.error + '20' }]}>
                                                <Text style={[styles.tagText, { color: isResolved ? THEME.colors.success : THEME.colors.error }]}>
                                                    {isResolved ? 'Resolved' : 'Unresolved'}
                                                </Text>
                                            </View>
                                            <Text style={styles.listSub} numberOfLines={1} ellipsizeMode="tail">{daysPassed} days passed</Text>
                                        </View>
                                    </View>
                                    <Pressable onPress={() => handleDownloadComplaint(comp)} style={styles.downloadIconBtn}>
                                        <MaterialCommunityIcons name="download" size={20} color={THEME.colors.primary} />
                                    </Pressable>
                                </Pressable>
                            );
                        })}
                    </GlassPanel>
                </>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: THEME.colors.text },
    sortContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    sortLabel: { fontSize: 13, fontWeight: '700', color: THEME.colors.textSecondary },
    tabSwitcherSmall: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 2 },
    smallTab: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
    smallTabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    smallTabText: { fontSize: 12, fontWeight: '600', color: THEME.colors.textSecondary },
    smallTabTextActive: { color: THEME.colors.secondary },
    emptyState: { padding: 40, alignItems: 'center', borderRadius: 24, marginVertical: 20 },
    emptyText: { fontSize: 16, color: THEME.colors.textSecondary, marginTop: 12, textAlign: 'center' },
    regionScroll: { marginHorizontal: -4 },
    regionCard: { padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    regionCardSelected: { borderColor: THEME.colors.secondary, backgroundColor: THEME.colors.mintLight + '20' },
    regionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    regionName: { fontSize: 14, fontWeight: '800', color: THEME.colors.text },
    regionTotal: { fontSize: 11, color: THEME.colors.textSecondary, marginTop: 2 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    listIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.text },
    listSub: { fontSize: 12, color: THEME.colors.textSecondary },
    tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 10, fontWeight: '700' },
    downloadIconBtn: { padding: 8 },
});
