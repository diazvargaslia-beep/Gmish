import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductsAdmin from "./ProductsAdmin";

const secciones = [
  { id: "inicio", nombre: "Inicio", icono: "⌂" },
  { id: "productos", nombre: "Productos", icono: "▦" },
  { id: "pedidos", nombre: "Pedidos y ventas", icono: "▤" },
  { id: "portadas", nombre: "Portadas", icono: "▧" },
  { id: "estadisticas", nombre: "Estadísticas", icono: "↗" },
  { id: "configuracion", nombre: "Configuración", icono: "⚙" },
];

const tarjeta =
  "rounded-2xl border border-[#303030] bg-[#141414]";

const botonPrincipal =
  "rounded-xl border border-[#454545] bg-[#222222] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-40";

const campo =
  "w-full rounded-xl border border-[#383838] bg-[#0d0d0d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#777777] focus:border-[#76509a] focus:ring-1 focus:ring-[#76509a]/30";

function obtenerSeccionDesdeUrl() {
  const hash = window.location.hash.replace("#", "").trim();

  const existe = secciones.some(
    (item) => item.id === hash
  );

  return existe ? hash : "inicio";
}

export default function Admin() {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [conectado, setConectado] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [seccion, setSeccion] = useState(() =>
    obtenerSeccionDesdeUrl()
  );

  const [menuAbierto, setMenuAbierto] = useState(false);

  /*
   * =====================================================
   * HISTORIAL DEL PANEL
   * =====================================================
   *
   * Cada sección utiliza un hash:
   *
   * /admin#inicio
   * /admin#productos
   * /admin#pedidos
   * /admin#portadas
   *
   * El navegador guarda cada cambio en su historial.
   *
   * Por eso:
   *
   * Inicio
   * → Productos
   * → Pedidos
   * → Portadas
   *
   * Atrás:
   *
   * Portadas
   * → Pedidos
   * → Productos
   * → Inicio
   */

  useEffect(() => {
    /*
     * Si entramos simplemente a /admin,
     * establecemos Inicio como la primera entrada
     * del panel.
     */
    if (!window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#inicio`
      );

      setSeccion("inicio");
    }

    function manejarCambioDeHistorial() {
      const nuevaSeccion =
        obtenerSeccionDesdeUrl();

      setSeccion(nuevaSeccion);
      setMenuAbierto(false);
    }

    window.addEventListener(
      "hashchange",
      manejarCambioDeHistorial
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        manejarCambioDeHistorial
      );
    };
  }, []);

  /*
   * =====================================================
   * SESIÓN
   * =====================================================
   */

  useEffect(() => {
    let activo = true;

    async function cargarSesion() {
      const {
        data,
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (!activo) return;

      if (errorSesion) {
        setError(
          "No se pudo comprobar la sesión."
        );
      }

      setSesion(data?.session ?? null);
      setCargando(false);

      if (data?.session) {
        comprobarConexion();
      }
    }

    cargarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_evento, nuevaSesion) => {
        if (!activo) return;

        setSesion(nuevaSesion);

        if (nuevaSesion) {
          comprobarConexion();
        } else {
          setConectado(false);
        }
      }
    );

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function comprobarConexion() {
    const {
      error: errorConsulta,
    } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    setConectado(!errorConsulta);
  }

  async function iniciarSesion(e) {
    e.preventDefault();

    setError("");
    setCargando(true);

    const {
      error: errorLogin,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (errorLogin) {
      setError(
        "No se pudo iniciar sesión. Revisa tus datos."
      );

      setCargando(false);
      return;
    }

    setCargando(false);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();

    setSesion(null);
    setConectado(false);
    setMenuAbierto(false);

    /*
     * Al cerrar sesión eliminamos el hash
     * para dejar /admin limpio.
     */
    window.history.replaceState(
      null,
      "",
      "/admin"
    );

    setSeccion("inicio");
  }

  /*
   * =====================================================
   * CAMBIAR SECCIÓN
   * =====================================================
   */

  function cambiarSeccion(id) {
    /*
     * Si ya estamos en esa sección,
     * no creamos otra entrada innecesaria.
     */
    if (id === seccion) {
      setMenuAbierto(false);
      return;
    }

    /*
     * Cambiar el hash crea una nueva entrada
     * en el historial del navegador.
     */
    window.location.hash = id;

    setSeccion(id);
    setMenuAbierto(false);
  }

  function volverATienda() {
    window.location.href = "/";
  }

  /*
   * =====================================================
   * CARGANDO
   * =====================================================
   */

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-3xl font-black tracking-[0.25em] text-[#a879d1]">
            GMISH
          </div>

          <p className="text-sm text-[#888888]">
            Cargando panel...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * LOGIN
   * =====================================================
   */

  if (!sesion) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] px-5 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-[#303030] bg-[#141414] p-7 shadow-2xl">

            <div className="mb-8 text-center">
              <div className="mb-2 text-3xl font-black tracking-[0.3em] text-[#a879d1]">
                GMISH
              </div>

              <h1 className="text-xl font-bold">
                Panel administrativo
              </h1>

              <p className="mt-2 text-sm text-[#858585]">
                Inicia sesión para administrar
                la tienda.
              </p>
            </div>

            <form
              onSubmit={iniciarSesion}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                  Correo
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="tu@email.com"
                  className={campo}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                  Contraseña
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className={campo}
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-xl bg-[#76509a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#8660aa]"
              >
                {cargando
                  ? "Ingresando..."
                  : "Iniciar sesión"}
              </button>
            </form>

            <button
              type="button"
              onClick={volverATienda}
              className="mt-5 w-full text-sm text-[#999999] transition hover:text-white"
            >
              ← Volver a la tienda
            </button>

          </div>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * PANEL ADMINISTRATIVO
   * =====================================================
   */

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#292929] bg-[#101010]/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-3">

            {/* BOTÓN DE 3 RAYITAS */}

            <button
              type="button"
              onClick={() =>
                setMenuAbierto(!menuAbierto)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#303030] bg-[#171717] text-xl transition hover:bg-[#222222]"
              aria-label="Abrir menú"
            >
              ☰
            </button>

            {/* LOGO */}

            <button
              type="button"
              onClick={() =>
                cambiarSeccion("inicio")
              }
              className="font-black tracking-[0.25em] text-[#a879d1]"
            >
              GMISH
            </button>

          </div>

          <div className="flex items-center gap-3">

            {/* ESTADO DE CONEXIÓN */}

            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex ${
                conectado
                  ? "border-green-900/60 bg-green-950/30 text-green-300"
                  : "border-red-900/60 bg-red-950/30 text-red-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  conectado
                    ? "bg-green-400"
                    : "bg-red-400"
                }`}
              />

              {conectado
                ? "Base de datos conectada"
                : "Sin conexión"}
            </div>

            {/* CERRAR SESIÓN */}

            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-xl border border-[#383838] bg-[#171717] px-3 py-2 text-xs font-semibold text-[#cccccc] transition hover:bg-[#222222] hover:text-white"
            >
              Cerrar sesión
            </button>

          </div>
        </div>
      </header>

      {/* MENÚ LATERAL */}

      {menuAbierto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() =>
              setMenuAbierto(false)
            }
          />

          <aside className="fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-[280px] border-r border-[#303030] bg-[#111111] p-4 shadow-2xl">

            <div className="mb-4 px-2 text-xs font-bold uppercase tracking-[0.2em] text-[#666666]">
              Administración
            </div>

            <nav className="space-y-2">

              {secciones.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    cambiarSeccion(item.id)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    seccion === item.id
                      ? "bg-[#76509a] text-white"
                      : "text-[#b5b5b5] hover:bg-[#1d1d1d] hover:text-white"
                  }`}
                >
                  <span className="flex w-6 justify-center text-lg">
                    {item.icono}
                  </span>

                  <span>
                    {item.nombre}
                  </span>
                </button>
              ))}

            </nav>

            <div className="mt-8 border-t border-[#292929] pt-5">

              <button
                type="button"
                onClick={volverATienda}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#999999] transition hover:bg-[#1d1d1d] hover:text-white"
              >
                <span className="text-lg">
                  ↗
                </span>

                <span>
                  Ver tienda
                </span>
              </button>

            </div>

          </aside>
        </>
      )}

      {/* CONTENIDO PRINCIPAL */}

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">

        {/* INICIO */}

        {seccion === "inicio" && (
          <div>

            <div className="mb-8">

              <p className="mb-2 text-sm font-medium text-[#8d6ba8]">
                Panel administrativo
              </p>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Bienvenida a GMISH
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#858585]">
                Administra tus productos,
                pedidos, portadas, estadísticas
                y configuración desde aquí.
              </p>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {secciones
                .filter(
                  (item) =>
                    item.id !== "inicio"
                )
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      cambiarSeccion(item.id)
                    }
                    className={`${tarjeta} group p-5 text-left transition hover:-translate-y-0.5 hover:border-[#76509a]`}
                  >

                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#21182a] text-2xl text-[#b98bdd]">
                      {item.icono}
                    </div>

                    <h2 className="text-lg font-bold">
                      {item.nombre}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#777777]">

                      {item.id === "productos" &&
                        "Administra prendas, precios, tallas, colores y stock."}

                      {item.id === "pedidos" &&
                        "Revisa los pedidos y las ventas de la tienda."}

                      {item.id === "portadas" &&
                        "Cambia la portada y la información visual de la tienda."}

                      {item.id === "estadisticas" &&
                        "Consulta el rendimiento y las ventas de GMISH."}

                      {item.id === "configuracion" &&
                        "Configura la información general y redes sociales."}

                    </p>

                    <div className="mt-5 text-sm font-semibold text-[#a879d1] transition group-hover:text-[#c69ce2]">
                      Abrir sección →
                    </div>

                  </button>
                ))}

            </div>
          </div>
        )}

        {/* PRODUCTOS */}

        {seccion === "productos" && (
          <ProductsAdmin />
        )}

        {/* PEDIDOS */}

        {seccion === "pedidos" && (
          <section>

            <div className="mb-8">

              <p className="mb-2 text-sm font-medium text-[#8d6ba8]">
                Administración
              </p>

              <h1 className="text-3xl font-black">
                Pedidos y ventas
              </h1>

              <p className="mt-2 text-sm text-[#777777]">
                Aquí podrás revisar y gestionar
                los pedidos de tus clientes.
              </p>

            </div>

            <div className={`${tarjeta} p-8 text-center`}>

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#21182a] text-3xl text-[#b98bdd]">
                ▤
              </div>

              <h2 className="text-xl font-bold">
                Pedidos y ventas
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777777]">
                Esta sección está preparada
                para mostrar y gestionar los
                pedidos realizados en GMISH.
              </p>

            </div>

          </section>
        )}

        {/* PORTADAS */}

        {seccion === "portadas" && (
          <PortadasAdmin />
        )}

        {/* ESTADÍSTICAS */}

        {seccion === "estadisticas" && (
          <section>

            <div className="mb-8">

              <p className="mb-2 text-sm font-medium text-[#8d6ba8]">
                Administración
              </p>

              <h1 className="text-3xl font-black">
                Estadísticas
              </h1>

              <p className="mt-2 text-sm text-[#777777]">
                Aquí podrás revisar el rendimiento
                de GMISH.
              </p>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <div className={`${tarjeta} p-6`}>
                <p className="text-sm text-[#777777]">
                  Ventas
                </p>

                <p className="mt-2 text-3xl font-black">
                  S/ 0.00
                </p>
              </div>

              <div className={`${tarjeta} p-6`}>
                <p className="text-sm text-[#777777]">
                  Pedidos
                </p>

                <p className="mt-2 text-3xl font-black">
                  0
                </p>
              </div>

              <div className={`${tarjeta} p-6`}>
                <p className="text-sm text-[#777777]">
                  Productos vendidos
                </p>

                <p className="mt-2 text-3xl font-black">
                  0
                </p>
              </div>

            </div>

          </section>
        )}

        {/* CONFIGURACIÓN */}

        {seccion === "configuracion" && (
          <section>

            <div className="mb-8">

              <p className="mb-2 text-sm font-medium text-[#8d6ba8]">
                Administración
              </p>

              <h1 className="text-3xl font-black">
                Configuración
              </h1>

              <p className="mt-2 text-sm text-[#777777]">
                Configuración general de la tienda.
              </p>

            </div>

            <div className={`${tarjeta} p-8`}>

              <h2 className="text-xl font-bold">
                Configuración de GMISH
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#777777]">
                Aquí podrás administrar la
                información general, contacto
                y redes sociales de la tienda.
              </p>

            </div>

          </section>
        )}

      </main>

      {/* FOOTER */}

      <footer className="border-t border-[#242424] px-4 py-7 text-center text-xs text-[#666666]">
        © 2026 GMISH. Panel administrativo.
      </footer>

    </div>
  );
}

