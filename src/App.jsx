import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";
import { getProducts } from "./services/products";
import { CartProvider, useCart } from "./CartContext";
import FeaturedProducts from "./components/FeaturedProducts";
import CategorySection from "./components/CategorySection";
import StoreInfo from "./components/StoreInfo";
import Contactanos from "./components/Contactanos";
import Cart from "./components/Cart";
import Admin from "./admin/Admin";

function Tienda() {
  const [pagina, setPagina] = useState("inicio");
  const [panelAbierto, setPanelAbierto] = useState(null);
  const [categoriaMenuAbierta, setCategoriaMenuAbierta] =
    useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorProductos, setErrorProductos] = useState("");

  const [portadas, setPortadas] = useState({
    inicio: null,
    hombre: null,
    mujer: null,
  });

  const [sitioListo, setSitioListo] = useState(false);

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

  /* =========================================
     HISTORIAL Y NAVEGACIÓN
     ========================================= */

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

  /* =========================================
     PORTADAS
     ========================================= */

  useEffect(() => {
    let cancelado = false;

    function precargarImagen(url) {
      if (!url) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const imagen = new Image();

        imagen.onload = () => {
          resolve();
        };

        imagen.onerror = () => {
          console.warn(
            "No se pudo precargar la imagen de portada:",
            url
          );

          resolve();
        };

        imagen.src = url;

        if (imagen.complete) {
          resolve();
        }
      });
    }

    async function cargarPortadas() {
      const { data, error } = await supabase
        .from("store_covers")
        .select(`
          tipo,
          imagen_url,
          titulo,
          descripcion,
          texto_boton,
          destino_boton,
          activo
        `)
        .in("tipo", ["inicio", "hombre", "mujer"]);

      if (cancelado) return;

      if (error) {
        console.error(
          "Error al cargar las portadas:",
          error
        );

        setSitioListo(true);
        return;
      }

      const portadasGuardadas = {
        inicio: null,
        hombre: null,
        mujer: null,
      };

      (data || []).forEach((portada) => {
        if (
          portada.tipo === "inicio" ||
          portada.tipo === "hombre" ||
          portada.tipo === "mujer"
        ) {
          portadasGuardadas[portada.tipo] = portada;
        }
      });

      setPortadas(portadasGuardadas);

      await precargarImagen(
        portadasGuardadas.inicio?.imagen_url
      );

      if (cancelado) return;

      setSitioListo(true);

      precargarImagen(
        portadasGuardadas.hombre?.imagen_url
      );

      precargarImagen(
        portadasGuardadas.mujer?.imagen_url
      );
    }

    if (!esAdmin) {
      cargarPortadas();
    } else {
      setSitioListo(true);
    }

    return () => {
      cancelado = true;
    };
  }, [esAdmin]);

  /* =========================================
     PRODUCTOS
     ========================================= */

  useEffect(() => {
    let cancelado = false;

    async function cargarProductos() {
      setCargando(true);
      setErrorProductos("");

      try {
        const data = await getProducts();

        if (cancelado) return;

        setProductos(data || []);

        console.log(
          "PRODUCTOS CARGADOS EN APP:",
          data || []
        );
      } catch (error) {
        if (cancelado) return;

        console.error(
          "Error al cargar productos:",
          error
        );

        setErrorProductos(
          "No pudimos cargar las prendas. Inténtalo de nuevo más tarde."
        );

        setProductos([]);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    if (!esAdmin) {
      cargarProductos();
    }

    return () => {
      cancelado = true;
    };
  }, [esAdmin]);

  /* =========================================
     NORMALIZAR TEXTO PARA BÚSQUEDA
     ========================================= */

  function normalizarTexto(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .trim();
  }

  /* =========================================
     FILTRAR PRODUCTOS POR BÚSQUEDA
     ========================================= */

  function filtrarProductosPorBusqueda(listaProductos) {
    const termino = normalizarTexto(busqueda);

    if (!termino) {
      return listaProductos;
    }

    return listaProductos.filter((producto) => {
      const textoProducto = [
        producto.name,
        producto.category,
        producto.subcategory,
        producto.description,
      ]
        .filter(Boolean)
        .map(normalizarTexto)
        .join(" ");

      return textoProducto.includes(termino);
    });
  }

  /* =========================================
     PRODUCTOS EN OFERTA
     ========================================= */

  function productoEstaEnOferta(producto) {
    const precio = Number(producto?.price);
    const precioAnterior = Number(producto?.old_price);

    return (
      Number.isFinite(precio) &&
      Number.isFinite(precioAnterior) &&
      precioAnterior > precio
    );
  }

  /* =========================================
     PRODUCTOS NUEVOS
     ========================================= */

  function productoEsNuevo(producto) {
    return (
      producto?.is_new === true ||
      producto?.is_new === 1 ||
      producto?.is_new === "1"
    );
  }

  /* =========================================
     SUBCATEGORÍAS
     ========================================= */

  function obtenerSubcategorias(categoria) {
    const subcategoriasUnicas = new Map();

    productos.forEach((producto) => {
      const categoriaProducto = String(
        producto.category || ""
      )
        .trim()
        .toLocaleLowerCase("es");

      if (categoriaProducto !== categoria) return;

      const nombre = String(
        producto.subcategory || ""
      ).trim();

      if (!nombre) return;

      const valor = nombre.toLocaleLowerCase("es");

      if (!subcategoriasUnicas.has(valor)) {
        subcategoriasUnicas.set(valor, nombre);
      }
    });

    return [...subcategoriasUnicas.entries()]
      .sort((a, b) =>
        a[1].localeCompare(b[1], "es")
      )
      .map(([value, label]) => ({
        value,
        label,
      }));
  }

  /* =========================================
     NAVEGACIÓN
     ========================================= */

  function navegar(
    destino,
    siguientesSubcategorias
  ) {
    const estadoActual = window.history.state;

    window.history.replaceState(
      {
        ...(estadoActual &&
        typeof estadoActual === "object"
          ? estadoActual
          : {}),
        gmishPage: pagina,
        gmishScrollY: window.scrollY,
        gmishSearch: busqueda,
        gmishSubcategories:
          subcategoriasSeleccionadas,
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
          siguientesSubcategorias ||
          subcategoriasSeleccionadas,
        gmishProductModal: false,
      },
      "",
      window.location.href
    );

    setPagina(destino);
    setPanelAbierto(null);
    setCategoriaMenuAbierta(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function irA(destino) {
    navegar(
      destino,
      subcategoriasSeleccionadas
    );
  }

  function irASubcategoria(
    categoria,
    subcategoria
  ) {
    const nuevasSubcategorias = {
      ...subcategoriasSeleccionadas,
      [categoria]: subcategoria,
    };

    navegar(
      categoria,
      nuevasSubcategorias
    );

    setSubcategoriasSeleccionadas(
      nuevasSubcategorias
    );
  }

  function seleccionarSubcategoria(
    categoria,
    subcategoria
  ) {
    const nuevasSubcategorias = {
      ...subcategoriasSeleccionadas,
      [categoria]: subcategoria,
    };

    const estadoActual = window.history.state;

    window.history.replaceState(
      {
        ...(estadoActual &&
        typeof estadoActual === "object"
          ? estadoActual
          : {}),
        gmishPage: pagina,
        gmishScrollY: window.scrollY,
        gmishSearch: busqueda,
        gmishSubcategories:
          subcategoriasSeleccionadas,
        gmishProductModal: false,
      },
      "",
      window.location.href
    );

    window.history.pushState(
      {
        gmishPage: pagina,
        gmishScrollY: 0,
        gmishSearch: busqueda,
        gmishSubcategories:
          nuevasSubcategorias,
        gmishProductModal: false,
      },
      "",
      window.location.href
    );

    setSubcategoriasSeleccionadas(
      nuevasSubcategorias
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function alternarPanel(nombre) {
    setPanelAbierto((actual) => {
      const siguiente =
        actual === nombre ? null : nombre;

      if (siguiente !== "menu") {
        setCategoriaMenuAbierta(null);
      }

      return siguiente;
    });
  }

  /* =========================================
     BÚSQUEDA
     ========================================= */

  function buscar(evento) {
    evento.preventDefault();

    const termino = busqueda.trim();

    setBusqueda(termino);

    navegar(
      "buscar",
      subcategoriasSeleccionadas
    );
  }

  /* =========================================
     DESTINO DE PORTADA
     ========================================= */

  function ejecutarDestinoPortada(destino) {
    const valor = String(
      destino || ""
    ).trim();

    if (!valor) return;

    const destinoNormalizado = valor
      .toLowerCase()
      .replace(/\/+$/, "");

    if (
      destinoNormalizado === "inicio" ||
      destinoNormalizado === "/"
    ) {
      irA("inicio");
      return;
    }

    if (
      destinoNormalizado === "coleccion" ||
      destinoNormalizado === "/coleccion"
    ) {
      irA("coleccion");
      return;
    }

    if (
      destinoNormalizado === "hombre" ||
      destinoNormalizado === "/hombre"
    ) {
      irA("hombre");
      return;
    }

    if (
      destinoNormalizado === "mujer" ||
      destinoNormalizado === "/mujer"
    ) {
      irA("mujer");
      return;
    }

    if (
      destinoNormalizado === "ofertas" ||
      destinoNormalizado === "/ofertas"
    ) {
      irA("ofertas");
      return;
    }

    if (
      destinoNormalizado === "nuevos" ||
      destinoNormalizado === "/nuevos"
    ) {
      irA("nuevos");
      return;
    }

    if (
      destinoNormalizado === "visitanos" ||
      destinoNormalizado === "/visitanos"
    ) {
      irA("visitanos");
      return;
    }

    if (
      destinoNormalizado === "contacto" ||
      destinoNormalizado === "/contacto"
    ) {
      irA("contacto");
      return;
    }

    if (/^https?:\/\//i.test(valor)) {
      window.location.href = valor;
    }
  }

  /* =========================================
     PORTADA ACTUAL
     ========================================= */

  function obtenerPortadaActual() {
    if (pagina === "inicio") {
      return portadas.inicio;
    }

    if (pagina === "hombre") {
      return portadas.hombre;
    }

    if (pagina === "mujer") {
      return portadas.mujer;
    }

    return null;
  }

  /* =========================================
     ADMIN
     ========================================= */

  if (esAdmin) {
    return <Admin />;
  }

  /* =========================================
     PANTALLA DE CARGA INICIAL
     ========================================= */

  if (!sitioListo) {
    return (
      <div className="pantalla-carga-inicial" />
    );
  }

  const subcategoriasHombre =
    obtenerSubcategorias("hombre");

  const subcategoriasMujer =
    obtenerSubcategorias("mujer");

  const portadaActual =
    obtenerPortadaActual();

  const portadaTieneImagen =
    Boolean(portadaActual?.imagen_url);

  const productosBuscados =
    filtrarProductosPorBusqueda(productos);

  const productosEnOferta =
    productos.filter(productoEstaEnOferta);

  const productosNuevos =
    productos.filter(productoEsNuevo);

  /* =========================================
     TIENDA
     ========================================= */

  return (
    <div className="hero">
      <header className="nav-bar">
        <div className="nav-right">
          <button
            className="icon-link"
            type="button"
            aria-label="Buscar"
            onClick={() =>
              alternarPanel("buscador")
            }
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="6.5"
              />
              <path d="m16 16 5 5" />
            </svg>
          </button>

          <button
            className="icon-link"
            type="button"
            aria-label="Carrito"
            onClick={openCart}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 5h2l1.5 10h10L20 8H7" />
              <circle
                cx="9"
                cy="19"
                r="1.2"
              />
              <circle
                cx="17"
                cy="19"
                r="1.2"
              />
            </svg>

            {cantidadCarrito > 0 && (
              <span className="contador-carrito">
                {cantidadCarrito}
              </span>
            )}
          </button>
        </div>

        <button
          className="logo-boton"
          type="button"
          onClick={() => irA("inicio")}
          aria-label="Ir al inicio"
        >
          G’MISH
        </button>

        <button
          className="menu-icon"
          type="button"
          aria-label="Abrir menú"
          onClick={() =>
            alternarPanel("menu")
          }
        >
          <span />
          <span />
        </button>
      </header>

      {panelAbierto === "menu" && (
        <div className="menu-desplegable">
          <button
            type="button"
            onClick={() => irA("inicio")}
          >
            Inicio
          </button>

          <div
            className="menu-separador"
            aria-hidden="true"
          />

          <button
            type="button"
            className="menu-boton-categoria"
            onClick={() =>
              setCategoriaMenuAbierta(
                (actual) =>
                  actual === "hombre"
                    ? null
                    : "hombre"
              )
            }
          >
            Hombre
          </button>

          {categoriaMenuAbierta === "hombre" && (
            <div className="menu-subcategorias">
              <button
                type="button"
                className={
                  subcategoriasSeleccionadas.hombre ===
                  "todos"
                    ? "activo"
                    : ""
                }
                onClick={() =>
                  irASubcategoria(
                    "hombre",
                    "todos"
                  )
                }
              >
                Todos
              </button>

              {subcategoriasHombre.map(
                (subcategoria) => (
                  <button
                    key={subcategoria.value}
                    type="button"
                    className={
                      subcategoriasSeleccionadas.hombre ===
                      subcategoria.value
                        ? "activo"
                        : ""
                    }
                    onClick={() =>
                      irASubcategoria(
                        "hombre",
                        subcategoria.value
                      )
                    }
                  >
                    {subcategoria.label}
                  </button>
                )
              )}
            </div>
          )}

          <button
            type="button"
            className="menu-boton-categoria"
            onClick={() =>
              setCategoriaMenuAbierta(
                (actual) =>
                  actual === "mujer"
                    ? null
                    : "mujer"
              )
            }
          >
            Mujer
          </button>

          {categoriaMenuAbierta === "mujer" && (
            <div className="menu-subcategorias">
              <button
                type="button"
                className={
                  subcategoriasSeleccionadas.mujer ===
                  "todos"
                    ? "activo"
                    : ""
                }
                onClick={() =>
                  irASubcategoria(
                    "mujer",
                    "todos"
                  )
                }
              >
                Todos
              </button>

              {subcategoriasMujer.map(
                (subcategoria) => (
                  <button
                    key={subcategoria.value}
                    type="button"
                    className={
                      subcategoriasSeleccionadas.mujer ===
                      subcategoria.value
                        ? "activo"
                        : ""
                    }
                    onClick={() =>
                      irASubcategoria(
                        "mujer",
                        subcategoria.value
                      )
                    }
                  >
                    {subcategoria.label}
                  </button>
                )
              )}
            </div>
          )}

          <div
            className="menu-separador"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={() => irA("ofertas")}
          >
            Ofertas
          </button>

          <button
            type="button"
            onClick={() => irA("nuevos")}
          >
            Nuevos
          </button>

          <div
            className="menu-separador"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={() => irA("visitanos")}
          >
            Visítanos
          </button>

          <button
            type="button"
            onClick={() => irA("contacto")}
          >
            Contáctanos
          </button>
        </div>
      )}

      {panelAbierto === "buscador" && (
        <form
          className="buscador-panel"
          onSubmit={buscar}
        >
          <input
            type="search"
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(evento.target.value)
            }
            placeholder="Buscar prendas..."
            autoFocus
          />

          <button type="submit">
            Buscar
          </button>
        </form>
      )}

      <main className="contenido-tienda">
        {/* =====================================
            INICIO
            ===================================== */}

        {pagina === "inicio" && (
          <section
            className="hero-content portada-lista"
            style={{
              backgroundImage:
                portadaTieneImagen
                  ? `linear-gradient(
                      rgba(18, 17, 15, 0.25),
                      rgba(18, 17, 15, 0.48)
                    ),
                    url("${portadaActual.imagen_url}")`
                  : undefined,
            }}
          >
            <div className="portada-texto">
              <p className="portada-etiqueta">
                G’MISH COLLECTION
              </p>

              <h1 className="brand-name">
                G’MISH
              </h1>

              <h2 className="main-heading">
                {portadaActual?.titulo ||
                  "ESTILO QUE NOS UNE"}
              </h2>

              <p className="sub-heading">
                {portadaActual?.descripcion ||
                  "OUTFITS QUE SE ADAPTAN A TU ESTILO"}
              </p>

              <div className="buttons-wrapper">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    if (
                      portadaActual?.destino_boton
                    ) {
                      ejecutarDestinoPortada(
                        portadaActual.destino_boton
                      );
                    } else {
                      irA("coleccion");
                    }
                  }}
                >
                  {portadaActual?.texto_boton ||
                    "VER COLECCIÓN"}
                </button>

                <button
                  className="btn"
                  type="button"
                  onClick={() =>
                    irA("visitanos")
                  }
                >
                  VISÍTANOS
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =====================================
            COLECCIÓN
            ===================================== */}

        {pagina === "coleccion" && (
          <section className="pagina-coleccion">
            <h1>COLECCIÓN</h1>

            <p className="intro-coleccion">
              Explora nuestras categorías y
              encuentra tu estilo.
            </p>

            <div className="coleccion-categorias">
              <button
                className="categoria-boton"
                type="button"
                onClick={() => irA("hombre")}
              >
                {portadas.hombre?.imagen_url && (
                  <img
                    src={portadas.hombre.imagen_url}
                    alt="Colección Hombre"
                  />
                )}

                <div className="categoria-overlay" />

                <div className="categoria-contenido">
                  <span className="categoria-subtitulo">
                    COLECCIÓN
                  </span>

                  <span className="categoria-nombre">
                    HOMBRE
                  </span>

                  <span className="categoria-enlace">
                    VER COLECCIÓN
                  </span>
                </div>
              </button>

              <button
                className="categoria-boton"
                type="button"
                onClick={() => irA("mujer")}
              >
                {portadas.mujer?.imagen_url && (
                  <img
                    src={portadas.mujer.imagen_url}
                    alt="Colección Mujer"
                  />
                )}

                <div className="categoria-overlay" />

                <div className="categoria-contenido">
                  <span className="categoria-subtitulo">
                    COLECCIÓN
                  </span>

                  <span className="categoria-nombre">
                    MUJER
                  </span>

                  <span className="categoria-enlace">
                    VER COLECCIÓN
                  </span>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* =====================================
            HOMBRE / MUJER
            ===================================== */}

        {(pagina === "hombre" ||
          pagina === "mujer") && (
          <section className="seccion-interior">
            <h1>
              {pagina === "hombre"
                ? "HOMBRE"
                : "MUJER"}
            </h1>

            <p>
              Explora nuestra selección.
            </p>

            <CategorySection
              category={pagina}
              products={productos}
              selectedSubcategory={
                subcategoriasSeleccionadas[pagina]
              }
              onSelectSubcategory={(subcategoria) =>
                seleccionarSubcategoria(
                  pagina,
                  subcategoria
                )
              }
            />
          </section>
        )}

        {/* =====================================
            OFERTAS
            ===================================== */}

        {pagina === "ofertas" && (
          <section className="seccion-interior">
            <h1>OFERTAS</h1>

            <p>
              Descubre nuestras prendas en oferta.
            </p>

            <FeaturedProducts
              products={productosEnOferta}
              cargando={cargando}
              error={errorProductos}
            />
          </section>
        )}

        {/* =====================================
            NUEVOS
            ===================================== */}

        {pagina === "nuevos" && (
          <section className="seccion-interior">
            <h1>NUEVOS</h1>

            <p>
              Conoce las novedades de G’MISH.
            </p>

            <FeaturedProducts
              products={productosNuevos}
              cargando={cargando}
              error={errorProductos}
            />
          </section>
        )}

        {/* =====================================
            BUSCAR
            ===================================== */}

        {pagina === "buscar" && (
          <section className="seccion-interior">
            <h1>BUSCAR</h1>

            <p className="texto-busqueda">
              Resultados para:{" "}
              <strong>
                {busqueda || "todos los productos"}
              </strong>
            </p>

            <FeaturedProducts
              products={productosBuscados}
              cargando={cargando}
              error={errorProductos}
            />
          </section>
        )}

        {/* =====================================
            VISÍTANOS
            ===================================== */}

        {pagina === "visitanos" && (
          <StoreInfo
            onSelectCategory={irA}
          />
        )}

        {/* =====================================
            CONTACTO
            ===================================== */}

        {pagina === "contacto" && (
          <Contactanos
            onSelectCategory={irA}
          />
        )}
      </main>

      <footer className="footer">
        <div className="footer-logo">
          G’MISH
        </div>

        <p>
          SOMOS TU TIENDA PREFERIDA · OUTFITS QUE SE
          ADAPTAN A TU ESTILO
        </p>

        <p>
          © {new Date().getFullYear()} G’MISH.
          Todos los derechos reservados.
        </p>
      </footer>

      {cartOpen && <Cart />}
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