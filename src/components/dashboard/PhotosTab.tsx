import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Image, Modal, ActivityIndicator, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get('window').width;

interface Sale {
    id: string;
    customerName: string;
    productModel: string;
    saleDate: string;
    imageUrls?: string[];
    warrantyId?: string;
    invoiceNumber?: string;
}

interface PhotosTabProps {
    allSales: Sale[];
    selectedPhotos: string[];
    setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
    isSelectionMode: boolean;
    setIsSelectionMode: React.Dispatch<React.SetStateAction<boolean>>;
    sortOrder: 'newest' | 'oldest';
    setSortOrder: (order: 'newest' | 'oldest') => void;
}

const PhotoItem = ({ url, itemSize, isSelected, isSelectionMode, onPress, onLongPress }: any) => (
    <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.photoItem, { width: itemSize, height: itemSize }]}
    >
        <Image source={{ uri: url }} style={styles.photo} />
        {isSelectionMode && (
            <View style={[styles.photoOverlay, isSelected && styles.photoSelected]}>
                <MaterialCommunityIcons
                    name={isSelected ? "check-circle" : "circle-outline"}
                    size={24}
                    color={isSelected ? THEME.colors.secondary : 'rgba(255,255,255,0.7)'}
                />
            </View>
        )}
    </Pressable>
);

const SortControls = ({ sortOrder, setSortOrder }: { sortOrder: string; setSortOrder: (order: any) => void }) => (
    <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.tabSwitcherSmall}>
            <Pressable
                onPress={() => setSortOrder('newest')}
                style={[styles.smallTab, sortOrder === 'newest' && styles.smallTabActive]}
            >
                <Text style={[styles.smallTabText, sortOrder === 'newest' && styles.smallTabTextActive]}>Newest</Text>
            </Pressable>
            <Pressable
                onPress={() => setSortOrder('oldest')}
                style={[styles.smallTab, sortOrder === 'oldest' && styles.smallTabActive]}
            >
                <Text style={[styles.smallTabText, sortOrder === 'oldest' && styles.smallTabTextActive]}>Oldest</Text>
            </Pressable>
        </View>
    </View>
);

