import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import GlassPanel from './GlassPanel';
import { THEME } from '../constants/theme';
import { Sale } from '../services/SalesService';

const screenWidth = Dimensions.get('window').width;

interface DetailedAnalyticsContentProps {
    sales: Sale[];
}

export default function DetailedAnalyticsContent({ sales }: DetailedAnalyticsContentProps) {
    const [filter, setFilter] = useState<'All' | 'Today' | 'Month' | 'Year'>('All');
    const chartWidth = Platform.OS === 'web' ? Math.min(screenWidth - 40, 600) : screenWidth - 40;

    const filteredSales = useMemo(() => {
        const now = new Date();
        return sales.filter(s => {
            if (filter === 'All') return true;
            const saleDate = new Date(s.saleDate);
            if (filter === 'Today') return saleDate.toDateString() === now.toDateString();
            if (filter === 'Month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            if (filter === 'Year') return saleDate.getFullYear() === now.getFullYear();
            return true;
        });
    }, [sales, filter]);

    // Calculate dynamic data
    const branchStats = filteredSales.reduce((acc: any, sale) => {
        acc[sale.branchId] = (acc[sale.branchId] || 0) + 1;
        return acc;
    }, {});

    const chartData = {
        labels: Object.keys(branchStats).length > 0 ? Object.keys(branchStats) : ["No Data"],
        datasets: [{ data: Object.values(branchStats).length > 0 ? Object.values(branchStats) as number[] : [0] }]
    };

    const productStats = filteredSales.reduce((acc: any, sale) => {
        acc[sale.productModel] = (acc[sale.productModel] || 0) + 1;
        return acc;
    }, {});

    const topProducts = Object.entries(productStats)
        .map(([name, units]: [string, any]) => ({ name, units }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 3);

    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => THEME.colors.secondary,
        labelColor: (opacity = 1) => THEME.colors.textSecondary,
        barPercentage: 0.6,
        decimalPlaces: 0,
        propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: "rgba(0,0,0,0.05)",
        },
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <MaterialCommunityIcons name="chart-box-outline" size={32} color={THEME.colors.secondary} />
                </View>
                <Text style={styles.title}>Detailed Analytics</Text>
                <Text style={styles.subtitle}>Performance overview for {filter}</Text>
            </View>

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

            <GlassPanel style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="office-building" size={24} color={THEME.colors.secondary} />
                    <Text style={styles.cardTitle}>Sales by Branch</Text>
                </View>
                <BarChart
                    data={chartData}
                    width={chartWidth - 40}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars
                    fromZero
                />
            </GlassPanel>

            <GlassPanel style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="trophy-outline" size={24} color={THEME.colors.warning} />
                    <Text style={styles.cardTitle}>Top Selling Models</Text>
                </View>
                {topProducts.length === 0 ? (
                    <Text style={styles.emptyText}>No sales data available</Text>
                ) : (
                    topProducts.map((product, index) => (
                        <View key={index} style={styles.productRow}>
                            <View style={styles.productRank}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{product.name}</Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, {
                                        width: `${(product.units / (topProducts[0]?.units || 1)) * 100}%`,
                                        backgroundColor: index === 0 ? THEME.colors.secondary : index === 1 ? THEME.colors.primary : THEME.colors.mintLight
                                    }]} />
                                </View>
                            </View>
                            <Text style={styles.productUnits}>{product.units}</Text>
                        </View>
                    ))
                )}
            </GlassPanel>

            <GlassPanel style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="information-outline" size={24} color={THEME.colors.secondary} />
                    <Text style={styles.cardTitle}>Overall Stats ({filter})</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Sales Volume</Text>
                    <Text style={styles.summaryValue}>{filteredSales.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Active Warranties</Text>
                    <Text style={styles.summaryValue}>{filteredSales.filter(s => s.warrantyId).length}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Verified Sales</Text>
                    <Text style={styles.summaryValue}>{filteredSales.filter(s => s.status === 'approved').length}</Text>
                </View>
            </GlassPanel>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: THEME.colors.mintLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...THEME.shadows.small
    },
    title: { fontSize: screenWidth < 380 ? 24 : 28, fontFamily: THEME.fonts.black, color: THEME.colors.text, letterSpacing: -0.5 },
    subtitle: { fontSize: screenWidth < 380 ? 12 : 14, fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary, marginTop: 4 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'center' },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)'
    },
    chipActive: {
        backgroundColor: THEME.colors.text,
        borderColor: THEME.colors.text,
        ...THEME.shadows.small
    },
    chipText: { fontSize: 13, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary },
    chipTextActive: { color: '#FFFFFF' },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 28,
        padding: screenWidth < 380 ? 16 : 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        ...THEME.shadows.glass
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    cardTitle: { fontSize: 18, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    chart: {
        borderRadius: 16,
        marginRight: -20,
        marginLeft: -10
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)'
    },
    productRank: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: THEME.colors.mintLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    rankText: { fontSize: 14, fontFamily: THEME.fonts.black, color: THEME.colors.secondary },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontFamily: THEME.fonts.bold, color: THEME.colors.text, marginBottom: 8 },
    progressBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    productUnits: { fontSize: 18, fontFamily: THEME.fonts.black, marginLeft: 16, color: THEME.colors.text },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)'
    },
    summaryLabel: { fontSize: 14, fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary },
    summaryValue: { fontSize: 16, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    emptyText: { textAlign: 'center', fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary, fontSize: 14, paddingVertical: 30 },
});
