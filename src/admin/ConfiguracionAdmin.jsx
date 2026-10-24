import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ConfiguracionAdmin() {
  const [config, setConfig] = useState({
    id: null,
    tienda_nombre: "",
    tienda_direccion: "",
    tienda_horario: "",
    tienda_maps_url: "",
    tienda_imagen_url: "",
    tienda_descripcion: "",
    whatsapp_1: "",
    whatsapp_2: "",
    tiktok_url: "",
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const inputImagenRef = useRef(null);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setCargando(true);
    setError("");

    const { data, error } = await supabase
      .from("store_settings")
      .select(`
        id,
        tienda_nombre,
        tienda_direccion,
        tienda_horario,
        tienda_maps_url,
        tienda_imagen_url,
        tienda_descripcion,
        whatsapp_1,
        whatsapp_2,
        tiktok_url
      `)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      setError("No se pudo cargar la configuración.");
      setCargando(false);
      return;
    }

    if (data) {
      setConfig({
        id: data.id ?? null,
        tienda_nombre: data.tienda_nombre ?? "",
        tienda_direccion: data.tienda_direccion ?? "",
        tienda_horario: data.tienda_horario ?? "",
        tienda_maps_url: data.tienda_maps_url ?? "",
        tienda_imagen_url: data.tienda_imagen_url ?? "",
        tienda_descripcion: data.tienda_descripcion ?? "",
        whatsapp_1: data.whatsapp_1 ?? "",
        whatsapp_2: data.whatsapp_2 ?? "",
        tiktok_url: data.tiktok_url ?? "",
      });
    }

    setCargando(false);
  }

  function cambiarCampo(campo, valor) {
    setConfig((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function normalizarWhatsApp(numero) {
    return numero.replace(/[^\d]/g, "");
  }

  async function guardarConfiguracion() {
    setGuardando(true);
    setMensaje("");
    setError("");

    const whatsapp1Normalizado = normalizarWhatsApp(
      config.whatsapp_1.trim()
    );

    const whatsapp2Normalizado = normalizarWhatsApp(
      config.whatsapp_2.trim()
    );

    if (
      whatsapp1Normalizado &&
      whatsapp1Normalizado.length < 9
    ) {
      setError("El WhatsApp 1 no parece ser un número válido.");
      setGuardando(false);
      return;
    }

    if (
      whatsapp2Normalizado &&
      whatsapp2Normalizado.length < 9
    ) {
      setError("El WhatsApp 2 no parece ser un número válido.");
      setGuardando(false);
      return;
    }

    if (
      !whatsapp1Normalizado &&
      !whatsapp2Normalizado
    ) {
      setError(
        "Debes configurar al menos un número de WhatsApp."
      );
      setGuardando(false);
      return;
    }

    const datos = {
      tienda_nombre: config.tienda_nombre.trim(),
      tienda_direccion: config.tienda_direccion.trim(),
      tienda_horario: config.tienda_horario.trim(),
      tienda_maps_url: config.tienda_maps_url.trim(),
      tienda_imagen_url: config.tienda_imagen_url.trim(),
      tienda_descripcion: config.tienda_descripcion.trim(),
      whatsapp_1: whatsapp1Normalizado,
      whatsapp_2: whatsapp2Normalizado,
      tiktok_url: config.tiktok_url.trim(),
    };

    let resultado;

    if (config.id) {
      resultado = await supabase
        .from("store_settings")
        .update(datos)
        .eq("id", config.id)
        .select()
        .single();
    } else {
      resultado = await supabase
        .from("store_settings")
        .insert([datos])
        .select()
        .single();
    }

    if (resultado.error) {
      console.error(resultado.error);

      setError(
        "No se pudo guardar la configuración. Verifica que las columnas whatsapp_1 y whatsapp_2 existan en Supabase."
      );

      setGuardando(false);
      return;
    }

    setConfig((prev) => ({
      ...prev,
      id: resultado.data.id,
      whatsapp_1: resultado.data.whatsapp_1 ?? "",
      whatsapp_2: resultado.data.whatsapp_2 ?? "",
    }));

    setMensaje("Configuración guardada correctamente.");
    setGuardando(false);

    setTimeout(() => {
      setMensaje("");
    }, 3000);
  }

  async function seleccionarImagen(event) {
    const archivo = event.target.files?.[0];

    if (!archivo) return;

    setMensaje("");
    setError("");

    const tiposPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      setError("Solo puedes subir imágenes JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setSubiendoImagen(true);

      const extension =
        archivo.name.split(".").pop()?.toLowerCase() || "jpg";

      const nombreArchivo = `store/visitanos-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(nombreArchivo, archivo, {
          cacheControl: "3600",
          upsert: false,
          contentType: archivo.type,
        });

      if (uploadError) {
        console.error(uploadError);
        setError("No se pudo subir la imagen.");
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(nombreArchivo);

      if (!data?.publicUrl) {
        setError("No se pudo obtener la URL de la imagen.");
        return;
      }

      cambiarCampo("tienda_imagen_url", data.publicUrl);
      setMensaje("Imagen seleccionada correctamente.");
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al subir la imagen.");
    } finally {
      setSubiendoImagen(false);
      event.target.value = "";
    }
  }

  if (cargando) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f8f7f3",
          color: "#171717",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
          }}
        >
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        justifyContent: "center",
        background: "#f8f7f3",
        color: "#171717",
        boxSizing: "border-box",
        padding: "40px 2.5vw 70px",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        {/* INFORMACIÓN PÚBLICA */}
        <section
          style={{
            width: "100%",
            maxWidth: "100%",
            background: "#fff",
            border: "1px solid #deddd8",
            boxSizing: "border-box",
            padding: "clamp(25px, 4vw, 48px)",
            margin: "0 auto 24px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "Playfair Display, serif",
                fontSize: "27px",
                fontWeight: 500,
              }}
            >
              Información pública
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                color: "#777",
              }}
            >
              Esta información será visible para tus clientes.
            </p>
          </div>

          {/* TIENDA FÍSICA */}
          <div
            style={{
              width: "100%",
              marginBottom: "45px",
            }}
          >
            <h3
              style={{
                margin: "0 0 25px",
                textAlign: "center",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Tienda física
            </h3>

            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "22px",
                boxSizing: "border-box",
              }}
            >
              <Campo
                label="Nombre de la tienda"
                value={config.tienda_nombre}
                onChange={(value) =>
                  cambiarCampo("tienda_nombre", value)
                }
                placeholder="G’MISH"
              />

              <Campo
                label="Dirección"
                value={config.tienda_direccion}
                onChange={(value) =>
                  cambiarCampo("tienda_direccion", value)
                }
                placeholder="Dirección de la tienda"
              />

              <Campo
                label="Horario"
                value={config.tienda_horario}
                onChange={(value) =>
                  cambiarCampo("tienda_horario", value)
                }
                placeholder="Lunes a sábado: 9:00 AM - 8:00 PM"
              />

              <Campo
                label="Enlace de Google Maps"
                value={config.tienda_maps_url}
                onChange={(value) =>
                  cambiarCampo("tienda_maps_url", value)
                }
                placeholder="https://maps.google.com/..."
                fullWidth
              />
            </div>

            {/* DESCRIPCIÓN */}
            <div style={{ marginTop: "22px", width: "100%" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "9px",
                  textAlign: "center",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                Descripción
              </label>

              <textarea
                value={config.tienda_descripcion}
                onChange={(e) =>
                  cambiarCampo(
                    "tienda_descripcion",
                    e.target.value
                  )
                }
                placeholder="Cuéntales a tus clientes sobre tu tienda..."
                rows={5}
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #d7d6d1",
                  background: "#fafaf8",
                  padding: "15px 17px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "#171717",
                }}
              />
            </div>

            {/* FOTO DEL LOCAL */}
            <div
              style={{
                marginTop: "32px",
                textAlign: "center",
                width: "100%",
              }}
            >
              <p
                style={{
                  margin: "0 0 15px",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                Foto del local
              </p>

              {config.tienda_imagen_url ? (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "700px",
                    margin: "0 auto 18px",
                    border: "1px solid #deddd8",
                    background: "#f4f3ef",
                    padding: "8px",
                    boxSizing: "border-box",
                  }}
                >
                  <img
                    src={config.tienda_imagen_url}
                    alt="Foto del local"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "100%",
                      maxHeight: "420px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "700px",
                    height: "220px",
                    margin: "0 auto 18px",
                    border: "1px dashed #c8c7c1",
                    background: "#fafaf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                >
                  No hay una imagen seleccionada
                </div>
              )}

              <input
                ref={inputImagenRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={seleccionarImagen}
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => inputImagenRef.current?.click()}
                disabled={subiendoImagen}
                style={{
                  border: "1px solid #171717",
                  background: "#171717",
                  color: "#fff",
                  padding: "12px 25px",
                  cursor: subiendoImagen ? "wait" : "pointer",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  opacity: subiendoImagen ? 0.6 : 1,
                }}
              >
                {subiendoImagen
                  ? "SUBIENDO..."
                  : "SELECCIONAR IMAGEN"}
              </button>
            </div>
          </div>

          {/* CONTACTO */}
          <div
            style={{
              width: "100%",
              borderTop: "1px solid #e2e1dc",
              paddingTop: "40px",
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                margin: "0 0 25px",
                textAlign: "center",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Contacto
            </h3>

            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "22px",
                boxSizing: "border-box",
              }}
            >
              <Campo
                label="WhatsApp 1 · Principal"
                value={config.whatsapp_1}
                onChange={(value) =>
                  cambiarCampo("whatsapp_1", value)
                }
                placeholder="+51 999 999 999"
              />

              <Campo
                label="WhatsApp 2 · Respaldo"
                value={config.whatsapp_2}
                onChange={(value) =>
                  cambiarCampo("whatsapp_2", value)
                }
                placeholder="+51 999 999 999"
              />

              <Campo
                label="TikTok"
                value={config.tiktok_url}
                onChange={(value) =>
                  cambiarCampo("tiktok_url", value)
                }
                placeholder="https://www.tiktok.com/@..."
                fullWidth
              />
            </div>

            <p
              style={{
                margin: "15px 0 0",
                textAlign: "center",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                lineHeight: 1.6,
                color: "#888",
              }}
            >
              El WhatsApp 1 será el contacto principal para
              recibir pedidos. El WhatsApp 2 quedará como
              contacto de respaldo por si el primero no está
              disponible.
            </p>
          </div>
        </section>

        {/* MENSAJES */}
        {mensaje && (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              marginBottom: "18px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "#555",
            }}
          >
            {mensaje}
          </div>
        )}

        {error && (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              marginBottom: "18px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "#8a3333",
            }}
          >
            {error}
          </div>
        )}

        {/* GUARDAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            marginTop: "10px",
          }}
        >
          <button
            type="button"
            onClick={guardarConfiguracion}
            disabled={guardando}
            style={{
              border: "none",
              background: "#171717",
              color: "#fff",
              padding: "15px 42px",
              cursor: guardando ? "wait" : "pointer",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: guardando ? 0.6 : 1,
            }}
          >
            {guardando
              ? "GUARDANDO..."
              : "GUARDAR CONFIGURACIÓN"}
          </button>
        </div>

        <p
          style={{
            margin: "18px auto 0",
            maxWidth: "650px",
            textAlign: "center",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "12px",
            lineHeight: 1.6,
            color: "#888",
          }}
        >
          Los cambios se reflejarán en la información pública de G’MISH.
        </p>
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  fullWidth = false,
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        gridColumn: fullWidth ? "1 / -1" : undefined,
        boxSizing: "border-box",
      }}
    >
      <label
        style={{
          display: "block",
          marginBottom: "9px",
          textAlign: "center",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          display: "block",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          border: "1px solid #d7d6d1",
          background: "#fafaf8",
          padding: "14px 16px",
          outline: "none",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "14px",
          color: "#171717",
          textAlign: "center",
        }}
      />
    </div>
  );
}