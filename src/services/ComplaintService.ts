import { supabase } from '../config/supabase';
import { Storage } from '../utils/storage';
import { Platform } from 'react-native';

export interface Complaint {
    id?: string;
    complaintId: string;
    invoiceNo: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    category: 'Billing' | 'Service' | 'Delay' | 'Technical' | 'Other';
    description: string;
    dateOfComplaint: string;
    assignedDepartment?: string;
    assignedOfficer?: string;
    actionTaken?: string;
    resolutionDate?: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    clientConfirmation?: 'Yes' | 'No';
    clientFeedback?: string;
    resolvedByName?: string;
    resolvedByDesignation?: string;
    imageUrls: string[];
    warrantyCardAttached: boolean;
    branchId?: string;
    city?: string;
    createdAt?: string;
}

const STORAGE_KEY = 'WARRANTY_PRO_COMPLAINTS';

const isSupabaseConfigured = () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key && url !== '' && key !== '');
};

export const ComplaintService = {
    // Get all complaints
    getComplaints: async (branchId?: string): Promise<Complaint[]> => {
        if (isSupabaseConfigured()) {
            try {
                let query = supabase
                    .from('complaints')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (branchId) {
                    query = query.eq('branch_id', branchId);
                }

                const { data, error } = await query;
                if (error) throw error;

                return (data || []).map(row => ({
                    id: row.id,
                    complaintId: row.complaint_id,
                    invoiceNo: row.invoice_no,
                    customerName: row.customer_name,
                    customerPhone: row.customer_phone,
                    customerEmail: row.customer_email,
                    category: row.category,
                    description: row.description,
                    dateOfComplaint: row.date_of_complaint,
                    assignedDepartment: row.assigned_department,
                    assignedOfficer: row.assigned_officer,
                    actionTaken: row.action_taken,
                    resolutionDate: row.resolution_date,
                    status: row.status,
                    clientConfirmation: row.client_confirmation,
                    clientFeedback: row.client_feedback,
                    resolvedByName: row.resolved_by_name,
                    resolvedByDesignation: row.resolved_by_designation,
                    imageUrls: row.image_urls || [],
                    warrantyCardAttached: row.warranty_card_attached,
                    branchId: row.branch_id,
                    city: row.city,
                    createdAt: row.created_at
                }));
            } catch (error) {
                console.error('Supabase getComplaints error:', error);
            }
        }

        const stored = await Storage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    // Upload image to Supabase Storage with local fallback
    uploadImage: async (
        uri: string,
        complaintId: string,
        index: number,
        onProgress?: (progress: number) => void
    ): Promise<string> => {
        if (!uri) return '';

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            console.warn('Supabase not configured, using local storage');
            return await ComplaintService.saveImageLocally(uri, complaintId, index);
        }

        try {
            // Check network connectivity
            const NetInfo = require('@react-native-community/netinfo');
            const netState = await NetInfo.fetch();

            if (!netState.isConnected) {
                console.warn('No network connection, saving locally');
                return await ComplaintService.saveImageLocally(uri, complaintId, index);
            }

            onProgress?.(10); // Starting upload

            const fileName = `${complaintId}_${index}_${Date.now()}.jpg`;
            const filePath = `complaint_images/${fileName}`; // Changed bucket path prefix if needed, but bucket name is key

            // ---------------------------------------------------------
            // ROBUST FILE READING FOR ANDROID/IOS/WEB
            // ---------------------------------------------------------
            let fileBody: any;
            if (Platform.OS === 'web') {
                try {
                    // Web: Try to fetch the URL as a blob
                    const response = await fetch(uri);
                    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
                    fileBody = await response.blob();
                } catch (fetchError) {
                    console.error('Web fetch error:', fetchError);
                    // If we can't fetch the blob (e.g. CORS on picsum), we can't upload it to Supabase from the client easily.
                    // For testing, just return the original URI if it's a remote URL.
                    if (uri.startsWith('http')) return uri;
                    return '';
                }
            } else {
                try {
                    // Native: Use legacy API for expo-file-system v54+
                    const FileSystem = require('expo-file-system/legacy');

                    // Read file as Base64
                    const base64 = await FileSystem.readAsStringAsync(uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    onProgress?.(30); // File read complete

                    // Convert Base64 to ArrayBuffer (Uint8Array)
                    const { Buffer } = require('buffer');
                    const buffer = Buffer.from(base64, 'base64');
                    fileBody = buffer;
                } catch (readError) {
                    console.warn('FileSystem read failed, trying fetch blob fallback...', readError);
                    try {
                        const response = await fetch(uri);
                        fileBody = await response.blob();
                    } catch (blobError) {
                        console.warn('Blob conversion failed:', blobError);
                        // On web, we cannot "save locally", just return original URI or empty
                        if ((Platform.OS as any) === 'web') return uri;
                        return await ComplaintService.saveImageLocally(uri, complaintId, index);
                    }
                }
            }

            // If we failed to get file body (e.g. invalid URI or CORS on web), just save the URI itself if valid
            if (!fileBody && uri.startsWith('http')) {
                return uri;
            } else if (!fileBody) {
                return '';
            }


            onProgress?.(50); // Uploading to server

            // Separate bucket for complaints: 'complaint-images'
            const { error: uploadError } = await supabase.storage
                .from('complaint-images')
                .upload(filePath, fileBody, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) {
                console.error('Supabase upload error details:', uploadError);
                console.warn('Upload failed, saving locally instead');
                return await ComplaintService.saveImageLocally(uri, complaintId, index);
            }

            onProgress?.(80); // Upload complete, getting URL

            const { data: urlData } = supabase.storage
                .from('complaint-images')
                .getPublicUrl(filePath);

            onProgress?.(100); // Complete

            return urlData.publicUrl;
        } catch (error: any) {
            console.error('Image upload error:', error);
            console.warn('Error during upload, saving locally');
            return await ComplaintService.saveImageLocally(uri, complaintId, index);
        }
    },

    // Save image locally as fallback (Mobile only)
    saveImageLocally: async (uri: string, complaintId: string, index: number): Promise<string> => {
        if (Platform.OS === 'web') return uri; // Local save not possible on web
        try {
            // Use legacy API for expo-file-system v54+
            const FileSystem = require('expo-file-system/legacy');
            const fileName = `${complaintId}_${index}_${Date.now()}.jpg`;
            const localDir = `${FileSystem.documentDirectory}complaint-images/`;

            // Create directory if it doesn't exist
            try {
                await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
            } catch (dirError) {
                // Directory likely exists
            }

            const localPath = `${localDir}${fileName}`;

            // Copy image to local storage
            await FileSystem.copyAsync({
                from: uri,
                to: localPath,
            });

            console.log('Image saved locally:', localPath);
            return localPath;
        } catch (error) {
            console.error('Local save error:', error);
            return uri; // Return original uri
        }
    },

    // Create new complaint
    createComplaint: async (complaint: Complaint): Promise<Complaint> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('complaints')
                    .insert([{
                        complaint_id: complaint.complaintId,
                        invoice_no: complaint.invoiceNo,
                        customer_name: complaint.customerName,
                        customer_phone: complaint.customerPhone,
                        customer_email: complaint.customerEmail,
                        category: complaint.category,
                        description: complaint.description,
                        date_of_complaint: complaint.dateOfComplaint,
                        assigned_department: complaint.assignedDepartment,
                        assigned_officer: complaint.assignedOfficer,
                        action_taken: complaint.actionTaken,
                        resolution_date: complaint.resolutionDate,
                        status: complaint.status,
                        client_confirmation: complaint.clientConfirmation,
                        client_feedback: complaint.clientFeedback,
                        resolved_by_name: complaint.resolvedByName,
                        resolved_by_designation: complaint.resolvedByDesignation,
                        image_urls: complaint.imageUrls,
                        warranty_card_attached: complaint.warrantyCardAttached,
                        branch_id: complaint.branchId,
                        city: complaint.city
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Supabase createComplaint error:', error);
                throw error;
            }
        }

        const complaints = await ComplaintService.getComplaints();
        const newComplaint = { ...complaint, id: Math.random().toString(36).substr(2, 9) };
        await Storage.setItem(STORAGE_KEY, JSON.stringify([newComplaint, ...complaints]));
        return newComplaint;
    },

    // Update existing complaint
    updateComplaint: async (complaintId: string, updates: Partial<Complaint>): Promise<void> => {
        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('complaints')
                    .update({
                        invoice_no: updates.invoiceNo,
                        customer_name: updates.customerName,
                        customer_phone: updates.customerPhone,
                        customer_email: updates.customerEmail,
                        category: updates.category,
                        description: updates.description,
                        assigned_department: updates.assignedDepartment,
                        assigned_officer: updates.assignedOfficer,
                        action_taken: updates.actionTaken,
                        resolution_date: updates.resolutionDate,
                        status: updates.status,
                        client_confirmation: updates.clientConfirmation,
                        client_feedback: updates.clientFeedback,
                        resolved_by_name: updates.resolvedByName,
                        resolved_by_designation: updates.resolvedByDesignation,
                        image_urls: updates.imageUrls,
                        warranty_card_attached: updates.warrantyCardAttached,
                        city: updates.city
                    })
                    .eq('complaint_id', complaintId);

                if (error) throw error;
            } catch (error) {
                console.error('Supabase updateComplaint error:', error);
                throw error;
            }
            return;
        }

        const complaints = await ComplaintService.getComplaints();
        const updated = complaints.map(c => c.complaintId === complaintId ? { ...c, ...updates } : c);
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
};
