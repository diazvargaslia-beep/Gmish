import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductsAdmin from "./ProductsAdmin";

/* =========================================================
   SECCIONES Y PERMISOS
========================================================= */

const secciones = [
  {
    id: "inicio",
    nombre: "Inicio",
    icono: "⌂",
    acceso: ["principal", "secundario"],
  },
  {
    id: "productos",
    nombre: "Productos",
    icono: "▦",
    acceso: ["principal", "secundario"],
  },
  {
    id: "pedidos",
    nombre: "Pedidos y ventas",
    icono: "▤",
    acceso: ["principal"],
  },
  {
    id: "portadas",
    nombre: "Portadas",
    icono: "▧",
    acceso: ["principal"],
  },
  {
    id: "estadisticas",
    nombre: "Estadísticas",
    icono: "↗",
    acceso: ["principal"],
  },
  {
    id: "configuracion",
    nombre: "Configuración",
    icono: "⚙",
    acceso: ["principal"],
  },
];

/* =========================================================
   ESTILOS
========================================================= */

const tarjeta =
  "rounded-2xl border border-[#29233a] bg-[#17151f] shadow-[0_12px_40px_rgba(0,0,0,0.25)]";

const botonPrincipal =
  "rounded-xl border border-[#332b46] bg-[#1b1824] px-5 py-3 text-sm font-semibold text-[#e8e3f0] transition hover:border-[#8b5cf6] hover:bg-[#211c2d] disabled:cursor-not-allowed disabled:opacity-40";

const botonMorado =
  "rounded-xl bg-[#7c3aed] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-40";

const campo =
  "w-full rounded-xl border border-[#342c45] bg-[#121019] px-4 py-3 text-sm text-[#f4f0f8] outline-none transition placeholder:text-[#777080] focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20";

const etiqueta =
  "mb-2 block text-sm font-semibold text-[#d9d3e2]";

/* =========================================================
   UTILIDADES
========================================================= */

function obtenerSeccionDesdeUrl() {
  const hash = window.location.hash.replace("#", "").trim();

  const existe = secciones.some(
    (item) => item.id === hash
  );

  return existe ? hash : "inicio";
}

function formatearPrecio(valor) {
  const numero = Number(valor || 0);

  return `S/ ${numero.toFixed(2)}`;
}

