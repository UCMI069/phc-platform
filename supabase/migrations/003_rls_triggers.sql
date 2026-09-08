-- 003: RLS POLICIES & TRIGGERS
-- Run after tables and functions are created.
-- Enables Row Level Security on all tables and creates the auth trigger.

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_upgrade_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_upgrade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_deposit_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE USING (public.is_admin());

-- ==========================================
-- ACCOUNTS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "accounts_insert_policy" ON public.accounts;
CREATE POLICY "accounts_insert_policy" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_select_policy" ON public.accounts;
CREATE POLICY "accounts_select_policy" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "accounts_update_policy" ON public.accounts;
CREATE POLICY "accounts_update_policy" ON public.accounts
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "accounts_delete_policy" ON public.accounts;
CREATE POLICY "accounts_delete_policy" ON public.accounts
    FOR DELETE USING (public.is_admin());

-- ==========================================
-- TRANSACTIONS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
CREATE POLICY "transactions_select_policy" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
CREATE POLICY "transactions_insert_policy" ON public.transactions
    FOR INSERT WITH CHECK (
        (auth.uid() = user_id AND public.is_inactive(auth.uid()) = FALSE) OR public.is_admin()
    );

DROP POLICY IF EXISTS "transactions_update_policy" ON public.transactions;
CREATE POLICY "transactions_update_policy" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "transactions_delete_policy" ON public.transactions;
CREATE POLICY "transactions_delete_policy" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ==========================================
-- NOTIFICATIONS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "notifications_all_policy" ON public.notifications;
CREATE POLICY "notifications_all_policy" ON public.notifications
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- ==========================================
-- SUPPORT MESSAGES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "support_insert_policy" ON public.support_messages;
CREATE POLICY "support_insert_policy" ON public.support_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_inactive(auth.uid()) = FALSE);

DROP POLICY IF EXISTS "support_select_policy" ON public.support_messages;
CREATE POLICY "support_select_policy" ON public.support_messages
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "support_update_policy" ON public.support_messages;
CREATE POLICY "support_update_policy" ON public.support_messages
    FOR UPDATE USING (public.is_admin());

-- ==========================================
-- ACCOUNT UPGRADE PRICES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "upgrade_prices_select_policy" ON public.account_upgrade_prices;
CREATE POLICY "upgrade_prices_select_policy" ON public.account_upgrade_prices
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "upgrade_prices_admin_policy" ON public.account_upgrade_prices;
CREATE POLICY "upgrade_prices_admin_policy" ON public.account_upgrade_prices
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- ACCOUNT UPGRADE REQUESTS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "upgrade_requests_select_policy" ON public.account_upgrade_requests;
CREATE POLICY "upgrade_requests_select_policy" ON public.account_upgrade_requests
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "upgrade_requests_insert_policy" ON public.account_upgrade_requests;
CREATE POLICY "upgrade_requests_insert_policy" ON public.account_upgrade_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "upgrade_requests_update_policy" ON public.account_upgrade_requests;
CREATE POLICY "upgrade_requests_update_policy" ON public.account_upgrade_requests
    FOR UPDATE USING (public.is_admin());

-- ==========================================
-- CRYPTO DEPOSIT DETAILS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "crypto_deposit_select_policy" ON public.crypto_deposit_details;
CREATE POLICY "crypto_deposit_select_policy" ON public.crypto_deposit_details
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crypto_deposit_admin_policy" ON public.crypto_deposit_details;
CREATE POLICY "crypto_deposit_admin_policy" ON public.crypto_deposit_details
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- CARDS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "cards_select_policy" ON public.cards;
CREATE POLICY "cards_select_policy" ON public.cards
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "cards_insert_policy" ON public.cards;
CREATE POLICY "cards_insert_policy" ON public.cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cards_update_policy" ON public.cards;
CREATE POLICY "cards_update_policy" ON public.cards
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- ==========================================
-- KYC REQUESTS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "kyc_select_policy" ON public.kyc_requests;
CREATE POLICY "kyc_select_policy" ON public.kyc_requests
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "kyc_insert_policy" ON public.kyc_requests;
CREATE POLICY "kyc_insert_policy" ON public.kyc_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kyc_update_policy" ON public.kyc_requests;
CREATE POLICY "kyc_update_policy" ON public.kyc_requests
    FOR UPDATE USING (public.is_admin());

-- ==========================================
-- AUTH TRIGGER
-- Auto-create profile + account when a new user signs up
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
