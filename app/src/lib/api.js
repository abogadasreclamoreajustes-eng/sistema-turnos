// Toda la lógica de datos vive acá. El backend es el mismo Apps Script de
// siempre (Calendar + Sheets), pero ahora se llama por fetch() normal en vez
// de google.script.run -- eso es lo que elimina el bug del iframe donde el
// callback nunca se disparaba (aunque el servidor terminara bien).
const BASE_URL = 'https://script.google.com/macros/s/AKfycbyhjnuRIVAKueg33iWG41RTzhrMxNBVy3o0-t1Bfd9T7YlTHC87Mg4N_9rAB3vChMs2XA/exec';

export async function getAvailableSlots() {
  const res = await fetch(`${BASE_URL}?api=slots`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || 'No se pudieron cargar los turnos.');
  return data.dias;
}

export async function bookSlot(payload) {
  // Content-Type text/plain (no application/json): así el navegador manda
  // la solicitud como "simple request" y no dispara un preflight CORS, que
  // Apps Script no sabe responder (no implementa doOptions).
  const res = await fetch(`${BASE_URL}?api=book`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
