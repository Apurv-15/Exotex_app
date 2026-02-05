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
import { Asset } from 'expo-asset';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';
// @ts-ignore
import SignStampImage from '../../assets/Warranty_pdf_template/Sign_stamp/Sign_stamp.png';

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
    const generateWarrantyHTML = () => {
        // Resolve logo asset
        const logoAsset = Asset.fromModule(LogoImage);
        // For web, we can use the uri directly or a base64 string if needed.
        // For native, Asset.fromModule might give a local URI that works in WebView/Print
        const logoUri = logoAsset.uri;

        // Resolve Sign & Stamp asset
        const signStampAsset = Asset.fromModule(SignStampImage);
        const signStampUri = signStampAsset.uri;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EKOTEX Warranty Card</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .warranty-card {
            background-color: white;
            border: 2px solid #000;
            max-width: 800px;
            width: 100%;
            padding: 40px 50px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 15px;
        }
        
        .company-name {
            font-size: 48px;
            font-weight: bold;
            color: #000;
            letter-spacing: 8px;
            margin-bottom: 5px;
        }
        
        .tagline {
            font-size: 14px;
            font-style: italic;
            color: #333;
            margin-bottom: 5px;
        }
        
        .certification {
            font-size: 14px;
            color: #000;
            font-weight: bold;
        }
        
        .warranty-title {
            background: #000;
            color: white;
            text-align: center;
            padding: 15px;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 30px auto;
            max-width: 400px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        
        .divider {
            text-align: center;
            color: #000;
            font-size: 24px;
            margin: 20px 0;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            gap: 40px;
        }
        
        .info-item {
            flex: 1;
        }
        
        .info-label {
            font-weight: bold;
            font-size: 16px;
            color: #333;
            display: inline;
        }
        
        .info-value {
            font-size: 16px;
            color: #333;
            display: inline;
        }
        
        .address-section {
            margin-bottom: 25px;
        }
        
        .address-content {
            border-bottom: 1px solid #ddd;
            padding-bottom: 15px;
            margin-top: 5px;
        }
        
        .phone-dealer-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            gap: 30px;
        }
        
        .dealer-box {
            border: 2px solid #333;
            padding: 15px;
            min-height: 120px;
            position: relative;
            flex: 1;
            max-width: 300px;
        }
        
        .dealer-box-label {
            font-size: 12px;
            color: #333;
            margin-bottom: 50px;
            position: relative;
            z-index: 2;
        }

        .sign-stamp-img {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-height: 90px;
            max-width: 90%;
            z-index: 1;
            object-fit: contain;
        }
        
        .signature-label {
            position: absolute;
            bottom: 10px;
            right: 10px;
            font-size: 12px;
            font-style: italic;
            color: #666;
        }
        
        .contact-section {
            margin-bottom: 20px;
        }
        
        .email {
            color: #000;
            font-weight: bold;
            font-size: 16px;
        }
        
        .warranty-note {
            font-size: 12px;
            color: #333;
            margin-bottom: 30px;
        }
        
        .warranty-note strong {
            font-weight: bold;
        }
        
        .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            font-style: italic;
        }
        
        hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 20px 0;
        }
        
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            
            .warranty-card {
                border: 2px solid #000;
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="warranty-card">
        <div class="header">
            <img src="${logoUri}" alt="Company Logo" class="logo">
            <div class="company-name">EKOTEX</div>
            <div class="tagline">Energizing Future, eMpowering Excellence.....</div>
            <div class="certification">AN ISO 9001 - 2015 CERTIFIED COMPANY</div>
        </div>
        
        <div class="warranty-title">WARRANTY CARD</div>
        
        <div class="divider">◆</div>
        
        <div class="info-row">
            <div class="info-item">
                <span class="info-label">Bill No :</span>
                <span class="info-value">${sale.warrantyId}</span>
            </div>
            <div class="info-item" style="text-align: right;">
                <span class="info-label">Date :</span>
                <span class="info-value">${formattedDate}</span>
            </div>
        </div>
        
        <div class="info-row">
            <div class="info-item">
                <span class="info-label">Name of the Purchaser:</span>
                <span class="info-value">${sale.customerName}</span>
            </div>
        </div>
        
        <hr>
        
        <div class="address-section">
            <div class="info-label">Address:</div>
            <div class="address-content">
                <p>${sale.address}</p>
                <p>${sale.city}</p>
            </div>
        </div>
        
        <hr>
        
        <div class="phone-dealer-row">
            <div style="flex: 1;">
                <span class="info-label">Phone No :</span>
                <span class="info-value">${sale.phone}</span>
            </div>
            
            <div class="dealer-box">
                <div class="dealer-box-label">Name and Address of the dealer<br>with Stamp</div>
                <img src="${signStampUri}" alt="Sign & Stamp" class="sign-stamp-img">
                <div class="signature-label">Signature</div>
            </div>
        </div>
        
        <div class="contact-section">
            <div class="info-label">Write us at :</div>
            <div class="email">ekotexelectricient@gmail.com</div>
        </div>
        
        <div class="warranty-note">
            For warranty period please refer to the warranty page in the user manual *<br>
            <strong>This Warranty is not valid if the above information is not duly filled in.</strong>
        </div>
        
        <div class="footer">
            Generated on ${new Date().toLocaleString('en-IN')} | Warranty ID: ${sale.warrantyId}
        </div>
    </div>
</body>
</html>
        `;
    };

    const handleDownloadDocx = async () => {
        setDocxLoading(true);
        try {
            console.log('Starting Word document generation...');
            let templateUri = templateConfig?.url;

            // Use default local template if no admin template is set
            if (!templateUri) {
                console.log('Using default local template...');
                try {
                    // Load the asset
                    const asset = Asset.fromModule(require('../../assets/Warranty_pdf_template/WARRANTY CARD.docx'));
                    await asset.downloadAsync();
                    templateUri = asset.localUri || asset.uri;
                } catch (err) {
                    console.error('Failed to load default template:', err);
                    throw new Error('Default template not found. Please contact admin to upload a template.');
                }
            }

            if (!templateUri) {
                throw new Error('No template available.');
            }

            // Format the sale data for the template
            const templateData = TemplateService.formatSaleDataForTemplate({
                ...sale,
                saleDate: formattedDate, // Use pre-formatted date
            });

            console.log('Formatted template data:', templateData);

            // Validate template before attempting to use it
            const isValid = await TemplateService.validateTemplate(templateUri);
            if (!isValid) {
                throw new Error('Template file is not accessible or has been removed');
            }

            // Generate the document
            const result = await TemplateService.fillDocxTemplate(
                templateUri,
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
        paddingTop: Platform.OS === 'android' ? 20 : 60,
        paddingBottom: 40,
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