function formatearFechaHora(fecha) {
  if (!fecha) return "-";

  return new Date(fecha).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

function Admin() {
  const [sesion, setSesion] = useState(null);
  const [rol, setRol] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [cargandoRol, setCargandoRol] = useState(false);
  const [conectado, setConectado] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [seccion, setSeccion] = useState(() =>
    obtenerSeccionDesdeUrl()
  );

  const [menuAbierto, setMenuAbierto] = useState(false);

  /* =====================================================
     SECCIONES SEGÚN ROL
  ===================================================== */

  const seccionesVisibles = useMemo(() => {
    if (!rol) return [];

    return secciones.filter((item) =>
      item.acceso.includes(rol)
    );
  }, [rol]);

  /* =====================================================
     SESIÓN
  ===================================================== */

  useEffect(() => {
    let activo = true;

    async function cargarSesion() {
      setCargando(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!activo) return;

      setSesion(session);

      if (session?.user) {
        await cargarRolUsuario(session.user.id);
        await comprobarConexion();
      }

      setCargando(false);
    }

    cargarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, nuevaSesion) => {
        if (!activo) return;

        setSesion(nuevaSesion);

        if (nuevaSesion?.user) {
          await cargarRolUsuario(nuevaSesion.user.id);
          await comprobarConexion();
        } else {
          setRol(null);
          setConectado(false);
        }
      }
    );

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =====================================================
     HISTORIAL DEL NAVEGADOR
  ===================================================== */

  useEffect(() => {
    function sincronizarConUrl() {
      const nuevaSeccion = obtenerSeccionDesdeUrl();

      setSeccion(nuevaSeccion);
      setMenuAbierto(false);
    }

    window.addEventListener(
      "hashchange",
      sincronizarConUrl
    );

    window.addEventListener(
      "popstate",
      sincronizarConUrl
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        sincronizarConUrl
      );

      window.removeEventListener(
        "popstate",
        sincronizarConUrl
      );
    };
  }, []);

  /* =====================================================
     CARGAR ROL
  ===================================================== */

  async function cargarRolUsuario(userId) {
    setCargandoRol(true);
    setError("");

    const { data, error: errorRol } = await supabase
      .from("admin_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (errorRol) {
      console.error(errorRol);

      setRol(null);

      setError(
        "No se pudo comprobar el rol de administrador."
      );

      setCargandoRol(false);
      return null;
    }

    if (!data?.role) {
      setRol(null);

      setError(
        "Esta cuenta no tiene un rol de administrador asignado."
      );

      setCargandoRol(false);

      await supabase.auth.signOut();

      return null;
    }

    setRol(data.role);
    setCargandoRol(false);

    return data.role;
  }

  /* =====================================================
     PROTEGER SECCIÓN
  ===================================================== */

  useEffect(() => {
    if (!rol) return;

    const permitida = seccionesVisibles.some(
      (item) => item.id === seccion
    );

    if (!permitida) {
      cambiarSeccion("inicio", true);
    }
  }, [rol, seccion, seccionesVisibles]);

  /* =====================================================
     CONEXIÓN
  ===================================================== */

  async function comprobarConexion() {
    const { error: errorConexion } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    setConectado(!errorConexion);
  }

  /* =====================================================
     LOGIN
  ===================================================== */

  async function iniciarSesion(event) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Completa el correo y la contraseña."
      );
      return;
    }

    const { data, error: errorLogin } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (errorLogin) {
      setError(errorLogin.message);
      return;
    }

    if (data?.user) {
      await cargarRolUsuario(data.user.id);
      await comprobarConexion();
    }
  }

  /* =====================================================
     CERRAR SESIÓN
  ===================================================== */

  async function cerrarSesion() {
    await supabase.auth.signOut();

    setSesion(null);
    setRol(null);
    setMenuAbierto(false);
    setSeccion("inicio");

    window.history.pushState(
      {},
      "",
      `${window.location.pathname}${window.location.search}#inicio`
    );
  }

  /* =====================================================
     CAMBIAR SECCIÓN
  ===================================================== */

  function cambiarSeccion(id, reemplazar = false) {
    const permitida = seccionesVisibles.some(
      (item) => item.id === id
    );

    if (!permitida) {
      id = "inicio";
    }

    setSeccion(id);
    setMenuAbierto(false);

    const nuevaUrl =
      `${window.location.pathname}` +
      `${window.location.search}#${id}`;

    if (reemplazar) {
      window.history.replaceState(
        { seccion: id },
        "",
        nuevaUrl
      );
    } else {
      window.history.pushState(
        { seccion: id },
        "",
        nuevaUrl
      );
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (cargando || cargandoRol) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0d15] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7c3aed] text-2xl font-black text-white shadow-[0_0_35px_rgba(124,58,237,0.35)]">
            G
          </div>

          <p className="text-sm font-semibold text-[#eee9f5]">
            Cargando GMISH...
          </p>

          <p className="mt-2 text-xs text-[#81798e]">
            Preparando el panel administrativo
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     LOGIN
  ===================================================== */

  if (!sesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0d15] px-5 py-12">
        <div className="mx-auto w-full max-w-md">
          <div
            className={`${tarjeta} overflow-hidden`}
          >
            <div className="border-b border-[#29233a] px-8 py-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7c3aed] text-2xl font-black text-white shadow-[0_0_35px_rgba(124,58,237,0.35)]">
                G
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white">
                GMISH
              </h1>

              <p className="mt-2 text-sm text-[#91889d]">
                Panel administrativo
              </p>
            </div>

            <form
              onSubmit={iniciarSesion}
              className="space-y-6 px-8 py-9"
            >
              <div>
                <label className={etiqueta}>
                  Correo electrónico
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="correo@ejemplo.com"
                  className={campo}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className={etiqueta}>
                  Contraseña
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  className={campo}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm leading-5 text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={`${botonMorado} w-full py-3.5`}
              >
                Iniciar sesión
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[#696170]">
            GMISH · Panel privado
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     PANEL PRINCIPAL
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#0f0d15] text-[#eee9f5]">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#29233a] bg-[#121019]/95 shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          {/* IZQUIERDA */}

          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setMenuAbierto(!menuAbierto)
              }
              className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-[#342c45] bg-[#181520] transition hover:border-[#8b5cf6] hover:bg-[#211c2d]"
              aria-label="Abrir menú"
            >
              <span className="h-0.5 w-5 rounded-full bg-[#ddd5e7]" />
              <span className="h-0.5 w-5 rounded-full bg-[#ddd5e7]" />
              <span className="h-0.5 w-5 rounded-full bg-[#ddd5e7]" />
            </button>

            <div className="min-w-0">
              <p className="text-lg font-black tracking-[0.18em] text-white">
                GMISH
              </p>

              <p className="hidden text-[10px] font-medium uppercase tracking-widest text-[#746b80] sm:block">
                Panel administrativo
              </p>
            </div>
          </div>

          {/* CENTRO */}

          <div className="hidden items-center gap-3 md:flex">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                conectado
                  ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"
                  : "bg-red-500"
              }`}
            />

            <span className="text-xs font-semibold text-[#8e8599]">
              {conectado
                ? "Base de datos conectada"
                : "Sin conexión"}
            </span>
          </div>

          {/* DERECHA */}

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full border border-[#3b3150] bg-[#211a2e] px-3 py-1.5 text-xs font-bold capitalize text-[#b993ff] sm:block">
              {rol}
            </span>

            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-xl border border-[#342c45] px-4 py-2.5 text-xs font-bold text-[#9c94a5] transition hover:border-red-900/60 hover:bg-red-950/20 hover:text-red-400"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* MENÚ */}

      {menuAbierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          />

          <aside className="fixed left-1/2 top-24 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-2xl border border-[#342c45] bg-[#17151f] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
            <div className="mb-3 px-3 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Administración
              </p>
            </div>

            <nav className="space-y-2">
              {seccionesVisibles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    cambiarSeccion(item.id)
                  }
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-sm font-semibold transition ${
                    seccion === item.id
                      ? "bg-[#2a1d3e] text-[#b993ff]"
                      : "text-[#bcb4c7] hover:bg-[#211c2d] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${
                      seccion === item.id
                        ? "bg-[#7c3aed] text-white"
                        : "bg-[#211c2d] text-[#8f849e]"
                    }`}
                  >
                    {item.icono}
                  </span>

                  <span>{item.nombre}</span>
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* CONTENIDO */}

      <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-14">
        {seccion === "inicio" && (
          <InicioAdmin
            rol={rol}
            conectado={conectado}
            cambiarSeccion={cambiarSeccion}
            seccionesVisibles={seccionesVisibles}
          />
        )}

        {seccion === "productos" && (
          <div className="mx-auto w-full max-w-5xl">
            <ProductsAdmin rol={rol} />
          </div>
        )}

        {seccion === "pedidos" &&
          rol === "principal" && <PedidosAdmin />}

        {seccion === "portadas" &&
          rol === "principal" && <PortadasAdmin />}

        {seccion === "estadisticas" &&
          rol === "principal" && (
            <EstadisticasAdmin />
          )}

        {seccion === "configuracion" &&
          rol === "principal" && (
            <ConfiguracionAdmin />
          )}
      </main>

      {/* FOOTER */}

      <footer className="mx-auto mt-6 w-full max-w-5xl border-t border-[#29233a] px-5 py-10 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row">
          <p className="text-xs font-semibold text-[#696170]">
            © {new Date().getFullYear()} GMISH
          </p>

          <p className="text-xs text-[#514a5a]">
            Panel administrativo
          </p>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   INICIO
