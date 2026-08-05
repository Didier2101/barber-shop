-- Crear tabla para los cierres mensuales financieros del local
CREATE TABLE public.shop_monthly_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE, -- Formato YYYY-MM ej '2026-06'
  total_sales numeric NOT NULL DEFAULT 0,
  barbers_cut numeric NOT NULL DEFAULT 0,
  shop_earnings numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  net_profit numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'closed'::text CHECK (status = ANY (ARRAY['closed'::text, 'draft'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  closed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT shop_monthly_balances_pkey PRIMARY KEY (id)
);

-- Políticas RLS (Opcional, si tienes RLS activado)
ALTER TABLE public.shop_monthly_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow owner full access to monthly balances" ON public.shop_monthly_balances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );
