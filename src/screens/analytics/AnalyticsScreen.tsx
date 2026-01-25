import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { THEME } from '../../constants/config';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false // optional
};

export default function AnalyticsScreen() {
    // Mock data for Branch-wise performance
    const data = {
        labels: ["Sub 1", "Sub 2", "Sub 3", "Sub 4"],
        datasets: [
            {
                data: [20, 45, 28, 80]
            }
        ]
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Detailed Analytics</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Branch Performance</Text>
                <Text style={styles.cardSubtitle}>Sales count per branch</Text>
                <BarChart
                    data={data}
                    width={screenWidth - 64}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    verticalLabelRotation={0}
                    style={styles.chart}
                    showValuesOnTopOfBars
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Products</Text>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>1. Inverter Model X</Text>
                    <Text style={styles.rowValue}>120 units</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>2. Solar Panel A1</Text>
                    <Text style={styles.rowValue}>95 units</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>3. Battery Pack Pro</Text>
                    <Text style={styles.rowValue}>80 units</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.surface,
    },
    content: {
        padding: THEME.spacing.l,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: THEME.colors.text,
        marginBottom: THEME.spacing.l,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: THEME.borderRadius.l,
        padding: THEME.spacing.m,
        marginBottom: THEME.spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: THEME.colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.m,
    },
    chart: {
        borderRadius: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
    },
    rowLabel: {
        fontSize: 16,
        color: THEME.colors.text,
    },
    rowValue: {
        fontSize: 16,
        fontWeight: '600',
        color: THEME.colors.primary,
    }
});
