import { useState } from 'react';

function TarjetaPago({ iniciales, nombre, alias }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(alias);
    } catch (e) {
      const temp = document.createElement('textarea');
      temp.value = alias;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      try { document.execCommand('copy'); } catch (e2) { /* noop */ }
      document.body.removeChild(temp);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <div className="pago-card">
      <div className="pago-persona">
        <span className="pago-avatar">{iniciales}</span>
        <div className="pago-datos">
          <span className="pago-nombre">{nombre}</span>
          <span className="pago-alias">
            <span className="pago-alias-label">Alias</span>
            <span className="pago-alias-valor">{alias}</span>
          </span>
        </div>
      </div>
      <button type="button" className={`btn-copiar${copiado ? ' copiado' : ''}`} onClick={copiar}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <span className="btn-copiar-label">{copiado ? 'Copiado' : 'Copiar alias'}</span>
      </button>
    </div>
  );
}

export default function FormasDePago() {
  return (
    <>
      <p className="label-divisor">Formas de pago</p>
      <TarjetaPago iniciales="BA" nombre="Dra. Brenda Alonso" alias="b-alonso.mp" />
      <TarjetaPago iniciales="EP" nombre="Dra. Evelyn Porcel de Peralta" alias="evelyn.p.abogada" />
      <p className="pago-nota">Podés transferir antes o el día de tu consulta, a nombre de la abogada que te asigne el sistema.</p>
    </>
  );
}
