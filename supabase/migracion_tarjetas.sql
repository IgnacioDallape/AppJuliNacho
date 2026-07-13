-- ============================================================
-- appCasa · Migración: cuotas en "Agregar gasto", resumen futuro
-- y pagos parciales de tarjeta.
-- Ejecutar en Supabase → SQL Editor. Es ADITIVA e idempotente:
-- no borra ni modifica datos existentes.
-- ============================================================

-- Tarjetas: día de cierre y vencimiento (opcionales)
alter table casa_tarjetas add column if not exists dia_cierre int;
alter table casa_tarjetas add column if not exists dia_vencimiento int;

-- Compra con tarjeta (= gasto con tarjeta): guardar quién pagó y el tipo,
-- para no perder esos campos del formulario de gasto.
alter table casa_compras_tarjeta
  add column if not exists pagado_por uuid references casa_usuarios(id) on delete set null;
alter table casa_compras_tarjeta
  add column if not exists tipo text not null default 'personal'
  check (tipo in ('personal','compartido'));

-- Pagos parciales de tarjeta
create table if not exists casa_pagos_tarjeta (
  id         uuid primary key default gen_random_uuid(),
  tarjeta_id uuid not null references casa_tarjetas(id) on delete cascade,
  monto      numeric(14,2) not null check (monto > 0),
  fecha      date not null default current_date,
  creado_en  timestamptz not null default now()
);
create index if not exists idx_casa_pagos_tarjeta on casa_pagos_tarjeta(tarjeta_id);
create index if not exists idx_casa_pagos_fecha    on casa_pagos_tarjeta(fecha);

alter table casa_pagos_tarjeta enable row level security;
drop policy if exists "acceso_publico" on casa_pagos_tarjeta;
create policy "acceso_publico" on casa_pagos_tarjeta for all using (true) with check (true);
