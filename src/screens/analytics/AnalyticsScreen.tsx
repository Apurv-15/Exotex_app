import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { SalesService, Sale } from '../../services/SalesService';
import { useAuth } from '../../context/AuthContext';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
import { THEME } from '../../constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
    const { user } = useAuth();
    const chartWidth = Platform.OS === 'web' ? Math.min(screenWidth - 40, 600) : screenWidth - 40;
    const [sales, setSales] = React.useState<Sale[]>([]);

    React.useEffect(() => {
        SalesService.getAllSales().then(allSales => {
            // Filter by branch if user is not Admin
            if (user?.role !== 'Admin') {
                setSales(allSales.filter(s => s.branchId === user?.branchId));
            } else {
                setSales(allSales);
            }
        });
    }, [user]);

    // Calculate dynamic data
    const branchStats = sales.reduce((acc: any, sale) => {
        acc[sale.branchId] = (acc[sale.branchId] || 0) + 1;
        return acc;
    }, {});

    const chartData = {
        labels: Object.keys(branchStats).length > 0 ? Object.keys(branchStats) : ["No Data"],
        datasets: [{ data: Object.values(branchStats).length > 0 ? Object.values(branchStats) as number[] : [0] }]
    };

    const productStats = sales.reduce((acc: any, sale) => {
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
        color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
        barPercentage: 0.6,
        decimalPlaces: 0,
    };

    return (
        <MeshBackground>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <MaterialCommunityIcons name="chart-bar" size={24} color="#7C3AED" />
                    </View>
                    <Text style={styles.title}>Detailed Analytics</Text>
                    <Text style={styles.subtitle}>Branch performance overview</Text>
                </View>

                <GlassPanel style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="office-building" size={20} color="#7C3AED" />
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
                        <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
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
                                            backgroundColor: index === 0 ? '#7C3AED' : index === 1 ? '#10B981' : '#F59E0B'
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
                        <MaterialCommunityIcons name="information-outline" size={20} color="#3B82F6" />
                        <Text style={styles.cardTitle}>Overall Stats</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Sales Volume</Text>
                        <Text style={styles.summaryValue}>{sales.length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Active Warranties</Text>
                        <Text style={styles.summaryValue}>{sales.filter(s => s.warrantyId).length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Verified Sales</Text>
                        <Text style={styles.summaryValue}>{sales.filter(s => s.status === 'approved').length}</Text>
                    </View>
                </GlassPanel>
            </ScrollView>
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
    headerIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
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
    productUnits: { fontSize: 16, fontWeight: '700', marginLeft: 12, color: '#1A1A1A' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    summaryLabel: { fontSize: 14, color: '#6B7280' },
    summaryValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
    emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 20 },
});
