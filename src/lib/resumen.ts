import type { Categoria, Gasto, Ingreso, Usuario } from "./types";
import type { CuotaConContexto } from "./data";

export interface ResumenUsuario {
  usuario: Usuario;
  ingresos: number;
  gastosPersonales: number; // gastos personales que pagó
  compartidosPagados: number; // gastos compartidos que pagó (monto completo)
  parteCompartida: number; // su 50% de todos los gastos compartidos
  gastosTarjeta: number; // cuotas PAGADAS del mes de sus tarjetas
  totalGastado: number; // personales + parteCompartida + tarjeta pagada
  disponible: number; // ingresos - totalGastado
}

export interface ResumenPareja {
  ingresos: number;
  gastosDirectos: number; // todos los gastos (personales + compartidos)
  gastosTarjeta: number; // cuotas PAGADAS del mes
  totalGastado: number;
  saldo: number;
  compartidos: number; // total de gastos compartidos
  alquilerYServicios: number;
  hormiga: number;
  hormigaCantidad: number;
  categoriaMayor: { nombre: string; total: number } | null;
}

export interface GastoPorCategoria {
  nombre: string;
  total: number;
}

export interface ResumenMes {
  porUsuario: Record<string, ResumenUsuario>; // key = usuario.id
  pareja: ResumenPareja;
  porCategoria: GastoPorCategoria[];
}

export function calcularResumen(args: {
  usuarios: Usuario[];
  categorias: Categoria[];
  ingresos: Ingreso[];
  gastos: Gasto[];
  cuotas: CuotaConContexto[];
}): ResumenMes {
  const { usuarios, categorias, ingresos, gastos, cuotas } = args;

  const catById = new Map(categorias.map((c) => [c.id, c]));
  const nombreCat = (id: string | null | undefined) =>
    (id && catById.get(id)?.nombre) || "Otros";

  const porUsuario: Record<string, ResumenUsuario> = {};
  for (const u of usuarios) {
    porUsuario[u.id] = {
      usuario: u,
      ingresos: 0,
      gastosPersonales: 0,
      compartidosPagados: 0,
      parteCompartida: 0,
      gastosTarjeta: 0,
      totalGastado: 0,
      disponible: 0,
    };
  }

  for (const i of ingresos) {
    const r = porUsuario[i.usuario_id];
    if (r) r.ingresos += Number(i.importe);
  }

  const totalCompartido = gastos
    .filter((g) => g.tipo === "compartido")
    .reduce((s, g) => s + Number(g.importe), 0);
  const mitad = totalCompartido / 2;

  for (const g of gastos) {
    const r = porUsuario[g.pagado_por];
    if (!r) continue;
    if (g.tipo === "personal") r.gastosPersonales += Number(g.importe);
    else r.compartidosPagados += Number(g.importe);
  }

  // Cuotas PAGADAS del mes por titular de la tarjeta (lo que ya salió del bolsillo)
  const cuotasPagadas = cuotas.filter((c) => c.pagada);
  for (const c of cuotasPagadas) {
    const titular = c.compra?.tarjeta?.titular_id;
    if (titular && porUsuario[titular]) {
      porUsuario[titular].gastosTarjeta += Number(c.importe);
    }
  }

  for (const u of usuarios) {
    const r = porUsuario[u.id];
    r.parteCompartida = mitad; // cada uno asume 50% de los compartidos
    r.totalGastado = r.gastosPersonales + r.parteCompartida + r.gastosTarjeta;
    r.disponible = r.ingresos - r.totalGastado;
  }

  // ---- Pareja ----
  const ingresosTot = ingresos.reduce((s, i) => s + Number(i.importe), 0);
  const gastosDirectos = gastos.reduce((s, g) => s + Number(g.importe), 0);
  const gastosTarjeta = cuotasPagadas.reduce((s, c) => s + Number(c.importe), 0);

  const hormigaGastos = gastos.filter((g) => nombreCat(g.categoria_id) === "Gastos hormiga");
  const alquilerYServicios = gastos
    .filter((g) => ["Alquiler", "Servicios"].includes(nombreCat(g.categoria_id)))
    .reduce((s, g) => s + Number(g.importe), 0);

  // Gastos por categoría (directos + cuotas de tarjeta)
  const mapCat = new Map<string, number>();
  for (const g of gastos) {
    const k = nombreCat(g.categoria_id);
    mapCat.set(k, (mapCat.get(k) ?? 0) + Number(g.importe));
  }
  for (const c of cuotasPagadas) {
    const k = nombreCat(c.compra?.categoria_id ?? null);
    mapCat.set(k, (mapCat.get(k) ?? 0) + Number(c.importe));
  }
  const porCategoria = Array.from(mapCat.entries())
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  const categoriaMayor = porCategoria[0] ?? null;

  const pareja: ResumenPareja = {
    ingresos: ingresosTot,
    gastosDirectos,
    gastosTarjeta,
    totalGastado: gastosDirectos + gastosTarjeta,
    saldo: ingresosTot - (gastosDirectos + gastosTarjeta),
    compartidos: totalCompartido,
    alquilerYServicios,
    hormiga: hormigaGastos.reduce((s, g) => s + Number(g.importe), 0),
    hormigaCantidad: hormigaGastos.length,
    categoriaMayor,
  };

  return { porUsuario, pareja, porCategoria };
}
