import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
import { useAuth } from '../../context/AuthContext';

// Import the "Tech" (Template Utility)
import { generateQuotationHTML } from '../../utils/QuotationTemplate';
// Auto-generated base64 images
import { LOGO_B64, SIGN_B64 } from './quotationImages';

export default function CreateQuotationScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const today = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const [formData, setFormData] = useState({
    quotationNo: 'EST-67',
    quotationDate: fmt(today),
    validity: fmt(today),

    customerName: '',
    companyName: '',
    phone: '',
    email: '',

    billingAddress: '',
    shippingAddress: '',

    itemName: 'EKO-GREEN- G33 Commercial',
    itemDescription: '2 Single Coils 2.8ft, 2 Control Panels, 1 Jumbo Housing 20" Big',
    rate: '63558.47',
    qty: '1',
    discountPerc: '20',
  });

  const fillDummyData = () => {
    setFormData(prev => ({
      ...prev,
      customerName: 'Dr-Syed Moin',
      companyName: 'Tanisq Lodging',
      phone: '9890168216',
      email: 'syedmoinuddin@gmail.com',
      billingAddress:
        'Opposite Central Bus stand\nAurangabad\nAurangabad(Maharashtra), MAHARASHTRA, 431003',
      shippingAddress:
        'Opposite Central Bus stand\nAurangabad\nAurangabad(Maharashtra), MAHARASHTRA, 431003',
    }));
  };

  const isFormValid = () =>
    formData.customerName.trim() !== '' &&
    formData.phone.trim() !== '' &&
    formData.billingAddress.trim() !== '';

  const handleGeneratePDF = async () => {
    if (!isFormValid()) {
      if (Platform.OS === 'web') window.alert('Please fill Name, Phone and Billing Address.');
      else Alert.alert('Wait!', 'Please fill Name, Phone and Billing Address.');
      return;
    }

    try {
      // USES THE "TECH" - Calls the external template utility
      const html = generateQuotationHTML(
        formData,
        LOGO_B64,
        SIGN_B64,
        user?.region || 'BANGLORE'
      );

      if (Platform.OS === 'web') {
        // MATCHING WARRANTY CARD TECH: Open a new window for clean printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          // Small timeout to allow styles/images to load before print dialog
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') window.alert('Could not generate PDF.');
      else Alert.alert('Error', 'Could not generate PDF.');
    }
  };

  const FormInput = ({ label, value, onChange, placeholder = '', multiline = false, kb = 'default' }: any) => (
    <View style={styles.inputCard}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={kb}
        placeholderTextColor="#94A4B8"
      />
    </View>
  );

  return (
    <MeshBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        <View style={styles.appHeader}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1E293B" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>Quotation Builder</Text>
            <Text style={styles.appSub}>Using Warranty Card Tech</Text>
          </View>
          <Pressable onPress={fillDummyData} style={styles.magicBtn}>
            <MaterialCommunityIcons name="auto-fix" size={20} color="#7C3AED" />
            <Text style={styles.magicText}>Fast Fill</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>1. DOCUMENT DETAILS</Text>
          <GlassPanel style={styles.section}>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}><FormInput label="QUOTATION #" value={formData.quotationNo} onChange={(t: string) => setFormData(p => ({ ...p, quotationNo: t }))} /></View>
              <View style={{ flex: 1 }}><FormInput label="DATE" value={formData.quotationDate} onChange={(t: string) => setFormData(p => ({ ...p, quotationDate: t }))} /></View>
            </View>
            <FormInput label="VALID UNTIL" value={formData.validity} onChange={(t: string) => setFormData(p => ({ ...p, validity: t }))} />
          </GlassPanel>

          <Text style={styles.sectionHeader}>2. CUSTOMER DETAILS</Text>
          <GlassPanel style={styles.section}>
            <FormInput label="CLIENT NAME *" value={formData.customerName} onChange={(t: string) => setFormData(p => ({ ...p, customerName: t }))} placeholder="e.g. Dr. Syed" />
            <FormInput label="COMPANY" value={formData.companyName} onChange={(t: string) => setFormData(p => ({ ...p, companyName: t }))} />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}><FormInput label="PHONE *" kb="phone-pad" value={formData.phone} onChange={(t: string) => setFormData(p => ({ ...p, phone: t }))} /></View>
              <View style={{ flex: 1 }}><FormInput label="EMAIL" kb="email-address" value={formData.email} onChange={(t: string) => setFormData(p => ({ ...p, email: t }))} /></View>
            </View>
          </GlassPanel>

          <Text style={styles.sectionHeader}>3. ADDRESS INFO</Text>
          <GlassPanel style={styles.section}>
            <FormInput label="BILLING ADDRESS *" value={formData.billingAddress} onChange={(t: string) => setFormData(p => ({ ...p, billingAddress: t }))} multiline />
            <FormInput label="SHIPPING ADDRESS" value={formData.shippingAddress} onChange={(t: string) => setFormData(p => ({ ...p, shippingAddress: t }))} multiline placeholder="Same as billing if empty" />
          </GlassPanel>

          <Text style={styles.sectionHeader}>4. PRODUCT & PRICING</Text>
          <GlassPanel style={styles.section}>
            <FormInput label="ITEM NAME" value={formData.itemName} onChange={(t: string) => setFormData(p => ({ ...p, itemName: t }))} />
            <FormInput label="DESCRIPTION" value={formData.itemDescription} onChange={(t: string) => setFormData(p => ({ ...p, itemDescription: t }))} multiline />
            <View style={styles.row}>
              <View style={{ flex: 1.5, marginRight: 8 }}><FormInput label="RATE (₹)" kb="numeric" value={formData.rate} onChange={(t: string) => setFormData(p => ({ ...p, rate: t }))} /></View>
              <View style={{ flex: 1, marginRight: 8 }}><FormInput label="QTY" kb="numeric" value={formData.qty} onChange={(t: string) => setFormData(p => ({ ...p, qty: t }))} /></View>
              <View style={{ flex: 1 }}><FormInput label="DISC %" kb="numeric" value={formData.discountPerc} onChange={(t: string) => setFormData(p => ({ ...p, discountPerc: t }))} /></View>
            </View>
          </GlassPanel>
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [
              styles.genBtn,
              !isFormValid() && { opacity: 0.5 },
              pressed && isFormValid() && { transform: [{ scale: 0.98 }] }
            ]}
            disabled={!isFormValid()}
            onPress={handleGeneratePDF}
          >
            <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="white" />
              <Text style={styles.genText}>Generate Professional PDF</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  appHeader: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconBtn: { padding: 4 },
  appTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  appSub: { fontSize: 13, color: '#64748B' },
  magicBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F3FF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE' },
  magicText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  scroll: { padding: 16 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 8, marginTop: 16, letterSpacing: 1 },
  section: { padding: 16, borderRadius: 16, marginBottom: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9' },
  inputCard: { marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  textInput: { fontSize: 15, color: '#1E293B', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  row: { flexDirection: 'row' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  genBtn: { borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#7C3AED', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  grad: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  genText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
