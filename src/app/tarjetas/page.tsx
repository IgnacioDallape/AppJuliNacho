"use client";

import { useEffect, useState } from "react";
import { MonthBar } from "@/components/MonthBar";
import { EmptyState, MiniStat } from "@/components/ui";
import { useModals } from "@/components/modals";
import { Icon } from "@/components/Icon";
import { useApp } from "@/lib/store";
import {
  getComprasDeTarjeta,
  getCuotasDeTarjeta,
  getTarjetas,
  setCuotasPagadas,
  type CuotaConContexto,
} from "@/lib/data";
import { formatDate, formatMoney, monthLabel } from "@/lib/format";
import type { CompraTarjeta, Tarjeta } from "@/lib/types";

export default function TarjetasPage() {
  const { usuarios, month, version } = useApp();
  const { openTarjeta, openCompra } = useModals();
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);

  useEffect(() => {
    getTarjetas().then(setTarjetas);
  }, [version]);

  return (
    <>
      <MonthBar subtitle="Tarjetas" />
      <div className="px-4 space-y-6">
        {usuarios.map((u) => {
          const suyas = tarjetas.filter((t) => t.titular_id === u.id);
          return (
            <div key={u.id}>
              <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center text-[13px] font-semibold">
                    {u.nombre[0]}
                  </span>
                  <h2 className="font-semibold">Tarjetas de {u.nombre}</h2>
                </div>
                <button
                  onClick={() => openTarjeta(u.id)}
                  className="text-accent-strong text-[13px] font-medium flex items-center gap-1"
                >
                  <Icon name="plus" size={16} /> Agregar
                </button>
              </div>

              {suyas.length === 0 ? (
                <EmptyState icon="credit-card-off" text={`${u.nombre} no tiene tarjetas cargadas.`} />
              ) : (
                <div className="space-y-3">
                  {suyas.map((t) => (
                    <TarjetaCard
                      key={t.id}
                      tarjeta={t}
                      mes={month}
                      version={version}
                      onCompra={() => openCompra(t.id)}
                      onEditTarjeta={() => openTarjeta(undefined, t)}
                      onEditCompra={(compra) => openCompra(t.id, compra)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function TarjetaCard({
  tarjeta,
  mes,
  version,
  onCompra,
  onEditTarjeta,
  onEditCompra,
}: {
  tarjeta: Tarjeta;
  mes: string;
  version: number;
  onCompra: () => void;
  onEditTarjeta: () => void;
  onEditCompra: (compra: CompraTarjeta) => void;
}) {
  const { refresh } = useApp();
  const [cuotas, setCuotas] = useState<CuotaConContexto[]>([]);
  const [compras, setCompras] = useState<CompraTarjeta[]>([]);
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    getCuotasDeTarjeta(tarjeta.id).then(setCuotas);
    getComprasDeTarjeta(tarjeta.id).then(setCompras);
  }, [tarjeta.id, version]);

  const delMes = cuotas.filter((c) => c.mes === mes);
  const totalMes = delMes.reduce((s, c) => s + Number(c.importe), 0);
  const impagasMes = delMes.filter((c) => !c.pagada);
  const pendienteMes = impagasMes.reduce((s, c) => s + Number(c.importe), 0);
  const deudaTotal = cuotas
    .filter((c) => !c.pagada)
    .reduce((s, c) => s + Number(c.importe), 0);

  const nombre = tarjeta.nombre || `${tarjeta.tipo} ${tarjeta.banco}`;
  const nombreMes = monthLabel(mes).split(" ")[0];
  const cuotasDeCompra = (id: string) => cuotas.filter((c) => c.compra_id === id);

  async function pagarMes() {
    await setCuotasPagadas(impagasMes.map((c) => c.id), true);
    refresh();
  }
  async function deshacerPago() {
    await setCuotasPagadas(delMes.map((c) => c.id), false);
    refresh();
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent-strong flex items-center justify-center">
              <Icon name={tarjeta.tipo === "Visa" ? "brand-visa" : "brand-mastercard"} size={22} />
            </span>
            <div>
              <p className="font-semibold text-[15px] leading-tight">{nombre}</p>
              <p className="text-[12px] text-muted">
                {tarjeta.tipo} · {tarjeta.banco}
              </p>
            </div>
          </div>
          <button onClick={onEditTarjeta} aria-label="Editar tarjeta" className="text-muted p-1">
            <Icon name="dots-vertical" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <MiniStat label={`Cuota de ${nombreMes}`} value={formatMoney(totalMes)} icon="calendar" />
          <MiniStat label="Deuda total" value={formatMoney(deudaTotal)} icon="clock" />
        </div>

        {/* Pago del mes */}
        {totalMes > 0 && (
          <div className="mt-3">
            {pendienteMes > 0 ? (
              <button onClick={pagarMes} className="btn-primary w-full py-3 text-[15px]">
                <Icon name="check" size={18} /> Pagar {nombreMes} · {formatMoney(pendienteMes)}
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-income-soft px-3.5 py-2.5">
                <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: "var(--income)" }}>
                  <Icon name="circle-check" size={17} /> {nombreMes} pagado
                </span>
                <button onClick={deshacerPago} className="text-[12px] text-muted underline">
                  deshacer
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button onClick={onCompra} className="btn-ghost flex-1 py-2.5 text-[14px]">
            <Icon name="plus" size={17} /> Compra
          </button>
          <button
            onClick={() => setAbierta((v) => !v)}
            className="btn-ghost flex-1 py-2.5 text-[14px]"
          >
            <Icon name={abierta ? "chevron-up" : "list"} size={17} />
            {compras.length} compras
          </button>
        </div>
      </div>

      {abierta && (
        <div className="border-t border-border divide-y divide-border">
          {compras.length === 0 && (
            <p className="text-center text-muted text-[13px] py-4">Sin compras cargadas.</p>
          )}
          {compras.map((c) => {
            const cs = cuotasDeCompra(c.id);
            const pagas = cs.filter((x) => x.pagada).length;
            return (
              <button
                key={c.id}
                onClick={() => onEditCompra(c)}
                className="w-full flex items-center gap-3 p-3 text-left active:bg-surface-2 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium truncate">{c.descripcion || "Compra"}</p>
                  <p className="text-[12px] text-muted">
                    {formatDate(c.fecha)} · {c.cantidad_cuotas === 1 ? "1 pago" : `${c.cantidad_cuotas} cuotas`}
                    {c.cantidad_cuotas > 1 && ` · ${pagas}/${c.cantidad_cuotas} pagas`}
                  </p>
                </div>
                <p className="text-[14px] font-semibold shrink-0">{formatMoney(c.importe_total)}</p>
                <Icon name="pencil" size={14} className="text-muted shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
