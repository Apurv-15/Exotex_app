import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../config/supabase';
import { Storage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo.jpeg';

const TEMPLATE_STORE_KEY = 'WARRANTY_TEMPLATE_CONFIG';

export default function TemplateManagement() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<{ url: string; name: string } | null>(null);

    useEffect(() => {
        loadTemplateConfig();
    }, []);

    const loadTemplateConfig = async () => {
        setLoading(true);
        try {
            // Try to get from Supabase first if a settings table exists
            // For now, fallback to local storage
            const stored = await Storage.getItem(TEMPLATE_STORE_KEY);
            if (stored) {
                setCurrentTemplate(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load template config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickTemplate = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            uploadTemplate(asset.uri, asset.name);
        } catch (error) {
            console.error('Picker error:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const uploadTemplate = async (uri: string, fileName: string) => {
        setUploading(true);
        try {
            // Directly upload file to Supabase (skip getBucket check - it requires admin permissions)
            const response = await fetch(uri);
            const blob = await response.blob();

            const filePath = `templates/warranty_card_v1_${Date.now()}.docx`;
            const { data, error } = await supabase.storage
                .from('warranty-templates')
                .upload(filePath, blob, {
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    upsert: true
                });

            if (error) {
                console.error('Upload error:', error);
                throw new Error(`Upload failed: ${error.message}`);
            }

            // 3. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('warranty-templates')
                .getPublicUrl(filePath);

            const config = { url: publicUrl, name: fileName };
            await Storage.setItem(TEMPLATE_STORE_KEY, JSON.stringify(config));
            setCurrentTemplate(config);

            if (Platform.OS === 'web') {
                window.alert('✅ Warranty template uploaded successfully!');
            } else {
                Alert.alert('Success', 'Warranty template uploaded successfully!');
            }
        } catch (error: any) {
            console.error('Upload error:', error);

            const errorMsg = error.message || 'Could not upload template';

            if (Platform.OS === 'web') {
                window.alert(`❌ Upload Failed\n\n${errorMsg}\n\nPlease check SUPABASE_STORAGE_SETUP.md for setup instructions.`);
            } else {
                Alert.alert('Upload Failed', errorMsg);
            }
        } finally {
            setUploading(false);
        }
    };

    const useLocalTemplate = async (uri: string, fileName: string) => {
        try {
            // Store the local template URI for development/testing
            const config = {
                url: uri,
                name: fileName,
                isLocal: true
            };
            await Storage.setItem(TEMPLATE_STORE_KEY, JSON.stringify(config));
            setCurrentTemplate(config);

            if (Platform.OS === 'web') {
                window.alert('✅ Local template configured!\n\nNote: This is for development only. Set up Supabase storage for production.');
            } else {
                Alert.alert('Success', 'Local template configured for development use.');
            }
        } catch (error) {
            console.error('Failed to set local template:', error);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.logoWrapper}>
                        <Image source={LogoImage} style={styles.companyLogo} resizeMode="contain" />
                    </View>
                    <View>
                        <Text style={styles.title}>Template Management</Text>
                        <Text style={styles.subtitle}>Upload and manage your .docx warranty templates</Text>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="file-word-box" size={24} color="#2B579A" />
                    <Text style={styles.cardTitle}>Current Template</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="small" color="#7C3AED" style={{ margin: 20 }} />
                ) : currentTemplate ? (
                    <View style={styles.templateInfo}>
                        <View style={styles.templateIcon}>
                            <MaterialCommunityIcons name="file-check" size={32} color="#10B981" />
                        </View>
                        <View style={styles.templateDetails}>
                            <Text style={styles.templateName}>{currentTemplate.name}</Text>
                            <Text style={styles.templateStatus}>Status: Active</Text>
                        </View>
                        <Pressable
                            onPress={() => setCurrentTemplate(null)}
                            style={styles.removeBtn}
                        >
                            <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.emptyTemplate}>
                        <Text style={styles.emptyText}>No custom template uploaded.</Text>
                        <Text style={styles.emptySub}>The app will use the default HTML template.</Text>
                    </View>
                )}
            </View>


            <View style={styles.uploadSection}>
                <Pressable
                    style={({ pressed }) => [
                        styles.uploadBtn,
                        pressed && { transform: [{ scale: 0.98 }] },
                        uploading && { opacity: 0.7 }
                    ]}
                    onPress={handlePickTemplate}
                    disabled={uploading}
                >
                    <LinearGradient
                        colors={['#7C3AED', '#5B21B6']}
                        style={styles.gradientBtn}
                    >
                        {uploading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="upload" size={24} color="white" />
                                <Text style={styles.uploadBtnText}>Upload New Template</Text>
                            </>
                        )}
                    </LinearGradient>
                </Pressable>
                <Text style={styles.hint}>Supported format: .docx only</Text>

                {/* OR Divider */}
                <View style={styles.orDivider}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.orLine} />
                </View>

                {/* Use Default Template Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.defaultBtn,
                        pressed && { transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={async () => {
                        const defaultTemplate = require('../../assets/Warranty_pdf_template/WARRANTY CARD.docx');
                        await useLocalTemplate(defaultTemplate, 'WARRANTY CARD.docx (Default)');
                    }}
                >
                    <MaterialCommunityIcons name="file-document" size={20} color="#7C3AED" />
                    <Text style={styles.defaultBtnText}>Use Default Template</Text>
                </Pressable>
                <Text style={styles.hint}>Uses the bundled WARRANTY CARD.docx file</Text>
            </View>


            <View style={styles.instructionCard}>
                <Text style={styles.instructionTitle}>📝 How to create a template?</Text>
                <Text style={styles.instructionText}>
                    Your .docx template can have 5-6 pages with static content (user manual, terms, etc.) and one editable warranty card page.
                    {'\n\n'}
                    Use placeholders in single curly braces on the warranty card page:
                </Text>
                <View style={styles.placeholderGrid}>
                    <PlaceholderItem label="Customer Name" tag="{customerName}" />
                    <PlaceholderItem label="Bill/Warranty ID" tag="{warrantyId}" />
                    <PlaceholderItem label="Phone Number" tag="{phone}" />
                    <PlaceholderItem label="Address" tag="{address}" />
                    <PlaceholderItem label="City" tag="{city}" />
                    <PlaceholderItem label="Sale Date" tag="{saleDate}" />
                    <PlaceholderItem label="Product Model" tag="{productModel}" />
                    <PlaceholderItem label="Serial Number" tag="{serialNumber}" />
                </View>
                <View style={styles.tipBox}>
                    <MaterialCommunityIcons name="information" size={18} color="#7C3AED" />
                    <Text style={styles.tipText}>
                        For detailed instructions, see{' '}
                        <Text style={styles.linkText}>WORD_TEMPLATE_SETUP.md</Text>
                        {'\n'}Static pages without placeholders will remain unchanged.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

function PlaceholderItem({ label, tag }: { label: string; tag: string }) {
    return (
        <View style={styles.placeholderItem}>
            <Text style={styles.placeholderLabel}>{label}</Text>
            <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { padding: 20 },
    header: { marginBottom: 32 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoWrapper: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    companyLogo: {
        width: 35,
        height: 35,
    },
    title: { fontSize: 24, fontWeight: '800', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 24 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
    templateInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 16 },
    templateIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    templateDetails: { flex: 1 },
    templateName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    templateStatus: { fontSize: 13, color: '#10B981', marginTop: 2, fontWeight: '500' },
    removeBtn: { padding: 8 },
    emptyTemplate: { padding: 32, alignItems: 'center' },
    emptyText: { color: '#6B7280', fontSize: 15, fontWeight: '500' },
    emptySub: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
    uploadSection: { alignItems: 'center', marginBottom: 32 },
    uploadBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
    uploadBtnText: { color: 'white', fontSize: 17, fontWeight: '700' },
    hint: { color: '#9CA3AF', fontSize: 12, marginTop: 10, textAlign: 'center' },
    orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, width: '100%' },
    orLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    orText: { marginHorizontal: 16, color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
    defaultBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', gap: 8 },
    defaultBtnText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
    instructionCard: { backgroundColor: '#EFF6FF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#DBEAFE' },
    instructionTitle: { fontSize: 17, fontWeight: '700', color: '#1E40AF', marginBottom: 12 },
    instructionText: { fontSize: 14, color: '#3B82F6', marginBottom: 16, lineHeight: 20 },
    placeholderGrid: { gap: 12 },
    placeholderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    placeholderLabel: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    tagBadge: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#DBEAFE' },
    tagText: { fontSize: 12, color: '#7C3AED', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    tipBox: { flexDirection: 'row', gap: 10, marginTop: 16, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    tipText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 18 },
    linkText: { fontWeight: '700', color: '#7C3AED' },
});
