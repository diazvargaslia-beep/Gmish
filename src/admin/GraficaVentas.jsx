import { useMemo, useState } from "react"

const MONEDA = "S/"
const ZONA_HORARIA = "America/Lima"

const FORMATEADOR_FECHA_CLAVE =
  new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

const FORMATEADOR_MONEDA =
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

function obtenerClaveFechaPeru(fecha) {
  if (!fecha) {
    return null
  }

  const date = new Date(fecha)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return FORMATEADOR_FECHA_CLAVE.format(date)
}

function fechaDesdeClave(clave) {
  if (!clave) {
    return null
  }

  return new Date(`${clave}T12:00:00Z`)
}

function sumarDiasClave(clave, cantidad) {
  const date = fechaDesdeClave(clave)

  if (!date) {
    return null
  }

  date.setUTCDate(
    date.getUTCDate() + cantidad
  )

  return date.toISOString().slice(0, 10)
}

function obtenerHoyPeru() {
  return obtenerClaveFechaPeru(new Date())
}

function formatearMoneda(valor) {
  return `${MONEDA} ${FORMATEADOR_MONEDA.format(
    Number(valor) || 0
  )}`
}

function formatearNumero(valor) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 1,
  }).format(Number(valor) || 0)
}

function formatearFechaCorta(clave) {
  const fecha = fechaDesdeClave(clave)

  if (!fecha) {
    return ""
  }

  return fecha
    .toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    })
    .replace(".", "")
}

function formatearFechaCompleta(clave) {
  const fecha = fechaDesdeClave(clave)

  if (!fecha) {
    return ""
  }

  const texto = fecha.toLocaleDateString(
    "es-PE",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  )

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  )
}

