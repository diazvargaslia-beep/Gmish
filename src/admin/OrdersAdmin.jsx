import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const estados = ["Pendiente", "Completado"];

function normalizarEstado(estado) {
  const valor = String(estado || "").toLowerCase();

  if (valor === "pendiente" || valor === "confirmado") {
    return "Pendiente";
  }

  if (valor === "completado" || valor === "entregado") {
    return "Completado";
  }

  if (valor === "cancelado") {
    return "Pendiente";
  }

  return "Pendiente";
}

function obtenerTipoTexto(tipo) {
  return String(tipo || "").toLowerCase() === "fisica"
    ? "TIENDA"
    : "ONLINE";
}

function obtenerEstadoClase(estado) {
  if (estado === "Completado") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}

function obtenerTipoClase(tipo) {
  if (tipo === "TIENDA") {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }

  return "bg-sky-50 text-sky-700 border-sky-200";
}

function obtenerNumeroPedido(orders, order) {
  const ordenados = [...orders].sort((a, b) => {
    const fechaA = new Date(a.created_at || 0).getTime();
    const fechaB = new Date(b.created_at || 0).getTime();

    if (fechaA !== fechaB) {
      return fechaA - fechaB;
    }

    return String(a.id).localeCompare(String(b.id));
  });

  const posicion = ordenados.findIndex(
    (item) => String(item.id) === String(order.id)
  );

  return posicion >= 0 ? posicion + 1 : 1;
}

function Icono({ nombre, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (nombre === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (nombre === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (nombre === "edit") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    );
  }

  if (nombre === "trash") {
    return (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    );
  }

  if (nombre === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </svg>
    );
  }

  if (nombre === "store") {
    return (
      <svg {...common}>
        <path d="M4 10v10h16V10" />
        <path d="M3 10 5 4h14l2 6" />
        <path d="M3 10c1.5 1.5 3 1.5 4.5 0 1.5 1.5 3 1.5 4.5 0 1.5 1.5 3 1.5 4.5 0 1.5 1.5 3 1.5 4.5 0 1.5 1.5 3 1.5 4.5 0 1.5 1.5 3 3 4.5 0" />
        <path d="M9 20v-5h6v5" />
      </svg>
    );
  }

  if (nombre === "globe") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.4 3.5 5.4 3.5 9s-1 6.6-3.5 9" />
        <path d="M12 3c-2.5 2.4-3.5 5.4-3.5 9s1 6.6 3.5 9" />
      </svg>
    );
  }

  if (nombre === "minus") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
      </svg>
    );
  }

  return null;
}

