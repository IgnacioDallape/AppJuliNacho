import { supabase, T } from "./supabase";
import { addMonths, monthOfDate } from "./format";
import type {
  Categoria,
  CompraTarjeta,
  Cuota,
  Gasto,
  Ingreso,
  Tarjeta,
  TipoGasto,
  TipoTarjeta,
  Usuario,
} from "./types";

// ---------------- Catálogos ----------------

export async function getUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase.from(T.usuarios).select("*").order("nombre");
  if (error) throw error;
  return (data ?? []) as Usuario[];
}

export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.from(T.categorias).select("*").order("orden");
  if (error) throw error;
  return (data ?? []) as Categoria[];
}

// ---------------- Ingresos ----------------

export async function getIngresosDelMes(mk: string): Promise<Ingreso[]> {
  const { data, error } = await supabase
    .from(T.ingresos)
    .select("*")
    .gte("fecha", `${mk}-01`)
    .lte("fecha", `${mk}-31`)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ingreso[];
}

export async function crearIngreso(input: {
  usuario_id: string;
  importe: number;
  fecha: string;
  descripcion?: string | null;
}): Promise<void> {
  const { error } = await supabase.from(T.ingresos).insert(input);
  if (error) throw error;
}

export async function actualizarIngreso(id: string, patch: Partial<Ingreso>): Promise<void> {
  const { error } = await supabase.from(T.ingresos).update(patch).eq("id", id);
  if (error) throw error;
}

export async function eliminarIngreso(id: string): Promise<void> {
  const { error } = await supabase.from(T.ingresos).delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Gastos ----------------

export async function getGastosDelMes(mk: string): Promise<Gasto[]> {
  const { data, error } = await supabase
    .from(T.gastos)
    .select("*")
    .gte("fecha", `${mk}-01`)
    .lte("fecha", `${mk}-31`)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Gasto[];
}

export async function crearGasto(input: {
  importe: number;
  fecha: string;
  categoria_id: string | null;
  pagado_por: string;
  tipo: TipoGasto;
  descripcion?: string | null;
  es_mensual?: boolean;
}): Promise<void> {
  const esMensual = !!input.es_mensual;

  if (!esMensual) {
    const { error } = await supabase.from(T.gastos).insert({ ...input, es_mensual: false });
    if (error) throw error;
    return;
  }

  // Gasto mensual: se replica en el mes actual + los 5 siguientes,
  // compartiendo recurrente_id para poder identificarlos.
  const recurrente_id = crypto.randomUUID();
  const baseMes = monthOfDate(input.fecha);
  const dia = input.fecha.slice(8, 10);
  const filas = Array.from({ length: 6 }, (_, i) => {
    const mes = addMonths(baseMes, i);
    return {
      importe: input.importe,
      fecha: `${mes}-${dia}`,
      categoria_id: input.categoria_id,
      pagado_por: input.pagado_por,
      tipo: input.tipo,
      descripcion: input.descripcion ?? null,
      es_mensual: true,
      recurrente_id,
    };
  });
  const { error } = await supabase.from(T.gastos).insert(filas);
  if (error) throw error;
}

export async function actualizarGasto(id: string, patch: Partial<Gasto>): Promise<void> {
  const { error } = await supabase.from(T.gastos).update(patch).eq("id", id);
  if (error) throw error;
}

export async function eliminarGasto(id: string): Promise<void> {
  const { error } = await supabase.from(T.gastos).delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Tarjetas ----------------

export async function getTarjetas(): Promise<Tarjeta[]> {
  const { data, error } = await supabase
    .from(T.tarjetas)
    .select("*")
    .order("creado_en");
  if (error) throw error;
  return (data ?? []) as Tarjeta[];
}

export async function crearTarjeta(input: {
  titular_id: string;
  tipo: TipoTarjeta;
  banco: string;
  nombre?: string | null;
}): Promise<void> {
  const { error } = await supabase.from(T.tarjetas).insert(input);
  if (error) throw error;
}

export async function eliminarTarjeta(id: string): Promise<void> {
  const { error } = await supabase.from(T.tarjetas).delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Compras de tarjeta + cuotas ----------------

export interface CuotaConContexto extends Cuota {
  compra: (CompraTarjeta & { tarjeta: Tarjeta }) | null;
}

export async function crearCompraTarjeta(input: {
  tarjeta_id: string;
  importe_total: number;
  fecha: string;
  descripcion?: string | null;
  categoria_id: string | null;
  cantidad_cuotas: number;
}): Promise<void> {
  const { data: compra, error } = await supabase
    .from(T.compras)
    .insert(input)
    .select()
    .single();
  if (error) throw error;

  const n = Math.max(1, input.cantidad_cuotas);
  const baseMes = monthOfDate(input.fecha);
  const cuotaBase = Math.round((input.importe_total / n) * 100) / 100;
  const filas: Omit<Cuota, "id">[] = [];
  let acumulado = 0;
  for (let i = 0; i < n; i++) {
    const esUltima = i === n - 1;
    // La última cuota absorbe el redondeo para que sume exacto.
    const importe = esUltima
      ? Math.round((input.importe_total - acumulado) * 100) / 100
      : cuotaBase;
    acumulado += cuotaBase;
    filas.push({
      compra_id: (compra as CompraTarjeta).id,
      numero: i + 1,
      importe,
      mes: addMonths(baseMes, i),
      pagada: false,
    });
  }
  const { error: e2 } = await supabase.from(T.cuotas).insert(filas);
  if (e2) throw e2;
}

export async function eliminarCompraTarjeta(id: string): Promise<void> {
  // Las cuotas caen por ON DELETE CASCADE.
  const { error } = await supabase.from(T.compras).delete().eq("id", id);
  if (error) throw error;
}

// Cuotas de un mes con su compra y tarjeta (para Inicio / Resumen / Tarjetas)
export async function getCuotasDelMes(mk: string): Promise<CuotaConContexto[]> {
  const { data, error } = await supabase
    .from(T.cuotas)
    .select(`*, compra:${T.compras}(*, tarjeta:${T.tarjetas}(*))`)
    .eq("mes", mk);
  if (error) throw error;
  return (data ?? []) as unknown as CuotaConContexto[];
}

// Todas las cuotas de una tarjeta (para ver cuotas futuras / pendiente)
export async function getCuotasDeTarjeta(tarjeta_id: string): Promise<CuotaConContexto[]> {
  const { data, error } = await supabase
    .from(T.cuotas)
    .select(`*, compra:${T.compras}!inner(*, tarjeta:${T.tarjetas}!inner(*))`)
    .eq("compra.tarjeta_id", tarjeta_id)
    .order("mes");
  if (error) throw error;
  return (data ?? []) as unknown as CuotaConContexto[];
}

export async function getComprasDeTarjeta(tarjeta_id: string): Promise<CompraTarjeta[]> {
  const { data, error } = await supabase
    .from(T.compras)
    .select("*")
    .eq("tarjeta_id", tarjeta_id)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CompraTarjeta[];
}
