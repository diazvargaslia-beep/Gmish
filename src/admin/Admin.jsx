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

    async function iniciar() {
      const { data } = await supabase.auth.getSession();

      if (!activo) return;

      setSesion(data.session);

      if (data.session) {
        const { error: errorConsulta } = await supabase
          .from("products")
          .select("id")
          .limit(1);

        if (activo) setConectado(!errorConsulta);
      }

      if (activo) setCargando(false);
    }

    iniciar();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, nuevaSesion) => {
        setSesion(nuevaSesion);
        if (!nuevaSesion) setConectado(false);
      }
    );

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function comprobarConexion() {
    const { error: errorConsulta } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    setConectado(!errorConsulta);
  }

  async function iniciarSesion(evento) {
    evento.preventDefault();
    setError("");

    const { data, error: errorLogin } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (errorLogin) {
      setError("No se pudo iniciar sesión. Revisa tus datos.");
      return;
    }

    setSesion(data.session);
    await comprobarConexion();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setSesion(null);
    setConectado(false);
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-neutral-500">
        Cargando GMISH...
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <form
          onSubmit={iniciarSesion}
          className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
        >
          <p className="mb-2 text-xs tracking-[0.3em] text-neutral-500">
            GMISH COLLECTION
          </p>

          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-neutral-900">
            Administración
          </h1>

          <p className="mb-7 text-sm text-neutral-500">
            Inicia sesión para administrar tu tienda.
          </p>

          <label className="mb-2 block text-sm text-neutral-700">
            Correo electrónico
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="mb-4 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
            placeholder="Tu correo"
          />

          <label className="mb-2 block text-sm text-neutral-700">
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mb-4 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
            placeholder="Tu contraseña"
          />

          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-7">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-xl hover:bg-neutral-100"
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <span className="text-lg font-semibold tracking-[0.15em]">
            GMISH
          </span>

          <span className="hidden text-sm text-neutral-400 sm:inline">
            / Administración
          </span>
        </div>

        <button
          type="button"
          onClick={cerrarSesion}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-100"
        >
          Cerrar sesión
        </button>
      </header>

      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-20 bg-black/20"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-30 w-72 border-r border-neutral-200 bg-white p-4 transition-transform duration-200 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <p className="mb-4 px-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
          Menú principal
        </p>

        <nav className="space-y-1">
          {secciones.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSeccion(item.id);
                setMenuAbierto(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                seccion === item.id
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="w-6 text-center text-lg">
                {item.icono}
              </span>
              {item.nombre}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-xl bg-neutral-50 p-4">
          <p className="text-sm font-medium">GMISH Collection</p>
          <p className="mt-1 text-xs text-neutral-500">
            Panel de administración
          </p>
        </div>
      </aside>

      <main className="mx-auto max-w-7xl p-4 sm:p-7">
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            GMISH / Panel
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {secciones.find((item) => item.id === seccion)?.nombre}
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Administra tu tienda desde un solo lugar.
          </p>
        </div>

        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            conectado
              ? "border-neutral-200 bg-white text-neutral-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current" />

          {conectado
            ? "Conexión con la base de datos activa"
            : "No se pudo comprobar la conexión con la base de datos"}
        </div>

        {seccion === "inicio" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Productos", "Administra prendas, tallas y stock.", "productos"],
              ["Pedidos y ventas", "Organiza los pedidos de tus clientes.", "pedidos"],
              ["Portadas", "Cambia las imágenes principales de la tienda.", "portadas"],
              ["Estadísticas", "Consulta el rendimiento de tu negocio.", "estadisticas"],
              ["Configuración", "Ajustes generales de la tienda.", "configuracion"],
            ].map(([titulo, descripcion, destino]) => (
              <button
                key={destino}
                type="button"
                onClick={() => setSeccion(destino)}
                className="rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-400"
              >
                <h2 className="font-medium">{titulo}</h2>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {descripcion}
                </p>

                <span className="mt-4 inline-block text-sm text-neutral-700">
                  Abrir sección →
                </span>
              </button>
            ))}
          </div>
        )}

        {seccion === "productos" && (
          conectado ? (
            <ProductsAdmin />
          ) : (
            <p className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
              Revisa la conexión con Supabase antes de administrar productos.
            </p>
          )
        )}

        {seccion === "portadas" && <PortadasAdmin />}

        {["pedidos", "estadisticas", "configuracion"].includes(seccion) && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium">
              {secciones.find((item) => item.id === seccion)?.nombre}
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Esta sección todavía está pendiente. Primero configuraremos
              las portadas y después conectaremos las demás funciones.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function PortadasAdmin() {
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
      titulo: "Portada principal",
      descripcion: "Imagen grande de la página de inicio.",
    },
    {
      id: "hombre",
      titulo: "Portada de Hombre",
      descripcion: "Imagen de la sección de prendas para hombre.",
    },
    {
      id: "mujer",
      titulo: "Portada de Mujer",
      descripcion: "Imagen de la sección de prendas para mujer.",
    },
  ];

  useEffect(() => {
    async function cargarPortadas() {
      const { data, error: errorConsulta } = await supabase
        .from("store_settings")
        .select("setting_key, setting_value");

      if (errorConsulta) {
        console.error("Error al cargar portadas:", errorConsulta);

        setError(
          `Error de Supabase: ${errorConsulta.message} (código: ${
            errorConsulta.code || "desconocido"
          })`
        );

        setCargando(false);
        return;
      }

      const nuevas = {
        inicio: "",
        hombre: "",
        mujer: "",
      };

      for (const fila of data || []) {
        if (
          Object.prototype.hasOwnProperty.call(
            nuevas,
            fila.setting_key
          )
        ) {
          nuevas[fila.setting_key] = fila.setting_value || "";
        }
      }

      setPortadas(nuevas);
      setCargando(false);
    }

    cargarPortadas();
  }, []);

  async function guardarPortada(id) {
    const archivo = archivos[id];

    if (!archivo) {
      setError("Primero selecciona una imagen.");
      return;
    }

    setGuardando(id);
    setMensaje("");
    setError("");

    try {
      const extension =
        archivo.name.split(".").pop()?.toLowerCase() || "jpg";

      const nombreArchivo = `${id}-${Date.now()}.${extension}`;
      const ruta = `portadas/${nombreArchivo}`;

      const { error: errorSubida } = await supabase.storage
        .from("product-images")
        .upload(ruta, archivo, {
          cacheControl: "3600",
          upsert: false,
          contentType: archivo.type || "image/jpeg",
        });

      if (errorSubida) {
        throw errorSubida;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(ruta);

      const url = urlData.publicUrl;

      const { error: errorGuardado } = await supabase
        .from("store_settings")
        .upsert(
          {
            setting_key: id,
            setting_value: url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" }
        );

      if (errorGuardado) {
        throw errorGuardado;
      }

      setPortadas((anterior) => ({
        ...anterior,
        [id]: url,
      }));

      setArchivos((anterior) => ({
        ...anterior,
        [id]: null,
      }));

      setMensaje("La imagen se guardó correctamente.");
    } catch (errorGuardar) {
      console.error("Error al guardar portada:", errorGuardar);

      setError(
        `Error al guardar: ${errorGuardar.message || "Error desconocido"} (código: ${
          errorGuardar.code || "desconocido"
        })`
      );
    } finally {
      setGuardando("");
    }
  }

  if (cargando) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        Cargando portadas...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-medium">Imágenes de la tienda</h2>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Selecciona una imagen, revisa la vista previa y guárdala.
          Las imágenes se subirán a Supabase Storage.
        </p>
      </div>

      {mensaje && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {definiciones.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
          >
            <div className="border-b border-neutral-100 p-5">
              <h3 className="font-medium">{item.titulo}</h3>

              <p className="mt-1 text-sm text-neutral-500">
                {item.descripcion}
              </p>
            </div>

            <div className="p-5">
              <div className="mb-4 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
                {archivos[item.id] ? (
                  <img
                    src={URL.createObjectURL(archivos[item.id])}
                    alt={`Vista previa de ${item.titulo}`}
                    className="h-full w-full object-cover"
                  />
                ) : portadas[item.id] ? (
                  <img
                    src={portadas[item.id]}
                    alt={item.titulo}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="px-4 text-center text-sm text-neutral-400">
                    Todavía no hay una imagen configurada
                  </div>
                )}
              </div>

              <label className="mb-3 block text-sm font-medium text-neutral-700">
                Elegir imagen
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(evento) => {
                  const archivo = evento.target.files?.[0];

                  if (!archivo) return;

                  if (archivo.size > 5 * 1024 * 1024) {
                    setError("La imagen debe pesar menos de 5 MB.");
                    evento.target.value = "";
                    return;
                  }

                  setError("");
                  setMensaje("");

                  setArchivos((anterior) => ({
                    ...anterior,
                    [item.id]: archivo,
                  }));
                }}
                className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:font-medium hover:file:bg-neutral-200"
              />

              <button
                type="button"
                onClick={() => guardarPortada(item.id)}
                disabled={!archivos[item.id] || guardando === item.id}
                className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guardando === item.id
                  ? "Guardando imagen..."
                  : "Guardar portada"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}