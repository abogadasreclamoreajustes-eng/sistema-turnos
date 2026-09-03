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
// SOLUCIÓN para la CARGA de turnos: una función programada de Netlify
// (netlify/functions/turnos-sync.mts) le pregunta a Apps Script cada 5
// minutos, con paciencia, y deja la respuesta guardada en Netlify Blobs.
// Otra función (turnos.mts) la sirve al instante en "turnos.json" (mismo
// origen, sin pasar por Google). Acá se lee PRIMERO ese archivo y solo si
// no está disponible o está viejo se cae al pedido directo de siempre como
// respaldo, para que la página nunca quede sin datos.
//
// La RESERVA (bookSlot, más abajo) sufre el mismo problema de entrega --
// confirmado en una prueba real (2026-08-25): el turno se guardó
// perfectamente en Calendar/Sheets del lado del servidor, pero la respuesta
// nunca llegó al navegador y la persona vio "Ocurrió un error" como si no
// hubiera pasado nada. No se puede resolver con un snapshot estático (es
// una escritura, tiene que ir en vivo), así que acá sí hace falta reintentar
// -- con cuidado: si el primer intento en realidad tuvo éxito del lado del
// servidor, un reintento choca con el lock de Apps Script y devuelve "Ese
// turno se acaba de ocupar" (mismo mensaje que si alguien más lo hubiera
// tomado) -- por eso ese mensaje se aclara más abajo cuando ya hubo al
// menos un fallo de red antes.
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

const BOOK_TIMEOUT_MS = 10000;
const BOOK_MAX_INTENTOS = 3;
const BOOK_ESPERA_ENTRE_INTENTOS_MS = 500;
const MENSAJE_OCUPADO_TRAS_FALLO_RED =
  'Ese horario ya no está disponible. Si fuiste vos quien lo reservó recién y la confirmación tardó en llegar, revisá tu email antes de elegir otro turno.';
const MENSAJE_SIN_CONFIRMACION =
  'No pudimos confirmar la respuesta del servidor. Antes de intentar de nuevo, revisá tu email: si la reserva se guardó igual, te va a llegar una confirmación automática.';

// Entrega sin turno: solo se ofrece para el próximo miércoles habilitado,
// y solo si ese día ya tiene una consulta asignada (mismo criterio que
// habilita el día para consultas). No es crítico como los turnos -- si
// falla, simplemente no se muestra la opción en vez de romper la página.
export async function getEntregaSinTurnoInfo() {
  try {
    const res = await fetchConTimeout(`${BASE_URL}?api=entrega_info`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'No se pudo cargar.');
    return data;
  } catch (err) {
    return { ok: false, disponible: false };
  }
}

export async function registrarEntregaSinTurno(payload) {
  const res = await fetchConTimeout(`${BASE_URL}?api=entrega_registrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }, BOOK_TIMEOUT_MS);
  return res.json();
}

export async function bookSlot(payload) {
  let huboFalloDeRed = false;

  for (let intento = 0; intento < BOOK_MAX_INTENTOS; intento++) {
    try {
      // Content-Type text/plain (no application/json): así el navegador manda
      // la solicitud como "simple request" y no dispara un preflight CORS, que
      // Apps Script no sabe responder (no implementa doOptions).
      const res = await fetchConTimeout(`${BASE_URL}?api=book`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }, BOOK_TIMEOUT_MS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data.ok && huboFalloDeRed && /se acaba de ocupar/i.test(data.message || '')) {
        return { ...data, message: MENSAJE_OCUPADO_TRAS_FALLO_RED };
      }
      return data;
    } catch (err) {
      huboFalloDeRed = true;
      if (intento === BOOK_MAX_INTENTOS - 1) {
        return { ok: false, message: MENSAJE_SIN_CONFIRMACION };
      }
      await esperar_(BOOK_ESPERA_ENTRE_INTENTOS_MS);
    }
  }
}