export const PhotosTab = React.memo(({
    allSales,
    selectedPhotos,
    setSelectedPhotos,
    isSelectionMode,
    setIsSelectionMode,
    sortOrder,
    setSortOrder
}: PhotosTabProps) => {
    const [viewingSale, setViewingSale] = useState<Sale | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    const GAP = 4;
    const COLUMN_COUNT = screenWidth > 768 ? 4 : 2;
    const itemSize = (screenWidth - 40 - (GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

    const salesWithPhotos = useMemo(() => {
        return allSales
            .filter(s => s.imageUrls && s.imageUrls.length > 0)
            .sort((a, b) => {
                const dateA = new Date(a.saleDate).getTime();
                const dateB = new Date(b.saleDate).getTime();
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
    }, [allSales, sortOrder]);

    const toggleSelection = (url: string) => {
        if (selectedPhotos.includes(url)) {
            setSelectedPhotos(prev => prev.filter(p => p !== url));
        } else {
            setSelectedPhotos(prev => [...prev, url]);
        }
    };

    const handleLongPress = (url: string) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            toggleSelection(url);
        }
    };

    const handlePress = (url: string) => {
        if (isSelectionMode) {
            toggleSelection(url);
        } else {
            setPreviewPhoto(url);
        }
    };

    const handleDownloadSingle = async (url: string) => {
        setIsDownloading(true);
        try {
            const filename = url.split('/').pop()?.split('?')[0] || `photo_${Date.now()}.jpg`;
            const cacheDir = (FileSystem as any).cacheDirectory || '';
            const fileUri = `${cacheDir}${filename}`;
            const downloadedFile = await FileSystem.downloadAsync(url, fileUri);

            if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadedFile.uri);
            } else {
                alert('Download started for: ' + filename);
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download photo. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (viewingSale) {
        const salePhotos = (viewingSale.imageUrls || []).filter(url =>
            url && (url.startsWith('http') || url.startsWith('https'))
        );

        return (
            <View style={{ paddingBottom: 100 }}>
                <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />
                <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <Pressable
                        onPress={() => {
                            setViewingSale(null);
                            setIsSelectionMode(false);
                            setSelectedPhotos([]);
                        }}
                        style={({ pressed }) => [
                            { flexDirection: 'row', alignItems: 'center', gap: 8 },
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.colors.text} />
                        <Text style={styles.sectionTitle}>Back to List</Text>
                    </Pressable>
                    <Pressable onPress={() => {
                        if (isSelectionMode) {
                            setSelectedPhotos([]);
                            setIsSelectionMode(false);
                        } else {
                            setIsSelectionMode(true);
                        }
                    }}>
                        <Text style={styles.seeAllText}>{isSelectionMode ? 'Cancel' : 'Select'}</Text>
                    </Pressable>
                </View>

                <GlassPanel style={{ padding: 20, marginBottom: 20 }}>
                    <Text style={styles.listTitle}>{viewingSale.customerName}</Text>
                    <Text style={styles.listSub}>{viewingSale.productModel}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <View style={[styles.tag, { backgroundColor: THEME.colors.primary + '20' }]}>
                            <Text style={[styles.tagText, { color: THEME.colors.primary }]}>{viewingSale.warrantyId || viewingSale.invoiceNumber}</Text>
                        </View>
                        <Text style={styles.listDate}>{new Date(viewingSale.saleDate).toLocaleDateString()}</Text>
                    </View>
                </GlassPanel>

                <View style={[styles.photoGrid, { gap: GAP, flexDirection: 'row', flexWrap: 'wrap' }]}>
                    {salePhotos.map((url, index) => (
                        <PhotoItem
                            key={`${viewingSale.id}_${index}`}
                            url={url}
                            itemSize={itemSize}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedPhotos.includes(url)}
                            onPress={() => handlePress(url)}
                            onLongPress={() => handleLongPress(url)}
                        />
                    ))}
                </View>

                <Modal visible={!!previewPhoto} transparent={true} animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
                    <View style={styles.modalOverlay}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setPreviewPhoto(null)} />
                        <View style={styles.modalContent}>
                            <Image source={{ uri: previewPhoto || '' }} style={styles.fullImage} resizeMode="contain" />
                            <View style={styles.modalActions}>
                                <Pressable onPress={() => setPreviewPhoto(null)} style={styles.modalBtn}>
                                    <MaterialCommunityIcons name="close" size={24} color="white" />
                                </Pressable>
                                <Pressable
                                    onPress={() => previewPhoto && handleDownloadSingle(previewPhoto)}
                                    style={[styles.modalBtn, { backgroundColor: THEME.colors.secondary }]}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <MaterialCommunityIcons name="download" size={24} color="white" />
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <View style={{ paddingBottom: 100, flex: 1 }}>
            <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Warranty Gallery</Text>
            </View>

            {salesWithPhotos.length === 0 ? (
                <GlassPanel style={styles.emptyState}>
                    <MaterialCommunityIcons name="image-off-outline" size={48} color={THEME.colors.textSecondary} />
                    <Text style={styles.emptyText}>No registered warranties with photos</Text>
                </GlassPanel>
            ) : (
                <View style={{ gap: 12 }}>
                    {salesWithPhotos.map((sale) => (
                        <Pressable
                            key={sale.id}
                            onPress={() => setViewingSale(sale)}
                            style={({ pressed }) => [
                                styles.saleListItem,
                                pressed && { opacity: 0.7 }
                            ]}
                        >
                            <GlassPanel style={styles.saleGlass}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={styles.photoCountStack}>
                                        <Image source={{ uri: sale.imageUrls?.[0] }} style={styles.stackImage} />
                                        <View style={styles.photoCountBadge}>
                                            <Text style={styles.badgeText}>{sale.imageUrls?.length}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <Text style={styles.listTitle} numberOfLines={1}>{sale.customerName}</Text>
                                        <Text style={styles.listSub} numberOfLines={1}>{sale.productModel}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.colors.textSecondary} />
                                </View>
                            </GlassPanel>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: THEME.colors.text },
    sortContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    sortLabel: { fontSize: 13, fontWeight: '700', color: THEME.colors.textSecondary },
    tabSwitcherSmall: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 2 },
    smallTab: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
    smallTabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    smallTabText: { fontSize: 12, fontWeight: '600', color: THEME.colors.textSecondary },
    smallTabTextActive: { color: THEME.colors.secondary },
    seeAllText: { fontSize: 14, fontWeight: '700', color: THEME.colors.secondary },
    listTitle: { fontSize: 16, fontWeight: '700', color: THEME.colors.text },
    listSub: { fontSize: 13, color: THEME.colors.textSecondary },
    listDate: { fontSize: 12, color: THEME.colors.textSecondary },
    tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 10, fontWeight: '700' },
    photoGrid: { paddingHorizontal: 2 },
    photoItem: { borderRadius: 12, overflow: 'hidden' },
    photo: { width: '100%', height: '100%' },
    photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)', padding: 4, alignItems: 'flex-end' },
    photoSelected: { backgroundColor: 'rgba(124, 58, 237, 0.2)' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    modalContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '80%' },
    modalActions: { flexDirection: 'row', gap: 20, marginTop: 20 },
    modalBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    emptyState: { padding: 40, alignItems: 'center', borderRadius: 24, marginVertical: 20 },
    emptyText: { fontSize: 16, color: THEME.colors.textSecondary, marginTop: 12, textAlign: 'center' },
    saleListItem: { marginBottom: 12 },
    saleGlass: { padding: 12, borderRadius: 20 },
    photoCountStack: { width: 56, height: 56, position: 'relative' },
    stackImage: { width: '100%', height: '100%', borderRadius: 12 },
    photoCountBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: THEME.colors.secondary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
    badgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
});
