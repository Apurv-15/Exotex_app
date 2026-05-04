import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../core/logging/Logger';

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
            logger.error('FormRecoveryService', `Error saving draft for ${formType}`, { details: error });
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
            logger.error('FormRecoveryService', `Error getting draft for ${formType}`, { details: error });
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
            logger.error('FormRecoveryService', `Error clearing draft for ${formType}`, { details: error });
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
