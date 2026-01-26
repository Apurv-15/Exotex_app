import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { SalesService, Sale } from '../../services/SalesService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

export default function MainBranchDashboard() {
    const { logout, user } = useAuth();
    const navigation = useNavigation<any>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [filter, setFilter] = useState<'All' | 'Today' | 'Month'>('All');

    useFocusEffect(useCallback(() => {
        SalesService.getAllSales().then(setSales).catch(console.error);
    }, []));

    const filteredSales = sales.filter(s => {
        if (filter === 'All') return true;
        const date = new Date(s.saleDate);
        const now = new Date();
        if (filter === 'Today') return date.toDateString() === now.toDateString();
        return date.getMonth() === now.getMonth();
    });

    const totalSales = filteredSales.length;
    const pending = filteredSales.filter(s => s.status === 'pending').length;
    const approved = filteredSales.filter(s => s.status === 'approved').length;
    const chartWidth = Platform.OS === 'web' ? Math.min(screenWidth - 40, 600) : screenWidth - 40;

    const totalRevenue = approved * 15000; // Mock calculation: ₹15k per approved sale
    const revenueFormatted = (totalRevenue / 100000).toFixed(1) + 'L';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F0F9FF', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Admin Hub</Text>
                        <Text style={styles.subtitle}>Welcome back, {user?.name}</Text>
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
                                <Text style={styles.mainStatLabel}>Est. Revenue</Text>
                                <MaterialCommunityIcons name="trending-up" size={20} color="rgba(255,255,255,0.6)" />
                            </View>
                            <Text style={styles.mainStatValue}>₹{revenueFormatted}</Text>
                            <View style={styles.statBadge}>
                                <Text style={styles.badgeText}>+{(totalSales * 2).toFixed(1)}%</Text>
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

                {/* Chart Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Performance Trend</Text>
                    <Pressable onPress={() => navigation.navigate('AnalyticsScreen')}>
                        <Text style={styles.seeAllText}>Analyze</Text>
                    </Pressable>
                </View>

                <View style={styles.chartCard}>
                    <LineChart
                        data={{
                            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                            datasets: [{ data: [sales.length + 2, sales.length + 5, sales.length, sales.length + 8, sales.length + 4, sales.length + 10, sales.length + 7] }]
                        }}
                        width={chartWidth - 40}
                        height={180}
                        chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "4", strokeWidth: "2", stroke: "#7C3AED" }
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>

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

                {/* Recent Activity */}
                <Text style={styles.sectionTitle}>Latest Entries</Text>
                {sales.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No activity found</Text>
                    </View>
                ) : (
                    sales.slice(0, 5).map(s => (
                        <View key={s.id} style={styles.activityItem}>
                            <View style={[styles.actIcon, { backgroundColor: s.status === 'approved' ? '#ECFDF5' : '#FFFBEB' }]}>
                                <MaterialCommunityIcons
                                    name={s.status === 'approved' ? 'check-circle' : 'clock-outline'}
                                    size={18}
                                    color={s.status === 'approved' ? '#10B981' : '#F59E0B'}
                                />
                            </View>
                            <View style={styles.actContent}>
                                <Text style={styles.actTitle}>{s.productModel}</Text>
                                <Text style={styles.actSub}>{s.customerName} • {s.branchId}</Text>
                            </View>
                            <Text style={styles.actDate}>{s.saleDate}</Text>
                        </View>
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
    greeting: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    logoutBtn: { cursor: 'pointer' } as any,
    logoutIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
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
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    seeAllText: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
    chartCard: { backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 24, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
    chart: { marginVertical: 8, borderRadius: 16 },
    actionCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
    actionGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    actionIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    actionInfo: { flex: 1, marginLeft: 16 },
    actionTitle: { color: 'white', fontSize: 17, fontWeight: '700' },
    actionSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
    activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: 16, borderRadius: 20, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
    actIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    actContent: { flex: 1 },
    actTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    actSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    actDate: { fontSize: 12, color: '#9CA3AF' },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF', fontSize: 15 },
});
