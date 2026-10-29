import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

const MAPS_DEFAULT =
  "https://goo.gl/maps/PEaWNjMyDSjuxsi19?g_st=aw"

const DIRECCION_DEFAULT =
  "# 274 Jirón Dos de Mayo, La Merced, Junín"

const HORARIOS_INICIALES = {
  lunes: {
    abierto: true,
    apertura: "09:00",
    cierre: "21:00",
  },
  martes: {
    abierto: true,
    apertura: "09:00",
    cierre: "21:00",
  },
  miercoles: {
    abierto: true,
    apertura: "09:00",
    cierre: "21:00",
  },
  jueves: {
    abierto: true,
    apertura: "09:00",
    cierre: "21:00",
  },
  viernes: {
    abierto: true,
    apertura: "09:00",
    cierre: "21:00",
  },
  sabado: {
    abierto: true,
    apertura: "09:00",
    cierre: "21:00",
  },
  domingo: {
    abierto: false,
    apertura: "09:00",
    cierre: "21:00",
  },
}

const DIAS = [
  {
    id: "domingo",
    nombre: "Domingo",
    numero: 0,
  },
  {
    id: "lunes",
    nombre: "Lunes",
    numero: 1,
  },
  {
    id: "martes",
    nombre: "Martes",
    numero: 2,
  },
  {
    id: "miercoles",
    nombre: "Miércoles",
    numero: 3,
  },
  {
    id: "jueves",
    nombre: "Jueves",
    numero: 4,
  },
  {
    id: "viernes",
    nombre: "Viernes",
    numero: 5,
  },
  {
    id: "sabado",
    nombre: "Sábado",
    numero: 6,
  },
]

const DIAS_HORARIO = [
  {
    id: "lunes",
    nombre: "Lunes",
  },
  {
    id: "martes",
    nombre: "Martes",
  },
  {
    id: "miercoles",
    nombre: "Miércoles",
  },
  {
    id: "jueves",
    nombre: "Jueves",
  },
  {
    id: "viernes",
    nombre: "Viernes",
  },
  {
    id: "sabado",
    nombre: "Sábado",
  },
  {
    id: "domingo",
    nombre: "Domingo",
  },
]

const DATOS_INICIALES = {
  nombre: "GMISH",
  direccion: DIRECCION_DEFAULT,
  horario: "09:00 — 21:00",
  mapsUrl: MAPS_DEFAULT,
  imagenUrl: "",
  descripcion:
    "Ven a conocer nuestras prendas y descubre GMISH de cerca",
}

function obtenerFechaHoraPeru() {
  const ahora = new Date()

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ahora)

  const valores = {}

  partes.forEach((parte) => {
    if (parte.type !== "literal") {
      valores[parte.type] = parte.value
    }
  })

  return {
    fecha: `${valores.year}-${valores.month}-${valores.day}`,
    hora: `${valores.hour}:${valores.minute}:${valores.second}`,
    anio: Number(valores.year),
    mes: Number(valores.month),
    dia: Number(valores.day),
    horaNumero: Number(valores.hour),
    minuto: Number(valores.minute),
    segundo: Number(valores.second),
  }
}

function normalizarHorarios(horarios) {
  const resultado = {}

  Object.keys(HORARIOS_INICIALES).forEach((dia) => {
    const guardado = horarios?.[dia]

    resultado[dia] = {
      abierto:
        typeof guardado?.abierto === "boolean"
          ? guardado.abierto
          : HORARIOS_INICIALES[dia].abierto,

      apertura:
        guardado?.apertura ||
        HORARIOS_INICIALES[dia].apertura,

      cierre:
        guardado?.cierre ||
        HORARIOS_INICIALES[dia].cierre,
    }
  })

  return resultado
}

function obtenerDiaSemana(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number)

  return new Date(
    anio,
    mes - 1,
    dia
  ).getDay()
}

function sumarDias(fecha, cantidad) {
  const [anio, mes, dia] = fecha.split("-").map(Number)

  const fechaNueva = new Date(
    anio,
    mes - 1,
    dia
  )

  fechaNueva.setDate(
    fechaNueva.getDate() + cantidad
  )

  const anioNuevo = fechaNueva.getFullYear()

  const mesNuevo = String(
    fechaNueva.getMonth() + 1
  ).padStart(2, "0")

  const diaNuevo = String(
    fechaNueva.getDate()
  ).padStart(2, "0")

  return `${anioNuevo}-${mesNuevo}-${diaNuevo}`
}

