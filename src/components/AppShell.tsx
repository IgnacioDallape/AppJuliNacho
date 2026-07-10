"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { ModalsProvider, useModals } from "./modals";
import { Icon } from "./Icon";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, error, currentUser } = useApp();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        <div className="animate-pulse text-center">
          <Icon name="home" size={36} />
          <p className="mt-2">Cargando…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-6 max-w-sm text-center">
          <span className="inline-flex w-12 h-12 rounded-full bg-expense-soft text-expense items-center justify-center">
            <Icon name="plug-connected-x" size={24} />
          </span>
          <h1 className="text-lg font-semibold mt-3">Sin conexión a la base</h1>
          <p className="text-muted text-[14px] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <UserGate />;

  return (
    <ModalsProvider>
      <div className="min-h-screen pb-24 max-w-md mx-auto">{children}</div>
      <BottomNav />
    </ModalsProvider>
  );
}

function UserGate() {
  const { usuarios, setCurrentUser } = useApp();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <div className="text-center">
        <span className="inline-flex w-16 h-16 rounded-2xl bg-accent text-on-accent items-center justify-center">
          <Icon name="home-heart" size={32} />
        </span>
        <h1 className="text-2xl font-semibold mt-4">Finanzas de casa</h1>
        <p className="text-muted mt-1">¿Quién sos?</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        {usuarios.map((u) => (
          <button
            key={u.id}
            onClick={() => setCurrentUser(u)}
            className="w-full flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 active:scale-[0.99] transition"
          >
            <span className="w-12 h-12 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center font-semibold text-lg">
              {u.nombre[0]}
            </span>
            <span className="text-[17px] font-medium">{u.nombre}</span>
            <Icon name="chevron-right" size={22} className="ml-auto text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/gastos", label: "Gastos", icon: "receipt" },
  { href: "/tarjetas", label: "Tarjetas", icon: "credit-card" },
  { href: "/resumen", label: "Resumen", icon: "chart-pie" },
];

function BottomNav() {
  const pathname = usePathname();
  const { openMenu } = useModals();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40">
      <div className="max-w-md mx-auto bg-surface/95 backdrop-blur border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-end h-16">
          <NavItem tab={TABS[0]} active={pathname === "/"} />
          <NavItem tab={TABS[1]} active={pathname.startsWith("/gastos")} />
          <div className="flex justify-center">
            <button
              onClick={openMenu}
              aria-label="Agregar"
              className="w-14 h-14 -mt-6 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-lg active:scale-95 transition"
            >
              <Icon name="plus" size={28} />
            </button>
          </div>
          <NavItem tab={TABS[2]} active={pathname.startsWith("/tarjetas")} />
          <NavItem tab={TABS[3]} active={pathname.startsWith("/resumen")} />
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  tab,
  active,
}: {
  tab: { href: string; label: string; icon: string };
  active: boolean;
}) {
  return (
    <Link
      href={tab.href}
      className="flex flex-col items-center justify-center gap-0.5 h-16"
      style={{ color: active ? "var(--accent-strong)" : "var(--muted)" }}
    >
      <Icon name={tab.icon} size={23} />
      <span className="text-[10px] font-medium">{tab.label}</span>
    </Link>
  );
}
