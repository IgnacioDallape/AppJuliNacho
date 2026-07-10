"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { crearTarjeta } from "@/lib/data";
import type { TipoTarjeta } from "@/lib/types";

export function TarjetaForm({
  titularInicial,
  onClose,
}: {
  titularInicial?: string;
  onClose: () => void;
}) {
  const { usuarios, currentUser, refresh } = useApp();
  const [titularId, setTitularId] = useState(
    titularInicial ?? currentUser?.id ?? usuarios[0]?.id ?? ""
  );
  const [tipo, setTipo] = useState<TipoTarjeta>("Visa");
  const [banco, setBanco] = useState("");
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (!banco.trim() || !titularId) return;
    setSaving(true);
    try {
      await crearTarjeta({
        titular_id: titularId,
        tipo,
        banco: banco.trim(),
        nombre: nombre.trim() || null,
      });
      refresh();
      onClose();
    } catch (e) {
      alert("No se pudo guardar la tarjeta.");
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

      <button
        className="btn-primary w-full text-[16px] py-4"
        onClick={guardar}
        disabled={saving || !banco.trim()}
        style={{ opacity: saving || !banco.trim() ? 0.6 : 1 }}
      >
        Guardar tarjeta
      </button>
    </div>
  );
}
