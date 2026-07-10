"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { crearIngreso, actualizarIngreso } from "@/lib/data";
import { todayISO } from "@/lib/format";
import type { Ingreso } from "@/lib/types";
import { MoneyInput } from "./fields";

export function IngresoForm({
  editing,
  onClose,
}: {
  editing?: Ingreso | null;
  onClose: () => void;
}) {
  const { usuarios, currentUser, refresh } = useApp();
  const [usuarioId, setUsuarioId] = useState(
    editing?.usuario_id ?? currentUser?.id ?? usuarios[0]?.id ?? ""
  );
  const [importe, setImporte] = useState<number>(editing?.importe ?? 0);
  const [fecha, setFecha] = useState(editing?.fecha ?? todayISO());
  const [descripcion, setDescripcion] = useState(editing?.descripcion ?? "");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (importe <= 0 || !usuarioId) return;
    setSaving(true);
    try {
      if (editing) {
        await actualizarIngreso(editing.id, {
          usuario_id: usuarioId,
          importe,
          fecha,
          descripcion: descripcion || null,
        });
      } else {
        await crearIngreso({
          usuario_id: usuarioId,
          importe,
          fecha,
          descripcion: descripcion || null,
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
      <div>
        <span className="label">¿De quién es el ingreso?</span>
        <div className="flex gap-2">
          {usuarios.map((u) => (
            <button
              key={u.id}
              onClick={() => setUsuarioId(u.id)}
              className={`seg ${usuarioId === u.id ? "seg-on" : ""}`}
            >
              {u.nombre}
            </button>
          ))}
        </div>
      </div>

      <MoneyInput label="Importe" value={importe} onChange={setImporte} autoFocus />

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
          placeholder="Sueldo, changa, venta…"
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
        {editing ? "Guardar cambios" : "Guardar ingreso"}
      </button>
    </div>
  );
}
