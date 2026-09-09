-- Fix signup_user function
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
    result JSON;
BEGIN
    IF EXISTS (SELECT 1 FROM public.users WHERE email = lower(p_email)) THEN
        RETURN json_build_object('error', 'An account with this email already exists');
    END IF;

    INSERT INTO public.users (email, password_hash)
    VALUES (lower(p_email), crypt(p_password, gen_salt('bf')))
    RETURNING id, email, created_at INTO new_user;

    INSERT INTO public.profiles (id, first_name, last_name, username, currency)
    VALUES (new_user.id, p_first_name, p_last_name, lower(p_email), 'GBP')
    RETURNING * INTO new_profile;

    INSERT INTO public.accounts (user_id, type, balance, active, tier)
    VALUES (new_user.id, p_account_type, 0.00, true, 'Standard');

    result := json_build_object(
        'id', new_user.id,
        'email', new_user.email,
        'firstName', new_profile.first_name,
        'lastName', new_profile.last_name,
        'createdAt', new_user.created_at
    );

    RETURN result;
END;
$$;

-- Fix signin_user function
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
    SELECT id, email, created_at INTO found_user
    FROM public.users
    WHERE email = lower(p_email)
      AND password_hash = crypt(p_password, password_hash);

    IF found_user IS NULL THEN
        RETURN json_build_object('error', 'Invalid email or password');
    END IF;

    SELECT first_name, last_name, is_admin, blocked, account_level, currency
    INTO found_profile
    FROM public.profiles
    WHERE id = found_user.id;

    result := json_build_object(
        'id', found_user.id,
        'email', found_user.email,
        'firstName', found_profile.first_name,
        'lastName', found_profile.last_name,
        'isAdmin', COALESCE(found_profile.is_admin, false),
        'blocked', COALESCE(found_profile.blocked, false),
        'accountLevel', COALESCE(found_profile.account_level, 'starter'),
        'currency', COALESCE(found_profile.currency, 'GBP'),
        'createdAt', found_user.created_at
    );

    RETURN result;
END;
$$;
