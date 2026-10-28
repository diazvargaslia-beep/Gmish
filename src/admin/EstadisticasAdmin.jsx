import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import GraficaVentas from "./GraficaVentas"

const MONEDA = "S/"
const ZONA_HORARIA = "America/Lima"

const PERIODOS = [
  {
    value: "7",
    label: "Últimos 7 días",
  },
  {
    value: "30",
    label: "Últimos 30 días",
  },
  {
    value: "90",
    label: "Últimos 90 días",
  },
  {
    value: "todo",
    label: "Todo el período",
  },
]

const FORMATEADOR_FECHA_CLAVE =
  new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

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
    marginBottom: 30,
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

  if (nombre === "money") {
    return (
      <svg {...comunes}>
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
        />
        <path d="M7 9h.01M17 15h.01" />
      </svg>
    )
  }

  if (nombre === "box") {
    return (
      <svg {...comunes}>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7M12 11v10" />
      </svg>
    )
  }

  if (nombre === "chart") {
    return (
      <svg {...comunes}>
        <path d="M4 19V5" />
        <path d="M4 19h17" />
        <path d="m7 15 4-4 3 2 6-7" />
      </svg>
    )
  }

  if (nombre === "cart") {
    return (
      <svg {...comunes}>
        <path d="M4 5h2l2.2 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 1.9-1.4L21 8H7" />
        <circle
          cx="10"
          cy="20"
          r="1"
        />
        <circle
          cx="18"
          cy="20"
          r="1"
        />
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
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M3 12h18" />
        <path d="M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" />
      </svg>
    )
  }

  if (nombre === "refresh") {
    return (
      <svg {...comunes}>
        <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
        <path d="M3 5v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
        <path d="M21 19v-5h-5" />
      </svg>
    )
  }

  return null
}

function FormatoMoneda({
  valor,
}) {
  const numero = Number(
    valor || 0
  )

  return (
    <span>
      {MONEDA}{" "}
      {numero.toLocaleString(
        "es-PE",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}
    </span>
  )
}

function normalizarEstado(
  estado
) {
  const valor = String(
    estado || ""
  )
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

function obtenerTipoPedido(
  order
) {
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

function obtenerTotal(
  order
) {
  const total = Number(
    order?.total
  )

  if (
    Number.isFinite(total) &&
    total >= 0
  ) {
    return total
  }

  const items =
    order?.order_items || []

  const subtotalItems =
    items.reduce(
      (
        suma,
        item
      ) => {
        const subtotal =
          Number(
            item?.subtotal
          )

        if (
          Number.isFinite(
            subtotal
          )
        ) {
          return (
            suma +
            subtotal
          )
        }

        return (
          suma +
          Number(
            item?.unit_price ||
              item?.price ||
              0
          ) *
            Number(
              item?.quantity ||
                1
            )
        )
      },
      0
    )

  const subtotalBD =
    Number(
      order?.subtotal
    )

  const subtotal =
    Number.isFinite(
      subtotalBD
    )
      ? subtotalBD
      : subtotalItems

  const descuento =
    Math.max(
      0,
      Number(
        order?.discount ||
          0
      )
    )

  return Math.max(
    0,
    subtotal -
      descuento
  )
}

function obtenerCantidadProductos(
  order
) {
  return (
    order?.order_items ||
    []
  ).reduce(
    (
      suma,
      item
    ) =>
      suma +
      Number(
        item?.quantity || 0
      ),
    0
  )
}

function obtenerClaveFecha(
  fecha
) {
  if (!fecha) {
    return ""
  }

  const valor =
    new Date(fecha)

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return ""
  }

  return FORMATEADOR_FECHA_CLAVE.format(
    valor
  )
}

function fechaDesdeClave(
  clave
) {
  if (!clave) {
    return null
  }

  return new Date(
    `${clave}T12:00:00Z`
  )
}

function sumarDiasClave(
  clave,
  cantidad
) {
  const fecha =
    fechaDesdeClave(
      clave
    )

  if (!fecha) {
    return null
  }

  fecha.setUTCDate(
    fecha.getUTCDate() +
      cantidad
  )

  return fecha
    .toISOString()
    .slice(0, 10)
}

function obtenerHoyPeru() {
  return obtenerClaveFecha(
    new Date()
  )
}

function formatearFechaCorta(
  fecha
) {
  const clave =
    obtenerClaveFecha(
      fecha
    )

  if (!clave) {
    return "—"
  }

  const valor =
    fechaDesdeClave(
      clave
    )

  if (!valor) {
    return "—"
  }

  return valor
    .toLocaleDateString(
      "es-PE",
      {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      }
    )
    .replace(
      ".",
      ""
    )
}

function TarjetaMetrica({
  icono,
  etiqueta,
  valor,
  detalle,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e7e7e7",
        borderRadius: 10,
        padding: 18,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 15,
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            border:
              "1px solid #e5e5e5",
            borderRadius: 7,
            display: "grid",
            placeItems: "center",
            color: "#333",
          }}
        >
          <Icono
            nombre={icono}
            size={16}
          />
        </span>

        {detalle && (
          <span
            style={{
              fontSize: 10,
              color: "#999",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.06em",
              textAlign: "right",
            }}
          >
            {detalle}
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing:
            "-0.04em",
          overflow: "hidden",
          textOverflow:
            "ellipsis",
          whiteSpace:
            "nowrap",
        }}
      >
        {valor}
      </div>

      <div
        style={{
          marginTop: 4,
          color: "#777",
          fontSize: 12,
        }}
      >
        {etiqueta}
      </div>
    </div>
  )
}

