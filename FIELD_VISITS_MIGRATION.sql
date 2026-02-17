-- Migration to add missing columns to field_visits table
-- Run this in the Supabase SQL Editor

-- Residential Fields
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS tank_capacity text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS water_tds text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS water_quality_issues text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS cleaning_concerns text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS appliance_issues text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS health_concerns text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS has_water_purifier boolean DEFAULT false;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS water_purifier_brand text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS has_used_softener boolean DEFAULT false;

-- Industrial / New Form Fields
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS branch_name text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS sales_engineer_name text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS client_company_name text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS site_address text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS industry_type text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS contact_person_name text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS mobile_number text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS email_id text;

-- Water Details
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS water_source text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS water_source_other text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS daily_water_consumption text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS purpose_of_water_usage text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS purpose_other text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS water_hardness_ppm text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS scaling_issue_observed text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS scaling_description text;

-- Existing System
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS existing_water_treatment text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS existing_system_details text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS problems_faced text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS problems_other text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS maintenance_frequency text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS customer_expectations text;

-- Application
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS application_area text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS application_other text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS pipe_line_size text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS operating_pressure text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS operating_temperature text;

-- Technical
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS ekotex_installation_feasible text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS recommended_ekotex_model text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS quantity_required text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS site_constraints text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS accessories_required text;

-- Commercial
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS customer_interest_level text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS budget_discussed text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS expected_decision_timeline text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS decision_maker_identified text;

-- Competitor
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS existing_competitor_solution text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS competitor_price_range text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS customer_remarks text;

-- Photographs (Booleans)
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS site_photographs_taken boolean DEFAULT false;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS existing_system_photographs boolean DEFAULT false;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS problem_area_photographs boolean DEFAULT false;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS drawings_collected boolean DEFAULT false;

-- Action Plan
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS next_action_required text[] DEFAULT '{}';
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS next_action_other text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS responsible_person text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS expected_follow_up_date text;

-- Executive Remarks
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS sales_engineer_remarks text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS overall_site_assessment text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS conversion_probability text;
ALTER TABLE public.field_visits ADD COLUMN IF NOT EXISTS visited_by_signature text;
