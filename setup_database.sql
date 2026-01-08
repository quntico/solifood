-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: quotations
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    theme_key TEXT UNIQUE NOT NULL,
    company TEXT,
    project TEXT,
    client TEXT,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    logo TEXT, -- Stores Base64 or URL
    favicon TEXT,
    logo_size INTEGER DEFAULT 210,
    banner_text TEXT,
    banner_direction TEXT DEFAULT 'left-to-right',
    banner_scale INTEGER DEFAULT 40,
    idle_timeout INTEGER DEFAULT 4,
    initial_display_time INTEGER DEFAULT 2,
    hide_banner BOOLEAN DEFAULT false,
    brand_color TEXT DEFAULT 'solimaq',
    
    -- Timeline / Phases
    phase1_name TEXT DEFAULT 'Confirmación y Orden',
    phase1_duration INTEGER DEFAULT 5,
    phase2_name TEXT DEFAULT 'Tiempo de Fabricación',
    phase2_duration INTEGER DEFAULT 75,
    phase3_name TEXT DEFAULT 'Transporte',
    phase3_duration INTEGER DEFAULT 10,
    phase4_name TEXT DEFAULT 'Instalación y Puesta en Marcha',
    -- Note: phase4_duration might be missing in some app versions, adding if needed or just relying on text
    
    slug TEXT UNIQUE,
    is_home BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false
);

-- 2. Table: machines (Inferred minimal structure)
CREATE TABLE IF NOT EXISTS public.machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
    theme_key TEXT, -- Legacy link
    name TEXT,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    technical_specs JSONB -- Flexible column for specs
);

-- 3. Table: images
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
    theme_key TEXT,
    url TEXT,
    type TEXT, -- e.g., 'gallery', 'render'
    caption TEXT
);

-- 4. Table: pdf_quotations
CREATE TABLE IF NOT EXISTS public.pdf_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
    theme_key TEXT,
    url TEXT NOT NULL,
    name TEXT
);

-- 5. Table: process_conditions
CREATE TABLE IF NOT EXISTS public.process_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
    condition_text TEXT,
    category TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_conditions ENABLE ROW LEVEL SECURITY;

-- Create OPEN Policies (Public Read/Write) - WARN: Only for Dev/Demo
-- Policy for quotations
CREATE POLICY "Public Access Quotations" ON public.quotations
FOR ALL USING (true) WITH CHECK (true);

-- Policy for machines
CREATE POLICY "Public Access Machines" ON public.machines
FOR ALL USING (true) WITH CHECK (true);

-- Policy for images
CREATE POLICY "Public Access Images" ON public.images
FOR ALL USING (true) WITH CHECK (true);

-- Policy for pdf_quotations
CREATE POLICY "Public Access PDFs" ON public.pdf_quotations
FOR ALL USING (true) WITH CHECK (true);

-- Policy for process_conditions
CREATE POLICY "Public Access Conditions" ON public.process_conditions
FOR ALL USING (true) WITH CHECK (true);

-- Insert a default 'Home' quotation to prevent app errors on first load
INSERT INTO public.quotations (theme_key, project, client, is_home, title, description)
VALUES 
('default-home', 'Proyecto Demo', 'Cliente Default', true, 'Bienvenido', 'Cotización generada automáticamente.');
