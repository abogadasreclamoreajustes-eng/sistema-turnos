function toBasic(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export default function Confirmacion({ resultado, slotSeleccionado }) {
  const fecha = resultado.fechaLabel || '';
  const hora = (resultado.horaLabel || (slotSeleccionado && slotSeleccionado.horaLabel) || '') + ' hs';

  let gcalUrl = '#';
  let icsHref = '#';

  if (resultado.startIso && resultado.endIso) {
    const tituloEvento = 'Consulta - ' + (resultado.motivo || 'Estudio Alonso & Porcel de Peralta');
    const lugarEvento = resultado.direccion || 'Av. Carballo 186, piso 2 oficina B, Puerto Norte, Rosario';

    gcalUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(tituloEvento)
      + '&dates=' + toBasic(resultado.startIso) + '/' + toBasic(resultado.endIso)
      + '&details=' + encodeURIComponent('Consulta presencial con nuestro estudio jurídico.')
      + '&location=' + encodeURIComponent(lugarEvento);

    const icsLines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      'DTSTART:' + toBasic(resultado.startIso),
      'DTEND:' + toBasic(resultado.endIso),
      'SUMMARY:' + tituloEvento,
      'LOCATION:' + lugarEvento,
      'DESCRIPTION:Consulta presencial con nuestro estudio jurídico.',
      'END:VEVENT', 'END:VCALENDAR'
    ];
    const icsBlob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar' });
    icsHref = URL.createObjectURL(icsBlob);
  }

  return (
    <div className="contenedor" id="confirmacion" style={{ display: 'block' }}>
      <div className="confirmacion-card">
        <div className="confirmacion-check">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="confirmacion-eyebrow">Reserva exitosa</p>
        <h2 className="confirmacion-titulo">¡Turno confirmado!</h2>

        <div className="confirmacion-detalle">
          <div className="confirmacion-fila">
            <span className="confirmacion-icono">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div className="confirmacion-texto">
              <span className="confirmacion-label">Día</span>
              <span className="confirmacion-valor">{fecha}</span>
            </div>
          </div>
          <div className="confirmacion-fila">
            <span className="confirmacion-icono">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div className="confirmacion-texto">
              <span className="confirmacion-label">Hora</span>
              <span className="confirmacion-valor">{hora}</span>
            </div>
          </div>
        </div>

        <p className="confirmacion-nota">Te esperamos en el día y horario indicado. Si necesitás reprogramar tu consulta, comunicate con nosotros con la mayor anticipación posible.</p>

        <div className="confirmacion-calendario">
          <a className="btn-calendario" href={gcalUrl} target="_blank" rel="noopener noreferrer">Google Calendar</a>
          <a className="btn-calendario btn-calendario-outline" href={icsHref} download="turno.ics">Apple / Outlook</a>
        </div>

        <p className="confirmacion-email-nota">Te enviamos un email con los detalles y un link por si necesitás cancelarlo.</p>
      </div>
    </div>
  );
}
