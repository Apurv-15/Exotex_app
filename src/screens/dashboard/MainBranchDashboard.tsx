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
                colors={['#F0F9FF', '#FFFFFF']}
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

                {/* Main Stats Bento Grid */}
                <View style={styles.bentoGrid}>
                    <View style={styles.bentoRow}>
                        <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            style={styles.mainStatCard}
                        >
                            <View style={styles.statHeader}>
                                <Text style={styles.mainStatLabel}>Total Units Sold</Text>
                                <MaterialCommunityIcons name="package-variant" size={20} color="rgba(255,255,255,0.6)" />
                            </View>
                            <Text style={styles.mainStatValue}>{totalSales}</Text>
                            <View style={styles.statBadge}>
                                <Text style={styles.badgeText}>{regionStats.length} Regions</Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.bentoColumn}>
                            <View style={[styles.smallStatCard, { backgroundColor: '#D1FAE5' }]}>
                                <Text style={[styles.smallStatValue, { color: '#059669' }]}>{approved}</Text>
                                <Text style={[styles.smallStatLabel, { color: '#059669' }]}>Approved</Text>
                            </View>
                            <View style={[styles.smallStatCard, { backgroundColor: '#FEF3C7' }]}>
                                <Text style={[styles.smallStatValue, { color: '#B45309' }]}>{pending}</Text>
                                <Text style={[styles.smallStatLabel, { color: '#B45309' }]}>Pending</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Region-wise Sales Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sales by Region</Text>
                    {selectedRegion && (
                        <Pressable onPress={() => setSelectedRegion(null)}>
                            <Text style={styles.seeAllText}>Show All</Text>
                        </Pressable>
                    )}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#7C3AED" style={{ marginVertical: 40 }} />
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
                        contentContainerStyle={{ gap: 12 }}
                    >
                        {regionStats.map(({ region, total, approved, pending }) => {
                            const colors = getRegionColor(region);
                            const isSelected = selectedRegion === region;
                            return (
                                <Pressable
                                    key={region}
                                    style={[
                                        styles.regionCard,
                                        { backgroundColor: colors.bg },
                                        isSelected && styles.regionCardSelected
                                    ]}
                                    onPress={() => setSelectedRegion(isSelected ? null : region)}
                                >
                                    <View style={styles.regionHeader}>
                                        <MaterialCommunityIcons
                                            name={colors.icon as any}
                                            size={24}
                                            color={colors.text}
                                        />
                                        {isSelected && (
                                            <View style={[styles.selectedBadge, { backgroundColor: colors.text }]}>
                                                <MaterialCommunityIcons name="check" size={12} color="white" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.regionName, { color: colors.text }]}>{region}</Text>
                                    <Text style={[styles.regionTotal, { color: colors.text }]}>{total} Sales</Text>
                                    <View style={styles.regionStats}>
                                        <View style={styles.regionStatItem}>
                                            <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                                            <Text style={styles.regionStatText}>{approved}</Text>
                                        </View>
                                        <View style={styles.regionStatItem}>
                                            <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                                            <Text style={styles.regionStatText}>{pending}</Text>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                )}

                {/* Quick Actions */}
                <Pressable
                    onPress={() => navigation.navigate('AnalyticsScreen')}
                    style={({ pressed }) => [styles.actionCard, pressed && { transform: [{ scale: 0.98 }] }]}
                >
                    <LinearGradient
                        colors={['#1F2937', '#111827']}
                        style={styles.actionGradient}
                    >
                        <View style={styles.actionIcon}>
                            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FBBF24" />
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Deep Analytics</Text>
                            <Text style={styles.actionSub}>Check branch performance</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
                    </LinearGradient>
                </Pressable>

                <Pressable
                    onPress={() => navigation.navigate('TemplateManagement')}
                    style={({ pressed }) => [styles.actionCard, pressed && { transform: [{ scale: 0.98 }] }, { marginTop: -8 }]}
                >
                    <LinearGradient
                        colors={['#7C3AED', '#5B21B6']}
                        style={styles.actionGradient}
                    >
                        <View style={styles.actionIcon}>
                            <MaterialCommunityIcons name="file-word-box" size={24} color="white" />
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Warranty Template</Text>
                            <Text style={styles.actionSub}>Customize your .docx template</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
                    </LinearGradient>
                </Pressable>

                {/* Recent Activity / Region Sales */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {selectedRegion ? `${selectedRegion} Sales` : 'Latest Entries'}
                    </Text>
                    <Text style={styles.countBadge}>{displaySales.length}</Text>
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
                                styles.activityItem,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                            ]}
                            onPress={() => navigation.navigate('WarrantyCard', { sale: s })}
                        >
                            <View style={[styles.actIcon, { backgroundColor: s.status === 'approved' ? '#ECFDF5' : '#FFFBEB' }]}>
                                <MaterialCommunityIcons
                                    name={s.status === 'approved' ? 'check-circle' : 'clock-outline'}
                                    size={18}
                                    color={s.status === 'approved' ? '#10B981' : '#F59E0B'}
                                />
                            </View>
                            <View style={styles.actContent}>
                                <Text style={styles.actTitle}>{s.customerName}</Text>
                                <Text style={styles.actSub}>{s.productModel} • {s.city}</Text>
                            </View>
                            <View style={styles.actRight}>
                                <Text style={styles.actDate}>{s.saleDate}</Text>
                                <MaterialCommunityIcons name="chevron-right" size={16} color="#D1D5DB" />
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
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    companyLogo: {
        width: 35,
        height: 35,
    },
    greeting: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    logoutBtn: { cursor: 'pointer' } as any,
    logoutIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: '#E5E7EB' },
    chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    chipTextActive: { color: 'white' },
    bentoGrid: { marginBottom: 24 },
    bentoRow: { flexDirection: 'row', gap: 12 },
    mainStatCard: { flex: 1.5, borderRadius: 24, padding: 20, justifyContent: 'space-between', minHeight: 160, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mainStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
    mainStatValue: { color: 'white', fontSize: 32, fontWeight: '800', marginVertical: 8 },
    statBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
    bentoColumn: { flex: 1, gap: 12 },
    smallStatCard: { flex: 1, borderRadius: 20, padding: 16, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
    smallStatValue: { fontSize: 24, fontWeight: '800' },
    smallStatLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    seeAllText: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
    countBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 13, fontWeight: '700', color: '#7C3AED' },
    regionScroll: { marginBottom: 24 },
    regionCard: { width: 140, padding: 16, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    regionCardSelected: { borderColor: '#7C3AED' },
    regionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    selectedBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    regionName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    regionTotal: { fontSize: 13, fontWeight: '600', opacity: 0.8, marginBottom: 12 },
    regionStats: { flexDirection: 'row', gap: 12 },
    regionStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statDot: { width: 8, height: 8, borderRadius: 4 },
    regionStatText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    actionCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 16, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
    actionGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    actionIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    actionInfo: { flex: 1, marginLeft: 16 },
    actionTitle: { color: 'white', fontSize: 17, fontWeight: '700' },
    actionSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
    activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 20, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6' },
    actIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    actContent: { flex: 1 },
    actTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    actSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    actRight: { alignItems: 'flex-end', gap: 4 },
    actDate: { fontSize: 12, color: '#9CA3AF' },
    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: '#9CA3AF', fontSize: 15 },
});
