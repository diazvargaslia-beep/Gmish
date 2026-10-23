import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const MAPS_DEFAULT =
  "https://goo.gl/maps/PEaWNjMyDSjuxsi19?g_st=aw";

const DATOS_INICIALES = {
  tienda_nombre: "GMISH",
  tienda_direccion: "",
  tienda_horario: "Lunes a domingo · 9:00 a. m. – 9:00 p. m.",
  tienda_maps_url: MAPS_DEFAULT,
  tienda_imagen_url: "",
  tienda_descripcion:
    "Ven a conocer nuestras prendas y descubre GMISH de cerca.",
};

function ConfiguracionAdmin() {
  const [formulario, setFormulario] =
    useState(DATOS_INICIALES);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setCargando(true);
    setError("");

    const { data, error: errorSupabase } =
      await supabase
        .from("store_settings")
        .select(
          `
            id,
            tienda_nombre,
            tienda_direccion,
            tienda_horario,
            tienda_maps_url,
            tienda_imagen_url,
            tienda_descripcion
          `
        )
        .limit(1)
        .maybeSingle();

    if (errorSupabase) {
      console.error(
        "Error cargando configuración:",
        errorSupabase
      );

      setError(
        "No se pudo cargar la configuración de la tienda."
      );

      setCargando(false);
      return;
    }

    if (data) {
      setFormulario({
        tienda_nombre:
          data.tienda_nombre ||
          DATOS_INICIALES.tienda_nombre,

        tienda_direccion:
          data.tienda_direccion || "",

        tienda_horario:
          data.tienda_horario ||
          DATOS_INICIALES.tienda_horario,

        tienda_maps_url:
          data.tienda_maps_url ||
          DATOS_INICIALES.tienda_maps_url,

        tienda_imagen_url:
          data.tienda_imagen_url || "",

        tienda_descripcion:
          data.tienda_descripcion ||
          DATOS_INICIALES.tienda_descripcion,
      });
    }

    setCargando(false);
  }

  function actualizarCampo(campo, valor) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setMensaje("");
    setError("");
  }

  async function subirImagen(event) {
    const archivo = event.target.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      setError(
        "Selecciona un archivo de imagen válido."
      );
      return;
    }

    const maximoMB = 8;
    const maximoBytes =
      maximoMB * 1024 * 1024;

    if (archivo.size > maximoBytes) {
      setError(
        `La imagen no puede superar los ${maximoMB} MB.`
      );
      return;
    }

    setSubiendoImagen(true);
    setMensaje("");
    setError("");

    try {
      const extension =
        archivo.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const nombreArchivo =
        `store/visitanos-${Date.now()}.${extension}`;

      const { error: errorUpload } =
        await supabase.storage
          .from("product-images")
          .upload(nombreArchivo, archivo, {
            cacheControl: "3600",
            upsert: true,
            contentType: archivo.type,
          });

      if (errorUpload) {
        console.error(
          "Error subiendo imagen:",
          errorUpload
        );

        throw new Error(
          errorUpload.message ||
            "No se pudo subir la imagen."
        );
      }

      const { data } =
        supabase.storage
          .from("product-images")
          .getPublicUrl(nombreArchivo);

      if (!data?.publicUrl) {
        throw new Error(
          "No se pudo obtener la URL pública de la imagen."
        );
      }

      setFormulario((actual) => ({
        ...actual,
        tienda_imagen_url: data.publicUrl,
      }));

      setMensaje(
        "Imagen cargada. Recuerda guardar los cambios."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No se pudo subir la imagen."
      );
    } finally {
      setSubiendoImagen(false);
      event.target.value = "";
    }
  }

  async function guardarConfiguracion() {
    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const { data: existente, error: errorBusqueda } =
        await supabase
          .from("store_settings")
          .select("id")
          .limit(1)
          .maybeSingle();

      if (errorBusqueda) {
        throw new Error(
          errorBusqueda.message ||
            "No se pudo comprobar la configuración."
        );
      }

      const datos = {
        tienda_nombre:
          formulario.tienda_nombre.trim(),

        tienda_direccion:
          formulario.tienda_direccion.trim(),

        tienda_horario:
          formulario.tienda_horario.trim(),

        tienda_maps_url:
          formulario.tienda_maps_url.trim(),

        tienda_imagen_url:
          formulario.tienda_imagen_url.trim(),

        tienda_descripcion:
          formulario.tienda_descripcion.trim(),
      };

      let resultado;

      if (existente?.id) {
        resultado = await supabase
          .from("store_settings")
          .update(datos)
          .eq("id", existente.id);
      } else {
        resultado = await supabase
          .from("store_settings")
          .insert(datos);
      }

      if (resultado.error) {
        throw new Error(
          resultado.error.message ||
            "No se pudieron guardar los cambios."
        );
      }

      setMensaje(
        "Configuración guardada correctamente."
      );
    } catch (err) {
      console.error(
        "Error guardando configuración:",
        err
      );

      setError(
        err?.message ||
          "No se pudieron guardar los cambios."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <section className="flex w-full justify-center">
        <div className="w-full max-w-5xl px-4 py-16 text-center">
          <p className="text-sm text-neutral-500">
            Cargando configuración...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col items-center">
      <div className="w-full max-w-5xl">
        {/* ENCABEZADO */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
            <span className="text-xl">⚙</span>
          </div>

          <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            Configuración
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-neutral-500">
            Administra la información que los clientes
            verán sobre el espacio físico de GMISH.
          </p>
        </div>

        {/* TIENDA FÍSICA */}
        <div className="mt-12 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="border-b border-neutral-100 pb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Información pública
            </p>

            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              Tienda física
            </h3>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
              Esta información aparecerá en la sección
              “Visítanos” de la tienda.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6">
            {/* NOMBRE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Nombre de la tienda
              </label>

              <input
                type="text"
                value={formulario.tienda_nombre}
                onChange={(event) =>
                  actualizarCampo(
                    "tienda_nombre",
                    event.target.value
                  )
                }
                placeholder="GMISH"
                className="
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-neutral-900
                  outline-none
                  transition
                  focus:border-neutral-900
                "
              />
            </div>

            {/* DIRECCIÓN */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Dirección
              </label>

              <input
                type="text"
                value={formulario.tienda_direccion}
                onChange={(event) =>
                  actualizarCampo(
                    "tienda_direccion",
                    event.target.value
                  )
                }
                placeholder="Ej. Jr. ... 123, La Merced"
                className="
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-neutral-900
                  outline-none
                  transition
                  focus:border-neutral-900
                "
              />
            </div>

            {/* HORARIO */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Horario
              </label>

              <input
                type="text"
                value={formulario.tienda_horario}
                onChange={(event) =>
                  actualizarCampo(
                    "tienda_horario",
                    event.target.value
                  )
                }
                placeholder="Lunes a domingo · 9:00 a. m. – 9:00 p. m."
                className="
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-neutral-900
                  outline-none
                  transition
                  focus:border-neutral-900
                "
              />
            </div>

            {/* GOOGLE MAPS */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Enlace de Google Maps
              </label>

              <input
                type="url"
                value={formulario.tienda_maps_url}
                onChange={(event) =>
                  actualizarCampo(
                    "tienda_maps_url",
                    event.target.value
                  )
                }
                placeholder="https://goo.gl/maps/..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-neutral-900
                  outline-none
                  transition
                  focus:border-neutral-900
                "
              />

              <p className="mt-2 text-xs leading-5 text-neutral-400">
                Este enlace se utilizará para el botón
                “Abrir en Google Maps”.
              </p>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Descripción
              </label>

              <textarea
                value={formulario.tienda_descripcion}
                onChange={(event) =>
                  actualizarCampo(
                    "tienda_descripcion",
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Ven a conocer nuestras prendas y descubre GMISH de cerca."
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-neutral-900
                  outline-none
                  transition
                  focus:border-neutral-900
                "
              />
            </div>
          </div>

          {/* FOTO */}
          <div className="mt-8 border-t border-neutral-100 pt-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  Foto del local
                </p>

                <p className="mt-2 max-w-lg text-xs leading-5 text-neutral-400">
                  Sube una fotografía del establecimiento.
                  Recomendamos una imagen horizontal de
                  buena resolución.
                </p>
              </div>

              <label
                className="
                  inline-flex
                  min-h-[44px]
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-neutral-300
                  bg-white
                  px-5
                  text-sm
                  font-medium
                  text-neutral-900
                  transition
                  hover:border-neutral-900
                  hover:bg-neutral-50
                "
              >
                {subiendoImagen
                  ? "Subiendo..."
                  : "Seleccionar imagen"}

                <input
                  type="file"
                  accept="image/*"
                  onChange={subirImagen}
                  disabled={subiendoImagen}
                  className="hidden"
                />
              </label>
            </div>

            {formulario.tienda_imagen_url ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
                <img
                  src={formulario.tienda_imagen_url}
                  alt="Vista previa del local GMISH"
                  className="h-[260px] w-full object-cover sm:h-[360px]"
                />
              </div>
            ) : (
              <div className="mt-6 flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-center sm:h-[300px]">
                <div>
                  <p className="text-3xl">▧</p>

                  <p className="mt-3 text-sm font-medium text-neutral-600">
                    Todavía no hay una foto
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    La imagen aparecerá aquí después de
                    seleccionarla.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* MENSAJES */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
              {mensaje}
            </div>
          )}

          {/* GUARDAR */}
          <div className="mt-8 flex justify-end border-t border-neutral-100 pt-8">
            <button
              type="button"
              onClick={guardarConfiguracion}
              disabled={guardando || subiendoImagen}
              className="
                min-h-[50px]
                min-w-[190px]
                rounded-xl
                bg-neutral-900
                px-7
                py-3
                text-sm
                font-medium
                text-white
                transition
                hover:bg-neutral-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {guardando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* VISTA RÁPIDA */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Así funcionará
          </p>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Cuando guardes los cambios, la información se
            actualizará automáticamente en la tienda
            pública. No tendrás que modificar el código
            cada vez que cambie la dirección, el horario,
            el mapa o la fotografía.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ConfiguracionAdmin;