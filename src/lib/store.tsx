"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCategorias, getUsuarios } from "./data";
import { monthKey } from "./format";
import type { Categoria, Usuario } from "./types";

interface AppState {
  usuarios: Usuario[];
  categorias: Categoria[];
  ready: boolean;
  error: string | null;

  currentUser: Usuario | null;
  setCurrentUser: (u: Usuario) => void;

  month: string; // YYYY-MM
  setMonth: (m: string) => void;

  // señal para refrescar datos tras una mutación
  version: number;
  refresh: () => void;

  usuarioPorNombre: (nombre: string) => Usuario | undefined;
}

const Ctx = createContext<AppState | null>(null);

const LS_USER = "appcasa.usuario";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUserState] = useState<Usuario | null>(null);
  const [month, setMonth] = useState<string>(() => monthKey(new Date()));
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [us, cats] = await Promise.all([getUsuarios(), getCategorias()]);
        if (!alive) return;
        setUsuarios(us);
        setCategorias(cats);
        const savedName =
          typeof window !== "undefined" ? localStorage.getItem(LS_USER) : null;
        const found = us.find((u) => u.nombre === savedName) ?? null;
        setCurrentUserState(found);
        setReady(true);
      } catch (e) {
        if (!alive) return;
        setError(
          "No se pudo conectar con Supabase. Revisá que corriste el schema.sql y las claves en .env.local."
        );
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setCurrentUser = useCallback((u: Usuario) => {
    setCurrentUserState(u);
    if (typeof window !== "undefined") localStorage.setItem(LS_USER, u.nombre);
  }, []);

  // Aplica la paleta del usuario activo (data-user en <html>).
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (currentUser) {
      document.documentElement.setAttribute("data-user", currentUser.nombre.toLowerCase());
    } else {
      document.documentElement.removeAttribute("data-user");
    }
  }, [currentUser]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const usuarioPorNombre = useCallback(
    (nombre: string) => usuarios.find((u) => u.nombre === nombre),
    [usuarios]
  );

  const value = useMemo<AppState>(
    () => ({
      usuarios,
      categorias,
      ready,
      error,
      currentUser,
      setCurrentUser,
      month,
      setMonth,
      version,
      refresh,
      usuarioPorNombre,
    }),
    [usuarios, categorias, ready, error, currentUser, setCurrentUser, month, version, refresh, usuarioPorNombre]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
