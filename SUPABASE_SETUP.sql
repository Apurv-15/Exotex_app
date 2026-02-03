-- Field Visits Table
create table if not exists public.field_visits (
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
  visit_type text not null, -- 'Installation', 'Maintenance', 'Inspection', 'Complaint'
  
  -- Technical Info
  purpose text not null,
  priority text not null, -- 'Low', 'Medium', 'High', 'Critical'
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
  status text not null, -- 'pending', 'completed', 'cancelled'
  image_urls text[]
);

-- Enable RLS
alter table public.field_visits enable row level security;

-- Policies for public access (adjust as needed for better security later)
create policy "Enable all access for all users" on public.field_visits
for all using (true) with check (true);

-- STORAGE SETUP
-- Create the bucket if it doesn't exist (this usually needs to be done in UI, but SQL can sometimes do it)
insert into storage.buckets (id, name, public)
values ('warranty-images', 'warranty-images', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access" on storage.objects for select
using ( bucket_id = 'warranty-images' );

create policy "Authenticated uploads" on storage.objects for insert
with check ( bucket_id = 'warranty-images' );

create policy "Authenticated updates" on storage.objects for update
with check ( bucket_id = 'warranty-images' );
