import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Hero() {
  const [imagen, setImagen] = useState("");
  const [imagenLista, setImagenLista] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPortada();
  }, []);

  async function cargarPortada() {
    setCargando(true);
    setImagenLista(false);
    setError("");

    const { data, error } = await supabase
      .from("store_settings")
      .select("setting_value")
      .eq("setting_key", "portada_principal")
      .maybeSingle();

    if (error) {
      console.error("Error cargando portada:", error);

      setError(error.message);
      setCargando(false);
      return;
    }

    if (!data?.setting_value) {
      setImagen("");
      setCargando(false);
      return;
    }

    // Agregamos un parámetro para evitar que el navegador
    // reutilice una versión antigua de la imagen.
    const urlActualizada = `${data.setting_value}${
      data.setting_value.includes("?") ? "&" : "?"
    }v=${Date.now()}`;

    setImagen(urlActualizada);
  }

  function imagenCargada() {
    setImagenLista(true);
    setCargando(false);
  }

  function imagenConError() {
    setImagenLista(false);
    setCargando(false);
    setError("No se pudo cargar la imagen de portada.");
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#D4AF5A]">
            Nueva colección
          </p>

          <h1 className="mt-4 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Estilo que habla por ti
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-[#E7E1D2]">
            Prendas versátiles y modernas pensadas para tu estilo diario
          </p>

          <a
            href="#productos"
            className="mt-8 inline-block rounded-full bg-[#D4AF5A] px-7 py-3 text-sm font-bold text-[#111210] transition hover:bg-[#F0D58A]"
          >
            Ver colección
          </a>
        </div>

        <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-[#1B1D1A]">
          
          {cargando && (
            <span className="absolute text-sm font-medium text-[#E7E1D2]">
              Cargando imagen...
            </span>
          )}

          {imagen && (
            <img
              src={imagen}
              alt="Nueva colección GMISH"
              onLoad={imagenCargada}
              onError={imagenConError}
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                imagenLista ? "opacity-100" : "opacity-0"
              }`}
            />
          )}

          {!cargando && error && (
            <div className="absolute p-6 text-center text-sm text-red-400">
              Error al cargar la portada:
              <br />
              {error}
            </div>
          )}

          {!cargando && !error && !imagen && (
            <span className="text-sm font-medium text-[#E7E1D2]">
              No hay portada configurada
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;