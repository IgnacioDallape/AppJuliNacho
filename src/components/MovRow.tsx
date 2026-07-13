"use client";

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
  return (
    <div className="rounded-2xl border border-border bg-surface flex items-stretch overflow-hidden">
      <button
        onClick={onEdit}
        disabled={!onEdit}
        className="flex-1 min-w-0 flex items-center gap-3 p-3 text-left active:bg-surface-2 transition disabled:active:bg-transparent"
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
          <span className="text-[11px] text-muted flex items-center justify-end gap-1">
            {badge && <span>{badge}</span>}
            {onEdit && <Icon name="pencil" size={12} />}
          </span>
        </div>
      </button>

      {onDelete && (
        <button
          onClick={() => {
            if (confirm("¿Eliminar este movimiento?")) onDelete();
          }}
          aria-label="Eliminar"
          className="px-3.5 flex items-center border-l border-border text-muted active:bg-surface-2 active:text-expense transition"
        >
          <Icon name="trash" size={18} />
        </button>
      )}
    </div>
  );
}
