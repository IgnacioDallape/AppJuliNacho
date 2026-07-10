"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Icon } from "@/components/Icon";
import { SectionTitle } from "@/components/ui";

type Tema = "claro" | "oscuro";

export default function ConfigPage() {
  const { usuarios, currentUser, setCurrentUser } = useApp();
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    setTema(localStorage.getItem("appcasa.theme") === "dark" ? "oscuro" : "claro");
  }, []);

  function aplicarTema(t: Tema) {
    setTema(t);
    const dark = t === "oscuro";
    localStorage.setItem("appcasa.theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }

  return (
    <>
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-[22px] font-semibold">Configuración</h1>
      </header>

      <div className="px-4 space-y-2">
        <SectionTitle>Apariencia</SectionTitle>
        <div className="card p-2 flex gap-2">
          {(["claro", "oscuro"] as Tema[]).map((t) => (
            <button
              key={t}
              onClick={() => aplicarTema(t)}
              className={`seg capitalize flex items-center justify-center gap-1.5 ${
                tema === t ? "seg-on" : ""
              }`}
            >
              <Icon name={t === "claro" ? "sun" : "moon"} size={17} />
              {t}
            </button>
          ))}
        </div>

        <SectionTitle>Usuario</SectionTitle>
        <div className="card p-2 flex gap-2">
          {usuarios.map((u) => (
            <button
              key={u.id}
              onClick={() => setCurrentUser(u)}
              className={`seg ${currentUser?.id === u.id ? "seg-on" : ""}`}
            >
              {u.nombre}
            </button>
          ))}
        </div>

        <SectionTitle>Secciones</SectionTitle>
        <div className="card divide-y divide-border">
          <NavLink href="/ingresos" icon="cash" label="Ingresos" />
          <NavLink href="/historial" icon="history" label="Historial" />
          <NavLink href="/tarjetas" icon="credit-card" label="Tarjetas" />
        </div>

        <div className="text-center text-muted text-[12px] pt-6 pb-2">
          Casa · Finanzas de Juli & Nacho
        </div>
      </div>
    </>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3.5 active:bg-surface-2 transition">
      <span className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-accent-strong">
        <Icon name={icon} size={19} />
      </span>
      <span className="font-medium text-[15px]">{label}</span>
      <Icon name="chevron-right" size={20} className="ml-auto text-muted" />
    </Link>
  );
}