function convertirMinutos(hora) {
  if (!hora) return null

  const [horas, minutos] = hora
    .split(":")
    .map(Number)

  if (
    Number.isNaN(horas) ||
    Number.isNaN(minutos)
  ) {
    return null
  }

  return horas * 60 + minutos
}

function formatearHora(hora) {
  if (!hora) return ""

  const [horasTexto, minutos] = hora.split(":")
  const horas = Number(horasTexto)

  if (Number.isNaN(horas)) {
    return hora
  }

  const periodo = horas >= 12 ? "PM" : "AM"
  const horas12 = horas % 12 || 12

  return `${horas12}:${minutos} ${periodo}`
}

function buscarFechaEspecial(
  fecha,
  fechasEspeciales
) {
  return fechasEspeciales.find(
    (item) => item?.fecha === fecha
  )
}

function obtenerHorarioDelDia(
  fecha,
  horarios,
  fechasEspeciales
) {
  const fechaEspecial = buscarFechaEspecial(
    fecha,
    fechasEspeciales
  )

  if (fechaEspecial) {
    return {
      abierto: Boolean(fechaEspecial.abierto),
      apertura: fechaEspecial.apertura || null,
      cierre: fechaEspecial.cierre || null,
      especial: true,
      motivo: fechaEspecial.motivo || "",
    }
  }

  const numeroDia = obtenerDiaSemana(fecha)

  const dia = DIAS.find(
    (item) => item.numero === numeroDia
  )

  if (!dia) {
    return {
      abierto: false,
      apertura: null,
      cierre: null,
      especial: false,
      motivo: "",
    }
  }

  const horario = horarios[dia.id]

  return {
    abierto: Boolean(horario?.abierto),
    apertura: horario?.apertura || null,
    cierre: horario?.cierre || null,
    especial: false,
    motivo: "",
  }
}

function obtenerEstadoTienda(
  horarios,
  fechasEspeciales
) {
  const ahora = obtenerFechaHoraPeru()

  const horarioHoy = obtenerHorarioDelDia(
    ahora.fecha,
    horarios,
    fechasEspeciales
  )

  const minutosActuales =
    ahora.horaNumero * 60 +
    ahora.minuto +
    ahora.segundo / 60

  const minutosApertura =
    convertirMinutos(horarioHoy.apertura)

  const minutosCierre =
    convertirMinutos(horarioHoy.cierre)

  if (
    horarioHoy.abierto &&
    minutosApertura !== null &&
    minutosCierre !== null &&
    minutosActuales >= minutosApertura &&
    minutosActuales < minutosCierre
  ) {
    return {
      abierto: true,
      horarioHoy,
      textoPrincipal: "ABIERTO",
      textoSecundario:
        `Hoy hasta las ${formatearHora(
          horarioHoy.cierre
        )}`,
    }
  }

  if (
    horarioHoy.abierto &&
    minutosApertura !== null &&
    minutosActuales < minutosApertura
  ) {
    return {
      abierto: false,
      horarioHoy,
      textoPrincipal: "CERRADO",
      textoSecundario:
        `Abrimos hoy a las ${formatearHora(
          horarioHoy.apertura
        )}`,
    }
  }

  for (let i = 1; i <= 7; i += 1) {
    const fechaSiguiente = sumarDias(
      ahora.fecha,
      i
    )

    const horarioSiguiente =
      obtenerHorarioDelDia(
        fechaSiguiente,
        horarios,
        fechasEspeciales
      )

    if (
      horarioSiguiente.abierto &&
      horarioSiguiente.apertura
    ) {
      const esManana = i === 1

      return {
        abierto: false,
        horarioHoy,
        textoPrincipal: "CERRADO",
        textoSecundario: esManana
          ? `Abrimos mañana a las ${formatearHora(
              horarioSiguiente.apertura
            )}`
          : `Abrimos el ${obtenerNombreDia(
              fechaSiguiente
            )} a las ${formatearHora(
              horarioSiguiente.apertura
            )}`,
      }
    }
  }

  return {
    abierto: false,
    horarioHoy,
    textoPrincipal: "CERRADO",
    textoSecundario:
      "No hay próximos horarios disponibles",
  }
}

function obtenerNombreDia(fecha) {
  const numeroDia = obtenerDiaSemana(fecha)

  const dia = DIAS.find(
    (item) => item.numero === numeroDia
  )

  return dia?.nombre || ""
}

