import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { THEME } from '../../constants/config';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SalesService } from '../../services/SalesService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function CreateSaleStep2() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { formData } = route.params || {};
    const { user } = useAuth();

    const [images, setImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        if (images.length >= 4) {
            Alert.alert('Limit Reached', 'You can upload maximum 4 images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const handleSubmit = async () => {
        if (images.length < 2) {
            Alert.alert('Requirement', 'Please upload at least 2 images (Invoice & Installation Proof).');
            return;
        }

        setSubmitting(true);
        try {
            // Create Sale
            const newSale = await SalesService.createSale({
                ...formData,
                saleDate: new Date().toISOString().split('T')[0],
                branchId: user?.branchId || 'unknown',
            });

            // Navigate to Warranty Card
            navigation.replace('WarrantyCard', { sale: newSale });
        } catch (error) {
            Alert.alert('Error', 'Failed to submit sale. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    Please upload photos of the Invoice and the Installed Product.
                    {'\n'}Minimum 2 images required.
                </Text>

                <View style={styles.imageGrid}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageContainer}>
                            <Image source={{ uri }} style={styles.image} />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeImage(index)}
                            >
                                <MaterialCommunityIcons name="close" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {images.length < 4 && (
                        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
                            <MaterialCommunityIcons name="camera-plus" size={32} color={THEME.colors.primary} />
                            <Text style={styles.addButtonText}>Add Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.counterText}>{images.length}/4 Images Uploaded</Text>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit & Generate Warranty</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
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
    description: {
        fontSize: 16,
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.l,
        lineHeight: 22,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: THEME.spacing.m,
    },
    imageContainer: {
        width: '45%',
        aspectRatio: 1,
        borderRadius: THEME.borderRadius.m,
        overflow: 'hidden',
        marginBottom: THEME.spacing.m,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 4,
    },
    addButton: {
        width: '45%',
        aspectRatio: 1,
        borderRadius: THEME.borderRadius.m,
        borderWidth: 2,
        borderColor: THEME.colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.colors.surface,
    },
    addButtonText: {
        color: THEME.colors.primary,
        marginTop: 8,
        fontWeight: '600',
    },
    counterText: {
        textAlign: 'center',
        marginTop: THEME.spacing.m,
        color: THEME.colors.textSecondary,
    },
    footer: {
        padding: THEME.spacing.l,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
        backgroundColor: 'white',
    },
    submitButton: {
        backgroundColor: THEME.colors.success,
        height: 50,
        borderRadius: THEME.borderRadius.m,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: THEME.colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
});
