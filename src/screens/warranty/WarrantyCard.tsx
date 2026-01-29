import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform, Animated, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Sale } from '../../services/SalesService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { TemplateService } from '../../services/TemplateService';
import { Storage } from '../../utils/storage';

export default function WarrantyCard() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const sale: Sale = route.params?.sale;
    const [loading, setLoading] = useState(false);
    const [docxLoading, setDocxLoading] = useState(false);
    const [templateConfig, setTemplateConfig] = useState<any>(null);

    useEffect(() => {
        Storage.getItem('WARRANTY_TEMPLATE_CONFIG').then((val: string | null) => {
            if (val) setTemplateConfig(JSON.parse(val));
        });
    }, []);

    // Animation values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    if (!sale) return null;

    // Format date
    const formattedDate = new Date(sale.saleDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Generate HTML for EKOTEX Warranty Card
    const generateWarrantyHTML = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            background: white;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            border: 3px solid #0066cc;
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo-text {
            font-size: 36px;
            font-weight: bold;
            color: #0066cc;
            letter-spacing: 4px;
        }
        .tagline {
            font-size: 10px;
            color: #333;
            font-style: italic;
        }
        .iso {
            font-size: 11px;
            color: #0066cc;
            margin-top: 5px;
        }
        .warranty-title {
            background: linear-gradient(90deg, #0066cc, #00cc66);
            color: white;
            padding: 12px 40px;
            font-size: 22px;
            font-weight: bold;
            display: inline-block;
            margin: 20px 0;
            border-radius: 4px;
        }
        .divider {
            text-align: center;
            color: #0066cc;
            font-size: 20px;
            margin: 10px 0;
        }
        .form-row {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        .form-row.no-border {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #333;
        }
        .value {
            color: #000;
            font-weight: 500;
        }
        .address-section {
            margin: 15px 0;
        }
        .address-label {
            font-weight: bold;
            color: #333;
        }
        .address-value {
            margin-top: 10px;
            padding: 10px;
            border-bottom: 1px solid #ccc;
            min-height: 60px;
        }
        .phone-stamp-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 20px 0;
        }
        .phone-section {
            flex: 1;
        }
        .stamp-box {
            width: 180px;
            height: 100px;
            border: 1px solid #333;
            padding: 10px;
            font-size: 10px;
        }
        .stamp-title {
            font-size: 10px;
            margin-bottom: 50px;
        }
        .signature {
            text-align: right;
            font-size: 10px;
            font-style: italic;
        }
        .contact {
            margin-top: 20px;
        }
        .contact-email {
            color: #0066cc;
            font-weight: bold;
        }
        .notice {
            margin-top: 15px;
            font-size: 11px;
        }
        .notice-bold {
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10px;
            color: #666;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-text">EKOTEX</div>
            <div class="tagline">Energizing Future, eMpowering Excellence.....</div>
            <div class="iso">AN ISO 9001 - 2015 CERTIFIED COMPANY</div>
            <div class="warranty-title">WARRANTY CARD</div>
            <div class="divider">✦</div>
        </div>

        <div class="form-row">
            <div><span class="label">Bill No :</span> <span class="value">${sale.warrantyId}</span></div>
            <div><span class="label">Date :</span> <span class="value">${formattedDate}</span></div>
        </div>

        <div class="form-row">
            <div><span class="label">Name of the Purchaser:</span> <span class="value">${sale.customerName}</span></div>
        </div>

        <div class="address-section">
            <div class="address-label">Address:</div>
            <div class="address-value">
                ${sale.address}<br>
                ${sale.city}
            </div>
        </div>

        <div class="phone-stamp-row">
            <div class="phone-section">
                <span class="label">Phone No :</span> <span class="value">${sale.phone}</span>
            </div>
            <div class="stamp-box">
                <div class="stamp-title">Name and Address of the dealer with Stamp</div>
                <div class="signature">Signature</div>
            </div>
        </div>

        <div class="contact">
            <div>Write us at :</div>
            <div class="contact-email">ekotexelectricient@gmail.com</div>
        </div>

        <div class="notice">
            For warranty period please refer to the warranty page in the user manual *<br>
            <span class="notice-bold">This Warranty is not valid if the above information is not duly filled in.</span>
        </div>

        <div class="footer">
            Generated on ${new Date().toLocaleString('en-IN')} | Warranty ID: ${sale.warrantyId}
        </div>
    </div>
</body>
</html>
    `;

    const handleDownloadDocx = async () => {
        if (!templateConfig) {
            Alert.alert(
                'No Template Available',
                'No custom Word template has been uploaded by the admin. Please contact your administrator to upload the warranty card template.',
                [{ text: 'OK' }]
            );
            return;
        }

        setDocxLoading(true);
        try {
            console.log('Starting Word document generation...');

            // Format the sale data for the template
            const templateData = TemplateService.formatSaleDataForTemplate({
                ...sale,
                saleDate: formattedDate, // Use pre-formatted date
            });

            console.log('Formatted template data:', templateData);

            // Validate template before attempting to use it
            const isValid = await TemplateService.validateTemplate(templateConfig.url);
            if (!isValid) {
                throw new Error('Template file is not accessible or has been removed');
            }

            // Generate the document
            const result = await TemplateService.fillDocxTemplate(
                templateConfig.url,
                templateData,
                `Warranty_${sale.warrantyId}.docx`
            );

            if (!result) {
                throw new Error('Failed to generate document');
            }

            if (Platform.OS === 'web') {
                window.alert('✅ Warranty document downloaded successfully!');
            } else {
                Alert.alert(
                    'Success',
                    'Warranty document generated successfully!',
                    [{ text: 'OK' }]
                );
            }
        } catch (error: any) {
            console.error('Docx generation error:', error);

            const errorMessage = error.message || 'Could not generate Word document.';
            const detailedMessage = `${errorMessage}\n\nIf this problem persists, please check:\n1. The template file is properly formatted\n2. All placeholders use the correct format: {placeholderName}\n3. The template file is accessible`;

            if (Platform.OS === 'web') {
                window.alert(`❌ Error: ${detailedMessage}`);
            } else {
                Alert.alert('Error', detailedMessage, [{ text: 'OK' }]);
            }
        } finally {
            setDocxLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setLoading(true);
        try {
            const html = generateWarrantyHTML();

            if (Platform.OS === 'web') {
                // For web, open print dialog
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
            } else {
                // For native, generate PDF and share
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error('Download error:', error);
            if (Platform.OS === 'web') {
                window.alert('Could not generate PDF. Please try again.');
            } else {
                Alert.alert('Error', 'Could not generate PDF. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Success Animation */}
                <View style={styles.successSection}>
                    <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.successGradient}
                        >
                            <MaterialCommunityIcons name="check" size={40} color="white" />
                        </LinearGradient>
                    </Animated.View>
                    <Animated.Text style={[styles.successTitle, { opacity: fadeAnim }]}>
                        Warranty Activated!
                    </Animated.Text>
                    <Animated.Text style={[styles.successSubtitle, { opacity: fadeAnim }]}>
                        Your warranty has been successfully generated
                    </Animated.Text>
                </View>

                {/* Warranty Card */}
                <Animated.View style={[
                    styles.card,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
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
                </Animated.View>

                {/* Actions */}
                <Animated.View style={[
                    styles.actions,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    <Pressable
                        style={({ pressed }) => [styles.downloadButton, pressed && !loading && { transform: [{ scale: 0.98 }] }]}
                        onPress={handleDownloadPDF}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={loading ? ['#9CA3AF', '#6B7280'] : ['#7C3AED', '#5B21B6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <>
                                    <ActivityIndicator color="white" size="small" />
                                    <Text style={styles.downloadButtonText}>Generating PDF...</Text>
                                </>
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="file-pdf-box" size={20} color="white" />
                                    <Text style={styles.downloadButtonText}>Download PDF</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>

                    {templateConfig && (
                        <Pressable
                            style={({ pressed }) => [styles.docxButton, pressed && !docxLoading && { transform: [{ scale: 0.98 }] }]}
                            onPress={handleDownloadDocx}
                            disabled={docxLoading}
                        >
                            <View style={styles.docxButtonContent}>
                                {docxLoading ? (
                                    <ActivityIndicator color="#2B579A" size="small" />
                                ) : (
                                    <MaterialCommunityIcons name="file-word-box" size={20} color="#2B579A" />
                                )}
                                <Text style={styles.docxButtonText}>
                                    {docxLoading ? 'Generating Word...' : 'Download Word (.docx)'}
                                </Text>
                            </View>
                        </Pressable>
                    )}

                    <Pressable
                        style={({ pressed }) => [styles.homeButton, pressed && { opacity: 0.7 }]}
                        onPress={() => navigation.navigate('SubDashboard')}
                    >
                        <MaterialCommunityIcons name="home-outline" size={20} color="#6B7280" />
                        <Text style={styles.homeButtonText}>Back to Dashboard</Text>
                    </Pressable>
                </Animated.View>
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
    docxButton: {
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        overflow: 'hidden',
    },
    docxButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    docxButtonText: {
        color: '#2B579A',
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