function Modal({ children, onClose, title, width = "max-w-3xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div
        className={`max-h-[92vh] w-full ${width} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Icono nombre="close" size={19} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function EditarPedidoModal({ order, onClose, onSaved }) {
  const [cliente, setCliente] = useState(order.customer_name || "");
  const [direccion, setDireccion] = useState(
    order.delivery_address || ""
  );
  const [referencia, setReferencia] = useState(
    order.delivery_reference || ""
  );
  const [descuento, setDescuento] = useState(
    Number(order.discount || 0)
  );
  const [total, setTotal] = useState(Number(order.total || 0));
  const [estado, setEstado] = useState(
    normalizarEstado(order.status)
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const esOnline =
    String(order.order_type || "").toLowerCase() !== "fisica";

  const subtotal = useMemo(() => {
    return Number(order.subtotal || order.total || 0);
  }, [order]);

  useEffect(() => {
    const nuevoTotal = Math.max(
      0,
      subtotal - Number(descuento || 0)
    );

    setTotal(nuevoTotal);
  }, [descuento, subtotal]);

  async function guardar() {
    setGuardando(true);
    setError("");

    const payload = {
      customer_name: cliente.trim(),
      discount: Number(descuento || 0),
      total: Number(total || 0),
      status: estado,
    };

    if (esOnline) {
      payload.delivery_address = direccion.trim();
      payload.delivery_reference = referencia.trim();
    }

    const { data, error: updateError } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", order.id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setGuardando(false);
      return;
    }

    setGuardando(false);
    onSaved(data);
  }

  return (
    <Modal title="Editar pedido" onClose={onClose}>
      <div className="space-y-7">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Cliente
            </label>

            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Estado
            </label>

            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
            >
              {estados.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {esOnline && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Dirección de entrega
              </label>

              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Referencia
              </label>

              <input
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              />
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="mb-4 text-sm font-semibold text-neutral-900">
            Productos
          </div>

          <div className="space-y-3">
            {(order.order_items || []).map((item, index) => (
              <div
                key={item.id || index}
                className="rounded-xl bg-white px-4 py-4"
              >
                <p className="text-sm font-medium text-neutral-900">
                  {item.product_name || "Producto"}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  Talla: {item.size || "Sin talla"}
                  {" · "}
                  Color: {item.color || "Sin color"}
                  {" · "}
                  Cantidad: {item.quantity || 1}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Subtotal
            </label>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
              S/ {subtotal.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Descuento
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={descuento}
              onChange={(e) =>
                setDescuento(Number(e.target.value || 0))
              }
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Total
            </label>

            <div className="rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">
              S/ {total.toFixed(2)}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={guardando}
            onClick={guardar}
            className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function VentaFisicaModal({ onClose, onSaved }) {
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const [cliente, setCliente] = useState("");
  const [descuento, setDescuento] = useState(0);

  const [productoSeleccionado, setProductoSeleccionado] =
    useState(null);

  const [colorSeleccionado, setColorSeleccionado] =
    useState("");

  const [tallaSeleccionada, setTallaSeleccionada] =
    useState("");

  const [mostrarProductos, setMostrarProductos] =
    useState(false);

  const [items, setItems] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarProductos() {
      setCargandoProductos(true);
      setError("");

      const { data, error: productosError } = await supabase
        .from("products")
        .select(
          `
            id,
            name,
            price,
            is_active,
            owner_role,
            product_variants (
              id,
              size,
              color,
              stock
            )
          `
        )
        .eq("is_active", true)
        .eq("owner_role", "principal")
        .order("name");

      if (productosError) {
        setError(productosError.message);
        setProductos([]);
        setCargandoProductos(false);
        return;
      }

      const productosConStock = (data || []).filter(
        (producto) =>
          producto.owner_role === "principal" &&
          (producto.product_variants || []).some(
            (variant) => Number(variant.stock || 0) > 0
          )
      );

      setProductos(productosConStock);
      setCargandoProductos(false);
    }

    cargarProductos();
  }, []);

  const coloresDisponibles = useMemo(() => {
    if (!productoSeleccionado) {
      return [];
    }

    return [
      ...new Set(
        (productoSeleccionado.product_variants || [])
          .filter(
            (variant) => Number(variant.stock || 0) > 0
          )
          .map((variant) => variant.color)
          .filter(Boolean)
      ),
    ];
  }, [productoSeleccionado]);

  const tallasDisponibles = useMemo(() => {
    if (!productoSeleccionado || !colorSeleccionado) {
      return [];
    }

    return (productoSeleccionado.product_variants || [])
      .filter(
        (variant) =>
          variant.color === colorSeleccionado &&
          Number(variant.stock || 0) > 0
      )
      .sort((a, b) =>
        String(a.size || "").localeCompare(
          String(b.size || ""),
          undefined,
          { numeric: true }
        )
      );
  }, [productoSeleccionado, colorSeleccionado]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 1),
      0
    );
  }, [items]);

  const total = Math.max(
    0,
    subtotal - Number(descuento || 0)
  );

  function abrirSelectorProductos() {
    if (cargandoProductos) {
      return;
    }

    setMostrarProductos((actual) => !actual);
    setError("");
  }

  function seleccionarProducto(producto) {
    setProductoSeleccionado(producto);
    setColorSeleccionado("");
    setTallaSeleccionada("");
    setMostrarProductos(false);
    setError("");
  }

  function seleccionarColor(color) {
    setColorSeleccionado(color);
    setTallaSeleccionada("");
    setError("");
  }

  function seleccionarTalla(talla) {
    setTallaSeleccionada(talla);
    setError("");
  }

  function agregarProducto() {
    setError("");

    if (!productoSeleccionado) {
      setError("Selecciona un producto.");
      return;
    }

    if (!colorSeleccionado) {
      setError("Selecciona un color.");
      return;
    }

    if (!tallaSeleccionada) {
      setError("Selecciona una talla.");
      return;
    }

    const variante = (
      productoSeleccionado.product_variants || []
    ).find(
      (item) =>
        item.color === colorSeleccionado &&
        item.size === tallaSeleccionada
    );

    if (!variante) {
      setError("No se encontró esa variante.");
      return;
    }

    const existente = items.find(
      (item) => item.variant_id === variante.id
    );

    if (existente) {
      if (
        existente.quantity + 1 >
        Number(variante.stock || 0)
      ) {
        setError(
          "No hay más stock disponible para esta variante."
        );
        return;
      }

      setItems((actuales) =>
        actuales.map((item) =>
          item.variant_id === variante.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setItems((actuales) => [
        ...actuales,
        {
          product_id: productoSeleccionado.id,
          variant_id: variante.id,
          product_name: productoSeleccionado.name,
          size: variante.size,
          color: variante.color,
          price: Number(productoSeleccionado.price || 0),
          quantity: 1,
          stock: Number(variante.stock || 0),
        },
      ]);
    }

    setProductoSeleccionado(null);
    setColorSeleccionado("");
    setTallaSeleccionada("");
    setMostrarProductos(false);
  }

  function cambiarCantidad(variantId, cantidad) {
    setItems((actuales) =>
      actuales
        .map((item) => {
          if (item.variant_id !== variantId) {
            return item;
          }

          const nuevaCantidad = Math.max(
            0,
            Math.min(cantidad, item.stock)
          );

          return {
            ...item,
            quantity: nuevaCantidad,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function eliminarItem(variantId) {
    setItems((actuales) =>
      actuales.filter(
        (item) => item.variant_id !== variantId
      )
    );
  }

  async function registrarVenta() {
    setError("");

    if (!cliente.trim()) {
      setError("Ingresa el nombre del cliente.");
      return;
    }

    if (!items.length) {
      setError("Agrega al menos un producto.");
      return;
    }

    setGuardando(true);

    const p_items = items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
    }));

    const { data, error: rpcError } = await supabase.rpc(
      "registrar_venta_fisica",
      {
        p_customer_name: cliente.trim(),
        p_discount: Number(descuento || 0),
        p_items,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
      setGuardando(false);
      return;
    }

    setGuardando(false);
    onSaved(data);
  }

  return (
    <Modal
      title="Nueva venta física"
      onClose={onClose}
      width="max-w-4xl"
    >
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Cliente
          </label>

          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nombre del cliente"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
          />
        </div>

        <div className="rounded-2xl border border-neutral-200 p-5">
          <h3 className="mb-5 text-sm font-semibold text-neutral-900">
            Agregar producto
          </h3>

          <div className="space-y-5">
            <div className="relative">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                Producto
              </label>

              <button
                type="button"
                onClick={abrirSelectorProductos}
                disabled={cargandoProductos}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-50"
              >
                <span
                  className={
                    productoSeleccionado
                      ? "text-neutral-900"
                      : "text-neutral-500"
                  }
                >
                  {cargandoProductos
                    ? "Cargando productos..."
                    : productoSeleccionado
                    ? `${productoSeleccionado.name} · S/ ${Number(
                        productoSeleccionado.price || 0
                      ).toFixed(2)}`
                    : "Seleccionar producto"}
                </span>

                <span className="text-neutral-400">
                  {mostrarProductos ? "▲" : "▼"}
                </span>
              </button>

              {mostrarProductos && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-xl">
                  {productos.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-neutral-500">
                      No hay productos disponibles.
                    </div>
                  ) : (
                    productos.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() =>
                          seleccionarProducto(producto)
                        }
                        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition hover:bg-neutral-50"
                      >
                        <span className="min-w-0 truncate font-medium text-neutral-900">
                          {producto.name}
                        </span>

                        <span className="ml-4 shrink-0 text-xs text-neutral-500">
                          S/{" "}
                          {Number(
                            producto.price || 0
                          ).toFixed(2)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {productoSeleccionado && (
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Color
                </label>

                <select
                  value={colorSeleccionado}
                  onChange={(e) =>
                    seleccionarColor(e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                >
                  <option value="">
                    Seleccionar color
                  </option>

                  {coloresDisponibles.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {productoSeleccionado &&
              colorSeleccionado && (
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Talla
                  </label>

                  <select
                    value={tallaSeleccionada}
                    onChange={(e) =>
                      seleccionarTalla(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  >
                    <option value="">
                      Seleccionar talla
                    </option>

                    {tallasDisponibles.map((variant) => (
                      <option
                        key={variant.id}
                        value={variant.size}
                      >
                        {variant.size} · Stock{" "}
                        {variant.stock}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {productoSeleccionado &&
              colorSeleccionado &&
              tallaSeleccionada && (
                <button
                  type="button"
                  onClick={agregarProducto}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  <Icono nombre="plus" size={17} />
                  Agregar producto
                </button>
              )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Productos de la venta
            </h3>
          </div>

          <div className="p-4">
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Todavía no agregaste productos.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.variant_id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900">
                        {item.product_name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Talla: {item.size}
                        {" · "}
                        Color: {item.color}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        S/{" "}
                        {Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="flex items-center rounded-lg border border-neutral-200">
                        <button
                          type="button"
                          onClick={() =>
                            cambiarCantidad(
                              item.variant_id,
                              item.quantity - 1
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center text-neutral-600 hover:bg-neutral-50"
                        >
                          <Icono
                            nombre="minus"
                            size={15}
                          />
                        </button>

                        <span className="w-9 text-center text-sm font-medium">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            cambiarCantidad(
                              item.variant_id,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            item.quantity >= item.stock
                          }
                          className="flex h-9 w-9 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Icono
                            nombre="plus"
                            size={15}
                          />
                        </button>
                      </div>

                      <span className="min-w-[80px] text-right text-sm font-semibold text-neutral-900">
                        S/{" "}
                        {(
                          Number(item.price) *
                          Number(item.quantity)
                        ).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarItem(item.variant_id)
                        }
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Subtotal
            </label>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium">
              S/ {subtotal.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Descuento
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={descuento}
              onChange={(e) =>
                setDescuento(
                  Number(e.target.value || 0)
                )
              }
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Total
            </label>

            <div className="rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">
              S/ {total.toFixed(2)}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={registrarVenta}
            disabled={guardando}
            className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando
              ? "Registrando..."
              : "Registrar venta"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");

  const [pedidoEditar, setPedidoEditar] = useState(null);
  const [mostrarVentaFisica, setMostrarVentaFisica] =
    useState(false);

  async function cargarPedidos() {
    setCargando(true);
    setError("");

    const { data, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
          *,
          order_items (
            id,
            product_id,
            product_name,
            size,
            color,
            quantity
          )
        `
      )
      .order("created_at", {
        ascending: true,
      });

    if (ordersError) {
      setError(ordersError.message);
      setOrders([]);
      setCargando(false);
      return;
    }

    setOrders(data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function eliminarPedido(order) {
    const confirmado = window.confirm(
      `¿Eliminar el pedido de ${
        order.customer_name || "este cliente"
      }?`
    );

    if (!confirmado) {
      return;
    }

    setError("");

    const { error: deleteError } = await supabase.rpc(
      "admin_delete_order",
      {
        p_order_id: order.id,
      }
    );

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setOrders((actuales) =>
      actuales.filter(
        (item) => String(item.id) !== String(order.id)
      )
    );
  }

  function pedidoActualizado(updatedOrder) {
    setOrders((actuales) =>
      actuales.map((item) =>
        String(item.id) === String(updatedOrder.id)
          ? {
              ...item,
              ...updatedOrder,
            }
          : item
      )
    );

    setPedidoEditar(null);
  }

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return orders.filter((order) => {
      const tipo = obtenerTipoTexto(order.order_type);
      const estado = normalizarEstado(order.status);

      const coincideTipo =
        tipoFiltro === "TODOS" || tipo === tipoFiltro;

      const coincideEstado =
        estadoFiltro === "TODOS" ||
        estado === estadoFiltro;

      const textoPedido = [
        order.customer_name,
        order.delivery_address,
        order.delivery_reference,
        order.id,
        tipo,
        estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda =
        !texto || textoPedido.includes(texto);

      return (
        coincideTipo &&
        coincideEstado &&
        coincideBusqueda
      );
    });
  }, [
    orders,
    busqueda,
    tipoFiltro,
    estadoFiltro,
  ]);

  return (
    <div className="min-h-full w-full bg-white px-6 py-8 text-neutral-900 sm:px-10 sm:py-10 lg:px-14 xl:px-16 2xl:px-20">
      <div className="w-full space-y-7">
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={() => setMostrarVentaFisica(true)}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <Icono nombre="plus" size={17} />
            Nueva venta física
          </button>
        </div>

        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_240px_240px]">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
              <Icono nombre="search" size={18} />
            </span>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, dirección o pedido..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-500"
            />
          </div>

          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-neutral-500"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="ONLINE">Online</option>
            <option value="TIENDA">Tienda</option>
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-neutral-500"
          >
            <option value="TODOS">Todos los estados</option>

            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="w-full rounded-2xl border border-neutral-200 bg-white py-20 text-center text-sm text-neutral-500">
            Cargando pedidos...
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="w-full rounded-2xl border border-neutral-200 bg-white py-20 text-center">
            <p className="text-sm font-medium text-neutral-700">
              No hay pedidos para mostrar.
            </p>

            <p className="mt-2 text-xs text-neutral-500">
              Prueba cambiando los filtros o la búsqueda.
            </p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {pedidosFiltrados.map((order) => {
              const tipo = obtenerTipoTexto(
                order.order_type
              );

              const estado = normalizarEstado(
                order.status
              );

              const numeroPedido = obtenerNumeroPedido(
                orders,
                order
              );

              const subtotal = Number(
                order.subtotal || order.total || 0
              );

              const descuento = Number(
                order.discount || 0
              );

              const total = Number(
                order.total ||
                  Math.max(0, subtotal - descuento)
              );

              return (
                <div
                  key={order.id}
                  className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-neutral-900">
                        Pedido #{numeroPedido}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${obtenerTipoClase(
                          tipo
                        )}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {tipo === "TIENDA" ? (
                            <Icono
                              nombre="store"
                              size={13}
                            />
                          ) : (
                            <Icono
                              nombre="globe"
                              size={13}
                            />
                          )}

                          {tipo}
                        </span>
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${obtenerEstadoClase(
                          estado
                        )}`}
                      >
                        {estado}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPedidoEditar(order)
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        <Icono nombre="edit" size={15} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarPedido(order)
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Icono nombre="trash" size={15} />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-6 border-t border-neutral-100 pt-6 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500">
                        Cliente
                      </p>

                      <p className="mt-2 text-sm font-medium text-neutral-900">
                        {order.customer_name ||
                          "Sin nombre"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500">
                        Fecha
                      </p>

                      <p className="mt-2 text-sm font-medium text-neutral-900">
                        {order.created_at
                          ? new Date(
                              order.created_at
                            ).toLocaleString("es-PE")
                          : "Sin fecha"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500">
                        Subtotal
                      </p>

                      <p className="mt-2 text-sm font-medium text-neutral-900">
                        S/ {subtotal.toFixed(2)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500">
                        Total
                      </p>

                      <p className="mt-2 text-base font-semibold text-neutral-900">
                        S/ {total.toFixed(2)}
                      </p>

                      {descuento > 0 && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Descuento: S/{" "}
                          {descuento.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {tipo === "ONLINE" && (
                    <div className="mt-7 grid gap-6 rounded-xl bg-neutral-50 p-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-neutral-500">
                          Dirección de entrega
                        </p>

                        <p className="mt-2 text-sm leading-6 text-neutral-800">
                          {order.delivery_address ||
                            "No registrada"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-neutral-500">
                          Referencia
                        </p>

                        <p className="mt-2 text-sm leading-6 text-neutral-800">
                          {order.delivery_reference ||
                            "No registrada"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-7 border-t border-neutral-100 pt-6">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-neutral-900">
                        Productos
                      </p>

                      <span className="text-xs text-neutral-500">
                        {(order.order_items || []).length}{" "}
                        producto(s)
                      </span>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      {(order.order_items || []).map(
                        (item, index) => (
                          <div
                            key={item.id || index}
                            className="flex items-center justify-between gap-5 rounded-xl border border-neutral-200 px-5 py-4"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-neutral-900">
                                {item.product_name ||
                                  "Producto"}
                              </p>

                              <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                                Talla:{" "}
                                {item.size ||
                                  "Sin talla"}
                                {" · "}
                                Color:{" "}
                                {item.color ||
                                  "Sin color"}
                                {" · "}
                                Cantidad:{" "}
                                {item.quantity || 1}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-sm font-medium text-neutral-700">
                                Cant.{" "}
                                {item.quantity || 1}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pedidoEditar && (
        <EditarPedidoModal
          order={pedidoEditar}
          onClose={() => setPedidoEditar(null)}
          onSaved={pedidoActualizado}
        />
      )}

      {mostrarVentaFisica && (
        <VentaFisicaModal
          onClose={() => setMostrarVentaFisica(false)}
          onSaved={() => {
            setMostrarVentaFisica(false);
            cargarPedidos();
          }}
        />
      )}
    </div>
  );
}