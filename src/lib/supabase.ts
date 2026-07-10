import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Mensaje claro en consola si faltan las variables de entorno.
  console.warn(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
  );
}

// Usamos placeholders si faltan las variables para que el build NO se rompa
// (createClient lanza si la URL está vacía). En runtime, sin variables reales,
// las consultas fallan y la app muestra la pantalla "sin conexión".
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder-anon-key",
  { auth: { persistSession: false } }
);

// Nombres de tabla (prefijo casa_ para convivir con otras apps
// en el mismo proyecto Supabase). Cambiá el prefijo acá si hace falta.
export const T = {
  usuarios: "casa_usuarios",
  categorias: "casa_categorias",
  ingresos: "casa_ingresos",
  gastos: "casa_gastos",
  tarjetas: "casa_tarjetas",
  compras: "casa_compras_tarjeta",
  cuotas: "casa_cuotas",
} as const;
