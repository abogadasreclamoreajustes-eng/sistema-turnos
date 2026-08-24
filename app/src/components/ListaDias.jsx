export default function ListaDias({ estado, dias, slotSeleccionado, onSelect, onReintentar }) {
  if (estado === 'cargando') {
    return <p className="cargando">Buscando horarios disponibles...</p>;
  }
  if (estado === 'error') {
    return (
      <div className="cargando">
        <p>No pudimos cargar los turnos disponibles.</p>
        <button type="button" className="slot-btn" onClick={onReintentar}>Reintentar</button>
      </div>
    );
  }
  if (estado === 'tardando') {
    return <p className="cargando">Esto está tardando más de lo normal, pero seguimos intentando...</p>;
  }
  if (!dias || dias.length === 0) {
    return <p className="cargando">No hay turnos disponibles en este momento. Escribinos directamente y te ayudamos a coordinar.</p>;
  }

  return (
    <>
      {dias.map((dia) => (
        <div className="dia-bloque" key={dia.fecha}>
          <div className="dia-titulo">{dia.diaLabel.charAt(0).toUpperCase() + dia.diaLabel.slice(1)}</div>
          <div className="slots">
            {dia.slots.map((slot) => (
              <button
                key={slot.startIso}
                type="button"
                className={`slot-btn${slotSeleccionado && slotSeleccionado.startIso === slot.startIso ? ' selected' : ''}`}
                onClick={() => onSelect(slot)}
              >
                {slot.horaLabel}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
