# Casa · Finanzas de Juli & Nacho

App web (PWA instalable) para administrar las finanzas mensuales de la pareja.
Next.js + TypeScript + Tailwind + Supabase (PostgreSQL).

## Puesta en marcha (2 pasos)

### 1. Crear las tablas en Supabase (una sola vez)

1. Entrá a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor**.
2. Abrí el archivo [`supabase/schema.sql`](supabase/schema.sql), copiá **todo** el contenido y pegalo.
3. Tocá **Run**. Crea las 7 tablas, las categorías, los usuarios (Juli y Nacho) y los permisos.

> Es idempotente: podés correrlo de nuevo sin perder datos.

### 2. Levantar la app

```bash
npm install
npm run dev
```

Abrí http://localhost:3000 en el celular o la compu. Al entrar elegís si sos Juli o Nacho.

Las claves de Supabase ya están en `.env.local`.

## Instalar como app (PWA)

- **Celular (Chrome/Safari):** menú del navegador → *Agregar a pantalla de inicio*.
- **Compu (Chrome/Edge):** ícono de instalar en la barra de direcciones.

## Estructura

- `src/app/` — pantallas: Inicio, Ingresos, Gastos, Tarjetas, Resumen, Historial, Configuración.
- `src/components/` — UI (bottom nav, formularios, tarjetas, gráficos).
- `src/lib/` — conexión a Supabase, consultas, cálculos del resumen, formato $ AR y fechas.
- `supabase/schema.sql` — base de datos.

## Cómo funciona la plata

- **Gasto compartido:** cuenta 50% para cada uno en los totales.
- **Gasto personal:** solo de quien pagó.
- **Compra en cuotas:** genera automáticamente una cuota por mes (ej: $120.000 en 6 → 6× $20.000).
- **Gasto mensual:** se copia a los 6 meses siguientes.
- **Pagar el resumen de la tarjeta no es un gasto nuevo:** el gasto son las cuotas ya cargadas.
