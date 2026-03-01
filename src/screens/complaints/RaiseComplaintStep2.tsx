import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Modal, Image, ActionSheetIOS, Platform, AlertButton } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { THEME } from '../../constants/theme';
import { ComplaintService, Complaint } from '../../services/ComplaintService';
import { SalesService } from '../../services/SalesService';
import { useAuth } from '../../context/AuthContext';
import GlassPanel from '../../components/GlassPanel';
import MeshBackground from '../../components/MeshBackground';
import { generateComplaintPDFHTML } from '../../utils/ComplaintTemplate';

// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';
// @ts-ignore
import SignStampImage from '../../assets/Warranty_pdf_template/Sign_stamp/Sign_stamp.png';

const CATEGORIES = ['Billing', 'Service', 'Delay', 'Technical', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function RaiseComplaintStep2() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { clientData } = route.params;

    const [loading, setLoading] = useState(false);
    const [isEditMode] = useState(!!route.params.complaint);
    const [complaintId, setComplaintId] = useState(
        route.params.complaint?.complaintId || `CMP-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`
    );

    const [formData, setFormData] = useState({
        category: route.params.complaint?.category || 'Service' as any,
        description: route.params.complaint?.description || '',
        dept: route.params.complaint?.assignedDepartment || '',
        officer: route.params.complaint?.assignedOfficer || '',
        actionTaken: route.params.complaint?.actionTaken || '',
        status: route.params.complaint?.status || 'Open' as any,
        confirmation: route.params.complaint?.clientConfirmation || 'No' as 'Yes' | 'No',
        feedback: route.params.complaint?.clientFeedback || '',
        resolvedBy: route.params.complaint?.resolvedByName || '',
        designation: route.params.complaint?.resolvedByDesignation || '',
        warrantyAttached: route.params.complaint?.warrantyCardAttached || false
    });

    const [imageUris, setImageUris] = useState<string[]>(route.params.complaint?.imageUrls || []);
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
            // Upload only local uris (ones that don't start with http/https)
            let uploadedUrls: string[] = [];
            const localUris = imageUris.filter(uri => !uri.startsWith('http'));
            const existingUrls = imageUris.filter(uri => uri.startsWith('http'));

            if (localUris.length > 0) {
                const newUrls = await Promise.all(
                    localUris.map((uri, index) =>
                        ComplaintService.uploadImage(uri, complaintId, existingUrls.length + index)
                    )
                );
                uploadedUrls = [...existingUrls, ...newUrls];
            } else {
                uploadedUrls = existingUrls;
            }

            const complaint: Complaint = {
                complaintId,
                invoiceNo: clientData.invoiceNumber,
                customerName: clientData.customerName,
                customerPhone: clientData.phone,
                customerEmail: clientData.email,
                category: formData.category,
                description: formData.description,
                dateOfComplaint: route.params.complaint?.dateOfComplaint || new Date().toISOString().split('T')[0],
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

            if (isEditMode) {
                await ComplaintService.updateComplaint(complaintId, complaint);
                navigation.navigate('ComplaintSuccess', { complaint });
            } else {
                try {
                    await ComplaintService.createComplaint(complaint);
                    navigation.navigate('ComplaintSuccess', { complaint });
                } catch (err: any) {
                    if (err.code === '23505') {
                        // Handle duplicate key by suggesting a new ID or just regenerating it
                        const newId = `CMP-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
                        setComplaintId(newId);
                        Alert.alert('Duplicate ID', 'The generated ID was already in use. We have updated the ID, please try submitting again.');
                    } else {
                        throw err;
                    }
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to save complaint.');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const handleDownloadReport = async (complaintData?: Complaint) => {
        try {
            setLoading(true);

            // Resolve assets
            const logoAsset = Asset.fromModule(LogoImage);
            const signAsset = Asset.fromModule(SignStampImage);
            await Promise.all([logoAsset.downloadAsync(), signAsset.downloadAsync()]);

            const logoUri = logoAsset.localUri || logoAsset.uri;
            const signUri = signAsset.localUri || signAsset.uri;

            const complaintToPrint = complaintData || {
                complaintId,
                invoiceNo: clientData.invoiceNumber,
                customerName: clientData.customerName,
                customerPhone: clientData.phone,
                customerEmail: clientData.email,
                category: formData.category,
                description: formData.description,
                dateOfComplaint: route.params.complaint?.dateOfComplaint || new Date().toISOString().split('T')[0],
                assignedDepartment: formData.dept,
                assignedOfficer: formData.officer,
                actionTaken: formData.actionTaken,
                status: formData.status,
                clientConfirmation: formData.confirmation,
                clientFeedback: formData.feedback,
                resolvedByName: formData.resolvedBy,
                resolvedByDesignation: formData.designation,
                imageUrls: imageUris,
                warrantyCardAttached: formData.warrantyAttached,
                city: clientData.city
            };

            const html = generateComplaintPDFHTML(complaintToPrint, logoUri, signUri);

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Download Complaint Report',
                    UTI: 'com.adobe.pdf'
                });
            }
        } catch (error) {
            console.error('Report generation error:', error);
            Alert.alert('Error', 'Failed to generate report PDF');
        } finally {
            setLoading(false);
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
        <MeshBackground>
            {renderHeader()}

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                        numberOfLines={3}
                        placeholder="Detail the client's concern..."
                        placeholderTextColor="#9CA3AF"
                        value={formData.description}
                        onChangeText={(t) => setFormData({ ...formData, description: t })}
                    />
                </GlassPanel>

                <GlassPanel style={styles.section}>
                    <View style={styles.inputRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.label}>Department</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Support"
                                placeholderTextColor="#9CA3AF"
                                value={formData.dept}
                                onChangeText={(t) => setFormData({ ...formData, dept: t })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Officer</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                placeholderTextColor="#9CA3AF"
                                value={formData.officer}
                                onChangeText={(t) => setFormData({ ...formData, officer: t })}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Action Taken / Resolution</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { height: 60, minHeight: 60 }]}
                        multiline
                        placeholder="Resolution details..."
                        placeholderTextColor="#9CA3AF"
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
                    <View style={styles.inputRow}>
                        <View style={{ flex: 1.5, marginRight: 10 }}>
                            <Text style={styles.label}>Confirmed?</Text>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
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
                        </View>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.label}>Client Feedback</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Remarks..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.feedback}
                                onChangeText={(t) => setFormData({ ...formData, feedback: t })}
                            />
                        </View>
                    </View>
                </GlassPanel>

                <GlassPanel style={styles.section}>
                    <Text style={styles.sectionTitleCompact}>Supporting Documents</Text>

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
                                        <MaterialCommunityIcons name="camera-plus" size={24} color={THEME.colors.primary} />
                                        <Text style={styles.uploadText}>ADD</Text>
                                    </>
                                )}
                            </Pressable>
                        )}
                    </ScrollView>

                    <View style={styles.switchRowCompact}>
                        <Text style={styles.labelCompact}>Warranty Card Attached?</Text>
                        <Pressable
                            onPress={() => setFormData({ ...formData, warrantyAttached: !formData.warrantyAttached })}
                        >
                            <MaterialCommunityIcons
                                name={formData.warrantyAttached ? "checkbox-marked" : "checkbox-blank-outline"}
                                size={24}
                                color={THEME.colors.primary}
                            />
                        </Pressable>
                    </View>
                </GlassPanel>

                <View style={styles.declarationCompact}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={THEME.colors.textSecondary} />
                    <Text style={styles.declarationTextCompact}>Information provided is accurate to my knowledge.</Text>
                </View>

                <Pressable
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text style={styles.submitBtnText}>{isEditMode ? 'Update Record' : 'Submit Record'}</Text>
                    )}
                </Pressable>

                <View style={{ height: 30 }} />
            </ScrollView>
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontFamily: THEME.fonts.bold, color: 'black' },
    headerId: { fontSize: 13, color: THEME.colors.primary, fontFamily: THEME.fonts.bold },
    content: { padding: 12 },
    section: { padding: 15, marginBottom: 12, borderRadius: 20 },
    sectionTitle: { fontSize: 16, fontFamily: THEME.fonts.black, color: 'black', marginBottom: 12 },
    sectionTitleCompact: { fontSize: 14, fontFamily: THEME.fonts.black, color: 'black', marginBottom: 10 },
    label: { fontSize: 12, fontFamily: THEME.fonts.bold, color: 'rgba(0,0,0,0.6)', marginBottom: 6, marginTop: 8 },
    labelCompact: { fontSize: 12, fontFamily: THEME.fonts.bold, color: 'rgba(0,0,0,0.6)' },
    inputRow: { flexDirection: 'row', gap: 0 },
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        fontFamily: THEME.fonts.body,
        fontSize: 14,
        color: 'black'
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 5 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    chipActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
    chipText: { fontSize: 12, fontFamily: THEME.fonts.bold, color: 'rgba(0,0,0,0.7)' },
    chipTextActive: { color: 'black' },
    statusChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#F3F4F6' },
    statusChipActive: { backgroundColor: THEME.colors.primary + '20', borderWidth: 1, borderColor: THEME.colors.primary },
    statusText: { fontSize: 11, fontFamily: THEME.fonts.bold, color: 'rgba(0,0,0,0.7)' },
    statusTextActive: { color: THEME.colors.primary },
    confirmationRowCompact: { flexDirection: 'row', alignItems: 'flex-end' },
    confirmBtn: { flex: 1, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    confirmBtnYes: { backgroundColor: THEME.colors.success },
    confirmBtnNo: { backgroundColor: THEME.colors.error },
    confirmBtnText: { fontFamily: THEME.fonts.bold, color: 'black', fontSize: 12 },

    photosRow: { flexDirection: 'row', marginBottom: 10 },
    photoContainer: { width: 80, height: 80, borderRadius: 12, marginRight: 10, position: 'relative' },
    photo: { width: '100%', height: '100%', borderRadius: 12 },
    removePhotoBtn: {
        position: 'absolute', top: -5, right: -5,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12, width: 24, height: 24,
        justifyContent: 'center', alignItems: 'center', zIndex: 10
    },
    uploadBox: {
        width: 80, height: 80,
        borderRadius: 12,
        borderStyle: 'dashed', borderWidth: 2,
        borderColor: THEME.colors.primary + '40',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: THEME.colors.primary + '05',
        marginRight: 10,
    },
    uploadText: { marginTop: 4, fontSize: 10, fontFamily: THEME.fonts.black, color: THEME.colors.primary },

    switchRowCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    declarationCompact: { flexDirection: 'row', gap: 8, paddingHorizontal: 10, marginBottom: 20, alignItems: 'center' },
    declarationTextCompact: { flex: 1, fontSize: 11, color: 'rgba(0,0,0,0.5)', fontFamily: THEME.fonts.body },
    submitBtn: { backgroundColor: THEME.colors.primary, height: 54, borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    submitBtnText: { color: 'black', fontSize: 16, fontFamily: THEME.fonts.black },
});
