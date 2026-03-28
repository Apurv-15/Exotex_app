import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';
import { Sale } from '../../services/SalesService';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

interface DashboardTabProps {
    stats: {
        totalWarranties: number;
        pendingWarranties: number;
        totalVisits: number;
        activeComplaints: number;
    };
    pendingActionSales: Sale[];
    recentSales: Sale[];
    recentVisits: any[];
    resources: any[];
    onNavigate: (screen: string, params?: any) => void;
    onSetActiveTab: (tab: any) => void;
    onUpdatePayment: (sale: Sale) => void;
    onDownloadVisit: (visit: any) => void;
    calculateDaysRemaining: (date: string) => any;
    setLoading: (loading: boolean) => void;
}

export const SubBranchDashboardOverview = React.memo(({
    stats,
    pendingActionSales,
    recentSales,
    recentVisits,
    resources,
    onNavigate,
    onSetActiveTab,
    onUpdatePayment,
    onDownloadVisit,
    calculateDaysRemaining,
    setLoading
}: DashboardTabProps) => {
    return (
        <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <GlassPanel style={styles.statCard}>
                    <View style={styles.statIconWrapperVerify}>
                        <MaterialIcons name="verified-user" size={20} color={THEME.colors.secondary} />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.statValue}>{stats.totalWarranties}</Text>
                        <Text style={styles.statLabel}>WARRANTIES</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: THEME.colors.primary + '15' }]}>
                        <Text style={[styles.statBadgeText, { color: THEME.colors.primary }]}>Total</Text>
                    </View>
                </GlassPanel>

                <GlassPanel style={[styles.statCard, { backgroundColor: '#FEF3C780', padding: 12 }]}>
                    <Pressable
                        style={{ flex: 1, justifyContent: 'center' }}
                        onPress={() => onSetActiveTab('Pending')}
                    >
                        <View style={[styles.statIconWrapperPending, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
                        </View>
                        <View style={{ marginTop: 8 }}>
                            <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.pendingWarranties}</Text>
                            <Text style={[styles.statLabel, { color: '#92400E' }]}>PENDING</Text>
                        </View>
                        <View style={[styles.statBadge, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[styles.statBadgeText, { color: '#D97706' }]}>Sales</Text>
                        </View>
                    </Pressable>
                </GlassPanel>

                <GlassPanel style={[styles.statCard, { backgroundColor: '#D1FAE580', padding: 12 }]}>
                    <Pressable
                        style={{ flex: 1, justifyContent: 'center' }}
                        onPress={() => onSetActiveTab('FieldVisits')}
                    >
                        <View style={[styles.statIconWrapperPending, { backgroundColor: '#D1FAE5' }]}>
                            <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#059669" />
                        </View>
                        <View style={{ marginTop: 8 }}>
                            <Text style={[styles.statValue, { color: '#059669' }]}>{stats.totalVisits}</Text>
                            <Text style={[styles.statLabel, { color: '#065F46' }]}>VISITS</Text>
                        </View>
                        <View style={[styles.statBadge, { backgroundColor: '#D1FAE5' }]}>
                            <Text style={[styles.statBadgeText, { color: '#059669' }]}>Total</Text>
                        </View>
                    </Pressable>
                </GlassPanel>

                <GlassPanel style={[styles.statCard, { backgroundColor: '#FEE2E280', padding: 12 }]}>
                    <Pressable
                        style={{ flex: 1, justifyContent: 'center' }}
                        onPress={() => onSetActiveTab('Complaints')}
                    >
                        <View style={[styles.statIconWrapperPending, { backgroundColor: '#FEE2E2' }]}>
                            <MaterialIcons name="report-problem" size={20} color="#EF4444" />
                        </View>
                        <View style={{ marginTop: 8 }}>
                            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.activeComplaints}</Text>
                            <Text style={[styles.statLabel, { color: '#B91C1C' }]}>COMPLAINTS</Text>
                        </View>
                        <View style={[styles.statBadge, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.statBadgeText, { color: '#EF4444' }]}>Open</Text>
                        </View>
                    </Pressable>
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
                        onPress={() => onNavigate('CreateSaleStep1')}
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
                        onPress={() => onNavigate('FieldVisitForm')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: THEME.colors.mintLight }]}>
                            <MaterialIcons name="assignment" size={20} color={THEME.colors.secondary} />
                        </View>
                        <Text style={styles.actionText}>Field Visit</Text>
                    </Pressable>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionBtn,
                            { flex: 1 },
                            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => onNavigate('RaiseComplaintStep1')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                            <MaterialIcons name="report-problem" size={20} color="#EF4444" />
                        </View>
                        <Text style={styles.actionText}>Raise Complaint</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionBtn,
                            { flex: 1 },
                            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => onNavigate('CreateQuotationScreen')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
                            <MaterialIcons name="receipt" size={20} color="#0EA5E9" />
                        </View>
                        <Text style={styles.actionText}>Quotation</Text>
                    </Pressable>
                </View>
            </View>

            {/* Pending Action Warranties */}
            {pendingActionSales.length > 0 && (
                <View style={{ marginTop: 24, marginBottom: 8 }}>
                    <View style={styles.recentHeader}>
                        <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Pending Actions (Over 45 Days)</Text>
                        <View style={{ backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
                            <Text style={{ color: 'white', fontSize: 10, fontFamily: THEME.fonts.bold }}>{pendingActionSales.length}</Text>
                        </View>
                    </View>
                    <GlassPanel style={[styles.listContainer, { borderColor: '#EF444440', backgroundColor: '#EF444405' }]}>
                        {pendingActionSales.slice(0, 5).map(item => (
                            <Pressable
                                key={item.id}
                                style={styles.listItem}
                                onPress={() => onUpdatePayment(item)}
                            >
                                <View style={[styles.listIcon, { backgroundColor: '#FEE2E2' }]}>
                                    <MaterialIcons name="error-outline" size={20} color="#EF4444" />
                                </View>
                                <View style={styles.listInfo}>
                                    <Text style={styles.listTitle}>{item.productModel}</Text>
                                    <Text style={styles.listSub} numberOfLines={1}>
                                        {item.customerName} • {item.city}
                                    </Text>
                                </View>
                                <View style={{ backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontFamily: THEME.fonts.bold }}>UPDATE</Text>
                                </View>
                            </Pressable>
                        ))}
                    </GlassPanel>
                </View>
            )}

            {/* Recent Warranties Section */}
            <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent Warranties</Text>
                <Pressable onPress={() => onSetActiveTab('Dashboard')}>
                    <Text style={styles.seeAllText}>View All</Text>
                </Pressable>
            </View>

            <GlassPanel style={styles.listContainer}>
                {recentSales.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="inbox-outline" size={32} color={THEME.colors.textSecondary} />
                        <Text style={styles.emptyText}>No warranties yet</Text>
                    </View>
                ) : (
                    recentSales.map(item => {
                        const countdown = calculateDaysRemaining(item.saleDate);
                        const isPending = !item.warrantyGenerated;
                        return (
                            <Pressable
                                key={item.id}
                                style={styles.listItem}
                                onPress={() => {
                                    if (item.warrantyGenerated) {
                                        onNavigate('WarrantyCard', { sale: item });
                                    } else {
                                        onUpdatePayment(item);
                                    }
                                }}
                            >
                                <View style={[styles.listIcon, { backgroundColor: isPending ? '#FEF3C7' : THEME.colors.mintLight }]}>
                                    <MaterialCommunityIcons 
                                        name={isPending ? 'calendar-clock' : 'check-circle'} 
                                        size={20} 
                                        color={isPending ? THEME.colors.warning : THEME.colors.success} 
                                    />
                                </View>
                                <View style={styles.listInfo}>
                                    <Text style={styles.listTitle}>{item.productModel}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                        <Text style={[styles.listSub, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                                            {item.customerName} • {item.city}
                                        </Text>
                                        <View style={[styles.countdownBadge, { backgroundColor: (isPending ? THEME.colors.warning : countdown.color) + '20' }]}>
                                            <Text style={[styles.countdownText, { color: isPending ? THEME.colors.warning : countdown.color }]}>
                                                {isPending ? `PENDING (${countdown.days}d)` : countdown.label}
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

            {/* Recent Field Visits Section */}
            <View style={[styles.recentHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Recent Field Visits</Text>
                <Pressable onPress={() => onSetActiveTab('FieldVisits')}>
                    <Text style={styles.seeAllText}>View All</Text>
                </Pressable>
            </View>

            <GlassPanel style={styles.listContainer}>
                {recentVisits.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={THEME.colors.textSecondary} />
                        <Text style={styles.emptyText}>No field visits yet</Text>
                    </View>
                ) : (
                    recentVisits.map((visit, idx) => {
                        const date = new Date(visit.dateOfVisit || visit.visitDate || visit.createdAt);
                        const type = visit.propertyType || visit.visitType || 'Inspection';
                        return (
                            <Pressable
                                key={visit.id || idx}
                                style={[styles.listItem, idx === recentVisits.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => onDownloadVisit(visit)}
                            >
                                <View style={[styles.listIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                    <MaterialCommunityIcons
                                        name={type === 'Residential' ? 'home-outline' : 'factory'}
                                        size={20}
                                        color={THEME.colors.primary}
                                    />
                                </View>
                                <View style={styles.listInfo}>
                                    <Text style={styles.listTitle} numberOfLines={1}>
                                        {visit.clientCompanyName || visit.contactPersonName || visit.siteName || visit.companyBuildingName || 'Unknown Site'}
                                    </Text>
                                    <Text style={styles.listSub}>{visit.city || visit.industryType || 'No Location'}</Text>
                                </View>
                                <View style={styles.listAmount}>
                                    <View style={[styles.countdownBadge, { backgroundColor: THEME.colors.primary + '15', marginBottom: 4 }]}>
                                        <Text style={[styles.countdownText, { color: THEME.colors.primary, fontSize: 10 }]}>{type}</Text>
                                    </View>
                                    <Text style={styles.dateText}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                                </View>
                            </Pressable>
                        );
                    })
                )}
            </GlassPanel>

            {/* Resources Section */}
            <View style={{ marginTop: 10, marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Resources</Text>
                <View style={{ gap: 12 }}>
                    {resources.map((item, index) => (
                        <GlassPanel key={index} style={styles.trainingCard}>
                            <View style={styles.trainingIconWrapper}>
                                <MaterialCommunityIcons
                                    name={item.title.includes('Chart') ? 'chart-box-outline' : 'file-pdf-box'}
                                    size={32}
                                    color={item.title.includes('Chart') ? '#0EA5E9' : '#FF5252'}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.trainingTitle}>{item.title}</Text>
                                <Text style={styles.trainingSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Pressable
                                style={({ pressed }) => [styles.viewManualBtn, pressed && { opacity: 0.7 }]}
                                onPress={async () => {
                                    try {
                                        setLoading(true);
                                        const asset = Asset.fromModule(item.asset);
                                        await asset.downloadAsync();
                                        const uri = asset.localUri || asset.uri;

                                        if (Platform.OS === 'web') {
                                            window.open(uri, '_blank');
                                        } else {
                                            await Sharing.shareAsync(uri, {
                                                mimeType: 'application/pdf',
                                                dialogTitle: `EKOTEX ${item.title}`,
                                                UTI: 'com.adobe.pdf'
                                            });
                                        }
                                    } catch (error) {
                                        Alert.alert("Failed to Update", `Failed to open ${item.title.toLowerCase()}\nPlease try again.`);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                <MaterialCommunityIcons name="eye-outline" size={18} color="white" />
                                <Text style={styles.viewManualText}>VIEW</Text>
                            </Pressable>
                        </GlassPanel>
                    ))}
                </View>
            </View>
            <View style={{ height: 100 }} />
        </>
    );
});

const styles = StyleSheet.create({
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: { flex: 1, padding: 12, borderRadius: 16, minHeight: 110, justifyContent: 'space-between' },
    statBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    statBadgeText: { fontSize: 9, fontFamily: THEME.fonts.bold },
    statIconWrapperVerify: { width: 32, height: 32, borderRadius: 10, backgroundColor: THEME.colors.mintLight, justifyContent: 'center', alignItems: 'center' },
    statIconWrapperPending: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 24, fontFamily: THEME.fonts.black, color: THEME.colors.text, lineHeight: 28 },
    statLabel: { fontSize: 9, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary, letterSpacing: 0.8 },
    sectionCmd: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontFamily: THEME.fonts.black, color: THEME.colors.text, marginBottom: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderRadius: 100, gap: 12, shadowColor: THEME.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    actionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: THEME.colors.primary, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontSize: 14, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    seeAllText: { fontSize: 14, fontFamily: THEME.fonts.bold, color: THEME.colors.secondary },
    listContainer: { padding: 8, borderRadius: 24 },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    listIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    listInfo: { flex: 1, paddingRight: 8 },
    listTitle: { fontSize: 14, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    listSub: { fontSize: 10, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary, textTransform: 'uppercase' },
    listAmount: { alignItems: 'flex-end', marginLeft: 12, minWidth: 80 },
    amountText: { fontSize: 14, fontFamily: THEME.fonts.black, color: THEME.colors.text },
    dateText: { fontSize: 10, fontFamily: THEME.fonts.bold, color: THEME.colors.textSecondary },
    countdownBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    countdownText: { fontSize: 10, fontFamily: THEME.fonts.bold },
    trainingCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
    trainingIconWrapper: { width: 54, height: 54, borderRadius: 15, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
    trainingTitle: { fontSize: 15, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    trainingSubtitle: { fontSize: 11, fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary, marginTop: 2 },
    viewManualBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: THEME.colors.secondary },
    viewManualText: { fontSize: 11, fontFamily: THEME.fonts.bold, color: 'white' },
    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: THEME.colors.textSecondary, fontSize: 14, fontFamily: THEME.fonts.semiBold },
});
