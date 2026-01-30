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
    // Upload image to Supabase Storage
    uploadImage: async (uri: string, visitId: string, index: number): Promise<string> => {
        if (!isSupabaseConfigured()) {
            console.warn('Supabase not configured, skipping image upload');
            return uri; // Return local URI as fallback
        }

        try {
            const response = await fetch(uri);
            let blob = await response.blob();

            // Check file size (3MB limit)
            const MAX_SIZE = 3 * 1024 * 1024;
            if (blob.size > MAX_SIZE) {
                console.warn(`Image ${index} exceeds 3MB, compressing...`);

                if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
                    const imageBitmap = await createImageBitmap(blob);
                    const canvas = document.createElement('canvas');
                    const maxWidth = 1920;
                    const scale = Math.min(1, maxWidth / imageBitmap.width);
                    canvas.width = imageBitmap.width * scale;
                    canvas.height = imageBitmap.height * scale;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
                        blob = await new Promise<Blob>((resolve) => {
                            canvas.toBlob(
                                (compressedBlob) => resolve(compressedBlob || blob),
                                'image/jpeg',
                                0.8
                            );
                        });
                    }
                }
            }

            let fileExt = 'jpg';
            if (blob.type === 'image/png') fileExt = 'png';
            else if (blob.type === 'image/webp') fileExt = 'webp';

            const fileName = `${visitId}_${index}_${Date.now()}.${fileExt}`;
            const filePath = `field-visit-images/${fileName}`;

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

    // Get all field visits
    getFieldVisits: async (): Promise<FieldVisit[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('field_visits')
                    .select('*')
                    .order('created_at', { ascending: false });

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
        imageUris?: string[]
    ): Promise<FieldVisit> => {
        const visitId = `FV-${Math.floor(100000 + Math.random() * 900000)}`;

        // Upload images sequentially
        let imageUrls: string[] = [];
        if (imageUris && imageUris.length > 0) {
            console.log(`Uploading ${imageUris.length} images sequentially...`);
            for (let i = 0; i < imageUris.length; i++) {
                console.log(`Uploading image ${i + 1} of ${imageUris.length}...`);
                const url = await FieldVisitService.uploadImage(imageUris[i], visitId, i);
                imageUrls.push(url);
            }
            console.log('All images uploaded successfully');
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
