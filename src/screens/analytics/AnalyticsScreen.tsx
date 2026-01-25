import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
    const chartWidth = Platform.OS === 'web' ? Math.min(screenWidth - 80, 400) : screenWidth - 80;

    const data = {
        labels: ["Branch 1", "Branch 2", "Branch 3", "Branch 4"],
        datasets: [{ data: [20, 45, 28, 80] }]
    };

    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
        barPercentage: 0.6,
    };

    const topProducts = [
        { name: 'Inverter Model X', units: 120, color: '#7C3AED' },
        { name: 'Solar Panel A1', units: 95, color: '#10B981' },
        { name: 'Battery Pack Pro', units: 80, color: '#F59E0B' },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <MaterialCommunityIcons name="chart-bar" size={24} color="#7C3AED" />
                </View>
                <Text style={styles.title}>Detailed Analytics</Text>
                <Text style={styles.subtitle}>Branch performance overview</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="office-building" size={18} color="#7C3AED" />
                    <Text style={styles.cardTitle}>Branch Performance</Text>
                </View>
                <BarChart
                    data={data}
                    width={chartWidth}
                    height={200}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars
                />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="trophy" size={18} color="#F59E0B" />
                    <Text style={styles.cardTitle}>Top Products</Text>
                </View>
                {topProducts.map((product, index) => (
                    <View key={index} style={styles.productRow}>
                        <View style={styles.productRank}>
                            <Text style={styles.rankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${(product.units / 120) * 100}%`, backgroundColor: product.color }]} />
                            </View>
                        </View>
                        <Text style={[styles.productUnits, { color: product.color }]}>{product.units}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="information" size={18} color="#3B82F6" />
                    <Text style={styles.cardTitle}>Summary</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Revenue</Text>
                    <Text style={styles.summaryValue}>₹12,50,000</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Active Warranties</Text>
                    <Text style={styles.summaryValue}>245</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Avg. Daily Sales</Text>
                    <Text style={styles.summaryValue}>12</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 24 },
    headerIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    chart: { borderRadius: 12 },
    productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    productRank: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
    progressBar: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    productUnits: { fontSize: 16, fontWeight: '700', marginLeft: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    summaryLabel: { fontSize: 14, color: '#6B7280' },
    summaryValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
});
