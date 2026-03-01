import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  Alert, Platform, KeyboardAvoidingView, Modal, FlatList
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
import { Asset } from 'expo-asset';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';
// @ts-ignore
import SignStampImage from '../../assets/Warranty_pdf_template/Sign_stamp/Sign_stamp.png';

const PRODUCT_MODELS = [
  { name: 'EKO-GREEN G3', rate: '21185.59', description: 'Energy Efficient Hard Water Conditioner - G3 Series' },
  { name: 'EKO-GREEN G5', rate: '36439.83', description: 'Commercial Hard Water Conditioner - G5 Series' },
  { name: 'EKO-GREEN G6', rate: '61863.56', description: 'Industrial Hard Water Conditioner - G6 Series' },
  { name: 'EKO-GREEN G33', rate: '0', description: 'G33 Series' },
  { name: 'EKO-GREEN G130', rate: '0', description: 'G130 Series' },
  { name: 'EKO-GREEN G230', rate: '0', description: 'G230 Series' },
  { name: 'EKO-GREEN G330', rate: '0', description: 'G330 Series' },
  { name: 'EKO-GREEN G530', rate: '0', description: 'G530 Series' },
  { name: 'EKO-GREEN G600', rate: '0', description: 'G600 Series' },
  { name: 'Other (Custom)', rate: '0', description: 'Custom machine or service' }
];

// Extracted outside the main component so it does not remount and lose focus on every keystroke!
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

    itemName: 'EKO-GREEN G3',
    itemDescription: 'Energy Efficient Hard Water Conditioner - G3 Series',
    rate: '21185.59',
    qty: '1',
    discountPerc: '0',
  });

  const [showMachineModal, setShowMachineModal] = useState(false);

  const selectMachine = (machine: typeof PRODUCT_MODELS[0]) => {
    setFormData(prev => ({
      ...prev,
      itemName: machine.name,
      itemDescription: machine.description,
      rate: machine.rate,
    }));
    setShowMachineModal(false);
  };

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
      // Resolve assets
      const logoAsset = Asset.fromModule(LogoImage);
      const signAsset = Asset.fromModule(SignStampImage);
      await Promise.all([logoAsset.downloadAsync(), signAsset.downloadAsync()]);

      const logoUri = logoAsset.localUri || logoAsset.uri;
      const signUri = signAsset.localUri || signAsset.uri;

      // USES THE "TECH" - Calls the external template utility
      const html = generateQuotationHTML(
        formData,
        logoUri,
        signUri,
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
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>SELECT MACHINE</Text>
              <Pressable
                style={styles.dropdownBtn}
                onPress={() => setShowMachineModal(true)}
              >
                <Text style={styles.dropdownText}>{formData.itemName || 'Select a Machine'}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </Pressable>
            </View>

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
        <Modal
          visible={showMachineModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMachineModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowMachineModal(false)}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Machine</Text>
                <Pressable onPress={() => setShowMachineModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </Pressable>
              </View>
              <FlatList
                data={PRODUCT_MODELS}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.machineItem}
                    onPress={() => selectMachine(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.machineNameText}>{item.name}</Text>
                      <Text style={styles.machineDescText}>{item.description}</Text>
                    </View>
                    {item.name !== 'Other (Custom)' && (
                      <View style={styles.machinePriceBadge}>
                        <Text style={styles.machinePriceText}>₹{parseFloat(item.rate).toLocaleString('en-IN')}</Text>
                      </View>
                    )}
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>
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
  genText: { color: 'white', fontSize: 16, fontWeight: '800' },

  // Modal & Dropdown Styles
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '60%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  machineItem: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  machineNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  machineDescText: {
    fontSize: 12,
    color: '#64748B',
  },
  machinePriceBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  machinePriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
