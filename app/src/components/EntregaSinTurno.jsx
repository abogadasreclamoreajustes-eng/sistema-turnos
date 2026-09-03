import { useState } from 'react';
import { registrarEntregaSinTurno } from '../lib/api.js';

const MOTIVOS = [
  'Entregar documentación',
  'Retirar documentación',
  'Entregar formularios',
  'Retirar formularios',
  'Realizar un pago',
  'Entregar dinero',
  'Otra gestión breve'
];

// Solo se renderiza (ver App.jsx) cuando el backend confirma que el
// próximo miércoles ya tiene al menos una consulta asignada -- si no hay
// ninguna consulta ese día, esta opción ni existe: no tiene sentido
// mandar a alguien a una oficina que ese día capaz ni abre.
export default function EntregaSinTurno({ info }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [confirmado, setConfirmado] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setMensaje('');
    registrarEntregaSinTurno({ fecha: info.fecha, nombre, telefono, email, motivo })
      .then((res) => {
        setEnviando(false);
        if (res.ok) {
          setConfirmado(res);
        } else {
          setMensaje(res.message || 'No se pudo registrar la visita.');
        }
      })
      .catch(() => {
        setEnviando(false);
        setMensaje('Ocurrió un error. Intentá de nuevo.');
      });
  }

  if (confirmado) {
    return (
      <div className="entrega-card">
        <p className="entrega-titulo">Visita registrada</p>
        <p className="entrega-desc">
          Te esperamos el {confirmado.diaLabel} entre <strong>{confirmado.franja}</strong> para{' '}
          {motivo.toLowerCase()}.
        </p>
        <p className="entrega-aviso">
          Recordamos que esta visita <strong>NO corresponde a una consulta ni a un turno profesional</strong>.
          Podés acercarte únicamente para realizar la entrega o retiro indicado.
        </p>
      </div>
    );
  }

  return (
    <div className="entrega-card">
      <p className="entrega-titulo">¿Solo necesitás entregar o retirar algo?</p>
      <p className="entrega-desc">
        Si no necesitás una consulta con una abogada, podés acercarte el {info.diaLabel} entre{' '}
        <strong>{info.franja}</strong> para hacer una gestión breve (entregar o retirar documentación,
        formularios, o un pago).
      </p>

      {!abierto && (
        <button type="button" className="entrega-btn-abrir" onClick={() => setAbierto(true)}>
          Registrar entrega sin turno
        </button>
      )}

      {abierto && (
        <form className="entrega-form" onSubmit={handleSubmit}>
          <label htmlFor="entrega-nombre">Nombre y apellido</label>
          <input type="text" id="entrega-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />

          <label htmlFor="entrega-telefono">Teléfono (opcional)</label>
          <input type="text" id="entrega-telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />

          <label htmlFor="entrega-email">Email (opcional, para mandarte la confirmación)</label>
          <input type="email" id="entrega-email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="entrega-motivo">¿Qué necesitás hacer?</label>
          <select id="entrega-motivo" required value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="">Seleccioná una opción</option>
            {MOTIVOS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <p className="entrega-aviso">
            Recordamos que esta visita <strong>NO corresponde a una consulta ni a un turno profesional</strong>.
            Podés acercarte únicamente para realizar la entrega o retiro indicado.
          </p>

          <button type="submit" className="entrega-btn-confirmar" disabled={enviando}>
            {enviando ? 'Registrando...' : 'Confirmar visita'}
          </button>
          {mensaje && <div className="entrega-mensaje">{mensaje}</div>}
        </form>
      )}
    </div>
  );
}
