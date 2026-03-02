import { supabase } from '../config/supabase';
import { Storage } from '../utils/storage';

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
        if (isSupabaseConfigured()) {
            try {
                const dbData = quotationToDb(data);
                const { data: insertedData, error } = await supabase
                    .from('quotations')
                    .insert([dbData])
                    .select()
                    .single();

                if (error) throw error;
                return dbToQuotation(insertedData);
            } catch (error) {
                console.error('Supabase error creating quotation, falling back to local storage:', error);
            }
        }

        // Fallback to local storage
        const quotations = await QuotationService.getAllQuotations();
        const newQuotation: Quotation = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
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
                    .eq('branch_id', branchId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return (data || []).map(dbToQuotation);
            } catch (error) {
                console.error('Supabase error getting quotations by branch, falling back to local storage:', error);
            }
        }

        const items = await QuotationService.getAllQuotations();
        return items.filter(q => q.branchId === branchId);
    }
};
