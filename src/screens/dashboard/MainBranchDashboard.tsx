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
    const chartWidth = Platform.OS === 'web' ? Math.min(screenWidth - 80, 400) : screenWidth - 80;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Admin Dashboard</Text>
                        <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
                    </View>
                    <Pressable onPress={logout} style={styles.logoutBtn}>
                        <View style={styles.logoutIcon}>
                            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
                        </View>
                    </Pressable>
                </View>

                <View style={styles.filterRow}>
                    {(['All', 'Today', 'Month'] as const).map(f => (
                        <Pressable key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
                            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.stat, { backgroundColor: '#EDE9FE' }]}>
                        <MaterialCommunityIcons name="chart-bar" size={24} color="#7C3AED" />
                        <Text style={[styles.statVal, { color: '#5B21B6' }]}>{totalSales}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={[styles.stat, { backgroundColor: '#D1FAE5' }]}>
                        <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                        <Text style={[styles.statVal, { color: '#059669' }]}>{approved}</Text>
                        <Text style={styles.statLabel}>Approved</Text>
                    </View>
                    <View style={[styles.stat, { backgroundColor: '#FEF3C7' }]}>
                        <MaterialCommunityIcons name="clock" size={24} color="#F59E0B" />
                        <Text style={[styles.statVal, { color: '#B45309' }]}>{pending}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Sales Trend</Text>
                <View style={styles.chartCard}>
                    <LineChart
                        data={{ labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [{ data: [2, 4, 3, 8, 5, 6, 4] }] }}
                        width={chartWidth} height={180} chartConfig={{ backgroundGradientFrom: "#fff", backgroundGradientTo: "#fff", color: (o = 1) => `rgba(124,58,237,${o})` }}
                        bezier style={{ borderRadius: 16 }}
                    />
                </View>

                <Pressable style={styles.analyticsBtn} onPress={() => navigation.navigate('AnalyticsScreen')}>
                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.analyticsBtnInner}>
                        <MaterialCommunityIcons name="chart-areaspline" size={20} color="white" />
                        <Text style={styles.analyticsBtnText}>View Analytics</Text>
                    </LinearGradient>
                </Pressable>

                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {sales.slice(0, 5).map(s => (
                    <View key={s.id} style={styles.activityItem}>
                        <View style={[styles.actIcon, { backgroundColor: s.status === 'approved' ? '#D1FAE5' : '#FEF3C7' }]}>
                            <MaterialCommunityIcons name={s.status === 'approved' ? 'check' : 'clock'} size={16} color={s.status === 'approved' ? '#10B981' : '#F59E0B'} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actTitle}>{s.productModel}</Text>
                            <Text style={styles.actSub}>{s.customerName}</Text>
                        </View>
                        <Text style={styles.actDate}>{s.saleDate}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    content: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    greeting: { fontSize: 26, fontWeight: '700', color: '#1A1A1A' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    logoutBtn: { cursor: 'pointer' } as any,
    logoutIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' },
    chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    chipTextActive: { color: 'white' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    stat: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center' },
    statVal: { fontSize: 28, fontWeight: '700', marginTop: 8 },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
    chartCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 24 },
    analyticsBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
    analyticsBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
    analyticsBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
    activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 14, borderRadius: 14, marginBottom: 10 },
    actIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    actTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    actSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    actDate: { fontSize: 11, color: '#9CA3AF' },
});
