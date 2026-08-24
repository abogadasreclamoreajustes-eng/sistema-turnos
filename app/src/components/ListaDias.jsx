export default function ListaDias({ estado, dias, slotSeleccionado, onSelect }) {
  if (estado === 'cargando') {
    return <p className="cargando">Buscando horarios disponibles...</p>;
  }
  if (estado === 'error') {
    return <p className="cargando">Ocurrió un error al cargar los turnos. Recargá la página.</p>;
  }
  if (estado === 'tardando') {
    return <p className="cargando">Esto está tardando más de lo normal. Escribinos directamente y te ayudamos a coordinar tu turno.</p>;
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
