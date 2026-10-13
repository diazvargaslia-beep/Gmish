import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductsAdmin from "./ProductsAdmin";

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
  return pedido?.sale_type === "fisica"
    ? "fisica"
    : "online";
}

/* =========================================================
   ESTILOS
========================================================= */

const tarjeta =
  "w-full rounded-2xl border border-[#29233a] bg-[#17151f] shadow-[0_12px_40px_rgba(0,0,0,0.25)]";

const botonPrincipal =
  "rounded-xl border border-[#332b46] bg-[#1b1824] px-[1.3125rem] py-[0.7875rem] text-sm font-semibold text-[#e8e3f0] transition hover:border-[#8b5cf6] hover:bg-[#211c2d] disabled:cursor-not-allowed disabled:opacity-40";

const botonMorado =
  "rounded-xl bg-[#7c3aed] px-[1.3125rem] py-[0.7875rem] text-sm font-bold text-white transition hover:bg-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-40";

const campo =
  "w-full rounded-xl border border-[#342c45] bg-[#121019] px-4 py-3 text-sm text-[#f4f0f8] outline-none transition placeholder:text-[#777080] focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20";

const etiqueta =
  "mb-2 block text-sm font-semibold text-[#d9d3e2]";

/* =========================================================
   SECCIONES
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
   INICIO
========================================================= */

function InicioAdmin({ rol, onSeleccionar }) {
  /*
    IMPORTANTE:
    Inicio NO se muestra dentro de Inicio.
    Porque estamos en Inicio. La humanidad puede descansar.
  */

  const disponibles = secciones.filter(
    (seccion) =>
      seccion.id !== "inicio" &&
      seccion.acceso.includes(rol)
  );

  return (
    <section className="flex w-full justify-center">
      <div className="w-full max-w-6xl">

        <div className="mx-auto max-w-4xl text-center">

          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            GMISH
          </span>

          <h1 className="mt-7 text-3xl font-black text-white">
            Panel de administración
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#91889d]">
            Gestiona productos, pedidos, ventas y la
            información de tu tienda desde un solo lugar.
          </p>

        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {disponibles.map((seccion) => (
            <button
              key={seccion.id}
              type="button"
              onClick={() =>
                onSeleccionar(seccion.id)
              }
              className={`${tarjeta} group flex min-h-[190px] flex-col items-center justify-center p-8 text-center transition duration-200 hover:-translate-y-1 hover:border-[#7c3aed]`}
            >

              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#211a2e] text-2xl text-[#b993ff] transition group-hover:bg-[#7c3aed] group-hover:text-white">
                {seccion.icono}
              </span>

              <h2 className="mt-6 text-base font-black text-white">
                {seccion.nombre}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#81798e]">
                Administrar{" "}
                {seccion.nombre.toLowerCase()}.
              </p>

            </button>
          ))}

        </div>

      </div>
    </section>
  );
}

/* =========================================================
   PEDIDOS Y VENTAS
========================================================= */

