"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { actualizarTarjeta, crearTarjeta, eliminarTarjeta } from "@/lib/data";
import type { Tarjeta, TipoTarjeta } from "@/lib/types";

export function TarjetaForm({
  titularInicial,
  editing,
  onClose,
}: {
  titularInicial?: string;
  editing?: Tarjeta | null;
  onClose: () => void;
}) {
  const { usuarios, currentUser, refresh } = useApp();
  const [titularId, setTitularId] = useState(
    editing?.titular_id ?? titularInicial ?? currentUser?.id ?? usuarios[0]?.id ?? ""
  );
  const [tipo, setTipo] = useState<TipoTarjeta>(editing?.tipo ?? "Visa");
  const [banco, setBanco] = useState(editing?.banco ?? "");
  const [nombre, setNombre] = useState(editing?.nombre ?? "");
  const [diaCierre, setDiaCierre] = useState(editing?.dia_cierre?.toString() ?? "");
  const [diaVencimiento, setDiaVencimiento] = useState(
    editing?.dia_vencimiento?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);

  const aDia = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
  };

  async function guardar() {
    if (!banco.trim() || !titularId) return;
    setSaving(true);
    try {
      const payload = {
        titular_id: titularId,
        tipo,
        banco: banco.trim(),
        nombre: nombre.trim() || null,
        dia_cierre: aDia(diaCierre),
        dia_vencimiento: aDia(diaVencimiento),
      };
      if (editing) await actualizarTarjeta(editing.id, payload);
      else await crearTarjeta(payload);
      refresh();
      onClose();
    } catch (e) {
      alert("No se pudo guardar la tarjeta.");
    } finally {
      setSaving(false);
    }
  }

  async function borrar() {
    if (!editing) return;
    if (!confirm("¿Eliminar esta tarjeta y todas sus compras?")) return;
    setSaving(true);
    try {
      await eliminarTarjeta(editing.id);
      refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="label">Titular</span>
        <div className="flex gap-2">
          {usuarios.map((u) => (
            <button
              key={u.id}
              onClick={() => setTitularId(u.id)}
              className={`seg ${titularId === u.id ? "seg-on" : ""}`}
            >
              {u.nombre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Tipo</span>
        <div className="flex gap-2">
          {(["Visa", "Mastercard"] as TipoTarjeta[]).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`seg ${tipo === t ? "seg-on" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Banco</label>
        <input
          className="field"
          placeholder="Galicia, Santander, Nación…"
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Nombre para identificarla (opcional)</label>
        <input
          className="field"
          placeholder="Ej: Visa del super"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Día de cierre (opcional)</label>
          <input
            type="number"
            min={1}
            max={31}
            className="field"
            placeholder="Ej: 25"
            value={diaCierre}
            onChange={(e) => setDiaCierre(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Día de venc. (opcional)</label>
          <input
            type="number"
            min={1}
            max={31}
            className="field"
            placeholder="Ej: 10"
            value={diaVencimiento}
            onChange={(e) => setDiaVencimiento(e.target.value)}
          />
        </div>
      </div>

      <button
        className="btn-primary w-full text-[16px] py-4"
        onClick={guardar}
        disabled={saving || !banco.trim()}
        style={{ opacity: saving || !banco.trim() ? 0.6 : 1 }}
      >
        {editing ? "Guardar cambios" : "Guardar tarjeta"}
      </button>

      {editing && (
        <button
          onClick={borrar}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 text-[14px] text-expense"
        >
          Eliminar tarjeta
        </button>
      )}
    </div>
  );
}
