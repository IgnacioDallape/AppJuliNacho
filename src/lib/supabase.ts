import { createClient } from "@supabase/supabase-js";

// Config de Supabase. La anon key es PÚBLICA por diseño (viaja en el bundle
// del navegador), por eso la dejamos como valor por defecto: así la app
// funciona en cualquier deploy sin configurar nada extra.
// Si querés sobreescribirla (otro proyecto), definí las variables de entorno
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY y tienen prioridad.
const DEFAULT_URL = "https://eqenqgrqvjithlayrezv.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZW5xZ3JxdmppdGhsYXlyZXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDE2NTUsImV4cCI6MjA5MjQ3NzY1NX0.wkx8mAF0YndymIAfHfroncI0C8ql2rp8UweUPL1evg4";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = createClient(url, key, {
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
