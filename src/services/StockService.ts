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
        if (!region) return [];

        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('stock')
                    .select('*')
                    .ilike('region', region.trim());

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
        return allStock.filter(s => s.region.toLowerCase().trim() === region.toLowerCase().trim());
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
    },

    // Decrement stock when warranty is created
    decrementStock: async (region: string, modelName: string, quantity: number = 1): Promise<void> => {
        if (!region || !modelName) {
            throw new Error('Region and model name are required');
        }

        if (isSupabaseConfigured()) {
            try {
                // Fetch current stock
                const { data: currentStock, error: fetchError } = await supabase
                    .from('stock')
                    .select('*')
                    .ilike('region', region.trim())
                    .ilike('model_name', modelName.trim())
                    .single();

                if (fetchError) {
                    console.warn('Stock not found for region/model, skipping decrement:', fetchError);
                    return; // Don't throw error, just skip if stock doesn't exist
                }

                const newQuantity = (currentStock.quantity || 0) - quantity;

                if (newQuantity < 0) {
                    throw new Error(`Insufficient stock for ${modelName} in ${region}. Available: ${currentStock.quantity}, Requested: ${quantity}`);
                }

                // Update stock
                const { error: updateError } = await supabase
                    .from('stock')
                    .update({
                        quantity: newQuantity,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentStock.id);

                if (updateError) throw updateError;
                return;
            } catch (error) {
                console.error('Supabase error decrementing stock:', error);
                throw error; // Re-throw to handle in calling function
            }
        }

        // Fallback to local
        const allStock = await StockService.getAllStock();
        const stockItem = allStock.find(s =>
            s.region.toLowerCase().trim() === region.toLowerCase().trim() &&
            s.modelName.toLowerCase().trim() === modelName.toLowerCase().trim()
        );

        if (!stockItem) {
            console.warn('Stock not found locally, skipping decrement');
            return;
        }

        const newQuantity = stockItem.quantity - quantity;
        if (newQuantity < 0) {
            throw new Error(`Insufficient stock for ${modelName} in ${region}`);
        }

        stockItem.quantity = newQuantity;
        stockItem.updatedAt = new Date().toISOString();

        await Storage.setItem(STORAGE_KEY, JSON.stringify(allStock));
    }
};
