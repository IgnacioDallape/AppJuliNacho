"use client";

import { useMemo, useState } from "react";
import { MonthBar } from "@/components/MonthBar";
import { MovRow } from "@/components/MovRow";
import { EmptyState } from "@/components/ui";
import { useModals } from "@/components/modals";
import { useApp } from "@/lib/store";
import { useMonthData } from "@/lib/useMonth";
import { eliminarCompraTarjeta, eliminarGasto, eliminarIngreso } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

type TipoFiltro = "todos" | "ingreso" | "gasto" | "tarjeta";

interface Mov {
  id: string;
  tipo: "ingreso" | "gasto" | "tarjeta";
  fecha: string;
  titulo: string;
  sub: string;
  monto: number;
  color: string;
  icon: string;
  usuarioId?: string;
  categoriaId?: string | null;
  onEdit?: () => void;
  onDelete: () => Promise<void>;
}

export default function HistorialPage() {
  const { usuarios, categorias, refresh } = useApp();
  const { ingresos, gastos, cuotas, loading } = useMonthData();
  const { openIngreso, openGasto } = useModals();

  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [persona, setPersona] = useState<string>("todos");
  const [categoria, setCategoria] = useState<string>("todas");

  const catById = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const userById = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  const movimientos: Mov[] = useMemo(() => {
    const items: Mov[] = [];

    for (const i of ingresos) {
      items.push({
        id: i.id,
        tipo: "ingreso",
        fecha: i.fecha,
        titulo: i.descripcion || "Ingreso",
        sub: `${userById.get(i.usuario_id)?.nombre ?? ""} · Ingreso`,
        monto: Number(i.importe),
        color: "var(--income)",
        icon: "cash",
        usuarioId: i.usuario_id,
        onEdit: () => openIngreso(i),
        onDelete: async () => {
          await eliminarIngreso(i.id);
          refresh();
        },
      });
    }

    for (const g of gastos) {
      const cat = g.categoria_id ? catById.get(g.categoria_id) : undefined;
      items.push({
        id: g.id,
        tipo: "gasto",
        fecha: g.fecha,
        titulo: g.descripcion || cat?.nombre || "Gasto",
        sub: `${userById.get(g.pagado_por)?.nombre ?? ""} · ${cat?.nombre ?? "Gasto"}`,
        monto: Number(g.importe),
        color: "var(--expense)",
        icon: cat?.icono ?? "receipt",
        usuarioId: g.pagado_por,
        categoriaId: g.categoria_id,
        onEdit: () => openGasto(g),
        onDelete: async () => {
          await eliminarGasto(g.id);
          refresh();
        },
      });
    }

    for (const c of cuotas) {
      const t = c.compra?.tarjeta;
      const cat = c.compra?.categoria_id ? catById.get(c.compra.categoria_id) : undefined;
      items.push({
        id: c.id,
        tipo: "tarjeta",
        fecha: `${c.mes}-01`,
        titulo: c.compra?.descripcion || "Compra con tarjeta",
        sub: `${t ? userById.get(t.titular_id)?.nombre ?? "" : ""} · ${t?.tipo ?? ""} · cuota ${c.numero}/${c.compra?.cantidad_cuotas ?? 1}`,
        monto: Number(c.importe),
        color: "var(--accent-strong)",
        icon: "credit-card",
        usuarioId: t?.titular_id,
        categoriaId: c.compra?.categoria_id ?? null,
        onDelete: async () => {
          if (c.compra) await eliminarCompraTarjeta(c.compra.id);
          refresh();
        },
      });
    }

    return items.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [ingresos, gastos, cuotas, catById, userById, openIngreso, openGasto, refresh]);

  const filtrados = movimientos.filter((m) => {
    if (tipo !== "todos" && m.tipo !== tipo) return false;
    if (persona !== "todos" && m.usuarioId !== persona) return false;
    if (categoria !== "todas" && m.categoriaId !== categoria) return false;
    return true;
  });

  return (
    <>
      <MonthBar subtitle="Historial" />
      <div className="px-4 space-y-3">
        {/* Filtro tipo */}
        <div className="flex gap-2">
          {(["todos", "ingreso", "gasto", "tarjeta"] as TipoFiltro[]).map((f) => (
            <button
              key={f}
              onClick={() => setTipo(f)}
              className={`seg capitalize text-[13px] py-2 ${tipo === f ? "seg-on" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Filtro persona + categoría */}
        <div className="grid grid-cols-2 gap-2">
          <select className="field py-2.5 text-[14px]" value={persona} onChange={(e) => setPersona(e.target.value)}>
            <option value="todos">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <select className="field py-2.5 text-[14px]" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="todas">Toda categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {filtrados.length === 0 && !loading && (
            <EmptyState icon="search" text="No hay movimientos con esos filtros." />
          )}
          {filtrados.map((m) => (
            <MovRow
              key={`${m.tipo}-${m.id}`}
              icon={m.icon}
              iconTone={m.color}
              title={m.titulo}
              subtitle={`${formatDate(m.fecha)} · ${m.sub}`}
              amount={`${m.tipo === "ingreso" ? "+" : "−"} ${formatMoney(m.monto)}`}
              amountColor={m.color}
              onEdit={m.onEdit}
              onDelete={m.onDelete}
            />
          ))}
        </div>
      </div>
    </>
  );
}
