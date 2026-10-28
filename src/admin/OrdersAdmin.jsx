import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

const ESTADOS = ["Pendiente", "Completado"]
const MONEDA = "S/"

const ESTILOS = {
  pagina: {
    width: "100%",
    minHeight: "100%",
    color: "#111",
  },

  encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 24,
    marginBottom: 34,
    flexWrap: "wrap",
  },

  titulo: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1,
    fontWeight: 600,
    letterSpacing: "-0.04em",
  },

  subtitulo: {
    margin: "9px 0 0",
    color: "#777",
    fontSize: 14,
    lineHeight: 1.5,
  },

  botonPrincipal: {
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    minHeight: 44,
    padding: "0 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },

  botonSecundario: {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    minHeight: 42,
    padding: "0 15px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },

  botonPeligro: {
    border: "1px solid #e2e2e2",
    background: "#fff",
    color: "#b42318",
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
}

function Icono({
  nombre,
  size = 18,
  strokeWidth = 1.7,
}) {
  const comunes = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  }

  if (nombre === "plus") {
    return (
      <svg {...comunes}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }

  if (nombre === "search") {
    return (
      <svg {...comunes}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    )
  }

  if (nombre === "filter") {
    return (
      <svg {...comunes}>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </svg>
    )
  }

  if (nombre === "edit") {
    return (
      <svg {...comunes}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    )
  }

  if (nombre === "trash") {
    return (
      <svg {...comunes}>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </svg>
    )
  }

  if (nombre === "close") {
    return (
      <svg {...comunes}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    )
  }

  if (nombre === "arrow") {
    return (
      <svg {...comunes}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    )
  }

  if (nombre === "store") {
    return (
      <svg {...comunes}>
        <path d="M4 10v10h16V10" />
        <path d="M3 10 5 4h14l2 6" />
        <path d="M3 10c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2" />
        <path d="M9 20v-5h6v5" />
      </svg>
    )
  }

  if (nombre === "globe") {
    return (
      <svg {...comunes}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" />
      </svg>
    )
  }

  if (nombre === "download") {
    return (
      <svg {...comunes}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    )
  }

  if (nombre === "check") {
    return (
      <svg {...comunes}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    )
  }

  return null
}

function FormatoMoneda({ valor }) {
  const numero = Number(valor || 0)

  return (
    <span>
      {MONEDA}{" "}
      {numero.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  )
}

function normalizarEstado(estado) {
  const valor = String(estado || "")
    .trim()
    .toLowerCase()

  if (
    valor === "completado" ||
    valor === "entregado" ||
    valor === "completed"
  ) {
    return "Completado"
  }

  return "Pendiente"
}

function obtenerTipoPedido(order) {
  const tipo = String(
    order?.order_type ||
      order?.sale_type ||
      ""
  )
    .trim()
    .toLowerCase()

  return tipo === "fisica" ||
    tipo === "física"
    ? "fisica"
    : "online"
}

function obtenerTipoTexto(order) {
  return obtenerTipoPedido(order) ===
    "fisica"
    ? "Tienda"
    : "Online"
}

function obtenerNumeroPedido(
  orders,
  order
) {
  const ordenados = [...orders].sort(
    (a, b) => {
      const fechaA = new Date(
        a.created_at || 0
      ).getTime()

      const fechaB = new Date(
        b.created_at || 0
      ).getTime()

      if (fechaA !== fechaB) {
        return fechaA - fechaB
      }

      return String(
        a.id || ""
      ).localeCompare(
        String(b.id || "")
      )
    }
  )

  const indice =
    ordenados.findIndex(
      (item) =>
        item.id === order.id
    )

  return indice >= 0
    ? indice + 1
    : 0
}

function formatearFecha(fecha) {
  if (!fecha) return "—"

  const valor = new Date(fecha)

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return "—"
  }

  return valor.toLocaleString(
    "es-PE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )
}

function obtenerNombreProducto(
  item
) {
  return (
    item?.product_name ||
    item?.name ||
    item?.product?.name ||
    "Producto"
  )
}

function obtenerSubtotalItems(
  order
) {
  const items =
    order?.order_items || []

  if (!items.length) {
    return null
  }

  const total = items.reduce(
    (suma, item) => {
      const subtotalItem =
        Number(
          item?.subtotal
        )

      if (
        Number.isFinite(
          subtotalItem
        )
      ) {
        return (
          suma +
          subtotalItem
        )
      }

      const precio = Number(
        item?.unit_price ??
          item?.price ??
          0
      )

      const cantidad = Number(
        item?.quantity ?? 1
      )

      return (
        suma +
        precio * cantidad
      )
    },
    0
  )

  return Number.isFinite(
    total
  )
    ? total
    : null
}

function obtenerDescuento(
  order
) {
  const descuento = Number(
    order?.discount || 0
  )

  return Number.isFinite(
    descuento
  )
    ? Math.max(
        0,
        descuento
      )
    : 0
}

function obtenerSubtotal(
  order
) {
  const subtotalItems =
    obtenerSubtotalItems(
      order
    )

  if (
    subtotalItems !== null &&
    subtotalItems > 0
  ) {
    return subtotalItems
  }

  const subtotalBD = Number(
    order?.subtotal
  )

  if (
    Number.isFinite(
      subtotalBD
    )
  ) {
    return Math.max(
      0,
      subtotalBD
    )
  }

  const totalBD = Number(
    order?.total
  )

  if (
    Number.isFinite(
      totalBD
    ) &&
    totalBD >= 0
  ) {
    return Math.max(
      0,
      totalBD +
        obtenerDescuento(
          order
        )
    )
  }

  return 0
}

function obtenerTotal(order) {
  const totalBD = Number(
    order?.total
  )

  if (
    Number.isFinite(
      totalBD
    ) &&
    totalBD >= 0
  ) {
    return totalBD
  }

  return Math.max(
    0,
    obtenerSubtotal(order) -
      obtenerDescuento(
        order
      )
  )
}

function EstadoBadge({
  estado,
}) {
  const normalizado =
    normalizarEstado(
      estado
    )

  const completado =
    normalizado ===
    "Completado"

  return (
    <span
      style={{
        display:
          "inline-flex",
        alignItems:
          "center",
        gap: 7,
        padding:
          "6px 9px",
        borderRadius:
          999,
        background:
          completado
            ? "#f0f7f1"
            : "#f6f6f6",
        color:
          completado
            ? "#28633a"
            : "#555",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace:
          "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius:
            "50%",
          background:
            completado
              ? "#28633a"
              : "#888",
        }}
      />

      {normalizado}
    </span>
  )
}

function TipoBadge({
  order,
}) {
  const fisica =
    obtenerTipoPedido(
      order
    ) === "fisica"

  return (
    <span
      style={{
        display:
          "inline-flex",
        alignItems:
          "center",
        gap: 6,
        color: "#555",
        fontSize: 11,
        fontWeight: 600,
        textTransform:
          "uppercase",
        letterSpacing:
          "0.05em",
      }}
    >
      <Icono
        nombre={
          fisica
            ? "store"
            : "globe"
        }
        size={13}
      />

      {fisica
        ? "Tienda"
        : "Online"}
    </span>
  )
}

function Campo({
  etiqueta,
  children,
  style = {},
}) {
  return (
    <label
      style={{
        display:
          "flex",
        flexDirection:
          "column",
        gap: 7,
        minWidth: 0,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#777",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.07em",
        }}
      >
        {etiqueta}
      </span>

      {children}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  ...props
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={
        placeholder
      }
      {...props}
      style={{
        width: "100%",
        height: 42,
        border:
          "1px solid #dedede",
        borderRadius: 8,
        padding:
          "0 12px",
        background: "#fff",
        color: "#111",
        outline: "none",
        fontSize: 13,
        boxSizing:
          "border-box",
        ...props.style,
      }}
    />
  )
}

function Select({
  value,
  onChange,
  children,
  ...props
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      {...props}
      style={{
        width: "100%",
        height: 42,
        border:
          "1px solid #dedede",
        borderRadius: 8,
        padding:
          "0 34px 0 12px",
        background: "#fff",
        color: "#111",
        outline: "none",
        fontSize: 13,
        cursor:
          "pointer",
        ...props.style,
      }}
    >
      {children}
    </select>
  )
}

function ModalBase({
  children,
  ancho = 620,
  onClose,
}) {
  useEffect(() => {
    function manejarTecla(
      evento
    ) {
      if (
        evento.key ===
        "Escape"
      ) {
        onClose()
      }
    }

    document.addEventListener(
      "keydown",
      manejarTecla
    )

    return () => {
      document.removeEventListener(
        "keydown",
        manejarTecla
      )
    }
  }, [onClose])

  return (
    <div
      style={{
        position:
          "fixed",
        inset: 0,
        zIndex: 1000,
        background:
          "rgba(0,0,0,.42)",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding: 20,
        boxSizing:
          "border-box",
      }}
      onMouseDown={(
        evento
      ) => {
        if (
          evento.target ===
          evento.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: ancho,
          maxHeight:
            "calc(100vh - 40px)",
          overflowY:
            "auto",
          background:
            "#fff",
          borderRadius: 12,
          boxShadow:
            "0 24px 70px rgba(0,0,0,.18)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

function CabeceraModal({
  titulo,
  descripcion,
  onClose,
}) {
  return (
    <div
      style={{
        padding:
          "22px 24px",
        borderBottom:
          "1px solid #eee",
        display:
          "flex",
        justifyContent:
          "space-between",
        alignItems:
          "flex-start",
        gap: 20,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 600,
            letterSpacing:
              "-0.02em",
          }}
        >
          {titulo}
        </h2>

        {descripcion && (
          <p
            style={{
              margin:
                "6px 0 0",
              color: "#777",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {descripcion}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          border: "none",
          background:
            "#f7f7f7",
          color: "#555",
          width: 32,
          height: 32,
          borderRadius: 7,
          cursor:
            "pointer",
          display:
            "grid",
          placeItems:
            "center",
          flexShrink: 0,
        }}
        aria-label="Cerrar"
      >
        <Icono
          nombre="close"
          size={18}
        />
      </button>
    </div>
  )
}

function DetallePedido({
  order,
  orders,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const numero =
    obtenerNumeroPedido(
      orders,
      order
    )

  const items =
    order?.order_items || []

  const [
    actualizandoEstado,
    setActualizandoEstado,
  ] = useState(false)

  async function cambiarEstado(
    estado
  ) {
    if (
      normalizarEstado(
        order.status
      ) === estado
    ) {
      return
    }

    setActualizandoEstado(
      true
    )

    await onStatusChange(
      order.id,
      estado
    )

    setActualizandoEstado(
      false
    )
  }

  return (
    <div
      style={{
        position:
          "fixed",
        inset: 0,
        zIndex: 900,
        background:
          "rgba(0,0,0,.25)",
        display:
          "flex",
        justifyContent:
          "flex-end",
      }}
      onMouseDown={(
        evento
      ) => {
        if (
          evento.target ===
          evento.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <aside
        style={{
          width:
            "min(560px, 100%)",
          height: "100%",
          background:
            "#fff",
          boxShadow:
            "-20px 0 50px rgba(0,0,0,.12)",
          display:
            "flex",
          flexDirection:
            "column",
        }}
      >
        <div
          style={{
            padding:
              "20px 24px",
            borderBottom:
              "1px solid #eee",
            display:
              "flex",
            alignItems:
              "flex-start",
            justifyContent:
              "space-between",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 10,
                flexWrap:
                  "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing:
                    "-0.03em",
                }}
              >
                Pedido #{numero}
              </span>

              <TipoBadge
                order={order}
              />
            </div>

            <p
              style={{
                margin:
                  "7px 0 0",
                color: "#888",
                fontSize: 12,
              }}
            >
              {formatearFecha(
                order.created_at
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            style={{
              border:
                "none",
              background:
                "#f7f7f7",
              width: 34,
              height: 34,
              borderRadius: 7,
              cursor:
                "pointer",
              display:
                "grid",
              placeItems:
                "center",
              color: "#555",
            }}
          >
            <Icono
              nombre="close"
              size={18}
            />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY:
              "auto",
            padding: 24,
          }}
        >
          <section>
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: 15,
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.08em",
                  color: "#777",
                }}
              >
                Estado del pedido
              </h3>

              <EstadoBadge
                estado={
                  order.status
                }
              />
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 8,
              }}
            >
              {ESTADOS.map(
                (
                  estado
                ) => {
                  const activo =
                    normalizarEstado(
                      order.status
                    ) ===
                    estado

                  return (
                    <button
                      key={
                        estado
                      }
                      type="button"
                      disabled={
                        actualizandoEstado
                      }
                      onClick={() =>
                        cambiarEstado(
                          estado
                        )
                      }
                      style={{
                        height: 40,
                        border:
                          activo
                            ? "1px solid #111"
                            : "1px solid #e1e1e1",
                        background:
                          activo
                            ? "#111"
                            : "#fff",
                        color:
                          activo
                            ? "#fff"
                            : "#444",
                        borderRadius: 7,
                        cursor:
                          actualizandoEstado
                            ? "wait"
                            : "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {estado}
                    </button>
                  )
                }
              )}
            </div>
          </section>

          <section
            style={{
              marginTop: 30,
              paddingTop: 26,
              borderTop:
                "1px solid #eee",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
                color: "#777",
              }}
            >
              Cliente
            </h3>

            <div
              style={{
                marginTop: 13,
                padding: 15,
                border:
                  "1px solid #eee",
                borderRadius: 9,
                background:
                  "#fafafa",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {order.customer_name ||
                  "Cliente sin nombre"}
              </p>

              {order.customer_phone && (
                <p
                  style={{
                    margin:
                      "7px 0 0",
                    color: "#666",
                    fontSize: 12,
                  }}
                >
                  {order.customer_phone}
                </p>
              )}
            </div>
          </section>

          <section
            style={{
              marginTop: 30,
              paddingTop: 26,
              borderTop:
                "1px solid #eee",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
                color: "#777",
              }}
            >
              Productos
            </h3>

            <div
              style={{
                marginTop: 13,
                border:
                  "1px solid #eee",
                borderRadius: 9,
                overflow:
                  "hidden",
              }}
            >
              {items.length ? (
                items.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.id ||
                        `${item.product_id}-${item.size}-${item.color}-${index}`
                      }
                      style={{
                        padding:
                          "14px 15px",
                        borderBottom:
                          index <
                          items.length -
                            1
                            ? "1px solid #eee"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: 15,
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {obtenerNombreProducto(
                              item
                            )}
                          </p>

                          <p
                            style={{
                              margin:
                                "5px 0 0",
                              color: "#777",
                              fontSize: 12,
                            }}
                          >
                            {item.size ||
                              "Sin talla"}{" "}
                            ·{" "}
                            {item.color ||
                              "Sin color"}{" "}
                            ·{" "}
                            {item.quantity ||
                              1}{" "}
                            ud.
                          </p>
                        </div>

                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <FormatoMoneda
                            valor={
                              Number(
                                item.subtotal
                              ) ||
                              Number(
                                item.unit_price ||
                                  0
                              ) *
                                Number(
                                  item.quantity ||
                                    1
                                )
                            }
                          />
                        </span>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div
                  style={{
                    padding: 18,
                    color: "#888",
                    fontSize: 13,
                  }}
                >
                  Este pedido no tiene
                  productos registrados.
                </div>
              )}
            </div>
          </section>

          <section
            style={{
              marginTop: 30,
              paddingTop: 26,
              borderTop:
                "1px solid #eee",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
                color: "#777",
              }}
            >
              Entrega
            </h3>

            <div
              style={{
                marginTop: 13,
                display:
                  "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  padding: 14,
                  border:
                    "1px solid #eee",
                  borderRadius: 9,
                }}
              >
                <span
                  style={{
                    display:
                      "block",
                    marginBottom: 5,
                    color: "#999",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.08em",
                  }}
                >
                  Dirección
                </span>

                <span
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {order.delivery_address ||
                    "No registrada"}
                </span>
              </div>

              <div
                style={{
                  padding: 14,
                  border:
                    "1px solid #eee",
                  borderRadius: 9,
                }}
              >
                <span
                  style={{
                    display:
                      "block",
                    marginBottom: 5,
                    color: "#999",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.08em",
                  }}
                >
                  Referencia
                </span>

                <span
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {order.delivery_reference ||
                    "Sin referencia"}
                </span>
              </div>

              {order.delivery_zone && (
                <div
                  style={{
                    padding: 14,
                    border:
                      "1px solid #eee",
                    borderRadius: 9,
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      marginBottom: 5,
                      color: "#999",
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Zona
                  </span>

                  <span
                    style={{
                      fontSize: 13,
                    }}
                  >
                    {
                      order.delivery_zone
                    }
                  </span>
                </div>
              )}
            </div>
          </section>

          <section
            style={{
              marginTop: 30,
              paddingTop: 26,
              borderTop:
                "1px solid #eee",
            }}
          >
            <div
              style={{
                display:
                  "grid",
                gap: 9,
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  fontSize: 13,
                  color: "#666",
                }}
              >
                <span>
                  Subtotal
                </span>

                <span>
                  <FormatoMoneda
                    valor={obtenerSubtotal(
                      order
                    )}
                  />
                </span>
              </div>

              {obtenerDescuento(
                order
              ) > 0 && (
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    gap: 20,
                    fontSize: 13,
                    color: "#28633a",
                  }}
                >
                  <span>
                    Descuento
                  </span>

                  <span>
                    -{" "}
                    <FormatoMoneda
                      valor={obtenerDescuento(
                        order
                      )}
                    />
                  </span>
                </div>
              )}

              <div
                style={{
                  marginTop: 8,
                  paddingTop: 15,
                  borderTop:
                    "1px solid #ddd",
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                <span>
                  Total
                </span>

                <span>
                  <FormatoMoneda
                    valor={obtenerTotal(
                      order
                    )}
                  />
                </span>
              </div>
            </div>
          </section>
        </div>

        <div
          style={{
            borderTop:
              "1px solid #eee",
            padding:
              "14px 20px",
            display:
              "flex",
            justifyContent:
              "space-between",
            gap: 8,
            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            onClick={() =>
              onDelete(order)
            }
            style={
              ESTILOS.botonPeligro
            }
          >
            <Icono
              nombre="trash"
              size={15}
            />

            Eliminar
          </button>

          <div
            style={{
              display:
                "flex",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() =>
                onEdit(order)
              }
              style={
                ESTILOS.botonSecundario
              }
            >
              <Icono
                nombre="edit"
                size={15}
              />

              Editar
            </button>

            <button
              type="button"
              onClick={onClose}
              style={
                ESTILOS.botonPrincipal
              }
            >
              Cerrar
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function EditarPedidoModal({
  order,
  onClose,
  onSaved,
}) {
  const [cliente, setCliente] =
    useState(
      order.customer_name ||
        ""
    )

  const [direccion, setDireccion] =
    useState(
      order.delivery_address ||
        ""
    )

  const [
    referencia,
    setReferencia,
  ] = useState(
    order.delivery_reference ||
      ""
  )

  const [
    zona,
    setZona,
  ] = useState(
    order.delivery_zone ||
      ""
  )

  const [
    descuento,
    setDescuento,
  ] = useState(
    String(
      Number(
        order.discount || 0
      )
    )
  )

  const [
    estado,
    setEstado,
  ] = useState(
    normalizarEstado(
      order.status
    )
  )

  const [
    guardando,
    setGuardando,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  async function guardar() {
    setError("")

    const descuentoNumerico =
      Math.max(
        0,
        Number(
          descuento || 0
        )
      )

    const subtotal =
      obtenerSubtotal(
        order
      )

    if (
      descuentoNumerico >
      subtotal
    ) {
      setError(
        "El descuento no puede ser mayor que el subtotal."
      )
      return
    }

    setGuardando(true)

    const nuevoTotal =
      Math.max(
        0,
        subtotal -
          descuentoNumerico
      )

    const actualizacion = {
      customer_name:
        cliente.trim(),
      delivery_address:
        direccion.trim(),
      delivery_reference:
        referencia.trim(),
      delivery_zone:
        zona.trim(),
      status: estado,
      total: nuevoTotal,
      discount:
        descuentoNumerico,
    }

    const {
      data,
      error: updateError,
    } = await supabase
      .from("orders")
      .update(
        actualizacion
      )
      .eq(
        "id",
        order.id
      )
      .select()
      .single()

    if (updateError) {
      console.error(
        "Error editando pedido:",
        updateError
      )

      setError(
        updateError.message ||
          "No se pudo guardar el pedido."
      )

      setGuardando(false)
      return
    }

    onSaved(data)
    setGuardando(false)
  }

  return (
    <ModalBase
      ancho={650}
      onClose={onClose}
    >
      <CabeceraModal
        titulo="Editar pedido"
        descripcion="Modifica los datos administrativos del pedido."
        onClose={onClose}
      />

      <div
        style={{
          padding: 24,
          display:
            "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(2,minmax(0,1fr))",
            gap: 15,
          }}
        >
          <Campo etiqueta="Cliente">
            <Input
              value={cliente}
              onChange={(event) =>
                setCliente(
                  event.target
                    .value
                )
              }
            />
          </Campo>

          <Campo etiqueta="Estado">
            <Select
              value={estado}
              onChange={(event) =>
                setEstado(
                  event.target
                    .value
                )
              }
            >
              {ESTADOS.map(
                (
                  item
                ) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </Select>
          </Campo>
        </div>

        <Campo etiqueta="Dirección">
          <Input
            value={direccion}
            onChange={(event) =>
              setDireccion(
                event.target
                  .value
              )
            }
          />
        </Campo>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(2,minmax(0,1fr))",
            gap: 15,
          }}
        >
          <Campo etiqueta="Referencia">
            <Input
              value={
                referencia
              }
              onChange={(
                event
              ) =>
                setReferencia(
                  event.target
                    .value
                )
              }
            />
          </Campo>

          <Campo etiqueta="Zona">
            <Input
              value={zona}
              onChange={(event) =>
                setZona(
                  event.target
                    .value
                )
              }
            />
          </Campo>
        </div>

        <Campo etiqueta="Descuento">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={descuento}
            onChange={(event) =>
              setDescuento(
                event.target
                  .value
              )
            }
          />
        </Campo>

        <div
          style={{
            padding:
              "14px 15px",
            border:
              "1px solid #eee",
            borderRadius: 8,
            background:
              "#fafafa",
            display:
              "flex",
            justifyContent:
              "space-between",
            gap: 15,
          }}
        >
          <span
            style={{
              color: "#777",
              fontSize: 12,
            }}
          >
            Nuevo total
          </span>

          <strong
            style={{
              fontSize: 15,
            }}
          >
            <FormatoMoneda
              valor={Math.max(
                0,
                obtenerSubtotal(
                  order
                ) -
                  Number(
                    descuento ||
                      0
                  )
              )}
            />
          </strong>
        </div>

        {error && (
          <div
            style={{
              padding:
                "11px 13px",
              border:
                "1px solid #f0d0d0",
              background:
                "#fff7f7",
              color:
                "#a12a2a",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "flex-end",
            gap: 8,
            paddingTop: 6,
          }}
        >
          <button
            type="button"
            onClick={
              onClose
            }
            style={
              ESTILOS.botonSecundario
            }
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={
              guardando
            }
            onClick={
              guardar
            }
            style={{
              ...ESTILOS.botonPrincipal,
              opacity:
                guardando
                  ? 0.6
                  : 1,
              cursor:
                guardando
                  ? "wait"
                  : "pointer",
            }}
          >
            {guardando
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

function VentaFisicaModal({
  onClose,
  onSaved,
}) {
  const [
    productos,
    setProductos,
  ] = useState([])

  const [
    cargandoProductos,
    setCargandoProductos,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

  const [
    cliente,
    setCliente,
  ] = useState("")

  const [
    productoSeleccionado,
    setProductoSeleccionado,
  ] = useState("")

  const [
    colorSeleccionado,
    setColorSeleccionado,
  ] = useState("")

  const [
    tallaSeleccionada,
    setTallaSeleccionada,
  ] = useState("")

  const [
    cantidadSeleccionada,
    setCantidadSeleccionada,
  ] = useState("1")

  const [
    items,
    setItems,
  ] = useState([])

  const [
    descuento,
    setDescuento,
  ] = useState("")

  const [
    guardando,
    setGuardando,
  ] = useState(false)

  useEffect(() => {
    let cancelado =
      false

    async function cargarProductos() {
      setCargandoProductos(
        true
      )

      setError("")

      const {
        data,
        error: queryError,
      } = await supabase
        .from("products")
        .select(`
          id,
          name,
          price,
          owner_role,
          product_variants (
            id,
            size,
            color,
            stock
          )
        `)
        .eq(
          "owner_role",
          "principal"
        )
        .order("name", {
          ascending: true,
        })

      if (
        cancelado
      ) {
        return
      }

      if (queryError) {
        console.error(
          "Error al cargar productos para venta física:",
          queryError
        )

        setError(
          queryError.message ||
            "No se pudieron cargar los productos."
        )

        setProductos([])
        setCargandoProductos(
          false
        )

        return
      }

      const disponibles =
        (data || [])
          .map(
            (producto) => ({
              ...producto,
              product_variants:
                (
                  producto.product_variants ||
                  []
                ).filter(
                  (
                    variant
                  ) =>
                    Number(
                      variant.stock ||
                        0
                    ) > 0
                ),
            })
          )
          .filter(
            (producto) =>
              producto
                .product_variants
                .length > 0
          )

      setProductos(
        disponibles
      )

      setCargandoProductos(
        false
      )
    }

    cargarProductos()

    return () => {
      cancelado = true
    }
  }, [])

  const productoActual =
    productos.find(
      (producto) =>
        String(
          producto.id
        ) ===
        String(
          productoSeleccionado
        )
    )

  const coloresDisponibles =
    useMemo(() => {
      if (
        !productoActual
      ) {
        return []
      }

      return [
        ...new Map(
          productoActual.product_variants.map(
            (variant) => [
              String(
                variant.color ||
                  ""
              ),
              variant.color,
            ]
          )
        ).entries(),
      ].map(
        ([
          value,
          label,
        ]) => ({
          value,
          label:
            label ||
            "Sin color",
        })
      )
    }, [
      productoActual,
    ])

  const variantesColor =
    useMemo(() => {
      if (
        !productoActual ||
        !colorSeleccionado
      ) {
        return []
      }

      return productoActual.product_variants.filter(
        (variant) =>
          String(
            variant.color ||
              ""
          ) ===
          String(
            colorSeleccionado
          )
      )
    }, [
      productoActual,
      colorSeleccionado,
    ])

  const varianteActual =
    variantesColor.find(
      (variant) =>
        String(
          variant.size
        ) ===
        String(
          tallaSeleccionada
        )
    )

  const subtotal =
    items.reduce(
      (total, item) =>
        total +
        Number(
          item.price || 0
        ) *
          Number(
            item.quantity ||
              1
          ),
      0
    )

  const descuentoNumerico =
    Math.max(
      0,
      Number(
        descuento || 0
      )
    )

  const total = Math.max(
    0,
    subtotal -
      descuentoNumerico
  )

  function agregarItem() {
    setError("")

    if (
      !productoActual
    ) {
      setError(
        "Selecciona un producto."
      )
      return
    }

    if (
      !colorSeleccionado
    ) {
      setError(
        "Selecciona un color."
      )
      return
    }

    if (
      !tallaSeleccionada
    ) {
      setError(
        "Selecciona una talla."
      )
      return
    }

    if (
      !varianteActual
    ) {
      setError(
        "La variante seleccionada no está disponible."
      )
      return
    }

    const cantidad =
      Math.max(
        1,
        Number(
          cantidadSeleccionada ||
            1
        )
      )

    if (
      cantidad >
      Number(
        varianteActual.stock ||
          0
      )
    ) {
      setError(
        `Solo hay ${varianteActual.stock} unidad(es) disponibles.`
      )
      return
    }

    const existente =
      items.find(
        (item) =>
          String(
            item.variant_id
          ) ===
          String(
            varianteActual.id
          )
      )

    if (existente) {
      const nuevaCantidad =
        Number(
          existente.quantity
        ) + cantidad

      if (
        nuevaCantidad >
        Number(
          varianteActual.stock ||
            0
        )
      ) {
        setError(
          `Solo hay ${varianteActual.stock} unidad(es) disponibles.`
        )
        return
      }

      setItems(
        (actuales) =>
          actuales.map(
            (item) =>
              String(
                item.variant_id
              ) ===
              String(
                varianteActual.id
              )
                ? {
                    ...item,
                    quantity:
                      nuevaCantidad,
                  }
                : item
          )
      )
    } else {
      setItems(
        (actuales) => [
          ...actuales,
          {
            product_id:
              productoActual.id,
            variant_id:
              varianteActual.id,
            product_name:
              productoActual.name,
            price: Number(
              productoActual.price ||
                0
            ),
            size:
              varianteActual.size,
            color:
              varianteActual.color,
            quantity:
              cantidad,
            stock: Number(
              varianteActual.stock ||
                0
            ),
          },
        ]
      )
    }

    setProductoSeleccionado(
      ""
    )

    setColorSeleccionado(
      ""
    )

    setTallaSeleccionada(
      ""
    )

    setCantidadSeleccionada(
      "1"
    )
  }

  function cambiarCantidad(
    variantId,
    nuevaCantidad
  ) {
    const item =
      items.find(
        (actual) =>
          String(
            actual.variant_id
          ) ===
          String(
            variantId
          )
      )

    if (!item) {
      return
    }

    const cantidad =
      Math.max(
        1,
        Number(
          nuevaCantidad ||
            1
        )
      )

    if (
      cantidad >
      item.stock
    ) {
      setError(
        `No puedes agregar más de ${item.stock} unidad(es) de ${item.product_name}.`
      )

      return
    }

    setError("")

    setItems(
      (actuales) =>
        actuales.map(
          (actual) =>
            String(
              actual.variant_id
            ) ===
            String(
              variantId
            )
              ? {
                  ...actual,
                  quantity:
                    cantidad,
                }
              : actual
        )
    )
  }

  function eliminarItem(
    variantId
  ) {
    setItems(
      (actuales) =>
        actuales.filter(
          (item) =>
            String(
              item.variant_id
            ) !==
            String(
              variantId
            )
        )
    )
  }

  async function registrarVenta() {
    setError("")

    if (!items.length) {
      setError(
        "Agrega al menos un producto a la venta."
      )
      return
    }

    if (
      descuentoNumerico >
      subtotal
    ) {
      setError(
        "El descuento no puede ser mayor que el subtotal."
      )
      return
    }

    setGuardando(true)

    const p_items =
      items.map(
        (item) => ({
          product_id:
            item.product_id,
          variant_id:
            item.variant_id,
          quantity:
            item.quantity,
          price:
            item.price,
          size:
            item.size,
          color:
            item.color,
        })
      )

    const {
      data,
      error:
        rpcError,
    } =
      await supabase.rpc(
        "registrar_venta_fisica",
        {
          p_customer_name:
            cliente.trim() ||
            "Cliente de tienda",
          p_discount:
            descuentoNumerico,
          p_items,
        }
      )

    if (rpcError) {
      console.error(
        "Error al registrar venta física:",
        rpcError
      )

      setError(
        rpcError.message ||
          "No se pudo registrar la venta."
      )

      setGuardando(false)

      return
    }

    onSaved(data)

    setGuardando(false)
  }

  return (
    <ModalBase
      ancho={900}
      onClose={onClose}
    >
      <CabeceraModal
        titulo="Nueva venta física"
        descripcion="Registra una venta realizada directamente en tienda."
        onClose={onClose}
      />

      <div
        style={{
          padding: 24,
          display:
            "grid",
          gap: 24,
        }}
      >
        <Campo etiqueta="Cliente">
          <Input
            value={cliente}
            onChange={(event) =>
              setCliente(
                event.target
                  .value
              )
            }
            placeholder="Nombre del cliente (opcional)"
          />
        </Campo>

        <div
          style={{
            paddingTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform:
                "uppercase",
              letterSpacing:
                "0.08em",
              color: "#777",
              marginBottom: 14,
            }}
          >
            Agregar producto
          </div>

          {cargandoProductos ? (
            <div
              style={{
                padding: 20,
                border:
                  "1px solid #eee",
                borderRadius: 8,
                color: "#888",
                fontSize: 13,
              }}
            >
              Cargando productos
              con stock...
            </div>
          ) : productos.length ===
            0 ? (
            <div
              style={{
                padding: 20,
                border:
                  "1px solid #eee",
                borderRadius: 8,
                color: "#888",
                fontSize: 13,
              }}
            >
              No hay productos con
              stock disponible.
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(4,minmax(0,1fr))",
                gap: 12,
              }}
            >
              <Campo etiqueta="Producto">
                <Select
                  value={
                    productoSeleccionado
                  }
                  onChange={(
                    event
                  ) => {
                    setProductoSeleccionado(
                      event
                        .target
                        .value
                    )
                    setColorSeleccionado(
                      ""
                    )
                    setTallaSeleccionada(
                      ""
                    )
                  }}
                >
                  <option value="">
                    Seleccionar
                  </option>

                  {productos.map(
                    (
                      producto
                    ) => (
                      <option
                        key={
                          producto.id
                        }
                        value={
                          producto.id
                        }
                      >
                        {
                          producto.name
                        }
                      </option>
                    )
                  )}
                </Select>
              </Campo>

              <Campo etiqueta="Color">
                <Select
                  value={
                    colorSeleccionado
                  }
                  onChange={(
                    event
                  ) => {
                    setColorSeleccionado(
                      event
                        .target
                        .value
                    )
                    setTallaSeleccionada(
                      ""
                    )
                  }}
                  disabled={
                    !productoActual
                  }
                >
                  <option value="">
                    Seleccionar
                  </option>

                  {coloresDisponibles.map(
                    (
                      color
                    ) => (
                      <option
                        key={
                          color.value
                        }
                        value={
                          color.value
                        }
                      >
                        {
                          color.label
                        }
                      </option>
                    )
                  )}
                </Select>
              </Campo>

              <Campo etiqueta="Talla">
                <Select
                  value={
                    tallaSeleccionada
                  }
                  onChange={(
                    event
                  ) =>
                    setTallaSeleccionada(
                      event
                        .target
                        .value
                    )
                  }
                  disabled={
                    !colorSeleccionado
                  }
                >
                  <option value="">
                    Seleccionar
                  </option>

                  {variantesColor.map(
                    (
                      variant
                    ) => (
                      <option
                        key={
                          variant.id
                        }
                        value={
                          variant.size
                        }
                      >
                        {variant.size}{" "}
                        · stock{" "}
                        {
                          variant.stock
                        }
                      </option>
                    )
                  )}
                </Select>
              </Campo>

              <Campo etiqueta="Cantidad">
                <Input
                  type="number"
                  min="1"
                  max={
                    varianteActual?.stock ||
                    1
                  }
                  value={
                    cantidadSeleccionada
                  }
                  onChange={(
                    event
                  ) =>
                    setCantidadSeleccionada(
                      event
                        .target
                        .value
                    )
                  }
                />
              </Campo>
            </div>
          )}

          {productos.length >
            0 && (
            <div
              style={{
                marginTop: 14,
                display:
                  "flex",
                justifyContent:
                  "flex-end",
              }}
            >
              <button
                type="button"
                onClick={
                  agregarItem
                }
                style={
                  ESTILOS.botonSecundario
                }
              >
                <Icono
                  nombre="plus"
                  size={15}
                />

                Agregar a la venta
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            borderTop:
              "1px solid #eee",
            paddingTop: 22,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform:
                "uppercase",
              letterSpacing:
                "0.08em",
              color: "#777",
              marginBottom: 13,
            }}
          >
            Productos de la venta
          </div>

          {items.length ===
          0 ? (
            <div
              style={{
                padding:
                  "28px 20px",
                border:
                  "1px dashed #d7d7d7",
                borderRadius: 9,
                textAlign:
                  "center",
                color: "#888",
                fontSize: 13,
              }}
            >
              Todavía no has
              agregado productos.
            </div>
          ) : (
            <div
              style={{
                border:
                  "1px solid #eee",
                borderRadius: 9,
                overflow:
                  "hidden",
              }}
            >
              {items.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item.variant_id
                    }
                    style={{
                      padding:
                        "14px 15px",
                      borderBottom:
                        index <
                        items.length -
                          1
                          ? "1px solid #eee"
                          : "none",
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 110px 80px 110px 35px",
                      alignItems:
                        "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {
                          item.product_name
                        }
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          color: "#777",
                          fontSize: 12,
                        }}
                      >
                        {item.size}{" "}
                        ·{" "}
                        {item.color}
                      </div>
                    </div>

                    <Input
                      type="number"
                      min="1"
                      max={
                        item.stock
                      }
                      value={
                        item.quantity
                      }
                      onChange={(
                        event
                      ) =>
                        cambiarCantidad(
                          item.variant_id,
                          event
                            .target
                            .value
                        )
                      }
                    />

                    <span
                      style={{
                        color:
                          "#777",
                        fontSize: 12,
                      }}
                    >
                      Stock{" "}
                      {
                        item.stock
                      }
                    </span>

                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign:
                          "right",
                      }}
                    >
                      <FormatoMoneda
                        valor={
                          Number(
                            item.price
                          ) *
                          Number(
                            item.quantity
                          )
                        }
                      />
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarItem(
                          item.variant_id
                        )
                      }
                      style={{
                        border:
                          "none",
                        background:
                          "transparent",
                        color:
                          "#999",
                        cursor:
                          "pointer",
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        display:
                          "grid",
                        placeItems:
                          "center",
                      }}
                      aria-label="Eliminar producto"
                    >
                      <Icono
                        nombre="trash"
                        size={15}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "1fr 220px",
            gap: 24,
            alignItems:
              "end",
          }}
        >
          <div>
            <Campo etiqueta="Descuento">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={
                  descuento
                }
                onChange={(
                  event
                ) =>
                  setDescuento(
                    event
                      .target
                      .value
                  )
                }
                placeholder="0.00"
              />
            </Campo>
          </div>

          <div
            style={{
              border:
                "1px solid #eee",
              borderRadius: 9,
              padding: 16,
              background:
                "#fafafa",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                color:
                  "#777",
                fontSize: 12,
              }}
            >
              <span>
                Subtotal
              </span>

              <span>
                <FormatoMoneda
                  valor={
                    subtotal
                  }
                />
              </span>
            </div>

            <div
              style={{
                marginTop: 8,
                display:
                  "flex",
                justifyContent:
                  "space-between",
                color:
                  "#28633a",
                fontSize: 12,
              }}
            >
              <span>
                Descuento
              </span>

              <span>
                -{" "}
                <FormatoMoneda
                  valor={
                    descuentoNumerico
                  }
                />
              </span>
            </div>

            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop:
                  "1px solid #ddd",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              <span>
                Total
              </span>

              <span>
                <FormatoMoneda
                  valor={
                    total
                  }
                />
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding:
                "11px 13px",
              border:
                "1px solid #f0d0d0",
              background:
                "#fff7f7",
              color:
                "#a12a2a",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "flex-end",
            gap: 8,
            paddingTop: 4,
          }}
        >
          <button
            type="button"
            onClick={
              onClose
            }
            style={
              ESTILOS.botonSecundario
            }
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={
              registrarVenta
            }
            disabled={
              guardando ||
              items.length ===
                0
            }
            style={{
              ...ESTILOS.botonPrincipal,
              opacity:
                guardando ||
                items.length ===
                  0
                  ? 0.5
                  : 1,
              cursor:
                guardando ||
                items.length ===
                  0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <Icono
              nombre="check"
              size={15}
            />

            {guardando
              ? "Registrando..."
              : "Registrar venta"}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

function ConfirmarEliminacion({
  order,
  numero,
  onClose,
  onConfirm,
  eliminando,
}) {
  return (
    <ModalBase
      ancho={430}
      onClose={onClose}
    >
      <CabeceraModal
        titulo="Eliminar pedido"
        descripcion="Esta acción eliminará el pedido del panel administrativo."
        onClose={onClose}
      />

      <div
        style={{
          padding: 24,
        }}
      >
        <div
          style={{
            background:
              "#fafafa",
            border:
              "1px solid #eee",
            borderRadius: 8,
            padding: 15,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Pedido #{numero}
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#777",
              fontSize: 12,
            }}
          >
            {order.customer_name ||
              "Cliente sin nombre"}
          </div>
        </div>

        <p
          style={{
            margin:
              "0 0 22px",
            color: "#666",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          ¿Seguro que deseas
          eliminar este pedido?
          Esta operación no se
          puede deshacer desde
          este panel.
        </p>

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={
              onClose
            }
            style={
              ESTILOS.botonSecundario
            }
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={
              eliminando
            }
            onClick={
              onConfirm
            }
            style={{
              ...ESTILOS.botonPeligro,
              borderColor:
                "#e4baba",
              background:
                "#fff7f7",
              opacity:
                eliminando
                  ? 0.6
                  : 1,
            }}
          >
            <Icono
              nombre="trash"
              size={15}
            />

            {eliminando
              ? "Eliminando..."
              : "Eliminar pedido"}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

export default function OrdersAdmin() {
  const [
    orders,
    setOrders,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

  const [
    busqueda,
    setBusqueda,
  ] = useState("")

  const [
    tipoFiltro,
    setTipoFiltro,
  ] = useState("todos")

  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState("todos")

  const [
    orden,
    setOrden,
  ] = useState(
    "fecha_desc"
  )

  const [
    pedidoSeleccionado,
    setPedidoSeleccionado,
  ] = useState(null)

  const [
    pedidoEditar,
    setPedidoEditar,
  ] = useState(null)

  const [
    pedidoEliminar,
    setPedidoEliminar,
  ] = useState(null)

  const [
    mostrarVentaFisica,
    setMostrarVentaFisica,
  ] = useState(false)

  const [
    eliminando,
    setEliminando,
  ] = useState(false)

  const [
    mensaje,
    setMensaje,
  ] = useState("")

  async function cargarPedidos() {
    setCargando(true)
    setError("")

    const {
      data,
      error: queryError,
    } =
      await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            variant_id,
            product_name,
            size,
            color,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )

    if (queryError) {
      console.error(
        "Error al cargar pedidos:",
        queryError
      )

      setError(
        queryError.message ||
          "No se pudieron cargar los pedidos."
      )

      setOrders([])
      setCargando(false)

      return
    }

    const normalizados =
      (
        data || []
      ).map(
        (order) => ({
          ...order,
          status:
            normalizarEstado(
              order.status
            ),
          order_items:
            order.order_items ||
            [],
        })
      )

    setOrders(
      normalizados
    )

    setCargando(false)
  }

  useEffect(() => {
    cargarPedidos()
  }, [])

  useEffect(() => {
    if (!mensaje) {
      return
    }

    const temporizador =
      window.setTimeout(
        () => {
          setMensaje("")
        },
        3000
      )

    return () =>
      window.clearTimeout(
        temporizador
      )
  }, [mensaje])

  const pedidosFiltrados =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLocaleLowerCase(
            "es"
          )

      let resultado =
        orders.filter(
          (order) => {
            const tipo =
              obtenerTipoPedido(
                order
              )

            const estado =
              normalizarEstado(
                order.status
              )

            if (
              tipoFiltro !==
                "todos" &&
              tipo !==
                tipoFiltro
            ) {
              return false
            }

            if (
              estadoFiltro !==
                "todos" &&
              estado !==
                estadoFiltro
            ) {
              return false
            }

            if (
              !termino
            ) {
              return true
            }

            const numero =
              obtenerNumeroPedido(
                orders,
                order
              )

            const texto = [
              order.customer_name,
              order.delivery_address,
              order.delivery_reference,
              order.id,
              numero,
              tipo,
              obtenerTipoTexto(
                order
              ),
              estado,
              ...(
                order.order_items ||
                []
              ).map(
                (item) =>
                  `${item.product_name || ""} ${
                    item.color ||
                    ""
                  } ${
                    item.size ||
                    ""
                  }`
              ),
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLocaleLowerCase(
                "es"
              )

            return texto.includes(
              termino
            )
          }
        )

      resultado =
        resultado.sort(
          (a, b) => {
            if (
              orden ===
              "fecha_asc"
            ) {
              return (
                new Date(
                  a.created_at ||
                    0
                ).getTime() -
                new Date(
                  b.created_at ||
                    0
                ).getTime()
              )
            }

            if (
              orden ===
              "fecha_desc"
            ) {
              return (
                new Date(
                  b.created_at ||
                    0
                ).getTime() -
                new Date(
                  a.created_at ||
                    0
                ).getTime()
              )
            }

            if (
              orden ===
              "total_asc"
            ) {
              return (
                obtenerTotal(
                  a
                ) -
                obtenerTotal(
                  b
                )
              )
            }

            if (
              orden ===
              "total_desc"
            ) {
              return (
                obtenerTotal(
                  b
                ) -
                obtenerTotal(
                  a
                )
              )
            }

            if (
              orden ===
              "cliente"
            ) {
              return String(
                a.customer_name ||
                  ""
              ).localeCompare(
                String(
                  b.customer_name ||
                    ""
                ),
                "es"
              )
            }

            return 0
          }
        )

      return resultado
    }, [
      orders,
      busqueda,
      tipoFiltro,
      estadoFiltro,
      orden,
    ])

  async function actualizarEstado(
    orderId,
    estado
  ) {
    setError("")

    const {
      data,
      error:
        updateError,
    } =
      await supabase
        .from("orders")
        .update({
          status:
            estado,
        })
        .eq(
          "id",
          orderId
        )
        .select("*")
        .single()

    if (updateError) {
      console.error(
        "Error al cambiar estado:",
        updateError
      )

      setError(
        updateError.message ||
          "No se pudo actualizar el estado."
      )

      return false
    }

    setOrders(
      (actuales) =>
        actuales.map(
          (order) =>
            order.id ===
            orderId
              ? {
                  ...order,
                  ...data,
                  status:
                    normalizarEstado(
                      data.status
                    ),
                }
              : order
        )
    )

    setPedidoSeleccionado(
      (actual) =>
        actual?.id ===
        orderId
          ? {
              ...actual,
              ...data,
              status:
                normalizarEstado(
                  data.status
                ),
            }
          : actual
    )

    setMensaje(
      "Estado actualizado."
    )

    return true
  }

  function pedidoActualizado(
    actualizado
  ) {
    setOrders(
      (actuales) =>
        actuales.map(
          (order) =>
            order.id ===
            actualizado.id
              ? {
                  ...order,
                  ...actualizado,
                  status:
                    normalizarEstado(
                      actualizado.status
                    ),
                }
              : order
        )
    )

    setPedidoEditar(
      null
    )

    setPedidoSeleccionado(
      (actual) =>
        actual?.id ===
        actualizado.id
          ? {
              ...actual,
              ...actualizado,
            }
          : actual
    )

    setMensaje(
      "Pedido actualizado correctamente."
    )
  }

  async function eliminarPedidoConfirmado() {
    if (
      !pedidoEliminar
    ) {
      return
    }

    setEliminando(
      true
    )

    const {
      error:
        rpcError,
    } =
      await supabase.rpc(
        "admin_delete_order",
        {
          p_order_id:
            pedidoEliminar.id,
        }
      )

    if (rpcError) {
      console.error(
        "Error eliminando pedido:",
        rpcError
      )

      setError(
        rpcError.message ||
          "No se pudo eliminar el pedido."
      )

      setEliminando(
        false
      )

      return
    }

    setOrders(
      (actuales) =>
        actuales.filter(
          (order) =>
            order.id !==
            pedidoEliminar.id
        )
    )

    if (
      pedidoSeleccionado?.id ===
      pedidoEliminar.id
    ) {
      setPedidoSeleccionado(
        null
      )
    }

    setPedidoEliminar(
      null
    )

    setEliminando(
      false
    )

    setMensaje(
      "Pedido eliminado correctamente."
    )
  }

  function exportarCSV() {
    if (
      !pedidosFiltrados.length
    ) {
      setError(
        "No hay pedidos para exportar."
      )

      return
    }

    const filas = [
      [
        "Pedido",
        "Fecha",
        "Cliente",
        "Tipo",
        "Estado",
        "Subtotal",
        "Descuento",
        "Total",
        "Dirección",
        "Referencia",
      ],

      ...pedidosFiltrados.map(
        (order) => [
          obtenerNumeroPedido(
            orders,
            order
          ),
          formatearFecha(
            order.created_at
          ),
          order.customer_name ||
            "",
          obtenerTipoTexto(
            order
          ),
          normalizarEstado(
            order.status
          ),
          obtenerSubtotal(
            order
          ).toFixed(2),
          obtenerDescuento(
            order
          ).toFixed(2),
          obtenerTotal(
            order
          ).toFixed(2),
          order.delivery_address ||
            "",
          order.delivery_reference ||
            "",
        ]
      ),
    ]

    const contenido =
      filas
        .map(
          (fila) =>
            fila
              .map(
                (valor) => {
                  const texto =
                    String(
                      valor ??
                        ""
                    )

                  return `"${texto.replace(
                    /"/g,
                    '""'
                  )}"`
                }
              )
              .join(",")
        )
        .join("\n")

    const blob =
      new Blob(
        [
          "\uFEFF" +
            contenido,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      )

    const url =
      URL.createObjectURL(
        blob
      )

    const enlace =
      document.createElement(
        "a"
      )

    enlace.href = url

    enlace.download =
      `gmish-pedidos-${new Date()
        .toISOString()
        .slice(
          0,
          10
        )}.csv`

    document.body.appendChild(
      enlace
    )

    enlace.click()
    enlace.remove()

    URL.revokeObjectURL(
      url
    )

    setMensaje(
      "Archivo exportado correctamente."
    )
  }

  function limpiarFiltros() {
    setBusqueda("")
    setTipoFiltro(
      "todos"
    )
    setEstadoFiltro(
      "todos"
    )
    setOrden(
      "fecha_desc"
    )
  }

  return (
    <div
      style={
        ESTILOS.pagina
      }
    >
      <style>{`
        .gmish-orders-button:hover {
          opacity: .82;
        }

        .gmish-orders-row:hover {
          background: #fafafa;
        }

        .gmish-orders-icon-button:hover {
          background: #f5f5f5 !important;
          color: #111 !important;
        }

        .gmish-orders-input:focus,
        .gmish-orders-select:focus {
          border-color: #999 !important;
          box-shadow: 0 0 0 3px rgba(0,0,0,.04);
        }

        @media (max-width: 1100px) {
          .gmish-orders-filters {
            grid-template-columns: 1fr 1fr !important;
          }

          .gmish-orders-table-wrap {
            overflow-x: auto;
          }

          .gmish-orders-table {
            min-width: 900px;
          }
        }

        @media (max-width: 650px) {
          .gmish-orders-filters {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        style={
          ESTILOS.encabezado
        }
      >
        <div>
          <h1
            style={
              ESTILOS.titulo
            }
          >
            Pedidos y ventas
          </h1>

          <p
            style={
              ESTILOS.subtitulo
            }
          >
            Controla pedidos online,
            ventas de tienda y el
            movimiento comercial de
            GMISH.
          </p>
        </div>

        <div
          style={{
            display:
              "flex",
            gap: 8,
            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            className="gmish-orders-button"
            onClick={
              exportarCSV
            }
            style={
              ESTILOS.botonSecundario
            }
          >
            <Icono
              nombre="download"
              size={15}
            />

            Exportar
          </button>

          <button
            type="button"
            className="gmish-orders-button"
            onClick={() =>
              setMostrarVentaFisica(
                true
              )
            }
            style={
              ESTILOS.botonPrincipal
            }
          >
            <Icono
              nombre="plus"
              size={16}
            />

            Nueva venta física
          </button>
        </div>
      </div>

      {mensaje && (
        <div
          style={{
            marginBottom: 16,
            padding:
              "11px 14px",
            border:
              "1px solid #dce8df",
            background:
              "#f7fbf8",
            color:
              "#28633a",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding:
              "11px 14px",
            border:
              "1px solid #f0d0d0",
            background:
              "#fff7f7",
            color:
              "#a12a2a",
            borderRadius: 8,
            fontSize: 12,
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: 15,
          }}
        >
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            style={{
              border:
                "none",
              background:
                "transparent",
              color:
                "#a12a2a",
              cursor:
                "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}

      <section
        style={{
          border:
            "1px solid #e7e7e7",
          borderRadius: 10,
          background:
            "#fff",
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div
          className="gmish-orders-filters"
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(250px,2fr) repeat(3,minmax(150px,1fr)) auto",
            gap: 10,
            alignItems:
              "end",
          }}
        >
          <Campo
            etiqueta="Buscar"
          >
            <div
              style={{
                position:
                  "relative",
              }}
            >
              <span
                style={{
                  position:
                    "absolute",
                  left: 12,
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  color:
                    "#999",
                  pointerEvents:
                    "none",
                }}
              >
                <Icono
                  nombre="search"
                  size={16}
                />
              </span>

              <input
                className="gmish-orders-input"
                value={
                  busqueda
                }
                onChange={(
                  event
                ) =>
                  setBusqueda(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Cliente, pedido, producto, talla o color..."
                style={{
                  width:
                    "100%",
                  height: 42,
                  border:
                    "1px solid #dedede",
                  borderRadius: 8,
                  padding:
                    "0 12px 0 38px",
                  background:
                    "#fff",
                  color:
                    "#111",
                  outline:
                    "none",
                  fontSize: 13,
                  boxSizing:
                    "border-box",
                }}
              />
            </div>
          </Campo>

          <Campo etiqueta="Canal">
            <Select
              className="gmish-orders-select"
              value={
                tipoFiltro
              }
              onChange={(
                event
              ) =>
                setTipoFiltro(
                  event
                    .target
                    .value
                )
              }
            >
              <option value="todos">
                Todos
              </option>

              <option value="online">
                Online
              </option>

              <option value="fisica">
                Tienda
              </option>
            </Select>
          </Campo>

          <Campo etiqueta="Estado">
            <Select
              className="gmish-orders-select"
              value={
                estadoFiltro
              }
              onChange={(
                event
              ) =>
                setEstadoFiltro(
                  event
                    .target
                    .value
                )
              }
            >
              <option value="todos">
                Todos
              </option>

              <option value="Pendiente">
                Pendiente
              </option>

              <option value="Completado">
                Completado
              </option>
            </Select>
          </Campo>

          <Campo etiqueta="Ordenar">
            <Select
              className="gmish-orders-select"
              value={orden}
              onChange={(
                event
              ) =>
                setOrden(
                  event
                    .target
                    .value
                )
              }
            >
              <option value="fecha_desc">
                Más recientes
              </option>

              <option value="fecha_asc">
                Más antiguos
              </option>

              <option value="total_desc">
                Mayor total
              </option>

              <option value="total_asc">
                Menor total
              </option>

              <option value="cliente">
                Cliente A-Z
              </option>
            </Select>
          </Campo>

          <button
            type="button"
            onClick={
              limpiarFiltros
            }
            style={{
              ...ESTILOS.botonSecundario,
              height: 42,
            }}
          >
            <Icono
              nombre="filter"
              size={15}
            />

            Limpiar
          </button>
        </div>
      </section>

      <section
        style={{
          border:
            "1px solid #e7e7e7",
          borderRadius: 10,
          background:
            "#fff",
          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            padding:
              "18px 20px",
            borderBottom:
              "1px solid #eee",
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 15,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Registro de operaciones
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",
                color: "#888",
                fontSize: 12,
              }}
            >
              {pedidosFiltrados.length}{" "}
              resultado
              {pedidosFiltrados.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              cargarPedidos
            }
            style={{
              border:
                "none",
              background:
                "transparent",
              color:
                "#777",
              cursor:
                "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Actualizar
          </button>
        </div>

        {cargando ? (
          <div
            style={{
              minHeight: 300,
              display:
                "grid",
              placeItems:
                "center",
              color:
                "#888",
              fontSize: 13,
            }}
          >
            Cargando pedidos...
          </div>
        ) : pedidosFiltrados.length ===
          0 ? (
          <div
            style={{
              minHeight: 300,
              display:
                "flex",
              flexDirection:
                "column",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding: 30,
              textAlign:
                "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                border:
                  "1px solid #e5e5e5",
                borderRadius:
                  "50%",
                display:
                  "grid",
                placeItems:
                  "center",
                color:
                  "#888",
              }}
            >
              <Icono
                nombre="box"
                size={20}
              />
            </div>

            <h3
              style={{
                margin:
                  "15px 0 0",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              No hay operaciones
            </h3>

            <p
              style={{
                margin:
                  "6px 0 0",
                maxWidth: 380,
                color:
                  "#888",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              No encontramos pedidos
              con los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="gmish-orders-table-wrap">
            <table
              className="gmish-orders-table"
              style={{
                width:
                  "100%",
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom:
                      "1px solid #eee",
                    background:
                      "#fafafa",
                  }}
                >
                  <th
                    style={{
                      padding:
                        "12px 15px",
                      textAlign:
                        "left",
                      fontSize: 10,
                      fontWeight: 600,
                      color:
                        "#888",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Pedido
                  </th>

                  <th
                    style={{
                      padding:
                        "12px 15px",
                      textAlign:
                        "left",
                      fontSize: 10,
                      fontWeight: 600,
                      color:
                        "#888",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Cliente
                  </th>

                  <th
                    style={{
                      padding:
                        "12px 15px",
                      textAlign:
                        "left",
                      fontSize: 10,
                      fontWeight: 600,
                      color:
                        "#888",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Canal
                  </th>

                  <th
                    style={{
                      padding:
                        "12px 15px",
                      textAlign:
                        "left",
                      fontSize: 10,
                      fontWeight: 600,
                      color:
                        "#888",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Fecha
                  </th>

                  <th
                    style={{
                      padding:
                        "12px 15px",
                      textAlign:
                        "left",
                      fontSize: 10,
                      fontWeight: 600,
                      color:
                        "#888",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Estado
                  </th>

                  <th
                    style={{
                      padding:
                        "12px 15px",
                      textAlign:
                        "right",
                      fontSize: 10,
                      fontWeight: 600,
                      color:
                        "#888",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Total
                  </th>

                  <th
                    style={{
                      width: 55,
                    }}
                  />
                </tr>
              </thead>

              <tbody>
                {pedidosFiltrados.map(
                  (
                    order
                  ) => {
                    const numero =
                      obtenerNumeroPedido(
                        orders,
                        order
                      )

                    return (
                      <tr
                        key={
                          order.id
                        }
                        className="gmish-orders-row"
                        style={{
                          borderBottom:
                            "1px solid #eee",
                          cursor:
                            "pointer",
                        }}
                        onClick={() =>
                          setPedidoSeleccionado(
                            order
                          )
                        }
                      >
                        <td
                          style={{
                            padding:
                              "15px",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            #
                            {
                              numero
                            }
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              color:
                                "#999",
                              fontSize: 10,
                            }}
                          >
                            {
                              order.order_items
                                ?.length ||
                              0
                            }{" "}
                            producto
                            {(
                              order.order_items
                                ?.length ||
                              0
                            ) ===
                            1
                              ? ""
                              : "s"}
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px",
                            maxWidth:
                              230,
                          }}
                        >
                          <div
                            style={{
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            {order.customer_name ||
                              "Cliente sin nombre"}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                              color:
                                "#999",
                              fontSize: 11,
                            }}
                          >
                            {order.delivery_address ||
                              "Sin dirección"}
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px",
                          }}
                        >
                          <TipoBadge
                            order={
                              order
                            }
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "15px",
                            whiteSpace:
                              "nowrap",
                            color:
                              "#666",
                            fontSize: 12,
                          }}
                        >
                          {formatearFecha(
                            order.created_at
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px",
                          }}
                        >
                          <EstadoBadge
                            estado={
                              order.status
                            }
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "15px",
                            textAlign:
                              "right",
                            whiteSpace:
                              "nowrap",
                            fontWeight: 600,
                          }}
                        >
                          <FormatoMoneda
                            valor={obtenerTotal(
                              order
                            )}
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "15px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={(
                              evento
                            ) => {
                              evento.stopPropagation()

                              setPedidoSeleccionado(
                                order
                              )
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              border:
                                "1px solid #e5e5e5",
                              background:
                                "#fff",
                              color:
                                "#777",
                              borderRadius:
                                7,
                              cursor:
                                "pointer",
                              display:
                                "grid",
                              placeItems:
                                "center",
                            }}
                            aria-label="Ver pedido"
                          >
                            <Icono
                              nombre="arrow"
                              size={15}
                            />
                          </button>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pedidoSeleccionado && (
        <DetallePedido
          order={
            orders.find(
              (order) =>
                order.id ===
                pedidoSeleccionado.id
            ) ||
            pedidoSeleccionado
          }
          orders={
            orders
          }
          onClose={() =>
            setPedidoSeleccionado(
              null
            )
          }
          onEdit={(order) =>
            setPedidoEditar(
              order
            )
          }
          onDelete={(order) =>
            setPedidoEliminar(
              order
            )
          }
          onStatusChange={
            actualizarEstado
          }
        />
      )}

      {pedidoEditar && (
        <EditarPedidoModal
          order={
            pedidoEditar
          }
          onClose={() =>
            setPedidoEditar(
              null
            )
          }
          onSaved={
            pedidoActualizado
          }
        />
      )}

      {pedidoEliminar && (
        <ConfirmarEliminacion
          order={
            pedidoEliminar
          }
          numero={obtenerNumeroPedido(
            orders,
            pedidoEliminar
          )}
          onClose={() =>
            setPedidoEliminar(
              null
            )
          }
          onConfirm={
            eliminarPedidoConfirmado
          }
          eliminando={
            eliminando
          }
        />
      )}

      {mostrarVentaFisica && (
        <VentaFisicaModal
          onClose={() =>
            setMostrarVentaFisica(
              false
            )
          }
          onSaved={async () => {
            setMostrarVentaFisica(
              false
            )

            await cargarPedidos()

            setMensaje(
              "Venta física registrada correctamente."
            )
          }}
        />
      )}
    </div>
  )
}