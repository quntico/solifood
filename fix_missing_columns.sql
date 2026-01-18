-- Add video_url column to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add updated_at column to quotations table (if missing)
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Notify success
DO $$
BEGIN
    RAISE NOTICE 'Columns video_url and updated_at added successfully';
END $$;
