-- 002: HELPER FUNCTIONS
-- Run after tables are created. Provides auth helper functions used by RLS policies.

-- ==========================================
-- is_admin: Check if the current user is an admin
-- Uses SECURITY DEFINER to bypass RLS recursion
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$;

-- ==========================================
-- is_inactive: Check if a user (or the current user) is inactive
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_inactive(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inactive BOOLEAN;
BEGIN
  SELECT COALESCE(is_inactive, FALSE) INTO v_inactive
  FROM public.profiles
  WHERE id = target_user_id;
  RETURN COALESCE(v_inactive, FALSE);
END;
$$;

-- ==========================================
-- admin_delete_user: Delete a user including their auth record
-- ==========================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;
END;
$$;

-- ==========================================
-- handle_new_user: Auto-create profile + account on signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    initial_account_type TEXT;
    f_name TEXT;
    l_name TEXT;
BEGIN
    initial_account_type := COALESCE(
        new.raw_user_meta_data->>'account_type',
        new.user_metadata->>'account_type',
        'checkings'
    );

    f_name := COALESCE(
        new.raw_user_meta_data->>'first_name',
        new.user_metadata->>'first_name',
        'New'
    );
    
    l_name := COALESCE(
        new.raw_user_meta_data->>'last_name',
        new.user_metadata->>'last_name',
        'User'
    );

    INSERT INTO public.profiles (id, first_name, last_name, username)
    VALUES (new.id, f_name, l_name, new.email)
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username;

    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = new.id) THEN
        INSERT INTO public.accounts (user_id, type, balance)
        VALUES (new.id, initial_account_type, 0);
    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RETURN new;
END;
$$;
