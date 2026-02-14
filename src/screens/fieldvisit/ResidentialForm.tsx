import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlassPanel from '../../components/GlassPanel';

interface ResidentialFormProps {
    formData: any;
    updateField: (field: string, value: any) => void;
    toggleArrayField: (field: string, value: string) => void;
}

export function ResidentialForm({ formData, updateField, toggleArrayField }: ResidentialFormProps) {

    const Checkbox = ({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) => (
        <Pressable style={styles.checkboxRow} onPress={onPress}>
            <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                {checked && <MaterialCommunityIcons name="check" size={14} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>{label}</Text>
        </Pressable>
    );

    const RadioButton = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
        <Pressable style={styles.radioRow} onPress={onPress}>
            <View style={[styles.radio, selected && styles.radioActive]}>
                {selected && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{label}</Text>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Pressable onPress={() => updateField('propertyType', '')} style={styles.changeTypeBtn}>
                    <MaterialCommunityIcons name="cog" size={16} color="#7C3AED" />
                    <Text style={styles.changeTypeText}>Change Type</Text>
                </Pressable>
                <Text style={styles.formTitle}>Residential Property Form</Text>
            </View>

            {/* Basic Info */}
            <GlassPanel style={styles.card}>
                <View style={styles.row}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Date</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9CA3AF"
                            value={formData.dateOfVisit}
                            onChangeText={(v) => updateField('dateOfVisit', v)}
                        />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit mobile"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                            value={formData.mobileNumber}
                            onChangeText={(v) => updateField('mobileNumber', v)}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contact person name"
                        placeholderTextColor="#9CA3AF"
                        value={formData.contactPersonName}
                        onChangeText={(v) => updateField('contactPersonName', v)}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Full site address"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        value={formData.siteAddress}
                        onChangeText={(v) => updateField('siteAddress', v)}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>City</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter city"
                            placeholderTextColor="#9CA3AF"
                            value={formData.industryType} // Using industryType for city in regular form too
                            onChangeText={(v) => updateField('industryType', v)}
                        />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                        <Text style={styles.label}>Water Source</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Select source"
                            placeholderTextColor="#9CA3AF"
                            value={formData.waterSource.join(', ')}
                            onFocus={() => { }} // Could add a picker here
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Pipe Size</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 1 inch"
                            placeholderTextColor="#9CA3AF"
                            value={formData.pipeLineSize}
                            onChangeText={(v) => updateField('pipeLineSize', v)}
                        />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                        <Text style={styles.label}>Tank Capacity</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 1000L"
                            placeholderTextColor="#9CA3AF"
                            value={formData.tankCapacity}
                            onChangeText={(v) => updateField('tankCapacity', v)}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>PPM</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="PPM value"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={formData.waterHardnessPPM}
                            onChangeText={(v) => updateField('waterHardnessPPM', v)}
                        />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                        <Text style={styles.label}>TDS</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="TDS value"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={formData.waterTDS}
                            onChangeText={(v) => updateField('waterTDS', v)}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Remarks</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Additional notes or observation"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        value={formData.customerRemarks}
                        onChangeText={(v) => updateField('customerRemarks', v)}
                    />
                </View>
            </GlassPanel>

            {/* Issues Sections */}
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Water Quality Issues</Text>
                    <Checkbox label="White marks or scaling on taps/tiles?" checked={formData.waterQualityIssues.includes('Scaling')} onPress={() => toggleArrayField('waterQualityIssues', 'Scaling')} />
                    <Checkbox label="Sticky or rough skin after bathing?" checked={formData.waterQualityIssues.includes('Skin')} onPress={() => toggleArrayField('waterQualityIssues', 'Skin')} />
                    <Checkbox label="Scale build-up in appliances?" checked={formData.waterQualityIssues.includes('Appliances')} onPress={() => toggleArrayField('waterQualityIssues', 'Appliances')} />
                    <Checkbox label="Salty or metallic taste in water?" checked={formData.waterQualityIssues.includes('Taste')} onPress={() => toggleArrayField('waterQualityIssues', 'Taste')} />
                    <Checkbox label="Soap or shampoo doesn't lather?" checked={formData.waterQualityIssues.includes('Lather')} onPress={() => toggleArrayField('waterQualityIssues', 'Lather')} />

                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Cleaning & Laundry Concerns</Text>
                    <Checkbox label="Clothes stiff or dull after washing?" checked={formData.cleaningConcerns.includes('Clothes')} onPress={() => toggleArrayField('cleaningConcerns', 'Clothes')} />
                    <Checkbox label="Using more detergent than usual?" checked={formData.cleaningConcerns.includes('Detergent')} onPress={() => toggleArrayField('cleaningConcerns', 'Detergent')} />
                    <Checkbox label="White spots on utensils?" checked={formData.cleaningConcerns.includes('Utensils')} onPress={() => toggleArrayField('cleaningConcerns', 'Utensils')} />
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                    <Text style={styles.sectionTitle}>Appliance & Plumbing Issues</Text>
                    <Checkbox label="Appliances repaired due to scale?" checked={formData.applianceIssues.includes('Repaired')} onPress={() => toggleArrayField('applianceIssues', 'Repaired')} />
                    <Checkbox label="Clogged pipes or low pressure?" checked={formData.applianceIssues.includes('Clogged')} onPress={() => toggleArrayField('applianceIssues', 'Clogged')} />
                    <Checkbox label="Taps or showerheads need cleaning?" checked={formData.applianceIssues.includes('Cleaning')} onPress={() => toggleArrayField('applianceIssues', 'Cleaning')} />

                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Health & Personal Care</Text>
                    <Checkbox label="Dry or itchy skin?" checked={formData.healthConcerns.includes('DrySkin')} onPress={() => toggleArrayField('healthConcerns', 'DrySkin')} />
                    <Checkbox label="Hair fall or dry hair?" checked={formData.healthConcerns.includes('HairFall')} onPress={() => toggleArrayField('healthConcerns', 'HairFall')} />
                    <Checkbox label="Skin conditions worsen?" checked={formData.healthConcerns.includes('SkinWorse')} onPress={() => toggleArrayField('healthConcerns', 'SkinWorse')} />
                </View>
            </View>

            {/* Current Water Treatment */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Current Water Treatment</Text>
            <GlassPanel style={styles.card}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Do you use a water purifier?</Text>
                    <View style={styles.radioGroup}>
                        <RadioButton label="Yes" selected={formData.hasWaterPurifier} onPress={() => updateField('hasWaterPurifier', true)} />
                        <RadioButton label="No" selected={!formData.hasWaterPurifier} onPress={() => updateField('hasWaterPurifier', false)} />
                    </View>
                </View>
                {formData.hasWaterPurifier && (
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>If yes, brand/</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Specify brand"
                            value={formData.waterPurifierBrand}
                            onChangeText={(v) => updateField('waterPurifierBrand', v)}
                        />
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Used a water softener before?</Text>
                    <View style={styles.radioGroup}>
                        <RadioButton label="Yes" selected={formData.hasUsedSoftener} onPress={() => updateField('hasUsedSoftener', true)} />
                        <RadioButton label="No" selected={!formData.hasUsedSoftener} onPress={() => updateField('hasUsedSoftener', false)} />
                    </View>
                </View>
            </GlassPanel>

            {/* Signature Placeholder */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureText}>Customer signature</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    changeTypeBtn: {
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
    changeTypeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#7C3AED',
    },
    card: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    inputContainer: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(243, 244, 246, 0.3)',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    input: {
        fontSize: 15,
        color: '#1A1A1A',
        paddingVertical: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 8,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    checkboxLabel: {
        fontSize: 12,
        color: '#4B5563',
        flexShrink: 1,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 4,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: '#7C3AED',
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#7C3AED',
    },
    radioLabel: {
        fontSize: 13,
        color: '#4B5563',
    },
    signatureSection: {
        marginTop: 40,
        alignItems: 'center',
    },
    signatureLine: {
        width: 200,
        height: 1,
        backgroundColor: '#374151',
    },
    signatureText: {
        marginTop: 8,
        fontSize: 12,
        fontStyle: 'italic',
        color: '#6B7280',
    },
});
