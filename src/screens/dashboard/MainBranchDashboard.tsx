import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Platform, ActivityIndicator, Image, StatusBar } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import { SalesService, Sale } from '../../services/SalesService';
import { FieldVisitService } from '../../services/FieldVisitService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
import DetailedAnalyticsContent from '../../components/DetailedAnalyticsContent';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';
// import { SoundManager } from '../../utils/SoundManager';

const screenWidth = Dimensions.get('window').width;

// Region colors for visual distinction (updated for mint theme)
const REGION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    'Mumbai': { bg: '#D1FAE5', text: '#059669', icon: 'city' },
    'Delhi': { bg: '#FEF3C7', text: '#D97706', icon: 'city-variant' },
    'Bangalore': { bg: '#E0E7FF', text: '#4F46E5', icon: 'office-building' },
    'Chennai': { bg: '#DBEAFE', text: '#2563EB', icon: 'home-city' },
    'Kolkata': { bg: '#FCE7F3', text: '#DB2777', icon: 'city-variant-outline' },
    'Hyderabad': { bg: '#FFEDD5', text: '#EA580C', icon: 'domain' },
    'Pune': { bg: '#F3E8FF', text: '#9333EA', icon: 'town-hall' },
    'default': { bg: '#F3F4F6', text: '#6B7280', icon: 'map-marker' },
};

const getRegionColor = (city: string) => REGION_COLORS[city] || REGION_COLORS['default'];

