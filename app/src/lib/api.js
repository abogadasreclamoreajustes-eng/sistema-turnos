// Toda la lógica de datos vive acá. El backend es el mismo Apps Script de
// siempre (Calendar + Sheets), pero ahora se llama por fetch() normal en vez
// de google.script.run -- eso es lo que elimina el bug del iframe donde el
// callback nunca se disparaba (aunque el servidor terminara bien).
const BASE_URL = 'https://script.google.com/macros/s/AKfycbyhjnuRIVAKueg33iWG41RTzhrMxNBVy3o0-t1Bfd9T7YlTHC87Mg4N_9rAB3vChMs2XA/exec';

// El backend ya no calcula nada en vivo (getAvailableSlots en Codigo.gs lee
// un snapshot precalculado): confirmado en el log de Ejecuciones que
// responde siempre en <1s. Lo que sigue fallando de forma intermitente es
// la capa de entrega de Google (el redirect de script.google.com hacia el
// servidor real), que a veces devuelve 404/503 aunque el script ya haya
// terminado bien -- eso se compensa reintentando rápido varias veces, no
// esperando más por intento.
const TIMEOUT_MS = 8000;
const MAX_INTENTOS = 6;
const ESPERA_ENTRE_INTENTOS_MS = 300;

async function fetchConTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function esperar_(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAvailableSlots() {
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
