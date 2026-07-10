"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { crearCompraTarjeta, getTarjetas } from "@/lib/data";
import { formatMoney, todayISO } from "@/lib/format";
import type { Tarjeta } from "@/lib/types";
import { CategorySelect, MoneyInput } from "./fields";
import { Icon } from "../Icon";

const CUOTAS_RAPIDAS = [1, 3, 6, 9, 12];

export function CompraForm({
  tarjetaInicial,
  onClose,
}: {
  tarjetaInicial?: string;
  onClose: () => void;
}) {
  const { usuarios, categorias, refresh } = useApp();
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [tarjetaId, setTarjetaId] = useState(tarjetaInicial ?? "");
  const [importe, setImporte] = useState(0);
  const [cuotas, setCuotas] = useState(1);
  const [otra, setOtra] = useState(false);
  const [categoriaId, setCategoriaId] = useState(
    categorias.find((c) => c.nombre === "Compras personales")?.id ?? categorias[0]?.id ?? ""
  );
  const [fecha, setFecha] = useState(todayISO());
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTarjetas().then((t) => {
      setTarjetas(t);
      if (!tarjetaInicial && t[0]) setTarjetaId(t[0].id);
    });
  }, [tarjetaInicial]);

  const nombreUsuario = (id: string) => usuarios.find((u) => u.id === id)?.nombre ?? "";
  const etiquetaTarjeta = (t: Tarjeta) =>
    `${t.nombre || `${t.tipo} ${t.banco}`} · ${nombreUsuario(t.titular_id)}`;

  const valorCuota = useMemo(
    () => (cuotas > 0 ? Math.round(importe / cuotas) : 0),
    [importe, cuotas]
  );

  async function guardar() {
    if (importe <= 0 || !tarjetaId || cuotas < 1) return;
    setSaving(true);
    try {
      await crearCompraTarjeta({
        tarjeta_id: tarjetaId,
        importe_total: importe,
        fecha,
        descripcion: descripcion || null,
        categoria_id: categoriaId,
        cantidad_cuotas: cuotas,
      });
      refresh();
      onClose();
    } catch (e) {
      alert("No se pudo guardar la compra.");
    } finally {
      setSaving(false);
    }
  }

  if (tarjetas.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        <Icon name="credit-card-off" size={32} />
        <p className="mt-3">Primero agregá una tarjeta en la sección Tarjetas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                {etiquetaTarjeta(t)}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <Icon name="chevron-down" size={18} />
          </span>
        </div>
      </div>

      <MoneyInput label="Importe total" value={importe} onChange={setImporte} autoFocus />

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
              {n === 1 ? "1 pago" : `${n}`}
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

      {importe > 0 && cuotas > 1 && (
        <div className="rounded-xl bg-accent-soft text-accent-strong px-4 py-3 text-[14px] flex items-center gap-2">
          <Icon name="calendar-repeat" size={18} />
          {cuotas} cuotas de <strong>{formatMoney(valorCuota)}</strong>
        </div>
      )}

      <CategorySelect categorias={categorias} value={categoriaId} onChange={setCategoriaId} />

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
          placeholder="Qué compraste…"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <button
        className="btn-primary w-full text-[16px] py-4"
        onClick={guardar}
        disabled={saving || importe <= 0}
        style={{ opacity: saving || importe <= 0 ? 0.6 : 1 }}
      >
        Guardar compra
      </button>
    </div>
  );
}
