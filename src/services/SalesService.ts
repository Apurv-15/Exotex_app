import { supabase } from '../config/supabase';
import { Storage } from '../utils/storage';
import { Platform } from 'react-native';
import { OfflineQueueService } from './OfflineQueueService';
import { useSyncStore } from '../store/SyncStore';
import { SyncService } from './SyncService';
import { logger } from '../core/logging/Logger';


export interface Sale {
    id: string;
    customerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    date: string;
    invoiceNumber: string;
    waterTestingBefore: string;
    waterTestingAfter: string;
    executiveName: string;
    designation: string;
    plumberName: string;
    productModel: string;
    serialNumber: string;
    productDetailsConfirmed: boolean;
    saleDate: string;
    branchId: string;
    warrantyId: string;
    status: 'pending' | 'approved' | 'rejected';
    imageUrls?: string[]; // URLs to images in Supabase Storage
    paymentReceived: boolean;
    warrantyGenerated: boolean;
    region?: string;
}

const STORAGE_KEY = 'WARRANTY_PRO_SALES';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key && url !== '' && key !== '');
};

// Helper to convert DB row to Sale object
const dbToSale = (row: any): Sale => ({
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email || '',
    address: row.address,
    city: row.city,
    date: row.date,
    invoiceNumber: row.invoice_number || row.warranty_id,
    waterTestingBefore: row.water_testing_before || '',
    waterTestingAfter: row.water_testing_after || '',
    executiveName: row.executive_name || '',
    designation: row.designation || '',
    plumberName: row.plumber_name || '',
    productModel: row.product_model,
    serialNumber: row.serial_number,
    productDetailsConfirmed: row.product_details_confirmed,
    saleDate: row.sale_date,
    branchId: row.branch_id,
    warrantyId: row.warranty_id,
    status: row.status,
    imageUrls: row.image_urls || [],
    paymentReceived: row.payment_received || false,
    warrantyGenerated: row.warranty_generated || false,
    region: row.region || '',
});

// Helper to convert Sale object to DB row
const saleToDb = (sale: Partial<Sale>) => ({
    customer_name: sale.customerName,
    phone: sale.phone,
    email: sale.email || null,
    address: sale.address,
    city: sale.city,
    date: sale.date,
    invoice_number: sale.invoiceNumber,
    water_testing_before: sale.waterTestingBefore || null,
    water_testing_after: sale.waterTestingAfter || null,
    executive_name: sale.executiveName || null,
    designation: sale.designation || null,
    plumber_name: sale.plumberName || null,
    product_model: sale.productModel,
    serial_number: sale.serialNumber,
    product_details_confirmed: sale.productDetailsConfirmed,
    sale_date: sale.saleDate,
    branch_id: sale.branchId,
    warranty_id: sale.warrantyId,
    status: sale.status,
    image_urls: sale.imageUrls || [],
    payment_received: sale.paymentReceived || false,
    warranty_generated: sale.warrantyGenerated || false,
    region: sale.region || null,
});

