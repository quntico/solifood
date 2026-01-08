-- Add sections_config column to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS sections_config JSONB;

-- Notify success
DO $$
BEGIN
    RAISE NOTICE 'Column sections_config added successfully';
END $$;
