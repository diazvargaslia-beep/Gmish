
import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";
import { CartProvider, useCart } from "./CartContext";
import FeaturedProducts from "./components/FeaturedProducts";
import CategorySection from "./components/CategorySection";
import Cart from "./components/Cart";
import Admin from "./admin/Admin";

function Tienda() {
  const [pagina, setPagina] = useState("inicio");
  const [panelAbierto, setPanelAbierto] = useState(null);
  const [categoriaMenuAbierta, setCategoriaMenuAbierta] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorProductos, setErrorProductos] = useState("");
  const [portadas, setPortadas] = useState({
    inicio: "",
    hombre: "",
    mujer: "",
  });

  const [subcategoriasSeleccionadas, setSubcategoriasSeleccionadas] =
    useState({
      hombre: "todos",
      mujer: "todos",
    });

  const [esAdmin, setEsAdmin] = useState(
    window.location.pathname.replace(/\/+$/, "") === "/admin"
  );

  const { cart, openCart, cartOpen } = useCart();

  const cantidadCarrito = cart.reduce(
    (total, producto) => total + producto.quantity,
    0
  );

  // Restaurar la página al usar las flechas del navegador.
  useEffect(() => {
    const rutaInicial = window.location.pathname.replace(/\/+$/, "");
    const estadoActual = window.history.state;

    if (!estadoActual?.gmishPage && rutaInicial !== "/admin") {
      window.history.replaceState(
        {
          ...(estadoActual && typeof estadoActual === "object"
            ? estadoActual
            : {}),
          gmishPage: "inicio",
          gmishScrollY: window.scrollY,
          gmishSearch: "",
          gmishSubcategories: {
            hombre: "todos",
            mujer: "todos",
          },
        },
        "",
        window.location.href
      );
    }

    function revisarRuta(evento) {
      const ruta = window.location.pathname.replace(/\/+$/, "");
      const admin = ruta === "/admin";

      setEsAdmin(admin);

      if (admin) return;

      const estado = evento.state || window.history.state;

      const paginasValidas = [
        "inicio",
        "coleccion",
        "hombre",
        "mujer",
        "ofertas",
        "nuevos",
        "buscar",
        "visitanos",
        "contacto",
      ];

      if (paginasValidas.includes(estado?.gmishPage)) {
        setPagina(estado.gmishPage);
        setBusqueda(estado.gmishSearch || "");

        if (estado.gmishSubcategories) {
          setSubcategoriasSeleccionadas(
            estado.gmishSubcategories
          );
        }

        setPanelAbierto(null);
        setCategoriaMenuAbierta(null);

        const posicion = Math.max(
          0,
          Number(estado.gmishScrollY) || 0
        );

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: posicion,
              behavior: "instant",
            });
          });
        });
      }
    }

    window.addEventListener("popstate", revisarRuta);

    return () => {
      window.removeEventListener("popstate", revisarRuta);
    };
  }, []);

  
  // Cargar las portadas guardadas en Supabase.
  useEffect(() => {
    let cancelado = false;

    async function cargarPortadas() {
      const { data, error } = await supabase
        .from("store_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["inicio", "hombre", "mujer"]);

      if (cancelado) return;

      if (error) {
        console.error("Error al cargar portadas:", error);
        return;
      }

      const portadasGuardadas = {
        inicio: "",
        hombre: "",
        mujer: "",
      };

      (data || []).forEach((fila) => {
        if (fila.setting_key in portadasGuardadas) {
          portadasGuardadas[fila.setting_key] =
            fila.setting_value || "";
        }
      });

      setPortadas(portadasGuardadas);
    }

    if (!esAdmin) {
      cargarPortadas();
    }

    return () => {
      cancelado = true;
    };
  }, [esAdmin]);

  // Cargar productos activos desde Supabase.
  useEffect(() => {
    let cancelado = false;

    async function cargarProductos() {
      setCargando(true);
      setErrorProductos("");

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (
            id,
            size,
            color,
            color_hex,
            color_image_url,
            stock,
            product_variant_images (
              id,
              image_url,
              position
            )
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (cancelado) return;

      if (error) {
        console.error("Error al cargar productos:", error);

        setErrorProductos(
          "No pudimos cargar las prendas. Inténtalo de nuevo más tarde."
        );

        setProductos([]);
      } else {
        setProductos(data || []);
      }

      setCargando(false);
    }

    if (!esAdmin) {
      cargarProductos();
    }

    return () => {
      cancelado = true;
    };
  }, [esAdmin]);

  // Obtener las subcategorías existentes en los productos.
  function obtenerSubcategorias(categoria) {
    const subcategoriasUnicas = new Map();

    productos.forEach((producto) => {
      const categoriaProducto = String(
        producto.category || ""
      )
        .trim()
        .toLocaleLowerCase("es");

      if (categoriaProducto !== categoria) return;

      const nombre = String(producto.subcategory || "").trim();

      if (!nombre) return;

      const valor = nombre.toLocaleLowerCase("es");

      if (!subcategoriasUnicas.has(valor)) {
        subcategoriasUnicas.set(valor, nombre);
      }
    });

    return [...subcategoriasUnicas.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "es"))
      .map(([value, label]) => ({ value, label }));
  }

  // Navegar entre páginas y conservar el historial.
  function navegar(destino, siguientesSubcategorias) {
    const estadoActual = window.history.state;

    window.history.replaceState(
      {
        ...(estadoActual && typeof estadoActual === "object"
          ? estadoActual
          : {}),
        gmishPage: pagina,
        gmishScrollY: window.scrollY,
        gmishSearch: busqueda,
        gmishSubcategories: subcategoriasSeleccionadas,
        gmishProductModal: false,
      },
      "",
      window.location.href
    );

    window.history.pushState(
      {
        gmishPage: destino,
        gmishScrollY: 0,
        gmishSearch: busqueda,
        gmishSubcategories:
          siguientesSubcategorias || subcategoriasSeleccionadas,
        gmishProductModal: false,
      },
      "",
      window.location.href
    );

    setPagina(destino);
    setPanelAbierto(null);
    setCategoriaMenuAbierta(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function irA(destino) {
    navegar(destino, subcategoriasSeleccionadas);
  }

  // Elegir una subcategoría desde el menú.
  function irASubcategoria(categoria, subcategoria) {
    const nuevasSubcategorias = {
      ...subcategoriasSeleccionadas,
      [categoria]: subcategoria,
    };

    navegar(categoria, nuevasSubcategorias);
    setSubcategoriasSeleccionadas(nuevasSubcategorias);
  }

  // Abrir una subcategoría desde "Ver todos".
  // Guarda la vista general para que la flecha de regresar
  // vuelva a las filas de categorías de Hombre o Mujer.
  function seleccionarSubcategoria(categoria, subcategoria) {
    const nuevasSubcategorias = {
      ...subcategoriasSeleccionadas,
      [categoria]: subcategoria,
    };

    const estadoActual = window.history.state;

    // La entrada actual conserva la vista general de categorías.
    window.history.replaceState(
      {
        ...(estadoActual && typeof estadoActual === "object"
          ? estadoActual
          : {}),
        gmishPage: pagina,
        gmishScrollY: window.scrollY,
        gmishSearch: busqueda,
        gmishSubcategories: subcategoriasSeleccionadas,
        gmishProductModal: false,
      },
      "",
      window.location.href
    );

    // Se crea una entrada para mostrar únicamente la subcategoría.
    window.history.pushState(
      {
        gmishPage: pagina,
        gmishScrollY: 0,
        gmishSearch: busqueda,
        gmishSubcategories: nuevasSubcategorias,
        gmishProductModal: false,
      },
      "",
      window.location.href
    );

    setSubcategoriasSeleccionadas(nuevasSubcategorias);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function alternarPanel(nombre) {
    setPanelAbierto((actual) => {
      const siguiente = actual === nombre ? null : nombre;

      if (siguiente !== "menu") {
        setCategoriaMenuAbierta(null);
      }

      return siguiente;
    });
  }

  function buscar(evento) {
    evento.preventDefault();
    navegar("buscar", subcategoriasSeleccionadas);
  }

  function volverATienda() {
    const subcategoriasIniciales = {
      hombre: "todos",
      mujer: "todos",
    };

    window.history.replaceState(
      {
        gmishPage: "inicio",
        gmishScrollY: 0,
        gmishSearch: "",
        gmishSubcategories: subcategoriasIniciales,
        gmishProductModal: false,
      },
      "",
      "/"
    );

    setEsAdmin(false);
    setPagina("inicio");
    setBusqueda("");
    setSubcategoriasSeleccionadas(subcategoriasIniciales);
    setPanelAbierto(null);
    setCategoriaMenuAbierta(null);

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  if (esAdmin) {
    return (
      <div className="admin-page">
        <button
          type="button"
          className="boton-interior"
          onClick={volverATienda}
        >
          VOLVER A LA TIENDA
        </button>

        <Admin />
      </div>
    );
  }

  const subcategoriasHombre = obtenerSubcategorias("hombre");
  const subcategoriasMujer = obtenerSubcategorias("mujer");

  return (
    <div className="hero">
      <header className="nav-bar">
        <div className="nav-right">
          <button
            type="button"
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
            type="button"
            className="icon-link"
            aria-label={`Abrir carrito, ${cantidadCarrito} productos`}
            aria-expanded={cartOpen}
            onClick={() => {
              setPanelAbierto(null);
              setCategoriaMenuAbierta(null);
              openCart();
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.5L22 8H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>

            {cantidadCarrito > 0 && (
              <span className="contador-carrito">
                {cantidadCarrito}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          className="logo-boton"
          onClick={() => irA("inicio")}
          aria-label="Ir al inicio"
        >
          G’MISH
        </button>

        <button
          type="button"
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

      {/* MENÚ PRINCIPAL */}
      {panelAbierto === "menu" && (
        <nav className="menu-desplegable" aria-label="Menú principal">
          <button type="button" onClick={() => irA("inicio")}>
            Inicio
          </button>

          <hr className="menu-separador" />

          <button
            type="button"
            className="menu-boton-categoria"
            aria-expanded={categoriaMenuAbierta === "hombre"}
            onClick={() =>
              setCategoriaMenuAbierta((actual) =>
                actual === "hombre" ? null : "hombre"
              )
            }
          >
            <span>Hombre</span>
          </button>

          {categoriaMenuAbierta === "hombre" && (
            <div className="menu-subcategorias">
              <button
                type="button"
                className={
                  subcategoriasSeleccionadas.hombre === "todos"
                    ? "activo"
                    : ""
                }
                onClick={() => irASubcategoria("hombre", "todos")}
              >
                Todo
              </button>

              {subcategoriasHombre.map((subcategoria) => (
                <button
                  type="button"
                  key={subcategoria.value}
                  className={
                    subcategoriasSeleccionadas.hombre ===
                    subcategoria.value
                      ? "activo"
                      : ""
                  }
                  onClick={() =>
                    irASubcategoria("hombre", subcategoria.value)
                  }
                >
                  {subcategoria.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className="menu-boton-categoria"
            aria-expanded={categoriaMenuAbierta === "mujer"}
            onClick={() =>
              setCategoriaMenuAbierta((actual) =>
                actual === "mujer" ? null : "mujer"
              )
            }
          >
            <span>Mujer</span>
          </button>

          {categoriaMenuAbierta === "mujer" && (
            <div className="menu-subcategorias">
              <button
                type="button"
                className={
                  subcategoriasSeleccionadas.mujer === "todos"
                    ? "activo"
                    : ""
                }
                onClick={() => irASubcategoria("mujer", "todos")}
              >
                Todo
              </button>

              {subcategoriasMujer.map((subcategoria) => (
                <button
                  type="button"
                  key={subcategoria.value}
                  className={
                    subcategoriasSeleccionadas.mujer ===
                    subcategoria.value
                      ? "activo"
                      : ""
                  }
                  onClick={() =>
                    irASubcategoria("mujer", subcategoria.value)
                  }
                >
                  {subcategoria.label}
                </button>
              ))}
            </div>
          )}

          <hr className="menu-separador" />

          <button type="button" onClick={() => irA("ofertas")}>
            Ofertas
          </button>

          <button type="button" onClick={() => irA("nuevos")}>
            New In
          </button>

          <hr className="menu-separador" />

          <button type="button" onClick={() => irA("visitanos")}>
            Visítanos
          </button>

          <button type="button" onClick={() => irA("contacto")}>
            Contáctanos
          </button>
        </nav>
      )}

      {/* BUSCADOR */}
      {panelAbierto === "buscador" && (
        <form className="buscador-panel" onSubmit={buscar}>
          <input
            type="search"
            placeholder="¿Qué estás buscando?"
            aria-label="Buscar productos"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            autoFocus
          />

          <button type="submit">Buscar</button>
        </form>
      )}

      <main className="contenido-tienda">
        {pagina === "inicio" && (
          
          <section
            className="hero-content"
            style={{
              "--portada-inicio": portadas.inicio
                ? `url("${portadas.inicio}")`
                : "url('/gmish-bg.jpg')",
            }}
          >
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
                  
                  src={portadas.hombre || "/hombre.jpg"}
                  alt="Colección de hombre"
                  onError={(evento) => {
                    evento.currentTarget.style.display = "none";
                  }}
                />

                <span className="categoria-overlay" />

                <span className="categoria-contenido">
                  <span className="categoria-subtitulo">
                    DESCUBRE
                  </span>
                  <span className="categoria-nombre">Hombre</span>
                  <span className="categoria-enlace">
                    EXPLORAR ↗
                  </span>
                </span>
              </button>

              <button
                className="categoria-boton"
                onClick={() => irA("mujer")}
              >
                <img                  
                  src={portadas.mujer || "/mujer.jpg"}
                  alt="Colección de mujer"
                  onError={(evento) => {
                    evento.currentTarget.style.display = "none";
                  }}
                />

                <span className="categoria-overlay" />

                <span className="categoria-contenido">
                  <span className="categoria-subtitulo">
                    DESCUBRE
                  </span>
                  <span className="categoria-nombre">Mujer</span>
                  <span className="categoria-enlace">
                    EXPLORAR ↗
                  </span>
                </span>
              </button>
            </div>
          </section>
        )}

        {(pagina === "hombre" || pagina === "mujer") && (
          <section className="seccion-interior">
            <p className="seccion-etiqueta">G’MISH COLLECTION</p>

            <h1>
              {pagina === "hombre" ? "Hombre" : "Mujer"}
            </h1>

            <p className="intro-coleccion">
              Encuentra las prendas para tu estilo.
            </p>

            {cargando ? (
              <p>Cargando prendas...</p>
            ) : errorProductos ? (
              <p role="alert">{errorProductos}</p>
            ) : (
              <CategorySection
                category={pagina}
                products={productos}
                selectedSubcategory={
                  subcategoriasSeleccionadas[pagina]
                }
                onSelectSubcategory={(subcategoria) =>
                  seleccionarSubcategoria(pagina, subcategoria)
                }
              />
            )}
          </section>
        )}

        {pagina === "ofertas" && (
          <section className="seccion-interior">
            <p className="seccion-etiqueta">OPORTUNIDADES GMISH</p>
            <h1>Ofertas</h1>

            <p className="intro-coleccion">
              Tus prendas favoritas a precios especiales.
            </p>

            {cargando ? (
              <p>Cargando ofertas...</p>
            ) : errorProductos ? (
              <p role="alert">{errorProductos}</p>
            ) : (
              <FeaturedProducts
                category="ofertas"
                search=""
                newOnly={false}
                products={productos}
                showSort={true}
              />
            )}
          </section>
        )}

        {pagina === "nuevos" && (
          <section className="seccion-interior">
            <p className="seccion-etiqueta">LATEST ARRIVALS</p>
            <h1>New In</h1>

            <p className="intro-coleccion">
              Descubre las últimas prendas añadidas a GMISH.
            </p>

            {cargando ? (
              <p>Cargando novedades...</p>
            ) : errorProductos ? (
              <p role="alert">{errorProductos}</p>
            ) : (
              <FeaturedProducts
                category="todos"
                search=""
                newOnly={false}
                products={productos}
                showSort={true}
              />
            )}
          </section>
        )}

        {pagina === "buscar" && (
          <section className="seccion-interior">
            <p className="seccion-etiqueta">G’MISH COLLECTION</p>
            <h1>Resultados de búsqueda</h1>

            <p className="texto-busqueda">
              {busqueda.trim()
                ? `Buscaste: “${busqueda.trim()}”`
                : "Explora nuestra colección."}
            </p>

            {cargando ? (
              <p>Buscando prendas...</p>
            ) : errorProductos ? (
              <p role="alert">{errorProductos}</p>
            ) : (
              <FeaturedProducts
                category="todos"
                search={busqueda.trim()}
                newOnly={false}
                products={productos}
                showSort={true}
              />
            )}

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

            <p>
              Pronto añadiremos aquí nuestros datos de contacto.
            </p>

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
        <span>
          © 2026 G’MISH. Todos los derechos reservados.
        </span>
      </footer>

      <Cart />
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Tienda />
    </CartProvider>
  );
}

export default App;
