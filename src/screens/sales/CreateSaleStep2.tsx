import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SalesService } from '../../services/SalesService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const IMAGE_CONFIG = [
    { label: 'Product Front', icon: 'image', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' },
    { label: 'Serial Number', icon: 'barcode', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Invoice/Bill', icon: 'receipt', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Installation', icon: 'tools', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
];

export default function CreateSaleStep2() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { formData } = route.params || {};
    const { user } = useAuth();

    const [images, setImages] = useState<string[]>(['', '', '', '']);
    const [submitting, setSubmitting] = useState(false);

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const pickImage = async (index: number) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = [...images];
            newImages[index] = result.assets[0].uri;
            setImages(newImages);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages[index] = '';
        setImages(newImages);
    };

    const handleSubmit = async () => {
        const validImagesCount = images.filter(img => img && img.length > 0).length;

        if (validImagesCount < 4) {
            showAlert('Images Required', `Please upload all 4 product images. You have uploaded ${validImagesCount}/4 images.`);
            return;
        }

        setSubmitting(true);
        try {
            const newSale = await SalesService.createSale({
                ...formData,
                saleDate: new Date().toISOString().split('T')[0],
                branchId: user?.branchId || 'unknown',
            });

            navigation.replace('WarrantyCard', { sale: newSale });
        } catch (error) {
            showAlert('Error', 'Failed to submit sale. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const validImagesCount = images.filter(img => img && img.length > 0).length;
    const allImagesUploaded = validImagesCount === 4;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F0F9FF', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <MaterialCommunityIcons name="camera-plus" size={24} color="#7C3AED" />
                    </View>
                    <Text style={styles.title}>Upload Product Images</Text>
                    <Text style={styles.description}>
                        All 4 images are required to generate the warranty card
                    </Text>
                </View>

                {/* Progress Card */}
                <View style={styles.card}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Upload Progress</Text>
                        <Text style={[styles.progressValue, allImagesUploaded && { color: '#10B981' }]}>
                            {validImagesCount}/4 Files {allImagesUploaded && '✓'}
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <LinearGradient
                            colors={allImagesUploaded ? ['#10B981', '#059669'] : ['#7C3AED', '#5B21B6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${(validImagesCount / 4) * 100}%` }]}
                        />
                    </View>
                </View>

                {/* Image Grid */}
                <View style={styles.imageGrid}>
                    {IMAGE_CONFIG.map((config, index) => (
                        <Pressable
                            key={index}
                            style={({ pressed }) => [
                                styles.imageSlot,
                                pressed && { transform: [{ scale: 0.98 }] }
                            ]}
                            onPress={() => !images[index] && pickImage(index)}
                        >
                            {images[index] ? (
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: images[index] }} style={styles.image} />
                                    <Pressable
                                        style={styles.removeButton}
                                        onPress={() => removeImage(index)}
                                    >
                                        <MaterialCommunityIcons name="close" size={16} color="white" />
                                    </Pressable>
                                    <View style={styles.imageOverlay}>
                                        <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                                        <Text style={styles.imageLabelDone}>{config.label}</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.emptySlot}>
                                    <View style={[styles.slotIcon, { backgroundColor: config.bg }]}>
                                        <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
                                    </View>
                                    <Text style={styles.slotLabel}>{config.label}</Text>
                                    <Text style={styles.slotAction}>Tap to upload</Text>
                                </View>
                            )}
                        </Pressable>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Fixed Bottom */}
            <View style={styles.footer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.submitButton,
                        pressed && !(!allImagesUploaded || submitting) && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                        (!allImagesUploaded || submitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting || !allImagesUploaded}
                >
                    <LinearGradient
                        colors={allImagesUploaded ? ['#10B981', '#059669'] : ['#E5E7EB', '#D1D5DB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="shield-check" size={20} color="white" />
                                <Text style={styles.submitButtonText}>Generate Warranty</Text>
                            </>
                        )}
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#7C3AED',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    imageSlot: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 6,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 6,
    },
    imageLabelDone: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    emptySlot: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    slotIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    slotLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    slotAction: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
