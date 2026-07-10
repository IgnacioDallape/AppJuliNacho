"use client";

import Link from "next/link";
import { MonthBar } from "@/components/MonthBar";
import { StatCard, MiniStat, SectionTitle } from "@/components/ui";
import { useModals } from "@/components/modals";
import { useApp } from "@/lib/store";
import { useMonthData } from "@/lib/useMonth";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";

export default function InicioPage() {
  const { usuarios } = useApp();
  const { resumen, loading } = useMonthData();
  const { openIngreso, openGasto, openCompra } = useModals();

  const [juli, nacho] = usuarios;
  const rJuli = juli && resumen?.porUsuario[juli.id];
  const rNacho = nacho && resumen?.porUsuario[nacho.id];
  const p = resumen?.pareja;

  return (
    <>
      <MonthBar />

      <div className="px-4 space-y-3">
        {/* Botones de acción grandes */}
        <div className="grid grid-cols-3 gap-2">
          <BigAction color="var(--income)" icon="cash" label="Ingreso" onClick={() => openIngreso()} />
          <BigAction color="var(--expense)" icon="receipt" label="Gasto" onClick={() => openGasto()} />
          <BigAction color="var(--accent)" fg="var(--on-accent)" icon="credit-card" label="Tarjeta" onClick={() => openCompra()} />
        </div>

        {/* Resumen principal */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/ingresos">
            <StatCard label="Ingresos del mes" value={formatMoney(p?.ingresos ?? 0)} tone="income" icon="trending-up" />
          </Link>
          <Link href="/gastos">
            <StatCard label="Total gastado" value={formatMoney(p?.totalGastado ?? 0)} tone="expense" icon="trending-down" />
          </Link>
        </div>

        <StatCard
          label="Dinero disponible"
          value={formatMoney(p?.saldo ?? 0)}
          tone={(p?.saldo ?? 0) >= 0 ? "accent" : "expense"}
          icon="wallet"
          big
        />

        {/* Cuánto le queda a cada uno */}
        <SectionTitle>Cada uno</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <PersonCard
            nombre={juli?.nombre ?? "Juli"}
            ingresos={rJuli ? rJuli.ingresos : 0}
            gastado={rJuli ? rJuli.totalGastado : 0}
            queda={rJuli ? rJuli.disponible : 0}
          />
          <PersonCard
            nombre={nacho?.nombre ?? "Nacho"}
            ingresos={rNacho ? rNacho.ingresos : 0}
            gastado={rNacho ? rNacho.totalGastado : 0}
            queda={rNacho ? rNacho.disponible : 0}
          />
        </div>

        {/* Otros indicadores */}
        <SectionTitle>Del mes</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <MiniStat label="Gastos compartidos" value={formatMoney(p?.compartidos ?? 0)} icon="users" />
          <MiniStat label="Tarjetas" value={formatMoney(p?.gastosTarjeta ?? 0)} icon="credit-card" />
          <MiniStat
            label={`Gastos hormiga (${p?.hormigaCantidad ?? 0})`}
            value={formatMoney(p?.hormiga ?? 0)}
            icon="coffee"
          />
          <MiniStat
            label="Alquiler y servicios"
            value={formatMoney(p?.alquilerYServicios ?? 0)}
            icon="home"
          />
        </div>

        {loading && <p className="text-center text-muted text-[13px] py-2">Actualizando…</p>}
      </div>
    </>
  );
}

function BigAction({
  color,
  fg = "white",
  icon,
  label,
  onClick,
}: {
  color: string;
  fg?: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface py-3.5 active:scale-[0.97] transition"
    >
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: color, color: fg }}
      >
        <Icon name={icon} size={22} />
      </span>
      <span className="text-[12px] font-medium">{label}</span>
    </button>
  );
}

function PersonCard({
  nombre,
  ingresos,
  gastado,
  queda,
}: {
  nombre: string;
  ingresos: number;
  gastado: number;
  queda: number;
}) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center text-[13px] font-semibold">
          {nombre[0]}
        </span>
        <span className="font-semibold text-[15px]">{nombre}</span>
      </div>
      <div className="mt-2.5 space-y-1 text-[13px]">
        <Row label="Ingresó" value={formatMoney(ingresos)} color="var(--income)" />
        <Row label="Gastó" value={formatMoney(gastado)} color="var(--expense)" />
        <div className="border-t border-border my-1.5" />
        <Row label="Le queda" value={formatMoney(queda)} strong color={queda >= 0 ? "var(--text)" : "var(--expense)"} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span style={{ color, fontWeight: strong ? 600 : 500 }}>{value}</span>
    </div>
  );
}
