-- 005: STORAGE BUCKET POLICIES
-- Run this in the Supabase SQL Editor after creating the buckets.
-- Without these, uploads will fail with 403/unauthorized even if buckets are set to Public.

-- ==========================================
-- AVATARS BUCKET POLICIES
-- ==========================================
-- Allow authenticated users to upload avatars
CREATE POLICY "avatars_insert_policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND auth.role() = 'authenticated'
    );

-- Allow public read access to avatars
CREATE POLICY "avatars_select_policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatar files
CREATE POLICY "avatars_update_policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own avatar files
CREATE POLICY "avatars_delete_policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ==========================================
-- CRYPTO QR BUCKET POLICIES
-- ==========================================
-- Allow authenticated users to upload QR codes (admin panel handles auth)
CREATE POLICY "crypto_qr_insert_policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'crypto_qr' AND auth.role() = 'authenticated'
    );

-- Allow public read access to QR codes
CREATE POLICY "crypto_qr_select_policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'crypto_qr');

-- Allow admin to update QR files
CREATE POLICY "crypto_qr_update_policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'crypto_qr' AND auth.role() = 'authenticated'
    );

-- Allow admin to delete QR files
CREATE POLICY "crypto_qr_delete_policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'crypto_qr' AND auth.role() = 'authenticated'
    );
