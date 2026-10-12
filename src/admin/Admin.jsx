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

const botonMorado =
  "w-full rounded-xl bg-[#76509a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#8660aa] disabled:cursor-not-allowed disabled:opacity-40";

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

  useEffect(() => {
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

    window.history.replaceState(
      null,
      "",
      "/admin"
    );

    setSeccion("inicio");
  }

  function cambiarSeccion(id) {
    if (id === seccion) {
      setMenuAbierto(false);
      return;
    }

    window.location.hash = id;

    setSeccion(id);
    setMenuAbierto(false);
  }

  function volverATienda() {
    window.location.href = "/";
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
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
                className={botonMorado}
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

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="sticky top-0 z-50 border-b border-[#292929] bg-[#101010]/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
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

                  <span>{item.nombre}</span>
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

                <span>Ver tienda</span>
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {seccion === "inicio" && (
          <InicioAdmin
            cambiarSeccion={cambiarSeccion}
          />
        )}

        {seccion === "productos" && (
          <ProductsAdmin />
        )}

        {seccion === "pedidos" && (
          <PedidosAdmin />
        )}

        {seccion === "portadas" && (
          <PortadasAdmin />
        )}

        {seccion === "estadisticas" && (
          <EstadisticasAdmin />
        )}

        {seccion === "configuracion" && (
          <ConfiguracionAdmin />
        )}
      </main>

      <footer className="border-t border-[#242424] px-4 py-7 text-center text-xs text-[#666666]">
        © 2026 GMISH. Panel administrativo.
      </footer>
    </div>
  );
}

/* =========================================================
   INICIO
   ========================================================= */

function InicioAdmin({ cambiarSeccion }) {
  return (
    <section>
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-[#8d6ba8]">
          Panel administrativo
        </p>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Bienvenida a GMISH
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#858585]">
          Administra tus productos, pedidos,
          portadas, estadísticas y contenido
          de la tienda desde aquí.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {secciones
          .filter(
            (item) => item.id !== "inicio"
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
                  "Revisa y gestiona los pedidos y ventas de GMISH."}

                {item.id === "portadas" &&
                  "Administra las portadas principal, Hombre y Mujer."}

                {item.id === "estadisticas" &&
                  "Consulta el rendimiento y las ventas de GMISH."}

                {item.id === "configuracion" &&
                  "Administra datos, contenido, redes, contacto y campañas."}
              </p>

              <div className="mt-5 text-sm font-semibold text-[#a879d1] transition group-hover:text-[#c69ce2]">
                Abrir sección →
              </div>
            </button>
          ))}
      </div>
    </section>
  );
}

/* =========================================================
   PEDIDOS
   ========================================================= */