export const SalesService = {
    // Upload image to Supabase Storage with local fallback
    uploadImage: async (
        uri: string,
        warrantyId: string,
        index: number,
        onProgress?: (progress: number) => void
    ): Promise<string> => {
        if (!uri) return '';

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            logger.warn('SalesService', 'Supabase not configured, falling back to local storage', { warrantyId, index });
            return await SalesService.saveImageLocally(uri, warrantyId, index);
        }

        try {
            // Check network connectivity
            const NetInfo = require('@react-native-community/netinfo');
            const netState = await NetInfo.fetch();

            if (!netState.isConnected) {
                logger.warn('SalesService', 'No network connection detected, saving image locally', { warrantyId, index });
                return await SalesService.saveImageLocally(uri, warrantyId, index);
            }

            onProgress?.(10); // Starting upload

            const fileName = `${warrantyId}_${index}_${Date.now()}.jpg`;
            const filePath = `sales-images/${fileName}`;

            // ---------------------------------------------------------
            // ROBUST FILE READING FOR WEB/ANDROID/IOS
            // ---------------------------------------------------------
            let fileBody: any;
            
            if (Platform.OS === 'web') {
                // On web, fetch works perfectly for both blob: and data: URLs
                const response = await fetch(uri);
                fileBody = await response.blob();
                onProgress?.(30);
            } else {
                try {
                    // Use legacy API for expo-file-system v54+
                    const FileSystem = require('expo-file-system/legacy');
                    const encoding = FileSystem.EncodingType?.Base64 || 'base64';

                    // Read file as Base64
                    const base64 = await FileSystem.readAsStringAsync(uri, {
                        encoding: encoding,
                    });

                    onProgress?.(30); // File read complete
                    const { Buffer } = require('buffer');
                    fileBody = Buffer.from(base64, 'base64');
                } catch (readError: any) {
                    logger.warn('SalesService', 'FileSystem legacy read failed, trying fetch fallback', { error: readError.message });
                    const response = await fetch(uri);
                    fileBody = await response.blob();
                }
            }

            onProgress?.(50); // Uploading to server

            const { error: uploadError } = await supabase.storage
                .from('warranty-images')
                .upload(filePath, fileBody, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) {
                logger.error('SalesService', 'Supabase image bucket upload failed', { uploadError, filePath });
                return await SalesService.saveImageLocally(uri, warrantyId, index);
            }

            onProgress?.(80); // Upload complete, getting URL

            const { data: urlData } = supabase.storage
                .from('warranty-images')
                .getPublicUrl(filePath);

            onProgress?.(100); // Complete

            return urlData.publicUrl;
        } catch (error: any) {
            console.error('Image upload error:', error);

            // Fallback to local storage on any error
            console.warn('Error during upload, saving locally');
            return await SalesService.saveImageLocally(uri, warrantyId, index);
        }
    },

    // Save image locally as fallback
    saveImageLocally: async (uri: string, warrantyId: string, index: number): Promise<string> => {
        if (Platform.OS === 'web') {
            return uri; // Just return original URI on web
        }
        try {
            // Use legacy API for expo-file-system v54+
            const FileSystem = require('expo-file-system/legacy');
            const fileName = `${warrantyId}_${index}_${Date.now()}.jpg`;
            const localDir = `${FileSystem.documentDirectory}warranty-images/`;

            // Create directory if it doesn't exist
            // Note: makeDirectoryAsync with intermediates: true is safe to call even if dir exists
            try {
                await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
            } catch (dirError) {
                // Ignore error if directory already exists, otherwise log it
                // This bypasses the need for deprecated getInfoAsync check
            }

            const localPath = `${localDir}${fileName}`;

            // Copy image to local storage
            await FileSystem.copyAsync({
                from: uri,
                to: localPath,
            });

            logger.info('SalesService', 'Image saved locally', { localPath });
            return localPath;
        } catch (error: any) {
            logger.error('SalesService', 'Local save error', { error: error.message });
            // If local save fails, return original URI as last resort
            return uri;
        }
    },

    // Get sales stats (counts)
    getSalesStats: async (branchId?: string): Promise<{ total: number; pending: number; approved: number }> => {
        if (isSupabaseConfigured()) {
            try {
                let query = supabase.from('sales').select('*', { count: 'exact', head: true });
                let pQuery = supabase.from('sales').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                let aQuery = supabase.from('sales').select('*', { count: 'exact', head: true }).eq('status', 'approved');
                
                if (branchId) {
                    const trimmedBranch = branchId.trim();
                    query = query.ilike('branch_id', trimmedBranch);
                    pQuery = pQuery.ilike('branch_id', trimmedBranch);
                    aQuery = aQuery.ilike('branch_id', trimmedBranch);
                }
                
                const { count: total } = await query;
                const { count: pending } = await pQuery;
                const { count: approved } = await aQuery;

                return {
                    total: total || 0,
                    pending: pending || 0,
                    approved: approved || 0
                };
            } catch (error) {
                console.error('Supabase stats error:', error);
            }
        }

        const sales = await SalesService.getSales();
        const filtered = branchId ? sales.filter(s => s.branchId === branchId) : sales;
        return {
            total: filtered.length,
            pending: filtered.filter(s => s.status === 'pending').length,
            approved: filtered.filter(s => s.status === 'approved').length
        };
    },

    // Get region-wise sales stats
    getRegionStats: async (): Promise<Array<{ region: string; total: number; approved: number; pending: number }>> => {
        if (isSupabaseConfigured()) {
            try {
                // Fetch just city and status for all sales to group them
                const { data, error } = await supabase
                    .from('sales')
                    .select('city, status');

                if (error) throw error;

                const grouped: Record<string, { region: string; total: number; approved: number; pending: number }> = {};
                (data || []).forEach(item => {
                    const region = item.city || 'Unknown';
                    if (!grouped[region]) {
                        grouped[region] = { region, total: 0, approved: 0, pending: 0 };
                    }
                    grouped[region].total++;
                    if (item.status === 'approved') grouped[region].approved++;
                    if (item.status === 'pending') grouped[region].pending++;
                });

                return Object.values(grouped).sort((a, b) => b.total - a.total);
            } catch (error) {
                console.error('Supabase region stats error:', error);
            }
        }

        // Fallback to local
        const sales = await SalesService.getSales();
        const grouped: Record<string, any> = {};
        sales.forEach(sale => {
            const region = sale.city || 'Unknown';
            if (!grouped[region]) grouped[region] = { region, total: 0, approved: 0, pending: 0 };
            grouped[region].total++;
            if (sale.status === 'approved') grouped[region].approved++;
            if (sale.status === 'pending') grouped[region].pending++;
        });
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    },

    // Get all sales
    getSales: async (limit?: number): Promise<Sale[]> => {
        if (isSupabaseConfigured()) {
            try {
                let query = supabase
                    .from('sales')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (limit) {
                    query = query.limit(limit);
                }

                const { data, error } = await query;

                if (error) throw error;
                return (data || []).map(dbToSale);
            } catch (error) {
                console.error('Supabase error, falling back to local storage:', error);
            }
        }

        // Fallback to local storage (cached only, no mocks)
        const stored = await Storage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    // Get sales by branch
    getSalesByBranch: async (branchId: string): Promise<Sale[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .ilike('branch_id', branchId.trim())
                    .order('sale_date', { ascending: false });

                if (error) throw error;
                return (data || []).map(dbToSale);
            } catch (error) {
                console.error('Supabase error, falling back to local storage:', error);
            }
        }

        // Fallback to local storage
        const sales = await SalesService.getSales();
        return sales.filter(sale => sale.branchId === branchId);
    },

    // Get sales by region
    getSalesByRegion: async (region: string): Promise<Sale[]> => {
        if (!region) return [];

        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .or(`region.ilike.%${region.trim()}%,city.ilike.%${region.trim()}%`)
                    .order('sale_date', { ascending: false });

                if (error) {
                    // Handle missing column error (42703: undefined_column)
                    if (error.code === '42703') {
                        console.warn('Region column missing in DB, falling back to city-only ilike');
                        const { data: cityData, error: cityErr } = await supabase
                            .from('sales')
                            .select('*')
                            .ilike('city', `%${region.trim()}%`)
                            .order('sale_date', { ascending: false });
                        
                        if (cityErr) throw cityErr;
                        return (cityData || []).map(dbToSale);
                    }
                    throw error;
                }
                return (data || []).map(dbToSale);
            } catch (error) {
                console.error(`Supabase error fetching sales for region ${region}:`, error);
            }
        }

        // Fallback to local
        const allSales = await SalesService.getSales();
        const regionLower = region.toLowerCase().trim();
        return allSales.filter(s => 
            (s.region?.toLowerCase().trim() === regionLower) || 
            (s.city?.toLowerCase().trim() === regionLower)
        );
    },

    // Get all sales (alias)
    getAllSales: async (limit?: number): Promise<Sale[]> => {
        return await SalesService.getSales(limit);
    },

    // Create new sale with images
    createSale: async (
        saleData: Omit<Sale, 'id' | 'warrantyId' | 'status' | 'imageUrls'>,
        imageUris?: string[],
        onProgress?: (progress: number) => void
    ): Promise<Sale> => {
        // Use invoice number as warranty ID
        const warrantyId = saleData.invoiceNumber;

        // Upload images sequentially with progress tracking
        let imageUrls: string[] = [];
        if (imageUris && imageUris.length > 0) {
            for (let i = 0; i < imageUris.length; i++) {
                const progressPerImage = 80 / imageUris.length; // Reserve 80% for uploads
                const baseProgress = i * progressPerImage;

                const url = await SalesService.uploadImage(
                    imageUris[i],
                    warrantyId,
                    i,
                    (imgProgress) => {
                        const totalProgress = baseProgress + (imgProgress * progressPerImage / 100);
                        onProgress?.(Math.round(totalProgress));
                    }
                );
                imageUrls.push(url);
            }
            onProgress?.(80); // All uploads complete
        }

        const status = saleData.paymentReceived ? 'approved' : 'pending';
        const warrantyGenerated = saleData.paymentReceived;

        const dbData = saleToDb({
            ...saleData,
            warrantyId,
            status,
            imageUrls,
            warrantyGenerated,
        });

        const localId = Math.random().toString(36).substr(2, 9);
        await OfflineQueueService.enqueue('CREATE', 'sales', dbData, localId, 'high');
        SyncService.forceSync();

        // Optimistic UI updates
        const sales = await SalesService.getSales();

        const newSale: Sale = {
            ...saleData,
            id: localId,
            warrantyId,
            status,
            imageUrls,
            warrantyGenerated,
        };

        const filteredSales = sales.filter(s => 
            s.warrantyId !== warrantyId && 
            s.id !== localId
        );

        if (filteredSales.length < sales.length) {
            logger.info('SalesService', 'Local storage deduplicated before saving', {
                details: `Removed existing duplicate for warranty: ${warrantyId}`,
                table: 'sales',
                localId: localId
            });
        }

        const updatedSales = [newSale, ...filteredSales];
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));

        logger.info('SalesService', 'Optimistic local update completed', {
            details: `Record saved to offline storage. WarrantyID: ${warrantyId}`,
            table: 'sales',
            localId: localId
        });
        return newSale;
    },

    // Update payment status and generate warranty
    updatePaymentStatus: async (saleId: string, received: boolean): Promise<void> => {
        const updateData = {
            id: saleId,
            payment_received: received,
            status: (received ? 'approved' : 'pending') as Sale['status'],
            warranty_generated: received
        };

        // Enqueue the update
        await OfflineQueueService.enqueue('UPDATE', 'sales', updateData, saleId, 'high');
        SyncService.forceSync();

        // Fallback to local storage (Optimistic UI)
        const sales = await SalesService.getSales();
        const updatedSales = sales.map(s => s.id === saleId ? {
            ...s,
            paymentReceived: received,
            status: received ? 'approved' : 'pending' as any,
            warrantyGenerated: received
        } : s);
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
    },

    // Update sale status
    updateSaleStatus: async (saleId: string, status: Sale['status']): Promise<void> => {
        const payload = { id: saleId, status };

        // Enqueue update to Supabase
        await OfflineQueueService.enqueue('UPDATE', 'sales', payload, saleId, 'medium');
        SyncService.forceSync();

        // Fallback to local storage (Optimistic UI)
        const sales = await SalesService.getSales();
        const updatedSales = sales.map(s => s.id === saleId ? { ...s, status } : s);
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
    },

    deleteSale: async (id: string) => {
        try {
            if (isSupabaseConfigured()) {
                const { error } = await supabase
                    .from('sales')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            }

            // Also delete from local storage
            const sales = await SalesService.getSales();
            const updatedSales = sales.filter(s => s.id !== id);
            await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));

            return true;
        } catch (error) {
            console.error('Error deleting sale:', error);
            throw error;
        }
    },

    // Search sale by invoice number or warranty ID
    getSaleByInvoice: async (invoiceNo: string): Promise<Sale | null> => {
        if (!invoiceNo) return null;
        const query = invoiceNo.trim();

        if (isSupabaseConfigured()) {
            try {
                // Search in both warranty_id and invoice_number with fuzzy matching
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .or(`warranty_id.ilike.%${query}%,invoice_number.ilike.%${query}%`)
                    .limit(1);

                if (error) {
                    if (error.code === 'PGRST116') return null;
                    throw error;
                }
                return data && data.length > 0 ? dbToSale(data[0]) : null;
            } catch (error) {
                console.error('Supabase getSaleByInvoice error:', error);
            }
        }

        const sales = await SalesService.getSales();
        const lowerQuery = query.toLowerCase();
        return sales.find(s => 
            (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(lowerQuery)) || 
            (s.warrantyId && s.warrantyId.toLowerCase().includes(lowerQuery))
        ) || null;
    },

    // Autocomplete search for warranty ID
    searchSales: async (queryText: string): Promise<Sale[]> => {
        if (!queryText || queryText.length < 2) return [];

        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .or(`warranty_id.ilike.%${queryText}%,invoice_number.ilike.%${queryText}%`)
                    .limit(5);

                if (error) throw error;
                return (data || []).map(dbToSale);
            } catch (error) {
                console.error('Supabase searchSales error:', error);
                return [];
            }
        }

        // Local fallback
        const sales = await SalesService.getSales();
        return sales
            .filter(s =>
                (s.warrantyId && s.warrantyId.toLowerCase().includes(queryText.toLowerCase())) ||
                (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(queryText.toLowerCase()))
            )
            .slice(0, 5);
    },

    // ============================================
    // PAGINATION METHODS - NEW
    // ============================================
    
    getSalesPaginated: async (
        limit: number = 50,
        page: number = 1,
        filters?: {
            branchId?: string;
            status?: 'pending' | 'approved' | 'rejected';
            dateFrom?: string;
            dateTo?: string;
        }
    ): Promise<{ data: Sale[]; total: number; hasMore: boolean }> => {
        if (!isSupabaseConfigured()) {
            console.warn('Supabase not configured for pagination');
            return { data: [], total: 0, hasMore: false };
        }

        try {
            const offset = (page - 1) * limit;
            
            let query = supabase
                .from('sales')
                .select('*', { count: 'exact' });

            // Apply filters if provided
            if (filters?.branchId) {
                query = query.ilike('branch_id', filters.branchId.trim());
            }
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.dateFrom) {
                query = query.gte('sale_date', filters.dateFrom);
            }
            if (filters?.dateTo) {
                query = query.lte('sale_date', filters.dateTo);
            }

            const { data, count, error } = await query
                .order('sale_date', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            const total = count || 0;
            const hasMore = offset + limit < total;

            return {
                data: (data || []).map(dbToSale),
                total,
                hasMore
            };
        } catch (error) {
            console.error('Error fetching paginated sales:', error);
            throw error;
        }
    },

    getSalesByBranchPaginated: async (
        branchId: string,
        limit: number = 50,
        page: number = 1
    ): Promise<{ data: Sale[]; total: number; hasMore: boolean }> => {
        return SalesService.getSalesPaginated(limit, page, { branchId });
    },

    getSalesByStatusPaginated: async (
        status: 'pending' | 'approved' | 'rejected',
        limit: number = 50,
        page: number = 1
    ): Promise<{ data: Sale[]; total: number; hasMore: boolean }> => {
        return SalesService.getSalesPaginated(limit, page, { status });
    },

    searchSalesPaginated: async (
        query: string,
        limit: number = 50,
        page: number = 1
    ): Promise<{ data: Sale[]; total: number; hasMore: boolean }> => {
        if (!isSupabaseConfigured()) return { data: [], total: 0, hasMore: false };

        try {
            const offset = (page - 1) * limit;
            
            const { data, count, error } = await supabase
                .from('sales')
                .select('*', { count: 'exact' })
                .or(`customer_name.ilike.%${query}%,phone.ilike.%${query}%,invoice_number.ilike.%${query}%`)
                .order('sale_date', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            const total = count || 0;
            const hasMore = offset + limit < total;

            return {
                data: (data || []).map(dbToSale),
                total,
                hasMore
            };
        } catch (error) {
            console.error('Error searching paginated sales:', error);
            throw error;
        }
    }
};
