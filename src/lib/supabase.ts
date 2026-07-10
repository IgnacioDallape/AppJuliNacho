import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Mensaje claro en consola si faltan las variables de entorno.
  console.warn(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
  );
}

export const supabase = createClient(url ?? "", key ?? "", {
  auth: { persistSession: false },
});

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
