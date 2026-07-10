-- ============================================================
-- appCasa · Finanzas de pareja (Juli & Nacho)
-- Tablas con prefijo casa_ para convivir con otras apps en el
-- mismo proyecto Supabase sin pisarse.
-- Ejecutar este archivo completo en Supabase → SQL Editor.
-- Es idempotente: se puede correr varias veces sin romper datos.
-- ============================================================

-- ---------- Tablas ----------

create table if not exists casa_usuarios (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique
);

create table if not exists casa_categorias (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  icono      text not null default 'tag',
  orden      int  not null default 0
);

create table if not exists casa_ingresos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references casa_usuarios(id) on delete cascade,
  importe     numeric(14,2) not null check (importe >= 0),
  fecha       date not null default current_date,
  descripcion text,
  creado_en   timestamptz not null default now()
);

create table if not exists casa_gastos (
  id           uuid primary key default gen_random_uuid(),
  importe      numeric(14,2) not null check (importe >= 0),
  fecha        date not null default current_date,
  categoria_id uuid references casa_categorias(id) on delete set null,
  pagado_por   uuid not null references casa_usuarios(id) on delete cascade,
  tipo         text not null default 'personal' check (tipo in ('personal','compartido')),
  descripcion  text,
  es_mensual   boolean not null default false,
  recurrente_id uuid,           -- agrupa las copias de un gasto mensual
  creado_en    timestamptz not null default now()
);

create table if not exists casa_tarjetas (
  id         uuid primary key default gen_random_uuid(),
  titular_id uuid not null references casa_usuarios(id) on delete cascade,
  tipo       text not null check (tipo in ('Visa','Mastercard')),
  banco      text not null,
  nombre     text,
  creado_en  timestamptz not null default now()
);

create table if not exists casa_compras_tarjeta (
  id             uuid primary key default gen_random_uuid(),
  tarjeta_id     uuid not null references casa_tarjetas(id) on delete cascade,
  importe_total  numeric(14,2) not null check (importe_total >= 0),
  fecha          date not null default current_date,
  descripcion    text,
  categoria_id   uuid references casa_categorias(id) on delete set null,
  cantidad_cuotas int not null default 1 check (cantidad_cuotas >= 1),
  creado_en      timestamptz not null default now()
);

create table if not exists casa_cuotas (
  id         uuid primary key default gen_random_uuid(),
  compra_id  uuid not null references casa_compras_tarjeta(id) on delete cascade,
  numero     int  not null,          -- 1..cantidad_cuotas
  importe    numeric(14,2) not null,
  mes        text not null,          -- 'YYYY-MM'
  pagada     boolean not null default false
);

-- ---------- Índices útiles ----------
create index if not exists idx_casa_ingresos_fecha on casa_ingresos(fecha);
create index if not exists idx_casa_gastos_fecha   on casa_gastos(fecha);
create index if not exists idx_casa_cuotas_mes      on casa_cuotas(mes);
create index if not exists idx_casa_cuotas_compra   on casa_cuotas(compra_id);

-- ---------- Semillas ----------

insert into casa_usuarios (nombre) values ('Juli'), ('Nacho')
on conflict (nombre) do nothing;

insert into casa_categorias (nombre, icono, orden) values
  ('Alquiler',           'home',        1),
  ('Servicios',          'bolt',        2),
  ('Supermercado',       'shopping-cart', 3),
  ('Comida',             'tools-kitchen-2', 4),
  ('Transporte',         'car',         5),
  ('Salud',              'heart',       6),
  ('Mascotas',           'paw',         7),
  ('Salidas',            'glass',       8),
  ('Compras personales', 'shopping-bag', 9),
  ('Gastos hormiga',     'coffee',      10),
  ('Gastos generales',   'basket',      11),
  ('Otros',              'dots',        12)
on conflict (nombre) do nothing;

-- ---------- Row Level Security ----------
-- App privada de 2 personas sin login: permitimos acceso con la anon key.
alter table casa_usuarios        enable row level security;
alter table casa_categorias      enable row level security;
alter table casa_ingresos        enable row level security;
alter table casa_gastos          enable row level security;
alter table casa_tarjetas        enable row level security;
alter table casa_compras_tarjeta enable row level security;
alter table casa_cuotas          enable row level security;

do $$
declare t text;
begin
  foreach t in array array['casa_usuarios','casa_categorias','casa_ingresos','casa_gastos','casa_tarjetas','casa_compras_tarjeta','casa_cuotas']
  loop
    execute format('drop policy if exists "acceso_publico" on %I;', t);
    execute format('create policy "acceso_publico" on %I for all using (true) with check (true);', t);
  end loop;
end $$;