/*
 * =========================================================
 * PORTADAS
 * =========================================================
 */

function PortadasAdmin() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [formulario, setFormulario] =
    useState({
      store_name: "",
      whatsapp: "",
      address: "",
      maps_url: "",
      instagram_url: "",
      tiktok_url: "",
      facebook_url: "",
    });

  const [imagenActual, setImagenActual] =
    useState("");

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setCargando(true);
    setError("");

    const {
      data,
      error: errorConsulta,
    } = await supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (errorConsulta) {
      setError(
        "No se pudo cargar la configuración de la tienda."
      );

      setCargando(false);
      return;
    }

    if (data) {
      setFormulario({
        store_name:
          data.store_name ?? "",

        whatsapp:
          data.whatsapp ?? "",

        address:
          data.address ?? "",

        maps_url:
          data.maps_url ?? "",

        instagram_url:
          data.instagram_url ?? "",

        tiktok_url:
          data.tiktok_url ?? "",

        facebook_url:
          data.facebook_url ?? "",
      });

      /*
       * Si anteriormente guardamos una URL
       * como setting_value, la mostramos.
       */
      if (data.setting_value) {
        setImagenActual(
          data.setting_value
        );
      }
    }

    setCargando(false);
  }

  function cambiarCampo(
    campo,
    valor
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarConfiguracion() {
    setGuardando(true);
    setMensaje("");
    setError("");

    const {
      data: existente,
      error: errorConsulta,
    } = await supabase
      .from("store_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (errorConsulta) {
      setError(
        "No se pudo comprobar la configuración actual."
      );

      setGuardando(false);
      return;
    }

    let errorGuardar = null;

    if (existente?.id) {
      const { error } =
        await supabase
          .from("store_settings")
          .update({
            ...formulario,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", existente.id);

      errorGuardar = error;
    } else {
      const { error } =
        await supabase
          .from("store_settings")
          .insert({
            ...formulario,
            updated_at:
              new Date().toISOString(),
          });

      errorGuardar = error;
    }

    if (errorGuardar) {
      setError(
        "No se pudo guardar la configuración."
      );

      setGuardando(false);
      return;
    }

    setMensaje(
      "Configuración guardada correctamente."
    );

    setGuardando(false);
  }

  async function cambiarPortada(e) {
    const archivo =
      e.target.files?.[0];

    if (!archivo) return;

    setSubiendo(true);
    setMensaje("");
    setError("");

    const extension =
      archivo.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const nombreArchivo =
      `portada-${Date.now()}.${extension}`;

    const {
      error: errorSubida,
    } = await supabase.storage
      .from("product-images")
      .upload(
        `portadas/${nombreArchivo}`,
        archivo,
        {
          upsert: false,
          contentType: archivo.type,
        }
      );

    if (errorSubida) {
      setError(
        "No se pudo subir la nueva portada."
      );

      setSubiendo(false);
      return;
    }

    const {
      data: urlData,
    } = supabase.storage
      .from("product-images")
      .getPublicUrl(
        `portadas/${nombreArchivo}`
      );

    const nuevaUrl =
      urlData?.publicUrl;

    if (!nuevaUrl) {
      setError(
        "La imagen se subió, pero no se pudo obtener su URL."
      );

      setSubiendo(false);
      return;
    }

    const {
      data: existente,
      error: errorConsulta,
    } = await supabase
      .from("store_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (errorConsulta) {
      setError(
        "La imagen se subió, pero no se pudo actualizar la configuración."
      );

      setSubiendo(false);
      return;
    }

    let errorGuardar = null;

    if (existente?.id) {
      const { error } =
        await supabase
          .from("store_settings")
          .update({
            setting_value: nuevaUrl,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            existente.id
          );

      errorGuardar = error;
    }

    if (errorGuardar) {
      setError(
        "La imagen se subió, pero no se pudo guardar como portada."
      );

      setSubiendo(false);
      return;
    }

    setImagenActual(nuevaUrl);

    setMensaje(
      "Portada actualizada correctamente."
    );

    setSubiendo(false);
  }

  if (cargando) {
    return (
      <section>

        <div className="mb-8">

          <p className="mb-2 text-sm font-medium text-[#8d6ba8]">
            Administración
          </p>

          <h1 className="text-3xl font-black">
            Portadas
          </h1>

        </div>

        <div
          className={`${tarjeta} p-8 text-center text-sm text-[#777777]`}
        >
          Cargando configuración...
        </div>

      </section>
    );
  }

  return (
    <section>

      <div className="mb-8">

        <p className="mb-2 text-sm font-medium text-[#8d6ba8]">
          Administración
        </p>

        <h1 className="text-3xl font-black">
          Portadas
        </h1>

        <p className="mt-2 text-sm text-[#777777]">
          Administra la portada y la información
          principal que aparece en tu tienda.
        </p>

      </div>

      {mensaje && (
        <div className="mb-5 rounded-xl border border-green-900/60 bg-green-950/30 px-4 py-3 text-sm text-green-300">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">

        {/* PORTADA */}

        <div className={`${tarjeta} p-6`}>

          <div className="mb-5">

            <h2 className="text-lg font-bold">
              Imagen de portada
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              Cambia la imagen principal
              de la tienda.
            </p>

          </div>

          {imagenActual ? (
            <div className="mb-5 overflow-hidden rounded-2xl border border-[#303030]">

              <img
                src={imagenActual}
                alt="Portada actual"
                className="h-64 w-full object-cover"
              />

            </div>
          ) : (
            <div className="mb-5 flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#383838] bg-[#0d0d0d] text-sm text-[#666666]">
              No hay una portada seleccionada.
            </div>
          )}

          <label
            className={`${botonPrincipal} inline-flex cursor-pointer`}
          >
            {subiendo
              ? "Subiendo..."
              : "Cambiar portada"}

            <input
              type="file"
              accept="image/*"
              onChange={cambiarPortada}
              disabled={subiendo}
              className="hidden"
            />
          </label>

        </div>

        {/* INFORMACIÓN */}

        <div className={`${tarjeta} p-6`}>

          <div className="mb-5">

            <h2 className="text-lg font-bold">
              Información de la tienda
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              Esta información puede
              mostrarse en la tienda.
            </p>

          </div>

          <div className="space-y-4">

            <div>
              <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                Nombre de la tienda
              </label>

              <input
                value={formulario.store_name}
                onChange={(e) =>
                  cambiarCampo(
                    "store_name",
                    e.target.value
                  )
                }
                className={campo}
                placeholder="GMISH"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                WhatsApp
              </label>

              <input
                value={formulario.whatsapp}
                onChange={(e) =>
                  cambiarCampo(
                    "whatsapp",
                    e.target.value
                  )
                }
                className={campo}
                placeholder="51999999999"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                Dirección
              </label>

              <input
                value={formulario.address}
                onChange={(e) =>
                  cambiarCampo(
                    "address",
                    e.target.value
                  )
                }
                className={campo}
                placeholder="Dirección de la tienda"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                Google Maps
              </label>

              <input
                value={formulario.maps_url}
                onChange={(e) =>
                  cambiarCampo(
                    "maps_url",
                    e.target.value
                  )
                }
                className={campo}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                Instagram
              </label>

              <input
                value={formulario.instagram_url}
                onChange={(e) =>
                  cambiarCampo(
                    "instagram_url",
                    e.target.value
                  )
                }
                className={campo}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                TikTok
              </label>

              <input
                value={formulario.tiktok_url}
                onChange={(e) =>
                  cambiarCampo(
                    "tiktok_url",
                    e.target.value
                  )
                }
                className={campo}
                placeholder="https://tiktok.com/@..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                Facebook
              </label>

              <input
                value={formulario.facebook_url}
                onChange={(e) =>
                  cambiarCampo(
                    "facebook_url",
                    e.target.value
                  )
                }
                className={campo}
                placeholder="https://facebook.com/..."
              />
            </div>

            <button
              type="button"
              onClick={guardarConfiguracion}
              disabled={guardando}
              className="w-full rounded-xl bg-[#76509a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#8660aa]"
            >
              {guardando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>

          </div>
        </div>

      </div>

    </section>
  );
}