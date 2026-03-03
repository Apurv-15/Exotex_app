-- =========================================================
-- MASTER DATABASE & STORAGE SETUP
-- Combined from all migration and setup scripts.
-- USE THIS FILE TO RECREATE THE ENTIRE DB FROM SCRATCH.
-- =========================================================

-- 0. PREQUISITES & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0.1 GLOBAL UTILITIES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================
-- 1. TABLES
-- =========================================================

-- 1.1 USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'User', 'Super Admin')),
    branch_id TEXT NOT NULL,
    region TEXT, -- Shared region for filtering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON public.users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region);

-- 1.2 STOCK TABLE
CREATE TABLE IF NOT EXISTS public.stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region TEXT NOT NULL,
    model_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(region, model_name)
);

-- 1.3 SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    date DATE NOT NULL,
    invoice_number TEXT,
    water_testing_before TEXT,
    water_testing_after TEXT,
    executive_name TEXT,
    designation TEXT,
    plumber_name TEXT,
    product_model TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    product_details_confirmed BOOLEAN DEFAULT FALSE,
    sale_date DATE NOT NULL,
    branch_id TEXT NOT NULL,
    warranty_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    image_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_warranty_id ON sales(warranty_id);

-- 1.4 COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id TEXT UNIQUE NOT NULL,
    invoice_no TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    category TEXT,
    description TEXT,
    date_of_complaint DATE DEFAULT CURRENT_DATE,
    assigned_department TEXT,
    assigned_officer TEXT,
    action_taken TEXT,
    resolution_date DATE,
    status TEXT DEFAULT 'Open',
    client_confirmation TEXT,
    client_feedback TEXT,
    resolved_by_name TEXT,
    resolved_by_designation TEXT,
    image_urls TEXT[] DEFAULT '{}',
    warranty_card_attached BOOLEAN DEFAULT FALSE,
    branch_id TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 FIELD VISITS TABLE
CREATE TABLE IF NOT EXISTS public.field_visits (
  id text primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Basic Info
  site_name text not null,
  contact_person text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  visit_date text not null,
  visit_time text not null,
  visit_type text not null,
  
  -- Technical Info
  purpose text not null,
  priority text not null,
  assigned_technician text not null,
  equipment_status text not null,
  
  -- Water Parameters
  water_tds_before text,
  water_tds_after text,
  
  -- Equipment details
  equipment_model text,
  serial_number text,
  installation_date text,
  last_service_date text,
  
  -- Work details
  work_description text not null,
  parts_replaced text,
  materials_used text,
  time_spent text,
  
  -- Feedback
  satisfaction integer,
  customer_comments text,
  signature_required boolean default false,
  
  -- Follow up
  follow_up_needed boolean default false,
  follow_up_date text,
  follow_up_notes text,
  
  -- Metadata
  branch_id text not null,
  created_by text not null,
  status text not null,
  image_urls text[],

  -- Migration / Form V2 Fields
  property_type text,
  tank_capacity text,
  water_tds text,
  water_quality_issues text[] DEFAULT '{}',
  cleaning_concerns text[] DEFAULT '{}',
  appliance_issues text[] DEFAULT '{}',
  health_concerns text[] DEFAULT '{}',
  has_water_purifier boolean DEFAULT false,
  water_purifier_brand text,
  has_used_softener boolean DEFAULT false,
  branch_name text,
  sales_engineer_name text,
  client_company_name text,
  site_address text,
  industry_type text,
  contact_person_name text,
  designation text,
  mobile_number text,
  email_id text,
  water_source text[] DEFAULT '{}',
  water_source_other text,
  daily_water_consumption text,
  purpose_of_water_usage text[] DEFAULT '{}',
  purpose_other text,
  water_hardness_ppm text,
  scaling_issue_observed text,
  scaling_description text,
  existing_water_treatment text,
  existing_system_details text,
  problems_faced text[] DEFAULT '{}',
  problems_other text,
  maintenance_frequency text,
  customer_expectations text,
  application_area text[] DEFAULT '{}',
  application_other text,
  pipe_line_size text,
  operating_pressure text,
  operating_temperature text,
  ekotex_installation_feasible text,
  recommended_ekotex_model text,
  quantity_required text,
  site_constraints text,
  accessories_required text,
  customer_interest_level text,
  budget_discussed text,
  expected_decision_timeline text,
  decision_maker_identified text,
  existing_competitor_solution text,
  competitor_price_range text,
  customer_remarks text,
  site_photographs_taken boolean DEFAULT false,
  existing_system_photographs boolean DEFAULT false,
  problem_area_photographs boolean DEFAULT false,
  drawings_collected boolean DEFAULT false,
  next_action_required text[] DEFAULT '{}',
  next_action_other text,
  responsible_person text,
  expected_follow_up_date text,
  sales_engineer_remarks text,
  overall_site_assessment text,
  conversion_probability text,
  visited_by_signature text
);

-- 1.6 QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quotation_no TEXT NOT NULL,
    quotation_date DATE NOT NULL,
    validity TEXT,
    customer_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    email TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    item_name TEXT NOT NULL,
    item_description TEXT,
    rate NUMERIC,
    qty NUMERIC,
    discount_perc NUMERIC,
    region TEXT,
    branch_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- 2. TRIGGERS
-- =========================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- 3. STORAGE SETUP
-- =========================================================

-- Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('warranty-images', 'warranty-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-images', 'complaint-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id IN ('warranty-images', 'complaint-images'));
CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('warranty-images', 'complaint-images') AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (bucket_id IN ('warranty-images', 'complaint-images') AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id IN ('warranty-images', 'complaint-images') AND auth.role() = 'authenticated');

-- =========================================================
-- 4. RLS POLICIES (AUTHENTICATED ONLY)
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- 4.1 USERS POLICIES
CREATE POLICY "users_select_authenticated" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert_authenticated" ON public.users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated USING (auth.jwt() ->> 'email' = email);

-- 4.2 STOCK POLICIES
CREATE POLICY "stock_all_authenticated" ON public.stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4.3 SALES POLICIES
CREATE POLICY "sales_all_authenticated" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4.4 FIELD VISITS POLICIES
CREATE POLICY "field_visits_all_authenticated" ON public.field_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4.5 COMPLAINTS POLICIES
-- Special case: Public submission allowed for complaints as per latest orchestration
CREATE POLICY "Public Complaint Submission" ON public.complaints FOR INSERT TO public, anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Complaint Viewing" ON public.complaints FOR SELECT TO public, anon, authenticated USING (true);
CREATE POLICY "Admin Delete Control" ON public.complaints FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role IN ('Admin', 'Super Admin')));

-- 4.6 QUOTATIONS POLICIES
CREATE POLICY "quotations_all_authenticated" ON public.quotations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- 5. INITIAL DATA (OPTIONAL)
-- =========================================================
-- INSERT INTO users (email, name, role, branch_id) VALUES ('admin@mainbranch.com', 'Main Admin', 'Admin', 'main');

NOTIFY pgrst, 'reload schema';
