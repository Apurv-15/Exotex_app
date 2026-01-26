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
        paymentConfirmed: false
    });

    const isStep1Valid = () => {
        return (
            formData.customerName.trim() !== '' &&
            formData.phone.trim() !== '' &&
            formData.productModel.trim() !== '' &&
            formData.serialNumber.trim() !== ''
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
            showAlert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        if (!formData.paymentConfirmed) {
            showAlert('Payment Required', 'Warranty card can only be generated after payment confirmation.');
            return;
        }

        navigation.navigate('CreateSaleStep2', { formData });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F0F9FF', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>New Sale Entry</Text>
                    <Text style={styles.subtitle}>Enter customer and product details</Text>
                </View>

                {/* Customer Information */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="account-outline" size={20} color="#7C3AED" />
                        <Text style={styles.sectionTitle}>Customer Information</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter customer name"
                                value={formData.customerName}
                                onChangeText={(text) => setFormData({ ...formData, customerName: text })}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="9876543210"
                                    keyboardType="phone-pad"
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                />
                            </View>
                            <View style={[styles.inputContainer, { flex: 1 }]}>
                                <Text style={styles.label}>City</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mumbai"
                                    value={formData.city}
                                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputContainer, { borderBottomWidth: 0 }]}>
                            <Text style={styles.label}>Email Address (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="john@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                            />
                        </View>
                    </View>
                </View>

                {/* Product Information */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="cube-outline" size={20} color="#7C3AED" />
                        <Text style={styles.sectionTitle}>Product Details</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Product Model</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Inverter Model X"
                                value={formData.productModel}
                                onChangeText={(text) => setFormData({ ...formData, productModel: text })}
                            />
                        </View>

                        <View style={[styles.inputContainer, { borderBottomWidth: 0 }]}>
                            <Text style={styles.label}>Serial Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="SN12345678"
                                autoCapitalize="characters"
                                value={formData.serialNumber}
                                onChangeText={(text) => setFormData({ ...formData, serialNumber: text })}
                            />
                        </View>
                    </View>
                </View>

                {/* Payment Confirmation */}
                <View style={styles.section}>
                    <View style={[styles.card, styles.paymentCard, formData.paymentConfirmed && styles.paymentCardActive]}>
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
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        (!formData.paymentConfirmed || !isStep1Valid()) && styles.buttonDisabled,
                        pressed && !(!formData.paymentConfirmed || !isStep1Valid()) && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={handleNext}
                    disabled={!formData.paymentConfirmed || !isStep1Valid()}
                >
                    <LinearGradient
                        colors={formData.paymentConfirmed && isStep1Valid() ? ['#7C3AED', '#5B21B6'] : ['#E5E7EB', '#D1D5DB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.buttonText}>Continue to Photos</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                    </LinearGradient>
                </Pressable>
                {!formData.paymentConfirmed && isStep1Valid() && (
                    <Text style={styles.warningText}>Please confirm payment to continue</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
        marginTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
        paddingLeft: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4B5563',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
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
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
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
    warningText: {
        textAlign: 'center',
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 10,
    },
});
