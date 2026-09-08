-- 001: CORE TABLES
-- Run this first to create all base tables for the GCU Banking platform.

-- ==========================================
-- PROFILES (extends auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    phone TEXT,
    country TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    blocked BOOLEAN DEFAULT FALSE,
    is_inactive BOOLEAN DEFAULT FALSE,
    account_level TEXT DEFAULT 'starter',
    currency TEXT DEFAULT 'GBP',
    deposit_bank_name TEXT,
    deposit_account_number TEXT,
    deposit_sort_code TEXT,
    deposit_recipient_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- ACCOUNTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    type TEXT DEFAULT 'checkings',
    active BOOLEAN DEFAULT TRUE,
    tier TEXT DEFAULT 'Standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- TRANSACTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    direction TEXT CHECK (direction IN ('credit', 'debit')),
    description TEXT,
    status TEXT DEFAULT 'posted',
    recipient_name TEXT,
    recipient_account TEXT,
    recipient_bank TEXT,
    recipient_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- SUPPORT MESSAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- CARDS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    card_holder TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    cvv TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired')),
    type TEXT DEFAULT 'debit',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- KYC REQUESTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.kyc_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- ACCOUNT UPGRADE PRICES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.account_upgrade_prices (
    tier TEXT PRIMARY KEY,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ACCOUNT UPGRADE REQUESTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.account_upgrade_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_price NUMERIC(15, 2),
    approved_price NUMERIC(15, 2),
    admin_note TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- CRYPTO DEPOSIT DETAILS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.crypto_deposit_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency TEXT NOT NULL,
    network TEXT,
    wallet_address TEXT NOT NULL,
    qr_image_url TEXT,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS crypto_deposit_details_currency_network_unique
    ON public.crypto_deposit_details (lower(currency), COALESCE(lower(network), ''));
