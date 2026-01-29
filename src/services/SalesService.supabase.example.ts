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
}

const STORAGE_KEY = 'WARRANTY_PRO_SALES';
const USE_SUPABASE = false; // Set to true when Supabase is configured

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
});

export const SalesService = {
    // Get all sales
    getSales: async (): Promise<Sale[]> => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(dbToSale);
        }

        // Fallback to local storage
        const stored = await Storage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    },

    // Get sales by branch
    getSalesByBranch: async (branchId: string): Promise<Sale[]> => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .eq('branch_id', branchId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(dbToSale);
        }

        // Fallback to local storage
        const sales = await SalesService.getSales();
        return sales.filter(sale => sale.branchId === branchId);
    },

    // Get all sales (alias for getSales)
    getAllSales: async (): Promise<Sale[]> => {
        return await SalesService.getSales();
    },

    // Create new sale
    createSale: async (saleData: Omit<Sale, 'id' | 'warrantyId' | 'status'>): Promise<Sale> => {
        const warrantyId = `WAR-${Math.floor(100000 + Math.random() * 900000)}`;

        if (USE_SUPABASE) {
            const dbData = saleToDb({
                ...saleData,
                warrantyId,
                status: 'approved',
            });

            const { data, error } = await supabase
                .from('sales')
                .insert([dbData])
                .select()
                .single();

            if (error) throw error;
            return dbToSale(data);
        }

        // Fallback to local storage
        const sales = await SalesService.getSales();
        const newSale: Sale = {
            ...saleData,
            id: Math.random().toString(36).substr(2, 9),
            warrantyId,
            status: 'approved',
        };

        const updatedSales = [newSale, ...sales];
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
        return newSale;
    },

    // Update sale status
    updateSaleStatus: async (saleId: string, status: Sale['status']): Promise<void> => {
        if (USE_SUPABASE) {
            const { error } = await supabase
                .from('sales')
                .update({ status })
                .eq('id', saleId);

            if (error) throw error;
            return;
        }

        // Fallback to local storage
        const sales = await SalesService.getSales();
        const updatedSales = sales.map(s => s.id === saleId ? { ...s, status } : s);
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
    },

    // Delete sale
    deleteSale: async (saleId: string): Promise<void> => {
        if (USE_SUPABASE) {
            const { error } = await supabase
                .from('sales')
                .delete()
                .eq('id', saleId);

            if (error) throw error;
            return;
        }

        // Fallback to local storage
        const sales = await SalesService.getSales();
        const updatedSales = sales.filter(s => s.id !== saleId);
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
    },
};
