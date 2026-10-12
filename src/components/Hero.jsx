import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Hero() {
  const [imagen, setImagen] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPortada();
  }, []);

  async function cargarPortada() {
    console.log("Buscando portada_principal...");

    const { data, error } = await supabase
      .from("store_settings")
      .select("setting_value")
      .eq("setting_key", "portada_principal")
      .maybeSingle();

    console.log("Datos recibidos:", data);
    console.log("Error:", error);

    if (error) {
      setError(error.message);
      setCargando(false);
      return;
    }

    if (data?.setting_value) {
      setImagen(data.setting_value);
    }

    setCargando(false);
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

        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-[#1B1D1A]">
          {imagen ? (
            <img
              src={imagen}
              alt="Nueva colección GMISH"
              className="h-full w-full object-cover"
            />
          ) : cargando ? (
            <span className="text-sm font-medium text-[#E7E1D2]">
              Cargando imagen...
            </span>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-400">
              Error al cargar la portada:
              <br />
              {error}
            </div>
          ) : (
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