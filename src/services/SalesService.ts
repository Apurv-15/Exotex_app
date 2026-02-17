import { supabase } from '../config/supabase';
import { Storage } from '../utils/storage';

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
            console.warn('Supabase not configured, using local storage');
            return await SalesService.saveImageLocally(uri, warrantyId, index);
        }

        try {
            // Check network connectivity
            const NetInfo = require('@react-native-community/netinfo');
            const netState = await NetInfo.fetch();

            if (!netState.isConnected) {
                console.warn('No network connection, saving locally');
                return await SalesService.saveImageLocally(uri, warrantyId, index);
            }

            onProgress?.(10); // Starting upload

            const fileName = `${warrantyId}_${index}_${Date.now()}.jpg`;
            const filePath = `sales-images/${fileName}`;

            // ---------------------------------------------------------
            // ROBUST FILE READING FOR ANDROID/IOS
            // ---------------------------------------------------------
            let fileBody: any;
            try {
                // Use legacy API for expo-file-system v54+
                const FileSystem = require('expo-file-system/legacy');

                // Read file as Base64
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                onProgress?.(30); // File read complete

                // Convert Base64 to ArrayBuffer (Uint8Array)
                // This is the most reliable way to upload on React Native Android with Supabase
                const { Buffer } = require('buffer');
                const buffer = Buffer.from(base64, 'base64');
                fileBody = buffer;
            } catch (readError) {
                console.warn('FileSystem read failed, trying fetch blob fallback...', readError);
                // Fallback to fetch blob (works well on iOS, sometimes flaky on Android)
                const response = await fetch(uri);
                fileBody = await response.blob();
            }

            onProgress?.(50); // Uploading to server

            const { error: uploadError } = await supabase.storage
                .from('warranty-images')
                .upload(filePath, fileBody, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) {
                console.error('Supabase upload error details:', uploadError);
                // Fallback to local storage on upload error
                console.warn('Upload failed, saving locally instead');
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

            console.log('Image saved locally:', localPath);
            return localPath;
        } catch (error) {
            console.error('Local save error:', error);
            // If local save fails, return original URI as last resort
            return uri;
        }
    },

    // Get sales stats (counts)
    getSalesStats: async (branchId?: string): Promise<{ total: number; pending: number; approved: number }> => {
        if (isSupabaseConfigured()) {
            try {
                let query = supabase.from('sales').select('*', { count: 'exact', head: true });
                if (branchId) query = query.eq('branch_id', branchId);
                const { count: total } = await query;

                let pQuery = supabase.from('sales').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                if (branchId) pQuery = pQuery.eq('branch_id', branchId);
                const { count: pending } = await pQuery;

                let aQuery = supabase.from('sales').select('*', { count: 'exact', head: true }).eq('status', 'approved');
                if (branchId) aQuery = aQuery.eq('branch_id', branchId);
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
                    .eq('branch_id', branchId)
                    .order('created_at', { ascending: false });

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

        if (isSupabaseConfigured()) {
            try {
                const dbData = saleToDb({
                    ...saleData,
                    warrantyId,
                    status: 'approved',
                    imageUrls,
                });

                const { data, error } = await supabase
                    .from('sales')
                    .insert([dbData])
                    .select()
                    .single();

                if (error) throw error;

                // Automatically decrement stock after successful warranty creation
                try {
                    const { StockService } = require('./StockService');
                    // Use branchId as region (or extract region from user context if available)
                    await StockService.decrementStock(
                        saleData.branchId, // Using branchId as region
                        saleData.productModel,
                        1
                    );
                    console.log(`✅ Stock decremented for ${saleData.productModel} in ${saleData.branchId}`);
                } catch (stockError: any) {
                    // Log but don't fail the warranty creation if stock update fails
                    console.warn('Stock decrement warning:', stockError.message);
                }

                return dbToSale(data);
            } catch (error) {
                console.error('Supabase error, falling back to local storage:', error);
            }
        }

        // Fallback to local storage
        const sales = await SalesService.getSales();
        const newSale: Sale = {
            ...saleData,
            id: Math.random().toString(36).substr(2, 9),
            warrantyId,
            status: 'approved',
            imageUrls,
        };

        const updatedSales = [newSale, ...sales];
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
        return newSale;
    },

    // Update sale status
    updateSaleStatus: async (saleId: string, status: Sale['status']): Promise<void> => {
        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('sales')
                    .update({ status })
                    .eq('id', saleId);

                if (error) throw error;
                return;
            } catch (error) {
                console.error('Supabase error, falling back to local storage:', error);
            }
        }

        // Fallback to local storage
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
        if (isSupabaseConfigured()) {
            try {
                // We use warranty_id to store the Invoice Number based on current usage
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('warranty_id', invoiceNo)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') return null; // Not found
                    throw error;
                }
                return dbToSale(data);
            } catch (error) {
                console.error('Supabase getSaleByInvoice error:', error);
            }
        }

        const sales = await SalesService.getSales();
        return sales.find(s => s.invoiceNumber === invoiceNo || s.warrantyId === invoiceNo) || null;
    },

    // Autocomplete search for warranty ID
    searchSales: async (queryText: string): Promise<Sale[]> => {
        if (!queryText || queryText.length < 2) return [];

        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .ilike('warranty_id', `%${queryText}%`)
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
    }
};
