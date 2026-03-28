import { supabase } from '../config/supabase';
import { Storage } from '../utils/storage';
import { OfflineQueueService } from './OfflineQueueService';
import { SyncService } from './SyncService';

export interface Quotation {
    id: string;
    quotationNo: string;
    quotationDate: string;
    validity: string;
    customerName: string;
    companyName: string;
    phone: string;
    email: string;
    billingAddress: string;
    shippingAddress: string;
    itemName: string;
    itemDescription: string;
    rate: string;
    qty: string;
    discountPerc: string;
    region: string;
    branchId: string;
    createdAt?: string;
}

const STORAGE_KEY = 'WARRANTY_PRO_QUOTATIONS';

const isSupabaseConfigured = () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key && url !== '' && key !== '');
};

const dbToQuotation = (row: any): Quotation => ({
    id: row.id,
    quotationNo: row.quotation_no,
    quotationDate: row.quotation_date,
    validity: row.validity,
    customerName: row.customer_name,
    companyName: row.company_name,
    phone: row.phone,
    email: row.email,
    billingAddress: row.billing_address,
    shippingAddress: row.shipping_address,
    itemName: row.item_name,
    itemDescription: row.item_description,
    rate: row.rate,
    qty: row.qty,
    discountPerc: row.discount_perc,
    region: row.region,
    branchId: row.branch_id,
    createdAt: row.created_at,
});

const quotationToDb = (q: Partial<Quotation>) => ({
    quotation_no: q.quotationNo,
    quotation_date: q.quotationDate,
    validity: q.validity,
    customer_name: q.customerName,
    company_name: q.companyName,
    phone: q.phone,
    email: q.email,
    billing_address: q.billingAddress,
    shipping_address: q.shippingAddress,
    item_name: q.itemName,
    item_description: q.itemDescription,
    rate: q.rate,
    qty: q.qty,
    discount_perc: q.discountPerc,
    region: q.region,
    branch_id: q.branchId,
});

export const QuotationService = {
    createQuotation: async (data: Omit<Quotation, 'id' | 'createdAt'>): Promise<Quotation> => {
        const localId = Math.random().toString(36).substr(2, 9);
        const dbData = quotationToDb(data);

        await OfflineQueueService.enqueue('CREATE', 'quotations', dbData, localId, 'medium');
        SyncService.forceSync();

        // Fallback to local storage (Optimistic UI)
        const quotations = await QuotationService.getAllQuotations();
        const newQuotation: Quotation = {
            ...data,
            id: localId,
            createdAt: new Date().toISOString(),
        };

        const updated = [newQuotation, ...quotations];
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newQuotation;
    },

    getAllQuotations: async (): Promise<Quotation[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('quotations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return (data || []).map(dbToQuotation);
            } catch (error) {
                console.error('Supabase error getting quotations, falling back to local storage:', error);
            }
        }

        const stored = await Storage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    getQuotationsByBranch: async (branchId: string): Promise<Quotation[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('quotations')
                    .select('*')
                    .ilike('branch_id', branchId.trim())
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return (data || []).map(dbToQuotation);
            } catch (error) {
                console.error('Supabase error getting quotations by branch, falling back to local storage:', error);
            }
        }

        const items = await QuotationService.getAllQuotations();
        return items.filter(q => q.branchId === branchId);
    },

    // ============================================
    // PAGINATION METHODS - NEW
    // ============================================
    
    getQuotationsPaginated: async (
        limit: number = 50,
        page: number = 1,
        branchId?: string
    ): Promise<{ data: Quotation[]; total: number; hasMore: boolean }> => {
        if (!isSupabaseConfigured()) {
            return { data: [], total: 0, hasMore: false };
        }

        try {
            const offset = (page - 1) * limit;
            
            let query = supabase
                .from('quotations')
                .select('*', { count: 'exact' });

            if (branchId) {
                query = query.ilike('branch_id', branchId.trim());
            }

            const { data, count, error } = await query
                .order('quotation_date', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            const total = count || 0;
            const hasMore = offset + limit < total;

            return {
                data: (data || []).map(dbToQuotation),
                total,
                hasMore
            };
        } catch (error) {
            console.error('Error fetching paginated quotations:', error);
            throw error;
        }
    },

    getQuotationsByBranchPaginated: async (
        branchId: string,
        limit: number = 50,
        page: number = 1
    ): Promise<{ data: Quotation[]; total: number; hasMore: boolean }> => {
        return QuotationService.getQuotationsPaginated(limit, page, branchId);
    },

    deleteQuotation: async (id: string): Promise<void> => {
        try {
            if (isSupabaseConfigured()) {
                const { error } = await supabase
                    .from('quotations')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            }

            // Also delete from local storage
            const quotations = await QuotationService.getAllQuotations();
            const updated = quotations.filter(q => q.id !== id);
            await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error deleting quotation:', error);
            throw error;
        }
    }
};
