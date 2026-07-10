export type NombreUsuario = "Juli" | "Nacho";

export interface Usuario {
  id: string;
  nombre: NombreUsuario;
}

export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  orden: number;
}

export interface Ingreso {
  id: string;
  usuario_id: string;
  importe: number;
  fecha: string; // YYYY-MM-DD
  descripcion: string | null;
  creado_en: string;
}

export type TipoGasto = "personal" | "compartido";

export interface Gasto {
  id: string;
  importe: number;
  fecha: string;
  categoria_id: string | null;
  pagado_por: string;
  tipo: TipoGasto;
  descripcion: string | null;
  es_mensual: boolean;
  recurrente_id: string | null;
  creado_en: string;
}

export type TipoTarjeta = "Visa" | "Mastercard";

export interface Tarjeta {
  id: string;
  titular_id: string;
  tipo: TipoTarjeta;
  banco: string;
  nombre: string | null;
  creado_en: string;
}

export interface CompraTarjeta {
  id: string;
  tarjeta_id: string;
  importe_total: number;
  fecha: string;
  descripcion: string | null;
  categoria_id: string | null;
  cantidad_cuotas: number;
  creado_en: string;
}

export interface Cuota {
  id: string;
  compra_id: string;
  numero: number;
  importe: number;
  mes: string; // YYYY-MM
  pagada: boolean;
}
