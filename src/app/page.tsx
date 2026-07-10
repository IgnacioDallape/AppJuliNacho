"use client";

import { MonthBar } from "@/components/MonthBar";
import { StatCard } from "@/components/ui";
import { useModals } from "@/components/modals";
import { useMonthData } from "@/lib/useMonth";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";

export default function InicioPage() {
  const { resumen, pendienteTarjetas, loading } = useMonthData();
  const { openIngreso, openGasto, openCompra } = useModals();

  const p = resumen?.pareja;
  const disponible = p?.saldo ?? 0;
  const gastoMes = p?.totalGastado ?? 0;
  const compartidos = p?.compartidos ?? 0;
  const individuales = (p?.gastosDirectos ?? 0) - compartidos;

  return (
    <>
      <MonthBar />

      <div className="px-4 space-y-3">
        {/* Acciones rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <BigAction color="var(--income)" icon="cash" label="Ingreso" onClick={() => openIngreso()} />
          <BigAction color="var(--expense)" icon="receipt" label="Gasto" onClick={() => openGasto()} />
          <BigAction color="var(--accent)" fg="var(--on-accent)" icon="credit-card" label="Tarjeta" onClick={() => openCompra()} />
        </div>

        {/* Dinero disponible (lo principal) */}
        <StatCard
          label="Dinero disponible"
          value={formatMoney(disponible)}
          tone={disponible >= 0 ? "accent" : "expense"}
          icon="wallet"
          big
        />

        {/* Gasto del mes + pendiente de tarjetas */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="Gasto del mes" value={formatMoney(gastoMes)} tone="expense" icon="trending-down" />
          <StatCard label="Pendiente en tarjetas" value={formatMoney(pendienteTarjetas)} tone="neutral" icon="credit-card" />
        </div>

        {/* Gastos individuales vs compartidos */}
        <div className="card p-4">
          <p className="text-[13px] text-muted mb-3">Gastos del mes</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted">
                <Icon name="user" size={15} /> Individuales
              </div>
              <p className="mt-1 text-[19px] font-semibold">{formatMoney(individuales)}</p>
            </div>
            <div className="border-l border-border pl-3">
              <div className="flex items-center gap-1.5 text-[12px] text-muted">
                <Icon name="users" size={15} /> Compartidos
              </div>
              <p className="mt-1 text-[19px] font-semibold">{formatMoney(compartidos)}</p>
            </div>
          </div>
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
