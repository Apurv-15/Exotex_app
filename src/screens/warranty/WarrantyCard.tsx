import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Sale } from '../../services/SalesService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';

export default function WarrantyCard() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const sale: Sale = route.params?.sale;

    if (!sale) return null;

    const handleDownloadPDF = async () => {
        const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; background: #f5f5f5; }
            .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: bold; color: #7C3AED; }
            .warranty-id { font-size: 32px; font-weight: bold; color: #1a1a1a; margin: 16px 0 8px; }
            .subtitle { color: #6B7280; font-size: 14px; }
            .divider { height: 1px; background: #E5E7EB; margin: 24px 0; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F3F4F6; }
            .label { color: #6B7280; font-size: 14px; }
            .value { color: #1a1a1a; font-weight: 600; font-size: 14px; }
            .footer { text-align: center; margin-top: 24px; padding: 16px; background: #EDE9FE; border-radius: 12px; }
            .footer-text { color: #5B21B6; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">WarrantyPro</div>
              <div class="warranty-id">${sale.warrantyId}</div>
              <div class="subtitle">Warranty Certificate</div>
            </div>
            <div class="divider"></div>
            <div class="row"><span class="label">Product</span><span class="value">${sale.productModel}</span></div>
            <div class="row"><span class="label">Serial Number</span><span class="value">${sale.serialNumber}</span></div>
            <div class="row"><span class="label">Customer</span><span class="value">${sale.customerName}</span></div>
            <div class="row"><span class="label">Purchase Date</span><span class="value">${sale.saleDate}</span></div>
            <div class="footer">
              <div class="footer-text">Valid for 1 year from purchase date</div>
            </div>
          </div>
        </body>
      </html>
    `;

        try {
            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.print();
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert('Could not generate PDF');
            } else {
                Alert.alert('Error', 'Could not generate PDF');
            }
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Success Animation */}
                <View style={styles.successSection}>
                    <View style={styles.successIcon}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.successGradient}
                        >
                            <MaterialCommunityIcons name="check" size={40} color="white" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.successTitle}>Warranty Activated!</Text>
                    <Text style={styles.successSubtitle}>Your warranty has been successfully generated</Text>
                </View>

                {/* Warranty Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardLogo}>
                            <MaterialCommunityIcons name="shield-check" size={24} color="#7C3AED" />
                        </View>
                        <Text style={styles.cardBrand}>WarrantyPro</Text>
                    </View>

                    <View style={styles.warrantyIdSection}>
                        <Text style={styles.warrantyIdLabel}>WARRANTY ID</Text>
                        <Text style={styles.warrantyId}>{sale.warrantyId}</Text>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <View style={[styles.detailIcon, { backgroundColor: '#EDE9FE' }]}>
                                <MaterialCommunityIcons name="cube-outline" size={18} color="#7C3AED" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Product</Text>
                                <Text style={styles.detailValue}>{sale.productModel}</Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={[styles.detailIcon, { backgroundColor: '#FEF3C7' }]}>
                                <MaterialCommunityIcons name="barcode" size={18} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Serial No.</Text>
                                <Text style={styles.detailValue}>{sale.serialNumber}</Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={[styles.detailIcon, { backgroundColor: '#D1FAE5' }]}>
                                <MaterialCommunityIcons name="account" size={18} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Customer</Text>
                                <Text style={styles.detailValue}>{sale.customerName}</Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={[styles.detailIcon, { backgroundColor: '#DBEAFE' }]}>
                                <MaterialCommunityIcons name="calendar" size={18} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Purchase Date</Text>
                                <Text style={styles.detailValue}>{sale.saleDate}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.validityBadge}>
                        <MaterialCommunityIcons name="clock-check-outline" size={16} color="#5B21B6" />
                        <Text style={styles.validityText}>Valid for 1 year from purchase</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <Pressable
                        style={({ pressed }) => [styles.downloadButton, pressed && { transform: [{ scale: 0.98 }] }]}
                        onPress={handleDownloadPDF}
                    >
                        <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <MaterialCommunityIcons name="download" size={20} color="white" />
                            <Text style={styles.downloadButtonText}>Download PDF</Text>
                        </LinearGradient>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.homeButton, pressed && { opacity: 0.7 }]}
                        onPress={() => navigation.navigate('SubDashboard')}
                    >
                        <MaterialCommunityIcons name="home-outline" size={20} color="#6B7280" />
                        <Text style={styles.homeButtonText}>Back to Dashboard</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    content: {
        padding: 20,
        paddingTop: 32,
    },
    successSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    successIcon: {
        marginBottom: 16,
    },
    successGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    successSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardLogo: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardBrand: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    warrantyIdSection: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        marginBottom: 20,
    },
    warrantyIdLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 4,
    },
    warrantyId: {
        fontSize: 32,
        fontWeight: '800',
        color: '#7C3AED',
        letterSpacing: 1,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
    },
    detailsGrid: {
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: 2,
    },
    validityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EDE9FE',
        padding: 14,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
    },
    validityText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5B21B6',
    },
    actions: {
        gap: 12,
    },
    downloadButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
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
    downloadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
        cursor: 'pointer',
    } as any,
    homeButtonText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '600',
    },
});
