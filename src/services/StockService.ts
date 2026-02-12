import { supabase } from '../config/supabase';
import { Storage } from '../utils/storage';
import { Stock } from '../types';

const STORAGE_KEY = 'WARRANTY_PRO_STOCK';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key && url !== '' && key !== '');
};

export const StockService = {
    // Get all stock (Admin view)
    getAllStock: async (): Promise<Stock[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('stock')
                    .select('*')
                    .order('region', { ascending: true });

                if (error) throw error;
                return (data || []).map(row => ({
                    id: row.id,
                    region: row.region,
                    modelName: row.model_name,
                    quantity: row.quantity,
                    updatedAt: row.updated_at,
                }));
            } catch (error) {
                console.error('Supabase error fetching stock:', error);
            }
        }

        // Fallback to local
        const stored = await Storage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    // Get stock for a specific region
    getStockByRegion: async (region: string): Promise<Stock[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('stock')
                    .select('*')
                    .eq('region', region);

                if (error) throw error;
                return (data || []).map(row => ({
                    id: row.id,
                    region: row.region,
                    modelName: row.model_name,
                    quantity: row.quantity,
                    updatedAt: row.updated_at,
                }));
            } catch (error) {
                console.error(`Supabase error fetching stock for ${region}:`, error);
            }
        }

        // Fallback to local
        const allStock = await StockService.getAllStock();
        return allStock.filter(s => s.region === region);
    },

    // Update stock (Admin action)
    updateStock: async (region: string, modelName: string, quantity: number): Promise<void> => {
        const updatedAt = new Date().toISOString();

        if (isSupabaseConfigured()) {
            try {
                // Upsert based on region and model_name
                const { error } = await supabase
                    .from('stock')
                    .upsert({
                        region,
                        model_name: modelName,
                        quantity,
                        updated_at: updatedAt
                    }, {
                        onConflict: 'region,model_name'
                    });

                if (error) throw error;
                return;
            } catch (error) {
                console.error('Supabase error updating stock:', error);
            }
        }

        // Fallback to local
        const allStock = await StockService.getAllStock();
        const existingIndex = allStock.findIndex(s => s.region === region && s.modelName === modelName);

        if (existingIndex >= 0) {
            allStock[existingIndex] = {
                ...allStock[existingIndex],
                quantity,
                updatedAt
            };
        } else {
            allStock.push({
                id: Math.random().toString(36).substr(2, 9),
                region,
                modelName,
                quantity,
                updatedAt
            });
        }

        await Storage.setItem(STORAGE_KEY, JSON.stringify(allStock));
    }
};
