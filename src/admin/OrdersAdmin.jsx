import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/* =========================================================
   UTILIDADES
========================================================= */

function formatearPrecio(valor) {
  return `S/ ${Number(valor || 0).toFixed(2)}`;
}

function formatearFechaHora(fecha) {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
}

function obtenerTipoVenta(pedido) {
  return pedido?.sale_type === "fisica" ? "fisica" : "online";
}

function obtenerTextoEstado(estado) {
  if (estado === "Entregado") return "Entregado";
  if (estado === "Cancelado") return "Cancelado";
  return "Pendiente";
}

function obtenerClaseEstado(estado) {
  if (estado === "Entregado") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (estado === "Cancelado") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-neutral-50 text-neutral-700 border-neutral-200";
}

/* =========================================================
   ESTILOS
========================================================= */

const tarjeta =
  "w-full rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.045)]";

const botonSecundario =
  "inline-flex min-h-[46px] items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40";

const botonPrincipal =
  "inline-flex min-h-[46px] items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40";

const botonPeligro =
  "inline-flex min-h-[46px] items-center justify-center rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40";

const campo =
  "w-full rounded-xl border border-neutral-200 bg-white px-[17px] py-[13px] text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10";

const etiqueta =
  "mb-2 block text-sm font-semibold text-neutral-800";

/* =========================================================
   PEDIDOS Y VENTAS
========================================================= */

