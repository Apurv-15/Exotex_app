import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface AnalyticsTabProps {
    totalSales: number;
    monthlySales: number;
    totalVisits: number;
    resolvedComplaints: number;
    topModels: { name: string, units: number }[];
    visitChartData: any;
    onSetActiveTab: (tab: any) => void;
}

export const SubBranchAnalyticsTab = React.memo(({
    totalSales,
    monthlySales,
    totalVisits,
    resolvedComplaints,
    topModels,
    visitChartData,
    onSetActiveTab
}: AnalyticsTabProps) => {
    return (
        <View style={{ paddingBottom: 80 }}>
            <View style={styles.recentHeader}>
                <Pressable
                    onPress={() => onSetActiveTab('Dashboard')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={THEME.colors.text} />
                    <Text style={styles.sectionTitle}>Performance Analytics</Text>
                </Pressable>
            </View>

            {/* Performance Overview */}
            <View style={styles.statsOverview}>
                <GlassPanel style={styles.analyticsCard}>
                    <Text style={styles.cardLabel}>Monthly Performance</Text>
                    <Text style={styles.cardValue}>{monthlySales}</Text>
                    <Text style={styles.cardSub}>Units sold this month</Text>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: '65%', backgroundColor: THEME.colors.secondary }]} />
                    </View>
                </GlassPanel>

                <GlassPanel style={[styles.analyticsCard, { backgroundColor: THEME.colors.primary + '10' }]}>
                    <Text style={styles.cardLabel}>Service Efficiency</Text>
                    <Text style={[styles.cardValue, { color: THEME.colors.primary }]}>{resolvedComplaints}</Text>
                    <Text style={styles.cardSub}>Complaints resolved</Text>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: '80%', backgroundColor: THEME.colors.primary }]} />
                    </View>
                </GlassPanel>
            </View>

            {/* Visit Trends Chart */}
            <Text style={styles.subHeader}>Field Visit Trends (Last 7 Days)</Text>
            <GlassPanel style={styles.chartPanel}>
                <LineChart
                    data={visitChartData}
                    width={screenWidth - 48}
                    height={200}
                    chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: { r: '4', strokeWidth: '2', stroke: '#10B981' }
                    }}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                />
            </GlassPanel>

            {/* Top Products */}
            <Text style={[styles.subHeader, { marginTop: 24 }]}>Top Selling Models</Text>
            <GlassPanel style={styles.listContainer}>
                {topModels.length === 0 ? (
                    <Text style={styles.emptyText}>No sales data for products</Text>
                ) : (
                    topModels.map((item, index) => (
                        <View key={index} style={[styles.productRow, index === topModels.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={[styles.modelIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                <Text style={styles.modelRank}>{index + 1}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.modelName}>{item.name}</Text>
                                <Text style={styles.modelUnits}>{item.units} Units sold</Text>
                            </View>
                            <View style={styles.percentageBox}>
                                <Text style={styles.percentageText}>
                                    {Math.round((item.units / totalSales) * 100)}%
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </GlassPanel>
        </View>
    );
});

const styles = StyleSheet.create({
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontFamily: THEME.fonts.black, color: THEME.colors.text },
    statsOverview: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    analyticsCard: { flex: 1, padding: 16, borderRadius: 20 },
    cardLabel: { fontSize: 10, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary, letterSpacing: 0.5 },
    cardValue: { fontSize: 24, fontFamily: THEME.fonts.black, color: THEME.colors.secondary, marginTop: 4 },
    cardSub: { fontSize: 10, fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary, marginTop: 2 },
    progressContainer: { height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 2 },
    subHeader: { fontSize: 14, fontFamily: THEME.fonts.bold, color: THEME.colors.text, marginBottom: 12, marginLeft: 4 },
    chartPanel: { padding: 8, borderRadius: 24, alignItems: 'center' },
    listContainer: { padding: 8, borderRadius: 24 },
    productRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    modelIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    modelRank: { fontSize: 12, fontFamily: THEME.fonts.black, color: THEME.colors.secondary },
    modelName: { fontSize: 14, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    modelUnits: { fontSize: 11, fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary },
    percentageBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: THEME.colors.mintLight },
    percentageText: { fontSize: 11, fontFamily: THEME.fonts.bold, color: THEME.colors.secondary },
    emptyText: { textAlign: 'center', padding: 20, color: THEME.colors.textSecondary },
});