function BloqueTitulo({
  titulo,
  descripcion,
}) {
  return (
    <div
      style={{
        marginBottom: 18,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {titulo}
      </h2>

      {descripcion && (
        <p
          style={{
            margin: "5px 0 0",
            color: "#888",
            fontSize: 12,
          }}
        >
          {descripcion}
        </p>
      )}
    </div>
  )
}

function BarraHorizontal({
  etiqueta,
  valor,
  maximo,
  detalle,
}) {
  const porcentaje =
    maximo > 0
      ? Math.min(
          100,
          (valor / maximo) *
            100
        )
      : 0

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: 15,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow:
              "ellipsis",
            whiteSpace:
              "nowrap",
          }}
        >
          {etiqueta}
        </span>

        <span
          style={{
            fontSize: 12,
            color: "#666",
            whiteSpace:
              "nowrap",
          }}
        >
          {detalle}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: 7,
          borderRadius: 999,
          background: "#f0f0f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${porcentaje}%`,
            height: "100%",
            background: "#111",
            borderRadius: 999,
            transition:
              "width .3s ease",
          }}
        />
      </div>
    </div>
  )
}

function IndicadorCanal({
  icono,
  titulo,
  pedidos,
  ventas,
  totalPedidos,
}) {
  const porcentaje =
    totalPedidos > 0
      ? (pedidos /
          totalPedidos) *
        100
      : 0

  return (
    <div
      style={{
        border:
          "1px solid #eee",
        borderRadius: 9,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            border:
              "1px solid #e5e5e5",
            borderRadius: 7,
            display: "grid",
            placeItems:
              "center",
            color: "#333",
          }}
        >
          <Icono
            nombre={icono}
            size={15}
          />
        </span>

        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {titulo}
        </span>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          justifyContent:
            "space-between",
          gap: 15,
          alignItems:
            "flex-end",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 21,
              fontWeight: 600,
              letterSpacing:
                "-0.03em",
            }}
          >
            {pedidos}
          </div>

          <div
            style={{
              marginTop: 3,
              color: "#888",
              fontSize: 11,
            }}
          >
            pedidos
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <FormatoMoneda
              valor={ventas}
            />
          </div>

          <div
            style={{
              marginTop: 3,
              color: "#888",
              fontSize: 11,
            }}
          >
            {porcentaje.toFixed(
              0
            )}
            % de los pedidos
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          height: 6,
          background: "#f0f0f0",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${porcentaje}%`,
            height: "100%",
            background: "#111",
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  )
}

export default function EstadisticasAdmin() {
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
    periodo,
    setPeriodo,
  ] = useState("30")

  const [
    actualizando,
    setActualizando,
  ] = useState(false)

  async function cargarDatos(
    mostrarCarga = true
  ) {
    if (mostrarCarga) {
      setCargando(true)
    } else {
      setActualizando(true)
    }

    setError("")

    const {
      data,
      error: queryError,
    } = await supabase
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
          ascending: true,
        }
      )

    if (queryError) {
      console.error(
        "Error cargando estadísticas:",
        queryError
      )

      setError(
        queryError.message ||
          "No se pudieron cargar las estadísticas."
      )

      setOrders([])

      setCargando(false)
      setActualizando(false)

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
    setActualizando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const pedidosPeriodo =
    useMemo(() => {
      if (
        periodo === "todo"
      ) {
        return orders
      }

      const dias = Number(
        periodo
      )

      if (
        !Number.isFinite(
          dias
        )
      ) {
        return orders
      }

      const hoy =
        obtenerHoyPeru()

      const inicio =
        sumarDiasClave(
          hoy,
          -(dias - 1)
        )

      if (!inicio) {
        return []
      }

      return orders.filter(
        (order) => {
          const fecha =
            obtenerClaveFecha(
              order.created_at
            )

          if (!fecha) {
            return false
          }

          return (
            fecha >= inicio &&
            fecha <= hoy
          )
        }
      )
    }, [
      orders,
      periodo,
    ])

  const pedidosCompletados =
    useMemo(() => {
      return pedidosPeriodo.filter(
        (order) =>
          normalizarEstado(
            order.status
          ) === "Completado"
      )
    }, [
      pedidosPeriodo,
    ])

  const pedidosPendientes =
    useMemo(() => {
      return pedidosPeriodo.filter(
        (order) =>
          normalizarEstado(
            order.status
          ) !== "Completado"
      )
    }, [
      pedidosPeriodo,
    ])

  const estadisticas =
    useMemo(() => {
      const totalPedidos =
        pedidosPeriodo.length

      const ventasTotales =
        pedidosCompletados.reduce(
          (
            suma,
            order
          ) =>
            suma +
            obtenerTotal(
              order
            ),
          0
        )

      const productosVendidos =
        pedidosCompletados.reduce(
          (
            suma,
            order
          ) =>
            suma +
            obtenerCantidadProductos(
              order
            ),
          0
        )

      const online =
        pedidosCompletados.filter(
          (order) =>
            obtenerTipoPedido(
              order
            ) === "online"
        )

      const fisicas =
        pedidosCompletados.filter(
          (order) =>
            obtenerTipoPedido(
              order
            ) === "fisica"
        )

      const ventasOnline =
        online.reduce(
          (
            suma,
            order
          ) =>
            suma +
            obtenerTotal(
              order
            ),
          0
        )

      const ventasFisicas =
        fisicas.reduce(
          (
            suma,
            order
          ) =>
            suma +
            obtenerTotal(
              order
            ),
          0
        )

      const ticketPromedio =
        pedidosCompletados.length >
        0
          ? ventasTotales /
            pedidosCompletados.length
          : 0

      const descuentoTotal =
        pedidosCompletados.reduce(
          (
            suma,
            order
          ) =>
            suma +
            Math.max(
              0,
              Number(
                order.discount ||
                  0
              )
            ),
          0
        )

      return {
        totalPedidos,
        ventasTotales,
        pedidosCompletados:
          pedidosCompletados.length,
        pedidosPendientes:
          pedidosPendientes.length,
        productosVendidos,
        online:
          online.length,
        fisicas:
          fisicas.length,
        ventasOnline,
        ventasFisicas,
        ticketPromedio,
        descuentoTotal,
      }
    }, [
      pedidosPeriodo,
      pedidosCompletados,
      pedidosPendientes,
    ])

  const productosMasVendidos =
    useMemo(() => {
      const mapa =
        new Map()

      pedidosCompletados.forEach(
        (order) => {
          ;(
            order.order_items ||
            []
          ).forEach(
            (item) => {
              const nombre =
                String(
                  item.product_name ||
                    item.name ||
                    "Producto"
                ).trim() ||
                "Producto"

              const cantidad =
                Number(
                  item.quantity ||
                    0
                )

              const subtotal =
                Number(
                  item.subtotal
                )

              const precio =
                Number(
                  item.unit_price ||
                    item.price ||
                    0
                )

              const venta =
                Number.isFinite(
                  subtotal
                )
                  ? subtotal
                  : precio *
                    cantidad

              const actual =
                mapa.get(
                  nombre
                ) || {
                  nombre,
                  cantidad: 0,
                  ventas: 0,
                }

              actual.cantidad +=
                cantidad

              actual.ventas +=
                Number.isFinite(
                  venta
                )
                  ? venta
                  : 0

              mapa.set(
                nombre,
                actual
              )
            }
          )
        }
      )

      return [
        ...mapa.values(),
      ]
        .sort(
          (a, b) => {
            if (
              b.cantidad !==
              a.cantidad
            ) {
              return (
                b.cantidad -
                a.cantidad
              )
            }

            return (
              b.ventas -
              a.ventas
            )
          }
        )
        .slice(0, 5)
    }, [
      pedidosCompletados,
    ])

  const maxProductos =
    Math.max(
      ...productosMasVendidos.map(
        (item) =>
          item.cantidad
      ),
      1
    )

  const estados =
    useMemo(() => {
      return {
        completados:
          pedidosCompletados.length,
        pendientes:
          pedidosPendientes.length,
      }
    }, [
      pedidosCompletados,
      pedidosPendientes,
    ])

  const periodoAnterior =
    useMemo(() => {
      if (
        periodo === "todo"
      ) {
        return null
      }

      const dias = Number(
        periodo
      )

      if (
        !Number.isFinite(
          dias
        )
      ) {
        return null
      }

      const hoy =
        obtenerHoyPeru()

      const inicioActual =
        sumarDiasClave(
          hoy,
          -(dias - 1)
        )

      if (!inicioActual) {
        return null
      }

      const finAnterior =
        sumarDiasClave(
          inicioActual,
          -1
        )

      const inicioAnterior =
        sumarDiasClave(
          inicioActual,
          -dias
        )

      if (
        !finAnterior ||
        !inicioAnterior
      ) {
        return null
      }

      const anteriores =
        orders.filter(
          (order) => {
            const fecha =
              obtenerClaveFecha(
                order.created_at
              )

            if (!fecha) {
              return false
            }

            return (
              fecha >=
                inicioAnterior &&
              fecha <=
                finAnterior
            )
          }
        )

      const anterioresCompletados =
        anteriores.filter(
          (order) =>
            normalizarEstado(
              order.status
            ) ===
            "Completado"
        )

      const ventas =
        anterioresCompletados.reduce(
          (
            suma,
            order
          ) =>
            suma +
            obtenerTotal(
              order
            ),
          0
        )

      return {
        ventas,
        pedidos:
          anteriores.length,
      }
    }, [
      orders,
      periodo,
    ])

  function obtenerVariacion(
    actual,
    anterior
  ) {
    if (
      anterior === null ||
      anterior === undefined
    ) {
      return null
    }

    if (
      anterior === 0
    ) {
      if (
        actual === 0
      ) {
        return 0
      }

      return 100
    }

    return (
      ((actual -
        anterior) /
        anterior) *
      100
    )
  }

  const variacionVentas =
    periodoAnterior
      ? obtenerVariacion(
          estadisticas.ventasTotales,
          periodoAnterior.ventas
        )
      : null

  const variacionPedidos =
    periodoAnterior
      ? obtenerVariacion(
          estadisticas.totalPedidos,
          periodoAnterior.pedidos
        )
      : null

  function obtenerTextoVariacion(
    variacion
  ) {
    if (
      variacion === null
    ) {
      return "Sin comparación"
    }

    if (
      variacion === 0
    ) {
      return "Igual que el período anterior"
    }

    return `${
      variacion > 0
        ? "+"
        : ""
    }${variacion.toFixed(
      1
    )}% vs. período anterior`
  }

  return (
    <div
      style={
        ESTILOS.pagina
      }
    >
      <style>{`
        .gmish-stats-button:hover {
          opacity: .82;
        }

        .gmish-stats-refresh:hover {
          background: #f5f5f5 !important;
        }

        .gmish-stats-select:focus {
          border-color: #999 !important;
          box-shadow: 0 0 0 3px rgba(0,0,0,.04);
        }

        @media (max-width: 1100px) {
          .gmish-stats-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .gmish-stats-main-grid {
            grid-template-columns: 1fr !important;
          }

          .gmish-stats-secondary-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 650px) {
          .gmish-stats-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .gmish-stats-secondary-grid {
            grid-template-columns: 1fr !important;
          }

          .gmish-stats-header-controls {
            width: 100%;
          }

          .gmish-stats-header-controls select,
          .gmish-stats-header-controls button {
            flex: 1;
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
            Estadísticas
          </h1>

          <p
            style={
              ESTILOS.subtitulo
            }
          >
            Analiza las ventas, pedidos
            y productos de GMISH.
          </p>
        </div>

        <div
          className="gmish-stats-header-controls"
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: 8,
            flexWrap:
              "wrap",
          }}
        >
          <select
            className="gmish-stats-select"
            value={periodo}
            onChange={(event) =>
              setPeriodo(
                event.target.value
              )
            }
            style={{
              height: 42,
              minWidth: 165,
              border:
                "1px solid #ddd",
              borderRadius: 8,
              padding:
                "0 34px 0 12px",
              background:
                "#fff",
              color: "#111",
              outline: "none",
              fontSize: 13,
              cursor:
                "pointer",
            }}
          >
            {PERIODOS.map(
              (item) => (
                <option
                  key={
                    item.value
                  }
                  value={
                    item.value
                  }
                >
                  {item.label}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            className="gmish-stats-refresh"
            onClick={() =>
              cargarDatos(
                false
              )
            }
            disabled={
              actualizando
            }
            style={{
              ...ESTILOS.botonSecundario,
              opacity:
                actualizando
                  ? 0.6
                  : 1,
              cursor:
                actualizando
                  ? "wait"
                  : "pointer",
            }}
          >
            <Icono
              nombre="refresh"
              size={15}
            />

            {actualizando
              ? "Actualizando..."
              : "Actualizar"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 18,
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
            display: "flex",
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
              border: "none",
              background:
                "transparent",
              color:
                "#a12a2a",
              cursor:
                "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>
      )}

      {cargando ? (
        <div
          style={{
            minHeight: 450,
            display: "grid",
            placeItems:
              "center",
            color: "#888",
            fontSize: 13,
            border:
              "1px solid #e7e7e7",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          Cargando estadísticas...
        </div>
      ) : (
        <>
          <div
            className="gmish-stats-metrics"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4,minmax(0,1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <TarjetaMetrica
              icono="money"
              etiqueta="Ventas realizadas"
              valor={
                <FormatoMoneda
                  valor={
                    estadisticas.ventasTotales
                  }
                />
              }
              detalle={
                variacionVentas ===
                null ? (
                  "Período"
                ) : (
                  <span
                    style={{
                      color:
                        variacionVentas >=
                        0
                          ? "#28633a"
                          : "#a12a2a",
                    }}
                  >
                    {variacionVentas >=
                    0
                      ? "↑"
                      : "↓"}{" "}
                    {Math.abs(
                      variacionVentas
                    ).toFixed(
                      1
                    )}
                    %
                  </span>
                )
              }
            />

            <TarjetaMetrica
              icono="box"
              etiqueta="Pedidos"
              valor={
                estadisticas.totalPedidos
              }
              detalle={
                variacionPedidos ===
                null ? (
                  "Período"
                ) : (
                  <span
                    style={{
                      color:
                        variacionPedidos >=
                        0
                          ? "#28633a"
                          : "#a12a2a",
                    }}
                  >
                    {variacionPedidos >=
                    0
                      ? "↑"
                      : "↓"}{" "}
                    {Math.abs(
                      variacionPedidos
                    ).toFixed(
                      1
                    )}
                    %
                  </span>
                )
              }
            />

            <TarjetaMetrica
              icono="cart"
              etiqueta="Productos vendidos"
              valor={
                estadisticas.productosVendidos
              }
              detalle="Unidades"
            />

            <TarjetaMetrica
              icono="chart"
              etiqueta="Ticket promedio"
              valor={
                <FormatoMoneda
                  valor={
                    estadisticas.ticketPromedio
                  }
                />
              }
              detalle="Por venta"
            />
          </div>

          <GraficaVentas
            orders={orders}
            obtenerTotal={obtenerTotal}
            obtenerTipoPedido={
              obtenerTipoPedido
            }
          />

          <div
            className="gmish-stats-main-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1.55fr) minmax(300px,.85fr)",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <section
              style={{
                border:
                  "1px solid #e7e7e7",
                borderRadius: 10,
                background: "#fff",
                padding: 20,
              }}
            >
              <BloqueTitulo
                titulo="Estado de pedidos"
                descripcion="Distribución de las operaciones registradas en el período."
              />

              <div
                style={{
                  display: "grid",
                  gap: 18,
                  marginTop: 24,
                }}
              >
                <BarraHorizontal
                  etiqueta="Completados"
                  valor={
                    estados.completados
                  }
                  maximo={
                    estadisticas.totalPedidos
                  }
                  detalle={`${estados.completados} pedido${
                    estados.completados ===
                    1
                      ? ""
                      : "s"
                  }`}
                />

                <BarraHorizontal
                  etiqueta="Pendientes"
                  valor={
                    estados.pendientes
                  }
                  maximo={
                    estadisticas.totalPedidos
                  }
                  detalle={`${estados.pendientes} pedido${
                    estados.pendientes ===
                    1
                      ? ""
                      : "s"
                  }`}
                />
              </div>

              <div
                style={{
                  marginTop: 30,
                  paddingTop: 20,
                  borderTop:
                    "1px solid #eee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: 15,
                  }}
                >
                  <span
                    style={{
                      color: "#777",
                      fontSize: 12,
                    }}
                  >
                    Descuentos aplicados
                  </span>

                  <strong
                    style={{
                      fontSize: 14,
                    }}
                  >
                    <FormatoMoneda
                      valor={
                        estadisticas.descuentoTotal
                      }
                    />
                  </strong>
                </div>
              </div>
            </section>

            <section
              style={{
                border:
                  "1px solid #e7e7e7",
                borderRadius: 10,
                background: "#fff",
                padding: 20,
              }}
            >
              <BloqueTitulo
                titulo="Resumen"
                descripcion="Indicadores principales del período."
              />

              <div
                style={{
                  display: "grid",
                  gap: 13,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: 15,
                    paddingBottom:
                      13,
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <span
                    style={{
                      color: "#777",
                      fontSize: 12,
                    }}
                  >
                    Pedidos completados
                  </span>

                  <strong
                    style={{
                      fontSize: 14,
                    }}
                  >
                    {
                      estadisticas.pedidosCompletados
                    }
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: 15,
                    paddingBottom:
                      13,
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <span
                    style={{
                      color: "#777",
                      fontSize: 12,
                    }}
                  >
                    Pedidos pendientes
                  </span>

                  <strong
                    style={{
                      fontSize: 14,
                    }}
                  >
                    {
                      estadisticas.pedidosPendientes
                    }
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: 15,
                    paddingBottom:
                      13,
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <span
                    style={{
                      color: "#777",
                      fontSize: 12,
                    }}
                  >
                    Venta online
                  </span>

                  <strong
                    style={{
                      fontSize: 14,
                    }}
                  >
                    <FormatoMoneda
                      valor={
                        estadisticas.ventasOnline
                      }
                    />
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: 15,
                  }}
                >
                  <span
                    style={{
                      color: "#777",
                      fontSize: 12,
                    }}
                  >
                    Venta en tienda
                  </span>

                  <strong
                    style={{
                      fontSize: 14,
                    }}
                  >
                    <FormatoMoneda
                      valor={
                        estadisticas.ventasFisicas
                      }
                    />
                  </strong>
                </div>
              </div>
            </section>
          </div>

          <section
            style={{
              border:
                "1px solid #e7e7e7",
              borderRadius: 10,
              background: "#fff",
              padding: 20,
              marginBottom: 18,
            }}
          >
            <BloqueTitulo
              titulo="Canales de venta"
              descripcion="Comparación entre las ventas realizadas en tienda física y online."
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 12,
              }}
            >
              <IndicadorCanal
                icono="store"
                titulo="Tienda"
                pedidos={
                  estadisticas.fisicas
                }
                ventas={
                  estadisticas.ventasFisicas
                }
                totalPedidos={
                  estadisticas.pedidosCompletados
                }
              />

              <IndicadorCanal
                icono="globe"
                titulo="Online"
                pedidos={
                  estadisticas.online
                }
                ventas={
                  estadisticas.ventasOnline
                }
                totalPedidos={
                  estadisticas.pedidosCompletados
                }
              />
            </div>
          </section>

          <section
            style={{
              border:
                "1px solid #e7e7e7",
              borderRadius: 10,
              background: "#fff",
              padding: 20,
              marginBottom: 18,
            }}
          >
            <BloqueTitulo
              titulo="Productos más vendidos"
              descripcion="Productos con mayor cantidad de unidades vendidas en el período seleccionado."
            />

            {productosMasVendidos.length ===
            0 ? (
              <div
                style={{
                  minHeight: 180,
                  display: "grid",
                  placeItems:
                    "center",
                  color: "#888",
                  fontSize: 13,
                  border:
                    "1px dashed #ddd",
                  borderRadius: 9,
                }}
              >
                Todavía no hay productos
                vendidos en este período.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 18,
                }}
              >
                {productosMasVendidos.map(
                  (
                    producto,
                    index
                  ) => (
                    <div
                      key={
                        producto.nombre
                      }
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "28px minmax(150px,1fr) 90px",
                        gap: 12,
                        alignItems:
                          "center",
                      }}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          border:
                            "1px solid #e5e5e5",
                          borderRadius:
                            7,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          fontSize: 11,
                          fontWeight: 600,
                          color:
                            "#555",
                        }}
                      >
                        {index + 1}
                      </span>

                      <BarraHorizontal
                        etiqueta={
                          producto.nombre
                        }
                        valor={
                          producto.cantidad
                        }
                        maximo={
                          maxProductos
                        }
                        detalle={`${producto.cantidad} ud.`}
                      />

                      <div
                        style={{
                          textAlign:
                            "right",
                          fontSize: 12,
                          fontWeight:
                            600,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        <FormatoMoneda
                          valor={
                            producto.ventas
                          }
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {periodo !== "todo" &&
            periodoAnterior && (
              <div
                style={{
                  border:
                    "1px solid #e7e7e7",
                  borderRadius: 10,
                  background:
                    "#fafafa",
                  padding:
                    "13px 16px",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: 15,
                  flexWrap:
                    "wrap",
                  color: "#777",
                  fontSize: 12,
                }}
              >
                <span>
                  Comparación de ventas
                  realizadas con el período
                  anterior:
                </span>

                <span
                  style={{
                    color:
                      variacionVentas !==
                        null &&
                      variacionVentas >=
                        0
                        ? "#28633a"
                        : "#a12a2a",
                    fontWeight: 600,
                  }}
                >
                  {obtenerTextoVariacion(
                    variacionVentas
                  )}
                </span>
              </div>
            )}
        </>
      )}
    </div>
  )
}