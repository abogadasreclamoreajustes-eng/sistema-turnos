import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Sirve el snapshot de disponibilidad guardado por turnos-sync.mts,
// instantáneo (lectura de Blobs, no toca Google en absoluto). El redirect
// en netlify.toml hace que el cliente lo pida como si fuera "turnos.json".
// Si todavía no hay ningún snapshot guardado (sitio recién desplegado,
// antes del primer ciclo del disparador), devuelve ok:false -- el cliente
// (app/src/lib/api.js) lo interpreta igual que "no disponible" y cae al
// pedido en vivo a Apps Script como respaldo.
export default async (_req: Request, _context: Context) => {
  const store = getStore('turnos');
  const data = await store.get('snapshot', { type: 'json' });

  return new Response(JSON.stringify(data || { ok: false, dias: [] }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};
