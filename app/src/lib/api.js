// Toda la lógica de datos vive acá. El backend es el mismo Apps Script de
// siempre (Calendar + Sheets), pero ahora se llama por fetch() normal en vez
// de google.script.run -- eso es lo que elimina el bug del iframe donde el
// callback nunca se disparaba (aunque el servidor terminara bien).
const BASE_URL = 'https://script.google.com/macros/s/AKfycbyhjnuRIVAKueg33iWG41RTzhrMxNBVy3o0-t1Bfd9T7YlTHC87Mg4N_9rAB3vChMs2XA/exec';

// El backend ya no calcula nada en vivo (getAvailableSlots en Codigo.gs lee
// un snapshot precalculado): confirmado en el log de Ejecuciones que
// responde siempre en <1s. Lo que sigue siendo lento/inestable es la capa de
// ENTREGA de Google (script.google.com/exec en sí): medido de forma directa,
// el mismo pedido tarda a veces <1s y a veces 15-20s+ sin responder nada --
// esto es infraestructura de Google fuera de nuestro control, ningún
// reintento del lado del cliente lo arregla del todo, solo lo disimula a
// costa de que el cliente espere más.
//
// SOLUCIÓN: un workflow de GitHub Actions (.github/workflows/sync-turnos.yml)
// le pregunta a Apps Script cada 5 minutos, con paciencia, y deja la
// respuesta guardada como archivo estático (turnos.json) en el mismo sitio.
// Acá se lee PRIMERO ese archivo -- mismo origen, sin pasar por Google,
// prácticamente instantáneo -- y solo si no está disponible (sitio recién
// desplegado, antes del primer ciclo del robot, o el robot no pudo
// actualizar por 20+ min seguidos) se cae al pedido directo de siempre como
// respaldo, para que la página nunca quede sin datos.
const STATIC_URL = `${import.meta.env.BASE_URL}turnos.json`;
const STATIC_TIMEOUT_MS = 3500;
const STATIC_MAX_EDAD_MIN = 20; // más viejo que esto -> no confiar, usar el respaldo en vivo

const TIMEOUT_MS = 8000;
const MAX_INTENTOS = 6;
const ESPERA_ENTRE_INTENTOS_MS = 300;

async function fetchConTimeout(url, options, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function esperar_(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function intentarSlotsEstaticos_() {
  try {
    const res = await fetchConTimeout(`${STATIC_URL}?t=${Date.now()}`, { cache: 'no-store' }, STATIC_TIMEOUT_MS);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.dias)) return null;
    if (data.generatedAt) {
      const edadMin = (Date.now() - new Date(data.generatedAt).getTime()) / 60000;
      if (!(edadMin < STATIC_MAX_EDAD_MIN)) return null; // también descarta NaN si el reloj/formato fallan
    }
    return data.dias;
  } catch (err) {
    return null;
  }
}

async function getAvailableSlotsEnVivo_() {
  let ultimoError;
  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    try {
      const res = await fetchConTimeout(`${BASE_URL}?api=slots`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'No se pudieron cargar los turnos.');
      return data.dias;
    } catch (err) {
      ultimoError = err;
      if (intento < MAX_INTENTOS - 1) await esperar_(ESPERA_ENTRE_INTENTOS_MS);
    }
  }
  throw ultimoError;
}

export async function getAvailableSlots() {
  const rapido = await intentarSlotsEstaticos_();
  if (rapido) return rapido;
  return getAvailableSlotsEnVivo_();
}

export async function bookSlot(payload) {
  // Content-Type text/plain (no application/json): así el navegador manda
  // la solicitud como "simple request" y no dispara un preflight CORS, que
  // Apps Script no sabe responder (no implementa doOptions).
  const res = await fetchConTimeout(`${BASE_URL}?api=book`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
