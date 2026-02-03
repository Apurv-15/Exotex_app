import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Platform, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { SalesService, Sale } from '../../services/SalesService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo.png';

const screenWidth = Dimensions.get('window').width;

// Region colors for visual distinction
const REGION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    'Mumbai': { bg: '#EDE9FE', text: '#7C3AED', icon: 'city' },
    'Delhi': { bg: '#FEF3C7', text: '#B45309', icon: 'city-variant' },
    'Bangalore': { bg: '#D1FAE5', text: '#059669', icon: 'office-building' },
    'Chennai': { bg: '#DBEAFE', text: '#2563EB', icon: 'home-city' },
    'Kolkata': { bg: '#FCE7F3', text: '#DB2777', icon: 'city-variant-outline' },
    'Hyderabad': { bg: '#FEE2E2', text: '#DC2626', icon: 'domain' },
    'Pune': { bg: '#E0E7FF', text: '#4F46E5', icon: 'town-hall' },
    'default': { bg: '#F3F4F6', text: '#6B7280', icon: 'map-marker' },
};

const getRegionColor = (city: string) => REGION_COLORS[city] || REGION_COLORS['default'];

export default function MainBranchDashboard() {
    const { logout, user } = useAuth();
    const navigation = useNavigation<any>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Today' | 'Month'>('All');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        SalesService.getAllSales()
            .then(setSales)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []));

    // Filter by time
    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            if (filter === 'All') return true;
            const date = new Date(s.saleDate);
            const now = new Date();
            if (filter === 'Today') return date.toDateString() === now.toDateString();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
    }, [sales, filter]);

    // Group sales by city/region
    const salesByRegion = useMemo(() => {
        const grouped: Record<string, Sale[]> = {};
        filteredSales.forEach(sale => {
            const region = sale.city || 'Unknown';
            if (!grouped[region]) grouped[region] = [];
            grouped[region].push(sale);
        });
        return grouped;
    }, [filteredSales]);

    // Get region stats
    const regionStats = useMemo(() => {
        return Object.entries(salesByRegion)
            .map(([region, regionSales]) => ({
                region,
                total: regionSales.length,
                approved: regionSales.filter(s => s.status === 'approved').length,
                pending: regionSales.filter(s => s.status === 'pending').length,
            }))
            .sort((a, b) => b.total - a.total);
    }, [salesByRegion]);

    // Display sales (filtered by region if selected)
    const displaySales = selectedRegion
        ? salesByRegion[selectedRegion] || []
        : filteredSales;

    const totalSales = filteredSales.length;
    const pending = filteredSales.filter(s => s.status === 'pending').length;
    const approved = filteredSales.filter(s => s.status === 'approved').length;


    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFFFFF', '#F9FAFB']}
                style={StyleSheet.absoluteFill}
            />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <View style={styles.logoWrapper}>
                            <Image source={LogoImage} style={styles.companyLogo} resizeMode="contain" />
                        </View>
                        <View>
                            <Text style={styles.greeting}>EXOTEX Admin</Text>
                            <Text style={styles.subtitle}>Welcome back, {user?.name}</Text>
                        </View>
                    </View>
                    <Pressable onPress={logout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}>
                        <View style={styles.logoutIcon}>
                            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
                        </View>
                    </Pressable>
                </View>

                {/* Main Stats Bento Grid */}
                <View style={styles.bentoGrid}>
                    <LinearGradient
                        colors={['#4F46E5', '#4338CA']}
                        style={styles.mainStatCard}
                    >
                        <View style={styles.statTop}>
                            <View style={styles.statIconWrapper}>
                                <MaterialCommunityIcons name="chart-bar" size={24} color="#C7D2FE" />
                            </View>
                            <View style={styles.statBadge}>
                                <Text style={styles.badgeText}>+12% vs last month</Text>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.mainStatValue}>{totalSales}</Text>
                            <Text style={styles.mainStatLabel}>Total Units Sold</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.bentoColumn}>
                        <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
                            <Text style={[styles.statBoxValue, { color: '#059669' }]}>{approved}</Text>
                            <Text style={[styles.statBoxLabel, { color: '#059669' }]}>Approved</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                            <Text style={[styles.statBoxValue, { color: '#D97706' }]}>{pending}</Text>
                            <Text style={[styles.statBoxLabel, { color: '#D97706' }]}>Pending</Text>
                        </View>
                    </View>
                </View>

                {/* Filter Chips */}
                <View style={styles.filterRow}>
                    {(['All', 'Today', 'Month'] as const).map(f => (
                        <Pressable
                            key={f}
                            style={[styles.chip, filter === f && styles.chipActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Region-wise Sales Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Region Performance</Text>
                    {selectedRegion && (
                        <Pressable onPress={() => setSelectedRegion(null)}>
                            <Text style={styles.seeAllText}>Clear Filter</Text>
                        </Pressable>
                    )}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
                ) : regionStats.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="map-marker-off" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No sales data available</Text>
                    </View>
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
                                    style={[
                                        styles.regionCard,
                                        isSelected && styles.regionCardSelected
                                    ]}
                                    onPress={() => setSelectedRegion(isSelected ? null : region)}
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
                                                { width: `${(approved / (total || 1)) * 100}%`, backgroundColor: colors.text }
                                            ]}
                                        />
                                    </View>
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
                        <View style={[styles.actionIconCircle, { backgroundColor: '#EEF2FF' }]}>
                            <MaterialCommunityIcons name="chart-timeline-variant" size={24} color="#4F46E5" />
                        </View>
                        <Text style={styles.actionBtnTitle}>Analytics</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => navigation.navigate('TemplateManagement')}
                        style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9 }]}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: '#FDF4FF' }]}>
                            <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#C026D3" />
                        </View>
                        <Text style={styles.actionBtnTitle}>Templates</Text>
                    </Pressable>
                </View>

                {/* Recent Activity List */}
                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>
                        {selectedRegion ? `${selectedRegion} Sales` : 'Recent Transactions'}
                    </Text>
                    {/* <Text style={styles.countBadge}>{displaySales.length}</Text> */}
                </View>

                {displaySales.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No sales found</Text>
                    </View>
                ) : (
                    displaySales.slice(0, 10).map(s => (
                        <Pressable
                            key={s.id}
                            style={({ pressed }) => [
                                styles.listItem,
                                pressed && { backgroundColor: '#F9FAFB' }
                            ]}
                            onPress={() => navigation.navigate('WarrantyCard', { sale: s })}
                        >
                            <View style={[styles.listIcon, { backgroundColor: s.status === 'approved' ? '#ECFDF5' : '#FFFBEB' }]}>
                                <Text style={{ fontSize: 16 }}>
                                    {s.status === 'approved' ? '✅' : '⏳'}
                                </Text>
                            </View>
                            <View style={styles.listContent}>
                                <Text style={styles.listTitle}>{s.customerName}</Text>
                                <Text style={styles.listSub}>{s.productModel}</Text>
                            </View>
                            <View style={styles.listRight}>
                                <Text style={styles.listDate}>{new Date(s.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                                <Text style={styles.listCity}>{s.city}</Text>
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoWrapper: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    companyLogo: {
        width: 32,
        height: 32,
    },
    greeting: { fontSize: 20, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#6B7280', marginTop: 1 },
    logoutBtn: { padding: 8 },
    logoutIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

    bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 28, height: 160 },
    mainStatCard: { flex: 1.6, borderRadius: 24, padding: 20, justifyContent: 'space-between', elevation: 4, shadowColor: '#4F46E5', shadowOpacity: 0.2, shadowOffset: { height: 8, width: 0 }, shadowRadius: 12 },
    statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statIconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    statBadge: { backgroundColor: '#312E81', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#C7D2FE', fontSize: 10, fontWeight: '700' },
    mainStatValue: { color: 'white', fontSize: 36, fontWeight: '800', lineHeight: 40 },
    mainStatLabel: { color: '#C7D2FE', fontSize: 14, fontWeight: '500' },

    bentoColumn: { flex: 1, gap: 12 },
    statBox: { flex: 1, borderRadius: 20, padding: 16, justifyContent: 'center', borderWidth: 1 },
    statBoxValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    statBoxLabel: { fontSize: 12, fontWeight: '600' },

    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
    chipActive: { backgroundColor: '#111827' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
    chipTextActive: { color: 'white' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    seeAllText: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },

    regionScroll: { marginBottom: 32 },
    regionCard: { width: 150, padding: 16, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    regionCardSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
    regionIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    regionName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
    regionTotal: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
    progressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, width: '100%' },
    progressFill: { height: '100%', borderRadius: 2 },

    actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    actionIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionBtnTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },

    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    listIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
    listSub: { fontSize: 13, color: '#6B7280' },
    listRight: { alignItems: 'flex-end' },
    listDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 4, fontWeight: '500' },
    listCity: { fontSize: 11, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },

    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: '#9CA3AF', fontSize: 15 },
});
