import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Platform, Image, StatusBar, KeyboardAvoidingView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
import { SoundManager } from '../../utils/SoundManager';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';

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

export default function CreateSaleStep1() {
    const navigation = useNavigation<any>();
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        date: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        waterTestingBefore: '',
        waterTestingAfter: '',
        executiveName: '',
        designation: '',
        plumberName: '',
        productModel: '',
        serialNumber: '',
        productDetailsConfirmed: false,
        paymentConfirmed: false
    });

    const fillDummyData = () => {
        setFormData({
            customerName: 'John Doe',
            phone: '9876543210',
            email: 'john.doe@example.com',
            address: '123 Test Street, Sample Area',
            city: 'Mumbai',
            date: new Date().toISOString().split('T')[0],
            invoiceNumber: 'INV' + Math.floor(Math.random() * 100000).toString(),
            waterTestingBefore: '150',
            waterTestingAfter: '50',
            executiveName: 'Alex Smith',
            designation: 'Sales Executive',
            plumberName: 'Mike Ross',
            productModel: 'EKO-GREEN G130',
            serialNumber: 'SN' + Math.floor(Math.random() * 1000000).toString(),
            productDetailsConfirmed: true,
            paymentConfirmed: true
        });
    };

    const isStep1Valid = () => {
        return (
            formData.customerName.trim() !== '' &&
            formData.phone.trim() !== '' &&
            formData.address.trim() !== '' &&
            formData.city.trim() !== '' &&
            formData.invoiceNumber.trim() !== '' &&
            formData.productModel.trim() !== '' &&
            formData.serialNumber.trim() !== '' &&
            formData.productDetailsConfirmed &&
            formData.paymentConfirmed
        );
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleNext = () => {
        if (!isStep1Valid()) {
            showAlert('Missing Fields', 'Please fill in all required fields and confirm the checkboxes.');
            return;
        }

        SoundManager.playNext();
        navigation.navigate('CreateSaleStep2', { formData });
    };

    return (
        <MeshBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <Pressable
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
                            </Pressable>
                            <View>
                                <Text style={styles.title}>New Sale</Text>
                                <Text style={styles.subtitle}>Step 1: Customer Details</Text>
                            </View>
                        </View>
                    </View>

                    {/* Customer Information */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                <MaterialCommunityIcons name="account-outline" size={20} color="#7C3AED" />
                                <Text style={styles.sectionTitle}>Customer Information</Text>
                            </View>
                            <Pressable
                                onPress={fillDummyData}
                                style={({ pressed }) => [
                                    styles.dummyFillBtn,
                                    pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                                ]}
                            >
                                <MaterialCommunityIcons name="auto-fix" size={18} color="#7C3AED" />
                                <Text style={styles.dummyFillText}>Quick Fill</Text>
                            </Pressable>
                        </View>
                        <GlassPanel style={styles.card}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Customer Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter customer name"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.customerName}
                                    onChangeText={(text) => setFormData({ ...formData, customerName: text })}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Mobile No. *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="9876543210"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="phone-pad"
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                    />
                                </View>
                                <View style={[styles.inputContainer, { flex: 1 }]}>
                                    <Text style={styles.label}>Date</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.date}
                                        onChangeText={(text) => setFormData({ ...formData, date: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Address *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full address"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.address}
                                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>City *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mumbai"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.city}
                                        onChangeText={(text) => setFormData({ ...formData, city: text })}
                                    />
                                </View>
                                <View style={[styles.inputContainer, { flex: 1 }]}>
                                    <Text style={styles.label}>Email (Optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="email@example.com"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={formData.email}
                                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Invoice Number *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="INV12345"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.invoiceNumber}
                                        onChangeText={(text) => setFormData({ ...formData, invoiceNumber: text })}
                                    />
                                </View>
                                <View style={[styles.inputContainer, { flex: 1 }]}>
                                    <Text style={styles.label}>Date</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.date}
                                        onChangeText={(text) => setFormData({ ...formData, date: text })}
                                    />
                                </View>
                            </View>
                        </GlassPanel>
                    </View>

                    {/* Water Testing */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="water" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Water Testing (PPM)</Text>
                        </View>
                        <GlassPanel style={styles.card}>
                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Before PPM</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="150"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={formData.waterTestingBefore}
                                        onChangeText={(text) => setFormData({ ...formData, waterTestingBefore: text })}
                                    />
                                </View>
                                <View style={[styles.inputContainer, { flex: 1 }]}>
                                    <Text style={styles.label}>After PPM</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="50"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={formData.waterTestingAfter}
                                        onChangeText={(text) => setFormData({ ...formData, waterTestingAfter: text })}
                                    />
                                </View>
                            </View>
                        </GlassPanel>
                    </View>

                    {/* Executive Details */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="account-tie" size={20} color="#10B981" />
                            <Text style={styles.sectionTitle}>Executive Details</Text>
                        </View>
                        <GlassPanel style={styles.card}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Executive Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter executive name"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.executiveName}
                                    onChangeText={(text) => setFormData({ ...formData, executiveName: text })}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Designation</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Sales Executive"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.designation}
                                        onChangeText={(text) => setFormData({ ...formData, designation: text })}
                                    />
                                </View>
                                <View style={[styles.inputContainer, { flex: 1 }]}>
                                    <Text style={styles.label}>Plumber Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter plumber name"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.plumberName}
                                        onChangeText={(text) => setFormData({ ...formData, plumberName: text })}
                                    />
                                </View>
                            </View>
                        </GlassPanel>
                    </View>

                    {/* Product Details */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="cube-outline" size={20} color="#7C3AED" />
                            <Text style={styles.sectionTitle}>Product Details</Text>
                        </View>
                        <GlassPanel style={styles.card}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Product Model *</Text>
                                <Pressable
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowModelDropdown(true)}
                                >
                                    <Text style={[styles.dropdownText, !formData.productModel && styles.placeholderText]}>
                                        {formData.productModel || 'Select product model'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                                </Pressable>
                            </View>

                            <View style={[styles.inputContainer, { borderBottomWidth: 0 }]}>
                                <Text style={styles.label}>Serial Number *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="SN12345678"
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="characters"
                                    value={formData.serialNumber}
                                    onChangeText={(text) => setFormData({ ...formData, serialNumber: text })}
                                />
                            </View>
                        </GlassPanel>

                        {/* Product Model Dropdown Modal */}
                        <Modal
                            visible={showModelDropdown}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setShowModelDropdown(false)}
                        >
                            <Pressable
                                style={styles.modalOverlay}
                                onPress={() => setShowModelDropdown(false)}
                            >
                                <View style={styles.dropdownContainer}>
                                    <View style={styles.dropdownHeader}>
                                        <Text style={styles.dropdownTitle}>Select Product Model</Text>
                                        <Pressable onPress={() => setShowModelDropdown(false)}>
                                            <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                                        </Pressable>
                                    </View>
                                    <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
                                        {PRODUCT_MODELS.map((model) => (
                                            <Pressable
                                                key={model}
                                                style={({ pressed }) => [
                                                    styles.dropdownItem,
                                                    formData.productModel === model && styles.dropdownItemSelected,
                                                    pressed && { backgroundColor: '#F3F4F6' }
                                                ]}
                                                onPress={() => {
                                                    setFormData({ ...formData, productModel: model });
                                                    setShowModelDropdown(false);
                                                }}
                                            >
                                                <View style={[
                                                    styles.modelIcon,
                                                    formData.productModel === model && styles.modelIconSelected
                                                ]}>
                                                    <MaterialCommunityIcons
                                                        name="water-outline"
                                                        size={20}
                                                        color={formData.productModel === model ? '#7C3AED' : '#9CA3AF'}
                                                    />
                                                </View>
                                                <Text style={[
                                                    styles.dropdownItemText,
                                                    formData.productModel === model && styles.dropdownItemTextSelected
                                                ]}>
                                                    {model}
                                                </Text>
                                                {formData.productModel === model && (
                                                    <MaterialCommunityIcons name="check-circle" size={20} color="#7C3AED" />
                                                )}
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            </Pressable>
                        </Modal>
                    </View>

                    {/* Product Details Confirmation */}
                    <View style={styles.section}>
                        <Pressable
                            style={styles.checkboxCard}
                            onPress={() => setFormData({ ...formData, productDetailsConfirmed: !formData.productDetailsConfirmed })}
                        >
                            <View style={[styles.checkbox, formData.productDetailsConfirmed && styles.checkboxActive]}>
                                {formData.productDetailsConfirmed && (
                                    <MaterialCommunityIcons name="check" size={16} color="white" />
                                )}
                            </View>
                            <Text style={styles.checkboxText}>
                                I hereby confirm that I have explained all the product details to the customer, and the customer has fully understood and acknowledged the same.
                            </Text>
                        </Pressable>
                    </View>

                    {/* Payment Confirmation */}
                    <View style={styles.section}>
                        <GlassPanel style={[styles.card, styles.paymentCard, formData.paymentConfirmed && styles.paymentCardActive]}>
                            <View style={styles.paymentInfo}>
                                <MaterialCommunityIcons
                                    name={formData.paymentConfirmed ? "cash-check" : "cash-remove"}
                                    size={24}
                                    color={formData.paymentConfirmed ? "#10B981" : "#EF4444"}
                                />
                                <View style={styles.paymentTextContainer}>
                                    <Text style={styles.paymentTitle}>Payment Received?</Text>
                                    <Text style={styles.paymentSubtitle}>Confirm before proceeding</Text>
                                </View>
                            </View>
                            <Pressable
                                onPress={() => setFormData({ ...formData, paymentConfirmed: !formData.paymentConfirmed })}
                                style={[styles.toggleContainer, formData.paymentConfirmed && styles.toggleActive]}
                            >
                                <View style={[styles.toggleCircle, formData.paymentConfirmed && styles.toggleCircleActive]} />
                            </Pressable>
                        </GlassPanel>
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            !isStep1Valid() && styles.buttonDisabled,
                            pressed && isStep1Valid() && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={handleNext}
                        disabled={!isStep1Valid()}
                    >
                        <LinearGradient
                            colors={isStep1Valid() ? ['#7C3AED', '#5B21B6'] : ['#E5E7EB', '#D1D5DB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Continue to Photos</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                        </LinearGradient>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 24,
        marginTop: 10,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logoWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    companyLogo: {
        width: 32,
        height: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    dummyFillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    dummyFillText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#7C3AED',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4B5563',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    row: {
        flexDirection: 'row',
    },
    inputContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        fontSize: 16,
        color: '#1A1A1A',
        paddingVertical: 4,
    },
    checkboxCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxActive: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    checkboxText: {
        flex: 1,
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 20,
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    paymentCardActive: {
        backgroundColor: '#F0FDF4',
        borderColor: '#10B981',
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    paymentTextContainer: {
        gap: 2,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    paymentSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    toggleContainer: {
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        padding: 4,
    },
    toggleActive: {
        backgroundColor: '#10B981',
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'white',
        transform: [{ translateX: 0 }],
    },
    toggleCircleActive: {
        transform: [{ translateX: 24 }],
    },
    footer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    dropdownText: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dropdownContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '100%',
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    dropdownList: {
        maxHeight: 400,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    dropdownItemSelected: {
        backgroundColor: '#F9FAFB',
    },
    modelIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modelIconSelected: {
        backgroundColor: '#EDE9FE',
    },
    dropdownItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#4B5563',
    },
    dropdownItemTextSelected: {
        color: '#7C3AED',
        fontWeight: '700',
    },
});
