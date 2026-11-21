-- 005: Credit Card Requests, KYC Enhancements, and Card Prices
-- Run after 001_full_schema.sql
-- Compatible with Neon custom auth (uses 'users' table, not 'auth.users')

-- ==========================================
-- CREDIT CARD TIER PRICES (Admin Configurable)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.credit_card_prices (
    tier TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    color_scheme TEXT, -- JSON for card design colors
    benefits TEXT[], -- Array of benefit strings
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default card prices
INSERT INTO public.credit_card_prices (tier, name, price, description, color_scheme, benefits) VALUES
('starter', 'Starter Card', 430.00, 'Entry level credit card for everyday spending', 
 '{"primary": "#6366f1", "secondary": "#818cf8", "accent": "#f8fafc"}', 
 ARRAY['1% cashback on all purchases', 'No annual fee', 'Fraud protection', 'Mobile app access']),
('premium', 'Premium Card', 1800.00, 'Premium credit card with enhanced rewards', 
 '{"primary": "#0891b2", "secondary": "#06b6d4", "accent": "#f0fdfa"}', 
 ARRAY['2% cashback on all purchases', 'Travel insurance', 'Airport lounge access (2 visits/year)', 'Priority support', 'No foreign transaction fees']),
('master', 'Master Card', 2350.00, 'High-end credit card with premium benefits', 
 '{"primary": "#7c2d12", "secondary": "#ea580c", "accent": "#fef3f2"}', 
 ARRAY['3% cashback on all purchases', 'Comprehensive travel insurance', 'Unlimited airport lounge access', 'Concierge service', 'Purchase protection', 'No foreign transaction fees']),
('gold', 'Gold Card', 5520.00, 'Ultimate prestige credit card with exclusive privileges', 
 '{"primary": "#f59e0b", "secondary": "#fbbf24", "accent": "#fffbeb"}', 
 ARRAY['5% cashback on all purchases', 'Premium travel insurance', 'Unlimited airport lounge access + guest', '24/7 dedicated concierge', 'Purchase protection', 'Extended warranty', 'No foreign transaction fees', 'Exclusive event access'])
ON CONFLICT (tier) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    description = EXCLUDED.description,
    color_scheme = EXCLUDED.color_scheme,
    benefits = EXCLUDED.benefits,
    updated_at = timezone('utc'::text, now());

-- ==========================================
-- CREDIT CARD REQUESTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.credit_card_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    card_tier TEXT NOT NULL REFERENCES credit_card_prices(tier),
    requested_price NUMERIC(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_credit_card_requests_user_id ON public.credit_card_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_requests_status ON public.credit_card_requests(status);

-- ==========================================
-- KYC REQUESTS (create if not exists, then enhance)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.kyc_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add enhanced columns to kyc_requests
ALTER TABLE public.kyc_requests 
    ADD COLUMN IF NOT EXISTS document_front_url TEXT,
    ADD COLUMN IF NOT EXISTS document_back_url TEXT,
    ADD COLUMN IF NOT EXISTS admin_note TEXT,
    ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing document_url to document_front_url if it exists
UPDATE public.kyc_requests 
SET document_front_url = document_url 
WHERE document_front_url IS NULL AND document_url IS NOT NULL;

-- Indexes for kyc_requests
CREATE INDEX IF NOT EXISTS idx_kyc_requests_user_id ON public.kyc_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON public.kyc_requests(status);

-- ==========================================
-- PROFILE ENHANCEMENTS (add KYC and card status flags)
-- ==========================================
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS credit_card_tier TEXT REFERENCES credit_card_prices(tier),
    ADD COLUMN IF NOT EXISTS credit_card_status TEXT DEFAULT 'none' CHECK (credit_card_status IN ('none', 'pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS credit_card_approved_at TIMESTAMP WITH TIME ZONE;

-- ==========================================
-- NOTE: STORAGE BUCKETS (create in Neon dashboard)
-- ==========================================
-- 1. kyc-documents (private) - for KYC document uploads
-- 2. credit-card-designs (public) - optional, for card design images

-- ==========================================
-- ADMIN HELPER FUNCTION
-- ==========================================
-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGER FOR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to credit_card_prices
DROP TRIGGER IF EXISTS update_credit_card_prices_updated_at ON public.credit_card_prices;
CREATE TRIGGER update_credit_card_prices_updated_at
    BEFORE UPDATE ON public.credit_card_prices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- DEFAULT PRIVILEGES (for Neon custom auth)
-- ==========================================
-- These work with Neon's default postgres roles
GRANT SELECT ON public.credit_card_prices TO PUBLIC;
GRANT ALL ON public.credit_card_prices TO CURRENT_USER;
GRANT SELECT, INSERT ON public.credit_card_requests TO PUBLIC;
GRANT ALL ON public.credit_card_requests TO CURRENT_USER;
GRANT SELECT, INSERT, UPDATE ON public.kyc_requests TO PUBLIC;
GRANT ALL ON public.kyc_requests TO CURRENT_USER;