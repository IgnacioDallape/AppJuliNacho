"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./Icon";
import { IngresoForm } from "./forms/IngresoForm";
import { GastoForm } from "./forms/GastoForm";
import { TarjetaForm } from "./forms/TarjetaForm";
import { CompraForm } from "./forms/CompraForm";
import type { Gasto, Ingreso } from "@/lib/types";

type Modal =
  | { kind: "menu" }
  | { kind: "ingreso"; editing?: Ingreso | null }
  | { kind: "gasto"; editing?: Gasto | null }
  | { kind: "tarjeta"; titular?: string }
  | { kind: "compra"; tarjeta?: string }
  | null;

interface ModalsApi {
  openMenu: () => void;
  openIngreso: (editing?: Ingreso | null) => void;
  openGasto: (editing?: Gasto | null) => void;
  openTarjeta: (titular?: string) => void;
  openCompra: (tarjeta?: string) => void;
  close: () => void;
}

const Ctx = createContext<ModalsApi | null>(null);

export function useModals() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useModals fuera de ModalsProvider");
  return ctx;
}

export function ModalsProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<Modal>(null);
  const close = () => setModal(null);

  const api = useMemo<ModalsApi>(
    () => ({
      openMenu: () => setModal({ kind: "menu" }),
      openIngreso: (editing) => setModal({ kind: "ingreso", editing }),
      openGasto: (editing) => setModal({ kind: "gasto", editing }),
      openTarjeta: (titular) => setModal({ kind: "tarjeta", titular }),
      openCompra: (tarjeta) => setModal({ kind: "compra", tarjeta }),
      close,
    }),
    []
  );

  return (
    <Ctx.Provider value={api}>
      {children}

      <Sheet open={modal?.kind === "menu"} title="¿Qué querés agregar?" onClose={close}>
        <div className="space-y-3">
          <MenuOption
            icon="cash"
            color="var(--income)"
            title="Ingreso"
            desc="Sueldo, changa, venta"
            onClick={() => setModal({ kind: "ingreso" })}
          />
          <MenuOption
            icon="receipt"
            color="var(--expense)"
            title="Gasto"
            desc="Personal o compartido"
            onClick={() => setModal({ kind: "gasto" })}
          />
          <MenuOption
            icon="credit-card"
            color="var(--accent)"
            fg="var(--on-accent)"
            title="Gasto de tarjeta"
            desc="Compras y cuotas"
            onClick={() => setModal({ kind: "compra" })}
          />
        </div>
      </Sheet>

      <Sheet
        open={modal?.kind === "ingreso"}
        title={modal?.kind === "ingreso" && modal.editing ? "Editar ingreso" : "Agregar ingreso"}
        onClose={close}
      >
        {modal?.kind === "ingreso" && (
          <IngresoForm editing={modal.editing} onClose={close} />
        )}
      </Sheet>

      <Sheet
        open={modal?.kind === "gasto"}
        title={modal?.kind === "gasto" && modal.editing ? "Editar gasto" : "Agregar gasto"}
        onClose={close}
      >
        {modal?.kind === "gasto" && <GastoForm editing={modal.editing} onClose={close} />}
      </Sheet>

      <Sheet open={modal?.kind === "tarjeta"} title="Agregar tarjeta" onClose={close}>
        {modal?.kind === "tarjeta" && (
          <TarjetaForm titularInicial={modal.titular} onClose={close} />
        )}
      </Sheet>

      <Sheet open={modal?.kind === "compra"} title="Gasto de tarjeta" onClose={close}>
        {modal?.kind === "compra" && (
          <CompraForm tarjetaInicial={modal.tarjeta} onClose={close} />
        )}
      </Sheet>
    </Ctx.Provider>
  );
}

function MenuOption({
  icon,
  color,
  fg = "white",
  title,
  desc,
  onClick,
}: {
  icon: string;
  color: string;
  fg?: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-2xl border border-border p-4 active:scale-[0.99] transition"
    >
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ background: color, color: fg }}
      >
        <Icon name={icon} size={24} />
      </span>
      <span className="text-left">
        <span className="block text-[16px] font-semibold">{title}</span>
        <span className="block text-[13px] text-muted">{desc}</span>
      </span>
      <span className="ml-auto text-muted">
        <Icon name="chevron-right" size={20} />
      </span>
    </button>
  );
}
