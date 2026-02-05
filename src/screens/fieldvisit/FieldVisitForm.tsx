import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Platform, StatusBar, KeyboardAvoidingView, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { FieldVisitService } from '../../services/FieldVisitService';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import MeshBackground from '../../components/MeshBackground';
import GlassPanel from '../../components/GlassPanel';
import { SoundManager } from '../../utils/SoundManager';

const TOTAL_STEPS = 3;

export default function FieldVisitForm() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isOnline, setIsOnline] = useState(true);
    const [uploadStatus, setUploadStatus] = useState('');

    // Check network status on mount
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? true);
        });
        return () => unsubscribe();
    }, []);

    const [formData, setFormData] = useState({
        // SECTION 1: Basic Site & Client Information
        dateOfVisit: new Date().toISOString().split('T')[0],
        branchName: user?.branchId || '',
        salesEngineerName: user?.name || '',
        clientCompanyName: '',
        siteAddress: '',
        industryType: '',
        contactPersonName: '',
        designation: '',
        mobileNumber: '',
        emailId: '',

        // SECTION 2: Water Source & Water Quality Details
        waterSource: [] as string[], // Borewell, Municipal, Tank, Other
        waterSourceOther: '',
        dailyWaterConsumption: '',
        purposeOfWaterUsage: [] as string[], // Process, Cooling, Boiler, Domestic, Other
        purposeOther: '',
        waterHardnessPPM: '',
        scalingIssueObserved: '', // Yes/No
        scalingDescription: '',

        // SECTION 3: Existing System & Problem Identification
        existingWaterTreatment: '', // Yes/No
        existingSystemDetails: '',
        problemsFaced: [] as string[], // Scaling, High Maintenance Cost, Frequent Breakdown, Chemical Usage, Other
        problemsOther: '',
        maintenanceFrequency: '',
        customerExpectations: '',

        // SECTION 4: Area of Application
        applicationArea: [] as string[], // Boiler, Cooling Tower, Heat Exchanger, Pipeline, Process Line, Other
        applicationOther: '',
        pipeLineSize: '',
        operatingPressure: '',
        operatingTemperature: '',

        // SECTION 5: Technical & Commercial Observations
        ekotexInstallationFeasible: '', // Yes/No
        recommendedEkotexModel: '',
        quantityRequired: '',
        siteConstraints: '',
        accessoriesRequired: '',

        // SECTION 6: Commercial Discussion Summary
        customerInterestLevel: '', // High/Medium/Low
        budgetDiscussed: '', // Yes/No
        expectedDecisionTimeline: '',
        decisionMakerIdentified: '', // Yes/No

        // SECTION 7: Competitor & Market Information
        existingCompetitorSolution: '',
        competitorPriceRange: '',
        customerRemarks: '',

        // SECTION 8: Photographs & Attachments
        sitePhotographsTaken: false,
        existingSystemPhotographs: false,
        problemAreaPhotographs: false,
        drawingsCollected: false,

        // SECTION 9: Follow-up & Action Plan
        nextActionRequired: [] as string[], // Quotation, Demo, Technical Discussion, Follow-up Meeting, Other
        nextActionOther: '',
        responsiblePerson: '',
        expectedFollowUpDate: '',

        // SECTION 10: Executive Remarks
        salesEngineerRemarks: '',
        overallSiteAssessment: '', // Excellent/Good/Average/Not Suitable
        conversionProbability: '',
        visitedBySignature: '',
    });

    const fillDummyData = () => {
        setFormData({
            dateOfVisit: new Date().toISOString().split('T')[0],
            branchName: user?.branchId || 'Branch Alpha',
            salesEngineerName: user?.name || 'Engineer X',
            clientCompanyName: 'Industrial Solutions Ltd',
            siteAddress: 'Industrial Area Phase 2, Plot 45',
            industryType: 'Manufacturing',
            contactPersonName: 'Mr. Robert Green',
            designation: 'Plant Manager',
            mobileNumber: '9988776655',
            emailId: 'robert.green@industrialsolutions.com',
            waterSource: ['Borewell', 'Tank'],
            waterSourceOther: '',
            dailyWaterConsumption: '5000 Liters',
            purposeOfWaterUsage: ['Process', 'Cooling'],
            purposeOther: '',
            waterHardnessPPM: '450',
            scalingIssueObserved: 'Yes',
            scalingDescription: 'Heavy scaling observed in the main boiler lines.',
            existingWaterTreatment: 'No',
            existingSystemDetails: 'Currently using manual chemical dosing only.',
            problemsFaced: ['Scaling', 'High Maintenance Cost'],
            problemsOther: '',
            maintenanceFrequency: 'Monthly',
            customerExpectations: 'Reduce maintenance downtime and chemical costs.',
            applicationArea: ['Boiler', 'Cooling Tower'],
            applicationOther: '',
            pipeLineSize: '4 Inches',
            operatingPressure: '6 Bar',
            operatingTemperature: '85 C',
            ekotexInstallationFeasible: 'Yes',
            recommendedEkotexModel: 'Ekotex Ultra 500',
            quantityRequired: '1',
            siteConstraints: 'Limited space near the inlet pump.',
            accessoriesRequired: 'Wall mounting brackets and 4-inch flanges.',
            customerInterestLevel: 'High',
            budgetDiscussed: 'Yes',
            expectedDecisionTimeline: 'Next 10 days',
            decisionMakerIdentified: 'Yes',
            existingCompetitorSolution: 'None',
            competitorPriceRange: 'N/A',
            customerRemarks: 'Client is frustrated with current breakdown frequency.',
            sitePhotographsTaken: true,
            existingSystemPhotographs: true,
            problemAreaPhotographs: true,
            drawingsCollected: true,
            nextActionRequired: ['Quotation', 'Technical Discussion'],
            nextActionOther: '',
            responsiblePerson: user?.name || 'Engineer X',
            expectedFollowUpDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            salesEngineerRemarks: 'Site visit was successful. Client is ready for a technical demo.',
            overallSiteAssessment: 'Good',
            conversionProbability: 'High',
            visitedBySignature: 'Robert Green',
        });
    };

    const [images, setImages] = useState<string[]>([]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleArrayField = (field: string, value: string) => {
        setFormData(prev => {
            const arr = prev[field as keyof typeof prev] as string[];
            if (arr.includes(value)) {
                return { ...prev, [field]: arr.filter(v => v !== value) };
            } else {
                return { ...prev, [field]: [...arr, value] };
            }
        });
    };

    const isStep1Valid = () => {
        return (
            formData.clientCompanyName.trim() !== '' &&
            formData.siteAddress.trim() !== '' &&
            formData.contactPersonName.trim() !== '' &&
            formData.mobileNumber.trim() !== ''
        );
    };

    const isStep2Valid = () => {
        return (
            formData.waterSource.length > 0 &&
            formData.purposeOfWaterUsage.length > 0
        );
    };

    const isStep3Valid = () => {
        return (
            formData.customerInterestLevel !== '' &&
            formData.overallSiteAssessment !== ''
        );
    };

    const canProceed = () => {
        if (currentStep === 1) return isStep1Valid();
        if (currentStep === 2) return isStep2Valid();
        if (currentStep === 3) return isStep3Valid();
        return true;
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handlePickImage = async () => {
        if (images.length >= 8) {
            showAlert('Limit Reached', 'Maximum 8 photos allowed');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets) {
                const newImages = result.assets.slice(0, 8 - images.length).map(asset => asset.uri);
                setImages([...images, ...newImages]);
            }
        } catch (error) {
            console.error('Image picker error:', error);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        if (!canProceed()) {
            showAlert('Missing Fields', 'Please fill in all required fields.');
            return;
        }
        if (currentStep < TOTAL_STEPS) {
            SoundManager.playNext();
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleSubmit = async () => {
        if (!canProceed()) {
            showAlert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setUploadProgress(0);
        setUploadStatus(isOnline ? 'Uploading photos...' : 'Saving locally (offline)...');

        try {
            await FieldVisitService.createFieldVisit(
                {
                    ...formData,
                    siteName: formData.clientCompanyName,
                    contactPerson: formData.contactPersonName,
                    phone: formData.mobileNumber,
                    email: formData.emailId,
                    address: formData.siteAddress,
                    city: formData.industryType,
                    visitDate: formData.dateOfVisit,
                    visitTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
                    visitType: 'Inspection',
                    purpose: formData.customerExpectations,
                    priority: formData.customerInterestLevel === 'High' ? 'High' :
                        formData.customerInterestLevel === 'Low' ? 'Low' : 'Medium',
                    assignedTechnician: formData.salesEngineerName,
                    equipmentStatus: formData.existingSystemDetails || 'N/A',
                    waterTdsBefore: formData.waterHardnessPPM,
                    waterTdsAfter: '',
                    equipmentModel: formData.recommendedEkotexModel,
                    serialNumber: '',
                    installationDate: '',
                    lastServiceDate: '',
                    workDescription: formData.salesEngineerRemarks,
                    partsReplaced: formData.accessoriesRequired,
                    materialsUsed: '',
                    timeSpent: '',
                    satisfaction: formData.overallSiteAssessment === 'Excellent' ? 5 :
                        formData.overallSiteAssessment === 'Good' ? 4 :
                            formData.overallSiteAssessment === 'Average' ? 3 : 2,
                    customerComments: formData.customerRemarks,
                    signatureRequired: formData.visitedBySignature !== '',
                    followUpNeeded: formData.nextActionRequired.length > 0,
                    followUpDate: formData.expectedFollowUpDate,
                    followUpNotes: formData.nextActionRequired.join(', '),
                    branchId: user?.branchId || '',
                    createdBy: user?.name || '',
                },
                images,
                (progress) => {
                    setUploadProgress(progress);
                    if (progress === 100) {
                        setUploadStatus('Finalizing report...');
                    }
                }
            );

            setUploadStatus('Success!');
            SoundManager.playSuccess();
            showAlert('Success', 'Field visit recorded successfully!');
            navigation.goBack();
        } catch (error: any) {
            console.error('Submit error:', error);
            showAlert('Error', error.message || 'Failed to save field visit');
            setUploadStatus('');
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    // Checkbox component
    const Checkbox = ({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) => (
        <Pressable style={styles.checkboxRow} onPress={onPress}>
            <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                {checked && <MaterialCommunityIcons name="check" size={14} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>{label}</Text>
        </Pressable>
    );

    // Radio button component
    const RadioButton = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
        <Pressable style={styles.radioRow} onPress={onPress}>
            <View style={[styles.radio, selected && styles.radioActive]}>
                {selected && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{label}</Text>
        </Pressable>
    );

    // Progress Bar
    const ProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Step {currentStep} of {TOTAL_STEPS}</Text>
                <Text style={styles.progressPercent}>{Math.round((currentStep / TOTAL_STEPS) * 100)}%</Text>
            </View>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
            </View>
            <View style={styles.stepIndicators}>
                {[1, 2, 3].map((step) => (
                    <View key={step} style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            step <= currentStep && styles.stepCircleActive,
                            step < currentStep && styles.stepCircleCompleted
                        ]}>
                            {step < currentStep ? (
                                <MaterialCommunityIcons name="check" size={14} color="white" />
                            ) : (
                                <Text style={[styles.stepNumber, step <= currentStep && styles.stepNumberActive]}>{step}</Text>
                            )}
                        </View>
                        <Text style={[styles.stepLabel, step <= currentStep && styles.stepLabelActive]}>
                            {step === 1 ? 'Site Info' : step === 2 ? 'Technical' : 'Summary'}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderStep1 = () => (
        <>
            {/* Section 1: Basic Site & Client Information */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="office-building" size={20} color="#7C3AED" />
                    <Text style={styles.sectionTitle}>1. Basic Site & Client Information</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Date of Site Visit</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9CA3AF"
                                value={formData.dateOfVisit}
                                onChangeText={(v) => updateField('dateOfVisit', v)}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Branch Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Branch"
                                placeholderTextColor="#9CA3AF"
                                value={formData.branchName}
                                onChangeText={(v) => updateField('branchName', v)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Sales / Engineer Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your name"
                            placeholderTextColor="#9CA3AF"
                            value={formData.salesEngineerName}
                            onChangeText={(v) => updateField('salesEngineerName', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Client / Company Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter company name"
                            placeholderTextColor="#9CA3AF"
                            value={formData.clientCompanyName}
                            onChangeText={(v) => updateField('clientCompanyName', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Site Address *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Full site address"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={3}
                            value={formData.siteAddress}
                            onChangeText={(v) => updateField('siteAddress', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Industry Type</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Manufacturing, Food Processing"
                            placeholderTextColor="#9CA3AF"
                            value={formData.industryType}
                            onChangeText={(v) => updateField('industryType', v)}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Contact Person *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                placeholderTextColor="#9CA3AF"
                                value={formData.contactPersonName}
                                onChangeText={(v) => updateField('contactPersonName', v)}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Designation</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Title"
                                placeholderTextColor="#9CA3AF"
                                value={formData.designation}
                                onChangeText={(v) => updateField('designation', v)}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Mobile Number *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="9876543210"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="phone-pad"
                                value={formData.mobileNumber}
                                onChangeText={(v) => updateField('mobileNumber', v)}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Email ID</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="email@example.com"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.emailId}
                                onChangeText={(v) => updateField('emailId', v)}
                            />
                        </View>
                    </View>
                </GlassPanel>
            </View>

            {/* Section 2: Water Source & Water Quality Details */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="water" size={20} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>2. Water Source & Quality Details</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Water Source *</Text>
                        <View style={styles.checkboxGrid}>
                            <Checkbox label="Borewell" checked={formData.waterSource.includes('Borewell')}
                                onPress={() => toggleArrayField('waterSource', 'Borewell')} />
                            <Checkbox label="Municipal" checked={formData.waterSource.includes('Municipal')}
                                onPress={() => toggleArrayField('waterSource', 'Municipal')} />
                            <Checkbox label="Tank" checked={formData.waterSource.includes('Tank')}
                                onPress={() => toggleArrayField('waterSource', 'Tank')} />
                            <Checkbox label="Other" checked={formData.waterSource.includes('Other')}
                                onPress={() => toggleArrayField('waterSource', 'Other')} />
                        </View>
                        {formData.waterSource.includes('Other') && (
                            <TextInput
                                style={[styles.input, { marginTop: 8 }]}
                                placeholder="Specify other source"
                                placeholderTextColor="#9CA3AF"
                                value={formData.waterSourceOther}
                                onChangeText={(v) => updateField('waterSourceOther', v)}
                            />
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Approx. Daily Water Consumption</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 50,000 Liters"
                            placeholderTextColor="#9CA3AF"
                            value={formData.dailyWaterConsumption}
                            onChangeText={(v) => updateField('dailyWaterConsumption', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Purpose of Water Usage *</Text>
                        <View style={styles.checkboxGrid}>
                            <Checkbox label="Process" checked={formData.purposeOfWaterUsage.includes('Process')}
                                onPress={() => toggleArrayField('purposeOfWaterUsage', 'Process')} />
                            <Checkbox label="Cooling" checked={formData.purposeOfWaterUsage.includes('Cooling')}
                                onPress={() => toggleArrayField('purposeOfWaterUsage', 'Cooling')} />
                            <Checkbox label="Boiler" checked={formData.purposeOfWaterUsage.includes('Boiler')}
                                onPress={() => toggleArrayField('purposeOfWaterUsage', 'Boiler')} />
                            <Checkbox label="Domestic" checked={formData.purposeOfWaterUsage.includes('Domestic')}
                                onPress={() => toggleArrayField('purposeOfWaterUsage', 'Domestic')} />
                            <Checkbox label="Other" checked={formData.purposeOfWaterUsage.includes('Other')}
                                onPress={() => toggleArrayField('purposeOfWaterUsage', 'Other')} />
                        </View>
                        {formData.purposeOfWaterUsage.includes('Other') && (
                            <TextInput
                                style={[styles.input, { marginTop: 8 }]}
                                placeholder="Specify other purpose"
                                placeholderTextColor="#9CA3AF"
                                value={formData.purposeOther}
                                onChangeText={(v) => updateField('purposeOther', v)}
                            />
                        )}
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Water Hardness (PPM)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 350"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={formData.waterHardnessPPM}
                                onChangeText={(v) => updateField('waterHardnessPPM', v)}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Scaling Issue Observed</Text>
                            <View style={styles.radioGroup}>
                                <RadioButton label="Yes" selected={formData.scalingIssueObserved === 'Yes'}
                                    onPress={() => updateField('scalingIssueObserved', 'Yes')} />
                                <RadioButton label="No" selected={formData.scalingIssueObserved === 'No'}
                                    onPress={() => updateField('scalingIssueObserved', 'No')} />
                            </View>
                        </View>
                    </View>

                    {formData.scalingIssueObserved === 'Yes' && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>If Yes, describe</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe scaling issue"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                value={formData.scalingDescription}
                                onChangeText={(v) => updateField('scalingDescription', v)}
                            />
                        </View>
                    )}
                </GlassPanel>
            </View>
        </>
    );

    const renderStep2 = () => (
        <>
            {/* Section 3: Existing System & Problem Identification */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="cog-outline" size={20} color="#EF4444" />
                    <Text style={styles.sectionTitle}>3. Existing System & Problems</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Existing Water Treatment / Softener System</Text>
                        <View style={styles.radioGroup}>
                            <RadioButton label="Yes" selected={formData.existingWaterTreatment === 'Yes'}
                                onPress={() => updateField('existingWaterTreatment', 'Yes')} />
                            <RadioButton label="No" selected={formData.existingWaterTreatment === 'No'}
                                onPress={() => updateField('existingWaterTreatment', 'No')} />
                        </View>
                    </View>

                    {formData.existingWaterTreatment === 'Yes' && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Details of Existing System</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe existing system"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                value={formData.existingSystemDetails}
                                onChangeText={(v) => updateField('existingSystemDetails', v)}
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Problems Faced by Customer</Text>
                        <View style={styles.checkboxGrid}>
                            <Checkbox label="Scaling" checked={formData.problemsFaced.includes('Scaling')}
                                onPress={() => toggleArrayField('problemsFaced', 'Scaling')} />
                            <Checkbox label="High Maintenance Cost" checked={formData.problemsFaced.includes('High Maintenance Cost')}
                                onPress={() => toggleArrayField('problemsFaced', 'High Maintenance Cost')} />
                            <Checkbox label="Frequent Breakdown" checked={formData.problemsFaced.includes('Frequent Breakdown')}
                                onPress={() => toggleArrayField('problemsFaced', 'Frequent Breakdown')} />
                            <Checkbox label="Chemical Usage" checked={formData.problemsFaced.includes('Chemical Usage')}
                                onPress={() => toggleArrayField('problemsFaced', 'Chemical Usage')} />
                            <Checkbox label="Other" checked={formData.problemsFaced.includes('Other')}
                                onPress={() => toggleArrayField('problemsFaced', 'Other')} />
                        </View>
                        {formData.problemsFaced.includes('Other') && (
                            <TextInput
                                style={[styles.input, { marginTop: 8 }]}
                                placeholder="Specify other problems"
                                placeholderTextColor="#9CA3AF"
                                value={formData.problemsOther}
                                onChangeText={(v) => updateField('problemsOther', v)}
                            />
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Maintenance Frequency</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Monthly, Quarterly"
                            placeholderTextColor="#9CA3AF"
                            value={formData.maintenanceFrequency}
                            onChangeText={(v) => updateField('maintenanceFrequency', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Customer Expectations</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What does the customer expect?"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={3}
                            value={formData.customerExpectations}
                            onChangeText={(v) => updateField('customerExpectations', v)}
                        />
                    </View>
                </GlassPanel>
            </View>

            {/* Section 4: Area of Application */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="factory" size={20} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>4. Area of Application</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Application Area</Text>
                        <View style={styles.checkboxGrid}>
                            <Checkbox label="Boiler" checked={formData.applicationArea.includes('Boiler')}
                                onPress={() => toggleArrayField('applicationArea', 'Boiler')} />
                            <Checkbox label="Cooling Tower" checked={formData.applicationArea.includes('Cooling Tower')}
                                onPress={() => toggleArrayField('applicationArea', 'Cooling Tower')} />
                            <Checkbox label="Heat Exchanger" checked={formData.applicationArea.includes('Heat Exchanger')}
                                onPress={() => toggleArrayField('applicationArea', 'Heat Exchanger')} />
                            <Checkbox label="Pipeline" checked={formData.applicationArea.includes('Pipeline')}
                                onPress={() => toggleArrayField('applicationArea', 'Pipeline')} />
                            <Checkbox label="Process Line" checked={formData.applicationArea.includes('Process Line')}
                                onPress={() => toggleArrayField('applicationArea', 'Process Line')} />
                            <Checkbox label="Other" checked={formData.applicationArea.includes('Other')}
                                onPress={() => toggleArrayField('applicationArea', 'Other')} />
                        </View>
                        {formData.applicationArea.includes('Other') && (
                            <TextInput
                                style={[styles.input, { marginTop: 8 }]}
                                placeholder="Specify other area"
                                placeholderTextColor="#9CA3AF"
                                value={formData.applicationOther}
                                onChangeText={(v) => updateField('applicationOther', v)}
                            />
                        )}
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Pipe / Line Size</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 4 inch"
                                placeholderTextColor="#9CA3AF"
                                value={formData.pipeLineSize}
                                onChangeText={(v) => updateField('pipeLineSize', v)}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Operating Pressure</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 10 bar"
                                placeholderTextColor="#9CA3AF"
                                value={formData.operatingPressure}
                                onChangeText={(v) => updateField('operatingPressure', v)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Operating Temperature</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 80°C"
                            placeholderTextColor="#9CA3AF"
                            value={formData.operatingTemperature}
                            onChangeText={(v) => updateField('operatingTemperature', v)}
                        />
                    </View>
                </GlassPanel>
            </View>

            {/* Section 5: Technical Observations */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="clipboard-check" size={20} color="#10B981" />
                    <Text style={styles.sectionTitle}>5. Technical Observations</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Ekotex Installation Feasible</Text>
                        <View style={styles.radioGroup}>
                            <RadioButton label="Yes" selected={formData.ekotexInstallationFeasible === 'Yes'}
                                onPress={() => updateField('ekotexInstallationFeasible', 'Yes')} />
                            <RadioButton label="No" selected={formData.ekotexInstallationFeasible === 'No'}
                                onPress={() => updateField('ekotexInstallationFeasible', 'No')} />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Recommended Ekotex Model / Capacity</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Model and capacity recommendation"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={2}
                            value={formData.recommendedEkotexModel}
                            onChangeText={(v) => updateField('recommendedEkotexModel', v)}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Quantity Required</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 2 units"
                                placeholderTextColor="#9CA3AF"
                                value={formData.quantityRequired}
                                onChangeText={(v) => updateField('quantityRequired', v)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Site Constraints / Risks (if any)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Any constraints or risks"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={3}
                            value={formData.siteConstraints}
                            onChangeText={(v) => updateField('siteConstraints', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Accessories / Modifications Required</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="List required accessories"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={2}
                            value={formData.accessoriesRequired}
                            onChangeText={(v) => updateField('accessoriesRequired', v)}
                        />
                    </View>
                </GlassPanel>
            </View>
        </>
    );

    const renderStep3 = () => (
        <>
            {/* Section 6: Commercial Discussion Summary */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="handshake" size={20} color="#8B5CF6" />
                    <Text style={styles.sectionTitle}>6. Commercial Discussion</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Customer Interest Level *</Text>
                        <View style={styles.radioGroup}>
                            <RadioButton label="High" selected={formData.customerInterestLevel === 'High'}
                                onPress={() => updateField('customerInterestLevel', 'High')} />
                            <RadioButton label="Medium" selected={formData.customerInterestLevel === 'Medium'}
                                onPress={() => updateField('customerInterestLevel', 'Medium')} />
                            <RadioButton label="Low" selected={formData.customerInterestLevel === 'Low'}
                                onPress={() => updateField('customerInterestLevel', 'Low')} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Budget Discussed</Text>
                            <View style={styles.radioGroup}>
                                <RadioButton label="Yes" selected={formData.budgetDiscussed === 'Yes'}
                                    onPress={() => updateField('budgetDiscussed', 'Yes')} />
                                <RadioButton label="No" selected={formData.budgetDiscussed === 'No'}
                                    onPress={() => updateField('budgetDiscussed', 'No')} />
                            </View>
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Decision Maker Identified</Text>
                            <View style={styles.radioGroup}>
                                <RadioButton label="Yes" selected={formData.decisionMakerIdentified === 'Yes'}
                                    onPress={() => updateField('decisionMakerIdentified', 'Yes')} />
                                <RadioButton label="No" selected={formData.decisionMakerIdentified === 'No'}
                                    onPress={() => updateField('decisionMakerIdentified', 'No')} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Expected Decision Timeline</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 2 weeks, 1 month"
                            placeholderTextColor="#9CA3AF"
                            value={formData.expectedDecisionTimeline}
                            onChangeText={(v) => updateField('expectedDecisionTimeline', v)}
                        />
                    </View>
                </GlassPanel>
            </View>

            {/* Section 7: Competitor & Market Information */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#EC4899" />
                    <Text style={styles.sectionTitle}>7. Competitor Information</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Existing Competitor Solution (if any)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Competitor products in use"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={2}
                            value={formData.existingCompetitorSolution}
                            onChangeText={(v) => updateField('existingCompetitorSolution', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Competitor Price Range</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., ₹50,000 - ₹1,00,000"
                            placeholderTextColor="#9CA3AF"
                            value={formData.competitorPriceRange}
                            onChangeText={(v) => updateField('competitorPriceRange', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Customer Remarks / Comparison</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Customer feedback and comparison"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={3}
                            value={formData.customerRemarks}
                            onChangeText={(v) => updateField('customerRemarks', v)}
                        />
                    </View>
                </GlassPanel>
            </View>

            {/* Section 8: Photographs & Attachments */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="camera" size={20} color="#06B6D4" />
                    <Text style={styles.sectionTitle}>8. Photographs & Attachments</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.checkboxGrid}>
                        <Checkbox label="Site Photographs Taken" checked={formData.sitePhotographsTaken}
                            onPress={() => updateField('sitePhotographsTaken', !formData.sitePhotographsTaken)} />
                        <Checkbox label="Existing System Photographs" checked={formData.existingSystemPhotographs}
                            onPress={() => updateField('existingSystemPhotographs', !formData.existingSystemPhotographs)} />
                        <Checkbox label="Problem Area Photographs" checked={formData.problemAreaPhotographs}
                            onPress={() => updateField('problemAreaPhotographs', !formData.problemAreaPhotographs)} />
                        <Checkbox label="Drawings / Technical Documents" checked={formData.drawingsCollected}
                            onPress={() => updateField('drawingsCollected', !formData.drawingsCollected)} />
                    </View>

                    <Pressable style={styles.uploadButton} onPress={handlePickImage}>
                        <MaterialCommunityIcons name="camera-plus" size={24} color="#7C3AED" />
                        <Text style={styles.uploadButtonText}>Upload Photos ({images.length}/8)</Text>
                    </Pressable>

                    {images.length > 0 && (
                        <View style={styles.imageGrid}>
                            {images.map((uri, index) => (
                                <View key={index} style={styles.imageContainer}>
                                    <Image
                                        source={{ uri }}
                                        style={{ width: 60, height: 60, borderRadius: 10 }}
                                        resizeMode="cover"
                                    />
                                    <Pressable style={styles.removeImageButton} onPress={() => removeImage(index)}>
                                        <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    )}
                </GlassPanel>
            </View>

            {/* Section 9: Follow-up & Action Plan */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#F97316" />
                    <Text style={styles.sectionTitle}>9. Follow-up & Action Plan</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Next Action Required</Text>
                        <View style={styles.checkboxGrid}>
                            <Checkbox label="Quotation" checked={formData.nextActionRequired.includes('Quotation')}
                                onPress={() => toggleArrayField('nextActionRequired', 'Quotation')} />
                            <Checkbox label="Demo" checked={formData.nextActionRequired.includes('Demo')}
                                onPress={() => toggleArrayField('nextActionRequired', 'Demo')} />
                            <Checkbox label="Technical Discussion" checked={formData.nextActionRequired.includes('Technical Discussion')}
                                onPress={() => toggleArrayField('nextActionRequired', 'Technical Discussion')} />
                            <Checkbox label="Follow-up Meeting" checked={formData.nextActionRequired.includes('Follow-up Meeting')}
                                onPress={() => toggleArrayField('nextActionRequired', 'Follow-up Meeting')} />
                            <Checkbox label="Other" checked={formData.nextActionRequired.includes('Other')}
                                onPress={() => toggleArrayField('nextActionRequired', 'Other')} />
                        </View>
                        {formData.nextActionRequired.includes('Other') && (
                            <TextInput
                                style={[styles.input, { marginTop: 8 }]}
                                placeholder="Specify other action"
                                placeholderTextColor="#9CA3AF"
                                value={formData.nextActionOther}
                                onChangeText={(v) => updateField('nextActionOther', v)}
                            />
                        )}
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Responsible Person</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                placeholderTextColor="#9CA3AF"
                                value={formData.responsiblePerson}
                                onChangeText={(v) => updateField('responsiblePerson', v)}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Expected Follow-up Date</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9CA3AF"
                                value={formData.expectedFollowUpDate}
                                onChangeText={(v) => updateField('expectedFollowUpDate', v)}
                            />
                        </View>
                    </View>
                </GlassPanel>
            </View>

            {/* Section 10: Executive Remarks */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="comment-text" size={20} color="#6366F1" />
                    <Text style={styles.sectionTitle}>10. Executive Remarks</Text>
                </View>
                <GlassPanel style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Sales / Engineer Remarks</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Your observations and remarks"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            value={formData.salesEngineerRemarks}
                            onChangeText={(v) => updateField('salesEngineerRemarks', v)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Overall Site Assessment *</Text>
                        <View style={styles.assessmentButtons}>
                            {['Excellent', 'Good', 'Average', 'Not Suitable'].map((level) => (
                                <Pressable
                                    key={level}
                                    style={[
                                        styles.assessmentButton,
                                        formData.overallSiteAssessment === level && styles.assessmentButtonActive,
                                        level === 'Excellent' && formData.overallSiteAssessment === level && { backgroundColor: '#10B981' },
                                        level === 'Good' && formData.overallSiteAssessment === level && { backgroundColor: '#3B82F6' },
                                        level === 'Average' && formData.overallSiteAssessment === level && { backgroundColor: '#F59E0B' },
                                        level === 'Not Suitable' && formData.overallSiteAssessment === level && { backgroundColor: '#EF4444' },
                                    ]}
                                    onPress={() => updateField('overallSiteAssessment', level)}
                                >
                                    <Text style={[
                                        styles.assessmentButtonText,
                                        formData.overallSiteAssessment === level && styles.assessmentButtonTextActive
                                    ]}>{level}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Conversion Probability (%)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 75%"
                                placeholderTextColor="#9CA3AF"
                                value={formData.conversionProbability}
                                onChangeText={(v) => updateField('conversionProbability', v)}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Visited By (Name)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Service Engineer"
                                placeholderTextColor="#9CA3AF"
                                value={formData.visitedBySignature}
                                onChangeText={(v) => updateField('visitedBySignature', v)}
                            />
                        </View>
                    </View>
                </GlassPanel>
            </View>
        </>
    );

    return (
        <MeshBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <View style={styles.headerSubtitleCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                </View>

                {/* Network Status Warning */}
                {!isOnline && (
                    <View style={styles.offlineWarning}>
                        <MaterialCommunityIcons name="wifi-off" size={20} color="#92400E" />
                        <Text style={styles.offlineText}>Offline - Images will be saved locally</Text>
                    </View>
                )}

                {/* Progress Bar */}
                <ProgressBar />

                {/* Upload Progress */}
                {loading && uploadProgress > 0 && (
                    <View style={styles.uploadProgressCard}>
                        <Text style={styles.uploadStatusText}>{uploadStatus}</Text>
                        <View style={styles.uploadProgressBar}>
                            <View style={[styles.uploadProgressFillColor, { width: `${uploadProgress}%` }]} />
                        </View>
                        <Text style={styles.uploadProgressTextValue}>{uploadProgress}%</Text>
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                    <View style={styles.footerButtons}>
                        {currentStep > 1 && (
                            <Pressable style={styles.backBtn} onPress={handleBack}>
                                <MaterialCommunityIcons name="arrow-left" size={20} color="#6B7280" />
                                <Text style={styles.backBtnText}>Back</Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={[styles.nextBtn, !canProceed() && styles.btnDisabled]}
                            onPress={currentStep === TOTAL_STEPS ? handleSubmit : handleNext}
                            disabled={!canProceed() || loading}
                        >
                            <View style={[styles.gradientBtn, { backgroundColor: canProceed() ? '#74C69D' : '#E5E7EB' }]}>
                                {loading ? (
                                    <Text style={styles.nextBtnText}>Submitting...</Text>
                                ) : (
                                    <>
                                        <Text style={styles.nextBtnText}>
                                            {currentStep === TOTAL_STEPS ? 'Submit Report' : 'Continue'}
                                        </Text>
                                        <MaterialCommunityIcons
                                            name={currentStep === TOTAL_STEPS ? 'check-circle' : 'arrow-right'}
                                            size={20}
                                            color="white"
                                        />
                                    </>
                                )}
                            </View>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    headerSubtitleCard: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    dummyFillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    dummyFillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#7C3AED',
    },
    backButton: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E5E7EB',
    },
    title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },

    // Progress Bar
    progressContainer: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'transparent' },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
    progressPercent: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
    progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 3 },
    stepIndicators: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    stepItem: { alignItems: 'center', flex: 1 },
    stepCircle: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
        marginBottom: 4,
    },
    stepCircleActive: { backgroundColor: '#7C3AED' },
    stepCircleCompleted: { backgroundColor: '#10B981' },
    stepNumber: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
    stepNumberActive: { color: 'white' },
    stepLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
    stepLabelActive: { color: '#7C3AED', fontWeight: '600' },

    scrollContent: {
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
        paddingBottom: 100
    },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8, paddingLeft: 4 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#4B5563' },
    card: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        padding: 18,
    },
    row: { flexDirection: 'row' },
    inputContainer: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(243, 244, 246, 0.3)' },
    label: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { fontSize: 15, color: '#1A1A1A', paddingVertical: 4 },
    textArea: { minHeight: 60, textAlignVertical: 'top' },

    // Checkboxes
    checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, minWidth: '45%' },
    checkbox: {
        width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB',
        justifyContent: 'center', alignItems: 'center',
    },
    checkboxActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    checkboxLabel: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

    // Radio buttons
    radioGroup: { flexDirection: 'row', gap: 16, marginTop: 8 },
    radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    radio: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB',
        justifyContent: 'center', alignItems: 'center',
    },
    radioActive: { borderColor: '#7C3AED' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7C3AED' },
    radioLabel: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

    // Assessment buttons
    assessmentButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    assessmentButton: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
        backgroundColor: 'rgba(243, 244, 246, 0.5)', borderWidth: 1, borderColor: 'rgba(229, 231, 235, 0.5)',
    },
    assessmentButtonActive: { borderColor: 'transparent' },
    assessmentButtonText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    assessmentButtonTextActive: { color: 'white' },

    // Photo upload
    uploadButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#7C3AED',
        borderStyle: 'dashed', backgroundColor: 'rgba(249, 250, 251, 0.3)', gap: 8, marginTop: 12,
    },
    uploadButtonText: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    imageContainer: {
        width: 60, height: 60, borderRadius: 10, backgroundColor: 'rgba(243, 244, 246, 0.5)',
        justifyContent: 'center', alignItems: 'center', position: 'relative',
    },
    removeImageButton: { position: 'absolute', top: -6, right: -6, zIndex: 1 },
    imageLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600' },

    // Footer
    footer: {
        backgroundColor: 'transparent',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    footerButtons: { flexDirection: 'row', gap: 12 },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12,
        backgroundColor: 'rgba(243, 244, 246, 0.8)', gap: 6,
    },
    backBtnText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
    nextBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    btnDisabled: { opacity: 0.6 },
    gradientBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 8,
    },
    nextBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
    offlineWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(254, 243, 199, 0.8)',
        padding: 12,
        marginHorizontal: 20,
        borderRadius: 12,
        marginTop: 10,
        gap: 8,
    },
    offlineText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
        flex: 1,
    },
    uploadProgressCard: {
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(229, 231, 235, 0.5)',
    },
    uploadStatusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    uploadProgressBar: {
        height: 6,
        backgroundColor: 'rgba(229, 231, 235, 0.5)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    uploadProgressFillColor: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    uploadProgressTextValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'right',
    },
});
