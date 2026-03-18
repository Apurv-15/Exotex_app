import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';
import { LineChart } from 'react-native-chart-kit';
import { getRegionColor, calculateDaysRemaining } from '../../constants/dashboard';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardTabProps {
    totalSalesCount: number;
    pendingSalesCount: number;
    activeComplaintCount: number;
    visitGraphData: any;
    filter: string;
    setFilter: (f: any) => void;
    sortOrder: string;
    setSortOrder: (o: any) => void;
    regionStats: any[];
    selectedRegion: string | null;
    setSelectedRegion: (r: string | null) => void;
    displaySales: any[];
    showAllSales: boolean;
    handleViewMoreToggle: () => void;
    setActiveTab: (tab: any) => void;
    navigation: any;
}

export const DashboardTab = React.memo(({
    totalSalesCount,
    pendingSalesCount,
    activeComplaintCount,
    visitGraphData,
    filter,
    setFilter,
    sortOrder,
    setSortOrder,
    regionStats,
    selectedRegion,
    setSelectedRegion,
    displaySales,
    showAllSales,
    handleViewMoreToggle,
    setActiveTab,
    navigation
}: DashboardTabProps) => {
    return (
        <View style={{ paddingHorizontal: 4, marginBottom: 24 }}>
            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statsColumn}>
                    <Pressable
                        style={({ pressed }) => [styles.statBox, { backgroundColor: '#F0F9FF' }, pressed && { opacity: 0.8 }]}
                        onPress={() => setActiveTab('Photos')}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.statBoxValue, { color: '#0EA5E9' }]} numberOfLines={1} adjustsFontSizeToFit>{totalSalesCount}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#0EA5E9" />
                        </View>
                        <Text style={[styles.statBoxLabel, { color: '#0369A1' }]} numberOfLines={1}>Total Warranty</Text>
                    </Pressable>
                </View>

                <View style={styles.statsColumn}>
                    <Pressable
                        style={({ pressed }) => [styles.statBox, { backgroundColor: '#FFFBEB' }, pressed && { opacity: 0.8 }]}
                        onPress={() => setActiveTab('Dashboard')}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.statBoxValue, { color: '#F59E0B' }]} numberOfLines={1} adjustsFontSizeToFit>{pendingSalesCount}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#F59E0B" />
                        </View>
                        <Text style={[styles.statBoxLabel, { color: '#B45309' }]} numberOfLines={1}>Pending Approval</Text>
                    </Pressable>
                </View>

                <View style={[styles.statsColumn, { width: '100%', marginTop: 12 }]}>
                    <Pressable
                        style={({ pressed }) => [styles.statBox, { backgroundColor: '#FEF2F2', paddingVertical: 12 }, pressed && { opacity: 0.8 }]}
                        onPress={() => setActiveTab('Complaints')}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.statBoxValue, { color: '#EF4444' }]} numberOfLines={1} adjustsFontSizeToFit>{activeComplaintCount}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#EF4444" />
                        </View>
                        <Text style={[styles.statBoxLabel, { color: '#B91C1C' }]} numberOfLines={1}>Active Complaints</Text>
                    </Pressable>
                </View>
            </View>

            {/* Visit Analytics Graph */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Visit Analytics</Text>
            </View>
            <GlassPanel style={styles.graphCard}>
                <LineChart
                    data={visitGraphData}
                    width={screenWidth - 80}
                    height={180}
                    fromZero={true}
                    chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        propsForDots: {
                            r: '4',
                            strokeWidth: '2',
                            stroke: '#10B981'
                        },
                        style: { borderRadius: 16 }
                    }}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16, paddingRight: 32 }}
                />
            </GlassPanel>

            {/* Filter Chips */}
            <View style={styles.filterRow}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['All', 'Today', 'Month', 'Year'] as const).map(f => (
                        <Pressable
                            key={f}
                            style={[styles.chip, filter === f && styles.chipActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
                        </Pressable>
                    ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Pressable
                        style={[styles.sortChip, sortOrder === 'newest' && styles.sortChipActive]}
                        onPress={() => setSortOrder('newest')}
                    >
                        <MaterialCommunityIcons
                            name="sort-calendar-descending"
                            size={14}
                            color={sortOrder === 'newest' ? THEME.colors.secondary : THEME.colors.textSecondary}
                        />
                        <Text style={[styles.sortChipText, sortOrder === 'newest' && styles.sortChipTextActive]}>Newest First</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.sortChip, sortOrder === 'oldest' && styles.sortChipActive]}
                        onPress={() => setSortOrder('oldest')}
                    >
                        <MaterialCommunityIcons
                            name="sort-calendar-ascending"
                            size={14}
                            color={sortOrder === 'oldest' ? THEME.colors.secondary : THEME.colors.textSecondary}
                        />
                        <Text style={[styles.sortChipText, sortOrder === 'oldest' && styles.sortChipTextActive]}>Oldest First</Text>
                    </Pressable>
                </View>
            </View>

            {/* Sales Region Performance */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sales Region Performance</Text>
                {selectedRegion && (
                    <Pressable onPress={() => setSelectedRegion(null)}>
                        <Text style={styles.seeAllText}>Clear Filter</Text>
                    </Pressable>
                )}
            </View>

            {regionStats.length === 0 ? (
                <GlassPanel style={styles.emptyState}>
                    <MaterialCommunityIcons name="map-marker-off" size={48} color={THEME.colors.textSecondary} />
                    <Text style={styles.emptyText}>No sales data available</Text>
                </GlassPanel>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.regionScroll}
                    contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                >
                    {regionStats.map(({ region, total, approved }: any) => {
                        const colors = getRegionColor(region);
                        const isSelected = selectedRegion === region;
                        return (
                            <Pressable
                                key={region}
                                onPress={() => setSelectedRegion(isSelected ? null : region)}
                            >
                                <GlassPanel
                                    style={[
                                        styles.regionCard,
                                        isSelected && styles.regionCardSelected,
                                        { width: screenWidth < 380 ? 140 : 160 }
                                    ]}
                                >
                                    <View style={[styles.regionIcon, { backgroundColor: colors.bg }]}>
                                        <MaterialCommunityIcons
                                            name={colors.icon as any}
                                            size={20}
                                            color={colors.text}
                                        />
                                    </View>
                                    <Text style={styles.regionName} numberOfLines={1}>{region}</Text>
                                    <Text style={styles.regionTotal} numberOfLines={1}>{total} Sales</Text>

                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${(approved / (total || 1)) * 100}%` as any, backgroundColor: colors.text }
                                            ]}
                                        />
                                    </View>
                                </GlassPanel>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            )}

            {/* Recent Activity List */}
            <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>
                    {selectedRegion ? `${selectedRegion} Sales` : 'Recent Warranty'}
                </Text>
            </View>

            <GlassPanel style={{ padding: 8 }}>
                {displaySales.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No sales found</Text>
                    </View>
                ) : (
                    <>
                        {(showAllSales ? displaySales : displaySales.slice(0, 3)).map((s, index) => {
                            const countdown = calculateDaysRemaining(s.saleDate);
                            return (
                                <Pressable
                                    key={s.id}
                                    style={({ pressed }) => [
                                        styles.listItem,
                                        pressed && { backgroundColor: 'rgba(0,0,0,0.05)' },
                                        index === (showAllSales ? displaySales.length : 3) - 1 && { borderBottomWidth: 0 }
                                    ]}
                                    onPress={() => navigation.navigate('WarrantyCard', { sale: s })}
                                >
                                    <View style={[styles.listIcon, { backgroundColor: s.status === 'approved' ? THEME.colors.mintLight : '#FFFBEB' }]}>
                                        <MaterialCommunityIcons
                                            name={s.status === 'approved' ? 'check-circle' : 'clock-outline'}
                                            size={20}
                                            color={s.status === 'approved' ? THEME.colors.success : THEME.colors.warning}
                                        />
                                    </View>
                                    <View style={[styles.listContent, { marginRight: 8 }]}>
                                        <Text style={styles.listTitle} numberOfLines={1}>{s.customerName}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={[styles.listSub, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{s.productModel}</Text>
                                            <View style={[styles.countdownBadge, { backgroundColor: countdown.color + '20' }]}>
                                                <Text style={[styles.countdownText, { color: countdown.color }]}>
                                                    {countdown.label}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={[styles.listRight, { minWidth: 60 }]}>
                                        <Text style={styles.listDate}>{new Date(s.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                                        <Text style={styles.listCity} numberOfLines={1}>{s.branchId || s.city}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textSecondary} style={{ marginLeft: 8 }} />
                                </Pressable>
                            );
                        })}

                        {(totalSalesCount > 3 || showAllSales) && (
                            <Pressable
                                onPress={handleViewMoreToggle}
                                style={({ pressed }) => [
                                    styles.viewMoreBtn,
                                    pressed && { opacity: 0.7 }
                                ]}
                            >
                                <Text style={styles.viewMoreText}>
                                    {showAllSales ? 'Show Less' : `View More Transactions (${totalSalesCount - 3} more)`}
                                </Text>
                                <MaterialCommunityIcons
                                    name={showAllSales ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={THEME.colors.primary}
                                />
                            </Pressable>
                        )}
                    </>
                )}
            </GlassPanel>
        </View>
    );
});

const styles = StyleSheet.create({
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statsColumn: { width: '48%' },
    statBox: { padding: 16, borderRadius: 20 },
    statBoxValue: { fontSize: 28, fontWeight: '800' },
    statBoxLabel: { fontSize: 13, fontWeight: '700', marginTop: 4 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: THEME.colors.text },
    graphCard: { padding: 8, borderRadius: 24, marginBottom: 24 },
    filterRow: { marginBottom: 24 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#F1F5F9' },
    chipActive: { backgroundColor: THEME.colors.secondary, borderColor: THEME.colors.secondary },
    chipText: { fontSize: 13, fontWeight: '700', color: THEME.colors.textSecondary },
    chipTextActive: { color: 'white' },
    sortChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F1F5F9' },
    sortChipActive: { backgroundColor: THEME.colors.secondary + '15' },
    sortChipText: { fontSize: 12, fontWeight: '600', color: THEME.colors.textSecondary },
    sortChipTextActive: { color: THEME.colors.secondary },
    seeAllText: { fontSize: 14, fontWeight: '700', color: THEME.colors.secondary },
    regionScroll: { marginHorizontal: -4, marginBottom: 24 },
    regionCard: { padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    regionCardSelected: { borderColor: THEME.colors.secondary, backgroundColor: THEME.colors.mintLight + '20' },
    regionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    regionName: { fontSize: 14, fontWeight: '800', color: THEME.colors.text },
    regionTotal: { fontSize: 11, color: THEME.colors.textSecondary, marginTop: 2 },
    progressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },
    listHeader: { marginBottom: 16 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    listIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.text },
    listSub: { fontSize: 12, color: THEME.colors.textSecondary },
    listRight: { alignItems: 'flex-end' },
    listDate: { fontSize: 11, fontWeight: '700', color: THEME.colors.textSecondary },
    listCity: { fontSize: 10, color: THEME.colors.textSecondary, marginTop: 2 },
    countdownBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    countdownText: { fontSize: 9, fontWeight: '800' },
    viewMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
    viewMoreText: { fontSize: 14, fontWeight: '700', color: THEME.colors.primary },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, color: THEME.colors.textSecondary },
    emptyState: { padding: 40, alignItems: 'center', borderRadius: 24, marginVertical: 20 },
});