/* =========================================================
   AGRUPAR AUTOMÁTICAMENTE LOS DÍAS CON EL MISMO HORARIO
========================================================= */

function claveHorario(horario) {
  if (!horario?.abierto) {
    return "cerrado"
  }

  return `abierto-${horario.apertura}-${horario.cierre}`
}

function obtenerGruposHorario(horarios) {
  const grupos = []

  let grupoActual = null

  DIAS_HORARIO.forEach((dia, indice) => {
    const horario = horarios?.[dia.id]

    const clave = claveHorario(horario)

    if (
      grupoActual &&
      grupoActual.clave === clave
    ) {
      grupoActual.dias.push(dia)
      return
    }

    if (grupoActual) {
      grupos.push(grupoActual)
    }

    grupoActual = {
      clave,
      dias: [dia],
      horario: {
        abierto: Boolean(horario?.abierto),
        apertura: horario?.apertura || null,
        cierre: horario?.cierre || null,
      },
      indice,
    }
  })

  if (grupoActual) {
    grupos.push(grupoActual)
  }

  return grupos
}

function formatearNombreGrupo(dias) {
  if (!dias.length) return ""

  if (dias.length === 1) {
    return dias[0].nombre.toUpperCase()
  }

  if (dias.length === 2) {
    return `${dias[0].nombre.toUpperCase()} Y ${dias[1].nombre.toUpperCase()}`
  }

  const nombres = dias.map((dia) =>
    dia.nombre.toUpperCase()
  )

  const sonConsecutivos =
    dias.every(
      (dia, indice) =>
        indice === 0 ||
        dia.id ===
          DIAS_HORARIO[
            DIAS_HORARIO.findIndex(
              (item) => item.id === dias[indice - 1].id
            ) + 1
          ]?.id
    )

  if (sonConsecutivos) {
    return `${nombres[0]} — ${
      nombres[nombres.length - 1]
    }`
  }

  return nombres
    .slice(0, -1)
    .join(", ") +
    " Y " +
    nombres[nombres.length - 1]
}

