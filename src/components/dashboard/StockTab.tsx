import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';
import { StockService } from '../../services/StockService';

const normalizeRegion = (name: string) => {
    if (!name) return '';
    const trimmed = name.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

interface Stock {
    id: string;
    region: string;
    modelName: string;
    quantity: number;
    updatedAt: string;
}

interface StockTabProps {
    allStock: Stock[];
    onUpdate: () => void;
    scrollViewRef: React.RefObject<ScrollView | null>;
    officialRegions: string[];
    productModels: string[];
}

export const StockTab = React.memo(({
    allStock,
    onUpdate,
    scrollViewRef,
    officialRegions,
    productModels
}: StockTabProps) => {
    const regionsList = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune'];
    const [selectedRegion, setSelectedRegion] = useState(regionsList[0]);

    const [modelName, setModelName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [updating, setUpdating] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const handleUpdate = async () => {
        if (!modelName || !quantity) {
            alert('Please enter model name and quantity');
            return;
        }
        setUpdating(true);
        try {
            await StockService.updateStock(selectedRegion, modelName, parseInt(quantity));
            setModelName('');
            setQuantity('');
            onUpdate();
            alert('Stock updated successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to update stock');
        } finally {
            setUpdating(false);
        }
    };

    const regionalStock = allStock.filter(s => normalizeRegion(s.region) === selectedRegion);

    return (
        <View style={{ paddingBottom: 20 }}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Stock Management</Text>
            </View>

            <GlassPanel style={{ padding: 20, marginBottom: 24 }}>
                <Text style={[styles.listTitle, { marginBottom: 16 }]}>Update Stock Level</Text>

                <Text style={styles.listSub}>Select Region</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                    {regionsList.map(r => (
                        <Pressable
                            key={r}
                            onPress={() => setSelectedRegion(r)}
                            style={[
                                styles.chip,
                                selectedRegion === r && styles.chipActive,
                                { marginRight: 8 }
                            ]}
                        >
                            <Text style={[styles.chipText, selectedRegion === r && styles.chipTextActive]}>{r}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <View style={{ gap: 12, marginTop: 8 }}>
                    <View>
                        <Text style={styles.listSub}>Model Name</Text>
                        <Pressable onPress={() => setShowModelDropdown(true)}>
                            <GlassPanel style={{ padding: 12, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.6)' }} intensity={10}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="tag-outline" size={20} color={THEME.colors.textSecondary} />
                                        <Text style={{ marginLeft: 8, color: modelName ? THEME.colors.text : THEME.colors.textSecondary }}>
                                            {modelName || 'Select Model'}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={THEME.colors.textSecondary} />
                                </View>
                            </GlassPanel>
                        </Pressable>
                    </View>

                    <View>
                        <Text style={styles.listSub}>Quantity</Text>
                        <GlassPanel style={{ padding: 12, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.6)' }} intensity={10}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        style={{ color: THEME.colors.text, fontSize: 14, padding: 0 }}
                                        placeholder="Enter Quantity"
                                        placeholderTextColor={THEME.colors.textSecondary}
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                        </GlassPanel>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                        <Pressable
                            onPress={handleUpdate}
                            disabled={updating}
                            style={({ pressed }) => [
                                {
                                    backgroundColor: THEME.colors.secondary,
                                    padding: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    flex: 1,
                                    opacity: (pressed || updating) ? 0.8 : 1
                                }
                            ]}
                        >
                            {updating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: 'white', fontFamily: THEME.fonts.bold }}>Update Stock</Text>
                            )}
                        </Pressable>

                        {(modelName || quantity) && (
                            <Pressable
                                onPress={() => {
                                    setModelName('');
                                    setQuantity('');
                                }}
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: '#FED7D7',
                                        width: 54,
                                        borderRadius: 12,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        opacity: pressed ? 0.7 : 1
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons name="refresh" size={24} color="#C53030" />
                            </Pressable>
                        )}
                    </View>
                </View>
            </GlassPanel>

            <Modal
                visible={showModelDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModelDropdown(false)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => setShowModelDropdown(false)}
                >
                    <View style={{ width: '85%', maxHeight: '60%', backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
                        <Text style={[styles.listTitle, { marginBottom: 16, textAlign: 'center' }]}>Select Model</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {productModels.map((model, index) => (
                                <Pressable
                                    key={index}
                                    style={({ pressed }) => [
                                        {
                                            paddingVertical: 12,
                                            paddingHorizontal: 16,
                                            borderBottomWidth: index === productModels.length - 1 ? 0 : 1,
                                            borderBottomColor: '#F3F4F6',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        },
                                        pressed && { backgroundColor: '#F9FAFB' }
                                    ]}
                                    onPress={() => {
                                        setModelName(model);
                                        setShowModelDropdown(false);
                                    }}
                                >
                                    <Text style={{ fontSize: 16, color: THEME.colors.text, fontWeight: modelName === model ? '700' : '400' }}>
                                        {model}
                                    </Text>
                                    {modelName === model && (
                                        <MaterialCommunityIcons name="check" size={20} color={THEME.colors.primary} />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Current Stock in {selectedRegion}</Text>
            </View>

            {regionalStock.length === 0 ? (
                <GlassPanel style={styles.emptyState}>
                    <MaterialCommunityIcons name="package-variant-closed" size={48} color={THEME.colors.textSecondary} />
                    <Text style={styles.emptyText}>No stock data for this region</Text>
                </GlassPanel>
            ) : (
                <GlassPanel style={{ padding: 8 }}>
                    {regionalStock.map((s, index) => (
                        <View
                            key={s.id}
                            style={[
                                styles.listItem,
                                index === regionalStock.length - 1 && { borderBottomWidth: 0 }
                            ]}
                        >
                            <View style={[styles.listIcon, { backgroundColor: THEME.colors.mintLight }]}>
                                <MaterialCommunityIcons name="package-variant" size={24} color={THEME.colors.secondary} />
                            </View>
                            <View style={[styles.listContent, { marginRight: 12 }]}>
                                <Text style={styles.listTitle} numberOfLines={1}>{s.modelName}</Text>
                                <Text style={styles.listSub} numberOfLines={1}>Last updated: {new Date(s.updatedAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={[styles.listRight, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.mainStatValue, { color: THEME.colors.text, fontSize: 24 }]}>{s.quantity}</Text>
                                    <Text style={styles.listSub}>Units</Text>
                                </View>
                                <Pressable
                                    onPress={() => {
                                        setModelName(s.modelName);
                                        setQuantity(s.quantity.toString());
                                        scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                                    }}
                                    style={({ pressed }) => [
                                        { padding: 8, borderRadius: 10, backgroundColor: '#F1F5F9' },
                                        pressed && { opacity: 0.7 }
                                    ]}
                                >
                                    <MaterialCommunityIcons name="pencil-outline" size={18} color={THEME.colors.primary} />
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </GlassPanel>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: THEME.colors.text },
    listTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.text },
    listSub: { fontSize: 12, color: THEME.colors.textSecondary },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#F1F5F9' },
    chipActive: { backgroundColor: THEME.colors.secondary, borderColor: THEME.colors.secondary },
    chipText: { fontSize: 13, fontWeight: '700', color: THEME.colors.textSecondary },
    chipTextActive: { color: 'white' },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    listIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    listContent: { flex: 1 },
    mainStatValue: { fontSize: 32, fontWeight: '800', color: 'white' },
    emptyState: { padding: 40, alignItems: 'center', borderRadius: 24, marginVertical: 20 },
    emptyText: { fontSize: 16, color: THEME.colors.textSecondary, marginTop: 12, textAlign: 'center' },
    listRight: { alignItems: 'flex-end' },
});
