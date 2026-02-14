import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Platform, Dimensions, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import { SalesService, Sale } from '../../services/SalesService';
import { FieldVisitService } from '../../services/FieldVisitService';
import { StockService } from '../../services/StockService';
import { Stock } from '../../types';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
// @ts-ignore
import FloatingTabBar from '../../components/FloatingTabBar';
// import { SoundManager } from '../../utils/SoundManager';

const { width } = Dimensions.get('window');

const calculateDaysRemaining = (saleDate: string) => {
    const start = new Date(saleDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 45 - diffDays;

    return {
        days: remaining,
        isExpired: remaining <= 0,
        label: remaining <= 0 ? (remaining === 0 ? 'Today' : `Expired ${Math.abs(remaining)} days ago`) : `${remaining} Days Left`,
        color: remaining > 15 ? THEME.colors.success : (remaining > 0 ? THEME.colors.warning : THEME.colors.error)
    };
};

export default function SubBranchDashboard() {
    const { logout, user } = useAuth();
    const navigation = useNavigation<any>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [fieldVisits, setFieldVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<'Today' | '7d' | '30d' | '1y'>('7d');
    const [branchStock, setBranchStock] = useState<Stock[]>([]);
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Stock'>('Dashboard');

    const fetchSales = useCallback(async () => {
        try {
            const data = await SalesService.getSalesByBranch(user?.branchId || '');
            setSales(data);

            // Fetch field visits
            const visits = await FieldVisitService.getFieldVisitsByBranch(user?.branchId || '');
            setFieldVisits(visits);

            // Fetch regional stock
            if (user?.region) {
                const stock = await StockService.getStockByRegion(user.region);
                setBranchStock(stock);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.branchId]);

    useFocusEffect(
        useCallback(() => {
            fetchSales();
        }, [fetchSales])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchSales();
    }, [fetchSales]);

    const filteredSales = useMemo(() => {
        const now = new Date();
        return sales.filter(s => {
            if (period === '7d') {
                const date = new Date(s.saleDate);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                return date >= sevenDaysAgo;
            }
            if (period === 'Today') return new Date(s.saleDate).toDateString() === now.toDateString();
            if (period === '30d') {
                const date = new Date(s.saleDate);
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            if (period === '1y') return new Date(s.saleDate).getFullYear() === now.getFullYear();
            return true;
        });
    }, [sales, period]);

    const filteredVisits = useMemo(() => {
        const now = new Date();
        return fieldVisits.filter(v => {
            const date = new Date(v.visitDate);
            if (period === '7d') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                return date >= sevenDaysAgo;
            }
            if (period === 'Today') return date.toDateString() === now.toDateString();
            if (period === '30d') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            if (period === '1y') return date.getFullYear() === now.getFullYear();
            return true;
        });
    }, [fieldVisits, period]);

    const warrantiesGenerated = filteredSales.filter(s => s.warrantyId).length;
    const fieldVisitsCompleted = filteredVisits.length;

    // Data generation based on period
    const getChartData = () => {
        let labels = [];
        let warrantyData = [];
        let fieldVisitData = [];

        if (period === '7d' || period === 'Today') {
            const daysToStep = period === 'Today' ? 1 : 7;
            for (let i = daysToStep - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                labels.push(period === 'Today' ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }));
                warrantyData.push(sales.filter(s => s.saleDate === dateStr && s.warrantyId).length);
                fieldVisitData.push(fieldVisits.filter(v => v.visitDate === dateStr).length);
            }
        } else if (period === '30d') {
            // Group by 5 days for 30 days view
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - (i * 5));
                labels.push(date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

                // Simplified aggregation for dummy/real
                let wCount = 0;
                let vCount = 0;
                for (let j = 0; j < 5; j++) {
                    const d = new Date();
                    d.setDate(d.getDate() - (i * 5 + j));
                    const ds = d.toISOString().split('T')[0];
                    wCount += sales.filter(s => s.saleDate === ds && s.warrantyId).length;
                    vCount += fieldVisits.filter(v => v.visitDate === ds).length;
                }
                warrantyData.push(wCount);
                fieldVisitData.push(vCount);
            }
        } else {
            // Yearly view - last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short' }));

                const month = date.getMonth();
                const year = date.getFullYear();
                warrantyData.push(sales.filter(s => {
                    const sd = new Date(s.saleDate);
                    return sd.getMonth() === month && sd.getFullYear() === year && s.warrantyId;
                }).length);
                fieldVisitData.push(fieldVisits.filter(v => {
                    const vd = new Date(v.visitDate);
                    return vd.getMonth() === month && vd.getFullYear() === year;
                }).length);
            }
        }

        return {
            labels,
            datasets: [
                {
                    data: warrantyData,
                    color: (opacity = 1) => `rgba(116, 198, 157, ${opacity})`,
                    strokeWidth: 2.5
                },
                {
                    data: fieldVisitData,
                    color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                    strokeWidth: 2.5
                }
            ],
            legend: ['Warranties', 'Field Visits']
        };
    };

    const chartData = getChartData();

    const handleLogout = () => {
        const logoutTask = () => logout();

        if (Platform.OS === 'web') {
            if (window.confirm('Do you want to log out?')) {
                logoutTask();
            }
        } else {
            Alert.alert(
                'Logout',
                'Do you want to log out?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log Out', style: 'destructive', onPress: logoutTask }
                ]
            );
        }
    };

    const handleTabPress = (tab: 'home' | 'create' | 'fieldvisit') => {
        if (tab === 'create') {
            navigation.navigate('CreateSaleStep1');
        } else if (tab === 'fieldvisit') {
            navigation.navigate('FieldVisitForm');
        }
    };

    const renderSaleItem = (item: Sale) => (
        <GlassPanel
            key={item.id}
            style={styles.saleItem}
        >
            <Pressable
                onPress={() => navigation.navigate('WarrantyCard', { sale: item })}
                style={({ pressed }) => [styles.saleItemContent, pressed && { opacity: 0.7 }]}
            >
                <View style={[styles.saleIcon, { backgroundColor: item.status === 'approved' ? THEME.colors.mintLight : '#FEF3C7' }]}>
                    <MaterialCommunityIcons
                        name={item.status === 'approved' ? 'check-circle' : 'clock-outline'}
                        size={20}
                        color={item.status === 'approved' ? THEME.colors.success : THEME.colors.warning}
                    />
                </View>
                <View style={styles.saleInfo}>
                    <Text style={styles.productName}>{item.productModel}</Text>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                </View>
                <View style={styles.saleMeta}>
                    <Text style={styles.date}>{item.saleDate}</Text>
                    <Text style={[styles.status, { color: item.status === 'approved' ? THEME.colors.success : THEME.colors.warning }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textSecondary} style={{ marginLeft: 8 }} />
            </Pressable>
        </GlassPanel>
    );

    return (
        <MeshBackground>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    Platform.OS !== 'web' ? (
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
                    ) : undefined
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={handleLogout}
                        style={({ pressed }) => [
                            styles.headerTitleRow,
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                            <View style={styles.onlineBadge} />
                        </View>
                        <View>
                            <Text style={styles.subtitle}>EXOTEX System</Text>
                            <Text style={styles.greeting}>{user?.name}</Text>
                        </View>
                    </Pressable>
                    <GlassPanel style={styles.notificationBtn}>
                        <MaterialCommunityIcons name="bell-outline" size={24} color={THEME.colors.text} />
                    </GlassPanel>
                </View>

                {/* Tab Switcher */}
                <View style={[styles.tabContainer, { marginBottom: 20 }]}>
                    <GlassPanel style={styles.tabSwitcher} intensity={30}>
                        <Pressable
                            onPress={() => setActiveTab('Dashboard')}
                            style={[styles.tabButton, activeTab === 'Dashboard' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, activeTab === 'Dashboard' && styles.tabButtonTextActive]}>Dashboard</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveTab('Stock')}
                            style={[styles.tabButton, activeTab === 'Stock' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, activeTab === 'Stock' && styles.tabButtonTextActive]}>Stock</Text>
                        </Pressable>
                    </GlassPanel>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <GlassPanel style={styles.loadingPanel}>
                            <ActivityIndicator size="large" color={THEME.colors.secondary} />
                            <Text style={styles.loadingText}>Loading your data...</Text>
                        </GlassPanel>
                    </View>
                ) : activeTab === 'Dashboard' ? (
                    <>
                        {/* Total Sales Graph Card */}
                        <GlassPanel style={styles.graphCard}>
                            <View style={styles.graphHeader}>
                                <View>
                                    <Text style={styles.graphTitle}>Activity Overview</Text>
                                    <View style={styles.amountSelectorRow}>
                                        <Text style={styles.graphAmount}>{warrantiesGenerated + fieldVisitsCompleted}</Text>
                                        <View style={styles.periodSelector}>
                                            <Pressable onPress={() => setPeriod('Today')} style={[styles.periodBtn, period === 'Today' && styles.periodBtnActive]}>
                                                <Text style={[styles.periodBtnText, period === 'Today' && styles.periodBtnTextActive]}>1D</Text>
                                            </Pressable>
                                            <Pressable onPress={() => setPeriod('7d')} style={[styles.periodBtn, period === '7d' && styles.periodBtnActive]}>
                                                <Text style={[styles.periodBtnText, period === '7d' && styles.periodBtnTextActive]}>7D</Text>
                                            </Pressable>
                                            <Pressable onPress={() => setPeriod('30d')} style={[styles.periodBtn, period === '30d' && styles.periodBtnActive]}>
                                                <Text style={[styles.periodBtnText, period === '30d' && styles.periodBtnTextActive]}>1M</Text>
                                            </Pressable>
                                            <Pressable onPress={() => setPeriod('1y')} style={[styles.periodBtn, period === '1y' && styles.periodBtnActive]}>
                                                <Text style={[styles.periodBtnText, period === '1y' && styles.periodBtnTextActive]}>1Y</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.trendBadge}>
                                    <MaterialIcons name="trending-up" size={14} color="white" />
                                    <Text style={styles.trendText}>+12.5%</Text>
                                </View>
                            </View>

                            <LineChart
                                data={chartData}
                                width={width - 48} // More responsive width
                                height={120}
                                withInnerLines={false}
                                withOuterLines={false}
                                withVerticalLines={false}
                                withHorizontalLines={false}
                                withDots={true}
                                withShadow={false}
                                formatYLabel={(label) => Math.round(parseFloat(label)).toString()}
                                chartConfig={{
                                    backgroundColor: "#ffffff",
                                    backgroundGradientFrom: "#ffffff",
                                    backgroundGradientTo: "#ffffff",
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    },
                                    propsForDots: {
                                        r: "3",
                                        strokeWidth: 1.5,
                                        stroke: "#ffffff"
                                    },
                                    strokeWidth: 2,
                                    propsForLabels: {
                                        fontSize: 9,
                                    }
                                }}
                                bezier
                                style={{
                                    paddingRight: 35, // Adjust for Y labels
                                    marginTop: 8,
                                    marginLeft: -10,
                                }}
                            />
                            {/* Legend */}
                            <View style={styles.legendRow}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: THEME.colors.secondary }]} />
                                    <Text style={styles.legendText}>Warranties</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
                                    <Text style={styles.legendText}>Field Visits</Text>
                                </View>
                            </View>

                        </GlassPanel>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <GlassPanel style={styles.statCard}>
                                <View style={styles.statIconWrapperVerify}>
                                    <MaterialIcons name="verified-user" size={20} color={THEME.colors.secondary} />
                                </View>
                                <View>
                                    <Text style={styles.statValue}>{warrantiesGenerated}</Text>
                                    <Text style={styles.statLabel}>ACTIVE WARRANTIES</Text>
                                </View>
                            </GlassPanel>
                            <GlassPanel style={styles.statCard}>
                                <View style={styles.statIconWrapperPending}>
                                    <MaterialIcons name="assignment" size={20} color={THEME.colors.secondary} />
                                </View>
                                <View>
                                    <Text style={styles.statValue}>{fieldVisitsCompleted}</Text>
                                    <Text style={styles.statLabel}>FIELD VISITS</Text>
                                </View>
                            </GlassPanel>
                        </View>

                        {/* Quick Actions */}
                        <View style={styles.sectionCmd}>
                            <Text style={styles.sectionTitle}>Quick Actions</Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionBtn,
                                        { flex: 1 },
                                        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                                    ]}
                                    onPress={() => navigation.navigate('CreateSaleStep1')}
                                >
                                    <View style={styles.actionIcon}>
                                        <MaterialIcons name="add" size={20} color="white" />
                                    </View>
                                    <Text style={styles.actionText}>New Warranty</Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionBtn,
                                        { flex: 1 },
                                        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                                    ]}
                                    onPress={() => navigation.navigate('FieldVisitForm')}
                                >
                                    <View style={[styles.actionIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                        <MaterialIcons name="assignment" size={20} color={THEME.colors.secondary} />
                                    </View>
                                    <Text style={styles.actionText}>Field Visit</Text>
                                </Pressable>
                            </View>

                            <View style={{ flexDirection: 'row' }}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionBtn,
                                        { flex: 1 },
                                        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                                    ]}
                                    onPress={() => navigation.navigate('RaiseComplaintStep1')}
                                >
                                    <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                                        <MaterialIcons name="report-problem" size={20} color="#EF4444" />
                                    </View>
                                    <Text style={styles.actionText}>Raise Complaint</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Recent Warranties Section */}
                        <View style={styles.recentHeader}>
                            <Text style={styles.sectionTitle}>Recent Warranties</Text>
                            {/* TODO: Create WarrantiesList screen */}
                            <Text style={styles.seeAllText}>View More</Text>
                        </View>

                        <GlassPanel style={styles.listContainer}>
                            {sales.filter(s => s.warrantyId).length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="inbox-outline" size={32} color={THEME.colors.textSecondary} />
                                    <Text style={styles.emptyText}>No warranties yet</Text>
                                </View>
                            ) : (
                                sales.filter(s => s.warrantyId).slice(0, 3).map(item => {
                                    const countdown = calculateDaysRemaining(item.saleDate);
                                    return (
                                        <Pressable
                                            key={item.id}
                                            style={styles.listItem}
                                            onPress={() => navigation.navigate('WarrantyCard', { sale: item })}
                                        >
                                            <View style={[styles.listIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                                <MaterialIcons name="verified-user" size={20} color={THEME.colors.success} />
                                            </View>
                                            <View style={styles.listInfo}>
                                                <Text style={styles.listTitle}>{item.productModel}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                                    <Text style={[styles.listSub, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                                                        {item.customerName} • {item.city}
                                                    </Text>
                                                    <View style={[styles.countdownBadge, { backgroundColor: countdown.color + '20' }]}>
                                                        <Text style={[styles.countdownText, { color: countdown.color }]}>
                                                            {countdown.label}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={styles.listAmount}>
                                                <Text style={styles.amountText}>{item.warrantyId}</Text>
                                                <Text style={styles.dateText}>{new Date(item.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                                            </View>
                                        </Pressable>
                                    );
                                })
                            )}
                        </GlassPanel>

                        <View style={{ height: 100 }} />
                    </>
                ) : (
                    <StockViewContent branchStock={branchStock} userRegion={user?.region} />
                )}
            </ScrollView>

            <FloatingTabBar activeTab="home" onTabPress={handleTabPress} />
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarText: {
        fontSize: 20,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        backgroundColor: '#4ADE80',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white'
    },
    subtitle: {
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    greeting: {
        fontSize: 20,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.text,
        lineHeight: 24,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)'
    },
    navPills: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 100,
        marginBottom: 24,
    },
    navPill: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 100,
    },
    navPillActive: {
        backgroundColor: 'white',
        shadowColor: 'black',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    navPillText: {
        fontSize: 14,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
    },
    navPillTextActive: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
    },
    graphCard: {
        borderRadius: 20,
        padding: 14,
        marginBottom: 16,
        minHeight: 220,
        justifyContent: 'space-between'
    },
    graphHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    graphTitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
    },
    graphAmount: {
        fontSize: 32,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.text,
        letterSpacing: -0.5,
        lineHeight: 38,
    },
    graphSubtitle: {
        fontSize: 11,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
    },
    amountSelectorRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: 8,
        padding: 2,
    },
    periodBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    periodBtnActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    periodBtnText: {
        fontSize: 9,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
    },
    periodBtnTextActive: {
        color: THEME.colors.secondary,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 3
    },
    trendText: {
        color: '#166534',
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
    },
    barViz: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 60,
        marginTop: -30, // overlap chart slightly
    },
    barVizItem: {
        width: '14%',
        borderRadius: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 10,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        height: 110,
        justifyContent: 'space-between',
    },
    statIconWrapperVerify: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: THEME.colors.mintLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statIconWrapperPending: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#D1FAE5', // Using specific mint shade
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.text,
        lineHeight: 28,
    },
    statLabel: {
        fontSize: 9,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
        letterSpacing: 0.8,
    },
    sectionCmd: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.text,
        marginBottom: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderRadius: 100,
        gap: 12,
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    actionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.secondary,
    },
    listContainer: {
        padding: 8,
        borderRadius: 24,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    listIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    countdownBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    countdownText: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
    },
    listInfo: {
        flex: 1,
    },
    listTitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
    },
    listSub: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
        textTransform: 'uppercase',
    },
    listAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 14,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.text,
    },
    dateText: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
    },
    saleItem: { marginBottom: 10, borderRadius: 24 },
    saleItemContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    saleIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    saleInfo: { flex: 1 },
    productName: { fontFamily: THEME.fonts.bold, fontSize: 15, color: THEME.colors.text },
    customerName: { fontFamily: THEME.fonts.semiBold, fontSize: 12, color: THEME.colors.textSecondary },
    saleMeta: { alignItems: 'flex-end' },
    date: { fontSize: 11, fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary },
    status: { fontSize: 10, fontFamily: THEME.fonts.bold },
    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: THEME.colors.textSecondary, fontSize: 14, fontFamily: THEME.fonts.semiBold },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
        paddingVertical: 60,
    },
    loadingPanel: {
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
        marginTop: 8,
    },
    tabContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    tabSwitcher: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        width: '100%',
        maxWidth: 320,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 100,
    },
    tabButtonActive: {
        backgroundColor: '#FFFFFF',
        ...THEME.shadows.small,
    },
    tabButtonText: {
        fontSize: 15,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
    },
    tabButtonTextActive: {
        color: THEME.colors.text,
    },
});

