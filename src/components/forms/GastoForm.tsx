"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { actualizarGasto, crearGasto } from "@/lib/data";
import { todayISO } from "@/lib/format";
import type { Gasto, TipoGasto } from "@/lib/types";
import { CategorySelect, MoneyInput } from "./fields";
import { Icon } from "../Icon";

export function GastoForm({
  editing,
  onClose,
}: {
  editing?: Gasto | null;
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

  async function guardar() {
    if (importe <= 0 || !pagadoPor) return;
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

      {!editing && (
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
        disabled={saving || importe <= 0}
        style={{ opacity: saving || importe <= 0 ? 0.6 : 1 }}
      >
        {editing ? "Guardar cambios" : "Guardar gasto"}
      </button>
    </div>
  );
}
