import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreateSaleStep1() {
    const navigation = useNavigation<any>();
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        email: '',
        city: '',
        productModel: '',
        serialNumber: '',
    });
    const [paymentReceived, setPaymentReceived] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleNext = () => {
        const { customerName, phone, productModel, serialNumber } = formData;
        if (!customerName || !phone || !productModel || !serialNumber) {
            showAlert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        if (!paymentReceived) {
            showAlert('Payment Required', 'Without amount received, warranty card cannot be generated. Please confirm payment first.');
            return;
        }

        navigation.navigate('CreateSaleStep2', { formData, paymentReceived });
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Customer Details Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <MaterialCommunityIcons name="account-outline" size={20} color="#7C3AED" />
                        </View>
                        <Text style={styles.sectionTitle}>Customer Details</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="account" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter customer name"
                                placeholderTextColor="#9CA3AF"
                                value={formData.customerName}
                                onChangeText={(text) => handleChange('customerName', text)}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>Phone</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="9876543210"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                    value={formData.phone}
                                    onChangeText={(text) => handleChange('phone', text)}
                                />
                            </View>
                        </View>
                        <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>City</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="map-marker" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mumbai"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.city}
                                    onChangeText={(text) => handleChange('city', text)}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Email <Text style={styles.optional}>(Optional)</Text></Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="john@example.com"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => handleChange('email', text)}
                            />
                        </View>
                    </View>
                </View>

                {/* Product Details Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="cube-outline" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.sectionTitle}>Product Details</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Product Model</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="tag-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Inverter Model X"
                                placeholderTextColor="#9CA3AF"
                                value={formData.productModel}
                                onChangeText={(text) => handleChange('productModel', text)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Serial Number</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="barcode" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="SN12345678"
                                placeholderTextColor="#9CA3AF"
                                value={formData.serialNumber}
                                onChangeText={(text) => handleChange('serialNumber', text)}
                            />
                        </View>
                    </View>
                </View>

                {/* Payment Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: '#D1FAE5' }]}>
                            <MaterialCommunityIcons name="cash" size={20} color="#10B981" />
                        </View>
                        <Text style={styles.sectionTitle}>Payment Confirmation</Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.paymentCard,
                            paymentReceived && styles.paymentCardActive,
                            pressed && { transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => setPaymentReceived(!paymentReceived)}
                    >
                        <View style={[styles.checkbox, paymentReceived && styles.checkboxActive]}>
                            {paymentReceived && (
                                <MaterialCommunityIcons name="check" size={16} color="white" />
                            )}
                        </View>
                        <View style={styles.paymentInfo}>
                            <Text style={[styles.paymentText, paymentReceived && styles.paymentTextActive]}>
                                Payment Received
                            </Text>
                            <Text style={styles.paymentSubtext}>
                                {paymentReceived ? 'Ready to proceed' : 'Tap to confirm payment'}
                            </Text>
                        </View>
                        {paymentReceived && (
                            <View style={styles.verifiedBadge}>
                                <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                            </View>
                        )}
                    </Pressable>

                    {!paymentReceived && (
                        <View style={styles.warningBox}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#F59E0B" />
                            <Text style={styles.warningText}>
                                Warranty card can only be generated after payment confirmation
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View style={styles.footer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.nextButton,
                        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                        !paymentReceived && styles.nextButtonDisabled
                    ]}
                    onPress={handleNext}
                >
                    {paymentReceived ? (
                        <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.nextButtonText}>Continue to Upload</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                        </LinearGradient>
                    ) : (
                        <View style={styles.disabledButton}>
                            <Text style={styles.nextButtonTextDisabled}>Confirm Payment First</Text>
                        </View>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    inputWrapper: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
        marginLeft: 4,
    },
    optional: {
        color: '#9CA3AF',
        fontWeight: '400',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        outlineStyle: 'none',
    } as any,
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 18,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        cursor: 'pointer',
    } as any,
    paymentCardActive: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    checkboxActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    paymentInfo: {
        flex: 1,
    },
    paymentText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    paymentTextActive: {
        color: '#059669',
    },
    paymentSubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    verifiedBadge: {
        marginLeft: 8,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 14,
        borderRadius: 12,
        marginTop: 12,
        gap: 10,
    },
    warningText: {
        flex: 1,
        color: '#B45309',
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    nextButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#E5E7EB',
        paddingVertical: 18,
        alignItems: 'center',
        borderRadius: 16,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    nextButtonTextDisabled: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '600',
    },
});
