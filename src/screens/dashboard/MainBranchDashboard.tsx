import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/config';
import { SalesService, Sale } from '../../services/SalesService';
import DashboardCard from '../../components/DashboardCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function MainBranchDashboard() {
    const { logout, user } = useAuth();
    const navigation = useNavigation<any>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'All' | 'Today' | 'Month'>('All');

    const fetchSales = async () => {
        try {
            const data = await SalesService.getAllSales();
            setSales(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSales();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSales();
    }, []);

    // Filter Logic
    const filteredSales = sales.filter(s => {
        if (filter === 'All') return true;
        const date = new Date(s.saleDate);
        const now = new Date();
        if (filter === 'Today') {
            return date.toDateString() === now.toDateString();
        }
        if (filter === 'Month') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        return true;
    });

    const totalSales = filteredSales.length;
    const pendingApprovals = filteredSales.filter(s => s.status === 'pending').length;

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
    };

    const productCounts = filteredSales.reduce((acc: any, curr) => {
        acc[curr.productModel] = (acc[curr.productModel] || 0) + 1;
        return acc;
    }, {});

    const pieData = Object.keys(productCounts).map((key, index) => ({
        name: key,
        population: productCounts[key],
        color: index % 2 === 0 ? THEME.colors.primary : THEME.colors.success,
        legendFontColor: "#7F7F7F",
        legendFontSize: 12
    }));

    // Dummy Line Data (would be dynamic in real app)
    const lineData = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
            {
                data: [2, 4, 3, 8, 5, 6, 4],
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Weekly Sales"]
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Admin Dashboard</Text>
                        <Text style={styles.subtitle}>Overview & Analytics</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <MaterialCommunityIcons name="logout" size={24} color={THEME.colors.error} />
                    </TouchableOpacity>
                </View>

                <View style={styles.filterContainer}>
                    {['All', 'Today', 'Month'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.activeChip]}
                            onPress={() => setFilter(f as any)}
                        >
                            <Text style={[styles.chipText, filter === f && styles.activeChipText]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.excludeStats}>
                    <DashboardCard
                        title="Total Sales"
                        value={totalSales}
                        icon="chart-bar"
                        color={THEME.colors.primary}
                        style={{ marginBottom: THEME.spacing.s }}
                    />
                    <DashboardCard
                        title="Pending Approvals"
                        value={pendingApprovals}
                        icon="alert-circle-outline"
                        color="#FF9500"
                        style={{ marginBottom: THEME.spacing.m }}
                    />
                </View>

                <Text style={styles.sectionTitle}>Product Distribution</Text>
                {pieData.length > 0 ? (
                    <View style={styles.chartContainer}>
                        <PieChart
                            data={pieData}
                            width={screenWidth - 48}
                            height={220}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    </View>
                ) : (
                    <Text style={styles.noDataText}>No data for charts</Text>
                )}

                <Text style={styles.sectionTitle}>Sales Trend</Text>
                <View style={styles.chartContainer}>
                    <LineChart
                        data={lineData}
                        width={screenWidth - 48}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                    />
                </View>

                <TouchableOpacity
                    style={styles.fullAnalyticsBtn}
                    onPress={() => navigation.navigate('AnalyticsScreen')}
                >
                    <Text style={styles.fullAnalyticsText}>View Detailed Analytics</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.surface,
    },
    content: {
        padding: THEME.spacing.m,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.l,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: THEME.colors.text,
    },
    subtitle: {
        fontSize: 15,
        color: THEME.colors.textSecondary,
    },
    logoutBtn: {
        padding: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: THEME.spacing.l,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        marginRight: 8,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    activeChip: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    chipText: {
        color: THEME.colors.textSecondary,
        fontWeight: '600',
    },
    activeChipText: {
        color: 'white',
    },
    excludeStats: {
        marginBottom: THEME.spacing.m
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME.colors.text,
        marginTop: THEME.spacing.m,
        marginBottom: THEME.spacing.s,
    },
    chartContainer: {
        backgroundColor: 'white',
        borderRadius: THEME.borderRadius.l,
        padding: THEME.spacing.m,
        alignItems: 'center',
        marginBottom: THEME.spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    noDataText: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
        marginVertical: 20,
    },
    fullAnalyticsBtn: {
        backgroundColor: THEME.colors.text,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: THEME.borderRadius.m,
        marginTop: THEME.spacing.m,
    },
    fullAnalyticsText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    }
});
