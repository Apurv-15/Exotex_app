import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { THEME } from '../../constants/config';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Sale } from '../../services/SalesService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
            body { font-family: 'Helvetica', sans-serif; padding: 40px; }
            .card { border: 2px solid #007AFF; padding: 20px; border-radius: 10px; }
            .header { text-align: center; color: #007AFF; margin-bottom: 20px; }
            .row { margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .label { font-weight: bold; color: #555; }
            .value { float: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="header">Warranty Certificate</h1>
            <div class="row"><span class="label">Warranty ID:</span> <span class="value">${sale.warrantyId}</span></div>
            <div class="row"><span class="label">Product:</span> <span class="value">${sale.productModel}</span></div>
            <div class="row"><span class="label">Serial Number:</span> <span class="value">${sale.serialNumber}</span></div>
            <div class="row"><span class="label">Customer Name:</span> <span class="value">${sale.customerName}</span></div>
            <div class="row"><span class="label">Date of Purchase:</span> <span class="value">${sale.saleDate}</span></div>
            <div class="footer">
              Valid for 1 year from the date of purchase.<br>
              Sub Branch Limited
            </div>
          </div>
        </body>
      </html>
    `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('Error', 'Could not generate PDF');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.successIcon}>
                    <MaterialCommunityIcons name="check-circle" size={80} color={THEME.colors.success} />
                    <Text style={styles.successTitle}>Warranty Activated!</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Warranty Card</Text>
                        <Text style={styles.warrantyId}>{sale.warrantyId}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Product</Text>
                        <Text style={styles.detailValue}>{sale.productModel}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Serial No.</Text>
                        <Text style={styles.detailValue}>{sale.serialNumber}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Customer</Text>
                        <Text style={styles.detailValue}>{sale.customerName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{sale.saleDate}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
                    <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
                    <Text style={styles.downloadButtonText}>Download PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('SubDashboard')}
                >
                    <Text style={styles.homeButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    content: {
        padding: THEME.spacing.l,
        alignItems: 'center',
    },
    successIcon: {
        alignItems: 'center',
        marginBottom: THEME.spacing.xl,
        marginTop: THEME.spacing.l,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: THEME.colors.text,
        marginTop: THEME.spacing.s,
    },
    card: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: THEME.borderRadius.l,
        padding: THEME.spacing.l,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: THEME.spacing.xl,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cardHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: THEME.spacing.m,
        marginBottom: THEME.spacing.m,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        color: THEME.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    warrantyId: {
        fontSize: 24,
        fontWeight: '700',
        color: THEME.colors.primary,
        marginTop: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: THEME.spacing.m,
    },
    detailLabel: {
        color: THEME.colors.textSecondary,
        fontSize: 15,
    },
    detailValue: {
        color: THEME.colors.text,
        fontSize: 15,
        fontWeight: '500',
    },
    downloadButton: {
        flexDirection: 'row',
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: THEME.spacing.l,
    },
    downloadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    homeButton: {
        padding: 12,
    },
    homeButtonText: {
        color: THEME.colors.textSecondary,
        fontSize: 16,
    },
});