export default function OrdersAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const [ventaAbierta, setVentaAbierta] = useState(false);
  const [detallePedido, setDetallePedido] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  /* =======================================================
     CARGAR DATOS
  ======================================================= */

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [
      {
        data: pedidosData,
        error: pedidosError,
      },
      {
        data: productosData,
        error: productosError,
      },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            order_id,
            product_id,
            product_name,
            size,
            color,
            quantity,
            unit_price,
            subtotal,
            variant_id
          )
        `)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("products")
        .select(`
          id,
          name,
          price,
          category,
          subcategory,
          is_active,
          sold_count,
          product_variants (
            id,
            product_id,
            size,
            color,
            stock,
            sku,
            color_hex,
            color_image_url,
            product_variant_images (
              id,
              image_url,
              position
            )
          )
        `)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (pedidosError) {
      console.error(pedidosError);
      setError("No se pudieron cargar los pedidos.");
    }

    if (productosError) {
      console.error(productosError);
      setError(
        "No se pudieron cargar los productos reales de GMISH."
      );
    }

    setPedidos(pedidosData || []);
    setProductos(productosData || []);
    setCargando(false);
  }

  /* =======================================================
     CAMBIAR ESTADO
  ======================================================= */

  async function cambiarEstado(pedido, nuevoEstado) {
    const estadosPermitidos = [
      "Pendiente",
      "Entregado",
      "Cancelado",
    ];

    if (!estadosPermitidos.includes(nuevoEstado)) {
      return;
    }

    if (pedido.status === nuevoEstado) {
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      /*
        Las ventas físicas descuentan stock
        al momento de registrarse.

        Si una venta física pasa a Cancelado,
        devolvemos stock y sold_count.
      */

      if (
        nuevoEstado === "Cancelado" &&
        pedido.status !== "Cancelado" &&
        obtenerTipoVenta(pedido) === "fisica"
      ) {
        for (const item of pedido.order_items || []) {
          if (!item.variant_id) {
            continue;
          }

          const cantidad = Number(item.quantity || 0);

          if (cantidad <= 0) {
            continue;
          }

          const {
            data: variante,
            error: errorVariante,
          } = await supabase
            .from("product_variants")
            .select("id, product_id, stock")
            .eq("id", item.variant_id)
            .single();

          if (errorVariante) {
            throw errorVariante;
          }

          const nuevoStock =
            Number(variante.stock || 0) + cantidad;

          const {
            error: errorStock,
          } = await supabase
            .from("product_variants")
            .update({
              stock: nuevoStock,
            })
            .eq("id", item.variant_id);

          if (errorStock) {
            throw errorStock;
          }

          if (item.product_id) {
            const {
              data: producto,
              error: errorProducto,
            } = await supabase
              .from("products")
              .select("id, sold_count")
              .eq("id", item.product_id)
              .single();

            if (errorProducto) {
              throw errorProducto;
            }

            const nuevoSoldCount = Math.max(
              0,
              Number(producto.sold_count || 0) - cantidad
            );

            const {
              error: errorSoldCount,
            } = await supabase
              .from("products")
              .update({
                sold_count: nuevoSoldCount,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.product_id);

            if (errorSoldCount) {
              throw errorSoldCount;
            }
          }
        }
      }

      const {
        error: errorActualizar,
      } = await supabase
        .from("orders")
        .update({
          status: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedido.id);

      if (errorActualizar) {
        throw errorActualizar;
      }

      setMensaje(
        nuevoEstado === "Cancelado"
          ? "Pedido cancelado correctamente."
          : "Estado actualizado correctamente."
      );

      await cargarDatos();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No se pudo actualizar el pedido."
      );
    } finally {
      setGuardando(false);
    }
  }

  /* =======================================================
     ELIMINAR PEDIDO
  ======================================================= */

  async function eliminarPedido(pedido) {
    if (!pedido?.id) {
      return;
    }

    const esFisica =
      obtenerTipoVenta(pedido) === "fisica";

    const numeroPedido =
      pedido.order_number || pedido.id;

    const confirmado = window.confirm(
      `¿Eliminar ${
        esFisica ? "la venta" : "el pedido"
      } #${numeroPedido}?\n\nEsta acción eliminará el pedido y sus productos registrados y no se puede deshacer.`
    );

    if (!confirmado) {
      return;
    }

    setEliminandoId(pedido.id);
    setError("");
    setMensaje("");

    try {
      /*
        Primero eliminamos los productos del pedido.
        Esto evita problemas con claves foráneas
        entre order_items y orders.
      */

      const {
        error: errorItems,
      } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", pedido.id);

      if (errorItems) {
        throw errorItems;
      }

      const {
        error: errorPedido,
      } = await supabase
        .from("orders")
        .delete()
        .eq("id", pedido.id);

      if (errorPedido) {
        throw errorPedido;
      }

      setPedidos((actuales) =>
        actuales.filter(
          (item) => item.id !== pedido.id
        )
      );

      setDetallePedido(null);

      setMensaje(
        `${esFisica ? "Venta" : "Pedido"} #${numeroPedido} eliminado correctamente.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No se pudo eliminar el pedido."
      );
    } finally {
      setEliminandoId(null);
    }
  }

  /* =======================================================
     FILTROS
  ======================================================= */

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const coincideEstado =
      filtroEstado === "todos" ||
      pedido.status === filtroEstado;

    const tipo = obtenerTipoVenta(pedido);

    const coincideTipo =
      filtroTipo === "todos" ||
      tipo === filtroTipo;

    return coincideEstado && coincideTipo;
  });

  /* =======================================================
     RESUMEN
  ======================================================= */

  const totalPedidos = pedidos.length;

  const pendientes = pedidos.filter(
    (pedido) =>
      pedido.status !== "Entregado" &&
      pedido.status !== "Cancelado"
  ).length;

  const entregados = pedidos.filter(
    (pedido) =>
      pedido.status === "Entregado"
  ).length;

  const cancelados = pedidos.filter(
    (pedido) =>
      pedido.status === "Cancelado"
  ).length;

  /* =======================================================
     CARGANDO
  ======================================================= */

  if (cargando) {
    return (
      <div className="flex w-full justify-center px-5 py-24 pb-32 text-center">
        <div>
          <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />

          <p className="text-sm text-neutral-500">
            Cargando pedidos y ventas...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <section className="w-full px-5 pb-24 sm:px-8 sm:pb-28 lg:px-10 lg:pb-32">

      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center">

        {/* =================================================
            ACCIÓN PRINCIPAL
        ================================================== */}

        <div className="flex w-full justify-center">

          <button
            type="button"
            onClick={() => {
              setError("");
              setMensaje("");
              setVentaAbierta(true);
            }}
            className={botonPrincipal}
          >
            + Registrar venta
          </button>

        </div>

        {/* =================================================
            MENSAJES
        ================================================== */}

        {(mensaje || error) && (
          <div className="mt-8 flex w-full flex-col items-center gap-3">

            {mensaje && (
              <div className="w-full max-w-3xl rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-center text-sm font-medium text-green-700">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="w-full max-w-3xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-700">
                {error}
              </div>
            )}

          </div>
        )}

        {/* =================================================
            RESUMEN
        ================================================== */}

        <div className="mt-12 grid w-full grid-cols-2 gap-4 md:grid-cols-4">

          <ResumenCard
            titulo="Total"
            valor={totalPedidos}
          />

          <ResumenCard
            titulo="Pendientes"
            valor={pendientes}
          />

          <ResumenCard
            titulo="Entregados"
            valor={entregados}
          />

          <ResumenCard
            titulo="Cancelados"
            valor={cancelados}
          />

        </div>

        {/* =================================================
            FILTROS
        ================================================== */}

        <div
          className={`${tarjeta} mt-10 p-6 sm:p-8`}
        >

          <div className="flex flex-col gap-8">

            {/* ESTADO */}

            <div>
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Estado
              </p>

              <div className="flex flex-wrap justify-center gap-2.5">

                {[
                  ["todos", "Todos"],
                  ["Pendiente", "Pendientes"],
                  ["Entregado", "Entregados"],
                  ["Cancelado", "Cancelados"],
                ].map(([valor, nombre]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() =>
                      setFiltroEstado(valor)
                    }
                    className={`min-h-[42px] rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      filtroEstado === valor
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                    }`}
                  >
                    {nombre}
                  </button>
                ))}

              </div>
            </div>

            <div className="h-px w-full bg-neutral-100" />

            {/* TIPO */}

            <div>
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Tipo de venta
              </p>

              <div className="flex flex-wrap justify-center gap-2.5">

                {[
                  ["todos", "Todas"],
                  ["online", "Online"],
                  ["fisica", "Tienda física"],
                ].map(([valor, nombre]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() =>
                      setFiltroTipo(valor)
                    }
                    className={`min-h-[42px] rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      filtroTipo === valor
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                    }`}
                  >
                    {nombre}
                  </button>
                ))}

              </div>
            </div>

          </div>
        </div>

        {/* =================================================
            RESULTADOS
        ================================================== */}

        <div className="mt-12 flex w-full flex-col">

          <div className="mb-6 flex flex-col items-center justify-center gap-2 text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Pedidos registrados
            </p>

            <p className="text-sm text-neutral-500">
              {pedidosFiltrados.length}{" "}
              {pedidosFiltrados.length === 1
                ? "resultado"
                : "resultados"}
            </p>

          </div>

          {pedidosFiltrados.length === 0 ? (
            <div
              className={`${tarjeta} px-6 py-16 text-center`}
            >
              <p className="text-sm font-semibold text-neutral-600">
                No hay pedidos o ventas con estos filtros.
              </p>

              <p className="mt-2 text-sm text-neutral-400">
                Prueba cambiando el estado o el tipo de venta.
              </p>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-6">

              {pedidosFiltrados.map((pedido) => {
                const esFisica =
                  obtenerTipoVenta(pedido) ===
                  "fisica";

                const cantidadProductos =
                  (
                    pedido.order_items || []
                  ).reduce(
                    (total, item) =>
                      total +
                      Number(
                        item.quantity || 0
                      ),
                    0
                  );

                const estaEliminando =
                  eliminandoId ===
                  pedido.id;

                return (
                  <article
                    key={pedido.id}
                    className={`${tarjeta} overflow-hidden`}
                  >

                    {/* ===================================
                        CABECERA
                    ==================================== */}

                    <div className="p-6 sm:p-8">

                      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">

                            <h2 className="text-base font-semibold text-neutral-900">
                              {esFisica
                                ? "Venta"
                                : "Pedido"}{" "}
                              #{pedido.order_number}
                            </h2>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${obtenerClaseEstado(
                                pedido.status
                              )}`}
                            >
                              {obtenerTextoEstado(
                                pedido.status
                              )}
                            </span>

                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-500">
                              {esFisica
                                ? "Tienda física"
                                : "Online"}
                            </span>

                          </div>

                          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">

                            <DatoPedido
                              titulo="Cliente"
                              valor={
                                pedido.customer_name ||
                                (esFisica
                                  ? "Venta en tienda"
                                  : "-")
                              }
                            />

                            <DatoPedido
                              titulo="Fecha"
                              valor={formatearFechaHora(
                                pedido.created_at
                              )}
                            />

                            <DatoPedido
                              titulo="Productos"
                              valor={`${cantidadProductos} ${
                                cantidadProductos ===
                                1
                                  ? "unidad"
                                  : "unidades"
                              }`}
                            />

                            {!esFisica && (
                              <>
                                <DatoPedido
                                  titulo="Dirección"
                                  valor={
                                    pedido.delivery_address ||
                                    "-"
                                  }
                                />

                                <DatoPedido
                                  titulo="Referencia"
                                  valor={
                                    pedido.delivery_reference ||
                                    "-"
                                  }
                                />
                              </>
                            )}

                          </div>

                        </div>

                        {/* =============================
                            TOTAL
                        ============================== */}

                        <div className="flex shrink-0 flex-col items-center lg:items-end">

                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                            Total
                          </p>

                          <p className="mt-1 text-2xl font-semibold text-neutral-900">
                            {formatearPrecio(
                              pedido.total
                            )}
                          </p>

                        </div>

                      </div>

                      {/* =================================
                          ACCIONES
                      ================================== */}

                      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 border-t border-neutral-100 pt-7 lg:justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            setDetallePedido(
                              pedido
                            )
                          }
                          className={botonSecundario}
                        >
                          Ver detalle
                        </button>

                        <select
                          value={
                            pedido.status ||
                            "Pendiente"
                          }
                          disabled={
                            guardando ||
                            pedido.status ===
                              "Cancelado" ||
                            estaEliminando
                          }
                          onChange={(event) =>
                            cambiarEstado(
                              pedido,
                              event.target.value
                            )
                          }
                          className="min-h-[46px] rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 outline-none transition focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Pendiente">
                            Pendiente
                          </option>

                          <option value="Entregado">
                            Entregado
                          </option>

                          <option value="Cancelado">
                            Cancelado
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            eliminarPedido(
                              pedido
                            )
                          }
                          disabled={
                            guardando ||
                            estaEliminando
                          }
                          className={botonPeligro}
                        >
                          {estaEliminando
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>

                      </div>

                    </div>

                    {/* ===================================
                        PRODUCTOS RESUMIDOS
                    ==================================== */}

                    {pedido.order_items?.length >
                      0 && (
                      <div className="border-t border-neutral-200 bg-neutral-50/60 px-6 py-7 sm:px-8">

                        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                          Productos
                        </p>

                        <div className="flex flex-col gap-2.5">

                          {pedido.order_items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5"
                              >

                                <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-800">
                                  {item.product_name ||
                                    "Producto"}
                                </span>

                                <span className="text-sm text-neutral-500">
                                  {item.size ||
                                    "-"}{" "}
                                  /{" "}
                                  {item.color ||
                                    "-"}
                                </span>

                                <span className="text-sm text-neutral-500">
                                  x{" "}
                                  {item.quantity}
                                </span>

                                <span className="text-sm font-semibold text-neutral-900">
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
                );
              })}

            </div>
          )}

        </div>

      </div>

      {/* =================================================
          MODAL REGISTRAR VENTA
      ================================================== */}

      {ventaAbierta && (
        <RegistrarVentaModal
          productos={productos}
          guardando={guardando}
          onCerrar={() =>
            setVentaAbierta(false)
          }
          onGuardado={async () => {
            setVentaAbierta(false);

            setMensaje(
              "Venta registrada correctamente."
            );

            await cargarDatos();
          }}
          onError={(mensajeError) =>
            setError(mensajeError)
          }
          setGuardando={setGuardando}
        />
      )}

      {/* =================================================
          MODAL DETALLE
      ================================================== */}

      {detallePedido && (
        <DetallePedidoModal
          pedido={detallePedido}
          onCerrar={() =>
            setDetallePedido(null)
          }
          onEliminar={() =>
            eliminarPedido(detallePedido)
          }
          eliminando={
            eliminandoId ===
            detallePedido.id
          }
        />
      )}

    </section>
  );
}

