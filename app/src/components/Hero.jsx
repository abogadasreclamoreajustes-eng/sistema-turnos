import heroImg from '../assets/hero-oficina.jpg';

export default function Hero() {
  return (
    <header className="hero-oficina" style={{ '--hero-bg-url': `url(${heroImg})` }}>
      <div className="hero-oficina-contenido">
        <p className="eyebrow-hero">Consulta jurídica presencial</p>
        <h1 className="hero-titulo">Reservá tu turno en nuestra oficina de Rosario</h1>
        <div className="direccion-card-hero">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.14 11.25 7.45 11.5a.85.85 0 0 0 1.1 0C12.86 21.25 20 15.25 20 10c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor" />
          </svg>
          <span>Av. Carballo 186, piso 2 oficina B — Puerto Norte, Rosario</span>
        </div>
        <a className="como-llegar-hero" href="https://g.co/kgs/xB1AhV" target="_blank" rel="noopener noreferrer">Cómo llegar →</a>
      </div>
    </header>
  );
}