function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [filtroEstado, setFiltroEstado] =
    useState("todos");

  const [filtroTipo, setFiltroTipo] =
    useState("todos");

  const [ventaAbierta, setVentaAbierta] =
    useState(false);

  const [detallePedido, setDetallePedido] =
    useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

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
      setError(
        "No se pudieron cargar los pedidos."
      );
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

  async function cambiarEstado(
    pedido,
    nuevoEstado
  ) {
    const estadosPermitidos = [
      "Pendiente",
      "Entregado",
      "Cancelado",
    ];

    if (
      !estadosPermitidos.includes(
        nuevoEstado
      )
    ) {
      return;
    }

    if (
      pedido.status === nuevoEstado
    ) {
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      /*
        Las ventas físicas ya descuentan stock
        al registrarse.

        Si se cancelan, devolvemos stock y
        sold_count.
      */

      if (
        nuevoEstado === "Cancelado" &&
        pedido.status !== "Cancelado" &&
        obtenerTipoVenta(pedido) ===
          "fisica"
      ) {
        for (
          const item of
          pedido.order_items || []
        ) {
          if (!item.variant_id) {
            continue;
          }

          const cantidad = Number(
            item.quantity || 0
          );

          if (cantidad <= 0) {
            continue;
          }

          const {
            data: variante,
            error: errorVariante,
          } = await supabase
            .from("product_variants")
            .select(
              "id, product_id, stock"
            )
            .eq(
              "id",
              item.variant_id
            )
            .single();

          if (errorVariante) {
            throw errorVariante;
          }

          const nuevoStock =
            Number(
              variante.stock || 0
            ) + cantidad;

          const {
            error: errorStock,
          } = await supabase
            .from("product_variants")
            .update({
              stock: nuevoStock,
            })
            .eq(
              "id",
              item.variant_id
            );

          if (errorStock) {
            throw errorStock;
          }

          if (item.product_id) {
            const {
              data: producto,
              error: errorProducto,
            } = await supabase
              .from("products")
              .select(
                "id, sold_count"
              )
              .eq(
                "id",
                item.product_id
              )
              .single();

            if (errorProducto) {
              throw errorProducto;
            }

            const nuevoSoldCount =
              Math.max(
                0,
                Number(
                  producto.sold_count ||
                    0
                ) - cantidad
              );

            const {
              error: errorSoldCount,
            } = await supabase
              .from("products")
              .update({
                sold_count:
                  nuevoSoldCount,
                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                "id",
                item.product_id
              );

            if (errorSoldCount) {
              throw errorSoldCount;
            }
          }
        }
      }

      const fecha =
        new Date().toISOString();

      const {
        error: errorActualizar,
      } = await supabase
        .from("orders")
        .update({
          status: nuevoEstado,
          updated_at: fecha,
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

  const pedidosFiltrados =
    pedidos.filter((pedido) => {
      const coincideEstado =
        filtroEstado === "todos" ||
        pedido.status ===
          filtroEstado;

      const tipo =
        obtenerTipoVenta(pedido);

      const coincideTipo =
        filtroTipo === "todos" ||
        tipo === filtroTipo;

      return (
        coincideEstado &&
        coincideTipo
      );
    });

  if (cargando) {
    return (
      <div className="flex w-full justify-center py-28 text-center">
        <p className="text-sm text-[#81798e]">
          Cargando pedidos y ventas...
        </p>
      </div>
    );
  }

  return (
    <section className="flex w-full justify-center">
      <div className="flex w-full max-w-6xl flex-col items-center">

        <div className="mx-auto w-full max-w-4xl text-center">

          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            Ventas
          </span>

          <h1 className="mt-8 text-3xl font-black text-white">
            Pedidos y ventas
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#91889d]">
            Administra pedidos online y ventas
            realizadas en la tienda física.
          </p>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setError("");
                setMensaje("");
                setVentaAbierta(true);
              }}
              className={botonMorado}
            >
              + Registrar venta
            </button>
          </div>

        </div>

        {mensaje && (
          <div className="mx-auto mt-10 w-full max-w-3xl rounded-xl border border-green-900/50 bg-green-950/30 p-4 text-center text-sm text-green-300">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-8 w-full max-w-3xl rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-16 w-full space-y-10">

          <div className="text-center">

            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Estado
            </p>

            <div className="flex flex-wrap justify-center gap-[0.7875rem]">

              {[
                ["todos", "Todos"],
                [
                  "Pendiente",
                  "Pendientes",
                ],
                [
                  "Entregado",
                  "Entregados",
                ],
                [
                  "Cancelado",
                  "Cancelados",
                ],
              ].map(
                ([valor, nombre]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() =>
                      setFiltroEstado(
                        valor
                      )
                    }
                    className={`rounded-full px-[1.3125rem] py-[0.65625rem] text-xs font-bold transition ${
                      filtroEstado ===
                      valor
                        ? "bg-[#7c3aed] text-white"
                        : "border border-[#342c45] bg-[#17151f] text-[#91889d] hover:border-[#7c3aed] hover:text-[#b993ff]"
                    }`}
                  >
                    {nombre}
                  </button>
                )
              )}

            </div>
          </div>

          <div className="text-center">

            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Tipo de venta
            </p>

            <div className="flex flex-wrap justify-center gap-[0.7875rem]">

              {[
                ["todos", "Todas"],
                ["online", "🌐 Online"],
                [
                  "fisica",
                  "🏪 Tienda física",
                ],
              ].map(
                ([valor, nombre]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() =>
                      setFiltroTipo(
                        valor
                      )
                    }
                    className={`rounded-full px-[1.3125rem] py-[0.65625rem] text-xs font-bold transition ${
                      filtroTipo ===
                      valor
                        ? "bg-[#7c3aed] text-white"
                        : "border border-[#342c45] bg-[#17151f] text-[#91889d] hover:border-[#7c3aed] hover:text-[#b993ff]"
                    }`}
                  >
                    {nombre}
                  </button>
                )
              )}

            </div>
          </div>

        </div>

        <div className="mt-16 w-full space-y-10">

          {pedidosFiltrados.length ===
          0 ? (
            <div
              className={`${tarjeta} p-16 text-center`}
            >
              <p className="text-sm font-semibold text-[#aaa1b3]">
                No hay ventas o pedidos
                en esta categoría.
              </p>
            </div>
          ) : (
            pedidosFiltrados.map(
              (pedido) => {
                const esFisica =
                  obtenerTipoVenta(
                    pedido
                  ) === "fisica";

                const cantidadProductos =
                  (
                    pedido.order_items ||
                    []
                  ).reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      Number(
                        item.quantity ||
                          0
                      ),
                    0
                  );

                return (
                  <article
                    key={pedido.id}
                    className={`${tarjeta} p-8 sm:p-10`}
                  >

                    <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">

                      <div className="min-w-0 text-center lg:text-left">

                        <div className="flex flex-wrap items-center justify-center gap-[0.7875rem] lg:justify-start">

                          <h2 className="text-base font-black text-white">
                            {esFisica
                              ? "Venta"
                              : "Pedido"}{" "}
                            #
                            {
                              pedido.order_number
                            }
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              pedido.status ===
                              "Entregado"
                                ? "bg-green-950/40 text-green-300"
                                : pedido.status ===
                                  "Cancelado"
                                ? "bg-red-950/40 text-red-300"
                                : "bg-[#291d3b] text-[#b993ff]"
                            }`}
                          >
                            {pedido.status ===
                            "Entregado"
                              ? "Entregado"
                              : pedido.status ===
                                "Cancelado"
                              ? "Cancelado"
                              : "Pendiente"}
                          </span>

                          <span className="rounded-full border border-[#342c45] bg-[#121019] px-3 py-1 text-xs font-bold text-[#aaa1b3]">
                            {esFisica
                              ? "🏪 Tienda física"
                              : "🌐 Online"}
                          </span>

                        </div>

                        <div className="mt-7 space-y-4 text-sm text-[#91889d]">

                          <p>
                            <strong className="text-[#cfc7d8]">
                              Cliente:
                            </strong>{" "}
                            {pedido.customer_name ||
                              (esFisica
                                ? "Venta en tienda"
                                : "-")}
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
                              Productos:
                            </strong>{" "}
                            {cantidadProductos}
                          </p>

                          {!esFisica && (
                            <>
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
                            </>
                          )}

                        </div>
                      </div>

                      <div className="shrink-0 text-center lg:text-right">

                        <p className="text-xs font-semibold uppercase tracking-widest text-[#71687e]">
                          Total
                        </p>

                        <p className="mt-2 text-2xl font-black text-[#a978ff]">
                          {formatearPrecio(
                            pedido.total
                          )}
                        </p>

                        <div className="mt-6 flex flex-wrap justify-center gap-[0.7875rem] lg:justify-end">

                          <button
                            type="button"
                            onClick={() =>
                              setDetallePedido(
                                pedido
                              )
                            }
                            className={
                              botonPrincipal
                            }
                          >
                            VER DETALLE
                          </button>

                          <select
                            value={
                              pedido.status ||
                              "Pendiente"
                            }
                            disabled={
                              guardando ||
                              pedido.status ===
                                "Cancelado"
                            }
                            onChange={(
                              event
                            ) =>
                              cambiarEstado(
                                pedido,
                                event.target
                                  .value
                              )
                            }
                            className="rounded-xl border border-[#342c45] bg-[#121019] px-4 py-[0.65625rem] text-xs font-semibold text-[#ddd5e7] outline-none focus:border-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-50"
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

                        </div>
                      </div>

                    </div>

                    {pedido.order_items
                      ?.length > 0 && (
                      <div className="mt-10 border-t border-[#29233a] pt-8">

                        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-[#71687e]">
                          Productos
                        </p>

                        <div className="space-y-[0.7875rem]">

                          {pedido.order_items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-[0.7875rem] rounded-xl bg-[#121019] px-5 py-4"
                              >
                                <span className="font-semibold text-[#cfc7d8]">
                                  {item.product_name ||
                                    "Producto"}
                                </span>

                                <span className="text-[#81798e]">
                                  {item.size ||
                                    "-"}{" "}
                                  /{" "}
                                  {item.color ||
                                    "-"}
                                </span>

                                <span className="text-[#81798e]">
                                  x
                                  {
                                    item.quantity
                                  }
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
                );
              }
            )
          )}

        </div>
      </div>

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

      {detallePedido && (
        <DetallePedidoModal
          pedido={detallePedido}
          onCerrar={() =>
            setDetallePedido(null)
          }
        />
      )}

    </section>
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
  const [cliente, setCliente] =
    useState("");

  const [descuento, setDescuento] =
    useState("");

  const [productoId, setProductoId] =
    useState("");

  const [variantId, setVariantId] =
    useState("");

  const [cantidad, setCantidad] =
    useState(1);

  const [items, setItems] =
    useState([]);

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

  const descuentoNumero =
    Math.max(
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
      onError(
        "Selecciona un producto."
      );
      return;
    }

    if (!varianteSeleccionada) {
      onError(
        "Selecciona talla y color."
      );
      return;
    }

    const cantidadNumero =
      Number(cantidad);

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

    const stockDisponible =
      Number(
        varianteSeleccionada.stock ||
          0
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

    const precio =
      Number(
        productoSeleccionado.price ||
          0
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

    if (
      descuentoNumero >
      subtotal
    ) {
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
              items.map(
                (item) => ({
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
                })
              ),
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#342c45] bg-[#17151f] shadow-[0_25px_90px_rgba(0,0,0,0.6)]">

        <div className="flex items-center justify-between border-b border-[#29233a] px-6 py-5 sm:px-8">

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Tienda física
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Registrar venta
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#342c45] text-lg text-[#aaa1b3] transition hover:border-[#7c3aed] hover:text-white"
          >
            ×
          </button>

        </div>

        <div className="overflow-y-auto px-6 py-8 sm:px-8">

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

          <div className="mt-9 rounded-2xl border border-[#29233a] bg-[#121019] p-5 sm:p-6">

            <p className="text-sm font-black text-white">
              Agregar producto
            </p>

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
                        key={producto.id}
                        value={producto.id}
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
                        key={variante.id}
                        value={variante.id}
                        disabled={
                          Number(
                            variante.stock ||
                              0
                          ) <= 0
                        }
                      >
                        {variante.size} /{" "}
                        {variante.color} ·
                        Stock:{" "}
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
                        event.target.value
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
              <div className="mt-5 rounded-xl border border-[#342c45] bg-[#17151f] px-4 py-3 text-xs text-[#91889d]">
                Stock disponible:{" "}
                <strong className="text-[#b993ff]">
                  {
                    varianteSeleccionada.stock
                  }
                </strong>{" "}
                · Precio:{" "}
                <strong className="text-[#ddd5e7]">
                  {formatearPrecio(
                    productoSeleccionado?.price
                  )}
                </strong>
              </div>
            )}

          </div>

          <div className="mt-9">

            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Productos de la venta
            </p>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#342c45] p-9 text-center">
                <p className="text-sm text-[#81798e]">
                  Todavía no agregaste
                  productos.
                </p>
              </div>
            ) : (
              <div className="space-y-[0.7875rem]">

                {items.map(
                  (item) => (
                    <div
                      key={
                        item.variant_id
                      }
                      className="flex flex-wrap items-center justify-between gap-[0.7875rem] rounded-xl border border-[#29233a] bg-[#121019] px-5 py-4"
                    >

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-[#ddd5e7]">
                          {
                            item.product_name
                          }
                        </p>

                        <p className="mt-1 text-xs text-[#81798e]">
                          {item.size} /{" "}
                          {item.color}
                        </p>

                      </div>

                      <span className="text-xs text-[#91889d]">
                        x
                        {
                          item.quantity
                        }
                      </span>

                      <span className="text-sm font-black text-[#b993ff]">
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
                        className="rounded-lg px-[1.05rem] py-[0.525rem] text-xs font-bold text-red-400 transition hover:bg-red-950/20 hover:text-red-300"
                      >
                        Quitar
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          <div className="mt-9 rounded-2xl border border-[#29233a] bg-[#121019] p-6">

            <div className="space-y-4">

              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-[#91889d]">
                  Subtotal
                </span>

                <span className="font-bold text-[#ddd5e7]">
                  {formatearPrecio(
                    subtotal
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-[#91889d]">
                  Descuento
                </span>

                <span className="font-bold text-[#ddd5e7]">
                  -{" "}
                  {formatearPrecio(
                    descuentoNumero
                  )}
                </span>
              </div>

              <div className="border-t border-[#29233a] pt-4">

                <div className="flex items-center justify-between gap-5">

                  <span className="text-base font-black text-white">
                    Total
                  </span>

                  <span className="text-2xl font-black text-[#a978ff]">
                    {formatearPrecio(
                      total
                    )}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        <div className="flex flex-col-reverse gap-[0.7875rem] border-t border-[#29233a] px-6 py-5 sm:flex-row sm:justify-end sm:px-8">

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className={botonPrincipal}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={guardarVenta}
            disabled={
              guardando ||
              items.length === 0
            }
            className={botonMorado}
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#342c45] bg-[#17151f] shadow-[0_25px_90px_rgba(0,0,0,0.6)]">

        <div className="flex items-center justify-between border-b border-[#29233a] px-6 py-5 sm:px-8">

          <div>

            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              {esFisica
                ? "Venta física"
                : "Pedido online"}
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              {esFisica
                ? "Venta"
                : "Pedido"}{" "}
              #
              {pedido?.order_number ||
                "-"}
            </h2>

          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#342c45] text-lg text-[#aaa1b3] transition hover:border-[#7c3aed] hover:text-white"
          >
            ×
          </button>

        </div>

        <div className="overflow-y-auto px-6 py-8 sm:px-8">

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl border border-[#29233a] bg-[#121019] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Cliente
              </p>

              <p className="mt-2 text-sm font-bold text-[#ddd5e7]">
                {pedido?.customer_name ||
                  (esFisica
                    ? "Venta en tienda"
                    : "-")}
              </p>
            </div>

            <div className="rounded-xl border border-[#29233a] bg-[#121019] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Fecha
              </p>

              <p className="mt-2 text-sm font-bold text-[#ddd5e7]">
                {formatearFechaHora(
                  pedido?.created_at
                )}
              </p>
            </div>

            <div className="rounded-xl border border-[#29233a] bg-[#121019] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Tipo de venta
              </p>

              <p className="mt-2 text-sm font-bold text-[#ddd5e7]">
                {esFisica
                  ? "🏪 Tienda física"
                  : "🌐 Online"}
              </p>
            </div>

            <div className="rounded-xl border border-[#29233a] bg-[#121019] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Estado
              </p>

              <p
                className={`mt-2 text-sm font-bold ${
                  pedido?.status ===
                  "Entregado"
                    ? "text-green-400"
                    : pedido?.status ===
                      "Cancelado"
                    ? "text-red-400"
                    : "text-[#b993ff]"
                }`}
              >
                {pedido?.status ||
                  "Pendiente"}
              </p>
            </div>

          </div>

          {!esFisica && (
            <div className="mt-8 rounded-2xl border border-[#29233a] bg-[#121019] p-6">

              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Información de entrega
              </p>

              <div className="mt-5 space-y-4 text-sm">

                <div>
                  <p className="font-semibold text-[#71687e]">
                    Dirección
                  </p>

                  <p className="mt-1 text-[#ddd5e7]">
                    {pedido?.delivery_address ||
                      "-"}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-[#71687e]">
                    Referencia
                  </p>

                  <p className="mt-1 text-[#ddd5e7]">
                    {pedido?.delivery_reference ||
                      "-"}
                  </p>
                </div>

                {pedido?.delivery_zone && (
                  <div>
                    <p className="font-semibold text-[#71687e]">
                      Zona
                    </p>

                    <p className="mt-1 text-[#ddd5e7]">
                      {pedido.delivery_zone}
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          <div className="mt-8">

            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Productos
            </p>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#342c45] p-8 text-center">
                <p className="text-sm text-[#81798e]">
                  No hay productos
                  registrados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">

                {items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#29233a] bg-[#121019] p-5"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="min-w-0">

                          <p className="text-sm font-bold text-[#ddd5e7]">
                            {item.product_name ||
                              "Producto"}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">

                            <span className="rounded-lg bg-[#211a2e] px-3 py-1 text-xs font-semibold text-[#b993ff]">
                              Talla:{" "}
                              {item.size ||
                                "-"}
                            </span>

                            <span className="rounded-lg bg-[#211a2e] px-3 py-1 text-xs font-semibold text-[#b993ff]">
                              Color:{" "}
                              {item.color ||
                                "-"}
                            </span>

                            <span className="rounded-lg bg-[#211a2e] px-3 py-1 text-xs font-semibold text-[#aaa1b3]">
                              Cantidad:{" "}
                              {item.quantity ||
                                0}
                            </span>

                          </div>

                        </div>

                        <div className="shrink-0 text-left sm:text-right">

                          <p className="text-xs text-[#71687e]">
                            Precio unitario
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#ddd5e7]">
                            {formatearPrecio(
                              item.unit_price
                            )}
                          </p>

                          <p className="mt-2 text-xs text-[#71687e]">
                            Subtotal
                          </p>

                          <p className="mt-1 text-base font-black text-[#b993ff]">
                            {formatearPrecio(
                              item.subtotal
                            )}
                          </p>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          <div className="mt-8 rounded-2xl border border-[#29233a] bg-[#121019] p-6">

            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Resumen
            </p>

            <div className="mt-5 space-y-4">

              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-[#91889d]">
                  Subtotal
                </span>

                <span className="font-bold text-[#ddd5e7]">
                  {formatearPrecio(
                    subtotal
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-[#91889d]">
                  Descuento
                </span>

                <span className="font-bold text-[#ddd5e7]">
                  -{" "}
                  {formatearPrecio(
                    descuento
                  )}
                </span>
              </div>

              <div className="border-t border-[#29233a] pt-5">

                <div className="flex items-center justify-between gap-5">

                  <span className="text-base font-black text-white">
                    Total
                  </span>

                  <span className="text-2xl font-black text-[#a978ff]">
                    {formatearPrecio(
                      total
                    )}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {pedido?.notes && (
            <div className="mt-8 rounded-2xl border border-[#29233a] bg-[#121019] p-6">

              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Observaciones
              </p>

              <p className="mt-3 text-sm leading-6 text-[#aaa1b3]">
                {pedido.notes}
              </p>

            </div>
          )}

        </div>

        <div className="flex justify-end border-t border-[#29233a] px-6 py-5 sm:px-8">

          <button
            type="button"
            onClick={onCerrar}
            className={botonPrincipal}
          >
            Cerrar
          </button>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   ESTADÍSTICAS
========================================================= */

function EstadisticasAdmin() {
  const [pedidos, setPedidos] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  async function cargarEstadisticas() {
    setCargando(true);
    setError("");

    const {
      data,
      error: errorConsulta,
    } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total,
        status,
        sale_type,
        created_at,
        order_items (
          quantity,
          product_id,
          product_name,
          subtotal
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (errorConsulta) {
      console.error(
        errorConsulta
      );

      setError(
        "No se pudieron cargar las estadísticas."
      );
    }

    setPedidos(data || []);
    setCargando(false);
  }

  const pedidosEntregados =
    pedidos.filter(
      (pedido) =>
        pedido.status ===
        "Entregado"
    );

  const ventasOnline =
    pedidosEntregados.filter(
      (pedido) =>
        obtenerTipoVenta(
          pedido
        ) === "online"
    );

  const ventasFisicas =
    pedidosEntregados.filter(
      (pedido) =>
        obtenerTipoVenta(
          pedido
        ) === "fisica"
    );

  const totalVendido =
    pedidosEntregados.reduce(
      (total, pedido) =>
        total +
        Number(
          pedido.total || 0
        ),
      0
    );

  const cantidadPedidos =
    pedidosEntregados.length;

  const cantidadProductos =
    pedidosEntregados.reduce(
      (total, pedido) =>
        total +
        (
          pedido.order_items ||
          []
        ).reduce(
          (
            subtotal,
            item
          ) =>
            subtotal +
            Number(
              item.quantity ||
                0
            ),
          0
        ),
      0
    );

  const totalOnline =
    ventasOnline.reduce(
      (total, pedido) =>
        total +
        Number(
          pedido.total || 0
        ),
      0
    );

  const totalFisico =
    ventasFisicas.reduce(
      (total, pedido) =>
        total +
        Number(
          pedido.total || 0
        ),
      0
    );

  const productosVendidos = {};

  pedidosEntregados.forEach(
    (pedido) => {
      (
        pedido.order_items ||
        []
      ).forEach((item) => {
        const nombre =
          item.product_name ||
          "Producto";

        if (
          !productosVendidos[
            nombre
          ]
        ) {
          productosVendidos[
            nombre
          ] = {
            nombre,
            cantidad: 0,
            total: 0,
          };
        }

        productosVendidos[
          nombre
        ].cantidad +=
          Number(
            item.quantity || 0
          );

        productosVendidos[
          nombre
        ].total +=
          Number(
            item.subtotal || 0
          );
      });
    }
  );

  const rankingProductos =
    Object.values(
      productosVendidos
    ).sort(
      (a, b) =>
        b.cantidad -
        a.cantidad
    );

  if (cargando) {
    return (
      <div className="flex w-full justify-center py-28 text-center">
        <p className="text-sm text-[#81798e]">
          Cargando estadísticas...
        </p>
      </div>
    );
  }

  return (
    <section className="flex w-full justify-center">
      <div className="w-full max-w-6xl">

        <div className="mx-auto max-w-4xl text-center">

          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            Resumen
          </span>

          <h1 className="mt-8 text-3xl font-black text-white">
            Estadísticas
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#91889d]">
            Ventas reales de GMISH.
            Las ventas canceladas no
            se incluyen.
          </p>

        </div>

        {error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className={`${tarjeta} p-7`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Total vendido
            </p>

            <p className="mt-4 text-3xl font-black text-[#b993ff]">
              {formatearPrecio(
                totalVendido
              )}
            </p>
          </div>

          <div className={`${tarjeta} p-7`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Ventas entregadas
            </p>

            <p className="mt-4 text-3xl font-black text-white">
              {cantidadPedidos}
            </p>
          </div>

          <div className={`${tarjeta} p-7`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Productos vendidos
            </p>

            <p className="mt-4 text-3xl font-black text-white">
              {cantidadProductos}
            </p>
          </div>

          <div className={`${tarjeta} p-7`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Ticket promedio
            </p>

            <p className="mt-4 text-3xl font-black text-white">
              {formatearPrecio(
                cantidadPedidos >
                0
                  ? totalVendido /
                    cantidadPedidos
                  : 0
              )}
            </p>
          </div>

        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">

          <div className={`${tarjeta} p-8`}>

            <div className="flex items-center justify-between gap-5">

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                  🌐 Online
                </p>

                <p className="mt-3 text-2xl font-black text-white">
                  {formatearPrecio(
                    totalOnline
                  )}
                </p>
              </div>

              <span className="text-3xl">
                🌐
              </span>

            </div>

            <p className="mt-4 text-sm text-[#81798e]">
              {ventasOnline.length}{" "}
              pedido(s) entregado(s)
            </p>

          </div>

          <div className={`${tarjeta} p-8`}>

            <div className="flex items-center justify-between gap-5">

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                  🏪 Tienda física
                </p>

                <p className="mt-3 text-2xl font-black text-white">
                  {formatearPrecio(
                    totalFisico
                  )}
                </p>
              </div>

              <span className="text-3xl">
                🏪
              </span>

            </div>

            <p className="mt-4 text-sm text-[#81798e]">
              {ventasFisicas.length}{" "}
              venta(s) entregada(s)
            </p>

          </div>

        </div>

        <div className={`${tarjeta} mt-8 p-8`}>

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Ranking
            </p>

            <h2 className="mt-3 text-xl font-black text-white">
              Productos más vendidos
            </h2>

          </div>

          {rankingProductos.length ===
          0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-[#342c45] p-10 text-center">
              <p className="text-sm text-[#81798e]">
                Todavía no hay productos
                vendidos.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-3">

              {rankingProductos
                .slice(0, 10)
                .map(
                  (
                    producto,
                    index
                  ) => (
                    <div
                      key={
                        producto.nombre
                      }
                      className="flex flex-col gap-4 rounded-xl border border-[#29233a] bg-[#121019] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="flex min-w-0 items-center gap-4">

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#211a2e] text-sm font-black text-[#b993ff]">
                          {index + 1}
                        </span>

                        <p className="truncate text-sm font-bold text-[#ddd5e7]">
                          {
                            producto.nombre
                          }
                        </p>

                      </div>

                      <div className="flex items-center justify-between gap-6 sm:justify-end">

                        <span className="text-xs font-semibold text-[#91889d]">
                          {
                            producto.cantidad
                          }{" "}
                          unidad(es)
                        </span>

                        <span className="text-sm font-black text-[#b993ff]">
                          {formatearPrecio(
                            producto.total
                          )}
                        </span>

                      </div>

                    </div>
                  )
                )}

            </div>
          )}

        </div>

        <div className={`${tarjeta} mt-8 p-8`}>

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
              Pedidos
            </p>

            <h2 className="mt-3 text-xl font-black text-white">
              Estado de pedidos y ventas
            </h2>

          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-[#121019] p-5 text-center">

              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Pendientes
              </p>

              <p className="mt-3 text-2xl font-black text-[#b993ff]">
                {
                  pedidos.filter(
                    (pedido) =>
                      pedido.status ===
                      "Pendiente"
                  ).length
                }
              </p>

            </div>

            <div className="rounded-xl bg-[#121019] p-5 text-center">

              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Entregados
              </p>

              <p className="mt-3 text-2xl font-black text-green-400">
                {
                  pedidos.filter(
                    (pedido) =>
                      pedido.status ===
                      "Entregado"
                  ).length
                }
              </p>

            </div>

            <div className="rounded-xl bg-[#121019] p-5 text-center">

              <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                Cancelados
              </p>

              <p className="mt-3 text-2xl font-black text-red-400">
                {
                  pedidos.filter(
                    (pedido) =>
                      pedido.status ===
                      "Cancelado"
                  ).length
                }
              </p>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

/* =========================================================
   PORTADAS
========================================================= */

function PortadasAdmin() {
  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const [configId, setConfigId] =
    useState(null);

  const [titulo, setTitulo] =
    useState("");

  const [subtitulo, setSubtitulo] =
    useState("");

  const [boton, setBoton] =
    useState("Ver colección");

  const [imagen, setImagen] =
    useState("");

  useEffect(() => {
    cargarPortada();
  }, []);

  async function cargarPortada() {
    setCargando(true);
    setError("");

    const {
      data,
      error: errorConsulta,
    } = await supabase
      .from("store_settings")
      .select(`
        id,
        store_name,
        setting_key,
        setting_value
      `)
      .eq(
        "setting_key",
        "portada_principal"
      )
      .maybeSingle();

    if (errorConsulta) {
      console.error(
        errorConsulta
      );

      setError(
        "No se pudo cargar la portada."
      );

      setCargando(false);
      return;
    }

    if (data) {
      setConfigId(data.id);

      try {
        const contenido =
          JSON.parse(
            data.setting_value ||
              "{}"
          );

        setTitulo(
          contenido.titulo || ""
        );

        setSubtitulo(
          contenido.subtitulo ||
            ""
        );

        setBoton(
          contenido.boton ||
            "Ver colección"
        );

        setImagen(
          contenido.imagen || ""
        );
      } catch {
        setTitulo(
          data.setting_value ||
            ""
        );
      }
    }

    setCargando(false);
  }

  async function guardarPortada() {
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const contenido =
        JSON.stringify({
          titulo:
            titulo.trim(),
          subtitulo:
            subtitulo.trim(),
          boton:
            boton.trim() ||
            "Ver colección",
          imagen:
            imagen.trim(),
        });

      const ahora =
        new Date().toISOString();

      if (configId) {
        const {
          error: errorUpdate,
        } = await supabase
          .from("store_settings")
          .update({
            store_name: "GMISH",
            setting_value:
              contenido,
            updated_at: ahora,
          })
          .eq(
            "id",
            configId
          );

        if (errorUpdate) {
          throw errorUpdate;
        }
      } else {
        const {
          data,
          error: errorInsert,
        } = await supabase
          .from("store_settings")
          .insert({
            store_name: "GMISH",
            setting_key:
              "portada_principal",
            setting_value:
              contenido,
            updated_at: ahora,
          })
          .select(
            "id"
          )
          .single();

        if (errorInsert) {
          throw errorInsert;
        }

        setConfigId(
          data.id
        );
      }

      setMensaje(
        "Portada guardada correctamente."
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
      <div className="flex w-full justify-center py-28 text-center">
        <p className="text-sm text-[#81798e]">
          Cargando portada...
        </p>
      </div>
    );
  }

  return (
    <section className="flex w-full justify-center">
      <div className="w-full max-w-5xl">

        <div className="text-center">

          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            Apariencia
          </span>

          <h1 className="mt-7 text-3xl font-black text-white">
            Portada principal
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#91889d]">
            Administra el contenido principal
            que aparece en la portada de GMISH.
          </p>

        </div>

        {mensaje && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-green-900/50 bg-green-950/30 p-4 text-center text-sm text-green-300">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className={`${tarjeta} mt-12 p-7 sm:p-9`}>

          <div className="grid gap-6">

            <div>
              <label className={etiqueta}>
                Título principal
              </label>

              <input
                type="text"
                value={titulo}
                onChange={(event) =>
                  setTitulo(
                    event.target.value
                  )
                }
                placeholder="Nueva colección"
                className={campo}
              />
            </div>

            <div>
              <label className={etiqueta}>
                Subtítulo
              </label>

              <textarea
                value={subtitulo}
                onChange={(event) =>
                  setSubtitulo(
                    event.target.value
                  )
                }
                placeholder="Descubre las últimas novedades de GMISH."
                rows={4}
                className={`${campo} resize-none`}
              />
            </div>

            <div>
              <label className={etiqueta}>
                Texto del botón
              </label>

              <input
                type="text"
                value={boton}
                onChange={(event) =>
                  setBoton(
                    event.target.value
                  )
                }
                placeholder="Ver colección"
                className={campo}
              />
            </div>

            <div>
              <label className={etiqueta}>
                URL de imagen
              </label>

              <input
                type="text"
                value={imagen}
                onChange={(event) =>
                  setImagen(
                    event.target.value
                  )
                }
                placeholder="https://..."
                className={campo}
              />

              <p className="mt-2 text-xs text-[#71687e]">
                Puedes dejarlo vacío mientras
                terminas de preparar la imagen.
              </p>
            </div>

          </div>

          <div className="mt-8 flex justify-end">

            <button
              type="button"
              onClick={
                guardarPortada
              }
              disabled={guardando}
              className={botonMorado}
            >
              {guardando
                ? "Guardando..."
                : "Guardar portada"}
            </button>

          </div>

        </div>

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

  const [configId, setConfigId] =
    useState(null);

  const [nombre, setNombre] =
    useState("GMISH");

  const [direccion, setDireccion] =
    useState("");

  const [mapsUrl, setMapsUrl] =
    useState("");

  const [instagram, setInstagram] =
    useState("");

  const [tiktok, setTiktok] =
    useState("");

  const [facebook, setFacebook] =
    useState("");

  const [
    whatsappPrincipal,
    setWhatsappPrincipal,
  ] = useState("");

  const [
    whatsappSecundario,
    setWhatsappSecundario,
  ] = useState("");

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
      .select(`
        id,
        store_name,
        address,
        maps_url,
        instagram_url,
        tiktok_url,
        facebook_url,
        whatsapp_principal,
        whatsapp_secundario,
        setting_key,
        setting_value
      `)
      .eq(
        "setting_key",
        "configuracion_general"
      )
      .maybeSingle();

    if (errorConsulta) {
      console.error(
        errorConsulta
      );

      setError(
        "No se pudo cargar la configuración."
      );

      setCargando(false);
      return;
    }

    if (data) {
      setConfigId(data.id);

      setNombre(
        data.store_name ||
          "GMISH"
      );

      setDireccion(
        data.address || ""
      );

      setMapsUrl(
        data.maps_url || ""
      );

      setInstagram(
        data.instagram_url ||
          ""
      );

      setTiktok(
        data.tiktok_url || ""
      );

      setFacebook(
        data.facebook_url ||
          ""
      );

      setWhatsappPrincipal(
        data.whatsapp_principal ||
          ""
      );

      setWhatsappSecundario(
        data.whatsapp_secundario ||
          ""
      );
    }

    setCargando(false);
  }

  async function guardarConfiguracion() {
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const ahora =
        new Date().toISOString();

      const datos = {
        store_name:
          nombre.trim() ||
          "GMISH",

        address:
          direccion.trim() ||
          null,

        maps_url:
          mapsUrl.trim() ||
          null,

        instagram_url:
          instagram.trim() ||
          null,

        tiktok_url:
          tiktok.trim() ||
          null,

        facebook_url:
          facebook.trim() ||
          null,

        whatsapp_principal:
          whatsappPrincipal.trim() ||
          null,

        whatsapp_secundario:
          whatsappSecundario.trim() ||
          null,

        setting_key:
          "configuracion_general",

        setting_value:
          "general",

        updated_at: ahora,
      };

      if (configId) {
        const {
          error: errorUpdate,
        } = await supabase
          .from("store_settings")
          .update(datos)
          .eq(
            "id",
            configId
          );

        if (errorUpdate) {
          throw errorUpdate;
        }
      } else {
        const {
          data,
          error: errorInsert,
        } = await supabase
          .from("store_settings")
          .insert(datos)
          .select(
            "id"
          )
          .single();

        if (errorInsert) {
          throw errorInsert;
        }

        setConfigId(
          data.id
        );
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
      <div className="flex w-full justify-center py-28 text-center">
        <p className="text-sm text-[#81798e]">
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <section className="flex w-full justify-center">
      <div className="w-full max-w-5xl">

        <div className="text-center">

          <span className="inline-flex rounded-full border border-[#3b3150] bg-[#211a2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#b993ff]">
            GMISH
          </span>

          <h1 className="mt-7 text-3xl font-black text-white">
            Configuración
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#91889d]">
            Configura la información general,
            redes sociales y canales de contacto
            de tu tienda.
          </p>

        </div>

        {mensaje && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-green-900/50 bg-green-950/30 p-4 text-center text-sm text-green-300">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-12 space-y-6">

          <div className={`${tarjeta} p-7 sm:p-9`}>

            <h2 className="text-lg font-black text-white">
              Información de la tienda
            </h2>

            <div className="mt-7 grid gap-6">

              <div>
                <label className={etiqueta}>
                  Nombre de la tienda
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(event) =>
                    setNombre(
                      event.target.value
                    )
                  }
                  className={campo}
                />
              </div>

              <div>
                <label className={etiqueta}>
                  Dirección
                </label>

                <input
                  type="text"
                  value={direccion}
                  onChange={(event) =>
                    setDireccion(
                      event.target.value
                    )
                  }
                  placeholder="Dirección de la tienda"
                  className={campo}
                />
              </div>

              <div>
                <label className={etiqueta}>
                  Google Maps
                </label>

                <input
                  type="text"
                  value={mapsUrl}
                  onChange={(event) =>
                    setMapsUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://maps.google.com/..."
                  className={campo}
                />
              </div>

            </div>

          </div>

          <div className={`${tarjeta} p-7 sm:p-9`}>

            <h2 className="text-lg font-black text-white">
              Redes sociales
            </h2>

            <div className="mt-7 grid gap-6">

              <div>
                <label className={etiqueta}>
                  Instagram
                </label>

                <input
                  type="text"
                  value={instagram}
                  onChange={(event) =>
                    setInstagram(
                      event.target.value
                    )
                  }
                  placeholder="https://instagram.com/..."
                  className={campo}
                />
              </div>

              <div>
                <label className={etiqueta}>
                  TikTok
                </label>

                <input
                  type="text"
                  value={tiktok}
                  onChange={(event) =>
                    setTiktok(
                      event.target.value
                    )
                  }
                  placeholder="https://tiktok.com/@..."
                  className={campo}
                />
              </div>

              <div>
                <label className={etiqueta}>
                  Facebook
                </label>

                <input
                  type="text"
                  value={facebook}
                  onChange={(event) =>
                    setFacebook(
                      event.target.value
                    )
                  }
                  placeholder="https://facebook.com/..."
                  className={campo}
                />
              </div>

            </div>

          </div>

          <div className={`${tarjeta} p-7 sm:p-9`}>

            <h2 className="text-lg font-black text-white">
              WhatsApp
            </h2>

            <div className="mt-7 grid gap-6 md:grid-cols-2">

              <div>
                <label className={etiqueta}>
                  WhatsApp principal
                </label>

                <input
                  type="text"
                  value={
                    whatsappPrincipal
                  }
                  onChange={(event) =>
                    setWhatsappPrincipal(
                      event.target
                        .value
                    )
                  }
                  placeholder="51999999999"
                  className={campo}
                />
              </div>

              <div>
                <label className={etiqueta}>
                  WhatsApp secundario
                </label>

                <input
                  type="text"
                  value={
                    whatsappSecundario
                  }
                  onChange={(event) =>
                    setWhatsappSecundario(
                      event.target
                        .value
                    )
                  }
                  placeholder="51999999999"
                  className={campo}
                />
              </div>

            </div>

          </div>

          <div className="flex justify-end">

            <button
              type="button"
              onClick={
                guardarConfiguracion
              }
              disabled={guardando}
              className={botonMorado}
            >
              {guardando
                ? "Guardando..."
                : "Guardar configuración"}
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}

/* =========================================================
   APP PRINCIPAL DEL ADMIN
========================================================= */

export default function AdminPanel() {
  const [rol, setRol] =
    useState("principal");

  const [
    seccionActiva,
    setSeccionActiva,
  ] = useState("inicio");

  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(false);

  const seccionesDisponibles =
    useMemo(
      () =>
        secciones.filter(
          (seccion) =>
            seccion.acceso.includes(
              rol
            )
        ),
      [rol]
    );

  function seleccionarSeccion(id) {
    setSeccionActiva(id);
    setMenuAbierto(false);
  }

  function renderSeccion() {
    switch (seccionActiva) {

      case "inicio":
        return (
          <InicioAdmin
            rol={rol}
            onSeleccionar={
              seleccionarSeccion
            }
          />
        );

      case "productos":
        return <ProductsAdmin />;

      case "pedidos":
        return <PedidosAdmin />;

      case "estadisticas":
        return <EstadisticasAdmin />;

      case "portadas":
        return <PortadasAdmin />;

      case "configuracion":
        return (
          <ConfiguracionAdmin />
        );

      default:
        return (
          <InicioAdmin
            rol={rol}
            onSeleccionar={
              seleccionarSeccion
            }
          />
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0d14] text-white">

      {/* =================================================
          BARRA SUPERIOR
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-[#29233a] bg-[#121019]/95 backdrop-blur">

        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">

          <button
            type="button"
            onClick={() =>
              setMenuAbierto(
                (actual) =>
                  !actual
              )
            }
            aria-label="Abrir menú"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#342c45] text-xl text-[#ddd5e7] transition hover:border-[#7c3aed] hover:text-white"
          >
            ☰
          </button>

          <button
            type="button"
            onClick={() =>
              seleccionarSeccion(
                "inicio"
              )
            }
            className="text-center"
          >
            <p className="text-lg font-black tracking-[0.18em] text-white">
              GMISH
            </p>

            <p className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-[#71687e] sm:block">
              Administración
            </p>
          </button>

          <div className="flex items-center gap-3">

            <span className="hidden rounded-full border border-[#342c45] bg-[#17151f] px-3 py-2 text-xs font-bold text-[#b993ff] sm:inline-flex">
              {rol ===
              "principal"
                ? "Principal"
                : "Secundario"}
            </span>

          </div>

        </div>

      </header>

      {/* =================================================
          MENÚ LATERAL
      ================================================= */}

      {menuAbierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() =>
              setMenuAbierto(
                false
              )
            }
            className="fixed inset-0 z-40 bg-black/50"
          />

          <aside className="fixed left-0 top-0 z-[60] flex h-full w-[290px] flex-col border-r border-[#29233a] bg-[#121019] shadow-[0_20px_80px_rgba(0,0,0,0.5)]">

            <div className="flex items-center justify-between border-b border-[#29233a] px-6 py-5">

              <div>

                <p className="text-lg font-black tracking-[0.15em] text-white">
                  GMISH
                </p>

                <p className="mt-1 text-xs text-[#71687e]">
                  Panel de administración
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMenuAbierto(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#342c45] text-[#aaa1b3] transition hover:border-[#7c3aed] hover:text-white"
              >
                ×
              </button>

            </div>

            <nav className="flex-1 overflow-y-auto p-4">

              <div className="space-y-2">

                {seccionesDisponibles.map(
                  (seccion) => (
                    <button
                      key={
                        seccion.id
                      }
                      type="button"
                      onClick={() =>
                        seleccionarSeccion(
                          seccion.id
                        )
                      }
                      className={`flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-sm font-bold transition ${
                        seccionActiva ===
                        seccion.id
                          ? "bg-[#7c3aed] text-white"
                          : "text-[#aaa1b3] hover:bg-[#1b1824] hover:text-white"
                      }`}
                    >

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/10 text-base">
                        {
                          seccion.icono
                        }
                      </span>

                      <span>
                        {
                          seccion.nombre
                        }
                      </span>

                    </button>
                  )
                )}

              </div>

            </nav>

            <div className="border-t border-[#29233a] p-5">

              <div className="rounded-xl bg-[#17151f] p-4">

                <p className="text-xs font-bold uppercase tracking-widest text-[#71687e]">
                  Sesión
                </p>

                <p className="mt-2 text-sm font-bold text-[#ddd5e7]">
                  Administrador
                </p>

                <p className="mt-1 text-xs text-[#81798e]">
                  Acceso{" "}
                  {rol ===
                  "principal"
                    ? "principal"
                    : "secundario"}
                </p>

              </div>

            </div>

          </aside>
        </>
      )}

      {/* =================================================
          CONTENIDO
      ================================================= */}

      <main className="mx-auto w-full max-w-7xl px-5 py-10 pb-20 sm:px-8 sm:py-14">
        {renderSeccion()}
      </main>

    </div>
  );
}