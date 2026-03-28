import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Platform, Dimensions, StatusBar, Alert, ActivityIndicator, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import { SalesService, Sale } from '../../services/SalesService';
import { FieldVisitService } from '../../services/FieldVisitService';
import { StockService } from '../../services/StockService';
import { Stock } from '../../types';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ComplaintService, Complaint } from '../../services/ComplaintService';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
import { Asset } from 'expo-asset';
import { generateFieldVisitHTML } from '../../utils/FieldVisitTemplate';
import { generateComplaintPDFHTML } from '../../utils/ComplaintTemplate';
import { generateQuotationHTML } from '../../utils/QuotationTemplate';
import { QuotationService, Quotation } from '../../services/QuotationService';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';
// @ts-ignore
import SignStampImage from '../../assets/Warranty_pdf_template/Sign_stamp/Sign_stamp.png';
// @ts-ignore
import FloatingTabBar from '../../components/FloatingTabBar';
// @ts-ignore
import TrainingManualPdf from '../../assets/Training pdf/Training_manual.pdf';
// @ts-ignore
import TrainingBookletPdf from '../../assets/Training pdf/TRAINING BOOKLET.pdf';
// @ts-ignore
import ProductCataloguePdf from '../../assets/Training pdf/PRODUCT CATLOGUE.pdf';
// @ts-ignore
import FlowRateChartPdf from '../../assets/Training pdf/Flow Rate chart.pdf';
import { useTabletLayout } from '../../hooks/useTabletLayout';
import { getAssetBase64 } from '../../utils/AssetUtils';
import { useSyncStore } from '../../store/SyncStore';

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

// Robust date parsing for different formats
const parseDateSafe = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date(0);
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/').map(Number);
        // JS Date constructor is 0-indexed for month
        return new Date(y, m - 1, d);
    }
    // Handle YYYY-MM-DD format or ISO
    return new Date(dateStr);
};

const toISODate = (d: string | null | undefined) => {
    if (!d) return '';
    try {
        return parseDateSafe(d).toISOString().split('T')[0];
    } catch {
        return '';
    }
};

