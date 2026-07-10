"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function MovRow({
  icon,
  iconTone = "var(--muted)",
  title,
  subtitle,
  amount,
  amountColor,
  badge,
  onEdit,
  onDelete,
}: {
  icon: string;
  iconTone?: string;
  title: string;
  subtitle: string;
  amount: string;
  amountColor?: string;
  badge?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left active:bg-surface-2 transition"
      >
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--surface-2)", color: iconTone }}
        >
          <Icon name={icon} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium truncate">{title}</p>
          <p className="text-[12px] text-muted truncate">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[15px] font-semibold" style={{ color: amountColor }}>
            {amount}
          </p>
          {badge && <span className="text-[11px] text-muted">{badge}</span>}
        </div>
      </button>

      {open && (onEdit || onDelete) && (
        <div className="flex border-t border-border">
          {onEdit && (
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] text-muted active:bg-surface-2"
            >
              <Icon name="pencil" size={16} /> Editar
            </button>
          )}
          {onEdit && onDelete && <div className="w-px bg-border" />}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm("¿Eliminar este movimiento?")) {
                  setOpen(false);
                  onDelete();
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] text-expense active:bg-surface-2"
            >
              <Icon name="trash" size={16} /> Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