const StockViewContent = ({ branchStock, userRegion }: { branchStock: Stock[], userRegion?: string }) => {
    return (
        <View style={{ paddingBottom: 20 }}>
            <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Current Stock ({userRegion || 'No Region'})</Text>
            </View>

            {branchStock.length === 0 ? (
                <GlassPanel style={styles.emptyState}>
                    <MaterialCommunityIcons name="package-variant-closed" size={48} color={THEME.colors.textSecondary} />
                    <Text style={styles.emptyText}>No stock data available</Text>
                </GlassPanel>
            ) : (
                <GlassPanel style={styles.listContainer}>
                    {branchStock.map((s, index) => (
                        <View
                            key={s.id}
                            style={[
                                styles.listItem,
                                index === branchStock.length - 1 && { borderBottomWidth: 0 }
                            ]}
                        >
                            <View style={[styles.listIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                <MaterialCommunityIcons name="package-variant" size={24} color={THEME.colors.secondary} />
                            </View>
                            <View style={styles.listInfo}>
                                <Text style={styles.listTitle}>{s.modelName}</Text>
                                <Text style={styles.listSub}>Last updated: {new Date(s.updatedAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.listAmount}>
                                <Text style={[styles.amountText, { fontSize: 24, color: THEME.colors.text }]}>{s.quantity}</Text>
                                <Text style={styles.dateText}>Units</Text>
                            </View>
                        </View>
                    ))}
                </GlassPanel>
            )}
        </View>
    );
};
