import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Platform, ActivityIndicator, Image, StatusBar, Modal, TextInput, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import { SalesService, Sale } from '../../services/SalesService';
import { FieldVisitService } from '../../services/FieldVisitService';
import { StockService } from '../../services/StockService';
import { Stock } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthService } from '../../services/AuthService';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
import DetailedAnalyticsContent from '../../components/DetailedAnalyticsContent';
const FileSystem = require('expo-file-system/legacy');
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Alert } from 'react-native';
import { ComplaintService, Complaint } from '../../services/ComplaintService';
import { generateFieldVisitHTML } from '../../utils/FieldVisitTemplate';
import { generateComplaintPDFHTML } from '../../utils/ComplaintTemplate';
import { Asset } from 'expo-asset';
import { supabase } from '../../config/supabase';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';
// @ts-ignore
import SignStampImage from '../../assets/Warranty_pdf_template/Sign_stamp/Sign_stamp.png';
// import { SoundManager } from '../../utils/SoundManager';

const screenWidth = Dimensions.get('window').width;

// Region colors for visual distinction (updated for mint theme)
const REGION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    'Mumbai': { bg: '#D1FAE5', text: '#059669', icon: 'city' },
    'Delhi': { bg: '#FEF3C7', text: '#D97706', icon: 'city-variant' },
    'Bangalore': { bg: '#E0E7FF', text: '#4F46E5', icon: 'office-building' },
    'Chennai': { bg: '#DBEAFE', text: '#2563EB', icon: 'home-city' },
    'Kolkata': { bg: '#FCE7F3', text: '#DB2777', icon: 'city-variant-outline' },
    'Hyderabad': { bg: '#FFEDD5', text: '#EA580C', icon: 'domain' },
    'Pune': { bg: '#F3E8FF', text: '#9333EA', icon: 'town-hall' },
    'default': { bg: '#F3F4F6', text: '#6B7280', icon: 'map-marker' },
};

const getRegionColor = (city: string) => REGION_COLORS[city] || REGION_COLORS['default'];

const PRODUCT_MODELS = [
    'EKO-GREEN G3',
    'EKO-GREEN G5',
    'EKO-GREEN G6',
    'EKO-GREEN G33',
    'EKO-GREEN G130',
    'EKO-GREEN G230',
    'EKO-GREEN G330',
    'EKO-GREEN G530',
    'EKO-GREEN G600',
];

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

