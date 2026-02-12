-- COMPLAINTS SETUP SQL
-- This script creates the complaints table and sets up security policies.

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id TEXT UNIQUE NOT NULL,
    invoice_no TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    category TEXT, -- Billing / Service / Delay / Technical / Other
    description TEXT,
    date_of_complaint DATE DEFAULT CURRENT_DATE,
    assigned_department TEXT,
    assigned_officer TEXT,
    action_taken TEXT,
    resolution_date DATE,
    status TEXT DEFAULT 'Open', -- Open / In Progress / Resolved / Closed
    client_confirmation TEXT, -- Yes / No
    client_feedback TEXT,
    resolved_by_name TEXT,
    resolved_by_designation TEXT,
    image_urls TEXT[],
    warranty_card_attached BOOLEAN DEFAULT FALSE,
    branch_id TEXT, -- To track which branch this complaint belongs to
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Policies
-- Super Admin and Admin can see all complaints
CREATE POLICY "Admins can manage complaints" ON public.complaints
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role IN ('Admin', 'Super Admin')
        )
    );

-- Users (Sub-branches) can see complaints for their branch
CREATE POLICY "Users can see own branch complaints" ON public.complaints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.branch_id = complaints.branch_id
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
