// Formato monetario argentino: $ 1.250.000,00
const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(n: number | null | undefined): string {
  return money.format(Number(n ?? 0));
}

// Versión compacta sin decimales para tarjetas/resumen: $ 1.250.000
const moneyShort = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoneyShort(n: number | null | undefined): string {
  return moneyShort.format(Number(n ?? 0));
}

// Fecha DD/MM/AAAA a partir de 'YYYY-MM-DD' (sin desfase de zona horaria)
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

// Clave de mes 'YYYY-MM'
export function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// 'YYYY-MM' -> 'Julio 2026'
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function monthLabel(mk: string): string {
  const [y, m] = mk.split("-");
  const idx = Number(m) - 1;
  return `${MESES[idx] ?? ""} ${y}`;
}

export function monthOfDate(iso: string): string {
  return iso.slice(0, 7);
}

// Suma meses a un 'YYYY-MM'
export function addMonths(mk: string, delta: number): string {
  const [y, m] = mk.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return monthKey(date);
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