export default function MainBranchDashboard() {
    const { logout, user } = useAuth();
    const navigation = useNavigation<any>();
    const scrollViewRef = useRef<ScrollView>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [fieldVisits, setFieldVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Today' | 'Month' | 'Year'>('All');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [allVisits, setAllVisits] = useState<any[]>([]);
    const [showAllSales, setShowAllSales] = useState(false);
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Complaints' | 'Visits' | 'Analytics' | 'Stock' | 'Photos' | 'Users'>('Dashboard');
    const [allStock, setAllStock] = useState<Stock[]>([]);
    const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
    const [complaintLoading, setComplaintLoading] = useState(false);
    const [stockLoading, setStockLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Photos selection state (lifted for floating toolbar)
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDownloadingPhotos, setIsDownloadingPhotos] = useState(false);
    const [officialRegions, setOfficialRegions] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (isInitial: boolean = true) => {
        if (isInitial) setLoading(true);

        try {
            let salesData: Sale[] = [];
            let visitsData: any[] = [];
            let stockData: Stock[] = [];
            let complaintsData: Complaint[] = [];

            // If Super Admin, get everything. Otherwise filter by branch/region.
            if (user?.role === 'Super Admin') {
                const [s, v, st, c] = await Promise.all([
                    SalesService.getAllSales(),
                    FieldVisitService.getFieldVisits(),
                    StockService.getAllStock(),
                    ComplaintService.getComplaints()
                ]);
                salesData = s;
                visitsData = v;
                stockData = st;
                complaintsData = c;
            } else {
                // Admin/User restricted to their branch or region
                const userBranch = user?.branchId;
                const userRegion = user?.region;

                const [s, v, st, c] = await Promise.all([
                    userBranch ? SalesService.getSalesByBranch(userBranch) : SalesService.getAllSales(),
                    userBranch ? FieldVisitService.getFieldVisitsByBranch(userBranch) : FieldVisitService.getFieldVisits(),
                    userRegion ? StockService.getStockByRegion(userRegion) : StockService.getAllStock(),
                    userBranch ? ComplaintService.getComplaints(userBranch) : ComplaintService.getComplaints()
                ]);
                salesData = s;
                visitsData = v;
                stockData = st;
                complaintsData = c;
            }

            setAllSales(salesData);
            setAllVisits(visitsData);
            setAllStock(stockData);
            setAllComplaints(complaintsData || []);

            // 3. Fetch all users for management
            const { data: userData } = await supabase.from('users').select('*');

            // Only sub-branch users with regions should be considered "official regions" for dashboard stats
            const officialUsers = (userData || []).filter(u => u.region);
            const uniqueRegions = Array.from(new Set(officialUsers.map(u => u.region)));

            setOfficialRegions(uniqueRegions);
            setAllUsers(userData || []);

            // Set initial display sales
            setSales(salesData);
            setFieldVisits(visitsData.slice(0, 5));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user?.role, user?.branchId, user?.region]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData(false);
        setRefreshing(false);
    }, [fetchData]);

    useFocusEffect(useCallback(() => {
        fetchData(true);
    }, [fetchData]));

    const handleViewMoreToggle = () => {
        setShowAllSales(!showAllSales);
    };

    // Filter by time
    const filteredSales = useMemo(() => {
        const now = new Date();
        return allSales.filter(s => {
            // Only include sales from regions that exist in our official user list
            const isOfficial = officialRegions.includes(s.city);
            if (!isOfficial && officialRegions.length > 0) return false;

            if (filter === 'All') return true;
            const date = new Date(s.saleDate);
            if (filter === 'Today') return date.toDateString() === now.toDateString();
            if (filter === 'Month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            if (filter === 'Year') return date.getFullYear() === now.getFullYear();
            return true;
        });
    }, [allSales, filter, officialRegions]);

    const filteredVisits = useMemo(() => {
        const now = new Date();
        return allVisits.filter(v => {
            // Only include visits from official regions
            const isOfficial = officialRegions.includes((v as any).city);
            if (!isOfficial && officialRegions.length > 0) return false;

            const visitDate = new Date(v.visitDate);
            if (filter === 'All') return true;
            if (filter === 'Today') return visitDate.toDateString() === now.toDateString();
            if (filter === 'Month') return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
            if (filter === 'Year') return visitDate.getFullYear() === now.getFullYear();
            return true;
        });
    }, [allVisits, filter, officialRegions]);

    // Display sales (filtered by region if selected)
    const displaySales = useMemo(() => {
        let list = filteredSales;
        if (selectedRegion) {
            list = list.filter(s => s.city === selectedRegion);
        }

        return [...list].sort((a, b) => {
            const dateA = new Date(a.saleDate).getTime();
            const dateB = new Date(b.saleDate).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [filteredSales, selectedRegion, sortOrder]);

    // Display visits (filtered by region if selected)
    const displayVisits = useMemo(() => {
        let list = filteredVisits;
        if (selectedRegion) {
            list = list.filter(v => (v as any).city === selectedRegion);
        }

        return [...list].sort((a, b) => {
            const dateA = new Date(a.visitDate || (a as any).dateOfVisit).getTime();
            const dateB = new Date(b.visitDate || (b as any).dateOfVisit).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [filteredVisits, selectedRegion, sortOrder]);

    const totalSalesCount = filteredSales.length;
    const totalVisitsCount = filteredVisits.length;
    const pendingVisitsCount = filteredVisits.filter(v => v.status === 'pending').length;
    const approvedSalesCount = filteredSales.filter(s => s.status === 'approved').length;

    // Real data for visit analytics graph
    const visitGraphData = useMemo(() => {
        // Get last 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const labels: string[] = [];
        const counts: number[] = [];

        // Apply region filter if selected
        const baseVisits = selectedRegion
            ? filteredVisits.filter(v => (v as any).city === selectedRegion)
            : filteredVisits;

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(days[date.getDay()]);

            // Count visits for this day
            const dayVisits = baseVisits.filter(visit => {
                const vDate = visit.visitDate || (visit as any).dateOfVisit;
                if (!vDate) return false;
                const vD = new Date(vDate);
                return vD.getFullYear() === date.getFullYear() &&
                    vD.getMonth() === date.getMonth() &&
                    vD.getDate() === date.getDate();
            }).length;

            counts.push(dayVisits);
        }

        return {
            labels,
            datasets: [{
                data: counts,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                strokeWidth: 2
            }]
        };
    }, [allVisits, selectedRegion]); // Refresh when visits or selection changes

    // Calculate top selling models from filtered sales
    const topSellingModels = useMemo(() => {
        const productStats = filteredSales.reduce((acc: any, sale) => {
            acc[sale.productModel] = (acc[sale.productModel] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(productStats)
            .map(([name, units]: [string, any]) => ({ name, units }))
            .sort((a, b) => b.units - a.units)
            .slice(0, 3);
    }, [filteredSales]);

    // Region stats from filtered data
    const regionStats = useMemo(() => {
        const grouped: Record<string, { region: string; total: number; approved: number; pending: number }> = {};

        // Initialize all official regions with 0
        officialRegions.forEach(r => {
            grouped[r] = { region: r, total: 0, approved: 0, pending: 0 };
        });

        filteredSales.forEach(item => {
            const region = item.city;
            if (!region || !grouped[region]) return; // Skip non-official regions (random data)

            grouped[region].total++;
            if (item.status === 'approved') grouped[region].approved++;
            if (item.status === 'pending') grouped[region].pending++;
        });
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [filteredSales, officialRegions]);

    const visitRegionStats = useMemo(() => {
        const grouped: Record<string, { region: string; total: number; completed: number; pending: number }> = {};

        // Initialize all official regions with 0
        officialRegions.forEach(r => {
            grouped[r] = { region: r, total: 0, completed: 0, pending: 0 };
        });

        filteredVisits.forEach(item => {
            const region = (item as any).city;
            if (!region || !grouped[region]) return; // Skip non-official

            grouped[region].total++;
            if (item.status === 'completed') grouped[region].completed++;
            if (item.status === 'pending') grouped[region].pending++;
        });
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [filteredVisits, officialRegions]);
    const filteredComplaints = useMemo(() => {
        const now = new Date();
        return allComplaints.filter(c => {
            // Only include complaints from official regions
            const isOfficial = officialRegions.includes((c as any).city);
            if (!isOfficial && officialRegions.length > 0) return false;

            if (filter === 'All') return true;
            const date = new Date(c.dateOfComplaint);
            if (filter === 'Today') return date.toDateString() === now.toDateString();
            if (filter === 'Month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            if (filter === 'Year') return date.getFullYear() === now.getFullYear();
            return true;
        });
    }, [allComplaints, filter, officialRegions]);

    const complaintRegionStats = useMemo(() => {
        const grouped: Record<string, { region: string; total: number; resolved: number; unresolved: number }> = {};

        // Initialize all official regions with 0
        officialRegions.forEach(r => {
            grouped[r] = { region: r, total: 0, resolved: 0, unresolved: 0 };
        });

        filteredComplaints.forEach(item => {
            const region = (item as any).city;
            if (!region || !grouped[region]) return; // Skip non-official

            grouped[region].total++;
            if (item.status === 'Resolved' || item.status === 'Closed') {
                grouped[region].resolved++;
            } else {
                grouped[region].unresolved++;
            }
        });
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [filteredComplaints, officialRegions]);

    // Display complaints (filtered by region if selected)
    const displayComplaints = useMemo(() => {
        let list = filteredComplaints;
        if (selectedRegion) {
            list = list.filter(c => (c as any).city === selectedRegion);
        }

        return [...list].sort((a, b) => {
            const dateA = new Date(a.dateOfComplaint).getTime();
            const dateB = new Date(b.dateOfComplaint).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [filteredComplaints, selectedRegion, sortOrder]);

    const activeComplaintCount = filteredComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;

    const calculateDaysPassed = (date: string) => {
        const start = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - start.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleDownloadComplaint = async (complaint: Complaint) => {
        try {
            // Resolve assets
            const logoAsset = Asset.fromModule(LogoImage);
            const signAsset = Asset.fromModule(SignStampImage);
            await Promise.all([logoAsset.downloadAsync(), signAsset.downloadAsync()]);

            const logoUri = logoAsset.localUri || logoAsset.uri;
            const signUri = signAsset.localUri || signAsset.uri;

            const html = generateComplaintPDFHTML(complaint, logoUri, signUri);

            if (Platform.OS === 'web') {
                await Print.printAsync({ html });
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to generate complaint report');
        }
    };

    const handleDownloadVisit = async (visit: any) => {
        try {
            // Resolve assets
            const logoAsset = Asset.fromModule(LogoImage);
            const signAsset = Asset.fromModule(SignStampImage);
            await Promise.all([logoAsset.downloadAsync(), signAsset.downloadAsync()]);

            const logoUri = logoAsset.localUri || logoAsset.uri;
            const signUri = signAsset.localUri || signAsset.uri;

            const html = generateFieldVisitHTML(visit, logoUri, signUri);

            if (Platform.OS === 'web') {
                await Print.printAsync({ html });
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to generate field visit report');
        }
    };
    const handleDownloadPhotos = async () => {
        if (selectedPhotos.length === 0) return;
        setIsDownloadingPhotos(true);

        try {
            for (const url of selectedPhotos) {
                const filename = url.split('/').pop()?.split('?')[0] || `photo_${Date.now()}.jpg`;
                const fileUri = `${FileSystem.cacheDirectory}${filename}`;
                const downloadedFile = await FileSystem.downloadAsync(url, fileUri);

                if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadedFile.uri);
                } else {
                    alert('Download started for: ' + filename);
                }
            }
            setSelectedPhotos([]);
            setIsSelectionMode(false);
            Alert.alert('Success', 'Photos processed successfully');
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to process photos');
        } finally {
            setIsDownloadingPhotos(false);
        }
    };

    return (
        <MeshBackground>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={THEME.colors.primary}
                        colors={[THEME.colors.primary]}
                    />
                }
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <GlassPanel style={styles.logoWrapper} intensity={40}>
                            <Image source={LogoImage} style={styles.companyLogo} resizeMode="contain" />
                        </GlassPanel>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.greeting} numberOfLines={1}>{activeTab}</Text>
                            <Text style={styles.subtitle} numberOfLines={1}>{user?.name ? `Welcome, ${user.name}` : 'EKOTEX Admin'}</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable onPress={() => navigation.navigate('Profile')} style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7 }]}>
                            <GlassPanel style={styles.profileIcon} intensity={40}>
                                <MaterialCommunityIcons name="account-cog-outline" size={20} color={THEME.colors.secondary} />
                            </GlassPanel>
                        </Pressable>
                        <Pressable onPress={logout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}>
                            <GlassPanel style={styles.logoutIcon} intensity={40}>
                                <MaterialCommunityIcons name="logout" size={20} color={THEME.colors.error} />
                            </GlassPanel>
                        </Pressable>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <GlassPanel style={styles.tabSwitcher} intensity={30}>
                        <Pressable
                            onPress={() => setActiveTab('Dashboard')}
                            style={[styles.tabButton, activeTab === 'Dashboard' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, activeTab === 'Dashboard' && styles.tabButtonTextActive]}>Dashboard</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setActiveTab('Analytics')}
                            style={[styles.tabButton, activeTab === 'Analytics' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, activeTab === 'Analytics' && styles.tabButtonTextActive]}>Analytics</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveTab('Stock')}
                            style={[styles.tabButton, activeTab === 'Stock' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, activeTab === 'Stock' && styles.tabButtonTextActive]}>Stock</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveTab('Photos')}
                            style={[styles.tabButton, activeTab === 'Photos' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, activeTab === 'Photos' && styles.tabButtonTextActive]}>Photos</Text>
                        </Pressable>

                        {user?.role === 'Super Admin' && (
                            <Pressable
                                onPress={() => setActiveTab('Users')}
                                style={[styles.tabButton, activeTab === 'Users' && styles.tabButtonActive]}
                            >
                                <Text style={[styles.tabButtonText, activeTab === 'Users' && styles.tabButtonTextActive]}>Users</Text>
                            </Pressable>
                        )}
                    </GlassPanel>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <GlassPanel style={styles.loadingPanel}>
                            <ActivityIndicator size="large" color={THEME.colors.secondary} />
                            <Text style={styles.loadingText}>Loading dashboard data...</Text>
                        </GlassPanel>
                    </View>
                ) : activeTab === 'Dashboard' ? (
                    <>
                        {/* Main Stats Bento Grid */}
                        <View style={styles.bentoGrid}>
                            <LinearGradient
                                colors={[THEME.colors.secondary, '#58A47D']}
                                style={styles.mainStatCard}
                            >
                                <View style={styles.statTop}>
                                    <View style={styles.statIconWrapper}>
                                        <MaterialCommunityIcons name="chart-bar" size={24} color={THEME.colors.mintLight} />
                                    </View>
                                    <View style={styles.statBadge}>
                                        <Text style={styles.badgeText}>+12%</Text>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.mainStatValue} numberOfLines={1} adjustsFontSizeToFit>{totalSalesCount}</Text>
                                    <Text style={styles.mainStatLabel} numberOfLines={1}>Total Units Sold</Text>
                                </View>
                            </LinearGradient>

                            <View style={styles.bentoColumn}>
                                <Pressable
                                    onPress={() => setActiveTab('Visits')}
                                    style={({ pressed }) => [
                                        styles.statBox,
                                        { backgroundColor: THEME.colors.mintLight + '80' },
                                        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.statBoxValue, { color: '#047857' }]} numberOfLines={1} adjustsFontSizeToFit>{totalVisitsCount}</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#047857" />
                                    </View>
                                    <Text style={[styles.statBoxLabel, { color: '#065F46' }]} numberOfLines={1}>Field Visits</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setActiveTab('Complaints')}
                                    style={({ pressed }) => [
                                        styles.statBox,
                                        { backgroundColor: '#FEE2E280' },
                                        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.statBoxValue, { color: '#EF4444' }]} numberOfLines={1} adjustsFontSizeToFit>{activeComplaintCount}</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#EF4444" />
                                    </View>
                                    <Text style={[styles.statBoxLabel, { color: '#B91C1C' }]} numberOfLines={1}>Active Complaints</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Visit Analytics Graph */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Visit Analytics</Text>
                        </View>
                        <GlassPanel style={styles.graphCard}>
                            <LineChart
                                data={visitGraphData}
                                width={screenWidth - 80}
                                height={180}
                                fromZero={true}
                                chartConfig={{
                                    backgroundColor: 'transparent',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                    propsForDots: {
                                        r: '4',
                                        strokeWidth: '2',
                                        stroke: '#10B981'
                                    },
                                    style: {
                                        borderRadius: 16
                                    }
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16,
                                    paddingRight: 32
                                }}
                            />
                        </GlassPanel>

                        {/* Filter Chips */}
                        <View style={styles.filterRow}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
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

                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                <Pressable
                                    style={[styles.sortChip, sortOrder === 'newest' && styles.sortChipActive]}
                                    onPress={() => setSortOrder('newest')}
                                >
                                    <MaterialCommunityIcons
                                        name="sort-calendar-descending"
                                        size={14}
                                        color={sortOrder === 'newest' ? THEME.colors.secondary : THEME.colors.textSecondary}
                                    />
                                    <Text style={[styles.sortChipText, sortOrder === 'newest' && styles.sortChipTextActive]}>Newest First</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.sortChip, sortOrder === 'oldest' && styles.sortChipActive]}
                                    onPress={() => setSortOrder('oldest')}
                                >
                                    <MaterialCommunityIcons
                                        name="sort-calendar-ascending"
                                        size={14}
                                        color={sortOrder === 'oldest' ? THEME.colors.secondary : THEME.colors.textSecondary}
                                    />
                                    <Text style={[styles.sortChipText, sortOrder === 'oldest' && styles.sortChipTextActive]}>Oldest First</Text>
                                </Pressable>
                            </View>
                        </View>



                        {/* Sales Region Performance */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Sales Region Performance</Text>
                            {selectedRegion && (
                                <Pressable onPress={() => setSelectedRegion(null)}>
                                    <Text style={styles.seeAllText}>Clear Filter</Text>
                                </Pressable>
                            )}
                        </View>

                        {regionStats.length === 0 ? (
                            <GlassPanel style={styles.emptyState}>
                                <MaterialCommunityIcons name="map-marker-off" size={48} color={THEME.colors.textSecondary} />
                                <Text style={styles.emptyText}>No sales data available</Text>
                            </GlassPanel>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.regionScroll}
                                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                            >
                                {regionStats.map(({ region, total, approved, pending }) => {
                                    const colors = getRegionColor(region);
                                    const isSelected = selectedRegion === region;
                                    return (
                                        <Pressable
                                            key={region}
                                            onPress={() => setSelectedRegion(isSelected ? null : region)}
                                        >
                                            <GlassPanel
                                                style={[
                                                    styles.regionCard,
                                                    isSelected && styles.regionCardSelected
                                                ]}
                                            >
                                                <View style={[styles.regionIcon, { backgroundColor: colors.bg }]}>
                                                    <MaterialCommunityIcons
                                                        name={colors.icon as any}
                                                        size={20}
                                                        color={colors.text}
                                                    />
                                                </View>
                                                <Text style={styles.regionName} numberOfLines={1}>{region}</Text>
                                                <Text style={styles.regionTotal} numberOfLines={1}>{total} Sales</Text>

                                                <View style={styles.progressBar}>
                                                    <View
                                                        style={[
                                                            styles.progressFill,
                                                            { width: `${(approved / (total || 1)) * 100}%` as any, backgroundColor: colors.text }
                                                        ]}
                                                    />
                                                </View>
                                            </GlassPanel>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Recent Activity List */}
                        <View style={styles.listHeader}>
                            <Text style={styles.sectionTitle}>
                                {selectedRegion ? `${selectedRegion} Sales` : 'Recent Warranty'}
                            </Text>
                        </View>

                        {displaySales.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No sales found</Text>
                            </View>
                        ) : (
                            <GlassPanel style={{ padding: 8 }}>
                                {(showAllSales ? displaySales : displaySales.slice(0, 3)).map((s, index) => {
                                    const countdown = calculateDaysRemaining(s.saleDate);
                                    return (
                                        <Pressable
                                            key={s.id}
                                            style={({ pressed }) => [
                                                styles.listItem,
                                                pressed && { backgroundColor: 'rgba(255,255,255,0.4)' },
                                                index === displaySales.length - 1 && { borderBottomWidth: 0 }
                                            ]}
                                            onPress={() => navigation.navigate('WarrantyCard', { sale: s })}
                                        >
                                            <View style={[styles.listIcon, { backgroundColor: s.status === 'approved' ? THEME.colors.mintLight : '#FFFBEB' }]}>
                                                <View style={styles.statusIndicator}>
                                                    <MaterialCommunityIcons
                                                        name={s.status === 'approved' ? 'check-circle' : 'clock-outline'}
                                                        size={20}
                                                        color={s.status === 'approved' ? THEME.colors.success : THEME.colors.warning}
                                                    />
                                                </View>
                                            </View>
                                            <View style={styles.listContent}>
                                                <Text style={styles.listTitle} numberOfLines={1}>{s.customerName}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                                    <Text style={[styles.listSub, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{s.productModel}</Text>
                                                    <View style={[styles.countdownBadge, { backgroundColor: countdown.color + '20' }]}>
                                                        <Text style={[styles.countdownText, { color: countdown.color }]}>
                                                            {countdown.label}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={styles.listRight}>
                                                <Text style={styles.listDate}>{new Date(s.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                                                <Text style={styles.listCity} numberOfLines={1}>{s.city}</Text>
                                            </View>
                                            <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textSecondary} style={{ marginLeft: 8 }} />
                                        </Pressable>
                                    );
                                })}

                                {/* View More / Show Less Button */}
                                {(totalSalesCount > 3 || showAllSales) && (
                                    <Pressable
                                        onPress={handleViewMoreToggle}
                                        style={({ pressed }) => [
                                            styles.viewMoreBtn,
                                            pressed && { opacity: 0.7 }
                                        ]}
                                    >
                                        <Text style={styles.viewMoreText}>
                                            {showAllSales ? 'Show Less' : `View More Transactions (${totalSalesCount - 3} more)`}
                                        </Text>
                                        <MaterialCommunityIcons
                                            name={showAllSales ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={THEME.colors.primary}
                                        />
                                    </Pressable>
                                )}
                            </GlassPanel>
                        )}
                    </>
                ) : activeTab === 'Complaints' ? (
                    <View style={{ paddingHorizontal: 4, marginBottom: 24 }}>
                        <View style={styles.sectionHeader}>
                            <Pressable
                                onPress={() => setActiveTab('Dashboard')}
                                style={({ pressed }) => [
                                    { flexDirection: 'row', alignItems: 'center', gap: 8 },
                                    pressed && { opacity: 0.7 }
                                ]}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.text} />
                                <Text style={styles.sectionTitle}>Back to Dashboard</Text>
                            </Pressable>
                        </View>
                        <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />

                        {complaintRegionStats.length === 0 ? (
                            <GlassPanel style={styles.emptyState}>
                                <MaterialCommunityIcons name="alert-circle-check-outline" size={48} color={THEME.colors.success} />
                                <Text style={styles.emptyText}>No active complaints! Great job.</Text>
                            </GlassPanel>
                        ) : (
                            <>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={[styles.regionScroll, { marginBottom: 16 }]}
                                    contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                                >
                                    {complaintRegionStats.map(({ region, total, resolved, unresolved }) => {
                                        const colors = getRegionColor(region);
                                        const isSelected = selectedRegion === region;
                                        return (
                                            <Pressable key={region} onPress={() => setSelectedRegion(isSelected ? null : region)}>
                                                <GlassPanel
                                                    style={[
                                                        styles.regionCard,
                                                        isSelected && styles.regionCardSelected
                                                    ]}
                                                >
                                                    <View style={[styles.regionIcon, { backgroundColor: colors.bg }]}>
                                                        <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.text} />
                                                    </View>
                                                    <Text style={styles.regionName} numberOfLines={1}>{region}</Text>
                                                    <Text style={styles.regionTotal} numberOfLines={1}>{total} Complaints</Text>
                                                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                                                        <View style={{ backgroundColor: THEME.colors.success + '20', paddingHorizontal: 4, borderRadius: 4 }}>
                                                            <Text style={{ fontSize: 9, color: THEME.colors.success }}>{resolved} Res</Text>
                                                        </View>
                                                        <View style={{ backgroundColor: THEME.colors.error + '20', paddingHorizontal: 4, borderRadius: 4 }}>
                                                            <Text style={{ fontSize: 9, color: THEME.colors.error }}>{unresolved} Unres</Text>
                                                        </View>
                                                    </View>
                                                </GlassPanel>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>

                                <GlassPanel style={{ padding: 8 }}>
                                    {displayComplaints.map((comp: any, idx: number) => {
                                        const daysPassed = calculateDaysPassed(comp.dateOfComplaint);
                                        const isResolved = comp.status === 'Resolved' || comp.status === 'Closed';
                                        return (
                                            <Pressable
                                                key={comp.id || idx}
                                                style={[styles.listItem, idx === displayComplaints.length - 1 && { borderBottomWidth: 0 }]}
                                                onPress={() => navigation.navigate('RaiseComplaintStep2', {
                                                    complaint: comp,
                                                    clientData: {
                                                        invoiceNumber: comp.invoiceNo,
                                                        customerName: comp.customerName,
                                                        phone: comp.customerPhone,
                                                        email: comp.customerEmail,
                                                        city: comp.city
                                                    }
                                                })}
                                            >
                                                <View style={[styles.listIcon, { backgroundColor: isResolved ? THEME.colors.mintLight : '#FEE2E2' }]}>
                                                    <MaterialCommunityIcons
                                                        name={isResolved ? "check-circle" : "alert-circle"}
                                                        size={20}
                                                        color={isResolved ? THEME.colors.success : THEME.colors.error}
                                                    />
                                                </View>
                                                <View style={styles.listContent}>
                                                    <Text style={styles.listTitle} numberOfLines={1}>{comp.customerName}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <View style={[styles.tag, { backgroundColor: isResolved ? THEME.colors.success + '20' : THEME.colors.error + '20' }]}>
                                                            <Text style={[styles.tagText, { color: isResolved ? THEME.colors.success : THEME.colors.error }]}>
                                                                {isResolved ? 'Resolved' : 'Unresolved'}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.listSub}>{daysPassed} days passed</Text>
                                                    </View>
                                                </View>
                                                <Pressable onPress={() => handleDownloadComplaint(comp)} style={styles.downloadIconBtn}>
                                                    <MaterialCommunityIcons name="download" size={20} color={THEME.colors.primary} />
                                                </Pressable>
                                            </Pressable>
                                        );
                                    })}
                                </GlassPanel>
                            </>
                        )}
                    </View>
                ) : activeTab === 'Visits' ? (
                    <View style={{ paddingHorizontal: 4, marginBottom: 24 }}>
                        <View style={styles.sectionHeader}>
                            <Pressable
                                onPress={() => setActiveTab('Dashboard')}
                                style={({ pressed }) => [
                                    { flexDirection: 'row', alignItems: 'center', gap: 8 },
                                    pressed && { opacity: 0.7 }
                                ]}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.text} />
                                <Text style={styles.sectionTitle}>Back to Dashboard</Text>
                            </Pressable>
                        </View>
                        <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />

                        {visitRegionStats.length === 0 ? (
                            <GlassPanel style={styles.emptyState}>
                                <MaterialCommunityIcons name="map-marker-off" size={48} color={THEME.colors.textSecondary} />
                                <Text style={styles.emptyText}>No field visits found.</Text>
                            </GlassPanel>
                        ) : (
                            <>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={[styles.regionScroll, { marginBottom: 16 }]}
                                    contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                                >
                                    {visitRegionStats.map(({ region, total, completed, pending }) => {
                                        const colors = getRegionColor(region);
                                        const isSelected = selectedRegion === region;
                                        return (
                                            <Pressable key={region} onPress={() => setSelectedRegion(isSelected ? null : region)}>
                                                <GlassPanel
                                                    style={[
                                                        styles.regionCard,
                                                        isSelected && styles.regionCardSelected
                                                    ]}
                                                >
                                                    <View style={[styles.regionIcon, { backgroundColor: colors.bg }]}>
                                                        <MaterialCommunityIcons name={colors.icon as any} size={20} color={colors.text} />
                                                    </View>
                                                    <Text style={styles.regionName} numberOfLines={1}>{region}</Text>
                                                    <Text style={styles.regionTotal} numberOfLines={1}>{total} Visits</Text>
                                                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                                                        <View style={{ backgroundColor: THEME.colors.success + '20', paddingHorizontal: 4, borderRadius: 4 }}>
                                                            <Text style={{ fontSize: 9, color: THEME.colors.success }}>{completed} Done</Text>
                                                        </View>
                                                        <View style={{ backgroundColor: THEME.colors.warning + '20', paddingHorizontal: 4, borderRadius: 4 }}>
                                                            <Text style={{ fontSize: 9, color: THEME.colors.warning }}>{pending} Pend</Text>
                                                        </View>
                                                    </View>
                                                </GlassPanel>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>

                                <GlassPanel style={{ padding: 8 }}>
                                    {displayVisits.map((visit, idx) => {
                                        const isDone = visit.status === 'completed' || visit.status === 'Done';
                                        return (
                                            <View key={visit.id || idx} style={[styles.listItem, idx === allVisits.length - 1 && { borderBottomWidth: 0 }]}>
                                                <View style={[styles.listIcon, { backgroundColor: isDone ? THEME.colors.mintLight : '#FEF3C7' }]}>
                                                    <MaterialCommunityIcons
                                                        name={isDone ? "check-circle" : "clock-outline"}
                                                        size={20}
                                                        color={isDone ? THEME.colors.success : THEME.colors.warning}
                                                    />
                                                </View>
                                                <View style={styles.listContent}>
                                                    <Text style={styles.listTitle} numberOfLines={1}>{visit.customerName}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <View style={[styles.tag, { backgroundColor: isDone ? THEME.colors.success + '20' : THEME.colors.warning + '20' }]}>
                                                            <Text style={[styles.tagText, { color: isDone ? THEME.colors.success : THEME.colors.warning }]}>
                                                                {isDone ? 'Completed' : 'Pending'}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.listSub}>{visit.city}</Text>
                                                    </View>
                                                </View>
                                                <Pressable onPress={() => handleDownloadVisit(visit)} style={styles.downloadIconBtn}>
                                                    <MaterialCommunityIcons name="file-download-outline" size={22} color={THEME.colors.primary} />
                                                </Pressable>
                                            </View>
                                        );
                                    })}
                                </GlassPanel>
                            </>
                        )}
                    </View>
                ) : activeTab === 'Analytics' ? (
                    <DetailedAnalyticsContent sales={allSales} />
                ) : activeTab === 'Stock' ? (
                    <StockManagementContent
                        allStock={allStock}
                        onUpdate={() => fetchData(false)}
                        scrollViewRef={scrollViewRef}
                        officialRegions={officialRegions}
                    />
                ) : activeTab === 'Photos' ? (
                    <PhotosGalleryContent
                        allSales={allSales}
                        selectedPhotos={selectedPhotos}
                        setSelectedPhotos={setSelectedPhotos}
                        isSelectionMode={isSelectionMode}
                        setIsSelectionMode={setIsSelectionMode}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                    />
                ) : activeTab === 'Users' ? (
                    <UserTabContent
                        allUsers={allUsers}
                        currentUser={user}
                        onDelete={(email) => {
                            Alert.alert(
                                'Delete User',
                                `Are you sure you want to delete ${email}? This user will lose all database access.`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                await AuthService.deleteUser(email);
                                                fetchData(false);
                                                Alert.alert('Success', 'User deleted successfully');
                                            } catch (err) {
                                                Alert.alert('Error', 'Failed to delete user');
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                        onEdit={(u) => {
                            setEditingUser(u);
                        }}
                    />
                ) : null}
            </ScrollView>

            <EditUserModal
                visible={!!editingUser}
                user={editingUser}
                onClose={() => setEditingUser(null)}
                isUpdating={isUpdatingUser}
                officialRegions={officialRegions}
                onSave={async (email, updates) => {
                    setIsUpdatingUser(true);
                    try {
                        await AuthService.adminUpdateProfile(email, {
                            name: updates.name,
                            role: updates.role,
                            branchId: updates.branch_id,
                            region: updates.region
                        });
                        await fetchData(false);
                        setEditingUser(null);
                        Alert.alert('Success', 'User updated successfully');
                    } catch (err) {
                        Alert.alert('Error', 'Failed to update user');
                    } finally {
                        setIsUpdatingUser(false);
                    }
                }}
            />

            {/* Fixed Floating Toolbar for Photos Selection */}
            {activeTab === 'Photos' && isSelectionMode && (
                <View style={styles.bottomToolbarContainer}>
                    <GlassPanel style={styles.bottomToolbar} intensity={98}>
                        <View style={styles.toolbarContent}>
                            <Text style={styles.selectionCount}>
                                {selectedPhotos.length > 0 ? `${selectedPhotos.length} Selected` : 'Select Items'}
                            </Text>
                            <Pressable
                                onPress={handleDownloadPhotos}
                                disabled={selectedPhotos.length === 0 || isDownloadingPhotos}
                                style={({ pressed }) => [
                                    styles.downloadActionBtn,
                                    (selectedPhotos.length === 0 || isDownloadingPhotos) && { opacity: 0.5 },
                                    pressed && { opacity: 0.7 }
                                ]}
                            >
                                {isDownloadingPhotos ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <MaterialCommunityIcons name="download" size={20} color="white" />
                                )}
                                <Text style={styles.downloadActionText}>Download</Text>
                            </Pressable>
                        </View>
                    </GlassPanel>
                </View>
            )}
        </MeshBackground>
    );
}

const StockManagementContent = ({ allStock, onUpdate, scrollViewRef, officialRegions }: { allStock: Stock[], onUpdate: () => void, scrollViewRef: React.RefObject<ScrollView | null>, officialRegions: string[] }) => {
    // Determine the regions to show (fallback to a default list if empty)
    const regionsList = officialRegions.length > 0 ? officialRegions : ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune'];
    const [selectedRegion, setSelectedRegion] = useState(regionsList[0]);
    const [modelName, setModelName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [updating, setUpdating] = useState(false);

    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const handleUpdate = async () => {
        if (!modelName || !quantity) {
            alert('Please enter model name and quantity');
            return;
        }
        setUpdating(true);
        try {
            await StockService.updateStock(selectedRegion, modelName, parseInt(quantity));
            setModelName('');
            setQuantity('');
            onUpdate();
            alert('Stock updated successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to update stock');
        } finally {
            setUpdating(false);
        }
    };

    const regionalStock = allStock.filter(s => s.region === selectedRegion);

    return (
        <View style={{ paddingBottom: 20 }}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Stock Management</Text>
            </View>

            <GlassPanel style={{ padding: 20, marginBottom: 24 }}>
                <Text style={[styles.listTitle, { marginBottom: 16 }]}>Update Stock Level</Text>

                <Text style={styles.listSub}>Select Region</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                    {regionsList.map(r => (
                        <Pressable
                            key={r}
                            onPress={() => setSelectedRegion(r)}
                            style={[
                                styles.chip,
                                selectedRegion === r && styles.chipActive,
                                { marginRight: 8 }
                            ]}
                        >
                            <Text style={[styles.chipText, selectedRegion === r && styles.chipTextActive]}>{r}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <View style={{ gap: 12, marginTop: 8 }}>
                    <View>
                        <Text style={styles.listSub}>Model Name</Text>
                        <Pressable onPress={() => setShowModelDropdown(true)}>
                            <GlassPanel style={{ padding: 12, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.6)' }} intensity={10}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="tag-outline" size={20} color={THEME.colors.textSecondary} />
                                        <Text style={{ marginLeft: 8, color: modelName ? THEME.colors.text : THEME.colors.textSecondary }}>
                                            {modelName || 'Select Model'}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={THEME.colors.textSecondary} />
                                </View>
                            </GlassPanel>
                        </Pressable>
                    </View>

                    <View>
                        <Text style={styles.listSub}>Quantity</Text>
                        <GlassPanel style={{ padding: 12, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.6)' }} intensity={10}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        style={{ color: THEME.colors.text, fontSize: 14, padding: 0 }}
                                        placeholder="Enter Quantity"
                                        placeholderTextColor={THEME.colors.textSecondary}
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                        </GlassPanel>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                        <Pressable
                            onPress={handleUpdate}
                            disabled={updating}
                            style={({ pressed }) => [
                                {
                                    backgroundColor: THEME.colors.secondary,
                                    padding: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    flex: 1,
                                    opacity: (pressed || updating) ? 0.8 : 1
                                }
                            ]}
                        >
                            {updating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: 'white', fontFamily: THEME.fonts.bold }}>Update Stock</Text>
                            )}
                        </Pressable>

                        {(modelName || quantity) && (
                            <Pressable
                                onPress={() => {
                                    setModelName('');
                                    setQuantity('');
                                }}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: '#FED7D7',
                                        width: 54,
                                        borderRadius: 12,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        opacity: pressed ? 0.7 : 1
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons name="refresh" size={24} color="#C53030" />
                            </Pressable>
                        )}
                    </View>
                </View>
            </GlassPanel>

            {/* Model Selection Modal */}
            <Modal
                visible={showModelDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModelDropdown(false)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => setShowModelDropdown(false)}
                >
                    <View style={{ width: '85%', maxHeight: '60%', backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
                        <Text style={[styles.listTitle, { marginBottom: 16, textAlign: 'center' }]}>Select Model</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {PRODUCT_MODELS.map((model, index) => (
                                <Pressable
                                    key={index}
                                    style={({ pressed }) => [
                                        {
                                            paddingVertical: 12,
                                            paddingHorizontal: 16,
                                            borderBottomWidth: index === PRODUCT_MODELS.length - 1 ? 0 : 1,
                                            borderBottomColor: '#F3F4F6',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        },
                                        pressed && { backgroundColor: '#F9FAFB' }
                                    ]}
                                    onPress={() => {
                                        setModelName(model);
                                        setShowModelDropdown(false);
                                    }}
                                >
                                    <Text style={{ fontSize: 16, color: THEME.colors.text, fontWeight: modelName === model ? '700' : '400' }}>
                                        {model}
                                    </Text>
                                    {modelName === model && (
                                        <MaterialCommunityIcons name="check" size={20} color={THEME.colors.primary} />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Current Stock in {selectedRegion}</Text>
            </View>

            {regionalStock.length === 0 ? (
                <GlassPanel style={styles.emptyState}>
                    <MaterialCommunityIcons name="package-variant-closed" size={48} color={THEME.colors.textSecondary} />
                    <Text style={styles.emptyText}>No stock data for this region</Text>
                </GlassPanel>
            ) : (
                <GlassPanel style={{ padding: 8 }}>
                    {regionalStock.map((s, index) => (
                        <View
                            key={s.id}
                            style={[
                                styles.listItem,
                                index === regionalStock.length - 1 && { borderBottomWidth: 0 }
                            ]}
                        >
                            <View style={[styles.listIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                <MaterialCommunityIcons name="package-variant" size={24} color={THEME.colors.secondary} />
                            </View>
                            <View style={styles.listContent}>
                                <Text style={styles.listTitle}>{s.modelName}</Text>
                                <Text style={styles.listSub}>Last updated: {new Date(s.updatedAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={[styles.listRight, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.mainStatValue, { color: THEME.colors.text, fontSize: 24 }]}>{s.quantity}</Text>
                                    <Text style={styles.listSub}>Units</Text>
                                </View>
                                <Pressable
                                    onPress={() => {
                                        setModelName(s.modelName);
                                        setQuantity(s.quantity.toString());
                                        // Scroll to form
                                        scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                                        // Feedback to user
                                        Alert.alert(
                                            'Edit Stock',
                                            `Selected ${s.modelName}. Modified quantity will be updated in the form above.`,
                                            [{ text: 'OK' }]
                                        );
                                    }}
                                    style={({ pressed }) => [
                                        {
                                            padding: 8,
                                            backgroundColor: THEME.colors.mintLight,
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: 'rgba(5, 150, 105, 0.1)'
                                        },
                                        pressed && { opacity: 0.7, backgroundColor: 'rgba(5, 150, 105, 0.2)' }
                                    ]}
                                >
                                    <MaterialCommunityIcons name="pencil-outline" size={18} color={THEME.colors.secondary} />
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </GlassPanel>
            )}
        </View>
    );
};

const PhotoItem = React.memo(({ url, itemSize, isSelectionMode, isSelected, onPress, onLongPress }: any) => {
    const [loading, setLoading] = useState(true);

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ width: itemSize, height: itemSize, marginBottom: 12, position: 'relative' }}
        >
            <Image
                source={{ uri: url }}
                style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#f0f0f0' }}
                resizeMode="cover"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
            />
            {loading && (
                <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12 }]}>
                    <ActivityIndicator size="small" color={THEME.colors.primary} />
                </View>
            )}
            {isSelectionMode && (
                <View style={styles.selectionIndicator}>
                    <MaterialCommunityIcons
                        name={isSelected ? "check-circle" : "circle-outline"}
                        size={22}
                        color={isSelected ? THEME.colors.secondary : "rgba(255,255,255,0.9)"}
                    />
                </View>
            )}
            {isSelectionMode && isSelected && (
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 12 }} />
            )}
        </Pressable>
    );
});

const PhotosGalleryContent = ({
    allSales,
    selectedPhotos,
    setSelectedPhotos,
    isSelectionMode,
    setIsSelectionMode,
    sortOrder,
    setSortOrder
}: {
    allSales: Sale[],
    selectedPhotos: string[],
    setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>,
    isSelectionMode: boolean,
    setIsSelectionMode: React.Dispatch<React.SetStateAction<boolean>>,
    sortOrder: 'newest' | 'oldest',
    setSortOrder: (order: 'newest' | 'oldest') => void
}) => {
    const [viewingSale, setViewingSale] = useState<Sale | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    const screenWidth = Dimensions.get('window').width;
    const GAP = 4;
    const COLUMN_COUNT = screenWidth > 768 ? 4 : 2;
    const itemSize = (screenWidth - 40 - (GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

    const salesWithPhotos = useMemo(() => {
        return allSales
            .filter(s => s.imageUrls && s.imageUrls.length > 0)
            .sort((a, b) => {
                const dateA = new Date(a.saleDate).getTime();
                const dateB = new Date(b.saleDate).getTime();
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
    }, [allSales, sortOrder]);

    const toggleSelection = (url: string) => {
        if (selectedPhotos.includes(url)) {
            setSelectedPhotos(prev => prev.filter(p => p !== url));
        } else {
            setSelectedPhotos(prev => [...prev, url]);
        }
    };

    const handleLongPress = (url: string) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            toggleSelection(url);
        }
    };

    const handlePress = (url: string) => {
        if (isSelectionMode) {
            toggleSelection(url);
        } else {
            setPreviewPhoto(url);
        }
    };

    const handleDownloadSingle = async (url: string) => {
        setIsDownloading(true);
        try {
            const filename = url.split('/').pop()?.split('?')[0] || `photo_${Date.now()}.jpg`;
            const fileUri = `${FileSystem.cacheDirectory}${filename}`;
            const downloadedFile = await FileSystem.downloadAsync(url, fileUri);

            if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadedFile.uri);
            } else {
                alert('Download started for: ' + filename);
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download photo');
        } finally {
            setIsDownloading(false);
        }
    };

    if (viewingSale) {
        const salePhotos = (viewingSale.imageUrls || []).filter(url =>
            url && (url.startsWith('http') || url.startsWith('https'))
        );

        return (
            <View style={{ paddingBottom: 100 }}>
                <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />
                <View style={styles.sectionHeader}>
                    <Pressable
                        onPress={() => {
                            setViewingSale(null);
                            setIsSelectionMode(false);
                            setSelectedPhotos([]);
                        }}
                        style={({ pressed }) => [
                            { flexDirection: 'row', alignItems: 'center', gap: 8 },
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.text} />
                        <Text style={styles.sectionTitle}>Back to List</Text>
                    </Pressable>
                    <Pressable onPress={() => {
                        if (isSelectionMode) {
                            setSelectedPhotos([]);
                            setIsSelectionMode(false);
                        } else {
                            setIsSelectionMode(true);
                        }
                    }}>
                        <Text style={styles.seeAllText}>{isSelectionMode ? 'Cancel' : 'Select'}</Text>
                    </Pressable>
                </View>

                <GlassPanel style={{ padding: 20, marginBottom: 20 }}>
                    <Text style={styles.listTitle}>{viewingSale.customerName}</Text>
                    <Text style={styles.listSub}>{viewingSale.productModel}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <View style={[styles.tag, { backgroundColor: THEME.colors.primary + '20' }]}>
                            <Text style={[styles.tagText, { color: THEME.colors.primary }]}>{viewingSale.warrantyId || viewingSale.invoiceNumber}</Text>
                        </View>
                        <Text style={styles.listDate}>{new Date(viewingSale.saleDate).toLocaleDateString()}</Text>
                    </View>
                </GlassPanel>

                <View style={[styles.photoGrid, { gap: GAP }]}>
                    {salePhotos.map((url, index) => (
                        <PhotoItem
                            key={`${viewingSale.id}_${index}`}
                            url={url}
                            itemSize={itemSize}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedPhotos.includes(url)}
                            onPress={() => handlePress(url)}
                            onLongPress={() => handleLongPress(url)}
                        />
                    ))}
                </View>

                {/* Single Photo Preview Modal */}
                <Modal visible={!!previewPhoto} transparent={true} animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
                    <View style={styles.modalOverlay}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setPreviewPhoto(null)} />
                        <View style={styles.modalContent}>
                            <Image source={{ uri: previewPhoto || '' }} style={styles.fullImage} resizeMode="contain" />
                            <View style={styles.modalActions}>
                                <Pressable onPress={() => setPreviewPhoto(null)} style={styles.modalBtn}>
                                    <MaterialCommunityIcons name="close" size={24} color="white" />
                                </Pressable>
                                <Pressable
                                    onPress={() => previewPhoto && handleDownloadSingle(previewPhoto)}
                                    style={[styles.modalBtn, { backgroundColor: THEME.colors.secondary }]}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <MaterialCommunityIcons name="download" size={24} color="white" />
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <View style={{ paddingBottom: 100 }}>
            <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Warranty Gallery</Text>
            </View>

            {salesWithPhotos.length === 0 ? (
                <GlassPanel style={styles.emptyState}>
                    <MaterialCommunityIcons name="image-off-outline" size={48} color={THEME.colors.textSecondary} />
                    <Text style={styles.emptyText}>No registered warranties with photos</Text>
                </GlassPanel>
            ) : (
                <View style={{ gap: 12 }}>
                    {salesWithPhotos.map((sale) => (
                        <Pressable
                            key={sale.id}
                            onPress={() => setViewingSale(sale)}
                            style={({ pressed }) => [
                                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                            ]}
                        >
                            <GlassPanel style={[styles.listItem, { borderRadius: 20, padding: 16 }]}>
                                <View style={[styles.listIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                    <MaterialCommunityIcons name="folder-image" size={24} color={THEME.colors.secondary} />
                                </View>
                                <View style={styles.listContent}>
                                    <Text style={styles.listTitle}>{sale.customerName}</Text>
                                    <Text style={styles.listSub}>{sale.warrantyId || sale.invoiceNumber}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <MaterialCommunityIcons name="clock-outline" size={14} color={THEME.colors.textSecondary} />
                                        <Text style={styles.listDate}>{new Date(sale.saleDate).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <View style={styles.listRight}>
                                    <View style={[styles.tag, { backgroundColor: THEME.colors.secondary + '20', marginBottom: 4 }]}>
                                        <Text style={[styles.tagText, { color: THEME.colors.secondary }]}>
                                            {sale.imageUrls?.length || 0} Photos
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textSecondary} />
                                </View>
                            </GlassPanel>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
};

const SortControls = ({ sortOrder, setSortOrder }: { sortOrder: 'newest' | 'oldest', setSortOrder: (order: 'newest' | 'oldest') => void }) => {
    return (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Pressable
                style={[styles.sortChip, sortOrder === 'newest' && styles.sortChipActive]}
                onPress={() => setSortOrder('newest')}
            >
                <MaterialCommunityIcons
                    name="sort-calendar-descending"
                    size={14}
                    color={sortOrder === 'newest' ? THEME.colors.secondary : THEME.colors.textSecondary}
                />
                <Text style={[styles.sortChipText, sortOrder === 'newest' && styles.sortChipTextActive]}>Newest First</Text>
            </Pressable>
            <Pressable
                style={[styles.sortChip, sortOrder === 'oldest' && styles.sortChipActive]}
                onPress={() => setSortOrder('oldest')}
            >
                <MaterialCommunityIcons
                    name="sort-calendar-ascending"
                    size={14}
                    color={sortOrder === 'oldest' ? THEME.colors.secondary : THEME.colors.textSecondary}
                />
                <Text style={[styles.sortChipText, sortOrder === 'oldest' && styles.sortChipTextActive]}>Oldest First</Text>
            </Pressable>
        </View>
    );
};

const UserTabContent = ({ allUsers, currentUser, onDelete, onEdit }: { allUsers: any[], currentUser: any, onDelete: (email: string) => void, onEdit: (user: any) => void }) => {
    return (
        <View style={{ paddingBottom: 100 }}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Employee Directory ({allUsers.length})</Text>
            </View>

            {allUsers.length === 0 ? (
                <GlassPanel style={styles.emptyState}>
                    <MaterialCommunityIcons name="account-off-outline" size={48} color={THEME.colors.textSecondary} />
                    <Text style={styles.emptyText}>No registered users found</Text>
                </GlassPanel>
            ) : (
                <View style={{ gap: 12 }}>
                    {allUsers.map((u, index) => (
                        <GlassPanel key={u.id || index} style={{ padding: 12 }}>
                            <View style={[styles.listItem, { borderBottomWidth: 0, paddingHorizontal: 0 }]}>
                                <View style={[styles.listIcon, { backgroundColor: u.role === 'Super Admin' ? THEME.colors.primary + '15' : THEME.colors.mintLight }]}>
                                    <MaterialCommunityIcons
                                        name={u.role === 'Super Admin' ? "account-star" : "account-tie"}
                                        size={24}
                                        color={u.role === 'Super Admin' ? THEME.colors.primary : THEME.colors.secondary}
                                    />
                                </View>
                                <View style={styles.listContent}>
                                    <Text style={styles.listTitle}>{u.name}</Text>
                                    <Text style={styles.listSub}>{u.email}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <View style={[styles.tag, { backgroundColor: '#E0E7FF' }]}>
                                            <Text style={[styles.tagText, { color: '#4338CA', fontSize: 10 }]}>{u.role}</Text>
                                        </View>
                                        <View style={[styles.tag, { backgroundColor: '#F3E8FF' }]}>
                                            <Text style={[styles.tagText, { color: '#7E22CE', fontSize: 10 }]}>{u.region || u.branch_id || 'All'}</Text>
                                        </View>
                                    </View>
                                </View>
                                {currentUser?.role === 'Super Admin' && (
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Pressable
                                            onPress={() => onEdit(u)}
                                            style={({ pressed }) => [
                                                { padding: 8, backgroundColor: THEME.colors.mintLight, borderRadius: 10 },
                                                pressed && { opacity: 0.7 }
                                            ]}
                                        >
                                            <MaterialCommunityIcons name="pencil" size={18} color={THEME.colors.secondary} />
                                        </Pressable>
                                        {u.email !== currentUser.email && (
                                            <Pressable
                                                onPress={() => onDelete(u.email)}
                                                style={({ pressed }) => [
                                                    { padding: 8, backgroundColor: '#FED7D7', borderRadius: 10 },
                                                    pressed && { opacity: 0.7 }
                                                ]}
                                            >
                                                <MaterialCommunityIcons name="delete" size={18} color="#C53030" />
                                            </Pressable>
                                        )}
                                    </View>
                                )}
                            </View>
                        </GlassPanel>
                    ))}
                </View>
            )}
        </View>
    );
};

const EditUserModal = ({
    visible,
    user,
    onClose,
    onSave,
    isUpdating,
    officialRegions
}: {
    visible: boolean,
    user: any | null,
    onClose: () => void,
    onSave: (email: string, updates: any) => void,
    isUpdating: boolean,
    officialRegions: string[]
}) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState<'Admin' | 'User' | 'Super Admin'>('User');
    const [region, setRegion] = useState('');
    const [branchId, setBranchId] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setRole(user.role || 'User');
            setRegion(user.region || '');
            setBranchId(user.branch_id || '');
        }
    }, [user]);

    const handleSave = () => {
        if (!name) {
            Alert.alert('Error', 'Name is required');
            return;
        }
        onSave(user.email, { name, role, region, branch_id: branchId });
    };

    if (!user) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontFamily: THEME.fonts.bold, color: THEME.colors.text }}>Edit User Profile</Text>
                        <Pressable onPress={onClose} style={{ padding: 4 }}>
                            <MaterialCommunityIcons name="close" size={24} color={THEME.colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={styles.listSub}>Full Name</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter user name"
                                    style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 8, fontSize: 16, color: THEME.colors.text }}
                                />
                            </View>

                            <View>
                                <Text style={styles.listSub}>Role</Text>
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                    {(['User', 'Admin', 'Super Admin'] as const).map(r => (
                                        <Pressable
                                            key={r}
                                            onPress={() => setRole(r)}
                                            style={[
                                                styles.chip,
                                                role === r && styles.chipActive,
                                                { flex: 1, alignItems: 'center' }
                                            ]}
                                        >
                                            <Text style={[styles.chipText, role === r && styles.chipTextActive]}>{r}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text style={styles.listSub}>Region / Branch ID</Text>
                                <TextInput
                                    value={region || branchId}
                                    onChangeText={(val) => {
                                        setRegion(val);
                                        setBranchId(val);
                                    }}
                                    placeholder="e.g. Mumbai, Delhi, etc."
                                    style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 8, fontSize: 16, color: THEME.colors.text }}
                                />
                                <Text style={{ fontSize: 11, color: THEME.colors.textSecondary, marginTop: 4 }}>
                                    Available: {officialRegions.join(', ') || 'None'}
                                </Text>
                            </View>

                            <Pressable
                                onPress={handleSave}
                                disabled={isUpdating}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: THEME.colors.secondary,
                                        padding: 16,
                                        borderRadius: 16,
                                        alignItems: 'center',
                                        marginTop: 12,
                                        opacity: (pressed || isUpdating) ? 0.8 : 1
                                    }
                                ]}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={{ color: 'white', fontFamily: THEME.fonts.bold, fontSize: 16 }}>Save Changes</Text>
                                )}
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 40, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    logoWrapper: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    companyLogo: {
        width: 32,
        height: 32,
    },
    greeting: { fontSize: 20, fontFamily: THEME.fonts.bold, color: THEME.colors.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: THEME.colors.textSecondary, marginTop: 1 },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        flexShrink: 0,
        marginLeft: 12,
    },
    profileBtn: { borderRadius: 12, overflow: 'hidden' },
    profileIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    logoutBtn: { borderRadius: 12, overflow: 'hidden' },
    logoutIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 28, minHeight: 160 },
    mainStatCard: { flex: 1.6, borderRadius: 24, padding: 16, justifyContent: 'space-between', elevation: 4, shadowColor: THEME.colors.secondary, shadowOpacity: 0.4, shadowOffset: { height: 8, width: 0 }, shadowRadius: 12 },
    statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statIconWrapper: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    statBadge: { backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badgeText: { color: 'white', fontSize: 9, fontFamily: THEME.fonts.bold },
    mainStatValue: { color: 'white', fontSize: screenWidth < 380 ? 28 : 32, fontFamily: THEME.fonts.black, lineHeight: screenWidth < 380 ? 32 : 36 },
    mainStatLabel: { color: THEME.colors.mintLight, fontSize: 13, fontFamily: THEME.fonts.semiBold },

    graphCard: { padding: 16, borderRadius: 24, marginBottom: 28, backgroundColor: 'rgba(255,255,255,0.7)' },

    bentoColumn: { flex: 1, gap: 12 },
    statBox: { flex: 1, borderRadius: 20, padding: 12, justifyContent: 'center' },
    statBoxValue: { fontSize: screenWidth < 380 ? 18 : 20, fontFamily: THEME.fonts.black, marginBottom: 2 },
    statBoxLabel: { fontSize: 11, fontFamily: THEME.fonts.bold },

    filterRow: { marginBottom: 28 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'transparent' },
    chipActive: { backgroundColor: THEME.colors.text },
    chipText: { fontSize: 13, fontFamily: THEME.fonts.semiBold, color: THEME.colors.textSecondary },
    chipTextActive: { color: 'white' },

    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.3)',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    sortChipActive: {
        backgroundColor: THEME.colors.secondary + '15',
        borderColor: THEME.colors.secondary + '30',
    },
    sortChipText: {
        fontSize: 12,
        color: THEME.colors.textSecondary,
        fontFamily: THEME.fonts.semiBold,
    },
    sortChipTextActive: {
        color: THEME.colors.secondary,
        fontFamily: THEME.fonts.bold,
    },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontFamily: THEME.fonts.bold, color: THEME.colors.text },
    seeAllText: { fontSize: 13, color: THEME.colors.secondary, fontFamily: THEME.fonts.bold },

    regionScroll: { marginBottom: 32 },
    regionCard: { width: 150, padding: 16, borderRadius: 20, marginRight: 0 },
    regionCardSelected: { borderColor: THEME.colors.secondary, borderWidth: 2 },
    regionIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    regionName: { fontSize: 15, fontFamily: THEME.fonts.bold, color: THEME.colors.text, marginBottom: 2 },
    regionTotal: { fontSize: 13, color: THEME.colors.textSecondary, marginBottom: 12 },
    progressBar: { height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, width: '100%' },
    progressFill: { height: '100%', borderRadius: 2 },



    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8 },
    listIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 15, fontFamily: THEME.fonts.bold, color: THEME.colors.text, marginBottom: 2 },
    listSub: { fontSize: 13, color: THEME.colors.textSecondary },
    listRight: { alignItems: 'flex-end' },
    listDate: { fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 4, fontFamily: THEME.fonts.semiBold },
    listCity: { fontSize: 11, color: THEME.colors.textSecondary, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },

    emptyState: { padding: 40, alignItems: 'center', gap: 12, borderRadius: 20 },
    emptyText: { color: THEME.colors.textSecondary, fontSize: 15, fontFamily: THEME.fonts.semiBold },
    countdownBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    countdownText: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
    },
    statusIndicator: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 4,
    },
    viewMoreText: {
        fontSize: 13,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.primary,
    },
    topModelsCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 32
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    productRank: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    rankText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold
    },
    productInfo: { flex: 1 },
    productName: {
        fontSize: 15,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
        marginBottom: 6
    },
    productProgressBar: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden'
    },
    productProgressFill: {
        height: '100%',
        borderRadius: 3
    },
    productUnits: {
        fontSize: 18,
        fontFamily: THEME.fonts.black,
        marginLeft: 12,
        color: THEME.colors.text
    },
    tabContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    tabSwitcher: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        width: '100%',
        maxWidth: 400,
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
        fontSize: screenWidth < 380 ? 12 : 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
    },
    tabButtonTextActive: {
        color: THEME.colors.text,
    },
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
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingBottom: 100,
        borderRadius: 12,
        overflow: 'hidden', // smooth corners for the whole grid
    },
    selectionIndicator: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        zIndex: 10,
    },
    bottomToolbarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    bottomToolbar: {
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        ...THEME.shadows.small,
    },
    toolbarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectionCount: {
        fontSize: 16,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
    },
    downloadActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.secondary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        ...THEME.shadows.small,
    },
    downloadActionText: {
        color: 'white',
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
    },
    downloadIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: '100%',
        height: '90%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    modalActions: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        gap: 20,
    },
    modalBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: 'black',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
    },
});
