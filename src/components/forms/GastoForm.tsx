"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { actualizarGasto, crearCompraTarjeta, crearGasto, getTarjetas } from "@/lib/data";
import { addMonths, formatMoney, monthLabel, monthOfDate, todayISO } from "@/lib/format";
import type { Gasto, Tarjeta, TipoGasto } from "@/lib/types";
import { CategorySelect, MoneyInput } from "./fields";
import { Icon } from "../Icon";

const CUOTAS_RAPIDAS = [1, 3, 6, 9, 12, 18];

export function GastoForm({
  editing,
  conTarjeta,
  tarjetaInicial,
  onAddTarjeta,
  onClose,
}: {
  editing?: Gasto | null;
  conTarjeta?: boolean;
  tarjetaInicial?: string;
  onAddTarjeta?: () => void;
  onClose: () => void;
}) {
  const { usuarios, categorias, currentUser, refresh } = useApp();

  const [importe, setImporte] = useState<number>(editing?.importe ?? 0);
  const [categoriaId, setCategoriaId] = useState<string>(
    editing?.categoria_id ?? categorias.find((c) => c.nombre === "Supermercado")?.id ?? categorias[0]?.id ?? ""
  );
  const [pagadoPor, setPagadoPor] = useState(
    editing?.pagado_por ?? currentUser?.id ?? usuarios[0]?.id ?? ""
  );
  const [tipo, setTipo] = useState<TipoGasto>(editing?.tipo ?? "compartido");
  const [fecha, setFecha] = useState(editing?.fecha ?? todayISO());
  const [descripcion, setDescripcion] = useState(editing?.descripcion ?? "");
  const [esMensual, setEsMensual] = useState(editing?.es_mensual ?? false);
  const [saving, setSaving] = useState(false);

  // Pago con tarjeta (solo al crear un gasto nuevo)
  const [pagaConTarjeta, setPagaConTarjeta] = useState(!!conTarjeta && !editing);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [tarjetaId, setTarjetaId] = useState(tarjetaInicial ?? "");
  const [cuotas, setCuotas] = useState(1);
  const [otra, setOtra] = useState(false);

  useEffect(() => {
    getTarjetas().then((t) => {
      setTarjetas(t);
      if (!tarjetaId && t[0]) setTarjetaId(t[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tarjetaSel = tarjetas.find((t) => t.id === tarjetaId);
  const nombreUsuario = (id: string) => usuarios.find((u) => u.id === id)?.nombre ?? "";

  // Vista previa en vivo de las cuotas
  const preview = useMemo(() => {
    if (!pagaConTarjeta || importe <= 0) return null;
    const dia = parseInt(fecha.slice(8, 10), 10);
    const cierre = tarjetaSel?.dia_cierre ?? null;
    const offset = cierre != null && dia > cierre ? 2 : 1;
    const primer = addMonths(monthOfDate(fecha), offset);
    const n = Math.max(1, cuotas);
    if (n === 1) {
      return `Total ${formatMoney(importe)} en el resumen de ${monthLabel(primer)}.`;
    }
    const monto = Math.round((importe / n) * 100) / 100;
    const ultimo = addMonths(primer, n - 1);
    return `${n} cuotas de ${formatMoney(monto)} — primera en ${monthLabel(primer).split(" ")[0]}, última en ${monthLabel(ultimo).split(" ")[0]}.`;
  }, [pagaConTarjeta, importe, cuotas, fecha, tarjetaSel]);

  async function guardar() {
    if (importe <= 0 || !pagadoPor) return;
    if (pagaConTarjeta && !tarjetaId) return;
    setSaving(true);
    try {
      if (editing) {
        await actualizarGasto(editing.id, {
          importe,
          categoria_id: categoriaId,
          pagado_por: pagadoPor,
          tipo,
          fecha,
          descripcion: descripcion || null,
        });
      } else if (pagaConTarjeta) {
        await crearCompraTarjeta(
          {
            tarjeta_id: tarjetaId,
            importe_total: importe,
            fecha,
            descripcion: descripcion || null,
            categoria_id: categoriaId,
            cantidad_cuotas: Math.max(1, cuotas),
            pagado_por: pagadoPor,
            tipo,
          },
          tarjetaSel?.dia_cierre ?? null
        );
      } else {
        await crearGasto({
          importe,
          categoria_id: categoriaId,
          pagado_por: pagadoPor,
          tipo,
          fecha,
          descripcion: descripcion || null,
          es_mensual: esMensual,
        });
      }
      refresh();
      onClose();
    } catch (e) {
      alert("No se pudo guardar. Revisá la conexión con Supabase.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <MoneyInput label="Importe" value={importe} onChange={setImporte} autoFocus />

      <CategorySelect categorias={categorias} value={categoriaId} onChange={setCategoriaId} />

      <div>
        <span className="label">¿Quién pagó?</span>
        <div className="flex gap-2">
          {usuarios.map((u) => (
            <button
              key={u.id}
              onClick={() => setPagadoPor(u.id)}
              className={`seg ${pagadoPor === u.id ? "seg-on" : ""}`}
            >
              {u.nombre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Tipo</span>
        <div className="flex gap-2">
          <button
            onClick={() => setTipo("personal")}
            className={`seg ${tipo === "personal" ? "seg-on" : ""}`}
          >
            Personal
          </button>
          <button
            onClick={() => setTipo("compartido")}
            className={`seg ${tipo === "compartido" ? "seg-on" : ""}`}
          >
            Compartido · 50/50
          </button>
        </div>
      </div>

      <div>
        <label className="label">Fecha</label>
        <input
          type="date"
          className="field"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Descripción (opcional)</label>
        <input
          className="field"
          placeholder="Detalle del gasto…"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      {/* Switch: ¿Pagás con tarjeta? (solo al crear) */}
      {!editing && (
        <button
          onClick={() => setPagaConTarjeta((v) => !v)}
          className="w-full flex items-center justify-between rounded-xl border border-border px-4 py-3"
        >
          <span className="flex items-center gap-2 text-[15px]">
            <Icon name="credit-card" size={18} />
            ¿Pagás con tarjeta?
          </span>
          <span
            className={`w-11 h-6 rounded-full flex items-center px-0.5 transition ${
              pagaConTarjeta ? "justify-end bg-accent" : "justify-start bg-surface-2"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white" />
          </span>
        </button>
      )}

      {/* Campos de tarjeta */}
      {!editing && pagaConTarjeta && (
        <div className="space-y-4 rounded-2xl border border-border p-3.5">
          {tarjetas.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-[14px] text-muted mb-2">No tenés tarjetas cargadas.</p>
              {onAddTarjeta && (
                <button onClick={onAddTarjeta} className="text-accent-strong text-[14px] font-medium">
                  + Agregar tarjeta
                </button>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="label">Tarjeta</label>
                <div className="relative">
                  <select
                    className="field appearance-none pr-10"
                    value={tarjetaId}
                    onChange={(e) => setTarjetaId(e.target.value)}
                  >
                    {tarjetas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {(t.nombre || `${t.tipo} ${t.banco}`) + " · " + nombreUsuario(t.titular_id)}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                    <Icon name="chevron-down" size={18} />
                  </span>
                </div>
              </div>

              <div>
                <span className="label">Cuotas</span>
                <div className="grid grid-cols-3 gap-2">
                  {CUOTAS_RAPIDAS.map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setOtra(false);
                        setCuotas(n);
                      }}
                      className={`seg ${!otra && cuotas === n ? "seg-on" : ""}`}
                    >
                      {n === 1 ? "1 pago" : n}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setOtra(true);
                      setCuotas(2);
                    }}
                    className={`seg ${otra ? "seg-on" : ""}`}
                  >
                    Otra
                  </button>
                </div>
                {otra && (
                  <input
                    type="number"
                    min={1}
                    className="field mt-2"
                    placeholder="Cantidad de cuotas"
                    value={cuotas}
                    onChange={(e) => setCuotas(Math.max(1, parseInt(e.target.value || "1", 10)))}
                  />
                )}
              </div>

              {preview && (
                <div className="rounded-xl bg-accent-soft text-accent-strong px-4 py-3 text-[13px] flex items-start gap-2">
                  <Icon name="calendar-repeat" size={17} />
                  <span>{preview}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Gasto mensual (solo efectivo, al crear) */}
      {!editing && !pagaConTarjeta && (
        <button
          onClick={() => setEsMensual((v) => !v)}
          className="w-full flex items-center justify-between rounded-xl border border-border px-4 py-3"
        >
          <span className="flex items-center gap-2 text-[15px]">
            <Icon name="repeat" size={18} />
            Gasto mensual (se copia 6 meses)
          </span>
          <span
            className={`w-11 h-6 rounded-full flex items-center px-0.5 transition ${
              esMensual ? "justify-end bg-accent" : "justify-start bg-surface-2"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white" />
          </span>
        </button>
      )}

      <button
        className="btn-primary w-full text-[16px] py-4"
        onClick={guardar}
        disabled={saving || importe <= 0 || (pagaConTarjeta && !tarjetaId)}
        style={{ opacity: saving || importe <= 0 || (pagaConTarjeta && !tarjetaId) ? 0.6 : 1 }}
      >
        {editing ? "Guardar cambios" : pagaConTarjeta ? "Guardar compra" : "Guardar gasto"}
      </button>
    </div>
  );
}