/* =========================================================
   COMPONENTE RESUMEN
========================================================= */

function ResumenCard({ titulo, valor }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-center shadow-[0_6px_22px_rgba(0,0,0,0.035)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-semibold text-neutral-900">
        {valor}
      </p>
    </div>
  );
}

/* =========================================================
   DATO DEL PEDIDO
========================================================= */

function DatoPedido({ titulo, valor }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
        {titulo}
      </p>

      <p className="mt-1 break-words text-sm text-neutral-800">
        {valor}
      </p>
    </div>
  );
}

/* =========================================================
   REGISTRAR VENTA FÍSICA
========================================================= */

function RegistrarVentaModal({
  productos,
  guardando,
  onCerrar,
  onGuardado,
  onError,
  setGuardando,
}) {
  const [cliente, setCliente] = useState("");
  const [descuento, setDescuento] = useState("");
  const [productoId, setProductoId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems] = useState([]);

  const productoSeleccionado =
    productos.find(
      (producto) =>
        producto.id === productoId
    );

  const variantes =
    productoSeleccionado?.product_variants ||
    [];

  const varianteSeleccionada =
    variantes.find(
      (variante) =>
        variante.id === variantId
    );

  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(item.subtotal || 0),
    0
  );

  const descuentoNumero = Math.max(
    0,
    Number(descuento || 0)
  );

  const total = Math.max(
    0,
    subtotal - descuentoNumero
  );

  function cambiarProducto(id) {
    setProductoId(id);
    setVariantId("");
    setCantidad(1);
    onError("");
  }

  function agregarProducto() {
    onError("");

    if (!productoSeleccionado) {
      onError("Selecciona un producto.");
      return;
    }

    if (!varianteSeleccionada) {
      onError(
        "Selecciona talla y color."
      );
      return;
    }

    const cantidadNumero = Number(cantidad);

    if (
      !Number.isInteger(
        cantidadNumero
      ) ||
      cantidadNumero <= 0
    ) {
      onError(
        "La cantidad debe ser mayor que cero."
      );
      return;
    }

    const stockDisponible = Number(
      varianteSeleccionada.stock || 0
    );

    const existente = items.find(
      (item) =>
        item.variant_id ===
        varianteSeleccionada.id
    );

    const cantidadFinal =
      (existente?.quantity || 0) +
      cantidadNumero;

    if (
      cantidadFinal >
      stockDisponible
    ) {
      onError(
        `Solo hay ${stockDisponible} unidad(es) disponibles.`
      );
      return;
    }

    const precio = Number(
      productoSeleccionado.price || 0
    );

    if (existente) {
      setItems((actuales) =>
        actuales.map((item) =>
          item.variant_id ===
          varianteSeleccionada.id
            ? {
                ...item,
                quantity:
                  cantidadFinal,
                subtotal:
                  cantidadFinal *
                  Number(
                    item.unit_price
                  ),
              }
            : item
        )
      );
    } else {
      setItems((actuales) => [
        ...actuales,
        {
          variant_id:
            varianteSeleccionada.id,
          product_id:
            productoSeleccionado.id,
          product_name:
            productoSeleccionado.name,
          size:
            varianteSeleccionada.size,
          color:
            varianteSeleccionada.color,
          color_hex:
            varianteSeleccionada.color_hex ||
            "",
          quantity:
            cantidadNumero,
          unit_price:
            precio,
          subtotal:
            precio *
            cantidadNumero,
          stock:
            stockDisponible,
        },
      ]);
    }

    setCantidad(1);
  }

  function quitarItem(id) {
    setItems((actuales) =>
      actuales.filter(
        (item) =>
          item.variant_id !== id
      )
    );
  }

  async function guardarVenta() {
    onError("");

    if (items.length === 0) {
      onError(
        "Agrega al menos un producto a la venta."
      );
      return;
    }

    if (descuentoNumero > subtotal) {
      onError(
        "El descuento no puede ser mayor que el subtotal."
      );
      return;
    }

    setGuardando(true);

    try {
      const { error } =
        await supabase.rpc(
          "registrar_venta_fisica",
          {
            p_customer_name:
              cliente.trim() ||
              null,

            p_discount:
              descuentoNumero,

            p_items:
              items.map((item) => ({
                product_id:
                  item.product_id,
                variant_id:
                  item.variant_id,
                product_name:
                  item.product_name,
                size:
                  item.size,
                color:
                  item.color,
                quantity:
                  item.quantity,
                unit_price:
                  item.unit_price,
              })),
          }
        );

      if (error) {
        throw error;
      }

      await onGuardado();
    } catch (err) {
      console.error(err);

      onError(
        err?.message ||
          "No se pudo registrar la venta."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">

      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_25px_90px_rgba(0,0,0,0.2)]">

        {/* CABECERA */}

        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5 sm:px-8">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Tienda física
            </p>

            <h2 className="mt-1 text-xl font-semibold text-neutral-900">
              Registrar venta
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-lg text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40"
            aria-label="Cerrar"
          >
            ×
          </button>

        </div>

        {/* CONTENIDO */}

        <div className="overflow-y-auto px-6 py-7 sm:px-8 sm:py-8">

          {/* CLIENTE Y DESCUENTO */}

          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label className={etiqueta}>
                Cliente
              </label>

              <input
                type="text"
                value={cliente}
                onChange={(event) =>
                  setCliente(
                    event.target.value
                  )
                }
                placeholder="Opcional"
                className={campo}
              />
            </div>

            <div>
              <label className={etiqueta}>
                Descuento
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={descuento}
                onChange={(event) =>
                  setDescuento(
                    event.target.value
                  )
                }
                placeholder="0.00"
                className={campo}
              />
            </div>

          </div>

          {/* AGREGAR PRODUCTO */}

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">

            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-neutral-900">
                Agregar producto
              </p>

              <p className="text-xs text-neutral-500">
                Selecciona el producto, su variante y la cantidad.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              <div>
                <label className={etiqueta}>
                  Producto
                </label>

                <select
                  value={productoId}
                  onChange={(event) =>
                    cambiarProducto(
                      event.target.value
                    )
                  }
                  className={campo}
                >
                  <option value="">
                    Selecciona un producto
                  </option>

                  {productos.map(
                    (producto) => (
                      <option
                        key={
                          producto.id
                        }
                        value={
                          producto.id
                        }
                      >
                        {producto.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={etiqueta}>
                  Talla / color
                </label>

                <select
                  value={variantId}
                  onChange={(event) =>
                    setVariantId(
                      event.target.value
                    )
                  }
                  disabled={
                    !productoSeleccionado
                  }
                  className={campo}
                >
                  <option value="">
                    Selecciona una variante
                  </option>

                  {variantes.map(
                    (variante) => (
                      <option
                        key={
                          variante.id
                        }
                        value={
                          variante.id
                        }
                        disabled={
                          Number(
                            variante.stock ||
                              0
                          ) <= 0
                        }
                      >
                        {variante.size} /{" "}
                        {variante.color} · Stock:{" "}
                        {variante.stock}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={etiqueta}>
                  Cantidad
                </label>

                <input
                  type="number"
                  min="1"
                  max={
                    varianteSeleccionada?.stock ||
                    undefined
                  }
                  value={cantidad}
                  onChange={(event) =>
                    setCantidad(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  className={campo}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={
                    agregarProducto
                  }
                  disabled={
                    !productoSeleccionado ||
                    !varianteSeleccionada
                  }
                  className={`${botonPrincipal} w-full`}
                >
                  + Agregar producto
                </button>
              </div>

            </div>

            {varianteSeleccionada && (
              <div className="mt-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-500">
                Stock disponible:{" "}
                <strong className="text-neutral-900">
                  {
                    varianteSeleccionada.stock
                  }
                </strong>{" "}
                · Precio:{" "}
                <strong className="text-neutral-900">
                  {formatearPrecio(
                    productoSeleccionado?.price
                  )}
                </strong>
              </div>
            )}

          </div>

          {/* PRODUCTOS */}

          <div className="mt-8">

            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Productos de la venta
            </p>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 px-6 py-9 text-center">
                <p className="text-sm text-neutral-500">
                  Todavía no agregaste productos.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">

                {items.map((item) => (
                  <div
                    key={
                      item.variant_id
                    }
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4"
                  >

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {
                          item.product_name
                        }
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {item.size} /{" "}
                        {item.color}
                      </p>
                    </div>

                    <span className="text-xs text-neutral-500">
                      x{" "}
                      {item.quantity}
                    </span>

                    <span className="text-sm font-semibold text-neutral-900">
                      {formatearPrecio(
                        item.subtotal
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        quitarItem(
                          item.variant_id
                        )
                      }
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Quitar
                    </button>

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* RESUMEN */}

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">

            <div className="space-y-4">

              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-neutral-500">
                  Subtotal
                </span>

                <span className="font-semibold text-neutral-900">
                  {formatearPrecio(
                    subtotal
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-neutral-500">
                  Descuento
                </span>

                <span className="font-semibold text-neutral-900">
                  -{" "}
                  {formatearPrecio(
                    descuentoNumero
                  )}
                </span>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between gap-5">

                  <span className="text-base font-semibold text-neutral-900">
                    Total
                  </span>

                  <span className="text-2xl font-semibold text-neutral-900">
                    {formatearPrecio(
                      total
                    )}
                  </span>

                </div>
              </div>

            </div>

          </div>

        </div>

        {/* BOTONES */}

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className={botonSecundario}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={
              guardarVenta
            }
            disabled={
              guardando ||
              items.length === 0
            }
            className={botonPrincipal}
          >
            {guardando
              ? "Guardando..."
              : "Registrar venta"}
          </button>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   DETALLE DEL PEDIDO / VENTA
========================================================= */

function DetallePedidoModal({
  pedido,
  onCerrar,
  onEliminar,
  eliminando,
}) {
  const esFisica =
    obtenerTipoVenta(pedido) ===
    "fisica";

  const items =
    pedido?.order_items || [];

  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(item.subtotal || 0),
    0
  );

  const descuento = Number(
    pedido?.discount || 0
  );

  const total = Number(
    pedido?.total || 0
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">

      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_25px_90px_rgba(0,0,0,0.2)]">

        {/* CABECERA */}

        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5 sm:px-8">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {esFisica
                ? "Venta física"
                : "Pedido online"}
            </p>

            <h2 className="mt-1 text-xl font-semibold text-neutral-900">
              {esFisica
                ? "Venta"
                : "Pedido"}{" "}
              #{pedido?.order_number || "-"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={eliminando}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-lg text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40"
            aria-label="Cerrar"
          >
            ×
          </button>

        </div>

        {/* CONTENIDO */}

        <div className="overflow-y-auto px-6 py-7 sm:px-8 sm:py-8">

          {/* INFORMACIÓN */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Cliente
              </p>

              <p className="mt-2 text-sm font-semibold text-neutral-900">
                {pedido?.customer_name ||
                  (esFisica
                    ? "Venta en tienda"
                    : "-")}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Fecha
              </p>

              <p className="mt-2 text-sm font-semibold text-neutral-900">
                {formatearFechaHora(
                  pedido?.created_at
                )}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Tipo de venta
              </p>

              <p className="mt-2 text-sm font-semibold text-neutral-900">
                {esFisica
                  ? "Tienda física"
                  : "Online"}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Estado
              </p>

              <p
                className={`mt-2 text-sm font-semibold ${
                  pedido?.status ===
                  "Entregado"
                    ? "text-green-700"
                    : pedido?.status ===
                      "Cancelado"
                    ? "text-red-600"
                    : "text-neutral-800"
                }`}
              >
                {obtenerTextoEstado(
                  pedido?.status
                )}
              </p>
            </div>

          </div>

          {/* ENTREGA */}

          {!esFisica && (
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Información de entrega
              </p>

              <div className="mt-5 space-y-4 text-sm">

                <div>
                  <p className="font-semibold text-neutral-500">
                    Dirección
                  </p>

                  <p className="mt-1 text-neutral-900">
                    {pedido?.delivery_address ||
                      "-"}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-neutral-500">
                    Referencia
                  </p>

                  <p className="mt-1 text-neutral-900">
                    {pedido?.delivery_reference ||
                      "-"}
                  </p>
                </div>

                {pedido?.delivery_zone && (
                  <div>
                    <p className="font-semibold text-neutral-500">
                      Zona
                    </p>

                    <p className="mt-1 text-neutral-900">
                      {
                        pedido.delivery_zone
                      }
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* PRODUCTOS */}

          <div className="mt-8">

            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Productos
            </p>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center">
                <p className="text-sm text-neutral-500">
                  No hay productos registrados.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-neutral-900">
                          {item.product_name ||
                            "Producto"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">

                          <span className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
                            Talla:{" "}
                            {item.size ||
                              "-"}
                          </span>

                          <span className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
                            Color:{" "}
                            {item.color ||
                              "-"}
                          </span>

                          <span className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
                            Cantidad:{" "}
                            {item.quantity ||
                              0}
                          </span>

                        </div>

                      </div>

                      <div className="shrink-0 text-left sm:text-right">

                        <p className="text-xs text-neutral-400">
                          Precio unitario
                        </p>

                        <p className="mt-1 text-sm font-semibold text-neutral-800">
                          {formatearPrecio(
                            item.unit_price
                          )}
                        </p>

                        <p className="mt-2 text-xs text-neutral-400">
                          Subtotal
                        </p>

                        <p className="mt-1 text-base font-semibold text-neutral-900">
                          {formatearPrecio(
                            item.subtotal
                          )}
                        </p>

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* RESUMEN */}

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
              Resumen
            </p>

            <div className="mt-5 space-y-4">

              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-neutral-500">
                  Subtotal
                </span>

                <span className="font-semibold text-neutral-900">
                  {formatearPrecio(
                    subtotal
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-neutral-500">
                  Descuento
                </span>

                <span className="font-semibold text-neutral-900">
                  -{" "}
                  {formatearPrecio(
                    descuento
                  )}
                </span>
              </div>

              <div className="border-t border-neutral-200 pt-5">

                <div className="flex items-center justify-between gap-5">

                  <span className="text-base font-semibold text-neutral-900">
                    Total
                  </span>

                  <span className="text-2xl font-semibold text-neutral-900">
                    {formatearPrecio(
                      total
                    )}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* OBSERVACIONES */}

          {pedido?.notes && (
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Observaciones
              </p>

              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {pedido.notes}
              </p>

            </div>
          )}

        </div>

        {/* BOTONES */}

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 px-6 py-5 sm:flex-row sm:justify-between sm:px-8">

          <button
            type="button"
            onClick={onEliminar}
            disabled={eliminando}
            className={botonPeligro}
          >
            {eliminando
              ? "Eliminando..."
              : "Eliminar"}
          </button>

          <button
            type="button"
            onClick={onCerrar}
            disabled={eliminando}
            className={botonSecundario}
          >
            Cerrar
          </button>

        </div>

      </div>
    </div>
  );
}