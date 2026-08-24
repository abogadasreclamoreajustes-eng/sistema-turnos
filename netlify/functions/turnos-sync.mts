import { schedule } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Corre en la infraestructura de Netlify cada 5 minutos (no en el navegador
// de ningún cliente), así que puede darse el lujo de reintentar con
// paciencia. Le pregunta a Apps Script por la disponibilidad y la deja
// guardada en Netlify Blobs. La función turnos.ts (a un click de acá) lee
// ese valor y lo sirve instantáneo, sin pasar nunca por Google en el camino
// que sí importa que sea rápido: el de un cliente real abriendo la página.
//
// Por qué hace falta esto: script.google.com/exec (la puerta de entrada de
// Apps Script) es intermitentemente lento por infraestructura de Google --
// medido de forma directa, el mismo pedido tarda a veces <1s y a veces
// 15-20s+ sin responder nada. El script en sí (Codigo.gs) responde siempre
// en <1s porque lee un snapshot precalculado; el problema nunca fue el
// cálculo, sino esa capa de entrega.
const BASE_URL = 'https://script.google.com/macros/s/AKfycbyhjnuRIVAKueg33iWG41RTzhrMxNBVy3o0-t1Bfd9T7YlTHC87Mg4N_9rAB3vChMs2XA/exec';
const MAX_INTENTOS = 6;
const TIMEOUT_MS = 25000;
const ESPERA_ENTRE_INTENTOS_MS = 8000;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchConTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function obtenerDisponibilidad() {
  let ultimoError: unknown;
  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    try {
      const res = await fetchConTimeout(`${BASE_URL}?api=slots`, TIMEOUT_MS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.dias)) throw new Error(data.message || 'Respuesta inválida.');
      return data;
    } catch (err) {
      ultimoError = err;
      console.log(`[turnos-sync] intento ${intento + 1}/${MAX_INTENTOS} falló:`, err instanceof Error ? err.message : err);
      if (intento < MAX_INTENTOS - 1) await esperar(ESPERA_ENTRE_INTENTOS_MS);
    }
  }
  throw ultimoError;
}

const handler = async () => {
  const store = getStore('turnos');
  try {
    const data = await obtenerDisponibilidad();
    data.generatedAt = new Date().toISOString();
    await store.setJSON('snapshot', data);
    console.log(`[turnos-sync] snapshot actualizado: ${data.dias.length} días con disponibilidad.`);
  } catch (err) {
    // No se pudo refrescar en este ciclo: se deja el snapshot anterior tal
    // cual (mejor un dato un poco viejo que romper el archivo) -- turnos.ts
    // ya descarta un snapshot demasiado viejo y cae al pedido en vivo como
    // respaldo si esto se repite por muchos ciclos seguidos.
    console.error('[turnos-sync] no se pudo actualizar el snapshot:', err instanceof Error ? err.message : err);
  }
};

export default schedule('*/5 * * * *', handler);
