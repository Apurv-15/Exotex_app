import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform, Animated, ActivityIndicator, StatusBar, BackHandler } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Sale, SalesService } from '../../services/SalesService';
import { useAuth } from '../../context/AuthContext';
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
    const { user } = useAuth();
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

        // Handle hardware back press on Android
        const backAction = () => {
            handleGoHome();
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, []);

    const handleGoHome = () => {
        if (user?.role === 'Admin' || user?.role === 'Super Admin') {
            navigation.navigate('MainDashboard');
        } else {
            navigation.navigate('SubDashboard');
        }
    };

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

    const handleDelete = async () => {
        Alert.alert(
            'Delete Warranty',
            'Are you sure you want to delete this warranty? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await SalesService.deleteSale(sale.id);
                            Alert.alert('Success', 'Warranty deleted successfully');
                            handleGoHome();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Could not delete warranty');
                        } finally {
                            setLoading(true);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={handleGoHome}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
                </Pressable>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerBrand}>EXOTEX</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Success Animation */}
                <View style={styles.successSection}>
                    <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>
                        <LinearGradient
                            colors={['#52B788', '#40916C']}
                            style={styles.successGradient}
                        >
                            <MaterialCommunityIcons name="check" size={40} color="white" />
                        </LinearGradient>
                    </Animated.View>
                    <Animated.Text style={[styles.successTitle, { opacity: fadeAnim }]}>
                        Warranty Activated!
                    </Animated.Text>
                    <Animated.Text style={[styles.successSubtitle, { opacity: fadeAnim }]}>
                        Your warranty has been successfully generated for your new device.
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
                        <View style={[styles.cardLogo, { backgroundColor: '#EEF2FF' }]}>
                            <MaterialCommunityIcons name="shield-check" size={24} color="#6366F1" />
                        </View>
                        <Text style={styles.cardBrand}>WarrantyPro</Text>
                    </View>

                    <View style={styles.warrantyIdSection}>
                        <Text style={styles.warrantyIdLabel}>WARRANTY ID</Text>
                        <Text style={styles.warrantyId}>{sale.warrantyId}</Text>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <View style={[styles.detailIcon, { backgroundColor: '#EEF2FF' }]}>
                                <MaterialCommunityIcons name="archive-outline" size={18} color="#6366F1" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>PRODUCT</Text>
                                <Text style={styles.detailValue}>{sale.productModel}</Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={[styles.detailIcon, { backgroundColor: '#FFF7ED' }]}>
                                <MaterialCommunityIcons name="format-list-numbered" size={18} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>SERIAL NO.</Text>
                                <Text style={styles.detailValue}>{sale.serialNumber}</Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={[styles.detailIcon, { backgroundColor: '#ECFDF5' }]}>
                                <MaterialCommunityIcons name="account-outline" size={18} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>CUSTOMER</Text>
                                <Text style={styles.detailValue}>{sale.customerName}</Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={[styles.detailIcon, { backgroundColor: '#EFF6FF' }]}>
                                <MaterialCommunityIcons name="calendar-outline" size={18} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>PURCHASE DATE</Text>
                                <Text style={styles.detailValue}>{sale.saleDate}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.validityBadge}>
                        <MaterialCommunityIcons name="history" size={16} color="#40916C" />

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
                            colors={loading ? ['#9CA3AF', '#6B7280'] : ['#74C69D', '#52B788']}
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
                                    <MaterialCommunityIcons name="file-pdf-box" size={22} color="white" />
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

                    {user?.role === 'Super Admin' && (
                        <Pressable
                            style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
                            onPress={handleDelete}
                            disabled={loading}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
                            <Text style={styles.deleteButtonText}>Delete Warranty</Text>
                        </Pressable>
                    )}

                    <Pressable
                        style={({ pressed }) => [styles.homeButton, pressed && { opacity: 0.7 }]}
                        onPress={handleGoHome}
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
        backgroundColor: '#F0FDF4', // Very light mint background
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        paddingBottom: 10,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerBrand: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 100,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    content: {
        padding: 24,
        paddingTop: 10,
        paddingBottom: 60,
    },
    successSection: {
        alignItems: 'center',
        marginBottom: 40,
        paddingTop: 10,
    },
    successIcon: {
        marginBottom: 24,
    },
    successGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#52B788',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    successTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.06,
        shadowRadius: 32,
        elevation: 10,
        marginBottom: 32,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    cardLogo: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardBrand: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    warrantyIdSection: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        marginBottom: 24,
    },
    warrantyIdLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 2,
        marginBottom: 10,
    },
    warrantyId: {
        fontSize: 36,
        fontWeight: '800',
        color: '#52B788', // Premium mint color
        letterSpacing: 2,
    },
    detailsGrid: {
        gap: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    validityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        padding: 16,
        borderRadius: 16,
        marginTop: 32,
        gap: 10,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    validityText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#166534',
    },
    actions: {
        gap: 16,
    },
    downloadButton: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#52B788',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    downloadButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    docxButton: {
        backgroundColor: '#EFF6FF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        overflow: 'hidden',
    },
    docxButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    docxButtonText: {
        color: '#2B579A',
        fontSize: 17,
        fontWeight: '700',
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    homeButtonText: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '600',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
        marginTop: 8,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
    },
    deleteButtonText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '700',
    },
});
