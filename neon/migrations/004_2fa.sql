-- ============================================
-- PHC Platform — 2FA Migration
-- Adds TOTP (Google Authenticator) support
-- ============================================

-- Add 2FA columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS totp_verified BOOLEAN DEFAULT FALSE;

-- Create a transfer_tokens table for single-use transfer 2FA tokens
CREATE TABLE IF NOT EXISTS public.transfer_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_tokens_user_id ON public.transfer_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_tokens_token ON public.transfer_tokens(token);
