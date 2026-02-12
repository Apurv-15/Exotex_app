-- Create stock table
CREATE TABLE IF NOT EXISTS public.stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region TEXT NOT NULL,
    model_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(region, model_name)
);

-- Enable RLS
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins have full access to stock"
    ON public.stock FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Admin'
        )
    );

CREATE POLICY "Users can read stock for their region"
    ON public.stock FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.region = stock.region
        )
    );
