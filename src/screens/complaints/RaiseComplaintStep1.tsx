import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Keyboard, Alert, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SalesService, Sale } from '../../services/SalesService';
import { THEME } from '../../constants/theme';
import GlassPanel from '../../components/GlassPanel';
import MeshBackground from '../../components/MeshBackground';

const RaiseComplaintStep1 = () => {
    const navigation = useNavigation<any>();
    const [invoiceNo, setInvoiceNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [clientData, setClientData] = useState<Sale | null>(null);
    const [suggestions, setSuggestions] = useState<Sale[]>([]);

    const handleTextChange = async (text: string) => {
        setInvoiceNo(text);
        setClientData(null); // Reset detail view when typing

        if (text.length > 2) {
            const results = await SalesService.searchSales(text);
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectSuggestion = (sale: Sale) => {
        setInvoiceNo(sale.warrantyId || sale.invoiceNumber);
        setClientData(sale);
        setSuggestions([]);
        Keyboard.dismiss();
    };

    const handleSearch = async () => {
        if (!invoiceNo.trim()) return;

        Keyboard.dismiss();
        setLoading(true);
        setSuggestions([]);
        setClientData(null);

        try {
            const data = await SalesService.getSaleByInvoice(invoiceNo.trim());
            if (data) {
                setClientData(data);
            } else {
                Alert.alert('Not Found', 'No record found for this Invoice/Warranty ID.');
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Error', 'Something went wrong while searching.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <MeshBackground />

            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Raise Complaint</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>CLIENT COMPLAINT FORM</Text>
                <Text style={styles.subtitle}>Please enter the invoice number to auto-populate client details.</Text>

                <GlassPanel style={styles.searchCard}>
                    <Text style={styles.label}>Invoice No. / Warranty ID</Text>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Warranty ID (e.g. WAR-...)"
                            value={invoiceNo}
                            onChangeText={handleTextChange}
                            autoCapitalize="characters"
                        />
                        <Pressable
                            style={[styles.searchBtn, !invoiceNo.trim() && { opacity: 0.5 }]}
                            onPress={handleSearch}
                            disabled={loading || !invoiceNo.trim()}
                        >
                            {loading ? (
                                <ActivityIndicator color="black" size="small" />
                            ) : (
                                <MaterialCommunityIcons name="magnify" size={24} color="black" />
                            )}
                        </Pressable>
                    </View>

                    {/* Autocomplete Suggestions */}
                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsList}>
                            {suggestions.map((item) => (
                                <Pressable
                                    key={item.id}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectSuggestion(item)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.suggestionTitle} numberOfLines={1}>{item.warrantyId || item.invoiceNumber}</Text>
                                        <Text style={styles.suggestionSubtitle} numberOfLines={1} ellipsizeMode="tail">{item.customerName} - {item.productModel}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.colors.textSecondary} />
                                </Pressable>
                            ))}
                        </View>
                    )}
                </GlassPanel>

                {clientData && (
                    <GlassPanel style={styles.detailsCard}>
                        <Text style={styles.detailsHeader}>Client Details (Auto-Filled)</Text>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>• Full Name:</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{clientData.customerName}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>• Phone Number:</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{clientData.phone}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>• Email Address:</Text>
                            <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">{clientData.email || 'N/A'}</Text>
                        </View>

                        <Pressable
                            style={styles.nextBtn}
                            onPress={() => navigation.navigate('RaiseComplaintStep2', { clientData })}
                        >
                            <Text style={styles.nextBtnText}>Continue to Form</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="black" />
                        </Pressable>
                    </GlassPanel>
                )}
            </ScrollView>
        </View>
    );
};

export default RaiseComplaintStep1;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: THEME.fonts.bold,
        color: 'black',
        flex: 1,
        textAlign: 'center',
        marginRight: 60,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontFamily: THEME.fonts.black,
        color: 'black',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: 'black',
        textAlign: 'center',
        marginBottom: 40,
    },
    searchCard: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        zIndex: 10,
    },
    label: {
        fontSize: 13,
        fontFamily: THEME.fonts.bold,
        color: 'black',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        zIndex: 20,
    },
    input: {
        flex: 1,
        height: 52,
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    searchBtn: {
        width: 52,
        height: 52,
        backgroundColor: THEME.colors.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...THEME.shadows.small,
    },
    suggestionsList: {
        marginTop: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        overflow: 'hidden',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        backgroundColor: 'white',
    },
    suggestionTitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: 'black',
        marginBottom: 2,
    },
    suggestionSubtitle: {
        fontSize: 12,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.textSecondary,
    },
    detailsCard: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: THEME.colors.primary + '30',
        backgroundColor: 'rgba(255,255,255,0.5)',
        zIndex: 1,
    },
    detailsHeader: {
        fontSize: 16,
        fontFamily: THEME.fonts.bold,
        color: 'black',
        marginBottom: 15,
    },
    detailItem: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 8,
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: 'black',
    },
    detailValue: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: 'black',
        flex: 1,
    },
    nextBtn: {
        backgroundColor: THEME.colors.primary,
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
    },
    nextBtnText: {
        color: 'black',
        fontSize: 16,
        fontFamily: THEME.fonts.bold,
    },
});
