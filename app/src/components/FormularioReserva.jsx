import { useState } from 'react';

const MOTIVOS = [
  'Previsional / Reajuste jubilatorio',
  'Laboral',
  'Sucesiones',
  'Familia (Divorcios y Alimentos)',
  'Marcas',
  'Accidentes de tránsito',
  'Contratos',
  'Otro'
];

export default function FormularioReserva({ enviando, mensaje, onSubmit }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ nombre, telefono, email, motivo });
  }

  return (
    <form id="form-reserva" style={{ display: 'block' }} onSubmit={handleSubmit}>
      <label htmlFor="nombre">Nombre y apellido</label>
      <input type="text" id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />

      <label htmlFor="telefono">Teléfono (WhatsApp)</label>
      <input type="text" id="telefono" required value={telefono} onChange={(e) => setTelefono(e.target.value)} />

      <label htmlFor="email">Email</label>
      <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

      <label htmlFor="motivo">Motivo de la consulta</label>
      <select id="motivo" required value={motivo} onChange={(e) => setMotivo(e.target.value)}>
        <option value="">Seleccioná una opción</option>
        {MOTIVOS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>

      <button type="submit" className="confirmar" id="btn-confirmar" disabled={enviando}>
        {enviando ? 'Confirmando...' : 'Confirmar turno'}
      </button>
      <div id="mensaje">{mensaje}</div>
    </form>
  );
}
