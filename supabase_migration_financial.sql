-- ============================================================
-- MIGRACIÓN: Sistema Financiero BarberChop
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- 1. Vincular citas a liquidaciones (para saber cuáles ya fueron pagadas al barbero)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS settlement_id uuid REFERENCES public.settlements(id) ON DELETE SET NULL;

-- 2. Agregar período mensual a gastos (formato 'YYYY-MM', ej: '2026-05')
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS period text;

-- Rellenar el period en gastos existentes basándose en expense_date
UPDATE public.expenses
  SET period = TO_CHAR(expense_date, 'YYYY-MM')
  WHERE period IS NULL;

-- 3. Registrar quién realizó la liquidación
ALTER TABLE public.settlements
  ADD COLUMN IF NOT EXISTS settled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text;

-- 4. Tabla de categorías de gastos personalizadas
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id   uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT 'receipt',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id),
  CONSTRAINT expense_categories_name_key UNIQUE (name)
);

-- Categorías por defecto
INSERT INTO public.expense_categories (name, icon) VALUES
  ('Arriendo',          'home'),
  ('Servicios Públicos','zap'),
  ('Insumos',           'package'),
  ('Nómina Fija',       'users'),
  ('Mantenimiento',     'tool'),
  ('Publicidad',        'megaphone'),
  ('Otros',             'more-horizontal')
ON CONFLICT (name) DO NOTHING;

-- 5. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_appointments_settlement_id ON public.appointments(settlement_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_settlement ON public.appointments(barber_id, settlement_id);
CREATE INDEX IF NOT EXISTS idx_expenses_period ON public.expenses(period);
