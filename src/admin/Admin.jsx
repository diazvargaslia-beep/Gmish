import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// código...
/*
 * =========================================================
 * PORTADAS
 * =========================================================
 */

function PortadasAdmin() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [formulario, setFormulario] =
    useState({
      store_name: "",
      whatsapp: "",
      address: "",
      maps_url: "",
      instagram_url: "",
      tiktok_url: "",
      facebook_url: "",
    });

  const [portadas, setPortadas] =
    useState({
      portada_principal: "",
      portada_hombre: "",
      portada_mujer: "",
    });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setCargando(true);
    setError("");
    setMensaje("");

    const {
      data,
      error: errorConsulta,
    } = await supabase
      .from("store_settings")
      .select("*");

    if (errorConsulta) {
      setError(
        "No se pudo cargar la configuración de la tienda."
      );

      setCargando(false);
      return;
    }

    const configuracion =
      data?.find(
        (item) =>
          !item.setting_key ||
          item.setting_key === null
      );

    const buscarPortada = (clave) => {
      const encontrada =
        data?.find(
          (item) =>
            item.setting_key === clave
        );

      return encontrada?.setting_value ?? "";
    };

    if (configuracion) {
      setFormulario({
        store_name:
          configuracion.store_name ?? "",
        whatsapp:
          configuracion.whatsapp ?? "",
        address:
          configuracion.address ?? "",
        maps_url:
          configuracion.maps_url ?? "",
        instagram_url:
          configuracion.instagram_url ?? "",
        tiktok_url:
          configuracion.tiktok_url ?? "",
        facebook_url:
          configuracion.facebook_url ?? "",
      });
    }

    setPortadas({
      portada_principal:
        buscarPortada(
          "portada_principal"
        ),
      portada_hombre:
        buscarPortada(
          "portada_hombre"
        ),
      portada_mujer:
        buscarPortada(
          "portada_mujer"
        ),
    });

    setCargando(false);
  }

  function cambiarCampo(
    campo,
    valor
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarConfiguracion() {
    setGuardando(true);
    setError("");
    setMensaje("");

    const {
      data: configuracionActual,
      error: errorConsulta,
    } = await supabase
      .from("store_settings")
      .select("id")
      .is("setting_key", null)
      .limit(1)
      .maybeSingle();

    if (errorConsulta) {
      setError(
        "No se pudo comprobar la configuración."
      );

      setGuardando(false);
      return;
    }

    let errorGuardado = null;

    if (configuracionActual?.id) {
      const {
        error,
      } = await supabase
        .from("store_settings")
        .update({
          store_name:
            formulario.store_name,
          whatsapp:
            formulario.whatsapp,
          address:
            formulario.address,
          maps_url:
            formulario.maps_url,
          instagram_url:
            formulario.instagram_url,
          tiktok_url:
            formulario.tiktok_url,
          facebook_url:
            formulario.facebook_url,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          configuracionActual.id
        );

      errorGuardado = error;
    } else {
      const {
        error,
      } = await supabase
        .from("store_settings")
        .insert({
          store_name:
            formulario.store_name,
          whatsapp:
            formulario.whatsapp,
          address:
            formulario.address,
          maps_url:
            formulario.maps_url,
          instagram_url:
            formulario.instagram_url,
          tiktok_url:
            formulario.tiktok_url,
          facebook_url:
            formulario.facebook_url,
          updated_at:
            new Date().toISOString(),
        });

      errorGuardado = error;
    }

    if (errorGuardado) {
      setError(
        "No se pudieron guardar los cambios."
      );
      setGuardando(false);
      return;
    }

    setMensaje(
      "Configuración guardada correctamente."
    );

    setGuardando(false);
  }

  async function cambiarPortada(
    e,
    tipo
  ) {
    const archivo =
      e.target.files?.[0];

    if (!archivo) return;

    setSubiendo(tipo);
    setError("");
    setMensaje("");

    const extension =
      archivo.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const nombreArchivo =
      `${tipo}-${Date.now()}.${extension}`;

    const ruta =
      `portadas/${nombreArchivo}`;

    const {
      error: errorSubida,
    } = await supabase.storage
      .from("product-images")
      .upload(
        ruta,
        archivo,
        {
          upsert: true,
        }
      );

    if (errorSubida) {
      setError(
        "No se pudo subir la imagen."
      );

      setSubiendo("");
      return;
    }

    const {
      data: urlData,
    } = supabase.storage
      .from("product-images")
      .getPublicUrl(ruta);

    const nuevaUrl =
      urlData?.publicUrl ?? "";

    if (!nuevaUrl) {
      setError(
        "No se pudo obtener la URL de la imagen."
      );

      setSubiendo("");
      return;
    }

    const {
      data: existente,
      error: errorBusqueda,
    } = await supabase
      .from("store_settings")
      .select("id")
      .eq(
        "setting_key",
        tipo
      )
      .limit(1)
      .maybeSingle();

    if (errorBusqueda) {
      setError(
        "No se pudo guardar la portada."
      );

      setSubiendo("");
      return;
    }

    let errorGuardado = null;

    if (existente?.id) {
      const {
        error,
      } = await supabase
        .from("store_settings")
        .update({
          setting_value:
            nuevaUrl,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          existente.id
        );

      errorGuardado = error;
    } else {
      const {
        error,
      } = await supabase
        .from("store_settings")
        .insert({
          setting_key:
            tipo,
          setting_value:
            nuevaUrl,
          store_name:
            formulario.store_name ||
            "GMISH",
          updated_at:
            new Date().toISOString(),
        });

      errorGuardado = error;
    }

    if (errorGuardado) {
      setError(
        "La imagen se subió, pero no se pudo guardar la portada."
      );

      setSubiendo("");
      return;
    }

    setPortadas((actual) => ({
      ...actual,
      [tipo]: nuevaUrl,
    }));

    setMensaje(
      "Portada actualizada correctamente."
    );

    setSubiendo("");
  }

  function renderPortada(
    titulo,
    descripcion,
    tipo
  ) {
    const imagen =
      portadas[tipo];

    return (
      <div className={`${tarjeta} overflow-hidden`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold">
            {titulo}
          </h3>

          <p className="mt-2 text-sm text-[#888888]">
            {descripcion}
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#303030] bg-[#0d0d0d]">
            {imagen ? (
              <img
                src={imagen}
                alt={titulo}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-[#666666]">
                No hay portada configurada
              </div>
            )}
          </div>

          <label className="mt-5 flex cursor-pointer items-center justify-center rounded-xl border border-[#454545] bg-[#222222] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]">
            {subiendo === tipo
              ? "Subiendo..."
              : "Cambiar portada"}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={
                subiendo !== ""
              }
              onChange={(e) =>
                cambiarPortada(
                  e,
                  tipo
                )
              }
            />
          </label>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <section className="space-y-5">
        <div>
          <p className="text-sm text-[#888888]">
            Tienda
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Configuración
          </h2>
        </div>

        <div className={`${tarjeta} p-6`}>
          <p className="text-sm text-[#888888]">
            Cargando configuración...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-[#9b9b9b]">
          Tienda
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Portadas y configuración
        </h2>

        <p className="mt-2 text-sm text-[#888888]">
          Administra las imágenes principales y la
          información pública de GMISH.
        </p>
      </div>

      {mensaje && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {renderPortada(
          "Portada principal",
          "Imagen que aparecerá en la página principal.",
          "portada_principal"
        )}

        {renderPortada(
          "Portada Hombre",
          "Imagen utilizada para la sección de Hombre.",
          "portada_hombre"
        )}

        {renderPortada(
          "Portada Mujer",
          "Imagen utilizada para la sección de Mujer.",
          "portada_mujer"
        )}
      </div>

      <div className={`${tarjeta} p-6`}>
        <div>
          <h3 className="text-lg font-semibold">
            Información de la tienda
          </h3>

          <p className="mt-1 text-sm text-[#888888]">
            Estos datos podrán aparecer públicamente en GMISH.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nombre de la tienda
            </label>

            <input
              className={campo}
              value={
                formulario.store_name
              }
              onChange={(e) =>
                cambiarCampo(
                  "store_name",
                  e.target.value
                )
              }
              placeholder="GMISH"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              WhatsApp
            </label>

            <input
              className={campo}
              value={
                formulario.whatsapp
              }
              onChange={(e) =>
                cambiarCampo(
                  "whatsapp",
                  e.target.value
                )
              }
              placeholder="51999999999"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Dirección
            </label>

            <input
              className={campo}
              value={
                formulario.address
              }
              onChange={(e) =>
                cambiarCampo(
                  "address",
                  e.target.value
                )
              }
              placeholder="Dirección de la tienda"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Google Maps
            </label>

            <input
              className={campo}
              value={
                formulario.maps_url
              }
              onChange={(e) =>
                cambiarCampo(
                  "maps_url",
                  e.target.value
                )
              }
              placeholder="Enlace de Google Maps"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Instagram
            </label>

            <input
              className={campo}
              value={
                formulario.instagram_url
              }
              onChange={(e) =>
                cambiarCampo(
                  "instagram_url",
                  e.target.value
                )
              }
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              TikTok
            </label>

            <input
              className={campo}
              value={
                formulario.tiktok_url
              }
              onChange={(e) =>
                cambiarCampo(
                  "tiktok_url",
                  e.target.value
                )
              }
              placeholder="https://tiktok.com/@..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Facebook
            </label>

            <input
              className={campo}
              value={
                formulario.facebook_url
              }
              onChange={(e) =>
                cambiarCampo(
                  "facebook_url",
                  e.target.value
                )
              }
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>

        <button
          type="button"
          className={`${botonPrincipal} mt-6`}
          onClick={guardarConfiguracion}
          disabled={guardando}
        >
          {guardando
            ? "Guardando..."
            : "Guardar cambios"}
        </button>
      </div>
    </section>
  );
}