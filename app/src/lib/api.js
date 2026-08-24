// Toda la lógica de datos vive acá. El backend es el mismo Apps Script de
// siempre (Calendar + Sheets), pero ahora se llama por fetch() normal en vez
// de google.script.run -- eso es lo que elimina el bug del iframe donde el
// callback nunca se disparaba (aunque el servidor terminara bien).
const BASE_URL = 'https://script.google.com/macros/s/AKfycbyhjnuRIVAKueg33iWG41RTzhrMxNBVy3o0-t1Bfd9T7YlTHC87Mg4N_9rAB3vChMs2XA/exec';

// Leer los 3 calendarios (sala + 2 abogadas) del lado del servidor puede
// tardar bastante en Apps Script, sobre todo la primera carga después de
// que venció el caché del servidor. Un fetch() sin límite se puede quedar
// esperando casi indefinidamente si Google tarda de más -- por eso se le
// pone un tope duro y, si se cumple, se reintenta una vez antes de avisar
// error (la ejecución abandonada en el servidor sigue corriendo igual y
// deja el caché listo para el reintento).
const TIMEOUT_MS = 20000;

async function fetchConTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function getAvailableSlots() {
  let ultimoError;
  for (let intento = 0; intento < 2; intento++) {
    try {
      const res = await fetchConTimeout(`${BASE_URL}?api=slots`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'No se pudieron cargar los turnos.');
      return data.dias;
    } catch (err) {
      ultimoError = err;
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
