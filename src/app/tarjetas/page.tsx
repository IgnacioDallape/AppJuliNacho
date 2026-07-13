"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthBar } from "@/components/MonthBar";
import { EmptyState, MiniStat } from "@/components/ui";
import { MoneyInput } from "@/components/forms/fields";
import { useModals } from "@/components/modals";
import { Icon } from "@/components/Icon";
import { useApp } from "@/lib/store";
import {
  eliminarPagoTarjeta,
  getComprasDeTarjeta,
  getCuotasPlanas,
  getPagos,
  getTarjetas,
  registrarPagoTarjeta,
  type CuotaPlana,
} from "@/lib/data";
import { addMonths, formatDate, formatMoney, monthLabel, todayISO } from "@/lib/format";
import type { CompraTarjeta, PagoTarjeta, Tarjeta } from "@/lib/types";

type Tab = "tarjetas" | "futuro";

export default function TarjetasPage() {
  const { usuarios, month, version } = useApp();
  const { openTarjeta, openGastoTarjeta, openCompra } = useModals();
  const [tab, setTab] = useState<Tab>("tarjetas");
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [cuotas, setCuotas] = useState<CuotaPlana[]>([]);
  const [pagos, setPagos] = useState<PagoTarjeta[]>([]);

  useEffect(() => {
    getTarjetas().then(setTarjetas);
    getCuotasPlanas().then(setCuotas);
    getPagos().then(setPagos);
  }, [version]);

  return (
    <>
      <MonthBar subtitle="Tarjetas" />
      <div className="px-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("tarjetas")} className={`seg ${tab === "tarjetas" ? "seg-on" : ""}`}>
            Tarjetas
          </button>
          <button onClick={() => setTab("futuro")} className={`seg ${tab === "futuro" ? "seg-on" : ""}`}>
            Resumen futuro
          </button>
        </div>

        {tab === "tarjetas" ? (
          <div className="space-y-6">
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
                          month={month}
                          version={version}
                          cuotas={cuotas.filter((c) => c.tarjeta_id === t.id)}
                          pagos={pagos.filter((p) => p.tarjeta_id === t.id)}
                          onEditTarjeta={() => openTarjeta(undefined, t)}
                          onCompra={() => openGastoTarjeta(t.id)}
                          onEditCompra={(compra) => openCompra(t.id, compra)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <ResumenFuturo tarjetas={tarjetas} cuotas={cuotas} month={month} />
        )}
      </div>
    </>
  );
}

function TarjetaCard({
  tarjeta,
  month,
  version,
  cuotas,
  pagos,
  onEditTarjeta,
  onCompra,
  onEditCompra,
}: {
  tarjeta: Tarjeta;
  month: string;
  version: number;
  cuotas: CuotaPlana[];
  pagos: PagoTarjeta[];
  onEditTarjeta: () => void;
  onCompra: () => void;
  onEditCompra: (compra: CompraTarjeta) => void;
}) {
  const { refresh } = useApp();
  const [compras, setCompras] = useState<CompraTarjeta[]>([]);
  const [verCompras, setVerCompras] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [montoPago, setMontoPago] = useState(0);
  const [verPagos, setVerPagos] = useState(false);

  useEffect(() => {
    getComprasDeTarjeta(tarjeta.id).then(setCompras);
  }, [tarjeta.id, version]);

  const totalPagos = pagos.reduce((s, p) => s + Number(p.monto), 0);
  const cuotasVencidas = cuotas.filter((c) => c.mes <= month).reduce((s, c) => s + c.importe, 0);
  const saldoActual = Math.max(0, cuotasVencidas - totalPagos);
  const proximoMes = addMonths(month, 1);
  const proximoResumen = cuotas.filter((c) => c.mes === proximoMes).reduce((s, c) => s + c.importe, 0);

  const nombre = tarjeta.nombre || `${tarjeta.tipo} ${tarjeta.banco}`;

  async function confirmarPago() {
    const monto = Math.min(montoPago, saldoActual);
    if (monto < 1) return;
    await registrarPagoTarjeta({ tarjeta_id: tarjeta.id, monto, fecha: todayISO() });
    setPagando(false);
    setMontoPago(0);
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
          <MiniStat label="Saldo actual" value={formatMoney(saldoActual)} icon="wallet" />
          <MiniStat label="Próximo resumen" value={formatMoney(proximoResumen)} icon="calendar" />
        </div>

        {/* Pago */}
        {!pagando ? (
          <button
            onClick={() => {
              setPagando(true);
              setMontoPago(saldoActual);
            }}
            className="btn-primary w-full py-3 text-[15px] mt-3"
            disabled={saldoActual < 1}
            style={{ opacity: saldoActual < 1 ? 0.5 : 1 }}
          >
            <Icon name="cash" size={18} /> Pagar
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-border p-3 space-y-3">
            <MoneyInput label={`Monto a pagar (máx ${formatMoney(saldoActual)})`} value={montoPago} onChange={setMontoPago} />
            <div className="flex gap-2">
              <button onClick={() => setMontoPago(saldoActual)} className="btn-ghost flex-1 py-2.5 text-[13px]">
                Pagar total
              </button>
              <button onClick={() => setPagando(false)} className="btn-ghost flex-1 py-2.5 text-[13px]">
                Cancelar
              </button>
            </div>
            <button
              onClick={confirmarPago}
              className="btn-primary w-full py-3 text-[15px]"
              disabled={montoPago < 1 || montoPago > saldoActual}
              style={{ opacity: montoPago < 1 || montoPago > saldoActual ? 0.5 : 1 }}
            >
              Confirmar pago de {formatMoney(Math.min(montoPago, saldoActual))}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button onClick={onCompra} className="btn-ghost flex-1 py-2.5 text-[14px]">
            <Icon name="plus" size={17} /> Compra
          </button>
          <button onClick={() => setVerCompras((v) => !v)} className="btn-ghost flex-1 py-2.5 text-[14px]">
            <Icon name={verCompras ? "chevron-up" : "list"} size={17} />
            {compras.length} compras
          </button>
        </div>

        {pagos.length > 0 && (
          <button
            onClick={() => setVerPagos((v) => !v)}
            className="w-full text-[12px] text-muted mt-2 flex items-center justify-center gap-1"
          >
            <Icon name="history" size={14} /> {pagos.length} pago{pagos.length > 1 ? "s" : ""} · ver historial
          </button>
        )}

        {verPagos && (
          <div className="mt-2 space-y-1.5">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-[13px] rounded-lg bg-surface-2 px-3 py-2">
                <span className="text-muted">{formatDate(p.fecha)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: "var(--income)" }}>− {formatMoney(p.monto)}</span>
                  <button
                    onClick={async () => {
                      if (confirm("¿Eliminar este pago?")) {
                        await eliminarPagoTarjeta(p.id);
                        refresh();
                      }
                    }}
                    aria-label="Eliminar pago"
                    className="text-muted active:text-expense"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {verCompras && (
        <div className="border-t border-border divide-y divide-border">
          {compras.length === 0 && (
            <p className="text-center text-muted text-[13px] py-4">Sin compras cargadas.</p>
          )}
          {compras.map((c) => (
            <button
              key={c.id}
              onClick={() => onEditCompra(c)}
              className="w-full flex items-center gap-3 p-3 text-left active:bg-surface-2 transition"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium truncate">{c.descripcion || "Compra"}</p>
                <p className="text-[12px] text-muted">
                  {formatDate(c.fecha)} · {c.cantidad_cuotas === 1 ? "1 pago" : `${c.cantidad_cuotas} cuotas`}
                </p>
              </div>
              <p className="text-[14px] font-semibold shrink-0">{formatMoney(c.importe_total)}</p>
              <Icon name="pencil" size={14} className="text-muted shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumenFuturo({
  tarjetas,
  cuotas,
  month,
}: {
  tarjetas: Tarjeta[];
  cuotas: CuotaPlana[];
  month: string;
}) {
  const [filtro, setFiltro] = useState<string>("todas");
  const [abierto, setAbierto] = useState<string | null>(null);

  const nombreTarjeta = (id: string) => {
    const t = tarjetas.find((x) => x.id === id);
    return t ? t.nombre || `${t.tipo} ${t.banco}` : "Tarjeta";
  };

  const meses = useMemo(() => Array.from({ length: 12 }, (_, k) => addMonths(month, k)), [month]);
  const cuotasFiltradas = useMemo(
    () => (filtro === "todas" ? cuotas : cuotas.filter((c) => c.tarjeta_id === filtro)),
    [cuotas, filtro]
  );

  const totalGeneral = meses.reduce(
    (s, mk) => s + cuotasFiltradas.filter((c) => c.mes === mk).reduce((a, c) => a + c.importe, 0),
    0
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          className="field appearance-none pr-10 text-[14px]"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="todas">Todas las tarjetas</option>
          {tarjetas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre || `${t.tipo} ${t.banco}`}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <Icon name="chevron-down" size={18} />
        </span>
      </div>

      <div className="rounded-2xl bg-accent-soft px-4 py-3 flex items-center justify-between">
        <span className="text-[13px] text-accent-strong">Total proyectado (12 meses)</span>
        <span className="text-[18px] font-semibold text-accent-strong">{formatMoney(totalGeneral)}</span>
      </div>

      {meses.map((mk) => {
        const delMes = cuotasFiltradas.filter((c) => c.mes === mk);
        const total = delMes.reduce((s, c) => s + c.importe, 0);
        const porTarjeta = new Map<string, number>();
        for (const c of delMes) porTarjeta.set(c.tarjeta_id, (porTarjeta.get(c.tarjeta_id) ?? 0) + c.importe);
        const abiertoEste = abierto === mk;
        return (
          <div key={mk} className="card overflow-hidden">
            <button
              onClick={() => setAbierto(abiertoEste ? null : mk)}
              className="w-full flex items-center justify-between p-3.5 text-left active:bg-surface-2 transition"
            >
              <div>
                <p className="text-[15px] font-medium capitalize">{monthLabel(mk)}</p>
                <p className="text-[12px] text-muted">
                  {delMes.length === 0 ? "Sin cuotas" : `${porTarjeta.size} tarjeta${porTarjeta.size > 1 ? "s" : ""} · ${delMes.length} cuotas`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold">{formatMoney(total)}</span>
                {delMes.length > 0 && <Icon name={abiertoEste ? "chevron-up" : "chevron-down"} size={18} className="text-muted" />}
              </div>
            </button>

            {abiertoEste && delMes.length > 0 && (
              <div className="border-t border-border">
                {Array.from(porTarjeta.entries()).map(([tid, subtotal]) => (
                  <div key={tid} className="px-3.5 py-1.5 bg-surface-2 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-accent-strong">{nombreTarjeta(tid)}</span>
                    <span className="text-[12px] font-semibold">{formatMoney(subtotal)}</span>
                  </div>
                ))}
                <div className="divide-y divide-border">
                  {delMes.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-3.5 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] truncate">{c.descripcion || "Compra"}</p>
                        <p className="text-[11px] text-muted">
                          Cuota {c.numero}/{c.total_cuotas} · {nombreTarjeta(c.tarjeta_id)}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold shrink-0">{formatMoney(c.importe)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
