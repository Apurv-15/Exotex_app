import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Platform, Alert, Image, StatusBar } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/config';
import { SalesService, Sale } from '../../services/SalesService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import FloatingTabBar from '../../components/FloatingTabBar';

export default function SubBranchDashboard() {
    const { logout, user } = useAuth();
    const navigation = useNavigation<any>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSales = useCallback(async () => {
        try {
            const data = await SalesService.getSalesByBranch(user?.branchId || '');
            setSales(data);
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

    const totalSales = sales.length;
    const todaySales = sales.filter(s => s.saleDate === new Date().toISOString().split('T')[0]).length;
    const warrantiesGenerated = sales.filter(s => s.warrantyId).length;

    const handleTabPress = (tab: 'home' | 'create' | 'fieldvisit') => {
        if (tab === 'create') {
            navigation.navigate('CreateSaleStep1');
        } else if (tab === 'fieldvisit') {
            navigation.navigate('FieldVisitForm');
        }
        // 'home' tab - already on home, do nothing
    };

    const renderSaleItem = (item: Sale) => (
        <Pressable
            key={item.id}
            style={({ pressed }) => [styles.saleItem, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={() => navigation.navigate('WarrantyCard', { sale: item })}
        >
            <View style={[styles.saleIcon, { backgroundColor: item.status === 'approved' ? '#E8F5E9' : '#FFF3E0' }]}>
                <MaterialCommunityIcons
                    name={item.status === 'approved' ? 'check-circle' : 'clock-outline'}
                    size={20}
                    color={item.status === 'approved' ? '#4CAF50' : '#FF9800'}
                />
            </View>
            <View style={styles.saleInfo}>
                <Text style={styles.productName}>{item.productModel}</Text>
                <Text style={styles.customerName}>{item.customerName}</Text>
            </View>
            <View style={styles.saleMeta}>
                <Text style={styles.date}>{item.saleDate}</Text>
                <Text style={[styles.status, { color: item.status === 'approved' ? '#4CAF50' : '#FF9800' }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" style={{ marginLeft: 8 }} />
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={StyleSheet.absoluteFill}
            />
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    Platform.OS !== 'web' ? (
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    ) : undefined
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <View>
                            <Text style={styles.greeting}>Hello, {user?.name}</Text>
                            <Text style={styles.subtitle}>Make your sales tracking easy</Text>
                        </View>
                    </View>
                    <Pressable
                        onPress={logout}
                        style={({ pressed }) => [styles.avatarContainer, pressed && { opacity: 0.7 }]}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                        </View>
                    </Pressable>
                </View>

                {/* Bento Grid Stats */}
                <View style={styles.bentoGrid}>
                    {/* Large Card - Total Sales */}
                    <Pressable
                        style={({ pressed }) => [styles.bentoCardLarge, pressed && { transform: [{ scale: 0.98 }] }]}
                        onPress={() => navigation.navigate('AnalyticsScreen')}
                    >
                        <View style={styles.bentoIconPurple}>
                            <MaterialCommunityIcons name="chart-line" size={24} color="#7C3AED" />
                        </View>
                        <Text style={styles.bentoValue}>{totalSales}</Text>
                        <Text style={styles.bentoLabel}>Total Sales</Text>
                        <Text style={styles.bentoSubtext}>Tap to view analytics</Text>
                    </Pressable>

                    <View style={styles.bentoRight}>
                        {/* Small Card - Today */}
                        <Pressable style={({ pressed }) => [styles.bentoCardSmall, styles.bentoYellow, pressed && { transform: [{ scale: 0.98 }] }]}>
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>Today</Text>
                            </View>
                            <Text style={styles.bentoValueDark}>{todaySales}</Text>
                            <Text style={styles.bentoLabelDark}>Sales Today</Text>
                        </Pressable>

                        {/* Small Card - Warranties */}
                        <Pressable style={({ pressed }) => [styles.bentoCardSmall, styles.bentoDark, pressed && { transform: [{ scale: 0.98 }] }]}>
                            <View style={styles.bentoIconDark}>
                                <MaterialCommunityIcons name="shield-check" size={20} color="#FFF" />
                            </View>
                            <Text style={styles.bentoValueLight}>{warrantiesGenerated}</Text>
                            <Text style={styles.bentoLabelLight}>Warranties</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Recent Sales Section */}
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Recent Sales</Text>
                    <Pressable onPress={logout} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                        <Text style={styles.seeAllText}>Logout</Text>
                    </Pressable>
                </View>

                {sales.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="inbox-outline" size={48} color="#C7C7CC" />
                        <Text style={styles.emptyText}>No sales recorded yet</Text>
                        <Text style={styles.emptySubtext}>Create your first sale to get started</Text>
                    </View>
                ) : (
                    sales.map(item => renderSaleItem(item))
                )}

                {/* Bottom spacing for floating tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Tab Bar */}
            <FloatingTabBar activeTab="home" onTabPress={handleTabPress} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 20,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        marginBottom: 24,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    avatarContainer: {
        cursor: 'pointer',
    } as any,
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    bentoGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    bentoCardLarge: {
        flex: 1,
        backgroundColor: 'rgba(237, 233, 254, 0.7)',
        borderRadius: 24,
        padding: 20,
        minHeight: 180,
        justifyContent: 'flex-end',
        cursor: 'pointer',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    } as any,
    bentoIconPurple: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 'auto',
    },
    bentoValue: {
        fontSize: 42,
        fontWeight: '700',
        color: '#5B21B6',
        marginTop: 12,
    },
    bentoLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7C3AED',
    },
    bentoSubtext: {
        fontSize: 12,
        color: '#8B5CF6',
        marginTop: 2,
    },
    bentoRight: {
        flex: 1,
        gap: 12,
    },
    bentoCardSmall: {
        flex: 1,
        borderRadius: 22,
        padding: 16,
        justifyContent: 'center',
        cursor: 'pointer',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    } as any,
    bentoYellow: {
        backgroundColor: 'rgba(254, 243, 199, 0.7)',
    },
    bentoDark: {
        backgroundColor: '#1F2937',
    },
    newBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    newBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    bentoIconDark: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    bentoValueDark: {
        fontSize: 28,
        fontWeight: '700',
        color: '#92400E',
    },
    bentoLabelDark: {
        fontSize: 13,
        fontWeight: '600',
        color: '#B45309',
    },
    bentoValueLight: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFF',
    },
    bentoLabelLight: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    createButton: {
        marginBottom: 24,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    createButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    seeAllText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '600',
        cursor: 'pointer',
    } as any,
    saleItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        cursor: 'pointer',
    } as any,
    saleIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    saleInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    customerName: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    saleMeta: {
        alignItems: 'flex-end',
    },
    date: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    status: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#888',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 13,
        color: '#AAA',
        marginTop: 4,
    },
});
