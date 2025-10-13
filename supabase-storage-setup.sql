-- =====================================================
-- Supabase Storage Setup for Blog Images
-- =====================================================
-- Kjør dette scriptet i Supabase SQL Editor

-- 1. Opprett Storage Bucket for blog bilder
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- 2. Opprett RLS policies for blog-images bucket

-- Policy: Alle kan se/laste ned bilder (public read)
CREATE POLICY "Public read access for blog images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');

-- Policy: Autoriserte brukere kan laste opp bilder
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Autoriserte brukere kan oppdatere sine egne bilder
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'blog-images'
  AND auth.role() = 'authenticated'
);

-- Policy: Autoriserte brukere kan slette bilder
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blog-images'
  AND auth.role() = 'authenticated'
);

-- 3. Utvid blogginnlegg tabell med bilde-støtte
ALTER TABLE public.blogginnlegg 
ADD COLUMN IF NOT EXISTS featured_image TEXT,
ADD COLUMN IF NOT EXISTS image_gallery TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 4. Opprett indekser for bedre ytelse
CREATE INDEX IF NOT EXISTS idx_blogginnlegg_featured_image 
ON public.blogginnlegg(featured_image);

-- 5. Kommenter på nye kolonner
COMMENT ON COLUMN public.blogginnlegg.featured_image 
IS 'URL til hovedbilde for blogginnlegget';

COMMENT ON COLUMN public.blogginnlegg.image_gallery 
IS 'Array med URLs til alle bilder tilknyttet blogginnlegget';

-- =====================================================
-- Test Storage Setup (kjør for å verifisere)
-- =====================================================

-- Sjekk at bucket er opprettet
SELECT * FROM storage.buckets WHERE id = 'blog-images';

-- Sjekk at policies er aktive
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%blog%';

-- Sjekk at tabellen er utvidet
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'blogginnlegg' 
AND column_name IN ('featured_image', 'image_gallery');

-- =====================================================
-- VIKTIGE NOTATER:
-- =====================================================
-- 1. Kjør dette scriptet i Supabase Dashboard > SQL Editor
-- 2. Verifiser at RLS er aktivert på storage.objects tabellen
-- 3. Test opplasting fra frontend etter implementering
-- 4. Bilde-URLs vil ha format: 
--    https://[project].supabase.co/storage/v1/object/public/blog-images/[filename]
-- =====================================================
