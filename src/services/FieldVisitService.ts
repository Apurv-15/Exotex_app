import { supabase } from '../config/supabase';
import { Storage } from '../utils/storage';

export interface FieldVisit {
    id: string;

    // Basic Site & Client Information
    dateOfVisit?: string;
    branchName?: string;
    salesEngineerName?: string;
    clientCompanyName?: string;
    siteAddress?: string;
    industryType?: string;
    contactPersonName?: string;
    designation?: string;
    mobileNumber?: string;
    emailId?: string;

    // Water Source & Water Quality Details
    waterSource?: string[];
    waterSourceOther?: string;
    dailyWaterConsumption?: string;
    purposeOfWaterUsage?: string[];
    purposeOther?: string;
    waterHardnessPPM?: string;
    scalingIssueObserved?: string;
    scalingDescription?: string;

    // Existing System & Problem Identification
    existingWaterTreatment?: string;
    existingSystemDetails?: string;
    problemsFaced?: string[];
    problemsOther?: string;
    maintenanceFrequency?: string;
    customerExpectations?: string;

    // Area of Application
    applicationArea?: string[];
    applicationOther?: string;
    pipeLineSize?: string;
    operatingPressure?: string;
    operatingTemperature?: string;

    // Technical & Commercial Observations
    ekotexInstallationFeasible?: string;
    recommendedEkotexModel?: string;
    quantityRequired?: string;
    siteConstraints?: string;
    accessoriesRequired?: string;

    // Commercial Discussion Summary
    customerInterestLevel?: string;
    budgetDiscussed?: string;
    expectedDecisionTimeline?: string;
    decisionMakerIdentified?: string;

    // Competitor & Market Information
    existingCompetitorSolution?: string;
    competitorPriceRange?: string;
    customerRemarks?: string;

    // Photographs & Attachments
    sitePhotographsTaken?: boolean;
    existingSystemPhotographs?: boolean;
    problemAreaPhotographs?: boolean;
    drawingsCollected?: boolean;

    // Follow-up & Action Plan
    nextActionRequired?: string[];
    nextActionOther?: string;
    responsiblePerson?: string;
    expectedFollowUpDate?: string;

    // Executive Remarks
    salesEngineerRemarks?: string;
    overallSiteAssessment?: string;
    conversionProbability?: string;
    visitedBySignature?: string;

    // Legacy fields (for compatibility)
    siteName: string;
    contactPerson: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    visitDate: string;
    visitTime: string;
    visitType: 'Installation' | 'Maintenance' | 'Inspection' | 'Complaint';
    purpose: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    assignedTechnician: string;
    equipmentStatus: string;
    waterTdsBefore?: string;
    waterTdsAfter?: string;
    equipmentModel?: string;
    serialNumber?: string;
    installationDate?: string;
    lastServiceDate?: string;
    workDescription: string;
    partsReplaced?: string;
    materialsUsed?: string;
    timeSpent?: string;
    satisfaction?: number;
    customerComments?: string;
    signatureRequired: boolean;
    followUpNeeded: boolean;
    followUpDate?: string;
    followUpNotes?: string;

    // Metadata
    branchId: string;
    createdBy: string;
    status: 'pending' | 'completed' | 'cancelled';
    imageUrls?: string[];
}

const STORAGE_KEY = 'WARRANTY_PRO_FIELD_VISITS';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key && url !== '' && key !== '');
};

// Helper to convert DB row to FieldVisit object
const dbToFieldVisit = (row: any): FieldVisit => ({
    id: row.id,
    siteName: row.site_name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email || '',
    address: row.address,
    city: row.city,
    visitDate: row.visit_date,
    visitTime: row.visit_time,
    visitType: row.visit_type,
    purpose: row.purpose,
    priority: row.priority,
    assignedTechnician: row.assigned_technician,
    equipmentStatus: row.equipment_status,
    waterTdsBefore: row.water_tds_before || '',
    waterTdsAfter: row.water_tds_after || '',
    equipmentModel: row.equipment_model || '',
    serialNumber: row.serial_number || '',
    installationDate: row.installation_date || '',
    lastServiceDate: row.last_service_date || '',
    workDescription: row.work_description,
    partsReplaced: row.parts_replaced || '',
    materialsUsed: row.materials_used || '',
    timeSpent: row.time_spent || '',
    satisfaction: row.satisfaction || 0,
    customerComments: row.customer_comments || '',
    signatureRequired: row.signature_required,
    followUpNeeded: row.follow_up_needed,
    followUpDate: row.follow_up_date || '',
    followUpNotes: row.follow_up_notes || '',
    branchId: row.branch_id,
    createdBy: row.created_by,
    status: row.status,
    imageUrls: row.image_urls || [],
});