========================================================= */

function InicioAdmin({
  rol,
  conectado,
  cambiarSeccion,
  seccionesVisibles,
}) {
  const tarjetas = seccionesVisibles.filter(
    (item) => item.id !== "inicio"
  );

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-4xl text-center">
        <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
          Panel GMISH
        </span>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Bienvenida al administrador
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#91889d]">
          Gestiona productos, pedidos, portadas,
          estadísticas y configuración desde un solo lugar.
        </p>

        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#342c45] bg-[#17151f] px-4 py-2.5 text-xs font-semibold text-[#91889d]">
            <span
              className={`h-2 w-2 rounded-full ${
                conectado
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                  : "bg-red-500"
              }`}
            />

            {conectado
              ? "Supabase conectado"
              : "Revisar conexión"}
          </span>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tarjetas.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                cambiarSeccion(item.id)
              }
              className={`${tarjeta} group flex min-h-[190px] flex-col items-center justify-center p-7 text-center transition duration-200 hover:-translate-y-1 hover:border-[#6d4ca0] hover:shadow-[0_18px_50px_rgba(124,58,237,0.14)]`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#241b32] text-xl text-[#a978ff] transition group-hover:bg-[#7c3aed] group-hover:text-white">
                {item.icono}
              </div>

              <h2 className="mt-5 text-base font-bold text-white">
                {item.nombre}
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#81798e]">
                Administrar esta sección.
              </p>
            </button>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-[#342c45] bg-[#17151f] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#766d80]">
            Cuenta actual
          </p>

          <p className="mt-3 text-sm font-bold capitalize text-[#b993ff]">
            {rol}
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PEDIDOS
========================================================= */

function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    setCargando(true);
    setError("");

    const { data, error: errorPedidos } =
      await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            size,
            color,
            subtotal,
            product_id
          )
        `)
        .order("created_at", {
          ascending: false,
        });

    if (errorPedidos) {
      console.error(errorPedidos);

      setError(
        "No se pudieron cargar los pedidos."
      );

      setCargando(false);
      return;
    }

    setPedidos(data || []);
    setCargando(false);
  }

  async function cambiarEstado(id, estado) {
    const estadosPermitidos = [
      "pendiente",
      "enviado",
      "entregado",
      "cancelado",
    ];

    if (!estadosPermitidos.includes(estado)) {
      return;
    }

    const fecha = new Date().toISOString();

    const { error: errorActualizar } =
      await supabase
        .from("orders")
        .update({
          status: estado,
          updated_at: fecha,
        })
        .eq("id", id);

    if (errorActualizar) {
      console.error(errorActualizar);

      alert(
        "No se pudo actualizar el pedido."
      );

      return;
    }

    setPedidos((actuales) =>
      actuales.map((pedido) =>
        pedido.id === id
          ? {
              ...pedido,
              status: estado,
              updated_at: fecha,
            }
          : pedido
      )
    );
  }

  const pedidosFiltrados =
    filtro === "todos"
      ? pedidos
      : pedidos.filter(
          (pedido) =>
            pedido.status === filtro
        );

  if (cargando) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[#81798e]">
          Cargando pedidos...
        </p>
      </div>
    );
  }

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            Ventas
          </span>

          <h1 className="mt-6 text-3xl font-black text-white">
            Pedidos y ventas
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#91889d]">
            Consulta pedidos y actualiza su estado.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {[
            ["todos", "Todos"],
            ["pendiente", "Pendientes"],
            ["enviado", "Enviados"],
            ["entregado", "Entregados"],
            ["cancelado", "Cancelados"],
          ].map(([valor, nombre]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              className={`rounded-full px-5 py-2.5 text-xs font-bold transition ${
                filtro === valor
                  ? "bg-[#7c3aed] text-white shadow-[0_5px_20px_rgba(124,58,237,0.2)]"
                  : "border border-[#342c45] bg-[#17151f] text-[#91889d] hover:border-[#7c3aed] hover:text-[#b993ff]"
              }`}
            >
              {nombre}
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-10 space-y-6">
          {pedidosFiltrados.length === 0 ? (
            <div className={`${tarjeta} p-12 text-center`}>
              <p className="text-sm font-semibold text-[#aaa1b3]">
                No hay pedidos en esta categoría.
              </p>
            </div>
          ) : (
            pedidosFiltrados.map((pedido) => (
              <article
                key={pedido.id}
                className={`${tarjeta} p-6 sm:p-8`}
              >
                <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
                  <div className="text-center lg:text-left">
                    <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                      <h2 className="text-base font-black text-white">
                        Pedido{" "}
                        {pedido.order_number ||
                          `#${pedido.id}`}
                      </h2>

                      <span className="rounded-full bg-[#291d3b] px-3 py-1 text-xs font-bold capitalize text-[#b993ff]">
                        {pedido.status ||
                          "pendiente"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-[#91889d]">
                      <p>
                        <strong className="text-[#cfc7d8]">
                          Cliente:
                        </strong>{" "}
                        {pedido.customer_name ||
                          "-"}
                      </p>

                      <p>
                        <strong className="text-[#cfc7d8]">
                          Fecha:
                        </strong>{" "}
                        {formatearFechaHora(
                          pedido.created_at
                        )}
                      </p>

                      <p>
                        <strong className="text-[#cfc7d8]">
                          Dirección:
                        </strong>{" "}
                        {pedido.delivery_address ||
                          "-"}
                      </p>

                      <p>
                        <strong className="text-[#cfc7d8]">
                          Referencia:
                        </strong>{" "}
                        {pedido.delivery_reference ||
                          "-"}
                      </p>
                    </div>
                  </div>

                  <div className="text-center lg:text-right">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#71687e]">
                      Total
                    </p>

                    <p className="mt-2 text-2xl font-black text-[#a978ff]">
                      {formatearPrecio(
                        pedido.total
                      )}
                    </p>

                    <select
                      value={
                        pedido.status ||
                        "pendiente"
                      }
                      onChange={(event) =>
                        cambiarEstado(
                          pedido.id,
                          event.target.value
                        )
                      }
                      className="mt-5 rounded-xl border border-[#342c45] bg-[#121019] px-4 py-2.5 text-xs font-semibold text-[#ddd5e7] outline-none focus:border-[#8b5cf6]"
                    >
                      <option value="pendiente">
                        Pendiente
                      </option>

                      <option value="enviado">
                        Enviado
                      </option>

                      <option value="entregado">
                        Entregado
                      </option>

                      <option value="cancelado">
                        Cancelado
                      </option>
                    </select>
                  </div>
                </div>

                {pedido.order_items?.length >
                  0 && (
                  <div className="mt-7 border-t border-[#29233a] pt-6">
                    <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-[#71687e]">
                      Productos
                    </p>

                    <div className="space-y-3">
                      {pedido.order_items.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#121019] px-4 py-3.5 text-xs"
                          >
                            <span className="font-semibold text-[#cfc7d8]">
                              {item.size || "-"}{" "}
                              /{" "}
                              {item.color || "-"}
                            </span>

                            <span className="text-[#81798e]">
                              x{item.quantity}
                            </span>

                            <span className="font-bold text-[#ddd5e7]">
                              {formatearPrecio(
                                item.subtotal
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PORTADAS
========================================================= */

function PortadasAdmin() {
  const [portadas, setPortadas] = useState({
    principal: "",
    hombre: "",
    mujer: "",
  });

  const [archivos, setArchivos] = useState({
    principal: null,
    hombre: null,
    mujer: null,
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPortadas();
  }, []);

  async function cargarPortadas() {
    setCargando(true);

    const { data, error: errorPortadas } =
      await supabase
        .from("store_settings")
        .select(
          "setting_key, setting_value"
        )
        .in("setting_key", [
          "portada_principal",
          "portada_hombre",
          "portada_mujer",
        ]);

    if (errorPortadas) {
      console.error(errorPortadas);

      setError(
        "No se pudieron cargar las portadas."
      );

      setCargando(false);
      return;
    }

    const nuevasPortadas = {
      principal: "",
      hombre: "",
      mujer: "",
    };

    (data || []).forEach((item) => {
      if (
        item.setting_key ===
        "portada_principal"
      ) {
        nuevasPortadas.principal =
          item.setting_value || "";
      }

      if (
        item.setting_key === "portada_hombre"
      ) {
        nuevasPortadas.hombre =
          item.setting_value || "";
      }

      if (
        item.setting_key === "portada_mujer"
      ) {
        nuevasPortadas.mujer =
          item.setting_value || "";
      }
    });

    setPortadas(nuevasPortadas);
    setCargando(false);
  }

  function seleccionarArchivo(tipo, archivo) {
    setArchivos((actuales) => ({
      ...actuales,
      [tipo]: archivo,
    }));

    setMensaje("");
    setError("");
  }

  async function guardarPortada(tipo) {
    const archivo = archivos[tipo];

    if (!archivo) {
      setError(
        "Selecciona una imagen primero."
      );
      return;
    }

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const extension =
        archivo.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const nombreArchivo =
        `${tipo}-${Date.now()}.${extension}`;

      const ruta =
        `portadas/${nombreArchivo}`;

      const { error: errorUpload } =
        await supabase.storage
          .from("product-images")
          .upload(ruta, archivo, {
            upsert: true,
            contentType: archivo.type,
          });

      if (errorUpload) {
        throw errorUpload;
      }

      const { data: urlData } =
        supabase.storage
          .from("product-images")
          .getPublicUrl(ruta);

      const url = urlData.publicUrl;

      const settingKey =
        `portada_${tipo}`;

      const { error: errorGuardar } =
        await supabase
          .from("store_settings")
          .upsert(
            {
              id:
                tipo === "principal"
                  ? 6
                  : tipo === "hombre"
                    ? 7
                    : 5,
              store_name: "GMISH",
              setting_key: settingKey,
              setting_value: url,
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: "id",
            }
          );

      if (errorGuardar) {
        throw errorGuardar;
      }

      setPortadas((actuales) => ({
        ...actuales,
        [tipo]: url,
      }));

      setArchivos((actuales) => ({
        ...actuales,
        [tipo]: null,
      }));

      setMensaje(
        `Portada de ${tipo} actualizada correctamente.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No se pudo guardar la portada."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[#81798e]">
          Cargando portadas...
        </p>
      </div>
    );
  }

  const opciones = [
    {
      id: "principal",
      titulo: "Portada principal",
      descripcion:
        "Imagen principal que aparece en Inicio.",
    },
    {
      id: "hombre",
      titulo: "Portada Hombre",
      descripcion:
        "Imagen utilizada para la sección Hombre.",
    },
    {
      id: "mujer",
      titulo: "Portada Mujer",
      descripcion:
        "Imagen utilizada para la sección Mujer.",
    },
  ];

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            Imágenes
          </span>

          <h1 className="mt-6 text-3xl font-black text-white">
            Portadas
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#91889d]">
            Administra las imágenes principales de la tienda.
          </p>
        </div>

        {mensaje && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-green-900/50 bg-green-950/30 p-4 text-center text-sm text-green-300">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-7 md:grid-cols-2">
          {opciones.map((opcion) => (
            <div
              key={opcion.id}
              className={`${tarjeta} overflow-hidden`}
            >
              <div className="aspect-[16/9] bg-[#121019]">
                {portadas[opcion.id] ? (
                  <img
                    src={portadas[opcion.id]}
                    alt={opcion.titulo}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#71687e]">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="p-7 text-center">
                <h2 className="text-base font-bold text-white">
                  {opcion.titulo}
                </h2>

                <p className="mt-3 text-xs leading-5 text-[#81798e]">
                  {opcion.descripcion}
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    seleccionarArchivo(
                      opcion.id,
                      event.target.files?.[0] ||
                        null
                    )
                  }
                  className="mt-6 w-full text-xs text-[#91889d]"
                />

                <button
                  type="button"
                  disabled={
                    guardando ||
                    !archivos[opcion.id]
                  }
                  onClick={() =>
                    guardarPortada(opcion.id)
                  }
                  className={`${botonMorado} mt-5 w-full`}
                >
                  Guardar portada
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   ESTADÍSTICAS
========================================================= */

function EstadisticasAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  async function cargarEstadisticas() {
    setCargando(true);

    const [
      { data: pedidosData, error: pedidosError },
      {
        data: productosData,
        error: productosError,
      },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, status, total, created_at, discount"
        ),

      supabase
        .from("products")
        .select(
          "id, name, sold_count, price, is_active, is_new, is_best_seller"
        ),
    ]);

    if (pedidosError) {
      console.error(pedidosError);
    }

    if (productosError) {
      console.error(productosError);
    }

    setPedidos(pedidosData || []);
    setProductos(productosData || []);
    setCargando(false);
  }

  const pedidosValidos = pedidos.filter(
    (pedido) =>
      pedido.status !== "cancelado"
  );

  const pedidosEntregados = pedidos.filter(
    (pedido) =>
      pedido.status === "entregado"
  );

  const ventasEntregadas =
    pedidosEntregados.reduce(
      (total, pedido) =>
        total + Number(pedido.total || 0),
      0
    );

  const ventasGenerales =
    pedidosValidos.reduce(
      (total, pedido) =>
        total + Number(pedido.total || 0),
      0
    );

  const descuentos = pedidosValidos.reduce(
    (total, pedido) =>
      total + Number(pedido.discount || 0),
    0
  );

  const productosVendidos = productos
    .filter(
      (producto) =>
        Number(producto.sold_count || 0) > 0
    )
    .sort(
      (a, b) =>
        Number(b.sold_count || 0) -
        Number(a.sold_count || 0)
    )
    .slice(0, 5);

  if (cargando) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[#81798e]">
          Calculando estadísticas...
        </p>
      </div>
    );
  }

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            Análisis
          </span>

          <h1 className="mt-6 text-3xl font-black text-white">
            Estadísticas
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#91889d]">
            Resumen general del rendimiento de GMISH.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            titulo="Pedidos"
            valor={pedidosValidos.length}
          />

          <StatCard
            titulo="Entregados"
            valor={pedidosEntregados.length}
          />

          <StatCard
            titulo="Ventas entregadas"
            valor={formatearPrecio(
              ventasEntregadas
            )}
          />

          <StatCard
            titulo="Descuentos"
            valor={formatearPrecio(
              descuentos
            )}
          />
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          <div className={`${tarjeta} p-7`}>
            <h2 className="text-center text-base font-black text-white lg:text-left">
              Resumen de ventas
            </h2>

            <div className="mt-6 space-y-5">
              <FilaEstadistica
                nombre="Ventas no canceladas"
                valor={formatearPrecio(
                  ventasGenerales
                )}
              />

              <FilaEstadistica
                nombre="Ventas entregadas"
                valor={formatearPrecio(
                  ventasEntregadas
                )}
              />

              <FilaEstadistica
                nombre="Pedidos cancelados"
                valor={
                  pedidos.filter(
                    (pedido) =>
                      pedido.status ===
                      "cancelado"
                  ).length
                }
              />
            </div>
          </div>

          <div className={`${tarjeta} p-7`}>
            <h2 className="text-center text-base font-black text-white lg:text-left">
              Productos más vendidos
            </h2>

            <div className="mt-6 space-y-3">
              {productosVendidos.length ===
              0 ? (
                <p className="text-center text-sm text-[#81798e]">
                  Todavía no hay productos vendidos.
                </p>
              ) : (
                productosVendidos.map(
                  (producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-[#121019] px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#ddd5e7]">
                          {producto.name}
                        </p>

                        <p className="mt-1 text-xs text-[#71687e]">
                          {formatearPrecio(
                            producto.price
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#291d3b] px-3 py-1 text-xs font-bold text-[#b993ff]">
                        {producto.sold_count ||
                          0}{" "}
                        vendidos
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ titulo, valor }) {
  return (
    <div
      className={`${tarjeta} flex min-h-[145px] flex-col items-center justify-center p-6 text-center`}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
        {titulo}
      </p>

      <p className="mt-4 text-2xl font-black text-[#a978ff]">
        {valor}
      </p>
    </div>
  );
}

function FilaEstadistica({ nombre, valor }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#29233a] pb-4">
      <span className="text-sm text-[#91889d]">
        {nombre}
      </span>

      <span className="text-right text-sm font-black text-[#ddd5e7]">
        {valor}
      </span>
    </div>
  );
}

/* =========================================================
   CONFIGURACIÓN
========================================================= */

function ConfiguracionAdmin() {
  const [config, setConfig] = useState({
    whatsapp_principal: "",
    whatsapp_secundario: "",
    address: "",
    maps_url: "",
    instagram_url: "",
    tiktok_url: "",
    facebook_url: "",
  });

  const [contenido, setContenido] = useState({
    home_title: "",
    home_text: "",
    home_button: "",
    home_featured: "",
    hombre_text: "",
    mujer_text: "",
    ofertas_text: "",
    promo_title: "",
    campaign_name: "",
    campaign_active: "false",
    campaign_start: "",
    campaign_end: "",
    campaign_message: "",
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setCargando(true);
    setError("");

    const { data, error: errorConfig } =
      await supabase
        .from("store_settings")
        .select("*")
        .order("id", {
          ascending: true,
        });

    if (errorConfig) {
      console.error(errorConfig);

      setError(
        "No se pudo cargar la configuración."
      );

      setCargando(false);
      return;
    }

    const filaGeneral =
      (data || []).find(
        (item) => item.setting_key === null
      ) || data?.[0];

    setConfig({
      whatsapp_principal:
        filaGeneral?.whatsapp_principal ||
        "",
      whatsapp_secundario:
        filaGeneral?.whatsapp_secundario ||
        "",
      address: filaGeneral?.address || "",
      maps_url: filaGeneral?.maps_url || "",
      instagram_url:
        filaGeneral?.instagram_url || "",
      tiktok_url:
        filaGeneral?.tiktok_url || "",
      facebook_url:
        filaGeneral?.facebook_url || "",
    });

    const nuevoContenido = {
      home_title: "",
      home_text: "",
      home_button: "",
      home_featured: "",
      hombre_text: "",
      mujer_text: "",
      ofertas_text: "",
      promo_title: "",
      campaign_name: "",
      campaign_active: "false",
      campaign_start: "",
      campaign_end: "",
      campaign_message: "",
    };

    (data || []).forEach((item) => {
      if (
        Object.prototype.hasOwnProperty.call(
          nuevoContenido,
          item.setting_key
        )
      ) {
        nuevoContenido[item.setting_key] =
          item.setting_value || "";
      }
    });

    setContenido(nuevoContenido);
    setCargando(false);
  }

  function cambiarConfig(campo, valor) {
    setConfig((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function cambiarContenido(campo, valor) {
    setContenido((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarConfiguracion(event) {
    event.preventDefault();

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const { error: errorGeneral } =
        await supabase
          .from("store_settings")
          .update({
            store_name: "GMISH",
            address: config.address,
            maps_url: config.maps_url,
            instagram_url:
              config.instagram_url,
            tiktok_url:
              config.tiktok_url,
            facebook_url:
              config.facebook_url,
            whatsapp_principal:
              config.whatsapp_principal,
            whatsapp_secundario:
              config.whatsapp_secundario,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", 1);

      if (errorGeneral) {
        throw errorGeneral;
      }

      const claves = Object.keys(contenido);

      for (const clave of claves) {
        const {
          error: errorContenido,
        } = await supabase
          .from("store_settings")
          .upsert(
            {
              store_name: "GMISH",
              setting_key: clave,
              setting_value:
                contenido[clave] ?? "",
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: "setting_key",
            }
          );

        if (errorContenido) {
          throw errorContenido;
        }
      }

      setMensaje(
        "Configuración guardada correctamente."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No se pudo guardar la configuración."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[#81798e]">
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            Sistema
          </span>

          <h1 className="mt-6 text-3xl font-black text-white">
            Configuración
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#91889d]">
            Administra los datos generales y el contenido de la tienda.
          </p>
        </div>

        {mensaje && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-green-900/50 bg-green-950/30 p-4 text-center text-sm text-green-300">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={guardarConfiguracion}
          className="mt-10 space-y-8"
        >
          {/* CONTACTO */}

          <div className={`${tarjeta} p-7 sm:p-9`}>
            <div className="text-center">
              <h2 className="text-lg font-black text-white">
                Contacto
              </h2>

              <p className="mt-2 text-xs text-[#81798e]">
                Datos utilizados por la tienda.
              </p>
            </div>

            <div className="mt-7 grid gap-6 md:grid-cols-2">
              <CampoConfiguracion
                etiqueta="WhatsApp principal"
                valor={
                  config.whatsapp_principal
                }
                onChange={(valor) =>
                  cambiarConfig(
                    "whatsapp_principal",
                    valor
                  )
                }
                placeholder="519xxxxxxxx"
              />

              <CampoConfiguracion
                etiqueta="WhatsApp secundario"
                valor={
                  config.whatsapp_secundario
                }
                onChange={(valor) =>
                  cambiarConfig(
                    "whatsapp_secundario",
                    valor
                  )
                }
                placeholder="519xxxxxxxx"
              />

              <CampoConfiguracion
                etiqueta="Dirección"
                valor={config.address}
                onChange={(valor) =>
                  cambiarConfig(
                    "address",
                    valor
                  )
                }
                placeholder="Dirección del local"
              />

              <CampoConfiguracion
                etiqueta="Google Maps"
                valor={config.maps_url}
                onChange={(valor) =>
                  cambiarConfig(
                    "maps_url",
                    valor
                  )
                }
                placeholder="Enlace de Google Maps"
              />
            </div>
          </div>

          {/* REDES */}

          <div className={`${tarjeta} p-7 sm:p-9`}>
            <div className="text-center">
              <h2 className="text-lg font-black text-white">
                Redes sociales
              </h2>

              <p className="mt-2 text-xs text-[#81798e]">
                Enlaces oficiales de GMISH.
              </p>
            </div>

            <div className="mt-7 grid gap-6 md:grid-cols-3">
              <CampoConfiguracion
                etiqueta="Instagram"
                valor={
                  config.instagram_url
                }
                onChange={(valor) =>
                  cambiarConfig(
                    "instagram_url",
                    valor
                  )
                }
                placeholder="https://instagram.com/..."
              />

              <CampoConfiguracion
                etiqueta="TikTok"
                valor={config.tiktok_url}
                onChange={(valor) =>
                  cambiarConfig(
                    "tiktok_url",
                    valor
                  )
                }
                placeholder="https://tiktok.com/..."
              />

              <CampoConfiguracion
                etiqueta="Facebook"
                valor={
                  config.facebook_url
                }
                onChange={(valor) =>
                  cambiarConfig(
                    "facebook_url",
                    valor
                  )
                }
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>

          {/* INICIO */}

          <div className={`${tarjeta} p-7 sm:p-9`}>
            <div className="text-center">
              <h2 className="text-lg font-black text-white">
                Página de inicio
              </h2>

              <p className="mt-2 text-xs text-[#81798e]">
                Textos de la página principal.
              </p>
            </div>

            <div className="mt-7 space-y-6">
              <CampoConfiguracion
                etiqueta="Título"
                valor={contenido.home_title}
                onChange={(valor) =>
                  cambiarContenido(
                    "home_title",
                    valor
                  )
                }
                placeholder="Nueva colección GMISH"
              />

              <CampoGrande
                etiqueta="Descripción"
                valor={contenido.home_text}
                onChange={(valor) =>
                  cambiarContenido(
                    "home_text",
                    valor
                  )
                }
                placeholder="Texto de la página principal"
              />

              <CampoConfiguracion
                etiqueta="Texto del botón"
                valor={
                  contenido.home_button
                }
                onChange={(valor) =>
                  cambiarContenido(
                    "home_button",
                    valor
                  )
                }
                placeholder="Ver novedades"
              />

              <CampoConfiguracion
                etiqueta="Productos destacados"
                valor={
                  contenido.home_featured
                }
                onChange={(valor) =>
                  cambiarContenido(
                    "home_featured",
                    valor
                  )
                }
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* CATEGORÍAS */}

          <div className={`${tarjeta} p-7 sm:p-9`}>
            <div className="text-center">
              <h2 className="text-lg font-black text-white">
                Categorías
              </h2>

              <p className="mt-2 text-xs text-[#81798e]">
                Textos mostrados en las categorías.
              </p>
            </div>

            <div className="mt-7 space-y-6">
              <CampoGrande
                etiqueta="Texto Hombre"
                valor={
                  contenido.hombre_text
                }
                onChange={(valor) =>
                  cambiarContenido(
                    "hombre_text",
                    valor
                  )
                }
                placeholder="Descripción de Hombre"
              />

              <CampoGrande
                etiqueta="Texto Mujer"
                valor={
                  contenido.mujer_text
                }
                onChange={(valor) =>
                  cambiarContenido(
                    "mujer_text",
                    valor
                  )
                }
                placeholder="Descripción de Mujer"
              />

              <CampoGrande
                etiqueta="Texto Ofertas"
                valor={
                  contenido.ofertas_text
                }
                onChange={(valor) =>
                  cambiarContenido(
                    "ofertas_text",
                    valor
                  )
                }
                placeholder="Descripción de Ofertas"
              />
            </div>
          </div>

          {/* PROMOCIONES */}

          <div className={`${tarjeta} p-7 sm:p-9`}>
            <div className="text-center">
              <h2 className="text-lg font-black text-white">
                Promociones y campañas
              </h2>

              <p className="mt-2 text-xs text-[#81798e]">
                Preparado para campañas futuras.
              </p>
            </div>

            <div className="mt-7 space-y-6">
              <CampoConfiguracion
                etiqueta="Título de promociones"
                valor={
                  contenido.promo_title
                }
                onChange={(valor) =>
                  cambiarContenido(
                    "promo_title",
                    valor
                  )
                }
                placeholder="Promociones GMISH"
              />

              <CampoConfiguracion
                etiqueta="Nombre de campaña"
                valor={
                  contenido.campaign_name
                }
                onChange={(valor) =>
                  cambiarContenido(
                    "campaign_name",
                    valor
                  )
                }
                placeholder="Nombre de campaña"
              />

              <div>
                <label className={etiqueta}>
                  Campaña activa
                </label>

                <select
                  value={
                    contenido.campaign_active
                  }
                  onChange={(event) =>
                    cambiarContenido(
                      "campaign_active",
                      event.target.value
                    )
                  }
                  className={campo}
                >
                  <option value="false">
                    No
                  </option>

                  <option value="true">
                    Sí
                  </option>
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <CampoConfiguracion
                  etiqueta="Inicio"
                  tipo="datetime-local"
                  valor={
                    contenido.campaign_start
                  }
                  onChange={(valor) =>
                    cambiarContenido(
                      "campaign_start",
                      valor
                    )
                  }
                />

                <CampoConfiguracion
                  etiqueta="Fin"
                  tipo="datetime-local"
                  valor={
                    contenido.campaign_end
                  }
                  onChange={(valor) =>
                    cambiarContenido(
                      "campaign_end",
                      valor
                    )
                  }
                />
              </div>

              <CampoGrande
                etiqueta="Mensaje de campaña"
                valor={
                  contenido.campaign_message
                }
                onChange={(valor) =>
                  cambiarContenido(
                    "campaign_message",
                    valor
                  )
                }
                placeholder="Mensaje que verá el cliente"
              />
            </div>
          </div>

          {/* BOTÓN GUARDAR */}

          <div className="flex justify-center pb-6 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className={`${botonMorado} min-w-60 px-8 py-3.5`}
            >
              {guardando
                ? "Guardando..."
                : "Guardar configuración"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* =========================================================
   CAMPOS
========================================================= */

function CampoConfiguracion({
  etiqueta,
  valor,
  onChange,
  placeholder,
  tipo = "text",
}) {
  return (
    <div>
      <label className={etiqueta}>
        {etiqueta}
      </label>

      <input
        type={tipo}
        value={valor || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={campo}
      />
    </div>
  );
}

function CampoGrande({
  etiqueta,
  valor,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className={etiqueta}>
        {etiqueta}
      </label>

      <textarea
        value={valor || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className={`${campo} resize-y`}
      />
    </div>
  );
}

export default Admin;