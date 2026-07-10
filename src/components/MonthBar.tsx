"use client";

import { useApp } from "@/lib/store";
import { addMonths, monthLabel } from "@/lib/format";
import { Icon } from "./Icon";

export function MonthBar({ subtitle }: { subtitle?: string }) {
  const { month, setMonth, currentUser } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur px-4 pt-4 pb-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] text-muted">
            {subtitle ?? `Hola, ${currentUser?.nombre}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Mes anterior"
              className="w-7 h-7 -ml-1 flex items-center justify-center text-muted"
            >
              <Icon name="chevron-left" size={22} />
            </button>
            <h1 className="text-[20px] font-semibold min-w-[150px] text-center">
              {monthLabel(month)}
            </h1>
            <button
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Mes siguiente"
              className="w-7 h-7 flex items-center justify-center text-muted"
            >
              <Icon name="chevron-right" size={22} />
            </button>
          </div>
        </div>
        <UserAvatar />
      </div>
    </header>
  );
}

function UserAvatar() {
  const { currentUser, usuarios, setCurrentUser } = useApp();
  if (!currentUser) return null;
  const other = usuarios.find((u) => u.id !== currentUser.id);
  return (
    <button
      onClick={() => other && setCurrentUser(other)}
      aria-label="Cambiar de usuario"
      className="w-10 h-10 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center font-semibold"
      title={`Sos ${currentUser.nombre}. Tocá para cambiar.`}
    >
      {currentUser.nombre[0]}
    </button>
  );
}
