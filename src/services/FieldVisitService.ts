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

    // Residential Specific Fields
    propertyType?: string;
    tankCapacity?: string;
    waterTDS?: string;
    waterQualityIssues?: string[];
    cleaningConcerns?: string[];
    applianceIssues?: string[];
    healthConcerns?: string[];
    hasWaterPurifier?: boolean;
    waterPurifierBrand?: string;
    hasUsedSoftener?: boolean;

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

    // Residential Specific Fields
    propertyType: row.property_type || '',
    tankCapacity: row.tank_capacity || '',
    waterTDS: row.water_tds || '',
    waterQualityIssues: row.water_quality_issues || [],
    cleaningConcerns: row.cleaning_concerns || [],
    applianceIssues: row.appliance_issues || [],
    healthConcerns: row.health_concerns || [],
    hasWaterPurifier: row.has_water_purifier || false,
    waterPurifierBrand: row.water_purifier_brand || '',
    hasUsedSoftener: row.has_used_softener || false,

    // Industrial / New Fields
    dateOfVisit: row.date_of_visit || row.visit_date,
    branchName: row.branch_name || '',
    salesEngineerName: row.sales_engineer_name || '',
    clientCompanyName: row.client_company_name || '',
    siteAddress: row.site_address || '',
    industryType: row.industry_type || '',
    contactPersonName: row.contact_person_name || '',
    designation: row.designation || '',
    mobileNumber: row.mobile_number || '',
    emailId: row.email_id || '',

    waterSource: row.water_source || [],
    waterSourceOther: row.water_source_other || '',
    dailyWaterConsumption: row.daily_water_consumption || '',
    purposeOfWaterUsage: row.purpose_of_water_usage || [],
    purposeOther: row.purpose_other || '',
    waterHardnessPPM: row.water_hardness_ppm || '',
    scalingIssueObserved: row.scaling_issue_observed || '',
    scalingDescription: row.scaling_description || '',

    existingWaterTreatment: row.existing_water_treatment || '',
    existingSystemDetails: row.existing_system_details || '',
    problemsFaced: row.problems_faced || [],
    problemsOther: row.problems_other || '',
    maintenanceFrequency: row.maintenance_frequency || '',
    customerExpectations: row.customer_expectations || '',

    applicationArea: row.application_area || [],
    applicationOther: row.application_other || '',
    pipeLineSize: row.pipe_line_size || '',
    operatingPressure: row.operating_pressure || '',
    operatingTemperature: row.operating_temperature || '',

    ekotexInstallationFeasible: row.ekotex_installation_feasible || '',
    recommendedEkotexModel: row.recommended_ekotex_model || '',
    quantityRequired: row.quantity_required || '',
    siteConstraints: row.site_constraints || '',
    accessoriesRequired: row.accessories_required || '',

    customerInterestLevel: row.customer_interest_level || '',
    budgetDiscussed: row.budget_discussed || '',
    expectedDecisionTimeline: row.expected_decision_timeline || '',
    decisionMakerIdentified: row.decision_maker_identified || '',

    existingCompetitorSolution: row.existing_competitor_solution || '',
    competitorPriceRange: row.competitor_price_range || '',
    customerRemarks: row.customer_remarks || '',

    sitePhotographsTaken: row.site_photographs_taken || false,
    existingSystemPhotographs: row.existing_system_photographs || false,
    problemAreaPhotographs: row.problem_area_photographs || false,
    drawingsCollected: row.drawings_collected || false,

    nextActionRequired: row.next_action_required || [],
    nextActionOther: row.next_action_other || '',
    responsiblePerson: row.responsible_person || '',
    expectedFollowUpDate: row.expected_follow_up_date || '',

    salesEngineerRemarks: row.sales_engineer_remarks || '',
    overallSiteAssessment: row.overall_site_assessment || '',
    conversionProbability: row.conversion_probability || '',
    visitedBySignature: row.visited_by_signature || '',
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

    // Residential Fields
    property_type: visit.propertyType || null,
    tank_capacity: visit.tankCapacity || null,
    water_tds: visit.waterTDS || null,
    water_quality_issues: visit.waterQualityIssues || [],
    cleaning_concerns: visit.cleaningConcerns || [],
    appliance_issues: visit.applianceIssues || [],
    health_concerns: visit.healthConcerns || [],
    has_water_purifier: visit.hasWaterPurifier || false,
    water_purifier_brand: visit.waterPurifierBrand || null,
    has_used_softener: visit.hasUsedSoftener || false,

    // Industrial / New Fields
    branch_name: visit.branchName || null,
    sales_engineer_name: visit.salesEngineerName || null,
    client_company_name: visit.clientCompanyName || null,
    site_address: visit.siteAddress || null,
    industry_type: visit.industryType || null,
    contact_person_name: visit.contactPersonName || null,
    designation: visit.designation || null,
    mobile_number: visit.mobileNumber || null,
    email_id: visit.emailId || null,

    water_source: visit.waterSource || [],
    water_source_other: visit.waterSourceOther || null,
    daily_water_consumption: visit.dailyWaterConsumption || null,
    purpose_of_water_usage: visit.purposeOfWaterUsage || [],
    purpose_other: visit.purposeOther || null,
    water_hardness_ppm: visit.waterHardnessPPM || null,
    scaling_issue_observed: visit.scalingIssueObserved || null,
    scaling_description: visit.scalingDescription || null,

    existing_water_treatment: visit.existingWaterTreatment || null,
    existing_system_details: visit.existingSystemDetails || null,
    problems_faced: visit.problemsFaced || [],
    problems_other: visit.problemsOther || null,
    maintenance_frequency: visit.maintenanceFrequency || null,
    customer_expectations: visit.customerExpectations || null,

    application_area: visit.applicationArea || [],
    application_other: visit.applicationOther || null,
    pipe_line_size: visit.pipeLineSize || null,
    operating_pressure: visit.operatingPressure || null,
    operating_temperature: visit.operatingTemperature || null,

    ekotex_installation_feasible: visit.ekotexInstallationFeasible || null,
    recommended_ekotex_model: visit.recommendedEkotexModel || null,
    quantity_required: visit.quantityRequired || null,
    site_constraints: visit.siteConstraints || null,
    accessories_required: visit.accessoriesRequired || null,

    customer_interest_level: visit.customerInterestLevel || null,
    budget_discussed: visit.budgetDiscussed || null,
    expected_decision_timeline: visit.expectedDecisionTimeline || null,
    decision_maker_identified: visit.decisionMakerIdentified || null,

    existing_competitor_solution: visit.existingCompetitorSolution || null,
    competitor_price_range: visit.competitorPriceRange || null,
    customer_remarks: visit.customerRemarks || null,

    site_photographs_taken: visit.sitePhotographsTaken || false,
    existing_system_photographs: visit.existingSystemPhotographs || false,
    problem_area_photographs: visit.problemAreaPhotographs || false,
    drawings_collected: visit.drawingsCollected || false,

    next_action_required: visit.nextActionRequired || [],
    next_action_other: visit.nextActionOther || null,
    responsible_person: visit.responsiblePerson || null,
    expected_follow_up_date: visit.expectedFollowUpDate || null,

    sales_engineer_remarks: visit.salesEngineerRemarks || null,
    overall_site_assessment: visit.overallSiteAssessment || null,
    conversion_probability: visit.conversionProbability || null,
    visited_by_signature: visit.visitedBySignature || null,
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

    deleteFieldVisit: async (id: string) => {
        try {
            if (isSupabaseConfigured()) {
                const { error } = await supabase
                    .from('field_visits')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            }

            // Also delete from local storage
            const visits = await FieldVisitService.getFieldVisits();
            const updatedVisits = visits.filter(v => v.id !== id);
            await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedVisits));

            return true;
        } catch (error) {
            console.error('Error deleting field visit:', error);
            throw error;
        }
    },
};
