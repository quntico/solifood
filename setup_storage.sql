-- 1. Create the 'quotation-files' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotation-files', 'quotation-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the 'layout-images' bucket (optional fallback)
INSERT INTO storage.buckets (id, name, public)
VALUES ('layout-images', 'layout-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create the 'quotation-pdfs' bucket (optional fallback)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotation-pdfs', 'quotation-pdfs', true)
ON CONFLICT (id) DO NOTHING;


-- 4. Enable RLS on storage.objects (usually enabled by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- 5. Create Permissive Policy for 'quotation-files'
-- Allow public SELECT (Download)
CREATE POLICY "Public Select quotation-files" ON storage.objects
FOR SELECT USING (bucket_id = 'quotation-files');

-- Allow public INSERT (Upload)
CREATE POLICY "Public Insert quotation-files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'quotation-files');

-- Allow public UPDATE (Replace)
CREATE POLICY "Public Update quotation-files" ON storage.objects
FOR UPDATE USING (bucket_id = 'quotation-files');

-- Allow public DELETE (Remove)
CREATE POLICY "Public Delete quotation-files" ON storage.objects
FOR DELETE USING (bucket_id = 'quotation-files');


-- 6. Repeat Permissive Policies for 'layout-images' & 'quotation-pdfs' just in case
CREATE POLICY "Public Access layout-images" ON storage.objects
FOR ALL USING (bucket_id = 'layout-images') WITH CHECK (bucket_id = 'layout-images');

CREATE POLICY "Public Access quotation-pdfs" ON storage.objects
FOR ALL USING (bucket_id = 'quotation-pdfs') WITH CHECK (bucket_id = 'quotation-pdfs');
