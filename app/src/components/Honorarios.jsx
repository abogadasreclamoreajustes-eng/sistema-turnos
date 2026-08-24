export default function Honorarios() {
  return (
    <>
      <p className="label-divisor">Honorarios</p>
      <div className="honorarios-card">
        <div className="honorario-fila">
          <div className="honorario-info">
            <span className="honorario-icono">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v18M5 7l-3 6a3 3 0 0 0 6 0l-3-6Zm14 0l-3 6a3 3 0 0 0 6 0l-3-6ZM5 7h14M8 21h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div className="honorario-texto">
              <span className="honorario-nombre">Consulta jurídica</span>
              <span className="honorario-desc">Reunión presencial en nuestra oficina</span>
            </div>
          </div>
          <span className="honorario-precio">$30.000</span>
        </div>
        <div className="honorario-fila">
          <div className="honorario-info">
            <span className="honorario-icono">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M14 3v4h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </span>
            <div className="honorario-texto">
              <span className="honorario-nombre">Informe previsional</span>
              <span className="honorario-desc">Análisis y proyección jubilatoria</span>
            </div>
          </div>
          <span className="honorario-precio">$40.000</span>
        </div>
      </div>
    </>
  );
}
