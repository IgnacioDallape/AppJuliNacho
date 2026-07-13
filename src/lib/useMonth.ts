"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "./store";
import {
  getCuotasDelMes,
  getGastosDelMes,
  getIngresosDelMes,
  getPendienteTarjetas,
  type CuotaConContexto,
} from "./data";
import { calcularResumen, type ResumenMes } from "./resumen";
import type { Gasto, Ingreso } from "./types";

export function useMonthData() {
  const { month, version, usuarios, categorias } = useApp();
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cuotas, setCuotas] = useState<CuotaConContexto[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [pendienteTarjetas, setPendienteTarjetas] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [i, g, c, pend] = await Promise.all([
        getIngresosDelMes(month),
        getGastosDelMes(month),
        getCuotasDelMes(month),
        getPendienteTarjetas(),
      ]);
      setIngresos(i);
      setGastos(g);
      setCuotas(c);
      setPendienteTarjetas(pend);
      setResumen(
        calcularResumen({ usuarios, categorias, ingresos: i, gastos: g, cuotas: c })
      );
    } finally {
      setLoading(false);
    }
  }, [month, usuarios, categorias]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, version, usuarios.length, categorias.length]);

  return { ingresos, gastos, cuotas, resumen, pendienteTarjetas, loading, reload: load };
}