export default function MainBranchDashboard() {
    const { logout, user } = useAuth();
    const navigation = useNavigation<any>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [fieldVisits, setFieldVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Today' | 'Month' | 'Year'>('All');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [allVisits, setAllVisits] = useState<any[]>([]);
    const [showAllSales, setShowAllSales] = useState(false);
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');

    const fetchData = useCallback(async (isInitial: boolean = true) => {
        if (isInitial) setLoading(true);

        try {
            const [salesData, visitsData] = await Promise.all([
                SalesService.getAllSales(),
                FieldVisitService.getFieldVisits()
            ]);

            setAllSales(salesData);
            setAllVisits(visitsData);

            // Set initial display sales
            setSales(salesData);
            setFieldVisits(visitsData.slice(0, 5));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchData(true);
    }, [fetchData]));

    const handleViewMoreToggle = () => {
        setShowAllSales(!showAllSales);
    };

    // Filter by time
    const filteredSales = useMemo(() => {
        const now = new Date();
        return allSales.filter(s => {
            if (filter === 'All') return true;
            const date = new Date(s.saleDate);
            if (filter === 'Today') return date.toDateString() === now.toDateString();
            if (filter === 'Month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            if (filter === 'Year') return date.getFullYear() === now.getFullYear();
            return true;
        });
    }, [allSales, filter]);

    const filteredVisits = useMemo(() => {
        const now = new Date();
        return allVisits.filter(v => {
            const visitDate = new Date(v.visitDate);
            if (filter === 'All') return true;
            if (filter === 'Today') return visitDate.toDateString() === now.toDateString();
            if (filter === 'Month') return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
            if (filter === 'Year') return visitDate.getFullYear() === now.getFullYear();
            return true;
        });
    }, [allVisits, filter]);

    // Display sales (filtered by region if selected)
    const displaySales = useMemo(() => {
        let list = filteredSales;
        if (selectedRegion) {
            list = list.filter(s => s.city === selectedRegion);
        }
        return list;
    }, [filteredSales, selectedRegion]);

    const totalSalesCount = filteredSales.length;
    const totalVisitsCount = filteredVisits.length;
    const pendingVisitsCount = filteredVisits.filter(v => v.status === 'pending').length;
    const approvedSalesCount = filteredSales.filter(s => s.status === 'approved').length;

    // Real data for visit analytics graph
    const visitGraphData = useMemo(() => {
        // Get last 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const labels: string[] = [];
        const counts: number[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(days[date.getDay()]);

            // Count visits for this day
            const dayVisits = fieldVisits.filter(visit => {
                const visitDate = new Date(visit.visitDate);
                return visitDate.toDateString() === date.toDateString();
            }).length;

            counts.push(dayVisits);
        }

        return {
            labels,
            datasets: [{
                data: counts,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                strokeWidth: 2
            }]
        };
    }, [allVisits]); // Using allVisits for context of last 7 days

    // Calculate top selling models from filtered sales
    const topSellingModels = useMemo(() => {
        const productStats = filteredSales.reduce((acc: any, sale) => {
            acc[sale.productModel] = (acc[sale.productModel] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(productStats)
            .map(([name, units]: [string, any]) => ({ name, units }))
            .sort((a, b) => b.units - a.units)
            .slice(0, 3);
    }, [filteredSales]);

    // Region stats from filtered data
    const regionStats = useMemo(() => {
        const grouped: Record<string, { region: string; total: number; approved: number; pending: number }> = {};
        filteredSales.forEach(item => {
            const region = item.city || 'Unknown';
            if (!grouped[region]) {
                grouped[region] = { region, total: 0, approved: 0, pending: 0 };
            }
            grouped[region].total++;
            if (item.status === 'approved') grouped[region].approved++;
            if (item.status === 'pending') grouped[region].pending++;
        });
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [filteredSales]);

    const visitRegionStats = useMemo(() => {
        const grouped: Record<string, { region: string; total: number; completed: number; pending: number }> = {};
        filteredVisits.forEach(item => {
            const region = item.city || 'Unknown';
            if (!grouped[region]) {
                grouped[region] = { region, total: 0, completed: 0, pending: 0 };
            }
            grouped[region].total++;
            if (item.status === 'completed') grouped[region].completed++;
            if (item.status === 'pending') grouped[region].pending++;
        });
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [filteredVisits]);


    return (
        <MeshBackground>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <GlassPanel style={styles.logoWrapper} intensity={40}>
                            <Image source={LogoImage} style={styles.companyLogo} resizeMode="contain" />
                        </GlassPanel>
                        <View>
                            <Text style={styles.greeting}>EXOTEX Admin</Text>
                            <Text style={styles.subtitle}>Welcome back, {user?.name}</Text>
                        </View>
                    </View>
                    <Pressable onPress={logout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}>
                        <GlassPanel style={styles.logoutIcon}>
                            <MaterialCommunityIcons name="logout" size={20} color={THEME.colors.error} />
                        </GlassPanel>
                    </Pressable>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <GlassPanel style={styles.tabSwitcher} intensity={30}>
                        <Pressable
                            onPress={() => setActiveTab('Dashboard')}
                            style={[styles.tabButton, activeTab === 'Dashboard' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, activeTab === 'Dashboard' && styles.tabButtonTextActive]}>Dashboard</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveTab('Analytics')}
                            style={[styles.tabButton, activeTab === 'Analytics' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, activeTab === 'Analytics' && styles.tabButtonTextActive]}>Analytics</Text>
                        </Pressable>
                    </GlassPanel>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <GlassPanel style={styles.loadingPanel}>
                            <ActivityIndicator size="large" color={THEME.colors.secondary} />
                            <Text style={styles.loadingText}>Loading dashboard data...</Text>
                        </GlassPanel>
                    </View>
                ) : activeTab === 'Dashboard' ? (
                    <>
                        {/* Main Stats Bento Grid */}
                        <View style={styles.bentoGrid}>
                            <LinearGradient
                                colors={[THEME.colors.secondary, '#58A47D']}
                                style={styles.mainStatCard}
                            >
                                <View style={styles.statTop}>
                                    <View style={styles.statIconWrapper}>
                                        <MaterialCommunityIcons name="chart-bar" size={24} color={THEME.colors.mintLight} />
                                    </View>
                                    <View style={styles.statBadge}>
                                        <Text style={styles.badgeText}>+12%</Text>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.mainStatValue}>{totalSalesCount}</Text>
                                    <Text style={styles.mainStatLabel}>Total Units Sold</Text>
                                </View>
                            </LinearGradient>

                            <View style={styles.bentoColumn}>
                                <GlassPanel style={[styles.statBox, { backgroundColor: THEME.colors.mintLight + '80' }]}>
                                    <Text style={[styles.statBoxValue, { color: '#047857' }]}>{totalVisitsCount}</Text>
                                    <Text style={[styles.statBoxLabel, { color: '#065F46' }]}>Field Visits</Text>
                                </GlassPanel>
                                <GlassPanel style={[styles.statBox, { backgroundColor: '#FEF3C780' }]}>
                                    <Text style={[styles.statBoxValue, { color: '#D97706' }]}>{pendingVisitsCount}</Text>
                                    <Text style={[styles.statBoxLabel, { color: '#B45309' }]}>Pending Visits</Text>
                                </GlassPanel>
                            </View>
                        </View>

                        {/* Visit Analytics Graph */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Visit Analytics</Text>
                        </View>
                        <GlassPanel style={styles.graphCard}>
                            <LineChart
                                data={visitGraphData}
                                width={screenWidth - 48}
                                height={180}
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
                                    style: {
                                        borderRadius: 16
                                    }
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16,
                                    paddingRight: 40
                                }}
                            />
                        </GlassPanel>

                        {/* Filter Chips */}
                        <View style={styles.filterRow}>
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

                        {/* Visit Region Performance */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Visit Hubs (Region Wise)</Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginVertical: 40 }} />
                        ) : visitRegionStats.length === 0 ? (
                            <GlassPanel style={styles.emptyState}>
                                <MaterialCommunityIcons name="map-marker-off" size={48} color={THEME.colors.textSecondary} />
                                <Text style={styles.emptyText}>No visit data available</Text>
                            </GlassPanel>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.regionScroll}
                                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                            >
                                {visitRegionStats.map(({ region, total, completed, pending }) => {
                                    const colors = getRegionColor(region);
                                    return (
                                        <GlassPanel
                                            key={region}
                                            style={styles.regionCard}
                                        >
                                            <View style={[styles.regionIcon, { backgroundColor: colors.bg }]}>
                                                <MaterialCommunityIcons
                                                    name={colors.icon as any}
                                                    size={20}
                                                    color={colors.text}
                                                />
                                            </View>
                                            <Text style={styles.regionName}>{region}</Text>
                                            <Text style={styles.regionTotal}>{total} Visits</Text>

                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${(completed / (total || 1)) * 100}%` as any, backgroundColor: colors.text }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={{ fontSize: 10, color: THEME.colors.textSecondary, marginTop: 4 }}>
                                                {completed} Done • {pending} Left
                                            </Text>
                                        </GlassPanel>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Sales Region Performance */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Sales Region Performance</Text>
                            {selectedRegion && (
                                <Pressable onPress={() => setSelectedRegion(null)}>
                                    <Text style={styles.seeAllText}>Clear Filter</Text>
                                </Pressable>
                            )}
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginVertical: 40 }} />
                        ) : regionStats.length === 0 ? (
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
                                {regionStats.map(({ region, total, approved, pending }) => {
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
                                                    isSelected && styles.regionCardSelected
                                                ]}
                                            >
                                                <View style={[styles.regionIcon, { backgroundColor: colors.bg }]}>
                                                    <MaterialCommunityIcons
                                                        name={colors.icon as any}
                                                        size={20}
                                                        color={colors.text}
                                                    />
                                                </View>
                                                <Text style={styles.regionName}>{region}</Text>
                                                <Text style={styles.regionTotal}>{total} Sales</Text>

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

                        {/* Quick Actions */}
                        <View style={styles.actionGrid}>
                            <Pressable
                                onPress={() => navigation.navigate('AnalyticsScreen')}
                                style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9 }]}
                            >
                                <GlassPanel style={styles.actionPanel}>
                                    <View style={[styles.actionIconCircle, { backgroundColor: '#EEF2FF' }]}>
                                        <MaterialCommunityIcons name="chart-timeline-variant" size={24} color="#4F46E5" />
                                    </View>
                                    <Text style={styles.actionBtnTitle}>Analytics</Text>
                                </GlassPanel>
                            </Pressable>

                            <Pressable
                                onPress={() => navigation.navigate('TemplateManagement')}
                                style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9 }]}
                            >
                                <GlassPanel style={styles.actionPanel}>
                                    <View style={[styles.actionIconCircle, { backgroundColor: '#FDF4FF' }]}>
                                        <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#C026D3" />
                                    </View>
                                    <Text style={styles.actionBtnTitle}>Templates</Text>
                                </GlassPanel>
                            </Pressable>
                        </View>



                        {/* Recent Activity List */}
                        <View style={styles.listHeader}>
                            <Text style={styles.sectionTitle}>
                                {selectedRegion ? `${selectedRegion} Sales` : 'Recent Warranty'}
                            </Text>
                        </View>

                        {displaySales.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No sales found</Text>
                            </View>
                        ) : (
                            <GlassPanel style={{ padding: 8 }}>
                                {(showAllSales ? displaySales : displaySales.slice(0, 3)).map((s, index) => (
                                    <Pressable
                                        key={s.id}
                                        style={({ pressed }) => [
                                            styles.listItem,
                                            pressed && { backgroundColor: 'rgba(255,255,255,0.4)' },
                                            index === displaySales.length - 1 && { borderBottomWidth: 0 }
                                        ]}
                                        onPress={() => navigation.navigate('WarrantyCard', { sale: s })}
                                    >
                                        <View style={[styles.listIcon, { backgroundColor: s.status === 'approved' ? THEME.colors.mintLight : '#FFFBEB' }]}>
                                            <View style={styles.statusIndicator}>
                                                <MaterialCommunityIcons
                                                    name={s.status === 'approved' ? 'check-circle' : 'clock-outline'}
                                                    size={20}
                                                    color={s.status === 'approved' ? THEME.colors.success : THEME.colors.warning}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.listContent}>
                                            <Text style={styles.listTitle}>{s.customerName}</Text>
                                            <Text style={styles.listSub}>{s.productModel}</Text>
                                        </View>
                                        <View style={styles.listRight}>
                                            <Text style={styles.listDate}>{new Date(s.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                                            <Text style={styles.listCity}>{s.city}</Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textSecondary} style={{ marginLeft: 8 }} />
                                    </Pressable>
                                ))}

                                {/* View More / Show Less Button */}
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
                            </GlassPanel>
                        )}
                    </>
                ) : (
                    <DetailedAnalyticsContent sales={allSales} />
                )}
            </ScrollView>
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 40, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoWrapper: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    companyLogo: {
        width: 32,
        height: 32,
    },
    greeting: { fontSize: 20, fontFamily: THEME.fonts.bold, color: THEME.colors.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: THEME.colors.textSecondary, marginTop: 1 },
    logoutBtn: {},
    logoutIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 28, height: 160 },
    mainStatCard: { flex: 1.6, borderRadius: 24, padding: 20, justifyContent: 'space-between', elevation: 4, shadowColor: THEME.colors.secondary, shadowOpacity: 0.4, shadowOffset: { height: 8, width: 0 }, shadowRadius: 12 },
    statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statIconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    statBadge: { backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: 'white', fontSize: 10, fontFamily: THEME.fonts.bold },
    mainStatValue: { color: 'white', fontSize: 36, fontFamily: THEME.fonts.black, lineHeight: 40 },
    mainStatLabel: { color: THEME.colors.mintLight, fontSize: 14, fontFamily: THEME.fonts.semiBold },

    graphCard: { padding: 16, borderRadius: 24, marginBottom: 28, backgroundColor: 'rgba(255,255,255,0.7)' },

    bentoColumn: { flex: 1, gap: 12 },
    statBox: { flex: 1, borderRadius: 20, padding: 16, justifyContent: 'center' },
    statBoxValue: { fontSize: 20, fontFamily: THEME.fonts.black, marginBottom: 2 },
    statBoxLabel: { fontSize: 12, fontFamily: THEME.fonts.bold },

    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'transparent' },
    chipActive: { backgroundColor: THEME.colors.text },
    chipText: { fontSize: 13, fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary },
    chipTextActive: { color: 'white' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    seeAllText: { fontSize: 13, color: THEME.colors.secondary, fontFamily: THEME.fonts.bold },

    regionScroll: { marginBottom: 32 },
    regionCard: { width: 150, padding: 16, borderRadius: 20, marginRight: 0 },
    regionCardSelected: { borderColor: THEME.colors.secondary, borderWidth: 2 },
    regionIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    regionName: { fontSize: 15, fontFamily: THEME.fonts.bold, color: THEME.colors.text, marginBottom: 2 },
    regionTotal: { fontSize: 13, color: THEME.colors.textSecondary, marginBottom: 12 },
    progressBar: { height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, width: '100%' },
    progressFill: { height: '100%', borderRadius: 2 },

    actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    actionButton: { flex: 1 },
    actionPanel: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20 },
    actionIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionBtnTitle: { fontSize: 15, fontFamily: THEME.fonts.bold, color: THEME.colors.text },

    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8 },
    listIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 15, fontFamily: THEME.fonts.bold, color: THEME.colors.text, marginBottom: 2 },
    listSub: { fontSize: 13, color: THEME.colors.textSecondary },
    listRight: { alignItems: 'flex-end' },
    listDate: { fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 4, fontFamily: THEME.fonts.semiBold },
    listCity: { fontSize: 11, color: THEME.colors.textSecondary, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },

    emptyState: { padding: 40, alignItems: 'center', gap: 12, borderRadius: 20 },
    emptyText: { color: THEME.colors.textSecondary, fontSize: 15, fontFamily: THEME.fonts.semiBold },
    statusIndicator: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 4,
    },
    viewMoreText: {
        fontSize: 13,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.primary,
    },
    topModelsCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 32
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    productRank: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    rankText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold
    },
    productInfo: { flex: 1 },
    productName: {
        fontSize: 15,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
        marginBottom: 6
    },
    productProgressBar: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden'
    },
    productProgressFill: {
        height: '100%',
        borderRadius: 3
    },
    productUnits: {
        fontSize: 18,
        fontFamily: THEME.fonts.black,
        marginLeft: 12,
        color: THEME.colors.text
    },
    tabContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    tabSwitcher: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        width: '100%',
        maxWidth: 320,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 100,
    },
    tabButtonActive: {
        backgroundColor: '#FFFFFF',
        ...THEME.shadows.small,
    },
    tabButtonText: {
        fontSize: 15,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
    },
    tabButtonTextActive: {
        color: THEME.colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
        paddingVertical: 60,
    },
    loadingPanel: {
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
        marginTop: 8,
    },
});
