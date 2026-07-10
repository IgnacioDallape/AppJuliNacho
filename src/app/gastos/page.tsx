"use client";

import { useMemo, useState } from "react";
import { MonthBar } from "@/components/MonthBar";
import { MovRow } from "@/components/MovRow";
import { EmptyState, StatCard } from "@/components/ui";
import { useModals } from "@/components/modals";
import { useApp } from "@/lib/store";
import { useMonthData } from "@/lib/useMonth";
import { eliminarGasto } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import type { Gasto } from "@/lib/types";

type Filtro = "todos" | "personal" | "compartido";

export default function GastosPage() {
  const { categorias, usuarios, refresh } = useApp();
  const { gastos, loading } = useMonthData();
  const { openGasto } = useModals();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const catById = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const userById = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  const lista = gastos.filter((g) => filtro === "todos" || g.tipo === filtro);
  const total = lista.reduce((s, g) => s + Number(g.importe), 0);

  async function borrar(g: Gasto) {
    await eliminarGasto(g.id);
    refresh();
  }

  return (
    <>
      <MonthBar subtitle="Gastos" />
      <div className="px-4 space-y-3">
        <StatCard
          label={`${lista.length} gastos`}
          value={formatMoney(total)}
          tone="expense"
          icon="receipt"
          big
        />

        <div className="flex gap-2">
          {(["todos", "personal", "compartido"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`seg capitalize ${filtro === f ? "seg-on" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {lista.length === 0 && !loading && (
            <EmptyState icon="receipt-off" text="No hay gastos este mes. Tocá + para agregar." />
          )}
          {lista.map((g) => {
            const cat = g.categoria_id ? catById.get(g.categoria_id) : undefined;
            const quien = userById.get(g.pagado_por)?.nombre ?? "";
            return (
              <MovRow
                key={g.id}
                icon={cat?.icono ?? "tag"}
                iconTone="var(--expense)"
                title={g.descripcion || cat?.nombre || "Gasto"}
                subtitle={`${formatDate(g.fecha)} · ${quien} · ${
                  g.tipo === "compartido" ? "Compartido" : "Personal"
                }`}
                amount={formatMoney(g.importe)}
                amountColor="var(--expense)"
                badge={g.es_mensual ? "mensual" : undefined}
                onEdit={() => openGasto(g)}
                onDelete={() => borrar(g)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
