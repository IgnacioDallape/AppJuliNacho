"use client";

import { useState } from "react";
import { MonthBar } from "@/components/MonthBar";
import { StatCard } from "@/components/ui";
import { MoneyInput } from "@/components/forms/fields";
import { useModals } from "@/components/modals";
import { useApp } from "@/lib/store";
import { useMonthData } from "@/lib/useMonth";
import { setAjusteDisponible } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";

export default function InicioPage() {
  const { month, refresh } = useApp();
  const { resumen, pendienteTarjetas, ajuste, loading } = useMonthData();
  const { openIngreso, openGasto, openGastoTarjeta } = useModals();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(0);
  const [guardando, setGuardando] = useState(false);

  const p = resumen?.pareja;
  const disponible = p?.saldo ?? 0;
  const gastoMes = p?.totalGastado ?? 0;
  const compartidos = p?.compartidos ?? 0;
  const individuales = (p?.gastosDirectos ?? 0) - compartidos;

  async function guardarAjuste() {
    setGuardando(true);
    try {
      const base = disponible - ajuste; // disponible ya incluye el ajuste actual
      await setAjusteDisponible(month, Math.round((valor - base) * 100) / 100);
      setEditando(false);
      refresh();
    } catch {
      alert("No se pudo guardar. Si es la primera vez, corré la migración del ajuste.");
    } finally {
      setGuardando(false);
    }
  }

  async function quitarAjuste() {
    setGuardando(true);
    try {
      await setAjusteDisponible(month, 0);
      setEditando(false);
      refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <MonthBar />

      <div className="px-4 space-y-3">
        {/* Acciones rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <BigAction color="var(--income)" icon="cash" label="Ingreso" onClick={() => openIngreso()} />
          <BigAction color="var(--expense)" icon="receipt" label="Gasto" onClick={() => openGasto()} />
          <BigAction color="var(--accent)" fg="var(--on-accent)" icon="credit-card" label="Tarjeta" onClick={() => openGastoTarjeta()} />
        </div>

        {/* Dinero disponible (editable) */}
        {editando ? (
          <div className="rounded-2xl p-4" style={{ background: "var(--accent-soft)" }}>
            <MoneyInput label="Dinero disponible" value={valor} onChange={setValor} autoFocus />
            <div className="flex gap-2 mt-3">
              <button
                onClick={guardarAjuste}
                disabled={guardando}
                className="btn-primary flex-1 py-2.5 text-[14px]"
                style={{ opacity: guardando ? 0.6 : 1 }}
              >
                Guardar
              </button>
              <button onClick={() => setEditando(false)} className="btn-ghost flex-1 py-2.5 text-[14px]">
                Cancelar
              </button>
            </div>
            {ajuste !== 0 && (
              <button
                onClick={quitarAjuste}
                className="w-full text-center text-[12px] text-muted mt-2 underline"
              >
                Quitar ajuste (volver al calculado)
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              setValor(Math.round(disponible));
              setEditando(true);
            }}
            className="w-full text-left relative block active:scale-[0.99] transition"
          >
            <StatCard
              label={ajuste !== 0 ? "Dinero disponible · ajustado" : "Dinero disponible"}
              value={formatMoney(disponible)}
              tone={disponible >= 0 ? "accent" : "expense"}
              icon="wallet"
              big
            />
            <span
              className="absolute top-3.5 right-3.5"
              style={{ color: disponible >= 0 ? "var(--accent-strong)" : "var(--expense)" }}
            >
              <Icon name="pencil" size={15} />
            </span>
          </button>
        )}

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
