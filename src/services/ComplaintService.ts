import { supabase } from '../config/supabase';
import { Storage } from '../utils/storage';

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
                    createdAt: row.created_at
                }));
            } catch (error) {
                console.error('Supabase getComplaints error:', error);
            }
        }

        const stored = await Storage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
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
                        branch_id: complaint.branchId
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Supabase createComplaint error:', error);
            }
        }

        const complaints = await ComplaintService.getComplaints();
        const newComplaint = { ...complaint, id: Math.random().toString(36).substr(2, 9) };
        await Storage.setItem(STORAGE_KEY, JSON.stringify([newComplaint, ...complaints]));
        return newComplaint;
    }
};
