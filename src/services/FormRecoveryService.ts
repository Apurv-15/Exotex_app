import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DraftData {
    formType: 'warranty' | 'field_visit' | 'complaint';
    data: any;
    timestamp: string;
    completionPercentage: number;
}

const DRAFT_KEYS = {
    WARRANTY: 'DRAFT_WARRANTY',
    FIELD_VISIT: 'DRAFT_FIELD_VISIT',
    COMPLAINT: 'DRAFT_COMPLAINT',
};

export const FormRecoveryService = {
    // Save draft data
    saveDraft: async (formType: 'warranty' | 'field_visit' | 'complaint', data: any, completionPercentage: number): Promise<void> => {
        try {
            const draftData: DraftData = {
                formType,
                data,
                timestamp: new Date().toISOString(),
                completionPercentage,
            };

            const key = formType === 'warranty' ? DRAFT_KEYS.WARRANTY :
                formType === 'field_visit' ? DRAFT_KEYS.FIELD_VISIT :
                    DRAFT_KEYS.COMPLAINT;

            await AsyncStorage.setItem(key, JSON.stringify(draftData));
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    },

    // Get draft data
    getDraft: async (formType: 'warranty' | 'field_visit' | 'complaint'): Promise<DraftData | null> => {
        try {
            const key = formType === 'warranty' ? DRAFT_KEYS.WARRANTY :
                formType === 'field_visit' ? DRAFT_KEYS.FIELD_VISIT :
                    DRAFT_KEYS.COMPLAINT;

            const draftJson = await AsyncStorage.getItem(key);
            return draftJson ? JSON.parse(draftJson) : null;
        } catch (error) {
            console.error('Error getting draft:', error);
            return null;
        }
    },

    // Clear draft data
    clearDraft: async (formType: 'warranty' | 'field_visit' | 'complaint'): Promise<void> => {
        try {
            const key = formType === 'warranty' ? DRAFT_KEYS.WARRANTY :
                formType === 'field_visit' ? DRAFT_KEYS.FIELD_VISIT :
                    DRAFT_KEYS.COMPLAINT;

            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    },

    // Check if any draft exists
    hasDraft: async (formType: 'warranty' | 'field_visit' | 'complaint'): Promise<boolean> => {
        try {
            const draft = await FormRecoveryService.getDraft(formType);
            return draft !== null;
        } catch (error) {
            return false;
        }
    },
};
