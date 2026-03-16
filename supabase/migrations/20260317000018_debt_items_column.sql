-- Migration défensive : colonnes potentiellement absentes du schéma initial des dettes
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS creditor_name TEXT;
