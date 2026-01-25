import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/config';
import { SalesService, Sale } from '../../services/SalesService';
import DashboardCard from '../../components/DashboardCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function SubBranchDashboard() {
    const { logout, user } = useAuth();
    const navigation = useNavigation<any>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSales = async () => {
        try {
            const data = await SalesService.getSalesByBranch(user?.branchId || '');
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

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchSales();
    }, []);

    const totalSales = sales.length;
    const todaySales = sales.filter(s => s.saleDate === new Date().toISOString().split('T')[0]).length;
    const warrantiesGenerated = sales.filter(s => s.warrantyId).length;

    const renderSaleItem = ({ item }: { item: Sale }) => (
        <View style={styles.saleItem}>
            <View style={styles.saleInfo}>
                <Text style={styles.productName}>{item.productModel}</Text>
                <Text style={styles.customerName}>{item.customerName}</Text>
            </View>
            <View style={styles.saleMeta}>
                <Text style={styles.date}>{item.saleDate}</Text>
                <Text style={[styles.status, { color: item.status === 'approved' ? THEME.colors.success : THEME.colors.primary }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.welcomeSection}>
                    <Text style={styles.greeting}>Hello, {user?.name}</Text>
                    <Text style={styles.branch}>Sub Branch Limitied</Text>
                </View>

                <View style={styles.statsGrid}>
                    <DashboardCard
                        title="Total Sales"
                        value={totalSales}
                        icon="chart-line"
                        color={THEME.colors.primary}
                        style={{ flex: 1, marginRight: THEME.spacing.s }}
                    />
                    <DashboardCard
                        title="Today's Sales"
                        value={todaySales}
                        icon="calendar-today"
                        color={THEME.colors.success}
                        style={{ flex: 1, marginLeft: THEME.spacing.s }}
                    />
                </View>
                <DashboardCard
                    title="Warranties Generated"
                    value={warrantiesGenerated}
                    icon="shield-check"
                    color="#FF9500"
                />

                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateSaleStep1')}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="white" />
                    <Text style={styles.createButtonText}>Create New Sale</Text>
                </TouchableOpacity>

                <View style={styles.recentTitleHeader}>
                    <Text style={styles.sectionTitle}>Recent Sales</Text>
                    <TouchableOpacity onPress={logout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {sales.length === 0 ? (
                    <Text style={styles.emptyText}>No sales recorded yet.</Text>
                ) : (
                    sales.map(item => <View key={item.id}>{renderSaleItem({ item })}</View>)
                )}
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
    },
    welcomeSection: {
        marginBottom: THEME.spacing.l,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: THEME.colors.text,
    },
    branch: {
        fontSize: 15,
        color: THEME.colors.textSecondary,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: THEME.spacing.s,
    },
    createButton: {
        backgroundColor: THEME.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: THEME.spacing.m,
        borderRadius: THEME.borderRadius.m,
        marginVertical: THEME.spacing.l,
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: THEME.spacing.s,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: THEME.colors.text,
    },
    recentTitleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.m
    },
    logoutText: {
        color: THEME.colors.error,
        fontSize: 15
    },
    saleItem: {
        backgroundColor: 'white',
        padding: THEME.spacing.m,
        borderRadius: THEME.borderRadius.m,
        marginBottom: THEME.spacing.s,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    saleInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: THEME.colors.text,
    },
    customerName: {
        fontSize: 14,
        color: THEME.colors.textSecondary,
        marginTop: 2,
    },
    saleMeta: {
        alignItems: 'flex-end',
    },
    date: {
        fontSize: 12,
        color: THEME.colors.textSecondary,
    },
    status: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
        marginTop: 20,
    }
});
