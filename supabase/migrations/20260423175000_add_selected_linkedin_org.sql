-- Add columns to store selected LinkedIn organization details
ALTER TABLE public.social_accounts
ADD COLUMN selected_org_id TEXT,
ADD COLUMN selected_org_name TEXT;
