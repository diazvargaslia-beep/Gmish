
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

export default function Admin() {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [conectado, setConectado] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState("inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarSesion() {
      const { data, error: errorSesion } =
        await supabase.auth.getSession();

      if (!activo) return;

      if (errorSesion) {
        setError("No se pudo comprobar la sesión.");
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
    } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      if (!activo) return;

      setSesion(nuevaSesion);

      if (nuevaSesion) {
        comprobarConexion();
      } else {
        setConectado(false);
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function comprobarConexion() {
    const { error: errorConsulta } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    setConectado(!errorConsulta);
  }

  async function iniciarSesion(e) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const { error: errorLogin } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (errorLogin) {
      setError("No se pudo iniciar sesión. Revisa tus datos.");
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
    setSeccion("inicio");
  }

  function cambiarSeccion(id) {
    setSeccion(id);
    setMenuAbierto(false);
  }

  if (cargando && !sesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-2 border-[#383838] border-t-[#76509a]" />
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </main>
    );
  }

  if (!sesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-5 py-10 text-white">
        <form
          onSubmit={iniciarSesion}
          className="w-full max-w-md rounded-3xl border border-[#303030] bg-[#141414] p-7 sm:p-10"
        >
          <div className="mb-9 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#49345d] bg-[#261535] text-3xl font-bold text-white">
              G
            </div>

            <h1 className="text-2xl font-bold tracking-[0.2em]">
              GMISH
            </h1>

            <p className="mt-3 text-xs tracking-[0.18em] text-gray-400">
              COLLECTION · ADMINISTRACIÓN
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-3 block text-sm text-gray-300"
              >
                Correo electrónico
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={campo}
                placeholder="tu@correo.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-3 block text-sm text-gray-300"
              >
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={campo}
                placeholder="Tu contraseña"
                required
              />
            </div>
          </div>

          {error && (
            <p className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-7 w-full rounded-xl border border-[#654783] bg-[#261535] px-5 py-4 font-semibold text-white transition hover:bg-[#38204d] disabled:opacity-50"
          >
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="fixed inset-x-0 top-0 z-40 flex h-[76px] items-center justify-between border-b border-[#303030] bg-[#0b0b0b] px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#303030] bg-[#111111] text-2xl text-white transition hover:bg-[#222222]"
          >
            {menuAbierto ? "×" : "☰"}
          </button>

          <div>
            <h1 className="text-lg font-bold tracking-[0.12em]">
              GMISH
            </h1>
            <p className="mt-1 text-[10px] tracking-[0.18em] text-gray-500">
              ADMINISTRACIÓN
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={cerrarSesion}
          className="rounded-xl border border-[#303030] bg-[#151515] px-4 py-3 text-sm text-gray-300 transition hover:bg-[#292929] hover:text-white"
        >
          Cerrar sesión
        </button>
      </header>

      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-40 bg-black/70"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-[76px] z-50 w-[280px] max-w-[85vw] border-r border-[#49345d] bg-[#1b1026] transition-transform duration-300 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-[#49345d] px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Menú principal
          </p>
        </div>

        <nav className="space-y-3 p-4">
          {secciones.map((item) => {
            const activo = seccion === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => cambiarSeccion(item.id)}
                className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
                  activo
                    ? "border-[#654783] bg-[#38204d] text-white"
                    : "border-transparent text-gray-300 hover:bg-[#2b1b3b] hover:text-white"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/20 text-lg">
                  {item.icono}
                </span>

                <span className="text-sm font-medium">
                  {item.nombre}
                </span>

                {activo && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-[#a78bca]" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-h-screen px-5 pb-10 pt-[108px] sm:px-8 sm:pb-12 sm:pt-[116px] lg:px-12 xl:px-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                {secciones.find((item) => item.id === seccion)?.nombre}
              </h2>
              <div className="mt-4 h-1 w-12 rounded-full bg-[#76509a]" />
            </div>

            <div className="flex items-center gap-3 rounded-full border border-[#303030] bg-[#141414] px-4 py-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  conectado ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-gray-400">
                {conectado
                  ? "Base de datos conectada"
                  : "Base de datos desconectada"}
              </span>
            </div>
          </div>

          {seccion === "inicio" && (
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {secciones
                .filter((item) => item.id !== "inicio")
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => cambiarSeccion(item.id)}
                    className={`${tarjeta} group flex min-h-40 items-center gap-5 p-6 text-left transition hover:border-[#654783] hover:bg-[#19141e] sm:p-7`}
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#49345d] bg-[#261535] text-2xl text-white transition group-hover:bg-[#38204d]">
                      {item.icono}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">
                        {item.nombre}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Abrir sección
                      </p>
                    </div>

                    <span className="ml-auto text-xl text-gray-500">
                      ›
                    </span>
                  </button>
                ))}
            </section>
          )}

          {seccion === "productos" && (
            conectado ? (
              <div className="rounded-2xl">
                <ProductsAdmin />
              </div>
            ) : (
              <section className={`${tarjeta} p-6 sm:p-8`}>
                <h3 className="text-lg font-semibold">
                  No se pudo conectar
                </h3>
                <p className="mt-3 text-sm text-gray-400">
                  Comprueba la conexión con la base de datos.
                </p>
                <button
                  type="button"
                  onClick={comprobarConexion}
                  className={`${botonPrincipal} mt-6`}
                >
                  Reintentar conexión
                </button>
              </section>
            )
          )}

          {seccion === "portadas" && (
            <PortadasAdmin
              tarjeta={tarjeta}
              campo={campo}
              botonPrincipal={botonPrincipal}
            />
          )}

          {seccion === "pedidos" && (
            <section className={`${tarjeta} p-7 sm:p-9`}>
              <h3 className="text-lg font-semibold">
                Pedidos y ventas
              </h3>
              <p className="mt-3 text-sm text-gray-400">
                Esta sección todavía está pendiente de implementación.
              </p>
            </section>
          )}

          {seccion === "estadisticas" && (
            <section className={`${tarjeta} p-7 sm:p-9`}>
              <h3 className="text-lg font-semibold">
                Estadísticas
              </h3>
              <p className="mt-3 text-sm text-gray-400">
                Esta sección todavía está pendiente de implementación.
              </p>
            </section>
          )}

          {seccion === "configuracion" && (
            <section className={`${tarjeta} p-7 sm:p-9`}>
              <h3 className="text-lg font-semibold">
                Configuración
              </h3>
              <p className="mt-3 text-sm text-gray-400">
                Esta sección todavía está pendiente de implementación.
              </p>
            </section>
          )}

          <footer className="mt-14 border-t border-[#252525] pt-6 text-center text-xs text-gray-600">
            GMISH COLLECTION © {new Date().getFullYear()}
          </footer>
        </div>
      </main>
    </div>
  );
}

function PortadasAdmin({ tarjeta, campo, botonPrincipal }) {
  const [portadas, setPortadas] = useState({
    inicio: "",
    hombre: "",
    mujer: "",
  });

  const [archivos, setArchivos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const definiciones = [
    {
      id: "inicio",
      nombre: "Portada principal",
      descripcion: "Imagen principal de la tienda.",
    },
    {
      id: "hombre",
      nombre: "Portada de hombre",
      descripcion: "Imagen de la sección masculina.",
    },
    {
      id: "mujer",
      nombre: "Portada de mujer",
      descripcion: "Imagen de la sección femenina.",
    },
  ];

  useEffect(() => {
    let activo = true;

    async function cargarPortadas() {
      setCargando(true);

      const { data, error: errorConsulta } = await supabase
        .from("store_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["inicio", "hombre", "mujer"]);

      if (!activo) return;

      if (errorConsulta) {
        setError("No se pudieron cargar las portadas guardadas.");
      } else {
        const resultado = {
          inicio: "",
          hombre: "",
          mujer: "",
        };

        for (const fila of data ?? []) {
          resultado[fila.setting_key] = fila.setting_value ?? "";
        }

        setPortadas(resultado);
      }

      setCargando(false);
    }

    cargarPortadas();

    return () => {
      activo = false;
    };
  }, []);

  function seleccionarArchivo(id, archivo) {
    setMensaje("");
    setError("");

    if (!archivo) {
      setArchivos((anterior) => ({
        ...anterior,
        [id]: null,
      }));
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen válido.");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5 MB.");
      return;
    }

    setArchivos((anterior) => ({
      ...anterior,
      [id]: archivo,
    }));
  }

  async function guardarPortada(id) {
    const archivo = archivos[id];

    if (!archivo) {
      setError("Selecciona una imagen antes de guardar.");
      setMensaje("");
      return;
    }

    setGuardando(id);
    setMensaje("");
    setError("");

    try {
      const extension =
        archivo.name.split(".").pop()?.toLowerCase() || "jpg";

      const ruta = `portadas/${id}-${Date.now()}.${extension}`;

      const { error: errorSubida } = await supabase.storage
        .from("product-images")
        .upload(ruta, archivo, {
          cacheControl: "3600",
          upsert: false,
          contentType: archivo.type,
        });

      if (errorSubida) {
        throw errorSubida;
      }

      const { data: datosPublicos } = supabase.storage
        .from("product-images")
        .getPublicUrl(ruta);

      const url = datosPublicos?.publicUrl;

      if (!url) {
        throw new Error("No se pudo obtener la URL de la imagen.");
      }

      const { data: existente, error: errorBusqueda } = await supabase
        .from("store_settings")
        .select("id")
        .eq("setting_key", id)
        .maybeSingle();

      if (errorBusqueda) {
        throw errorBusqueda;
      }

      if (existente) {
        const { error: errorActualizacion } = await supabase
          .from("store_settings")
          .update({
            setting_value: url,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", id);

        if (errorActualizacion) {
          throw errorActualizacion;
        }
      } else {
        const { error: errorInsercion } = await supabase
          .from("store_settings")
          .insert({
            store_name: "GMISH",
            setting_key: id,
            setting_value: url,
            updated_at: new Date().toISOString(),
          });

        if (errorInsercion) {
          throw errorInsercion;
        }
      }

      setPortadas((anterior) => ({
        ...anterior,
        [id]: url,
      }));

      setArchivos((anterior) => ({
        ...anterior,
        [id]: null,
      }));

      setMensaje("Portada guardada correctamente.");
    } catch (e) {
      setError(
        e?.message ||
          "No se pudo guardar la portada. Inténtalo nuevamente."
      );
    } finally {
      setGuardando("");
    }
  }

  if (cargando) {
    return (
      <div className={`${tarjeta} p-8 text-center text-sm text-gray-400`}>
        Cargando portadas...
      </div>
    );
  }

  return (
    <section>
      <div className="mb-7">
        <h3 className="text-lg font-semibold">Imágenes de la tienda</h3>
        <p className="mt-3 text-sm text-gray-400">
          Administra las imágenes principales de GMISH.
        </p>
      </div>

      {mensaje && (
        <p className="mb-5 rounded-xl border border-green-900/60 bg-green-950/30 p-4 text-sm text-green-300">
          {mensaje}
        </p>
      )}

      {error && (
        <p className="mb-5 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-7">
        {definiciones.map((portada) => {
          const archivo = archivos[portada.id];
          const vistaPrevia = archivo
            ? URL.createObjectURL(archivo)
            : portadas[portada.id];

          return (
            <article
              key={portada.id}
              className={`${tarjeta} overflow-hidden`}
            >
              <div className="border-b border-[#303030] p-6 sm:p-7">
                <h4 className="font-semibold">{portada.nombre}</h4>
                <p className="mt-2 text-sm text-gray-500">
                  {portada.descripcion}
                </p>
              </div>

              <div className="space-y-5 p-6 sm:p-7">
                <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl border border-[#303030] bg-[#0b0b0b]">
                  {vistaPrevia ? (
                    <img
                      src={vistaPrevia}
                      alt={portada.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-600">
                      <span className="text-4xl">▧</span>
                      <p className="mt-3 text-sm">Sin imagen</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm text-gray-300">
                    Seleccionar imagen
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      seleccionarArchivo(
                        portada.id,
                        e.target.files?.[0] ?? null
                      )
                    }
                    className={`${campo} file:mr-3 file:rounded-lg file:border-0 file:bg-[#261535] file:px-3 file:py-2 file:text-sm file:text-white`}
                  />

                  <p className="mt-3 text-xs text-gray-500">
                    Formatos de imagen. Máximo 5 MB.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => guardarPortada(portada.id)}
                  disabled={!archivo || guardando === portada.id}
                  className={`${botonPrincipal} w-full`}
                >
                  {guardando === portada.id
                    ? "Guardando..."
                    : "Guardar portada"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