function HorarioPublico({ horarios }) {
  const grupos = useMemo(() => {
    return obtenerGruposHorario(horarios)
  }, [horarios])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "13px",
        width: "100%",
      }}
    >
      {grupos.map((grupo) => (
        <div
          key={grupo.clave}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              letterSpacing: "0.18em",
              color: "rgba(0,0,0,.45)",
              textAlign: "center",
            }}
          >
            {formatearNombreGrupo(
              grupo.dias
            )}
          </p>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: 1.8,
              color: "rgba(0,0,0,.7)",
              textAlign: "center",
            }}
          >
            {grupo.horario.abierto
              ? `${formatearHora(
                  grupo.horario.apertura
                )} — ${formatearHora(
                  grupo.horario.cierre
                )}`
              : "CERRADO"}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function StoreInfo() {
  const [tienda, setTienda] = useState(
    DATOS_INICIALES
  )

  const [horarios, setHorarios] = useState(
    HORARIOS_INICIALES
  )

  const [fechasEspeciales, setFechasEspeciales] =
    useState([])

  const [estadoTienda, setEstadoTienda] =
    useState({
      abierto: false,
      horarioHoy: null,
      textoPrincipal: "CERRADO",
      textoSecundario: "",
    })

  const [cargando, setCargando] =
    useState(true)

  useEffect(() => {
    cargarTienda()
  }, [])

  useEffect(() => {
    const actualizarEstado = () => {
      setEstadoTienda(
        obtenerEstadoTienda(
          horarios,
          fechasEspeciales
        )
      )
    }

    actualizarEstado()

    const intervalo = setInterval(
      actualizarEstado,
      30000
    )

    return () => {
      clearInterval(intervalo)
    }
  }, [horarios, fechasEspeciales])

  async function cargarTienda() {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select(
          `
            tienda_nombre,
            tienda_direccion,
            tienda_horario,
            tienda_horarios,
            tienda_fechas_especiales,
            tienda_maps_url,
            tienda_imagen_url,
            tienda_descripcion
          `
        )
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error(
          "Error cargando datos de la tienda:",
          error
        )
        return
      }

      if (data) {
        setTienda({
          nombre:
            data.tienda_nombre ||
            DATOS_INICIALES.nombre,

          direccion:
            data.tienda_direccion ||
            DATOS_INICIALES.direccion,

          horario:
            data.tienda_horario ||
            DATOS_INICIALES.horario,

          mapsUrl:
            data.tienda_maps_url ||
            MAPS_DEFAULT,

          imagenUrl:
            data.tienda_imagen_url || "",

          descripcion:
            data.tienda_descripcion ||
            DATOS_INICIALES.descripcion,
        })

        setHorarios(
          normalizarHorarios(
            data.tienda_horarios
          )
        )

        setFechasEspeciales(
          Array.isArray(
            data.tienda_fechas_especiales
          )
            ? data.tienda_fechas_especiales
            : []
        )
      }
    } catch (error) {
      console.error(
        "Error inesperado:",
        error
      )
    } finally {
      setCargando(false)
    }
  }

  const direccionMapa = useMemo(() => {
    return encodeURIComponent(
      `${
        tienda.direccion ||
        DIRECCION_DEFAULT
      }, Perú`
    )
  }, [tienda.direccion])

  const mapaUrl = useMemo(() => {
    return `https://www.google.com/maps?q=${direccionMapa}&z=19&output=embed`
  }, [direccionMapa])

  if (cargando) {
    return (
      <main
        style={{
          minHeight: "60vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f7f3",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "1px solid rgba(0,0,0,.2)",
            borderTop: "1px solid #111",
            borderRadius: "50%",
            animation:
              "gmish-spin 1s linear infinite",
          }}
        />

        <style>
          {`
            @keyframes gmish-spin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </main>
    )
  }

  return (
    <main
      style={{
        width: "100%",
        background: "#f8f7f3",
        color: "#111",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
          padding: "35px 2.5vw 110px",
        }}
      >
        {/* =========================
            ENCABEZADO
        ========================== */}

        <header
          style={{
            width: "95%",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              letterSpacing: "0.23em",
              color: "rgba(0,0,0,.4)",
            }}
          >
            Tu lugar favorito
          </p>

          <h1
            style={{
              margin: "14px 0 0",
              fontFamily: "Georgia, serif",
              fontSize: "clamp(34px, 5vw, 42px)",
              fontWeight: 400,
              lineHeight: 0.9,
            }}
          >
            BIENVENIDO
          </h1>

          <p
            style={{
              margin: "20px 0 0",
              fontSize: "16px",
              color: "rgba(0,0,0,.65)",
            }}
          >
            Tu estilo también tiene un lugar
          </p>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(0,0,0,.15)",
                background:
                  estadoTienda.abierto
                    ? "#fff"
                    : "rgba(0,0,0,.03)",
                padding: "8px 16px",
                fontSize: "10px",
                letterSpacing: "0.2em",
                color:
                  estadoTienda.abierto
                    ? "#111"
                    : "rgba(0,0,0,.45)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background:
                    estadoTienda.abierto
                      ? "#4b7a50"
                      : "rgba(0,0,0,.3)",
                }}
              />

              {estadoTienda.textoPrincipal}
            </span>

            {estadoTienda.textoSecundario && (
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: "rgba(0,0,0,.48)",
                  letterSpacing: "0.03em",
                }}
              >
                {estadoTienda.textoSecundario}
              </p>
            )}
          </div>
        </header>

        {/* Espacio debajo de estado */}
        <div
          style={{
            height: "24px",
            width: "100%",
          }}
        />

        {/* =========================
            IMAGEN DE LA TIENDA
        ========================== */}

        <div
          className="gmish-store-image"
          style={{
            width: "92%",
            height: "1190px",
            maxWidth: "1500px",
            overflow: "hidden",
            background: "#e9e7e1",
          }}
        >
          {tienda.imagenUrl ? (
            <img
              src={tienda.imagenUrl}
              alt="Tienda GMISH"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "36px",
                  color: "rgba(0,0,0,.2)",
                }}
              >
                GMISH
              </span>
            </div>
          )}
        </div>

        {/* Línea debajo de la imagen */}
        <div
          style={{
            width: "92%",
            maxWidth: "1500px",
            height: "1px",
            background: "rgba(0,0,0,.16)",
            marginTop: "41px",
          }}
        />

        {/* =========================
            ENCUÉNTRANOS
        ========================== */}

        <section
          style={{
            width: "100%",
            marginTop: "41px",
          }}
        >
          <div
            style={{
              width: "100%",
              textAlign: "center",
              marginBottom: "29px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                letterSpacing: "0.3em",
                color: "rgba(0,0,0,.4)",
              }}
            >
              ENCUÉNTRANOS
            </p>

            <h2
              style={{
                margin: "22px 0 0",
                fontFamily: "Georgia, serif",
                fontSize: "27px",
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            >
              Encuéntranos en:
            </h2>
          </div>

          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              border: "1px solid rgba(0,0,0,.1)",
            }}
          >
            {/* DIRECCIÓN */}
            <div
              style={{
                padding: "21px 35px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "11px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "10px",
                    letterSpacing: "0.25em",
                    color: "rgba(0,0,0,.4)",
                  }}
                >
                  DIRECCIÓN
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: 1.8,
                    color: "rgba(0,0,0,.7)",
                  }}
                >
                  {tienda.direccion}
                </p>
              </div>
            </div>

            {/* HORARIO */}
            <div
              style={{
                padding: "21px 35px",
                textAlign: "center",
                borderLeft:
                  "1px solid rgba(0,0,0,.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "9px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "10px",
                    letterSpacing: "0.25em",
                    color: "rgba(0,0,0,.4)",
                  }}
                >
                  HORARIO DE ATENCIÓN
                </p>

                <HorarioPublico
                  horarios={horarios}
                />

                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    color:
                      estadoTienda.abierto
                        ? "#4b7a50"
                        : "rgba(0,0,0,.4)",
                  }}
                >
                  {estadoTienda.abierto
                    ? "ACTUALMENTE ABIERTO"
                    : "ACTUALMENTE CERRADO"}
                </p>
              </div>
            </div>
          </div>

          {/* Línea debajo de información */}
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(0,0,0,.16)",
              marginTop: "41px",
            }}
          />
        </section>

        {/* =========================
            CÓMO LLEGAR
        ========================== */}

        <section
          style={{
            width: "100%",
            marginTop: "41px",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "34px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                letterSpacing: "0.3em",
                color: "rgba(0,0,0,.4)",
              }}
            >
              CÓMO LLEGAR
            </p>

            <h2
              style={{
                margin: "22px 0 0",
                fontFamily: "Georgia, serif",
                fontSize: "27px",
                fontWeight: 400,
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              Estamos más cerca de ti
            </h2>

            <p
              style={{
                width: "100%",
                maxWidth: "500px",
                margin: "21px auto 0",
                padding: "0 15px",
                boxSizing: "border-box",
                fontSize: "14px",
                lineHeight: 2,
                color: "rgba(0,0,0,.55)",
                textAlign: "center",
              }}
            >
              Consulta nuestra ubicación y encuentra la mejor ruta para llegar
            </p>
          </div>

          {/* MAPA */}
          <div
            className="gmish-map"
            style={{
              width: "88%",
              maxWidth: "988px",
              minWidth: "0",
              margin: "0 auto",
              overflow: "hidden",
              border:
                "1px solid rgba(0,0,0,.13)",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <iframe
              title="Ubicación de GMISH"
              src={mapaUrl}
              style={{
                display: "block",
                width: "100%",
                height: "430px",
                border: 0,
              }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {/* Botón Google Maps */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: "34px",
            }}
          >
            <a
              href={
                tienda.mapsUrl ||
                MAPS_DEFAULT
              }
              target="_blank"
              rel="noreferrer"
              style={{
                minHeight: "46px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 32px",
                background: "#111",
                color: "#fff",
                textDecoration: "none",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.2em",
              }}
            >
              <span
                style={{
                  color: "#fff",
                }}
              >
                ABRIR EN GOOGLE MAPS
              </span>

              <span
                style={{
                  marginLeft: "12px",
                  fontSize: "14px",
                  color: "#fff",
                }}
              >
                ↗
              </span>
            </a>
          </div>
        </section>
      </div>

      {/* =========================
          RESPONSIVE
      ========================== */}

      <style>
        {`
          @media (max-width: 767px) {
            .gmish-store-image {
              width: 94% !important;
              height: clamp(520px, 150vw, 620px) !important;
            }

            main section > div[style*="grid-template-columns"] {
              grid-template-columns: 1fr !important;
            }

            main section > div[style*="grid-template-columns"] > div {
              padding: 19px 22px !important;
            }

            main section > div[style*="grid-template-columns"] > div + div {
              border-left: 0 !important;
              border-top: 1px solid rgba(0,0,0,.1);
            }

            .gmish-map {
              width: 100% !important;
            }

            .gmish-map iframe {
              height: 330px !important;
            }
          }

          @media (min-width: 768px) and (max-width: 1024px) {
            .gmish-store-image {
              height: 980px !important;
            }

            .gmish-map {
              width: 94% !important;
            }
          }
        `}
      </style>
    </main>
  )
}