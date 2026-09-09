-- ============================================
-- PHC Platform — Auth Migration
-- Users table + auth functions for Neon
-- ============================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- SIGNUP FUNCTION
-- Returns the new user (without password_hash)
-- ==========================================
CREATE OR REPLACE FUNCTION public.signup_user(
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT DEFAULT 'New',
    p_last_name TEXT DEFAULT 'User',
    p_account_type TEXT DEFAULT 'checkings'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    new_user RECORD;
    new_profile RECORD;
    new_account RECORD;
    result JSON;
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE email = lower(p_email)) THEN
        RETURN json_build_object('error', 'An account with this email already exists');
    END IF;

    -- Insert user with hashed password
    INSERT INTO public.users (email, password_hash)
    VALUES (lower(p_email), crypt(p_password, gen_salt('bf')))
    RETURNING id, email INTO new_user;

    -- Create profile
    INSERT INTO public.profiles (id, first_name, last_name, username, currency)
    VALUES (new_user.id, p_first_name, p_last_name, lower(p_email), 'GBP')
    RETURNING * INTO new_profile;

    -- Create account
    INSERT INTO public.accounts (user_id, type, balance, active, tier)
    VALUES (new_user.id, p_account_type, 0.00, true, 'Standard')
    RETURNING * INTO new_account;

    -- Return user info (no password_hash)
    result := json_build_object(
        'id', new_user.id,
        'email', new_user.email,
        'first_name', new_profile.first_name,
        'last_name', new_profile.last_name,
        'created_at', new_user.created_at
    );

    RETURN result;
END;
$$;

-- ==========================================
-- SIGNIN FUNCTION
-- Returns user info if credentials match
-- ==========================================
CREATE OR REPLACE FUNCTION public.signin_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    found_user RECORD;
    found_profile RECORD;
    result JSON;
BEGIN
    -- Find user and verify password
    SELECT id, email, created_at INTO found_user
    FROM public.users
    WHERE email = lower(p_email)
      AND password_hash = crypt(p_password, password_hash);

    IF found_user IS NULL THEN
        RETURN json_build_object('error', 'Invalid email or password');
    END IF;

    -- Get profile
    SELECT first_name, last_name INTO found_profile
    FROM public.profiles
    WHERE id = found_user.id;

    result := json_build_object(
        'id', found_user.id,
        'email', found_user.email,
        'first_name', found_profile.first_name,
        'last_name', found_profile.last_name,
        'created_at', found_user.created_at
    );

    RETURN result;
END;
$$;

-- ==========================================
-- GET USER BY ID
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_user_by_id(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    found_user RECORD;
    found_profile RECORD;
    result JSON;
BEGIN
    SELECT id, email, created_at INTO found_user
    FROM public.users
    WHERE id = p_user_id;

    IF found_user IS NULL THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    SELECT first_name, last_name, phone, country, avatar_url, is_admin, blocked, account_level, currency
    INTO found_profile
    FROM public.profiles
    WHERE id = p_user_id;

    result := json_build_object(
        'id', found_user.id,
        'email', found_user.email,
        'first_name', COALESCE(found_profile.first_name, ''),
        'last_name', COALESCE(found_profile.last_name, ''),
        'phone', COALESCE(found_profile.phone, ''),
        'country', COALESCE(found_profile.country, ''),
        'avatar_url', COALESCE(found_profile.avatar_url, ''),
        'is_admin', COALESCE(found_profile.is_admin, false),
        'blocked', COALESCE(found_profile.blocked, false),
        'account_level', COALESCE(found_profile.account_level, 'starter'),
        'currency', COALESCE(found_profile.currency, 'GBP'),
        'created_at', found_user.created_at
    );

    RETURN result;
END;
$$;

-- ==========================================
-- UPDATE PASSWORD
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_password(
    p_user_id UUID,
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify old password
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = p_user_id
          AND password_hash = crypt(p_old_password, password_hash)
    ) THEN
        RETURN json_build_object('error', 'Current password is incorrect');
    END IF;

    -- Update to new password
    UPDATE public.users
    SET password_hash = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_user_id;

    RETURN json_build_object('success', true);
END;
$$;
