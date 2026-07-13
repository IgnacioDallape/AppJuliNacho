"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "./store";
import {
  getAjusteDisponible,
  getCuotasDelMes,
  getGastosDelMes,
  getIngresosDelMes,
  getPagosDelMes,
  getPendienteTarjetas,
  getTarjetas,
  type CuotaConContexto,
} from "./data";
import { calcularResumen, type ResumenMes, type PagoConTitular } from "./resumen";
import type { Gasto, Ingreso } from "./types";

export function useMonthData() {
  const { month, version, usuarios, categorias } = useApp();
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cuotas, setCuotas] = useState<CuotaConContexto[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [pendienteTarjetas, setPendienteTarjetas] = useState(0);
  const [ajuste, setAjuste] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [i, g, c, pend, pagosMes, tarjetas, aj] = await Promise.all([
        getIngresosDelMes(month),
        getGastosDelMes(month),
        getCuotasDelMes(month),
        getPendienteTarjetas(),
        getPagosDelMes(month),
        getTarjetas(),
        getAjusteDisponible(month),
      ]);
      setIngresos(i);
      setGastos(g);
      setCuotas(c);
      setPendienteTarjetas(pend);
      setAjuste(aj);

      const titularDe = new Map(tarjetas.map((t) => [t.id, t.titular_id]));
      const pagos: PagoConTitular[] = pagosMes.map((p) => ({
        monto: Number(p.monto),
        titular_id: titularDe.get(p.tarjeta_id) ?? null,
      }));

      const res = calcularResumen({ usuarios, categorias, ingresos: i, gastos: g, pagos });
      // Ajuste manual: se suma al disponible calculado de la pareja.
      res.pareja.saldo += aj;
      setResumen(res);
    } finally {
      setLoading(false);
    }
  }, [month, usuarios, categorias]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, version, usuarios.length, categorias.length]);

  return { ingresos, gastos, cuotas, resumen, pendienteTarjetas, ajuste, loading, reload: load };
}