// Helper to convert FieldVisit object to DB row
const fieldVisitToDb = (visit: Partial<FieldVisit>) => ({
    site_name: visit.siteName,
    contact_person: visit.contactPerson,
    phone: visit.phone,
    email: visit.email || null,
    address: visit.address,
    city: visit.city,
    visit_date: visit.visitDate,
    visit_time: visit.visitTime,
    visit_type: visit.visitType,
    purpose: visit.purpose,
    priority: visit.priority,
    assigned_technician: visit.assignedTechnician,
    equipment_status: visit.equipmentStatus,
    water_tds_before: visit.waterTdsBefore || null,
    water_tds_after: visit.waterTdsAfter || null,
    equipment_model: visit.equipmentModel || null,
    serial_number: visit.serialNumber || null,
    installation_date: visit.installationDate || null,
    last_service_date: visit.lastServiceDate || null,
    work_description: visit.workDescription,
    parts_replaced: visit.partsReplaced || null,
    materials_used: visit.materialsUsed || null,
    time_spent: visit.timeSpent || null,
    satisfaction: visit.satisfaction || null,
    customer_comments: visit.customerComments || null,
    signature_required: visit.signatureRequired,
    follow_up_needed: visit.followUpNeeded,
    follow_up_date: visit.followUpDate || null,
    follow_up_notes: visit.followUpNotes || null,
    branch_id: visit.branchId,
    created_by: visit.createdBy,
    status: visit.status,
    image_urls: visit.imageUrls || [],
});

