"use client";

import { MonthBar } from "@/components/MonthBar";
import { MovRow } from "@/components/MovRow";
import { EmptyState } from "@/components/ui";
import { useModals } from "@/components/modals";
import { useApp } from "@/lib/store";
import { useMonthData } from "@/lib/useMonth";
import { eliminarIngreso } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";
import type { Ingreso, Usuario } from "@/lib/types";

export default function IngresosPage() {
  const { usuarios, refresh } = useApp();
  const { ingresos, loading } = useMonthData();
  const { openIngreso } = useModals();

  async function borrar(i: Ingreso) {
    await eliminarIngreso(i.id);
    refresh();
  }

  return (
    <>
      <MonthBar subtitle="Ingresos" />
      <div className="px-4 space-y-4">
        <button className="btn-primary w-full py-3.5" onClick={() => openIngreso()}>
          <Icon name="plus" size={20} /> Agregar ingreso
        </button>

        {usuarios.map((u) => (
          <PersonaBloque
            key={u.id}
            usuario={u}
            ingresos={ingresos.filter((i) => i.usuario_id === u.id)}
            onEdit={openIngreso}
            onDelete={borrar}
          />
        ))}

        {loading && <p className="text-center text-muted text-[13px]">Actualizando…</p>}
      </div>
    </>
  );
}

function PersonaBloque({
  usuario,
  ingresos,
  onEdit,
  onDelete,
}: {
  usuario: Usuario;
  ingresos: Ingreso[];
  onEdit: (i: Ingreso) => void;
  onDelete: (i: Ingreso) => void;
}) {
  const total = ingresos.reduce((s, i) => s + Number(i.importe), 0);
  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center text-[13px] font-semibold">
            {usuario.nombre[0]}
          </span>
          <h2 className="font-semibold">{usuario.nombre}</h2>
        </div>
        <span className="font-semibold" style={{ color: "var(--income)" }}>
          {formatMoney(total)}
        </span>
      </div>
      <div className="space-y-2">
        {ingresos.length === 0 ? (
          <EmptyState icon="cash-off" text={`Sin ingresos de ${usuario.nombre} este mes.`} />
        ) : (
          ingresos.map((i) => (
            <MovRow
              key={i.id}
              icon="cash"
              iconTone="var(--income)"
              title={i.descripcion || "Ingreso"}
              subtitle={formatDate(i.fecha)}
              amount={formatMoney(i.importe)}
              amountColor="var(--income)"
              onEdit={() => onEdit(i)}
              onDelete={() => onDelete(i)}
            />
          ))
        )}
      </div>
    </div>
  );
}
