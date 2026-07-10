"use client";

import { Icon } from "./Icon";

type Tone = "income" | "expense" | "accent" | "neutral";

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  income: { bg: "var(--income-soft)", fg: "var(--income)" },
  expense: { bg: "var(--expense-soft)", fg: "var(--expense)" },
  accent: { bg: "var(--accent-soft)", fg: "var(--accent-strong)" },
  neutral: { bg: "var(--surface-2)", fg: "var(--text)" },
};

export function StatCard({
  label,
  value,
  tone = "neutral",
  icon,
  big,
}: {
  label: string;
  value: string;
  tone?: Tone;
  icon?: string;
  big?: boolean;
}) {
  const s = toneStyles[tone];
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ background: s.bg, color: s.fg }}
    >
      <div className="flex items-center gap-1.5 text-[12px] opacity-90">
        {icon && <Icon name={icon} size={15} />}
        <span>{label}</span>
      </div>
      <p
        className={`mt-1 font-semibold ${big ? "text-[24px]" : "text-[18px]"}`}
        style={{ color: s.fg }}
      >
        {value}
      </p>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        {icon && <Icon name={icon} size={14} />}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-[15px] font-semibold">{value}</p>
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-1 mb-2 mt-6">
      <h2 className="text-[15px] font-semibold text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = "inbox",
  text,
}: {
  icon?: string;
  text: string;
}) {
  return (
    <div className="text-center text-muted py-10">
      <Icon name={icon} size={30} />
      <p className="mt-2 text-[14px]">{text}</p>
    </div>
  );
}
