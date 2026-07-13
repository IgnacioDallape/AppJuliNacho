"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { crearCategoria, eliminarCategoria } from "@/lib/data";
import { Icon } from "../Icon";

const ICONOS = [
  "tag", "home", "bolt", "shopping-cart", "tools-kitchen-2", "car",
  "heart", "paw", "glass", "shopping-bag", "coffee", "basket",
  "gift", "plane", "book", "bus", "pizza", "music",
];

export function CategoriasManager() {
  const { categorias, refreshCategorias } = useApp();
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("tag");
  const [saving, setSaving] = useState(false);

  async function agregar() {
    const n = nombre.trim();
    if (!n) return;
    setSaving(true);
    try {
      await crearCategoria({ nombre: n, icono });
      await refreshCategorias();
      setNombre("");
      setIcono("tag");
    } catch {
      alert("No se pudo agregar. ¿Ya existe una categoría con ese nombre?");
    } finally {
      setSaving(false);
    }
  }

  async function borrar(id: string, nom: string) {
    if (
      !confirm(
        `¿Eliminar la categoría "${nom}"? Los gastos que la usaban van a quedar sin categoría.`
      )
    )
      return;
    await eliminarCategoria(id);
    await refreshCategorias();
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <label className="label">Nueva categoría</label>
          <input
            className="field"
            placeholder="Ej: Regalos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <span className="label">Ícono</span>
          <div className="grid grid-cols-6 gap-2">
            {ICONOS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcono(ic)}
                className={`aspect-square rounded-xl flex items-center justify-center border ${
                  icono === ic ? "seg-on" : "border-border"
                }`}
              >
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn-primary w-full py-3"
          onClick={agregar}
          disabled={saving || !nombre.trim()}
          style={{ opacity: saving || !nombre.trim() ? 0.6 : 1 }}
        >
          <Icon name="plus" size={18} /> Agregar categoría
        </button>
      </div>

      <div className="border-t border-border pt-4">
        <span className="label">Categorías actuales</span>
        <div className="space-y-2">
          {categorias.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-border p-2.5"
            >
              <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-accent-strong">
                <Icon name={c.icono} size={17} />
              </span>
              <span className="flex-1 text-[15px]">{c.nombre}</span>
              <button
                onClick={() => borrar(c.id, c.nombre)}
                aria-label={`Eliminar ${c.nombre}`}
                className="text-muted active:text-expense p-1.5"
              >
                <Icon name="trash" size={17} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
