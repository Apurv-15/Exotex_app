import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Modal, Image, ActionSheetIOS, Platform, AlertButton } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { THEME } from '../../constants/theme';
import { ComplaintService, Complaint } from '../../services/ComplaintService';
import { SalesService } from '../../services/SalesService';
import { useAuth } from '../../context/AuthContext';
import GlassPanel from '../../components/GlassPanel';
import MeshBackground from '../../components/MeshBackground';

const CATEGORIES = ['Billing', 'Service', 'Delay', 'Technical', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function RaiseComplaintStep2() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { clientData } = route.params;

    const [loading, setLoading] = useState(false);
    const [complaintId] = useState(`CMP-${Math.floor(100000 + Math.random() * 900000)}`);

    const [formData, setFormData] = useState({
        category: 'Service' as any,
        description: '',
        dept: '',
        officer: '',
        actionTaken: '',
        status: 'Open' as any,
        confirmation: 'No' as 'Yes' | 'No',
        feedback: '',
        resolvedBy: '',
        designation: '',
        warrantyAttached: false
    });

    const [imageUris, setImageUris] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const handlePickImage = async () => {
        if (imageUris.length >= 3) {
            Alert.alert('Limit Reached', 'You can upload up to 3 images.');
            return;
        }

        const options: AlertButton[] = [
            { text: 'Camera', onPress: launchCamera },
            { text: 'Gallery', onPress: launchGallery },
            { text: 'Web (Sample Image)', onPress: addSampleImage },
            { text: 'Cancel', style: 'cancel' }
        ];

        Alert.alert('Upload Photo', 'Choose a source', options);
    };

    const addSampleImage = () => {
        const sampleUrl = 'https://picsum.photos/seed/' + Math.random() + '/800/600';
        setImageUris([...imageUris, sampleUrl]);
    };

    const launchCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                allowsEditing: false, // true might crop unexpectedly
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUris([...imageUris, result.assets[0].uri]);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to open camera.');
        }
    };

    const launchGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Gallery permission is required.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                allowsMultipleSelection: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUris([...imageUris, result.assets[0].uri]);
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'Failed to open gallery.');
        }
    };

    const removeImage = (index: number) => {
        const newUris = [...imageUris];
        newUris.splice(index, 1);
        setImageUris(newUris);
    };

    const handleAutofill = () => {
        setFormData({
            category: 'Technical',
            description: 'Customer reported leakage from the main unit joint. Requesting urgent visit.',
            dept: 'Technical Support',
            officer: 'Amit Verma',
            actionTaken: 'Ticket raised, technician assigned for tomorrow.',
            status: 'In Progress',
            confirmation: 'No',
            feedback: '',
            resolvedBy: '',
            designation: '',
            warrantyAttached: true
        });
        // Add a sample web image for easy testing
        setImageUris(['https://picsum.photos/800/600']);
    };

    const handleSubmit = async () => {
        if (!formData.description) {
            Alert.alert('Required', 'Please enter a complaint description.');
            return;
        }

        setLoading(true);
        setUploading(true);
        try {
            // Upload images first
            let uploadedUrls: string[] = [];
            if (imageUris.length > 0) {
                uploadedUrls = await Promise.all(
                    imageUris.map((uri, index) =>
                        ComplaintService.uploadImage(uri, complaintId, index)
                    )
                );
            }

            const complaint: Complaint = {
                complaintId,
                invoiceNo: clientData.invoiceNumber,
                customerName: clientData.customerName,
                customerPhone: clientData.phone,
                customerEmail: clientData.email,
                category: formData.category,
                description: formData.description,
                dateOfComplaint: new Date().toISOString().split('T')[0],
                assignedDepartment: formData.dept,
                assignedOfficer: formData.officer,
                actionTaken: formData.actionTaken,
                status: formData.status,
                clientConfirmation: formData.confirmation,
                clientFeedback: formData.feedback,
                resolvedByName: formData.resolvedBy,
                resolvedByDesignation: formData.designation,
                imageUrls: uploadedUrls,
                warrantyCardAttached: formData.warrantyAttached,
                branchId: user?.branchId || clientData.branchId,
                city: clientData.city
            };

            await ComplaintService.createComplaint(complaint);
            Alert.alert('Success', 'Complaint has been registered successfully.', [
                { text: 'OK', onPress: () => navigation.popToTop() }
            ]);
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to submit complaint.');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.text} />
            </Pressable>
            <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Complaint Details</Text>
                <Text style={styles.headerId}>{complaintId}</Text>
            </View>
            <View style={{ width: 44 }} />
        </View>
    );

    return (
        <View style={styles.container}>
            <MeshBackground />
            {renderHeader()}

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Test Autofill Button */}
                <Pressable onPress={handleAutofill} style={{ alignSelf: 'center', marginBottom: 15, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                    <Text style={{ color: THEME.colors.primary, fontSize: 12, fontFamily: THEME.fonts.bold }}>⚡ Auto-fill Form (Test)</Text>
                </Pressable>

                <GlassPanel style={styles.section}>
                    <Text style={styles.sectionTitle}>Complaint ID</Text>
                    <Text style={styles.complaintIdText}>{complaintId}</Text>
                </GlassPanel>

                <GlassPanel style={styles.section}>
                    <Text style={styles.label}>Complaint Category</Text>
                    <View style={styles.pickerRow}>
                        {CATEGORIES.map(cat => (
                            <Pressable
                                key={cat}
                                style={[styles.chip, formData.category === cat && styles.chipActive]}
                                onPress={() => setFormData({ ...formData, category: cat as any })}
                            >
                                <Text style={[styles.chipText, formData.category === cat && styles.chipTextActive]}>{cat}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Complaint Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Detail the client's concern..."
                        value={formData.description}
                        onChangeText={(t) => setFormData({ ...formData, description: t })}
                    />
                </GlassPanel>

                <GlassPanel style={styles.section}>
                    <Text style={styles.label}>Assigned Department</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Technical Support"
                        value={formData.dept}
                        onChangeText={(t) => setFormData({ ...formData, dept: t })}
                    />

                    <Text style={styles.label}>Assigned Officer</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Officer Name"
                        value={formData.officer}
                        onChangeText={(t) => setFormData({ ...formData, officer: t })}
                    />
                </GlassPanel>

                <GlassPanel style={styles.section}>
                    <Text style={styles.label}>Action Taken / Resolution Details</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        placeholder="What was done to resolve this?"
                        value={formData.actionTaken}
                        onChangeText={(t) => setFormData({ ...formData, actionTaken: t })}
                    />

                    <Text style={styles.label}>Status</Text>
                    <View style={styles.pickerRow}>
                        {STATUSES.map(s => (
                            <Pressable
                                key={s}
                                style={[styles.statusChip, formData.status === s && styles.statusChipActive]}
                                onPress={() => setFormData({ ...formData, status: s as any })}
                            >
                                <Text style={[styles.statusText, formData.status === s && styles.statusTextActive]}>{s}</Text>
                            </Pressable>
                        ))}
                    </View>
                </GlassPanel>

                <GlassPanel style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Confirmation</Text>
                    <View style={styles.confirmationRow}>
                        <Pressable
                            style={[styles.confirmBtn, formData.confirmation === 'Yes' && styles.confirmBtnYes]}
                            onPress={() => setFormData({ ...formData, confirmation: 'Yes' })}
                        >
                            <Text style={[styles.confirmBtnText, formData.confirmation === 'Yes' && { color: 'white' }]}>Yes</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.confirmBtn, formData.confirmation === 'No' && styles.confirmBtnNo]}
                            onPress={() => setFormData({ ...formData, confirmation: 'No' })}
                        >
                            <Text style={[styles.confirmBtnText, formData.confirmation === 'No' && { color: 'white' }]}>No</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.label}>Client Feedback / Remarks</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Client's thoughts..."
                        value={formData.feedback}
                        onChangeText={(t) => setFormData({ ...formData, feedback: t })}
                    />
                </GlassPanel>

                <GlassPanel style={styles.section}>
                    <Text style={styles.sectionTitle}>Supporting Documents</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
                        {imageUris.map((uri, index) => (
                            <View key={index} style={styles.photoContainer}>
                                <Image source={{ uri }} style={styles.photo} />
                                <Pressable
                                    style={styles.removePhotoBtn}
                                    onPress={() => removeImage(index)}
                                >
                                    <MaterialCommunityIcons name="close" size={16} color="white" />
                                </Pressable>
                            </View>
                        ))}

                        {imageUris.length < 3 && (
                            <Pressable style={styles.uploadBox} onPress={handlePickImage} disabled={uploading}>
                                {uploading ? (
                                    <ActivityIndicator color={THEME.colors.primary} />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="camera-plus" size={32} color={THEME.colors.primary} />
                                        <Text style={styles.uploadText}>ADD PHOTO</Text>
                                    </>
                                )}
                            </Pressable>
                        )}
                    </ScrollView>

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Warranty Card Attached?</Text>
                        <Pressable
                            onPress={() => setFormData({ ...formData, warrantyAttached: !formData.warrantyAttached })}
                        >
                            <MaterialCommunityIcons
                                name={formData.warrantyAttached ? "checkbox-marked" : "checkbox-blank-outline"}
                                size={28}
                                color={THEME.colors.primary}
                            />
                        </Pressable>
                    </View>
                </GlassPanel>

                <View style={styles.declaration}>
                    <MaterialCommunityIcons name="information-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={styles.declarationText}>I confirm that the information provided in this form is accurate to the best of my knowledge.</Text>
                </View>

                <Pressable
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit Complaint Record</Text>
                    )}
                </Pressable>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontFamily: THEME.fonts.bold, color: 'black' },
    headerId: { fontSize: 13, color: THEME.colors.primary, fontFamily: THEME.fonts.bold },
    content: { padding: 16 },
    section: { padding: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontFamily: THEME.fonts.black, color: 'black', marginBottom: 15 },
    label: { fontSize: 13, fontFamily: THEME.fonts.bold, color: 'black', marginBottom: 8, marginTop: 10 },
    complaintIdText: { fontSize: 24, fontFamily: THEME.fonts.black, color: 'black' },
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        fontFamily: THEME.fonts.body,
        fontSize: 15,
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
    chipActive: { backgroundColor: THEME.colors.primary },
    chipText: { fontSize: 12, fontFamily: THEME.fonts.bold, color: 'black' },
    chipTextActive: { color: 'black' },
    statusChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#F3F4F6' },
    statusChipActive: { backgroundColor: THEME.colors.primary + '20', borderWidth: 1, borderColor: THEME.colors.primary },
    statusText: { fontSize: 11, fontFamily: THEME.fonts.bold, color: 'black' },
    statusTextActive: { color: THEME.colors.primary },
    confirmationRow: { flexDirection: 'row', gap: 15, marginBottom: 10 },
    confirmBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    confirmBtnYes: { backgroundColor: THEME.colors.success },
    confirmBtnNo: { backgroundColor: THEME.colors.error },
    confirmBtnText: { fontFamily: THEME.fonts.bold, color: 'black' },

    photosRow: { flexDirection: 'row', marginBottom: 15 },
    photoContainer: { width: 100, height: 100, borderRadius: 12, marginRight: 10, position: 'relative' },
    photo: { width: '100%', height: '100%', borderRadius: 12 },
    removePhotoBtn: {
        position: 'absolute', top: -5, right: -5,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12, width: 24, height: 24,
        justifyContent: 'center', alignItems: 'center'
    },
    uploadBox: {
        width: 100, height: 100,
        borderRadius: 12,
        borderStyle: 'dashed', borderWidth: 2,
        borderColor: THEME.colors.primary + '40',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: THEME.colors.primary + '05',
        marginRight: 10,
    },
    uploadText: { marginTop: 6, fontSize: 10, fontFamily: THEME.fonts.black, color: THEME.colors.primary },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
    declaration: { flexDirection: 'row', gap: 8, paddingHorizontal: 10, marginBottom: 25 },
    declarationText: { flex: 1, fontSize: 12, color: 'black', lineHeight: 18 },
    submitBtn: { backgroundColor: THEME.colors.primary, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: 'black', fontSize: 16, fontFamily: THEME.fonts.bold },
});
