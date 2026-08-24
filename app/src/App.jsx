import { useEffect, useRef, useState } from 'react';
import Hero from './components/Hero.jsx';
import Honorarios from './components/Honorarios.jsx';
import FormasDePago from './components/FormasDePago.jsx';
import ListaDias from './components/ListaDias.jsx';
import FormularioReserva from './components/FormularioReserva.jsx';
import Confirmacion from './components/Confirmacion.jsx';
import { getAvailableSlots, bookSlot } from './lib/api.js';

export default function App() {
  const [estado, setEstado] = useState('cargando');
  const [dias, setDias] = useState([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [resultado, setResultado] = useState(null);
  const tardandoTimer = useRef(null);

  useEffect(() => {
    cargarDisponibilidad();
    return () => clearTimeout(tardandoTimer.current);
  }, []);

  function cargarDisponibilidad() {
    setEstado('cargando');
    tardandoTimer.current = setTimeout(() => {
      setEstado((actual) => (actual === 'cargando' ? 'tardando' : actual));
    }, 15000);

    getAvailableSlots()
      .then((resultadoDias) => {
        clearTimeout(tardandoTimer.current);
        setDias(resultadoDias);
        setEstado('listo');
      })
      .catch(() => {
        clearTimeout(tardandoTimer.current);
        setEstado('error');
      });
  }

  function seleccionarSlot(slot) {
    setSlotSeleccionado(slot);
    setMensaje('');
  }

  function confirmarTurno(datosFormulario) {
    if (!slotSeleccionado) return;

    setEnviando(true);
    setMensaje('');

    const payload = {
      startIso: slotSeleccionado.startIso,
      endIso: slotSeleccionado.endIso,
      ...datosFormulario
    };

    bookSlot(payload)
      .then((res) => {
        if (res.ok) {
          setResultado(res);
        } else {
          setMensaje(res.message || 'No se pudo confirmar el turno.');
          setEnviando(false);
          cargarDisponibilidad();
        }
      })
      .catch(() => {
        setMensaje('Ocurrió un error. Intentá de nuevo.');
        setEnviando(false);
      });
  }

  if (resultado) {
    return <Confirmacion resultado={resultado} slotSeleccionado={slotSeleccionado} />;
  }

  return (
    <>
      <Hero />
      <div className="contenedor" id="vista-principal">
        <div className="seccion-pago">
          <Honorarios />
          <FormasDePago />
        </div>

        <p className="subtitulo">Elegí el día y horario que prefieras.</p>
        <div id="lista-dias">
          <ListaDias estado={estado} dias={dias} slotSeleccionado={slotSeleccionado} onSelect={seleccionarSlot} onReintentar={cargarDisponibilidad} />
        </div>

        {slotSeleccionado && (
          <FormularioReserva enviando={enviando} mensaje={mensaje} onSubmit={confirmarTurno} />
        )}
      </div>
    </>
  );
}
