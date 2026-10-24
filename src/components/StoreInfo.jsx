import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

const MAPS_DEFAULT =
  "https://goo.gl/maps/PEaWNjMyDSjuxsi19?g_st=aw"

const DIRECCION_DEFAULT =
  "# 274 Jirón Dos de Mayo, La Merced, Junín"

const DATOS_INICIALES = {
  nombre: "GMISH",
  direccion: DIRECCION_DEFAULT,
  horario: "09:00 — 21:00",
  mapsUrl: MAPS_DEFAULT,
  imagenUrl: "",
  descripcion:
    "Ven a conocer nuestras prendas y descubre GMISH de cerca",
  abierta: true,
}

export default function StoreInfo() {
  const [tienda, setTienda] = useState(DATOS_INICIALES)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarTienda()
  }, [])

  async function cargarTienda() {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select(
          `
            tienda_nombre,
            tienda_direccion,
            tienda_horario,
            tienda_maps_url,
            tienda_imagen_url,
            tienda_descripcion,
            tienda_abierta
          `
        )
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("Error cargando datos de la tienda:", error)
        return
      }

      if (data) {
        setTienda({
          nombre:
            data.tienda_nombre || DATOS_INICIALES.nombre,

          direccion:
            data.tienda_direccion || DATOS_INICIALES.direccion,

          horario:
            data.tienda_horario || DATOS_INICIALES.horario,

          mapsUrl:
            data.tienda_maps_url || MAPS_DEFAULT,

          imagenUrl:
            data.tienda_imagen_url || "",

          descripcion:
            data.tienda_descripcion ||
            DATOS_INICIALES.descripcion,

          abierta:
            typeof data.tienda_abierta === "boolean"
              ? data.tienda_abierta
              : true,
        })
      }
    } catch (error) {
      console.error("Error inesperado:", error)
    } finally {
      setCargando(false)
    }
  }

  const direccionMapa = useMemo(() => {
    return encodeURIComponent(
      `${tienda.direccion || DIRECCION_DEFAULT}, Perú`
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
            animation: "gmish-spin 1s linear infinite",
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
          padding: "70px 2.5vw 110px",
        }}
      >
        {/* =========================
            ENCABEZADO
        ========================== */}

        <header
          style={{
            width: "100%",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              letterSpacing: "0.4em",
              color: "rgba(0,0,0,.4)",
            }}
          >
            GMISH
          </p>

          <h1
            style={{
              margin: "14px 0 0",
              fontFamily: "Georgia, serif",
              fontSize: "clamp(34px, 5vw, 42px)",
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            VISÍTANOS
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
              justifyContent: "center",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(0,0,0,.15)",
                background: tienda.abierta
                  ? "#fff"
                  : "rgba(0,0,0,.03)",
                padding: "8px 16px",
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: tienda.abierta
                  ? "#111"
                  : "rgba(0,0,0,.45)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: tienda.abierta
                    ? "#4b7a50"
                    : "rgba(0,0,0,.3)",
                }}
              />

              {tienda.abierta ? "ABIERTO" : "CERRADO"}
            </span>
          </div>
        </header>

        {/* Espacio debajo de ABIERTO */}
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

                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "rgba(0,0,0,.7)",
                  }}
                >
                  LUNES — DOMINGO
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: 1.8,
                    color: "rgba(0,0,0,.7)",
                  }}
                >
                  {tienda.horario}
                </p>

                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    color: tienda.abierta
                      ? "#4b7a50"
                      : "rgba(0,0,0,.4)",
                  }}
                >
                  {tienda.abierta
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
              Consulta nuestra ubicación y encuentra la mejor ruta para llegar a GMISH.
            </p>
          </div>

          {/* =========================
              MAPA
          ========================== */}

          <div
            style={{
              width: "88%",
              maxWidth: "988px",
              minWidth: "0",
              margin: "0 auto",
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,.13)",
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
              href={tienda.mapsUrl || MAPS_DEFAULT}
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
              <span style={{ color: "#fff" }}>
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
            main div[style*="height: 1190px"] {
              width: 94% !important;
              height: 784px !important;
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

            main div[style*="max-width: 988px"] {
              width: 100% !important;
            }

            main div[style*="max-width: 988px"] iframe {
              height: 330px !important;
            }
          }

          @media (min-width: 768px) and (max-width: 1024px) {
            main div[style*="height: 1190px"] {
              height: 980px !important;
            }

            main div[style*="max-width: 988px"] {
              width: 94% !important;
            }
          }
        `}
      </style>
    </main>
  )
}