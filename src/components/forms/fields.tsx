"use client";

import { useEffect, useRef, useState } from "react";
import type { Categoria } from "@/lib/types";
import { Icon } from "../Icon";

// Entrada de dinero: se escribe en pesos enteros y se muestra con separadores.
export function MoneyInput({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(value ? formatGroups(value) : "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  function handle(v: string) {
    const digits = v.replace(/[^\d]/g, "");
    const n = digits ? parseInt(digits, 10) : 0;
    setText(digits ? formatGroups(n) : "");
    onChange(n);
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[22px]">
          $
        </span>
        <input
          ref={ref}
          inputMode="numeric"
          className="field pl-9 text-[26px] font-semibold py-3"
          placeholder="0"
          value={text}
          onChange={(e) => handle(e.target.value)}
        />
      </div>
    </div>
  );
}

function formatGroups(n: number): string {
  return new Intl.NumberFormat("es-AR").format(n);
}

export function CategorySelect({
  categorias,
  value,
  onChange,
}: {
  categorias: Categoria[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label className="label">Categoría</label>
      <div className="relative">
        <select
          className="field appearance-none pr-10"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <Icon name="chevron-down" size={18} />
        </span>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`seg ${value === o.value ? "seg-on" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
