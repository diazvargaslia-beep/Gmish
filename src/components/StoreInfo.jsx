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
            data.tienda_imagen_url ||
            "",

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
      <main className="flex min-h-[60vh] w-full items-center justify-center bg-[#f8f7f3]">
        <div className="h-8 w-8 animate-spin rounded-full border border-black/20 border-t-black" />
      </main>
    )
  }

  return (
    <main className="w-full bg-[#f8f7f3] text-[#111]">

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: 0,
          padding: "50px 2.5vw",
          boxSizing: "border-box",
        }}
      >

        {/* ENCABEZADO */}

        <header className="w-full text-center">

          <p className="text-[10px] tracking-[0.4em] text-black/40">
            GMISH
          </p>

          <h1 className="mt-3 font-serif text-[34px] sm:text-[42px]">
            VISÍTANOS
          </h1>

          <p className="mt-4 text-[16px] text-black/65">
            Tu estilo también tiene un lugar
          </p>

          <div className="mt-5 flex justify-center">

            <span
              className={`inline-flex items-center gap-2 border px-4 py-2 text-[10px] tracking-[0.2em] ${
                tienda.abierta
                  ? "border-black/15 bg-white"
                  : "border-black/10 bg-black/[0.03] text-black/45"
              }`}
            >

              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  tienda.abierta
                    ? "bg-[#4b7a50]"
                    : "bg-black/30"
                }`}
              />

              {tienda.abierta
                ? "ABIERTO"
                : "CERRADO"}

            </span>

          </div>

        </header>


        {/* IMAGEN */}

        <div className="mt-12 w-full aspect-[16/8] overflow-hidden bg-[#e9e7e1]">

          {tienda.imagenUrl ? (
            <img
              src={tienda.imagenUrl}
              alt="Tienda GMISH"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-serif text-4xl text-black/20">
                GMISH
              </span>
            </div>
          )}

        </div>


        {/* INFORMACIÓN DE LA TIENDA */}

        <section className="mt-12 w-full">

          <div className="mb-8 text-center">

            <p className="text-[10px] tracking-[0.3em] text-black/40">
              ENCUÉNTRANOS
            </p>

            <h2 className="mt-3 font-serif text-[27px]">
              Encuéntranos en:
            </h2>

          </div>


          <div className="grid w-full grid-cols-1 border border-black/10 md:grid-cols-2">

            {/* DIRECCIÓN */}

            <div className="px-8 py-8 text-center">

              <p className="text-[10px] tracking-[0.25em] text-black/40">
                DIRECCIÓN
              </p>

              <p className="mt-4 text-[14px] leading-7 text-black/70">
                {tienda.direccion}
              </p>

            </div>


            {/* HORARIO */}

            <div className="border-t border-black/10 px-8 py-8 text-center md:border-l md:border-t-0">

              <p className="text-[10px] tracking-[0.25em] text-black/40">
                HORARIO DE ATENCIÓN
              </p>

              <p className="mt-4 text-[14px] text-black/70">
                LUNES — DOMINGO
              </p>

              <p className="mt-2 text-[14px] text-black/70">
                {tienda.horario}
              </p>

              <p
                className={`mt-4 text-[10px] tracking-[0.15em] ${
                  tienda.abierta
                    ? "text-[#4b7a50]"
                    : "text-black/40"
                }`}
              >
                {tienda.abierta
                  ? "ACTUALMENTE ABIERTO"
                  : "ACTUALMENTE CERRADO"}
              </p>

            </div>

          </div>

        </section>


        {/* MAPA */}

        <section className="mt-12 w-full">

          <div className="mb-8 text-center">

            <p className="text-[10px] tracking-[0.3em] text-black/40">
              CÓMO LLEGAR
            </p>

            <h2 className="mt-3 font-serif text-[27px]">
              Estamos más cerca de ti
            </h2>

            <p className="mx-auto mt-4 max-w-[500px] text-[14px] leading-7 text-black/55">
              Consulta nuestra ubicación y encuentra la mejor ruta para llegar a GMISH.
            </p>

          </div>


          <div className="w-full overflow-hidden border border-black/10">

            <iframe
              title="Ubicación de GMISH"
              src={mapaUrl}
              className="block h-[400px] w-full border-0 sm:h-[480px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />

          </div>


          <div className="mt-7 flex justify-center">

            <a
              href={
                tienda.mapsUrl ||
                MAPS_DEFAULT
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[46px] items-center justify-center bg-black px-8 text-[10px] font-medium tracking-[0.2em] text-white transition hover:bg-black/80"
            >

              <span className="text-white">
                ABRIR EN GOOGLE MAPS
              </span>

              <span className="ml-3 text-sm text-white">
                ↗
              </span>

            </a>

          </div>

        </section>

      </div>

    </main>
  )
}