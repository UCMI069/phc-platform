-- 004: SEED DATA
-- Run after migrations 001-003 to insert default data.

-- ==========================================
-- ACCOUNT UPGRADE PRICING
-- ==========================================
INSERT INTO public.account_upgrade_prices (tier, price)
VALUES
    ('starter', 0),
    ('vip', 0),
    ('gold', 0),
    ('platinum', 0)
ON CONFLICT (tier) DO NOTHING;

-- ==========================================
-- STORAGE BUCKETS
-- Run these in the Supabase SQL editor or create them manually:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a bucket called "avatars" (public)
-- 3. Create a bucket called "crypto_qr" (public)

-- If you prefer SQL (requires service_role key):
-- SELECT supabase_storage.create_bucket('avatars', { public: true });
-- SELECT supabase_storage.create_bucket('crypto_qr', { public: true });
