"use client";

import Link from "next/link";
import { MonthBar } from "@/components/MonthBar";
import { EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useApp } from "@/lib/store";
import { useMonthData } from "@/lib/useMonth";
import { formatMoney } from "@/lib/format";
import type { ResumenUsuario } from "@/lib/resumen";

export default function ResumenPage() {
  const { usuarios } = useApp();
  const { resumen, loading } = useMonthData();

  if (!resumen) {
    return (
      <>
        <MonthBar subtitle="Resumen" />
        <div className="px-4">{loading ? <EmptyState icon="loader" text="Cargando…" /> : null}</div>
      </>
    );
  }

  const p = resumen.pareja;
  const bloques = usuarios
    .map((u) => resumen.porUsuario[u.id])
    .filter(Boolean) as ResumenUsuario[];

  const maxCat = resumen.porCategoria[0]?.total ?? 1;
  const gastoJuli = bloques[0]?.totalGastado ?? 0;
  const gastoNacho = bloques[1]?.totalGastado ?? 0;
  const maxPersona = Math.max(gastoJuli, gastoNacho, 1);

  return (
    <>
      <MonthBar subtitle="Resumen" />
      <div className="px-4 space-y-4">
        {/* Bloques por persona */}
        {bloques.map((b) => (
          <div key={b.usuario.id} className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-9 h-9 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center font-semibold">
                {b.usuario.nombre[0]}
              </span>
              <h2 className="font-semibold text-[16px]">{b.usuario.nombre}</h2>
              <span
                className="ml-auto font-semibold"
                style={{ color: b.disponible >= 0 ? "var(--income)" : "var(--expense)" }}
              >
                {formatMoney(b.disponible)}
              </span>
            </div>
            <div className="space-y-1.5 text-[14px]">
              <Line label="Ingresos" value={b.ingresos} color="var(--income)" />
              <Line label="Gastos personales" value={b.gastosPersonales} />
              <Line label="Su parte de compartidos" value={b.parteCompartida} />
              <Line label="Gastos de tarjeta" value={b.gastosTarjeta} />
              <div className="border-t border-border my-1.5" />
              <Line label="Saldo disponible" value={b.disponible} strong />
            </div>
          </div>
        ))}

        {/* Bloque pareja */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center">
              <Icon name="heart" size={18} />
            </span>
            <h2 className="font-semibold text-[16px]">Total de la pareja</h2>
          </div>
          <div className="space-y-1.5 text-[14px]">
            <Line label="Ingresos totales" value={p.ingresos} color="var(--income)" />
            <Line label="Gastos totales" value={p.totalGastado} color="var(--expense)" />
            <div className="border-t border-border my-1.5" />
            <Line label="Saldo restante" value={p.saldo} strong />
            <Line label="Total de tarjetas" value={p.gastosTarjeta} />
            <Line label="Alquiler y servicios" value={p.alquilerYServicios} />
            <Line label="Gastos hormiga" value={p.hormiga} />
          </div>
          {p.categoriaMayor && (
            <div className="mt-3 rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] flex items-center gap-2">
              <Icon name="flame" size={16} className="text-accent-strong" />
              Mayor gasto: <strong>{p.categoriaMayor.nombre}</strong> ·{" "}
              {formatMoney(p.categoriaMayor.total)}
            </div>
          )}
        </div>

        {/* Gráfico 1: ingresos vs gastos */}
        <ChartCard title="Ingresos vs gastos">
          <BarRow label="Ingresos" value={p.ingresos} max={Math.max(p.ingresos, p.totalGastado, 1)} color="var(--income)" />
          <BarRow label="Gastos" value={p.totalGastado} max={Math.max(p.ingresos, p.totalGastado, 1)} color="var(--expense)" />
        </ChartCard>

        {/* Gráfico 2: gastos por categoría */}
        <ChartCard title="Gastos por categoría">
          {resumen.porCategoria.length === 0 ? (
            <p className="text-muted text-[13px]">Sin gastos.</p>
          ) : (
            resumen.porCategoria
              .slice(0, 8)
              .map((c) => (
                <BarRow key={c.nombre} label={c.nombre} value={c.total} max={maxCat} color="var(--accent-strong)" />
              ))
          )}
        </ChartCard>

        {/* Gráfico 3: Juli vs Nacho */}
        <ChartCard title="Gastos: Juli vs Nacho">
          <BarRow label={bloques[0]?.usuario.nombre ?? "Juli"} value={gastoJuli} max={maxPersona} color="var(--accent-strong)" />
          <BarRow label={bloques[1]?.usuario.nombre ?? "Nacho"} value={gastoNacho} max={maxPersona} color="var(--expense)" />
        </ChartCard>

        <Link
          href="/historial"
          className="btn-ghost w-full py-3.5 justify-center"
        >
          <Icon name="history" size={19} /> Ver historial completo
        </Link>
        <Link href="/config" className="btn-ghost w-full py-3.5 justify-center">
          <Icon name="settings" size={19} /> Configuración
        </Link>
      </div>
    </>
  );
}

function Line({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: number;
  color?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span style={{ color: color ?? "var(--text)", fontWeight: strong ? 600 : 500 }}>
        {formatMoney(value)}
      </span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-[15px] mb-3">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1">
        <span className="text-muted truncate pr-2">{label}</span>
        <span className="font-medium shrink-0">{formatMoney(value)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
