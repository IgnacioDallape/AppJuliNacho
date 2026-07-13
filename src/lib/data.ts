import { supabase, T } from "./supabase";
import { addMonths, monthOfDate } from "./format";
import type {
  Categoria,
  CompraTarjeta,
  Cuota,
  Gasto,
  Ingreso,
  PagoTarjeta,
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

export async function crearCategoria(input: {
  nombre: string;
  icono: string;
}): Promise<void> {
  const { error } = await supabase
    .from(T.categorias)
    .insert({ nombre: input.nombre, icono: input.icono, orden: 99 });
  if (error) throw error;
}

export async function eliminarCategoria(id: string): Promise<void> {
  // Los gastos/compras que la usaban quedan sin categoría (FK on delete set null).
  const { error } = await supabase.from(T.categorias).delete().eq("id", id);
  if (error) throw error;
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
  dia_cierre?: number | null;
  dia_vencimiento?: number | null;
}): Promise<void> {
  const { error } = await supabase.from(T.tarjetas).insert(input);
  if (error) throw error;
}

export async function actualizarTarjeta(
  id: string,
  patch: Partial<Tarjeta>
): Promise<void> {
  const { error } = await supabase.from(T.tarjetas).update(patch).eq("id", id);
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

interface CompraInput {
  tarjeta_id: string;
  importe_total: number;
  fecha: string;
  descripcion?: string | null;
  categoria_id: string | null;
  cantidad_cuotas: number;
  pagado_por?: string | null;
  tipo?: TipoGasto;
}

// Genera las cuotas. Regla: la primera cuota (o el total, si es 1) va al PRÓXIMO
// resumen = el mes siguiente a la compra (o el subsiguiente si la compra es
// posterior al día de cierre). La cuota k va a primerResumen + (k-1) meses.
// La última cuota absorbe el redondeo para que la suma dé exacta (sin interés).
function generarCuotas(
  compra_id: string,
  input: CompraInput,
  diaCierre?: number | null
): Omit<Cuota, "id">[] {
  const n = Math.max(1, input.cantidad_cuotas);
  const dia = parseInt(input.fecha.slice(8, 10), 10);
  const offset = diaCierre != null && dia > diaCierre ? 2 : 1;
  const primerResumen = addMonths(monthOfDate(input.fecha), offset);
  const cuotaBase = Math.round((input.importe_total / n) * 100) / 100;
  const filas: Omit<Cuota, "id">[] = [];
  for (let i = 0; i < n; i++) {
    const esUltima = i === n - 1;
    const importe = esUltima
      ? Math.round((input.importe_total - cuotaBase * (n - 1)) * 100) / 100
      : cuotaBase;
    filas.push({
      compra_id,
      numero: i + 1,
      importe,
      mes: addMonths(primerResumen, i),
      pagada: false,
    });
  }
  return filas;
}

export async function crearCompraTarjeta(
  input: CompraInput,
  diaCierre?: number | null
): Promise<void> {
  const { data: compra, error } = await supabase
    .from(T.compras)
    .insert(input)
    .select()
    .single();
  if (error) throw error;

  const filas = generarCuotas((compra as CompraTarjeta).id, input, diaCierre);
  const { error: e2 } = await supabase.from(T.cuotas).insert(filas);
  if (e2) throw e2;
}

// Edita una compra y regenera sus cuotas.
export async function actualizarCompraTarjeta(
  id: string,
  input: CompraInput,
  diaCierre?: number | null
): Promise<void> {
  const { error } = await supabase.from(T.compras).update(input).eq("id", id);
  if (error) throw error;
  await supabase.from(T.cuotas).delete().eq("compra_id", id);
  const filas = generarCuotas(id, input, diaCierre);
  const { error: e2 } = await supabase.from(T.cuotas).insert(filas);
  if (e2) throw e2;
}

export async function eliminarCompraTarjeta(id: string): Promise<void> {
  // Las cuotas caen por ON DELETE CASCADE.
  const { error } = await supabase.from(T.compras).delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Pagos de tarjeta (parciales) ----------------

export async function registrarPagoTarjeta(input: {
  tarjeta_id: string;
  monto: number;
  fecha: string;
}): Promise<void> {
  const { error } = await supabase.from("casa_pagos_tarjeta").insert(input);
  if (error) throw error;
}

export async function eliminarPagoTarjeta(id: string): Promise<void> {
  const { error } = await supabase.from("casa_pagos_tarjeta").delete().eq("id", id);
  if (error) throw error;
}

export async function getPagos(): Promise<PagoTarjeta[]> {
  const { data, error } = await supabase
    .from("casa_pagos_tarjeta")
    .select("*")
    .order("fecha", { ascending: false });
  if (error) return []; // la tabla puede no existir aún (antes de la migración)
  return (data ?? []) as PagoTarjeta[];
}

// Pagos hechos dentro de un mes (para el disponible del mes).
export async function getPagosDelMes(mk: string): Promise<PagoTarjeta[]> {
  const { data, error } = await supabase
    .from("casa_pagos_tarjeta")
    .select("*")
    .gte("fecha", `${mk}-01`)
    .lte("fecha", `${mk}-31`);
  if (error) return []; // la tabla puede no existir aún (antes de la migración)
  return (data ?? []) as PagoTarjeta[];
}

// Cuota "plana" para proyección/saldos (resuelve tarjeta y descripción vía la compra).
export interface CuotaPlana {
  id: string;
  mes: string;
  importe: number;
  numero: number;
  tarjeta_id: string;
  descripcion: string | null;
  total_cuotas: number;
}

export async function getCuotasPlanas(): Promise<CuotaPlana[]> {
  const { data, error } = await supabase
    .from(T.cuotas)
    .select(`id, mes, importe, numero, compra:${T.compras}(tarjeta_id, descripcion, cantidad_cuotas)`);
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    mes: c.mes,
    importe: Number(c.importe),
    numero: c.numero,
    tarjeta_id: c.compra?.tarjeta_id ?? "",
    descripcion: c.compra?.descripcion ?? null,
    total_cuotas: c.compra?.cantidad_cuotas ?? 1,
  }));
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

// Deuda total de tarjetas = suma de TODAS las cuotas − suma de TODOS los pagos.
export async function getPendienteTarjetas(): Promise<number> {
  const [cuotas, pagos] = await Promise.all([
    supabase.from(T.cuotas).select("importe"),
    supabase.from("casa_pagos_tarjeta").select("monto"),
  ]);
  if (cuotas.error) throw cuotas.error;
  const totalCuotas = (cuotas.data ?? []).reduce(
    (s, c: { importe: number }) => s + Number(c.importe),
    0
  );
  // pagos puede fallar si la tabla no existe aún (antes de la migración)
  const totalPagos = pagos.error
    ? 0
    : (pagos.data ?? []).reduce((s, p: { monto: number }) => s + Number(p.monto), 0);
  return totalCuotas - totalPagos;
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