export const FieldVisitService = {
    // Upload image to Supabase Storage with local fallback
    uploadImage: async (
        uri: string,
        visitId: string,
        index: number,
        onProgress?: (progress: number) => void
    ): Promise<string> => {
        if (!uri) return '';

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            console.warn('Supabase not configured, using local storage');
            return await FieldVisitService.saveImageLocally(uri, visitId, index);
        }

        try {
            // Check network connectivity
            const NetInfo = require('@react-native-community/netinfo');
            const netState = await NetInfo.fetch();

            if (!netState.isConnected) {
                console.warn('No network connection, saving locally');
                return await FieldVisitService.saveImageLocally(uri, visitId, index);
            }

            onProgress?.(10); // Starting upload

            const fileName = `${visitId}_${index}_${Date.now()}.jpg`;
            const filePath = `field-visit-images/${fileName}`;
            let fileBody: any;

            // Robust reading for Android/iOS
            try {
                // Use legacy API for expo-file-system v54+
                const FileSystem = require('expo-file-system/legacy');
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                onProgress?.(30); // File read complete

                // Use Buffer to handle Base64 to Binary conversion (highly stable on Android)
                const { Buffer } = require('buffer');
                fileBody = Buffer.from(base64, 'base64');
            } catch (readError) {
                console.warn('FileSystem read failed, using blob fallback...', readError);
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
                return await FieldVisitService.saveImageLocally(uri, visitId, index);
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
            return await FieldVisitService.saveImageLocally(uri, visitId, index);
        }
    },

    // Save image locally as fallback
    saveImageLocally: async (uri: string, visitId: string, index: number): Promise<string> => {
        try {
            // Use legacy API for expo-file-system v54+
            const FileSystem = require('expo-file-system/legacy');
            const fileName = `${visitId}_${index}_${Date.now()}.jpg`;
            const localDir = `${FileSystem.documentDirectory}field-visit-images/`;

            // Create directory if it doesn't exist
            // Note: makeDirectoryAsync with intermediates: true is safe to call even if dir exists
            try {
                await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
            } catch (dirError) {
                // Ignore error if directory already exists
            }

            const localPath = `${localDir}${fileName}`;

            // Copy image to local storage
            await FileSystem.copyAsync({
                from: uri,
                to: localPath,
            });

            console.log('Field visit image saved locally:', localPath);
            return localPath;
        } catch (error) {
            console.error('Local save error:', error);
            // If local save fails, return original URI as last resort
            return uri;
        }
    },

    // Get field visit stats (counts)
    getFieldVisitStats: async (branchId?: string): Promise<{ total: number; completed: number; pending: number }> => {
        if (isSupabaseConfigured()) {
            try {
                let query = supabase.from('field_visits').select('*', { count: 'exact', head: true });
                if (branchId) query = query.eq('branch_id', branchId);
                const { count: total } = await query;

                let cQuery = supabase.from('field_visits').select('*', { count: 'exact', head: true }).eq('status', 'completed');
                if (branchId) cQuery = cQuery.eq('branch_id', branchId);
                const { count: completed } = await cQuery;

                let pQuery = supabase.from('field_visits').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                if (branchId) pQuery = pQuery.eq('branch_id', branchId);
                const { count: pending } = await pQuery;

                return {
                    total: total || 0,
                    completed: completed || 0,
                    pending: pending || 0
                };
            } catch (error) {
                console.error('Supabase visit stats error:', error);
            }
        }

        const visits = await FieldVisitService.getFieldVisits();
        const filtered = branchId ? visits.filter(v => v.branchId === branchId) : visits;
        return {
            total: filtered.length,
            completed: filtered.filter(v => v.status === 'completed').length,
            pending: filtered.filter(v => v.status === 'pending').length
        };
    },

    // Get region-wise visit stats
    getFieldVisitRegionStats: async (): Promise<Array<{ region: string; total: number; completed: number; pending: number }>> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('field_visits')
                    .select('city, status');

                if (error) throw error;

                const grouped: Record<string, { region: string; total: number; completed: number; pending: number }> = {};
                (data || []).forEach(item => {
                    const region = item.city || 'Unknown';
                    if (!grouped[region]) {
                        grouped[region] = { region, total: 0, completed: 0, pending: 0 };
                    }
                    grouped[region].total++;
                    if (item.status === 'completed') grouped[region].completed++;
                    if (item.status === 'pending') grouped[region].pending++;
                });

                return Object.values(grouped).sort((a, b) => b.total - a.total);
            } catch (error) {
                console.error('Supabase visit region stats error:', error);
            }
        }

        const visits = await FieldVisitService.getFieldVisits();
        const grouped: Record<string, any> = {};
        visits.forEach(v => {
            const region = v.city || 'Unknown';
            if (!grouped[region]) grouped[region] = { region, total: 0, completed: 0, pending: 0 };
            grouped[region].total++;
            if (v.status === 'completed') grouped[region].completed++;
            if (v.status === 'pending') grouped[region].pending++;
        });
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    },

    // Get all field visits
    getFieldVisits: async (limit?: number): Promise<FieldVisit[]> => {
        if (isSupabaseConfigured()) {
            try {
                let query = supabase
                    .from('field_visits')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (limit) {
                    query = query.limit(limit);
                }

                const { data, error } = await query;

                if (error) throw error;
                return (data || []).map(dbToFieldVisit);
            } catch (error) {
                console.error('Supabase error, falling back to local storage:', error);
            }
        }

        // Fallback to local storage
        const stored = await Storage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    // Get field visits by branch
    getFieldVisitsByBranch: async (branchId: string): Promise<FieldVisit[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('field_visits')
                    .select('*')
                    .eq('branch_id', branchId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return (data || []).map(dbToFieldVisit);
            } catch (error) {
                console.error('Supabase error, falling back to local storage:', error);
            }
        }

        // Fallback to local storage
        const visits = await FieldVisitService.getFieldVisits();
        return visits.filter(visit => visit.branchId === branchId);
    },

    // Create new field visit with images
    createFieldVisit: async (
        visitData: Omit<FieldVisit, 'id' | 'status' | 'imageUrls'>,
        imageUris?: string[],
        onProgress?: (progress: number) => void
    ): Promise<FieldVisit> => {
        const visitId = `FV-${Math.floor(100000 + Math.random() * 900000)}`;

        // Upload images sequentially with progress tracking
        let imageUrls: string[] = [];
        if (imageUris && imageUris.length > 0) {
            for (let i = 0; i < imageUris.length; i++) {
                const progressPerImage = 80 / imageUris.length; // Reserve 80% for uploads
                const baseProgress = i * progressPerImage;

                const url = await FieldVisitService.uploadImage(
                    imageUris[i],
                    visitId,
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
                const dbData = fieldVisitToDb({
                    ...visitData,
                    status: 'completed',
                    imageUrls,
                });

                const { data, error } = await supabase
                    .from('field_visits')
                    .insert([dbData])
                    .select()
                    .single();

                if (error) throw error;
                return dbToFieldVisit(data);
            } catch (error) {
                console.error('Supabase error, falling back to local storage:', error);
            }
        }

        // Fallback to local storage
        const visits = await FieldVisitService.getFieldVisits();
        const newVisit: FieldVisit = {
            ...visitData,
            id: visitId,
            status: 'completed',
            imageUrls,
        };

        const updatedVisits = [newVisit, ...visits];
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedVisits));
        return newVisit;
    },

    // Update field visit status
    updateFieldVisitStatus: async (visitId: string, status: FieldVisit['status']): Promise<void> => {
        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('field_visits')
                    .update({ status })
                    .eq('id', visitId);

                if (error) throw error;
                return;
            } catch (error) {
                console.error('Supabase error, falling back to local storage:', error);
            }
        }

        // Fallback to local storage
        const visits = await FieldVisitService.getFieldVisits();
        const updatedVisits = visits.map(v => v.id === visitId ? { ...v, status } : v);
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedVisits));
    },
};