export default function SubBranchDashboard() {
    const { logout, user, refreshProfile } = useAuth();
    const navigation = useNavigation<any>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [fieldVisits, setFieldVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<'Today' | '7d' | '30d' | '1y'>('7d');
    const [branchStock, setBranchStock] = useState<Stock[]>([]);
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics' | 'Stock' | 'Complaints' | 'FieldVisits' | 'Quotations' | 'Pending'>('Dashboard');
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showAllWarranties, setShowAllWarranties] = useState(false);

    const fetchSales = useCallback(async () => {
        try {
            // First, refresh user profile to catch any region changes from Admin
            const latestProfile = await refreshProfile();
            const activeUser = latestProfile || user;
            
            const userBranch = activeUser?.branchId?.trim() || '';
            const userRegion = activeUser?.region?.trim() || '';
            
            let finalData: Sale[] = [];

            if (userRegion) {
                // If a region is assigned, try fetching strictly for that region first
                const regionalData = await SalesService.getSalesByRegion(userRegion);
                
                if (regionalData && regionalData.length > 0) {
                    finalData = regionalData;
                } else {
                    // Fallback to branch-level data ONLY if no regional data is found yet
                    // This prevents empty screens during data migration/tagging
                    finalData = await SalesService.getSalesByBranch(userBranch);
                }
            } else {
                // Standard branch user with no specific region assigned
                finalData = await SalesService.getSalesByBranch(userBranch);
            }
            
            setSales(finalData.sort((a, b) => 
                new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
            ));

            // Fetch field visits
            const visits = await FieldVisitService.getFieldVisitsByBranch(userBranch);
            setFieldVisits(visits);

            // Fetch regional stock
            if (userRegion) {
                const stock = await StockService.getStockByRegion(userRegion);
                setBranchStock(stock);
            }

            // Fetch branch complaints
            const branchComplaints = await ComplaintService.getComplaints(userBranch);
            setComplaints(branchComplaints);

            // Fetch quotations for this branch
            const branchQuotations = await QuotationService.getQuotationsByBranch(userBranch);
            setQuotations(branchQuotations);

            // Fetch any locally queued data that hasn't synced yet
            const syncQueue = useSyncStore.getState().queue;
            const userBranchTrimmed = userBranch.trim();

            // Merge local sales
            const localSales = syncQueue
                .filter(op => op.table === 'sales' && op.status !== 'completed' && op.status !== 'failed')
                .map(op => {
                    const row = op.payload;
                    return {
                        id: op.localId, // Use local ID for optimistic tracking
                        customerName: row.customer_name,
                        phone: row.phone,
                        email: row.email || '',
                        address: row.address,
                        city: row.city,
                        date: row.date,
                        invoiceNumber: row.invoice_number,
                        waterTestingBefore: row.water_testing_before || '',
                        waterTestingAfter: row.water_testing_after || '',
                        executiveName: row.executive_name || '',
                        designation: row.designation || '',
                        plumberName: row.plumber_name || '',
                        productModel: row.product_model,
                        serialNumber: row.serial_number,
                        productDetailsConfirmed: row.product_details_confirmed,
                        saleDate: row.sale_date,
                        branchId: row.branch_id,
                        warrantyId: row.warranty_id,
                        status: row.status,
                        imageUrls: row.image_urls || [],
                        paymentReceived: row.payment_received || false,
                        warrantyGenerated: row.warranty_generated || false,
                        region: row.region || '',
                    } as Sale;
                });
            setSales(prev => [...localSales, ...prev]);

            // Merge local field visits
            const localVisits = syncQueue
                .filter(op => op.table === 'field_visits' && op.status !== 'completed' && op.status !== 'failed')
                .map(op => {
                    const row = op.payload;
                    return {
                        id: op.localId,
                        clientCompanyName: row.site_name,
                        siteName: row.site_name,
                        contactPersonName: row.contact_person,
                        contactPerson: row.contact_person,
                        mobileNumber: row.phone,
                        phone: row.phone,
                        siteAddress: row.address,
                        address: row.address,
                        dateOfVisit: row.visit_date,
                        visitDate: row.visit_date,
                        ...row
                    };
                });
            setFieldVisits(prev => [...localVisits, ...prev]);

            // Merge local complaints
            const localComplaints = syncQueue
                .filter(op => op.table === 'complaints' && op.status !== 'completed' && op.status !== 'failed')
                .map(op => {
                    const row = op.payload;
                    return {
                        id: op.localId,
                        complaintId: row.complaint_id,
                        invoiceNo: row.invoice_no,
                        customerName: row.customer_name,
                        customerPhone: row.customer_phone,
                        customerEmail: row.customer_email,
                        category: row.category,
                        description: row.description,
                        dateOfComplaint: row.date_of_complaint,
                        status: row.status,
                        imageUrls: row.image_urls || [],
                        warrantyCardAttached: row.warranty_card_attached,
                        branchId: row.branch_id,
                        city: row.city,
                        createdAt: op.timestamp
                    } as Complaint;
                });
            setComplaints(prev => [...localComplaints, ...prev]);

            // Merge local quotations
            const localQuotations = syncQueue
                .filter(op => op.table === 'quotations' && op.status !== 'completed' && op.status !== 'failed')
                .map(op => {
                    const row = op.payload;
                    return {
                        id: op.localId,
                        quotationNo: row.quotation_no,
                        quotationDate: row.quotation_date,
                        validity: row.validity,
                        customerName: row.customer_name,
                        companyName: row.company_name,
                        phone: row.phone,
                        email: row.email,
                        billingAddress: row.billing_address,
                        shippingAddress: row.shipping_address,
                        itemName: row.item_name,
                        itemDescription: row.item_description,
                        rate: row.rate,
                        qty: row.qty,
                        discountPerc: row.discount_perc,
                        region: row.region,
                        branchId: row.branch_id,
                        createdAt: op.timestamp
                    } as Quotation;
                });
            setQuotations(prev => [...localQuotations, ...prev]);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.branchId, user?.region, user?.email, refreshProfile]);

    useFocusEffect(
        useCallback(() => {
            fetchSales();
        }, [fetchSales])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchSales();
    }, [fetchSales]);

    const { isTablet, contentMaxWidth, horizontalPadding } = useTabletLayout();

    const filteredSales = useMemo(() => {
        const now = new Date();
        return sales.filter(s => {
            if (period === '1y') return parseDateSafe(s.saleDate).getFullYear() === now.getFullYear();
            return true;
        });
    }, [sales, period]);

    const filteredVisits = useMemo(() => {
        const now = new Date();
        return fieldVisits.filter(v => {
            const date = parseDateSafe(v.visitDate || v.dateOfVisit);
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

    const filteredQuotations = useMemo(() => {
        const now = new Date();
        return quotations.filter(q => {
            const date = parseDateSafe(q.createdAt || q.quotationDate);
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
    }, [quotations, period]);

    const displayQuotations = useMemo(() => {
        return [...filteredQuotations].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.quotationDate).getTime();
            const dateB = new Date(b.createdAt || b.quotationDate).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [filteredQuotations, sortOrder]);

    const pendingActionSales = useMemo(() => {
        return sales.filter(s => {
            if (s.warrantyGenerated) return false;
            const res = calculateDaysRemaining(s.saleDate);
            return res.isExpired;
        });
    }, [sales]);

    // Cumulative stats (Totals) - Better for UX as "Overview"
    const totalWarrantiesCount = sales.filter(s => s.warrantyGenerated).length;
    const totalPendingWarrantiesCount = sales.filter(s => !s.warrantyGenerated && s.status !== 'rejected').length;
    const totalVisitsCount = fieldVisits.length;
    const totalComplaintsCount = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;

    // Filtered stats (for Charts/Analytics)
    const activeWarrantiesCount = filteredSales.filter(s => s.warrantyGenerated).length;
    const pendingWarrantiesCount = sales.filter(s => !s.warrantyGenerated && s.status !== 'rejected').length; // Keep total for pending as it's an action item
    const fieldVisitsCompleted = filteredVisits.length;
    const activeComplaintsCount = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;

    const handleUpdatePayment = (sale: Sale) => {
        setSelectedSale(sale);
        setShowSuccess(false);
        setActionModalVisible(true);
    };

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
                warrantyData.push(sales.filter(s => toISODate(s.saleDate) === dateStr && s.warrantyId).length);
                fieldVisitData.push(fieldVisits.filter(v => toISODate(v.visitDate || v.dateOfVisit) === dateStr).length);
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

    const handleDownloadVisit = async (visit: any) => {
        try {
            setLoading(true);

            // Convert assets to Base64 for robust loading in PDFs
            const [logoUri, signUri] = await Promise.all([
                getAssetBase64(LogoImage),
                getAssetBase64(SignStampImage)
            ]);

            const html = generateFieldVisitHTML(visit, logoUri, signUri);

            if (Platform.OS === 'web') {
                await Print.printAsync({ html });
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert("Failed to Update", 'Failed to generate field visit report' + "\nPlease try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadQuotation = async (q: Quotation) => {
        try {
            setLoading(true);
            // Convert assets to Base64 for robust loading in PDFs
            const [logoUri, signUri] = await Promise.all([
                getAssetBase64(LogoImage),
                getAssetBase64(SignStampImage)
            ]);

            const html = generateQuotationHTML(
                q,
                logoUri,
                signUri,
                user?.region || 'BANGLORE'
            );

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert("Failed to Update", 'Failed to generate quotation PDF' + "\nPlease try again.");
        } finally {
            setLoading(false);
        }
    };
    const handleDownloadComplaint = async (complaint: Complaint) => {
        try {
            setLoading(true);

            // Convert assets to Base64 for robust loading in PDFs
            const [logoUri, signUri] = await Promise.all([
                getAssetBase64(LogoImage),
                getAssetBase64(SignStampImage)
            ]);

            const html = generateComplaintPDFHTML(complaint, logoUri, signUri);

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert("Failed to Update", 'Failed to generate complaint report' + "\nPlease try again.");
        } finally {
            setLoading(false);
        }
    };


    const sortedComplaints = useMemo(() => {
        return [...complaints].sort((a, b) => {
            const dateA = new Date(a.dateOfComplaint || a.createdAt || 0).getTime();
            const dateB = new Date(b.dateOfComplaint || b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [complaints, sortOrder]);

    const sortedVisits = useMemo(() => {
        return [...fieldVisits].sort((a, b) => {
            const dateA = new Date(a.visitDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.visitDate || b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [fieldVisits, sortOrder]);

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

    return (
        <MeshBackground>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    isTablet && {
                        alignSelf: 'center',
                        width: '100%',
                        maxWidth: contentMaxWidth,
                        paddingHorizontal: horizontalPadding,
                    }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchSales();
                        }}
                        tintColor={THEME.colors.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <Pressable
                            onPress={() => navigation.navigate('Profile')}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                            <View style={styles.onlineBadge} />
                        </Pressable>
                        <View>
                            <Text style={styles.subtitle}>EKOTEX System • {user?.region || 'No Region'}</Text>
                            <Text style={styles.greeting}>{user?.name}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable onPress={() => navigation.navigate('Profile')}>
                            <GlassPanel style={styles.notificationBtn}>
                                <MaterialCommunityIcons name="account-cog-outline" size={24} color={THEME.colors.text} />
                            </GlassPanel>
                        </Pressable>
                        <Pressable onPress={handleLogout}>
                            <GlassPanel style={styles.notificationBtn}>
                                <MaterialCommunityIcons name="logout" size={24} color={THEME.colors.error} />
                            </GlassPanel>
                        </Pressable>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View style={[styles.tabContainer, { marginBottom: 20 }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabScrollContent}
                    >
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
                                onPress={() => setActiveTab('FieldVisits')}
                                style={[styles.tabButton, activeTab === 'FieldVisits' && styles.tabButtonActive]}
                            >
                                <Text style={[styles.tabButtonText, activeTab === 'FieldVisits' && styles.tabButtonTextActive]}>Visits</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveTab('Quotations')}
                                style={[styles.tabButton, activeTab === 'Quotations' && styles.tabButtonActive]}
                            >
                                <Text style={[styles.tabButtonText, activeTab === 'Quotations' && styles.tabButtonTextActive]}>Quotations</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveTab('Pending')}
                                style={[styles.tabButton, activeTab === 'Pending' && styles.tabButtonActive]}
                            >
                                <Text style={[styles.tabButtonText, activeTab === 'Pending' && styles.tabButtonTextActive]}>Pending</Text>
                            </Pressable>
                        </GlassPanel>
                    </ScrollView>
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
                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <GlassPanel style={styles.statCard}>
                                <View style={styles.statIconWrapperVerify}>
                                    <MaterialIcons name="verified-user" size={20} color={THEME.colors.secondary} />
                                </View>
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text style={styles.statValue}>{totalWarrantiesCount}</Text>
                                    <Text style={styles.statLabel}>WARRANTIES</Text>
                                </View>
                                <View style={[styles.statBadge, { backgroundColor: THEME.colors.primary + '15' }]}>
                                    <Text style={[styles.statBadgeText, { color: THEME.colors.primary }]}>Total</Text>
                                </View>
                            </GlassPanel>

                            <GlassPanel style={[styles.statCard, { backgroundColor: '#FEF3C780', padding: 12 }]}>
                                <Pressable
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    onPress={() => setActiveTab('Pending')}
                                >
                                    <View style={[styles.statIconWrapperPending, { backgroundColor: '#FEF3C7' }]}>
                                        <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
                                    </View>
                                    <View style={{ marginTop: 8 }}>
                                        <Text style={[styles.statValue, { color: '#D97706' }]}>{pendingWarrantiesCount}</Text>
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
                                    onPress={() => setActiveTab('FieldVisits')}
                                >
                                    <View style={[styles.statIconWrapperPending, { backgroundColor: '#D1FAE5' }]}>
                                        <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#059669" />
                                    </View>
                                    <View style={{ marginTop: 8 }}>
                                        <Text style={[styles.statValue, { color: '#059669' }]}>{totalVisitsCount}</Text>
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
                                    onPress={() => setActiveTab('Complaints')}
                                >
                                    <View style={[styles.statIconWrapperPending, { backgroundColor: '#FEE2E2' }]}>
                                        <MaterialIcons name="report-problem" size={20} color="#EF4444" />
                                    </View>
                                    <View style={{ marginTop: 8 }}>
                                        <Text style={[styles.statValue, { color: '#EF4444' }]}>{activeComplaintsCount}</Text>
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

                            <View style={{ flexDirection: 'row', gap: 12 }}>
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
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionBtn,
                                        { flex: 1 },
                                        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                                    ]}
                                    onPress={() => navigation.navigate('CreateQuotationScreen')}
                                >
                                    <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
                                        <MaterialIcons name="receipt" size={20} color="#0EA5E9" />
                                    </View>
                                    <Text style={styles.actionText}>Quotation</Text>
                                </Pressable>
                            </View>
                        </View>



                        {/* Pending Action Warranties (Unpaid > 45 Days) */}
                        {pendingActionSales.length > 0 && (
                            <View style={{ marginTop: 24, marginBottom: 8 }}>
                                <View style={styles.recentHeader}>
                                    <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Pending Actions (Over 45 Days)</Text>
                                    <View style={{ backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontFamily: THEME.fonts.bold }}>{pendingActionSales.length}</Text>
                                    </View>
                                </View>
                                <GlassPanel style={[styles.listContainer, { borderColor: '#EF444440', backgroundColor: '#EF444405' }]}>
                                    {pendingActionSales.map(item => (
                                        <Pressable
                                            key={item.id}
                                            style={styles.listItem}
                                            onPress={() => handleUpdatePayment(item)}
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
                            <Pressable onPress={() => setActiveTab('Dashboard')}>
                                <Text style={styles.seeAllText}>View All</Text>
                            </Pressable>
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
                                    const isPending = !item.warrantyGenerated;
                                    return (
                                        <Pressable
                                            key={item.id}
                                            style={styles.listItem}
                                            onPress={() => {
                                                if (item.warrantyGenerated) {
                                                    navigation.navigate('WarrantyCard', { sale: item });
                                                } else {
                                                    handleUpdatePayment(item);
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
                            <Pressable onPress={() => setActiveTab('FieldVisits')}>
                                <Text style={styles.seeAllText}>View All</Text>
                            </Pressable>
                        </View>

                        <GlassPanel style={styles.listContainer}>
                            {fieldVisits.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={THEME.colors.textSecondary} />
                                    <Text style={styles.emptyText}>No field visits yet</Text>
                                </View>
                            ) : (
                                fieldVisits.slice(0, 3).map((visit, idx) => {
                                    const date = new Date(visit.dateOfVisit || visit.visitDate || visit.createdAt);
                                    const type = visit.propertyType || visit.visitType || 'Inspection';
                                    return (
                                        <Pressable
                                            key={visit.id || idx}
                                            style={[styles.listItem, idx === fieldVisits.slice(0, 3).length - 1 && { borderBottomWidth: 0 }]}
                                            onPress={async () => {
                                                try {
                                                    setLoading(true);
                                                    const [logoUri, signUri] = await Promise.all([
                                                        getAssetBase64(LogoImage),
                                                        getAssetBase64(SignStampImage)
                                                    ]);
                                                    const html = generateFieldVisitHTML(visit, logoUri, signUri);
                                                    if (Platform.OS === 'web') {
                                                        const printWindow = window.open('', '_blank');
                                                        if (printWindow) {
                                                            printWindow.document.write(html);
                                                            printWindow.document.close();
                                                            setTimeout(() => printWindow.print(), 500);
                                                        }
                                                    } else {
                                                        const { uri } = await Print.printToFileAsync({ html });
                                                        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
                                                    }
                                                } catch (error) {
                                                    Alert.alert("Failed to Update", 'Failed to generate report PDF');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
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
                                {[
                                    {
                                        title: 'Training Manual',
                                        subtitle: 'Learn how to use the EKOTEX icons and features correctly.',
                                        asset: TrainingManualPdf,
                                    },
                                    {
                                        title: 'Training Booklet',
                                        subtitle: 'Comprehensive guide for technical training and operations.',
                                        asset: TrainingBookletPdf,
                                    },
                                    {
                                        title: 'Product Catalogue',
                                        subtitle: 'Browse through our full range of EKOTEX machines and tools.',
                                        asset: ProductCataloguePdf,
                                    },
                                    {
                                        title: 'Flow Rate Chart',
                                        subtitle: 'Reference chart for machine output and flow optimization.',
                                        asset: FlowRateChartPdf,
                                    }
                                ].map((item, index) => (
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
                ) : activeTab === 'Analytics' ? (
                    <View style={{ paddingHorizontal: 16 }}>
                        <View style={styles.recentHeader}>
                            <Text style={styles.sectionTitle}>Activity Analytics</Text>
                        </View>
                        {/* Total Sales Graph Card */}
                        <GlassPanel style={[styles.graphCard, { marginTop: 0 }]}>
                            <View style={styles.graphHeader}>
                                <View>
                                    <Text style={styles.graphTitle}>Success Overview</Text>
                                    <View style={styles.amountSelectorRow}>
                                        <Text style={styles.graphAmount}>{activeWarrantiesCount + fieldVisitsCompleted}</Text>
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
                                width={width - 48}
                                height={180}
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
                                        r: "4",
                                        strokeWidth: 2,
                                        stroke: "#ffffff"
                                    },
                                    strokeWidth: 3,
                                    propsForLabels: {
                                        fontSize: 10,
                                    }
                                }}
                                bezier
                                style={{
                                    paddingRight: 35,
                                    marginTop: 16,
                                    marginLeft: -10,
                                }}
                            />
                            {/* Legend */}
                            <View style={styles.legendRow}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: THEME.colors.secondary }]} />
                                    <Text style={styles.legendText}>Warranties Generated</Text>
                                </View>
                            </View>
                        </GlassPanel>

                        {/* Product Sales Breakdown */}
                        <GlassPanel style={[styles.graphCard, { marginTop: 20 }]}>
                            <View style={styles.graphHeader}>
                                <Text style={styles.graphTitle}>Product Sales Breakdown</Text>
                                <MaterialCommunityIcons name="chart-bar" size={20} color="#7C3AED" />
                            </View>

                            {(() => {
                                // Calculate product counts
                                const productCounts: { [key: string]: number } = {};
                                filteredSales.forEach(sale => {
                                    const model = sale.productModel || 'Unknown';
                                    productCounts[model] = (productCounts[model] || 0) + 1;
                                });

                                // Convert to array and sort by count
                                const sortedProducts = Object.entries(productCounts)
                                    .map(([model, count]) => ({ model, count }))
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, 5); // Top 5 products

                                const totalSales = filteredSales.length;

                                if (sortedProducts.length === 0) {
                                    return (
                                        <View style={styles.emptyProductState}>
                                            <MaterialCommunityIcons name="package-variant" size={40} color="#9CA3AF" />
                                            <Text style={styles.emptyProductText}>No product data available</Text>
                                        </View>
                                    );
                                }

                                return (
                                    <View style={{ marginTop: 16, gap: 12 }}>
                                        {sortedProducts.map((product, index) => {
                                            const percentage = totalSales > 0 ? (product.count / totalSales) * 100 : 0;
                                            return (
                                                <View key={product.model} style={styles.productItem}>
                                                    <View style={styles.productHeader}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                                            <View style={[styles.productRank, { backgroundColor: index === 0 ? '#7C3AED' : '#E5E7EB' }]}>
                                                                <Text style={[styles.productRankText, { color: index === 0 ? 'white' : '#6B7280' }]}>
                                                                    {index + 1}
                                                                </Text>
                                                            </View>
                                                            <Text style={styles.productModelName} numberOfLines={1}>{product.model}</Text>
                                                        </View>
                                                        <View style={styles.productStats}>
                                                            <Text style={styles.productCount}>{product.count}</Text>
                                                            <Text style={styles.productPercentage}>{percentage.toFixed(1)}%</Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.productBarContainer}>
                                                        <View
                                                            style={[
                                                                styles.productBar,
                                                                {
                                                                    width: `${percentage}%`,
                                                                    backgroundColor: index === 0 ? '#7C3AED' : '#A78BFA'
                                                                }
                                                            ]}
                                                        />
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })()}
                        </GlassPanel>
                    </View>
                ) : activeTab === 'Stock' ? (
                    <StockViewContent branchStock={branchStock} userRegion={user?.region} />
                ) : activeTab === 'FieldVisits' ? (
                    <View style={{ paddingBottom: 80 }}>
                        <View style={styles.recentHeader}>
                            <Text style={styles.sectionTitle}>Field Visits</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />
                            </View>
                        </View>

                        <GlassPanel style={styles.listContainer}>
                            {sortedVisits.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={THEME.colors.textSecondary} />
                                    <Text style={styles.emptyText}>No field visits found</Text>
                                </View>
                            ) : (
                                <>
                                    {sortedVisits.map((visit: any, idx: number) => {
                                        const date = new Date(visit.dateOfVisit || visit.visitDate || visit.createdAt);
                                        const type = visit.propertyType || visit.visitType || 'Inspection';
                                        return (
                                            <Pressable
                                                key={visit.id || idx}
                                                style={[styles.listItem, idx === sortedVisits.length - 1 && { borderBottomWidth: 0 }]}
                                                onPress={async () => {
                                                    try {
                                                        setLoading(true);

                                                        // Convert assets to Base64 for robust loading in PDFs
                                                        const [logoUri, signUri] = await Promise.all([
                                                            getAssetBase64(LogoImage),
                                                            getAssetBase64(SignStampImage)
                                                        ]);

                                                        const html = generateFieldVisitHTML(visit, logoUri, signUri);

                                                        if (Platform.OS === 'web') {
                                                            const printWindow = window.open('', '_blank');
                                                            if (printWindow) {
                                                                printWindow.document.write(html);
                                                                printWindow.document.close();
                                                                setTimeout(() => {
                                                                    printWindow.print();
                                                                }, 500);
                                                            }
                                                        } else {
                                                            const { uri } = await Print.printToFileAsync({ html });
                                                            await Sharing.shareAsync(uri, {
                                                                mimeType: 'application/pdf',
                                                                dialogTitle: 'Download Field Visit Report',
                                                                UTI: 'com.adobe.pdf'
                                                            });
                                                        }
                                                    } catch (error) {
                                                        console.error('Report generation error:', error);
                                                        Alert.alert("Failed to Update", 'Failed to generate report PDF' + "\nPlease try again.");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            >
                                                <View style={[styles.listIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                                    <MaterialCommunityIcons
                                                        name={type === 'Residential' ? 'home-outline' : 'factory'}
                                                        size={20}
                                                        color={THEME.colors.primary}
                                                    />
                                                </View>
                                                <View style={[styles.listInfo, { flex: 1, marginRight: 8 }]}>
                                                    <Text style={styles.listTitle} numberOfLines={1}>
                                                        {visit.clientCompanyName || visit.contactPersonName || visit.siteName || visit.companyBuildingName || 'Unknown Site'}
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={[styles.listSub, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                                                            {visit.city || visit.industryType || 'No Location'}
                                                        </Text>
                                                        <View style={[styles.countdownBadge, { backgroundColor: THEME.colors.primary + '15' }]}>
                                                            <Text style={[styles.countdownText, { color: THEME.colors.primary, fontSize: 10 }]}>
                                                                {type}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View style={[styles.listAmount, { minWidth: 70 }]}>
                                                    <Text style={[styles.amountText, { fontSize: 13 }]} numberOfLines={1}>{visit.id?.slice(0, 8)}</Text>
                                                    <Text style={styles.dateText}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                                                </View>
                                                <MaterialCommunityIcons name="chevron-right" size={18} color={THEME.colors.textSecondary} />
                                            </Pressable>
                                        );
                                    })}
                                </>
                            )}
                        </GlassPanel>
                    </View>
                ) : activeTab === 'Pending' ? (
                    <View style={{ paddingBottom: 80 }}>
                        <View style={styles.recentHeader}>
                            <Pressable
                                onPress={() => setActiveTab('Dashboard')}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            >
                                <MaterialIcons name="arrow-back" size={24} color={THEME.colors.text} />
                                <Text style={styles.sectionTitle}>Pending Warranties</Text>
                            </Pressable>
                            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ color: '#D97706', fontSize: 10, fontFamily: THEME.fonts.bold }}>{pendingWarrantiesCount} Total</Text>
                            </View>
                        </View>

                        <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />

                        <GlassPanel style={styles.listContainer}>
                            {sales.filter(s => !s.warrantyGenerated && s.status !== 'rejected').length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="check-all" size={48} color={THEME.colors.success} />
                                    <Text style={styles.emptyText}>All sales are processed!</Text>
                                </View>
                            ) : (
                                sales
                                    .filter(s => !s.warrantyGenerated && s.status !== 'rejected')
                                    .sort((a, b) => {
                                        const dateA = new Date(a.saleDate).getTime();
                                        const dateB = new Date(b.saleDate).getTime();
                                        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                                    })
                                    .map((item) => {
                                        const countdown = calculateDaysRemaining(item.saleDate);
                                        return (
                                            <Pressable
                                                key={item.id}
                                                style={styles.listItem}
                                                onPress={() => handleUpdatePayment(item)}
                                            >

                                                <View style={[styles.listIcon, { backgroundColor: '#FEF3C7' }]}>
                                                    <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#D97706" />
                                                </View>
                                                <View style={styles.listInfo}>
                                                    <Text style={styles.listTitle}>{item.productModel}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={[styles.listSub, { flex: 1 }]} numberOfLines={1}>
                                                            {item.customerName} • {item.city}
                                                        </Text>
                                                        <View style={[styles.countdownBadge, { backgroundColor: countdown.color + '20' }]}>
                                                            <Text style={[styles.countdownText, { color: countdown.color }]}>
                                                                {countdown.label}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style={[styles.dateText, { marginTop: 4 }]}>Invoice: {item.invoiceNumber}</Text>
                                                </View>
                                                <MaterialIcons name="chevron-right" size={24} color={THEME.colors.textSecondary} />
                                            </Pressable>
                                        );
                                    })
                            )}
                        </GlassPanel>
                    </View>
                ) : activeTab === 'Quotations' ? (
                    <View style={{ paddingBottom: 80 }}>
                        <View style={styles.recentHeader}>
                            <Pressable
                                onPress={() => setActiveTab('Dashboard')}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            >
                                <MaterialIcons name="arrow-back" size={24} color={THEME.colors.text} />
                                <Text style={styles.sectionTitle}>Quotations</Text>
                            </Pressable>
                        </View>

                        <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />

                        <GlassPanel style={{ padding: 8 }}>
                            {displayQuotations.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="receipt" size={48} color={THEME.colors.textSecondary} />
                                    <Text style={styles.emptyText}>No quotations found</Text>
                                </View>
                            ) : (
                                displayQuotations.map((q: any, idx: number) => {
                                    return (
                                        <Pressable
                                            key={q.id || idx}
                                            style={({ pressed }) => [
                                                styles.listItem,
                                                pressed && { backgroundColor: 'rgba(255,255,255,0.4)' },
                                                idx === displayQuotations.length - 1 && { borderBottomWidth: 0 }
                                            ]}
                                            onPress={() => handleDownloadQuotation(q)}
                                        >
                                            <View style={[styles.listIcon, { backgroundColor: '#E0F2FE' }]}>
                                                <MaterialCommunityIcons
                                                    name="receipt"
                                                    size={20}
                                                    color="#0EA5E9"
                                                />
                                            </View>
                                            <View style={[styles.listInfo, { flex: 1, marginRight: 8 }]}>
                                                <Text style={styles.listTitle} numberOfLines={1}>{q.customerName}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <View style={[styles.countdownBadge, { backgroundColor: '#E0F2FE' }]}>
                                                        <Text style={[styles.countdownText, { color: '#0EA5E9' }]} numberOfLines={1}>
                                                            {q.quotationNo || q.id?.slice(0, 8)}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.dateText}>{new Date(q.createdAt || q.quotationDate).toLocaleDateString()}</Text>
                                                </View>
                                            </View>
                                            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                                                <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
                                                    <Text style={[styles.amountText, { fontSize: 13, color: THEME.colors.text }]} numberOfLines={1}>
                                                        ₹{(() => {
                                                            const rate = parseFloat(q.rate || '0') || 0;
                                                            const qty = parseFloat(q.qty || '0') || 0;
                                                            const disc = parseFloat(q.discountPerc || '0') || 0;
                                                            const discounted = rate * (1 - disc / 100);
                                                            const total = Math.round((discounted * qty) * 1.18);
                                                            return total.toLocaleString('en-IN');
                                                        })()}
                                                    </Text>
                                                </View>
                                                <View style={{ padding: 4 }}>
                                                    <MaterialCommunityIcons name="file-download-outline" size={20} color={THEME.colors.primary} />
                                                </View>
                                                <MaterialCommunityIcons name="chevron-right" size={18} color={THEME.colors.textSecondary} />
                                            </View>
                                        </Pressable>
                                    );
                                })
                            )}
                        </GlassPanel>
                    </View>
                ) : (
                    <View style={{ paddingBottom: 80 }}>
                        <View style={styles.recentHeader}>
                            <Pressable
                                onPress={() => setActiveTab('Dashboard')}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            >
                                <MaterialIcons name="arrow-back" size={24} color={THEME.colors.text} />
                                <Text style={styles.sectionTitle}>Complaints Hub</Text>
                            </Pressable>
                        </View>

                        <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />

                        <GlassPanel style={{ padding: 8 }}>
                            {sortedComplaints.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="check-circle-outline" size={48} color={THEME.colors.success} />
                                    <Text style={styles.emptyText}>No complaints found</Text>
                                </View>
                            ) : (
                                sortedComplaints.map((comp: any, idx: number) => {
                                    const isResolved = comp.status === 'Resolved' || comp.status === 'Closed';
                                    return (
                                        <Pressable
                                            key={comp.id || idx}
                                            style={[styles.listItem, idx === sortedComplaints.length - 1 && { borderBottomWidth: 0 }]}
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
                                                <MaterialIcons
                                                    name={isResolved ? "check-circle" : "warning"}
                                                    size={20}
                                                    color={isResolved ? THEME.colors.success : '#EF4444'}
                                                />
                                            </View>
                                            <View style={[styles.listInfo, { flex: 1, marginRight: 8 }]}>
                                                <Text style={styles.listTitle} numberOfLines={1}>{comp.customerName}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <View style={[styles.countdownBadge, { backgroundColor: isResolved ? THEME.colors.success + '20' : '#EF444420' }]}>
                                                        <Text style={[styles.countdownText, { color: isResolved ? THEME.colors.success : '#EF4444' }]} numberOfLines={1}>
                                                            {comp.status}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.dateText}>{new Date(comp.dateOfComplaint).toLocaleDateString()}</Text>
                                                </View>
                                            </View>
                                            <Pressable
                                                onPress={() => handleDownloadComplaint(comp)}
                                                style={{ padding: 8 }}
                                            >
                                                <MaterialCommunityIcons name="file-download-outline" size={24} color={THEME.colors.primary} />
                                            </Pressable>
                                        </Pressable>
                                    );
                                })
                            )}
                        </GlassPanel>
                    </View>
                )}
            </ScrollView>

            <FloatingTabBar activeTab="home" onTabPress={(tab: any) => {
                if (tab === 'stock') setActiveTab('Stock');
                else if (tab === 'home') setActiveTab('Dashboard');
                else if (tab === 'create') navigation.navigate('CreateSaleStep1');
                else if (tab === 'fieldvisit') navigation.navigate('FieldVisitForm');
                else if (tab === 'quotation') setActiveTab('Quotations');
            }} />

            {/* Sale Action Modal */}
            <Modal
                visible={actionModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setActionModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassPanel style={styles.modalContent}>
                        {showSuccess ? (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View style={[styles.modalIconWrapper, { backgroundColor: THEME.colors.success + '20' }]}>
                                    <MaterialIcons name="verified" size={40} color={THEME.colors.success} />
                                </View>
                                <Text style={styles.modalTitle}>Warranty Generated!</Text>
                                <Text style={styles.modalSubtitle}>Invoice: {selectedSale?.invoiceNumber}</Text>
                                <Text style={[styles.modalWarningText, { marginTop: 16 }]}>
                                    The digital warranty card has been successfully registered and is now active for this customer.
                                </Text>
                                <Pressable 
                                    style={[styles.modalBtn, styles.confirmBtn, { marginTop: 8 }]}
                                    onPress={() => setActionModalVisible(false)}
                                >
                                    <Text style={styles.confirmBtnText}>Done</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <>
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalIconWrapper}>
                                        <MaterialCommunityIcons name="shield-check-outline" size={32} color={THEME.colors.secondary} />
                                    </View>
                                    <Text style={styles.modalTitle}>Process Warranty</Text>
                                    <Text style={styles.modalSubtitle}>Invoice: {selectedSale?.invoiceNumber}</Text>
                                </View>

                                {selectedSale && (
                                    <View style={styles.saleDetailsBox}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>CUSTOMER</Text>
                                            <Text style={styles.detailValue}>{selectedSale.customerName}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>MODEL</Text>
                                            <Text style={styles.detailValue}>{selectedSale.productModel}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>STATUS</Text>
                                            <View style={[styles.countdownBadge, { backgroundColor: calculateDaysRemaining(selectedSale.saleDate).color + '20' }]}>
                                                <Text style={[styles.countdownText, { color: calculateDaysRemaining(selectedSale.saleDate).color }]}>
                                                    {calculateDaysRemaining(selectedSale.saleDate).label}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <Text style={styles.modalWarningText}>
                                    Confirming payment will instantly generate the digital warranty card for this customer.
                                </Text>

                                <View style={styles.modalActions}>
                                    <Pressable 
                                        style={[styles.modalBtn, styles.confirmBtn]}
                                        onPress={async () => {
                                            if (!selectedSale) return;
                                            try {
                                                setActionLoading(true);
                                                await SalesService.updatePaymentStatus(selectedSale.id, true);
                                                setShowSuccess(true);
                                                fetchSales();
                                            } catch (error) {
                                                Alert.alert('Error', 'Failed to generate warranty.');
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <>
                                                <MaterialIcons name="verified" size={20} color="white" />
                                                <Text style={styles.confirmBtnText}>Confirm & Generate</Text>
                                            </>
                                        )}
                                    </Pressable>

                                    <Pressable 
                                        style={[styles.modalBtn, styles.rejectBtn]}
                                        onPress={async () => {
                                            if (!selectedSale) return;
                                            Alert.alert(
                                                'Confirm Rejection',
                                                'Are you sure you want to reject this sale entry?',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { 
                                                        text: 'Yes, Reject', 
                                                        style: 'destructive',
                                                        onPress: async () => {
                                                            try {
                                                                setActionLoading(true);
                                                                await SalesService.updateSaleStatus(selectedSale.id, 'rejected');
                                                                setActionModalVisible(false);
                                                                fetchSales();
                                                            } catch (error) {
                                                                Alert.alert('Error', 'Failed to reject sale.');
                                                            } finally {
                                                                setActionLoading(false);
                                                            }
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                        disabled={actionLoading}
                                    >
                                        <MaterialIcons name="block" size={20} color="#EF4444" />
                                        <Text style={styles.rejectBtnText}>Reject Sale</Text>
                                    </Pressable>

                                    <Pressable 
                                        style={[styles.modalBtn, styles.closeBtn]}
                                        onPress={() => setActionModalVisible(false)}
                                        disabled={actionLoading}
                                    >
                                        <Text style={styles.closeBtnText}>Close</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </GlassPanel>
                </View>
            </Modal>

            {/* All Warranties Modal */}
            <Modal
                visible={showAllWarranties}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowAllWarranties(false)}
            >
                <View style={{ flex: 1, backgroundColor: THEME.colors.background }}>
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
                        paddingHorizontal: 20,
                        paddingBottom: 16,
                        backgroundColor: 'white',
                        borderBottomWidth: 1,
                        borderBottomColor: '#F3F4F6',
                        gap: 12,
                    }}>
                        <Pressable
                            onPress={() => setShowAllWarranties(false)}
                            style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#F3F4F6' }}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.colors.text} />
                        </Pressable>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontFamily: THEME.fonts.bold, color: THEME.colors.text }}>All Warranties</Text>
                            <Text style={{ fontSize: 13, color: THEME.colors.textSecondary, fontFamily: THEME.fonts.body }}>
                                {sales.filter(s => s.warrantyId).length} total
                            </Text>
                        </View>
                    </View>

                    {/* List */}
                    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
                        {sales.filter(s => s.warrantyId).length === 0 ? (
                            <View style={{ alignItems: 'center', paddingTop: 60 }}>
                                <MaterialCommunityIcons name="inbox-outline" size={48} color={THEME.colors.textSecondary} />
                                <Text style={{ color: THEME.colors.textSecondary, marginTop: 12, fontSize: 16, fontFamily: THEME.fonts.body }}>No warranties yet</Text>
                            </View>
                        ) : (
                            sales.filter(s => s.warrantyId).map(item => {
                                const countdown = calculateDaysRemaining(item.saleDate);
                                const isPending = !item.warrantyGenerated;
                                return (
                                    <Pressable
                                        key={item.id}
                                        style={({ pressed }) => [
                                            styles.listItem,
                                            { backgroundColor: 'white', borderRadius: 16, marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
                                            pressed && { opacity: 0.85 }
                                        ]}
                                        onPress={() => {
                                            setShowAllWarranties(false);
                                            setTimeout(() => {
                                                if (item.warrantyGenerated) {
                                                    navigation.navigate('WarrantyCard', { sale: item });
                                                } else {
                                                    handleUpdatePayment(item);
                                                }
                                            }, 300);
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
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>
        </MeshBackground>
    );
}

const SortControls = ({ sortOrder, setSortOrder }: { sortOrder: 'newest' | 'oldest', setSortOrder: (order: 'newest' | 'oldest') => void }) => (
    <View style={styles.sortContainer}>
        <Pressable
            onPress={() => setSortOrder('newest')}
            style={[styles.sortBtn, sortOrder === 'newest' && styles.sortBtnActive]}
        >
            <MaterialIcons name="arrow-downward" size={16} color={sortOrder === 'newest' ? 'white' : THEME.colors.textSecondary} />
            <Text style={[styles.sortBtnText, sortOrder === 'newest' && styles.sortBtnTextActive]}>Newest First</Text>
        </Pressable>
        <Pressable
            onPress={() => setSortOrder('oldest')}
            style={[styles.sortBtn, sortOrder === 'oldest' && styles.sortBtnActive]}
        >
            <MaterialIcons name="arrow-upward" size={16} color={sortOrder === 'oldest' ? 'white' : THEME.colors.textSecondary} />
            <Text style={[styles.sortBtnText, sortOrder === 'oldest' && styles.sortBtnTextActive]}>Oldest First</Text>
        </Pressable>
    </View>
);

const handleTabPress = (tab: string) => { };

const styles = StyleSheet.create({
    sortContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: THEME.colors.glassBackground,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    sortBtnActive: {
        backgroundColor: THEME.colors.secondary,
        borderColor: THEME.colors.secondary,
    },
    sortBtnText: {
        fontSize: 12,
        color: THEME.colors.textSecondary,
        fontWeight: '500',
    },
    sortBtnTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    content: {
        padding: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
        paddingBottom: 80,
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
        minHeight: 110,
        justifyContent: 'space-between',
    },
    statBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statBadgeText: {
        fontSize: 9,
        fontFamily: THEME.fonts.bold,
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
        paddingRight: 8,
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
        marginLeft: 12,
        minWidth: 80,
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
        marginBottom: 24,
    },
    tabScrollContent: {
        paddingHorizontal: 16,
    },
    tabSwitcher: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderRadius: 100,
        minWidth: 90,
    },
    tabButtonActive: {
        backgroundColor: '#FFFFFF',
        ...THEME.shadows.small,
    },
    tabButtonText: {
        fontSize: 13,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
    },
    tabButtonTextActive: {
        color: THEME.colors.text,
    },
    // Product breakdown styles
    emptyProductState: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyProductText: {
        color: THEME.colors.textSecondary,
        fontSize: 14,
        fontFamily: THEME.fonts.semiBold,
    },
    productItem: {
        gap: 8,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productRank: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productRankText: {
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
    },
    productModelName: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
    },
    productStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    productCount: {
        fontSize: 16,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.text,
    },
    productPercentage: {
        fontSize: 12,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
    },
    productBarContainer: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    productBar: {
        height: '100%',
        borderRadius: 3,
    },
    addVisitTinyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: THEME.colors.secondary,
        shadowColor: THEME.colors.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    addVisitTinyText: {
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
        color: 'white',
    },
    viewMoreListBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginTop: 8,
    },
    viewMoreListText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.secondary,
    },
    trainingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    trainingIconWrapper: {
        width: 54,
        height: 54,
        borderRadius: 15,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trainingTitle: {
        fontSize: 15,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
    },
    trainingSubtitle: {
        fontSize: 11,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
        marginTop: 2,
    },
    viewManualBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: THEME.colors.secondary,
    },
    viewManualText: {
        fontSize: 11,
        fontFamily: THEME.fonts.bold,
        color: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: THEME.colors.secondary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.text,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
        marginTop: 4,
    },
    saleDetailsBox: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.text,
    },
    modalWarningText: {
        fontSize: 13,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },
    modalActions: {
        width: '100%',
        gap: 12,
    },
    modalBtn: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    confirmBtn: {
        backgroundColor: THEME.colors.secondary,
        shadowColor: THEME.colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    confirmBtnText: {
        color: 'white',
        fontSize: 16,
        fontFamily: THEME.fonts.bold,
    },
    rejectBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    rejectBtnText: {
        color: '#D32F2F',
        fontSize: 15,
        fontFamily: THEME.fonts.bold,
    },
    closeBtn: {
        height: 44,
        marginTop: 4,
    },
    closeBtnText: {
        color: THEME.colors.text,
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        textDecorationLine: 'underline',
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
                            <View style={[styles.listInfo, { flex: 1, marginRight: 12 }]}>
                                <Text style={styles.listTitle} numberOfLines={1}>{s.modelName}</Text>
                                <Text style={styles.listSub} numberOfLines={1}>Last updated: {new Date(s.updatedAt).toLocaleDateString()}</Text>
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
