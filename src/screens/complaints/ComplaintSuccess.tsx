import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, StatusBar, BackHandler } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { generateComplaintPDFHTML } from '../../utils/ComplaintTemplate';
import { THEME } from '../../constants/theme';

// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';
// @ts-ignore
import SignStampImage from '../../assets/Warranty_pdf_template/Sign_stamp/Sign_stamp.png';

export default function ComplaintSuccess() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { complaint } = route.params;

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();

        const backAction = () => {
            handleGoHome();
            return true;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    const handleGoHome = () => {
        if (user?.role === 'Admin' || user?.role === 'Super Admin') {
            navigation.navigate('MainDashboard');
        } else {
            navigation.navigate('SubDashboard');
        }
    };

    const handleDownloadPDF = async () => {
        try {
            // Resolve assets
            const logoAsset = Asset.fromModule(LogoImage);
            const signAsset = Asset.fromModule(SignStampImage);
            await Promise.all([logoAsset.downloadAsync(), signAsset.downloadAsync()]);

            const logoUri = logoAsset.localUri || logoAsset.uri;
            const signUri = signAsset.localUri || signAsset.uri;

            const html = generateComplaintPDFHTML(complaint, logoUri, signUri);

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => { printWindow.print(); }, 500);
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Download Complaint Report',
                    UTI: 'com.adobe.pdf'
                });
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient colors={['#52B788', '#40916C']} style={styles.successGradient}>
                        <MaterialCommunityIcons name="check" size={50} color="white" />
                    </LinearGradient>
                </Animated.View>

                <Animated.Text style={[styles.successTitle, { opacity: fadeAnim }]}>Complaint Raised!</Animated.Text>
                <Animated.Text style={[styles.successSubtitle, { opacity: fadeAnim }]}>
                    Ticket ID: <Text style={{ fontWeight: 'bold', color: '#1B4332' }}>{complaint.complaintId}</Text>{"\n"}
                    Our team will resolve this shortly.
                </Animated.Text>

                <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
                    <Pressable style={styles.downloadBtn} onPress={handleDownloadPDF}>
                        <LinearGradient colors={['#74C69D', '#52B788']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
                            <Text style={styles.btnText}>Download PDF</Text>
                        </LinearGradient>
                    </Pressable>

                    <Pressable style={styles.homeBtn} onPress={handleGoHome}>
                        <Text style={styles.homeBtnText}>Back to Dashboard</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0FDF4', justifyContent: 'center' },
    content: { alignItems: 'center', padding: 30 },
    successIcon: { marginBottom: 30 },
    successGradient: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#52B788', shadowOpacity: 0.3, shadowRadius: 20 },
    successTitle: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 10 },
    successSubtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
    actions: { width: '100%', gap: 15 },
    downloadBtn: { width: '100%' },
    gradientBtn: { height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    btnText: { color: 'white', fontSize: 18, fontWeight: '700' },
    homeBtn: { height: 56, justifyContent: 'center', alignItems: 'center' },
    homeBtnText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
});
