import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Alert, ActivityIndicator, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SalesService } from '../../services/SalesService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
// import { SoundManager } from '../../utils/SoundManager';

const IMAGE_CONFIG = [
    { label: 'Product Front (Required)', icon: 'image', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)', required: true },
    { label: 'Serial Number (Required)', icon: 'barcode', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', required: true },
    { label: 'Invoice/Bill (Optional)', icon: 'receipt', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', required: false },
    { label: 'Installation (Optional)', icon: 'tools', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', required: false },
];

export default function CreateSaleStep2() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { formData } = route.params || {};
    const { user } = useAuth();

    const [images, setImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    // Check network status on mount
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? true);
        });
        return () => unsubscribe();
    }, []);

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handlePickImage = async () => {
        if (images.length >= 6) {
            showAlert('Limit Reached', 'Maximum 6 photos allowed');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 6 - images.length,
            });

            if (!result.canceled && result.assets) {
                const newUris = result.assets.map(asset => asset.uri);
                setImages([...images, ...newUris]);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            showAlert('Error', 'Failed to pick images');
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (images.length < 2) {
            showAlert('Images Required', 'Please upload at least 2 images (Product and Serial Number).');
            return;
        }

        setSubmitting(true);
        setUploadProgress(0);
        setUploadStatus(isOnline ? 'Uploading images...' : 'Saving locally (offline)...');

        try {
            const newSale = await SalesService.createSale(
                {
                    ...formData,
                    saleDate: new Date().toISOString().split('T')[0],
                    branchId: user?.branchId || 'unknown',
                },
                images, // Already filtered as valid strings
                (progress) => {
                    setUploadProgress(progress);
                    if (progress === 100) {
                        setUploadStatus('Creating warranty card...');
                    }
                }
            );

            setUploadStatus('Success!');
            navigation.replace('WarrantyCard', { sale: newSale });
        } catch (error) {
            console.error('Submit error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setUploadStatus('');
            showAlert('Submission Failed', `Error: ${errorMessage}`);
        } finally {
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    // Check compulsory images logic for UI
    const compulsoryUploaded = !!images[0] && !!images[1];
    const totalUploaded = images.filter(img => img && img.length > 0).length;

    return (
        <MeshBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                                <Text style={styles.subtitle}>Step 2: Upload Images</Text>
                            </View>
                        </View>
                    </View>

                    {/* Network Status Warning */}
                    {!isOnline && (
                        <View style={styles.offlineWarning}>
                            <MaterialCommunityIcons name="wifi-off" size={20} color="#F59E0B" />
                            <Text style={styles.offlineText}>Offline - Images will be saved locally</Text>
                        </View>
                    )}

                    {/* Progress Card */}
                    <GlassPanel style={styles.card}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Warranty Photos (Min: 2)</Text>
                            <Text style={[styles.progressValue, images.length >= 2 && { color: '#10B981' }]}>
                                {images.length}/6 Files {images.length >= 2 && '(Ready)'}
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${(images.length / 6) * 100}%`,
                                        backgroundColor: images.length >= 2 ? '#10B981' : '#F59E0B'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.description}>Please upload Product Front and Serial Number photos.</Text>
                    </GlassPanel>

                    {/* Upload Progress */}
                    {submitting && uploadProgress > 0 && (
                        <View style={styles.uploadProgressCard}>
                            <Text style={styles.uploadStatusText}>{uploadStatus}</Text>
                            <View style={styles.uploadProgressBar}>
                                <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
                            </View>
                            <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
                        </View>
                    )}

                    {/* Image Grid */}
                    <View style={styles.imageGrid}>
                        {/* Add Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.imageSlot,
                                styles.emptySlot,
                                pressed && { opacity: 0.7 }
                            ]}
                            onPress={handlePickImage}
                        >
                            <View style={[styles.slotIcon, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
                                <MaterialCommunityIcons name="camera-plus" size={32} color="#7C3AED" />
                            </View>
                            <Text style={styles.slotLabel}>Add Photos</Text>
                        </Pressable>

                        {/* Selected Images */}
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageSlot}>
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri }}
                                        style={styles.image}
                                        resizeMode="cover"
                                    />
                                    <Pressable
                                        style={styles.removeButton}
                                        onPress={() => removeImage(index)}
                                    >
                                        <MaterialCommunityIcons name="close" size={16} color="white" />
                                    </Pressable>
                                    <View style={styles.imageOverlay}>
                                        <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                                        <Text style={styles.imageLabelDone}>Photo {index + 1}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Fixed Bottom */}
                <View style={styles.footer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.submitButton,
                            pressed && !(images.length < 2 || submitting) && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                            (images.length < 2 || submitting) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting || images.length < 2}
                    >
                        <LinearGradient
                            colors={images.length >= 2 ? ['#10B981', '#059669'] : ['#E5E7EB', '#D1D5DB']}
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
            </KeyboardAvoidingView>
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(229, 231, 235, 0.5)',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
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
    offlineWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    offlineText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
        flex: 1,
    },
    uploadProgressCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    uploadStatusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    uploadProgressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    uploadProgressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    uploadProgressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'right',
    },
});