function normalizarEstado(estado) {
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

function obtenerMaximoBonito(valor) {
  const numero = Number(valor) || 0

  if (numero <= 0) {
    return 100
  }

  const potencia = Math.pow(
    10,
    Math.floor(Math.log10(numero))
  )

  const normalizado =
    numero / potencia

  let multiplicador = 10

  if (normalizado <= 1) {
    multiplicador = 1
  } else if (normalizado <= 2) {
    multiplicador = 2
  } else if (normalizado <= 2.5) {
    multiplicador = 2.5
  } else if (normalizado <= 5) {
    multiplicador = 5
  }

  return multiplicador * potencia
}

function construirRangoDias(
  cantidad,
  ultimoDia
) {
  const dias = []

  for (
    let i = cantidad - 1;
    i >= 0;
    i--
  ) {
    dias.push(
      sumarDiasClave(
        ultimoDia,
        -i
      )
    )
  }

  return dias
}

export default function GraficaVentas({
  orders = [],
  obtenerTotal,
  obtenerTipoPedido,
}) {
  const [periodo, setPeriodo] =
    useState(30)

  const [metrica, setMetrica] =
    useState("ventas")

  const [estado, setEstado] =
    useState("todos")

  const [puntoActivo, setPuntoActivo] =
    useState(null)

  const datos = useMemo(() => {
    const hoy = obtenerHoyPeru()

    const diasActuales =
      construirRangoDias(
        periodo,
        hoy
      )

    const inicioActual =
      diasActuales[0]

    const finAnterior =
      sumarDiasClave(
        inicioActual,
        -1
      )

    const diasAnteriores =
      construirRangoDias(
        periodo,
        finAnterior
      )

    const mapaActual = {}
    const mapaAnterior = {}

    diasActuales.forEach(
      (dia) => {
        mapaActual[dia] = {
          ventas: 0,
          pedidos: 0,
          fisicas: 0,
          online: 0,
        }
      }
    )

    diasAnteriores.forEach(
      (dia) => {
        mapaAnterior[dia] = {
          ventas: 0,
          pedidos: 0,
        }
      }
    )

    let ventasFisicas = 0
    let ventasOnline = 0

    let pedidosFisicos = 0
    let pedidosOnline = 0

    orders.forEach(
      (order) => {
        if (
          estado === "completados" &&
          normalizarEstado(
            order.status
          ) !== "Completado"
        ) {
          return
        }

        const fecha =
          obtenerClaveFechaPeru(
            order.created_at
          )

        if (!fecha) {
          return
        }

        const total =
          typeof obtenerTotal ===
          "function"
            ? Number(
                obtenerTotal(
                  order
                )
              ) || 0
            : Number(
                order.total
              ) || 0

        const tipo =
          typeof obtenerTipoPedido ===
          "function"
            ? obtenerTipoPedido(
                order
              )
            : "online"

        if (
          mapaActual[fecha]
        ) {
          mapaActual[fecha].ventas +=
            total

          mapaActual[fecha].pedidos +=
            1

          if (
            tipo === "fisica"
          ) {
            mapaActual[fecha].fisicas +=
              total

            ventasFisicas +=
              total

            pedidosFisicos +=
              1
          } else {
            mapaActual[fecha].online +=
              total

            ventasOnline +=
              total

            pedidosOnline +=
              1
          }
        }

        if (
          mapaAnterior[fecha]
        ) {
          mapaAnterior[fecha].ventas +=
            total

          mapaAnterior[fecha].pedidos +=
            1
        }
      }
    )

    const filas =
      diasActuales.map(
        (dia) => ({
          fecha: dia,
          ventas:
            mapaActual[dia]
              ?.ventas || 0,
          pedidos:
            mapaActual[dia]
              ?.pedidos || 0,
          fisicas:
            mapaActual[dia]
              ?.fisicas || 0,
          online:
            mapaActual[dia]
              ?.online || 0,
        })
      )

    const ventasPeriodo =
      filas.reduce(
        (suma, dia) =>
          suma + dia.ventas,
        0
      )

    const pedidosPeriodo =
      filas.reduce(
        (suma, dia) =>
          suma + dia.pedidos,
        0
      )

    const ventasPeriodoAnterior =
      diasAnteriores.reduce(
        (suma, dia) =>
          suma +
          (
            mapaAnterior[dia]
              ?.ventas || 0
          ),
        0
      )

    const pedidosPeriodoAnterior =
      diasAnteriores.reduce(
        (suma, dia) =>
          suma +
          (
            mapaAnterior[dia]
              ?.pedidos || 0
          ),
        0
      )

    const valores =
      filas.map(
        (dia) =>
          metrica === "ventas"
            ? dia.ventas
            : dia.pedidos
      )

    const total =
      metrica === "ventas"
        ? ventasPeriodo
        : pedidosPeriodo

    const totalAnterior =
      metrica === "ventas"
        ? ventasPeriodoAnterior
        : pedidosPeriodoAnterior

    const promedio =
      total / periodo

    const diasConVentas =
      filas.filter(
        (dia) =>
          dia.ventas > 0
      ).length

    const mejorDia =
      filas.reduce(
        (mejor, dia) => {
          const valor =
            metrica === "ventas"
              ? dia.ventas
              : dia.pedidos

          const mejorValor =
            metrica === "ventas"
              ? mejor.ventas
              : mejor.pedidos

          return valor >
            mejorValor
            ? dia
            : mejor
        },
        filas[0] || {
          fecha: hoy,
          ventas: 0,
          pedidos: 0,
        }
      )

    let variacion = 0

    if (
      totalAnterior === 0
    ) {
      variacion =
        total > 0
          ? 100
          : 0
    } else {
      variacion =
        ((total -
          totalAnterior) /
          totalAnterior) *
        100
    }

    return {
      filas,
      valores,
      total,
      totalAnterior,
      promedio,
      mejorDia,
      diasConVentas,
      ventasFisicas,
      ventasOnline,
      pedidosFisicos,
      pedidosOnline,
      variacion,
    }
  }, [
    orders,
    periodo,
    metrica,
    estado,
    obtenerTotal,
    obtenerTipoPedido,
  ])

  const ancho = 1000
  const alto = 360

  const margenIzquierdo = 72
  const margenDerecho = 24
  const margenSuperior = 28
  const margenInferior = 58

  const anchoGrafica =
    ancho -
    margenIzquierdo -
    margenDerecho

  const altoGrafica =
    alto -
    margenSuperior -
    margenInferior

  const maximo =
    obtenerMaximoBonito(
      Math.max(
        ...datos.valores,
        0
      )
    )

  const puntos = datos.filas.map(
    (dia, indice) => {
      const valor =
        metrica === "ventas"
          ? dia.ventas
          : dia.pedidos

      const x =
        datos.filas.length === 1
          ? margenIzquierdo +
            anchoGrafica / 2
          : margenIzquierdo +
            (
              indice /
              (datos.filas.length -
                1)
            ) *
              anchoGrafica

      const y =
        margenSuperior +
        altoGrafica -
        (valor / maximo) *
          altoGrafica

      return {
        ...dia,
        valor,
        x,
        y,
      }
    }
  )

  const linea =
    puntos
      .map(
        (punto, indice) =>
          `${
            indice === 0
              ? "M"
              : "L"
          } ${punto.x} ${punto.y}`
      )
      .join(" ")

  const area =
    puntos.length > 0
      ? `${linea} L ${
          puntos[
            puntos.length - 1
          ].x
        } ${
          margenSuperior +
          altoGrafica
        } L ${
          puntos[0].x
        } ${
          margenSuperior +
          altoGrafica
        } Z`
      : ""

  const yPromedio =
    margenSuperior +
    altoGrafica -
    (datos.promedio /
      maximo) *
      altoGrafica

  const etiquetasX =
    periodo === 7
      ? puntos
      : periodo === 30
      ? puntos.filter(
          (_, indice) =>
            indice === 0 ||
            indice === 6 ||
            indice === 13 ||
            indice === 20 ||
            indice === 27 ||
            indice === 29
        )
      : puntos.filter(
          (_, indice) =>
            indice === 0 ||
            indice === 14 ||
            indice === 29 ||
            indice === 44 ||
            indice === 59 ||
            indice === 74 ||
            indice === 89
        )

  function formatearEje(valor) {
    if (
      metrica === "pedidos"
    ) {
      return String(
        Math.round(valor)
      )
    }

    if (
      valor >= 1000
    ) {
      return `${MONEDA}${(
        valor / 1000
      ).toFixed(1)}k`
    }

    return `${MONEDA}${Math.round(
      valor
    )}`
  }

  function formatearValorTooltip(
    valor
  ) {
    if (
      metrica === "ventas"
    ) {
      return formatearMoneda(
        valor
      )
    }

    return `${formatearNumero(
      valor
    )} ${
      valor === 1
        ? "pedido"
        : "pedidos"
    }`
  }

  function formatearKPI(
    valor
  ) {
    if (
      metrica === "ventas"
    ) {
      return formatearMoneda(
        valor
      )
    }

    return formatearNumero(
      valor
    )
  }

  const mejorDiaValor =
    metrica === "ventas"
      ? datos.mejorDia
          ?.ventas || 0
      : datos.mejorDia
          ?.pedidos || 0

  return (
    <section
      className="gmish-sales-chart"
      style={{
        border:
          "1px solid #e7e7e7",
        borderRadius: 10,
        background:
          "#fff",
        marginBottom: 22,
        overflow:
          "hidden",
      }}
    >
      <style>{`
        .gmish-sales-control {
          height: 36px;
          border: 1px solid #e1e1e1;
          background: #fff;
          border-radius: 7px;
          padding: 0 11px;
          font-size: 12px;
          color: #333;
          outline: none;
          cursor: pointer;
        }

        .gmish-sales-control:hover {
          border-color: #bbb;
        }

        .gmish-sales-control:focus {
          border-color: #999;
          box-shadow: 0 0 0 3px rgba(0,0,0,.04);
        }

        .gmish-sales-period {
          display: flex;
          align-items: center;
          border: 1px solid #e1e1e1;
          border-radius: 7px;
          overflow: hidden;
          background: #fff;
        }

        .gmish-sales-period button {
          height: 34px;
          min-width: 44px;
          border: none;
          border-right: 1px solid #e5e5e5;
          background: #fff;
          color: #777;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        }

        .gmish-sales-period button:last-child {
          border-right: none;
        }

        .gmish-sales-period button:hover {
          background: #f8f8f8;
          color: #111;
        }

        .gmish-sales-period button.active {
          background: #111;
          color: #fff;
        }

        .gmish-sales-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .gmish-sales-kpi {
          border: 1px solid #ededed;
          border-radius: 8px;
          padding: 13px 14px;
          background: #fff;
        }

        .gmish-sales-channel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .gmish-sales-channel {
          border: 1px solid #ededed;
          border-radius: 8px;
          padding: 13px 14px;
          background: #fafafa;
        }

        .gmish-sales-chart-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .gmish-sales-chart-scroll svg {
          display: block;
          width: 100%;
          min-width: 700px;
        }

        @media (max-width: 850px) {
          .gmish-sales-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .gmish-sales-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }

        @media (max-width: 550px) {
          .gmish-sales-kpis {
            grid-template-columns: 1fr 1fr;
          }

          .gmish-sales-channel-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        className="gmish-sales-header"
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
            "flex-start",
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
              gap: 9,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius:
                  "50%",
                background:
                  "#111",
              }}
            />

            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: "#111",
              }}
            >
              Estadísticas de ventas
            </h2>
          </div>

          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "#888",
              fontSize: 12,
            }}
          >
            Evolución de la actividad
            comercial de GMISH
          </p>
        </div>

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: 8,
            flexWrap:
              "wrap",
            justifyContent:
              "flex-end",
          }}
        >
          <div className="gmish-sales-period">
            {[7, 30, 90].map(
              (cantidad) => (
                <button
                  key={
                    cantidad
                  }
                  type="button"
                  className={
                    periodo ===
                    cantidad
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setPeriodo(
                      cantidad
                    )
                    setPuntoActivo(
                      null
                    )
                  }}
                >
                  {cantidad}d
                </button>
              )
            )}
          </div>

          <select
            className="gmish-sales-control"
            value={metrica}
            onChange={(
              event
            ) => {
              setMetrica(
                event.target.value
              )
              setPuntoActivo(
                null
              )
            }}
            aria-label="Métrica"
          >
            <option value="ventas">
              Ventas
            </option>

            <option value="pedidos">
              Pedidos
            </option>
          </select>

          <select
            className="gmish-sales-control"
            value={estado}
            onChange={(
              event
            ) => {
              setEstado(
                event.target.value
              )
              setPuntoActivo(
                null
              )
            }}
            aria-label="Estado"
          >
            <option value="todos">
              Todos
            </option>

            <option value="completados">
              Completados
            </option>
          </select>
        </div>
      </div>

      <div
        style={{
          padding:
            "16px 20px 20px",
        }}
      >
        <div className="gmish-sales-kpis">
          <div className="gmish-sales-kpi">
            <div
              style={{
                color:
                  "#888",
                fontSize: 10,
                textTransform:
                  "uppercase",
                letterSpacing:
                  ".08em",
                fontWeight:
                  600,
              }}
            >
              Total del período
            </div>

            <div
              style={{
                marginTop: 7,
                fontSize: 20,
                lineHeight: 1.1,
                fontWeight:
                  600,
                color:
                  "#111",
              }}
            >
              {formatearKPI(
                datos.total
              )}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color:
                  datos.variacion >=
                  0
                    ? "#28633a"
                    : "#a12a2a",
              }}
            >
              {datos.variacion >=
              0
                ? "↑"
                : "↓"}{" "}
              {Math.abs(
                datos.variacion
              ).toFixed(1)}
              % vs. período anterior
            </div>
          </div>

          <div className="gmish-sales-kpi">
            <div
              style={{
                color:
                  "#888",
                fontSize: 10,
                textTransform:
                  "uppercase",
                letterSpacing:
                  ".08em",
                fontWeight:
                  600,
              }}
            >
              Promedio diario
            </div>

            <div
              style={{
                marginTop: 7,
                fontSize: 20,
                lineHeight: 1.1,
                fontWeight:
                  600,
                color:
                  "#111",
              }}
            >
              {formatearKPI(
                datos.promedio
              )}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color:
                  "#999",
              }}
            >
              {periodo} días analizados
            </div>
          </div>

          <div className="gmish-sales-kpi">
            <div
              style={{
                color:
                  "#888",
                fontSize: 10,
                textTransform:
                  "uppercase",
                letterSpacing:
                  ".08em",
                fontWeight:
                  600,
              }}
            >
              Mejor día
            </div>

            <div
              style={{
                marginTop: 7,
                fontSize: 20,
                lineHeight: 1.1,
                fontWeight:
                  600,
                color:
                  "#111",
              }}
            >
              {formatearKPI(
                mejorDiaValor
              )}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color:
                  "#999",
                whiteSpace:
                  "nowrap",
                overflow:
                  "hidden",
                textOverflow:
                  "ellipsis",
              }}
            >
              {formatearFechaCorta(
                datos.mejorDia
                  ?.fecha
              )}
            </div>
          </div>

          <div className="gmish-sales-kpi">
            <div
              style={{
                color:
                  "#888",
                fontSize: 10,
                textTransform:
                  "uppercase",
                letterSpacing:
                  ".08em",
                fontWeight:
                  600,
              }}
            >
              Actividad
            </div>

            <div
              style={{
                marginTop: 7,
                fontSize: 20,
                lineHeight: 1.1,
                fontWeight:
                  600,
                color:
                  "#111",
              }}
            >
              {formatearNumero(
                datos.filas.reduce(
                  (
                    suma,
                    dia
                  ) =>
                    suma +
                    dia.pedidos,
                  0
                )
              )}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color:
                  "#999",
              }}
            >
              pedidos registrados
            </div>
          </div>
        </div>

        <div
          className="gmish-sales-chart-scroll"
          style={{
            position:
              "relative",
          }}
        >
          <svg
            viewBox={`0 0 ${ancho} ${alto}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Gráfica de ventas"
            onMouseLeave={() =>
              setPuntoActivo(
                null
              )
            }
          >
            <defs>
              <linearGradient
                id="gmishSalesGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#111"
                  stopOpacity="0.14"
                />

                <stop
                  offset="100%"
                  stopColor="#111"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map(
              (nivel) => {
                const valor =
                  (maximo / 4) *
                  nivel

                const y =
                  margenSuperior +
                  altoGrafica -
                  (valor /
                    maximo) *
                    altoGrafica

                return (
                  <g
                    key={
                      nivel
                    }
                  >
                    <line
                      x1={
                        margenIzquierdo
                      }
                      x2={
                        ancho -
                        margenDerecho
                      }
                      y1={y}
                      y2={y}
                      stroke="#ededed"
                      strokeWidth="1"
                    />

                    <text
                      x={
                        margenIzquierdo -
                        12
                      }
                      y={
                        y + 4
                      }
                      textAnchor="end"
                      fontSize="10"
                      fill="#999"
                    >
                      {formatearEje(
                        valor
                      )}
                    </text>
                  </g>
                )
              }
            )}

            {datos.promedio >
              0 && (
              <>
                <line
                  x1={
                    margenIzquierdo
                  }
                  x2={
                    ancho -
                    margenDerecho
                  }
                  y1={
                    yPromedio
                  }
                  y2={
                    yPromedio
                  }
                  stroke="#aaa"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                />

                <text
                  x={
                    ancho -
                    margenDerecho
                  }
                  y={
                    yPromedio -
                    7
                  }
                  textAnchor="end"
                  fontSize="10"
                  fill="#888"
                >
                  Promedio
                </text>
              </>
            )}

            <path
              d={area}
              fill="url(#gmishSalesGradient)"
            />

            <path
              d={linea}
              fill="none"
              stroke="#111"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {puntos.map(
              (punto) => (
                <circle
                  key={
                    punto.fecha
                  }
                  cx={punto.x}
                  cy={punto.y}
                  r={
                    puntoActivo
                      ?.fecha ===
                    punto.fecha
                      ? 5
                      : 3
                  }
                  fill="#fff"
                  stroke="#111"
                  strokeWidth="2"
                  style={{
                    transition:
                      "r .15s ease",
                  }}
                />
              )
            )}

            {etiquetasX.map(
              (punto) => (
                <text
                  key={
                    `label-${punto.fecha}`
                  }
                  x={punto.x}
                  y={
                    alto -
                    20
                  }
                  textAnchor="middle"
                  fontSize="10"
                  fill="#999"
                >
                  {formatearFechaCorta(
                    punto.fecha
                  )}
                </text>
              )
            )}

            {puntos.map(
              (punto) => (
                <rect
                  key={
                    `hit-${punto.fecha}`
                  }
                  x={
                    punto.x -
                    Math.max(
                      18,
                      anchoGrafica /
                        puntos.length /
                        2
                    )
                  }
                  y={
                    margenSuperior
                  }
                  width={Math.max(
                    36,
                    anchoGrafica /
                      puntos.length
                  )}
                  height={
                    altoGrafica
                  }
                  fill="transparent"
                  onMouseEnter={() =>
                    setPuntoActivo(
                      punto
                    )
                  }
                />
              )
            )}
          </svg>

          {puntoActivo && (
            <div
              style={{
                position:
                  "absolute",
                left: `${
                  (puntoActivo.x /
                    ancho) *
                    100
                }%`,
                top: `${
                  (puntoActivo.y /
                    alto) *
                    100
                }%`,
                transform:
                  "translate(-50%, -115%)",
                minWidth: 160,
                padding:
                  "10px 12px",
                background:
                  "#111",
                color:
                  "#fff",
                borderRadius: 7,
                boxShadow:
                  "0 8px 25px rgba(0,0,0,.14)",
                pointerEvents:
                  "none",
                zIndex: 3,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color:
                    "#aaa",
                  marginBottom:
                    5,
                }}
              >
                {formatearFechaCompleta(
                  puntoActivo.fecha
                )}
              </div>

              <div
                style={{
                  fontSize: 15,
                  fontWeight:
                    600,
                }}
              >
                {formatearValorTooltip(
                  puntoActivo.valor
                )}
              </div>

              <div
                style={{
                  marginTop:
                    4,
                  fontSize: 10,
                  color:
                    "#bbb",
                }}
              >
                {puntoActivo.pedidos}{" "}
                {puntoActivo.pedidos ===
                1
                  ? "pedido"
                  : "pedidos"}{" "}
                ·{" "}
                {formatearMoneda(
                  puntoActivo.ventas
                )}{" "}
                en ventas
              </div>
            </div>
          )}
        </div>

        <div
          className="gmish-sales-channel-grid"
        >
          <div className="gmish-sales-channel">
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight:
                      600,
                    color:
                      "#444",
                  }}
                >
                  Tienda física
                </div>

                <div
                  style={{
                    marginTop:
                      4,
                    fontSize: 10,
                    color:
                      "#999",
                  }}
                >
                  {datos.pedidosFisicos}{" "}
                  {datos.pedidosFisicos ===
                  1
                    ? "pedido"
                    : "pedidos"}
                </div>
              </div>

              <strong
                style={{
                  fontSize: 14,
                  fontWeight:
                    600,
                }}
              >
                {formatearMoneda(
                  datos.ventasFisicas
                )}
              </strong>
            </div>
          </div>

          <div className="gmish-sales-channel">
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight:
                      600,
                    color:
                      "#444",
                  }}
                >
                  Ventas online
                </div>

                <div
                  style={{
                    marginTop:
                      4,
                    fontSize: 10,
                    color:
                      "#999",
                  }}
                >
                  {datos.pedidosOnline}{" "}
                  {datos.pedidosOnline ===
                  1
                    ? "pedido"
                    : "pedidos"}
                </div>
              </div>

              <strong
                style={{
                  fontSize: 14,
                  fontWeight:
                    600,
                }}
              >
                {formatearMoneda(
                  datos.ventasOnline
                )}
              </strong>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop:
              14,
            color:
              "#999",
            fontSize: 10,
            lineHeight:
              1.5,
          }}
        >
          La comparación se realiza
          contra el período anterior de
          la misma duración. Los días sin
          ventas se mantienen en cero para
          mostrar la evolución real.
        </div>
      </div>
    </section>
  )
}