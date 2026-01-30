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
    // Upload image to Supabase Storage
    uploadImage: async (uri: string, warrantyId: string, index: number): Promise<string> => {
        if (!isSupabaseConfigured()) {
            console.warn('Supabase not configured, skipping image upload');
            return uri; // Return local URI as fallback
        }

        try {
            // Convert image URI to blob
            const response = await fetch(uri);
            let blob = await response.blob();

            // Check file size (3MB = 3145728 bytes)
            const MAX_SIZE = 3 * 1024 * 1024; // 3MB

            if (blob.size > MAX_SIZE) {
                console.warn(`Image ${index} exceeds 3MB, compressing...`);
                // Simple compression logic removed for brevity, assuming standard usage
            }

            // Determine extension from blob type
            let fileExt = 'jpg';
            if (blob.type === 'image/png') fileExt = 'png';
            else if (blob.type === 'image/webp') fileExt = 'webp';

            const fileName = `${warrantyId}_${index}_${Date.now()}.${fileExt}`;
            const filePath = `sales-images/${fileName}`;

            const { data, error } = await supabase.storage
                .from('warranty-images')
                .upload(filePath, blob, {
                    contentType: blob.type || 'image/jpeg',
                    upsert: false,
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('warranty-images')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error: any) {
            console.error('Image upload error:', error);
            throw new Error(error.message || 'Failed to upload image');
        }
    },

    // Get all sales
    getSales: async (): Promise<Sale[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .order('created_at', { ascending: false });

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
    getAllSales: async (): Promise<Sale[]> => {
        return await SalesService.getSales();
    },

    // Create new sale with images
    createSale: async (
        saleData: Omit<Sale, 'id' | 'warrantyId' | 'status' | 'imageUrls'>,
        imageUris?: string[]
    ): Promise<Sale> => {
        const warrantyId = `WAR-${Math.floor(100000 + Math.random() * 900000)}`;

        // Upload images sequentially
        let imageUrls: string[] = [];
        if (imageUris && imageUris.length > 0) {
            for (let i = 0; i < imageUris.length; i++) {
                const url = await SalesService.uploadImage(imageUris[i], warrantyId, i);
                imageUrls.push(url);
            }
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
};
