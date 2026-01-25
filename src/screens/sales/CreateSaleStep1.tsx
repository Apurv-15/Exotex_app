import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { THEME } from '../../constants/config';
import { useNavigation } from '@react-navigation/native';

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

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        // Validation
        const { customerName, phone, productModel, serialNumber } = formData;
        if (!customerName || !phone || !productModel || !serialNumber) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        navigation.navigate('CreateSaleStep2', { formData });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionHeader}>Customer Details</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        value={formData.customerName}
                        onChangeText={(text) => handleChange('customerName', text)}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Phone *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="9876543210"
                            keyboardType="phone-pad"
                            value={formData.phone}
                            onChangeText={(text) => handleChange('phone', text)}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>City/Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mumbai"
                            value={formData.city}
                            onChangeText={(text) => handleChange('city', text)}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="john@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                    />
                </View>

                <Text style={styles.sectionHeader}>Product Details</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Product Model *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Inverter Model X"
                        value={formData.productModel}
                        onChangeText={(text) => handleChange('productModel', text)}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Serial Number *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="SN12345678"
                        value={formData.serialNumber}
                        onChangeText={(text) => handleChange('serialNumber', text)}
                    />
                </View>

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Next: Upload Proof</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    content: {
        padding: THEME.spacing.m,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME.colors.text,
        marginBottom: THEME.spacing.m,
        marginTop: THEME.spacing.s,
    },
    inputGroup: {
        marginBottom: THEME.spacing.m,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.xs,
        textTransform: 'uppercase',
    },
    input: {
        height: 48,
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.borderRadius.s,
        paddingHorizontal: THEME.spacing.s,
        fontSize: 16,
        color: THEME.colors.text,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    nextButton: {
        backgroundColor: THEME.colors.primary,
        height: 50,
        borderRadius: THEME.borderRadius.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: THEME.spacing.l,
        marginBottom: 40,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
});
