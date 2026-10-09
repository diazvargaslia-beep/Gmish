import { useState } from "react";
import "./App.css";

function App() {
  const [pagina, setPagina] = useState("inicio");
  const [panelAbierto, setPanelAbierto] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  function irA(destino) {
    setPagina(destino);
    setPanelAbierto(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function alternarPanel(nombre) {
    setPanelAbierto((actual) => (actual === nombre ? null : nombre));
  }

  function buscar(e) {
    e.preventDefault();
    irA("buscar");
  }

  return (
    <div className="hero">
      <header className="nav-bar">
        <div className="nav-right">
          <button
            className="icon-link"
            aria-label="Abrir buscador"
            aria-expanded={panelAbierto === "buscador"}
            onClick={() => alternarPanel("buscador")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>
          </button>

          <button
            className="icon-link"
            aria-label="Abrir carrito"
            aria-expanded={panelAbierto === "carrito"}
            onClick={() => alternarPanel("carrito")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.5L22 8H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </button>
        </div>

        <button
          className="logo-boton"
          onClick={() => irA("inicio")}
          aria-label="Ir al inicio"
        >
          G’MISH
        </button>

        <button
          className="menu-icon"
          aria-label="Abrir menú"
          aria-expanded={panelAbierto === "menu"}
          onClick={() => alternarPanel("menu")}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {panelAbierto === "menu" && (
        <nav className="menu-desplegable">
          <button onClick={() => irA("inicio")}>Inicio</button>
          <button onClick={() => irA("coleccion")}>Ver colección</button>
          <button onClick={() => irA("hombre")}>Hombre</button>
          <button onClick={() => irA("mujer")}>Mujer</button>
          <button onClick={() => irA("visitanos")}>Visítanos</button>
          <button onClick={() => irA("contacto")}>Contáctanos</button>
        </nav>
      )}

      {panelAbierto === "buscador" && (
        <form className="buscador-panel" onSubmit={buscar}>
          <input
            type="search"
            placeholder="¿Qué estás buscando?"
            aria-label="Buscar productos"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoFocus
          />
          <button type="submit">Buscar</button>
        </form>
      )}

      {panelAbierto === "carrito" && (
        <section className="carrito-panel">
          <div className="carrito-panel-titulo">
            <h2>Tu carrito</h2>
            <button
              className="cerrar-panel"
              onClick={() => setPanelAbierto(null)}
              aria-label="Cerrar carrito"
            >
              ×
            </button>
          </div>

          <div className="carrito-vacio">
            <p>Tu carrito está vacío.</p>
            <span>Descubre nuestra colección y encuentra tu estilo.</span>
            <button
              className="boton-interior"
              onClick={() => irA("coleccion")}
            >
              EXPLORAR COLECCIÓN
            </button>
          </div>
        </section>
      )}

      <main className="contenido-tienda">
        {pagina === "inicio" && (
          <section className="hero-content">
            <div className="portada-texto">
              <p className="portada-etiqueta">G’MISH COLLECTION</p>
              <h1 className="brand-name">G’MISH</h1>
              <h2 className="main-heading">ESTILO QUE NOS UNE</h2>
              <p className="sub-heading">
                OUTFITS QUE SE ADAPTAN A TU ESTILO
              </p>

              <div className="buttons-wrapper">
                <button
                  className="btn"
                  onClick={() => irA("coleccion")}
                >
                  VER COLECCIÓN
                </button>

                <button
                  className="btn"
                  onClick={() => irA("visitanos")}
                >
                  VISÍTANOS
                </button>
              </div>
            </div>
          </section>
        )}

        {pagina === "coleccion" && (
          <section className="seccion-interior pagina-coleccion">
            <p className="seccion-etiqueta">G’MISH COLLECTION</p>
            <h1>Encuentra tu estilo</h1>
            <p className="intro-coleccion">
              Explora nuestra selección para cada estilo.
            </p>

            <div className="coleccion-categorias">
              <button
                className="categoria-boton"
                onClick={() => irA("hombre")}
              >
                <img
                  src="/hombre.jpg"
                  alt="Colección de hombre"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="categoria-overlay" />
                <span className="categoria-contenido">
                  <span className="categoria-subtitulo">DESCUBRE</span>
                  <span className="categoria-nombre">Hombre</span>
                  <span className="categoria-enlace">EXPLORAR ↗</span>
                </span>
              </button>

              <button
                className="categoria-boton"
                onClick={() => irA("mujer")}
              >
                <img
                  src="/mujer.jpg"
                  alt="Colección de mujer"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="categoria-overlay" />
                <span className="categoria-contenido">
                  <span className="categoria-subtitulo">DESCUBRE</span>
                  <span className="categoria-nombre">Mujer</span>
                  <span className="categoria-enlace">EXPLORAR ↗</span>
                </span>
              </button>
            </div>
          </section>
        )}

        {(pagina === "hombre" || pagina === "mujer") && (
          <section className="seccion-interior pagina-vacia">
            <p className="seccion-etiqueta">G’MISH COLLECTION</p>
            <h1>{pagina === "hombre" ? "Hombre" : "Mujer"}</h1>
            <p>
              Estamos preparando esta colección. Próximamente encontrarás
              aquí nuestras prendas.
            </p>
            <button
              className="boton-interior"
              onClick={() => irA("coleccion")}
            >
              VOLVER A CATEGORÍAS
            </button>
          </section>
        )}

        {pagina === "buscar" && (
          <section className="seccion-interior pagina-vacia">
            <p className="seccion-etiqueta">G’MISH COLLECTION</p>
            <h1>Resultados de búsqueda</h1>
            <p className="texto-busqueda">
              {busqueda.trim()
                ? `Buscaste: “${busqueda.trim()}”`
                : "Explora nuestra colección."}
            </p>
            <p>
              Aún no hay prendas publicadas. Cuando agregues productos desde
              tu panel de administración, conectaremos el buscador con ellos.
            </p>
            <button
              className="boton-interior"
              onClick={() => irA("coleccion")}
            >
              VER CATEGORÍAS
            </button>
          </section>
        )}

        {pagina === "visitanos" && (
          <section className="seccion-interior pagina-vacia">
            <p className="seccion-etiqueta">ESTAMOS PARA TI</p>
            <h1>Visítanos</h1>
            <p>
              Próximamente encontrarás aquí nuestra dirección y horarios.
            </p>
            <button
              className="boton-interior"
              onClick={() => irA("inicio")}
            >
              VOLVER AL INICIO
            </button>
          </section>
        )}

        {pagina === "contacto" && (
          <section className="seccion-interior pagina-vacia">
            <p className="seccion-etiqueta">ESTAMOS PARA TI</p>
            <h1>Contáctanos</h1>
            <p>Pronto añadiremos aquí nuestros datos de contacto.</p>
            <button
              className="boton-interior"
              onClick={() => irA("inicio")}
            >
              VOLVER AL INICIO
            </button>
          </section>
        )}
      </main>

      <footer className="footer">
        <span className="footer-logo">G’MISH</span>
        <p>Tu estilo, nuestra inspiración.</p>
        <span>© 2026 G’MISH. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}

export default App;