function PedidosAdmin() {
  return (
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
          Esta sección está preparada para
          mostrar y gestionar los pedidos
          realizados en GMISH.
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function EstadisticasAdmin() {
  return (
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
  );
}

/* =========================================================
   PORTADAS
   ========================================================= */

function PortadasAdmin() {
  const tipos = [
    {
      id: "portada_principal",
      nombre: "Portada principal",
      descripcion:
        "La imagen principal que aparece en Inicio.",
    },
    {
      id: "portada_hombre",
      nombre: "Portada Hombre",
      descripcion:
        "Imagen utilizada en la sección Hombre.",
    },
    {
      id: "portada_mujer",
      nombre: "Portada Mujer",
      descripcion:
        "Imagen utilizada en la sección Mujer.",
    },
  ];

  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState("");
  const [imagenes, setImagenes] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPortadas();
  }, []);

  async function cargarPortadas() {
    setCargando(true);
    setError("");

    const { data, error: errorConsulta } =
      await supabase
        .from("store_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "portada_principal",
          "portada_hombre",
          "portada_mujer",
        ]);

    if (errorConsulta) {
      setError(
        "No se pudieron cargar las portadas."
      );
      setCargando(false);
      return;
    }

    const nuevasImagenes = {};

    data?.forEach((item) => {
      if (item.setting_key) {
        nuevasImagenes[item.setting_key] =
          item.setting_value || "";
      }
    });

    setImagenes(nuevasImagenes);
    setCargando(false);
  }

  async function cambiarPortada(
    tipo,
    archivo
  ) {
    if (!archivo) return;

    setSubiendo(tipo);
    setMensaje("");
    setError("");

    const extension =
      archivo.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const nombreArchivo =
      `${tipo}-${Date.now()}.${extension}`;

    const ruta =
      `portadas/${nombreArchivo}`;

    const { error: errorSubida } =
      await supabase.storage
        .from("product-images")
        .upload(
          ruta,
          archivo,
          {
            upsert: false,
            contentType:
              archivo.type,
          }
        );

    if (errorSubida) {
      setError(
        "No se pudo subir la nueva portada."
      );
      setSubiendo("");
      return;
    }

    const { data: urlData } =
      supabase.storage
        .from("product-images")
        .getPublicUrl(ruta);

    const nuevaUrl =
      urlData?.publicUrl;

    if (!nuevaUrl) {
      setError(
        "La imagen se subió, pero no se pudo obtener su URL."
      );
      setSubiendo("");
      return;
    }

    const { error: errorGuardar } =
      await supabase
        .from("store_settings")
        .upsert(
          {
            setting_key: tipo,
            setting_value: nuevaUrl,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "setting_key",
          }
        );

    if (errorGuardar) {
      setError(
        "La imagen se subió, pero no se pudo guardar."
      );
      setSubiendo("");
      return;
    }

    setImagenes((actual) => ({
      ...actual,
      [tipo]: nuevaUrl,
    }));

    setMensaje(
      "Portada actualizada correctamente."
    );

    setSubiendo("");
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
          Cargando portadas...
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
          Administra por separado las imágenes
          principales de GMISH.
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

      <div className="grid gap-5 lg:grid-cols-3">
        {tipos.map((tipo) => {
          const imagen =
            imagenes[tipo.id];

          return (
            <div
              key={tipo.id}
              className={`${tarjeta} overflow-hidden`}
            >
              <div className="p-6">
                <h2 className="text-lg font-bold">
                  {tipo.nombre}
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#777777]">
                  {tipo.descripcion}
                </p>
              </div>

              {imagen ? (
                <div className="px-6">
                  <div className="overflow-hidden rounded-2xl border border-[#303030]">
                    <img
                      src={imagen}
                      alt={tipo.nombre}
                      className="h-52 w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="mx-6 flex h-52 items-center justify-center rounded-2xl border border-dashed border-[#383838] bg-[#0d0d0d] text-center text-sm text-[#666666]">
                  No hay imagen
                  seleccionada.
                </div>
              )}

              <div className="p-6">
                <label
                  className={`${botonPrincipal} inline-flex w-full cursor-pointer items-center justify-center`}
                >
                  {subiendo === tipo.id
                    ? "Subiendo..."
                    : imagen
                      ? "Cambiar imagen"
                      : "Subir imagen"}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={
                      subiendo === tipo.id
                    }
                    onChange={(e) => {
                      cambiarPortada(
                        tipo.id,
                        e.target.files?.[0]
                      );

                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function ConfiguracionAdmin() {
  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const [formulario, setFormulario] =
    useState({
      store_name: "",
      whatsapp: "",
      address: "",
      maps_url: "",
      instagram_url: "",
      tiktok_url: "",
      facebook_url: "",

      home_title:
        "Nueva colección GMISH",

      home_text:
        "Descubre nuestras últimas prendas y novedades.",

      home_button:
        "Ver novedades",

      home_featured:
        "",

      hombre_text:
        "Descubre nuestra colección para hombre.",

      mujer_text:
        "Descubre nuestra colección para mujer.",

      ofertas_text:
        "Encuentra nuestras mejores ofertas.",

      promo_title:
        "Promociones GMISH",

      campaign_name:
        "",

      campaign_active:
        false,

      campaign_start:
        "",

      campaign_end:
        "",

      campaign_message:
        "",
    });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setCargando(true);
    setError("");

    const {
      data: generales,
      error: errorGeneral,
    } = await supabase
      .from("store_settings")
      .select("*")
      .is("setting_key", null)
      .limit(1)
      .maybeSingle();

    if (errorGeneral) {
      setError(
        "No se pudieron cargar los datos de la tienda."
      );
      setCargando(false);
      return;
    }

    const {
      data: contenidos,
      error: errorContenido,
    } = await supabase
      .from("store_settings")
      .select(
        "setting_key, setting_value"
      )
      .not("setting_key", "is", null);

    if (errorContenido) {
      setError(
        "No se pudo cargar el contenido de la tienda."
      );
      setCargando(false);
      return;
    }

    const valores = {};

    contenidos?.forEach((item) => {
      if (item.setting_key) {
        valores[item.setting_key] =
          item.setting_value ?? "";
      }
    });

    setFormulario({
      store_name:
        generales?.store_name ?? "",

      whatsapp:
        generales?.whatsapp ?? "",

      address:
        generales?.address ?? "",

      maps_url:
        generales?.maps_url ?? "",

      instagram_url:
        generales?.instagram_url ?? "",

      tiktok_url:
        generales?.tiktok_url ?? "",

      facebook_url:
        generales?.facebook_url ?? "",

      home_title:
        valores.home_title ??
        "Nueva colección GMISH",

      home_text:
        valores.home_text ??
        "Descubre nuestras últimas prendas y novedades.",

      home_button:
        valores.home_button ??
        "Ver novedades",

      home_featured:
        valores.home_featured ?? "",

      hombre_text:
        valores.hombre_text ??
        "Descubre nuestra colección para hombre.",

      mujer_text:
        valores.mujer_text ??
        "Descubre nuestra colección para mujer.",

      ofertas_text:
        valores.ofertas_text ??
        "Encuentra nuestras mejores ofertas.",

      promo_title:
        valores.promo_title ??
        "Promociones GMISH",

      campaign_name:
        valores.campaign_name ?? "",

      campaign_active:
        valores.campaign_active ===
        "true",

      campaign_start:
        valores.campaign_start ?? "",

      campaign_end:
        valores.campaign_end ?? "",

      campaign_message:
        valores.campaign_message ?? "",
    });

    setCargando(false);
  }

  function cambiarCampo(
    campoNombre,
    valor
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campoNombre]: valor,
    }));
  }

  async function guardarConfiguracion() {
    setGuardando(true);
    setMensaje("");
    setError("");

    const ahora =
      new Date().toISOString();

    const datosGenerales = {
      store_name:
        formulario.store_name,
      whatsapp:
        formulario.whatsapp,
      address:
        formulario.address,
      maps_url:
        formulario.maps_url,
      instagram_url:
        formulario.instagram_url,
      tiktok_url:
        formulario.tiktok_url,
      facebook_url:
        formulario.facebook_url,
      updated_at: ahora,
    };

    const {
      data: existente,
      error: errorConsulta,
    } = await supabase
      .from("store_settings")
      .select("id")
      .is("setting_key", null)
      .limit(1)
      .maybeSingle();

    if (errorConsulta) {
      setError(
        "No se pudo comprobar la configuración actual."
      );
      setGuardando(false);
      return;
    }

    let errorGeneral = null;

    if (existente?.id) {
      const { error } =
        await supabase
          .from("store_settings")
          .update(datosGenerales)
          .eq("id", existente.id);

      errorGeneral = error;
    } else {
      const { error } =
        await supabase
          .from("store_settings")
          .insert(datosGenerales);

      errorGeneral = error;
    }

    if (errorGeneral) {
      setError(
        "No se pudieron guardar los datos generales."
      );
      setGuardando(false);
      return;
    }

    const contenidos = [
      {
        setting_key: "home_title",
        setting_value:
          formulario.home_title,
      },
      {
        setting_key: "home_text",
        setting_value:
          formulario.home_text,
      },
      {
        setting_key: "home_button",
        setting_value:
          formulario.home_button,
      },
      {
        setting_key: "home_featured",
        setting_value:
          formulario.home_featured,
      },
      {
        setting_key: "hombre_text",
        setting_value:
          formulario.hombre_text,
      },
      {
        setting_key: "mujer_text",
        setting_value:
          formulario.mujer_text,
      },
      {
        setting_key: "ofertas_text",
        setting_value:
          formulario.ofertas_text,
      },
      {
        setting_key: "promo_title",
        setting_value:
          formulario.promo_title,
      },
      {
        setting_key: "campaign_name",
        setting_value:
          formulario.campaign_name,
      },
      {
        setting_key: "campaign_active",
        setting_value:
          String(
            formulario.campaign_active
          ),
      },
      {
        setting_key: "campaign_start",
        setting_value:
          formulario.campaign_start,
      },
      {
        setting_key: "campaign_end",
        setting_value:
          formulario.campaign_end,
      },
      {
        setting_key: "campaign_message",
        setting_value:
          formulario.campaign_message,
      },
    ].map((item) => ({
      ...item,
      updated_at: ahora,
    }));

    const {
      error: errorContenido,
    } = await supabase
      .from("store_settings")
      .upsert(contenidos, {
        onConflict:
          "setting_key",
      });

    if (errorContenido) {
      setError(
        "Los datos generales se guardaron, pero no se pudo guardar todo el contenido."
      );
      setGuardando(false);
      return;
    }

    setMensaje(
      "Configuración guardada correctamente."
    );

    setGuardando(false);
  }

  if (cargando) {
    return (
      <section>
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-[#8d6ba8]">
            Administración
          </p>

          <h1 className="text-3xl font-black">
            Configuración
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
          Configuración
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777777]">
          Administra desde aquí la información,
          contenido, redes sociales y campañas
          de GMISH.
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

      <div className="space-y-5">
        {/* DATOS DE LA TIENDA */}

        <div className={`${tarjeta} p-6`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              🏪 Datos de la tienda
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              Información general de GMISH.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CampoConfiguracion
              label="Nombre de la tienda"
              value={
                formulario.store_name
              }
              onChange={(valor) =>
                cambiarCampo(
                  "store_name",
                  valor
                )
              }
              placeholder="GMISH"
            />

            <CampoConfiguracion
              label="WhatsApp"
              value={
                formulario.whatsapp
              }
              onChange={(valor) =>
                cambiarCampo(
                  "whatsapp",
                  valor
                )
              }
              placeholder="51999999999"
            />

            <CampoConfiguracion
              label="Dirección"
              value={
                formulario.address
              }
              onChange={(valor) =>
                cambiarCampo(
                  "address",
                  valor
                )
              }
              placeholder="Dirección de la tienda"
            />

            <CampoConfiguracion
              label="Google Maps"
              value={
                formulario.maps_url
              }
              onChange={(valor) =>
                cambiarCampo(
                  "maps_url",
                  valor
                )
              }
              placeholder="https://maps.google.com/..."
            />
          </div>
        </div>

        {/* CONTENIDO DEL INICIO */}

        <div className={`${tarjeta} p-6`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              🎨 Contenido del inicio
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              Cambia los textos que aparecen
              en la página principal sin tocar
              el código.
            </p>
          </div>

          <div className="space-y-4">
            <CampoConfiguracion
              label="Título principal"
              value={
                formulario.home_title
              }
              onChange={(valor) =>
                cambiarCampo(
                  "home_title",
                  valor
                )
              }
              placeholder="Nueva colección GMISH"
            />

            <CampoGrande
              label="Texto principal"
              value={
                formulario.home_text
              }
              onChange={(valor) =>
                cambiarCampo(
                  "home_text",
                  valor
                )
              }
              placeholder="Descubre nuestras últimas prendas..."
            />

            <CampoConfiguracion
              label="Texto del botón"
              value={
                formulario.home_button
              }
              onChange={(valor) =>
                cambiarCampo(
                  "home_button",
                  valor
                )
              }
              placeholder="Ver novedades"
            />

            <CampoGrande
              label="Mensaje destacado"
              value={
                formulario.home_featured
              }
              onChange={(valor) =>
                cambiarCampo(
                  "home_featured",
                  valor
                )
              }
              placeholder="Escribe un mensaje especial para mostrar en Inicio."
            />
          </div>
        </div>

        {/* TEXTOS DE CATEGORÍAS */}

        <div className={`${tarjeta} p-6`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              🛍️ Textos de las categorías
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              Personaliza los mensajes de cada
              sección de la tienda.
            </p>
          </div>

          <div className="space-y-4">
            <CampoGrande
              label="Texto de Hombre"
              value={
                formulario.hombre_text
              }
              onChange={(valor) =>
                cambiarCampo(
                  "hombre_text",
                  valor
                )
              }
              placeholder="Descubre nuestra colección para hombre."
            />

            <CampoGrande
              label="Texto de Mujer"
              value={
                formulario.mujer_text
              }
              onChange={(valor) =>
                cambiarCampo(
                  "mujer_text",
                  valor
                )
              }
              placeholder="Descubre nuestra colección para mujer."
            />

            <CampoGrande
              label="Texto de Ofertas"
              value={
                formulario.ofertas_text
              }
              onChange={(valor) =>
                cambiarCampo(
                  "ofertas_text",
                  valor
                )
              }
              placeholder="Encuentra nuestras mejores ofertas."
            />

            <CampoConfiguracion
              label="Título de promociones"
              value={
                formulario.promo_title
              }
              onChange={(valor) =>
                cambiarCampo(
                  "promo_title",
                  valor
                )
              }
              placeholder="Promociones GMISH"
            />
          </div>
        </div>

        {/* CAMPAÑA */}

        <div className={`${tarjeta} p-6`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              🎉 Campaña especial
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#777777]">
              Puedes preparar una campaña,
              como un aniversario, y activarla
              cuando quieras.
            </p>
          </div>

          <div className="space-y-4">
            <CampoConfiguracion
              label="Nombre de la campaña"
              value={
                formulario.campaign_name
              }
              onChange={(valor) =>
                cambiarCampo(
                  "campaign_name",
                  valor
                )
              }
              placeholder="Aniversario GMISH"
            />

            <CampoGrande
              label="Mensaje de la campaña"
              value={
                formulario.campaign_message
              }
              onChange={(valor) =>
                cambiarCampo(
                  "campaign_message",
                  valor
                )
              }
              placeholder="Celebramos contigo con promociones especiales."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                  Fecha de inicio
                </label>

                <input
                  type="date"
                  value={
                    formulario.campaign_start
                  }
                  onChange={(e) =>
                    cambiarCampo(
                      "campaign_start",
                      e.target.value
                    )
                  }
                  className={campo}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#cccccc]">
                  Fecha de finalización
                </label>

                <input
                  type="date"
                  value={
                    formulario.campaign_end
                  }
                  onChange={(e) =>
                    cambiarCampo(
                      "campaign_end",
                      e.target.value
                    )
                  }
                  className={campo}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#383838] bg-[#0d0d0d] px-4 py-4">
              <input
                type="checkbox"
                checked={
                  formulario.campaign_active
                }
                onChange={(e) =>
                  cambiarCampo(
                    "campaign_active",
                    e.target.checked
                  )
                }
                className="h-5 w-5 accent-[#76509a]"
              />

              <div>
                <p className="text-sm font-semibold text-white">
                  Activar campaña
                </p>

                <p className="mt-1 text-xs text-[#777777]">
                  La campaña podrá utilizarse
                  en la tienda pública.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* REDES SOCIALES */}

        <div className={`${tarjeta} p-6`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              🔗 Redes sociales
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              Enlaces oficiales de GMISH.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <CampoConfiguracion
              label="Instagram"
              value={
                formulario.instagram_url
              }
              onChange={(valor) =>
                cambiarCampo(
                  "instagram_url",
                  valor
                )
              }
              placeholder="https://instagram.com/..."
            />

            <CampoConfiguracion
              label="TikTok"
              value={
                formulario.tiktok_url
              }
              onChange={(valor) =>
                cambiarCampo(
                  "tiktok_url",
                  valor
                )
              }
              placeholder="https://tiktok.com/@..."
            />

            <CampoConfiguracion
              label="Facebook"
              value={
                formulario.facebook_url
              }
              onChange={(valor) =>
                cambiarCampo(
                  "facebook_url",
                  valor
                )
              }
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>

        {/* GUARDAR */}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={guardarConfiguracion}
            disabled={guardando}
            className="w-full rounded-xl bg-[#76509a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#8660aa] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {guardando
              ? "Guardando cambios..."
              : "Guardar toda la configuración"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   COMPONENTES PEQUEÑOS DE CONFIGURACIÓN
   ========================================================= */

function CampoConfiguracion({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#cccccc]">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className={campo}
      />
    </div>
  );
}

function CampoGrande({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#cccccc]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className={`${campo} resize-y`}
      />
    </div>
  );
}