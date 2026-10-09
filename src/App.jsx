import './App.css';

function App() {
  return (
    <div className="hero">
      {/* Barra superior */}
      <nav className="nav-bar">
        <div className="menu-icon">☰</div>
        <div className="nav-right">
          <span className="icon-link">🔍</span>
          <span className="icon-link">🛒</span>
        </div>
      </nav>

      {/* Contenido central */}
      <main className="hero-content">
        <h1 className="brand-name">G'MISH</h1>
        <h2 className="main-heading">ESTILO QUE NOS UNE</h2>
        <p className="sub-heading">OUTFITS QUE SE ADAPTAN A TU ESTILO</p>

        <div className="buttons-wrapper">
          <button className="btn">VER COLECCIÓN</button>
          <button className="btn">VISÍTANOS</button>
        </div>
      </main>

      {/* Footer abajo */}
      <footer className="footer">
        © 2026 G'MISH — Todos los derechos reservados
      </footer>
    </div>
  );
}

export default App;