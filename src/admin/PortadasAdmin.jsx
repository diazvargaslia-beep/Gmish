import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const TIPOS = [
  {
    id: "inicio",
    nombre: "Portada inicial",
    descripcion:
      "La portada principal que aparecerá en la página de Inicio.",
  },
  {
    id: "hombre",
    nombre: "Portada Hombre",
    descripcion:
      "La portada que aparecerá al entrar a la sección Hombre.",
  },
  {
    id: "mujer",
    nombre: "Portada Mujer",
    descripcion:
      "La portada que aparecerá al entrar a la sección Mujer.",
  },
];

export default function PortadasAdmin() {
  const [portadas, setPortadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const [subiendo, setSubiendo] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const inputsImagen = useRef({});

  useEffect(() => {
    cargarPortadas();
  }, []);

  async function cargarPortadas() {
    setCargando(true);
    setError("");

    const { data, error: errorConsulta } = await supabase
      .from("store_covers")
      .select(
        `
        id,
        tipo,
        imagen_url,
        titulo,
        descripcion,
        texto_boton,
        destino_boton,
        activo,
        orden
      `
      )
      .order("orden", { ascending: true });

    if (errorConsulta) {
      console.error("ERROR SUPABASE PORTADAS:", errorConsulta);

      setError(
        `Error de Supabase: ${
          errorConsulta.message || "Error desconocido"
        }`
      );

      setCargando(false);
      return;
    }

    const datos = TIPOS.map((tipo, index) => {
      const encontrada = data?.find(
        (item) => item.tipo === tipo.id
      );

      return (
        encontrada || {
          id: null,
          tipo: tipo.id,
          imagen_url: "",
          titulo: "",
          descripcion: "",
          texto_boton: "",
          destino_boton: "",
          activo: true,
          orden: index + 1,
        }
      );
    });

    setPortadas(datos);
    setCargando(false);
  }

  function cambiarCampo(tipo, campo, valor) {
    setPortadas((actuales) =>
      actuales.map((portada) =>
        portada.tipo === tipo
          ? {
              ...portada,
              [campo]: valor,
            }
          : portada
      )
    );
  }

  async function subirImagen(tipo, event) {
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

    if (archivo.size > 8 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 8 MB.");
      event.target.value = "";
      return;
    }

    try {
      setSubiendo(tipo);

      const extension =
        archivo.name.split(".").pop()?.toLowerCase() || "jpg";

      const nombreArchivo = `covers/${tipo}-${Date.now()}.${extension}`;

      const { error: errorSubida } = await supabase.storage
        .from("product-images")
        .upload(nombreArchivo, archivo, {
          cacheControl: "3600",
          upsert: false,
          contentType: archivo.type,
        });

      if (errorSubida) {
        console.error("ERROR SUBIENDO IMAGEN:", errorSubida);
        setError(
          `No se pudo subir la imagen: ${
            errorSubida.message || "Error desconocido"
          }`
        );
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(nombreArchivo);

      if (!data?.publicUrl) {
        setError("No se pudo obtener la URL de la imagen.");
        return;
      }

      const nuevaUrl = data.publicUrl;

      /*
       * Actualizamos la vista inmediatamente.
       */
      cambiarCampo(tipo, "imagen_url", nuevaUrl);

      /*
       * PORTADA INICIO
       *
       * Se mantiene el funcionamiento anterior:
       * subir la imagen NO la guarda automáticamente.
       * Para Inicio se sigue usando "GUARDAR PORTADA".
       */
      if (tipo === "inicio") {
        setMensaje("Imagen de inicio actualizada.");
        return;
      }

      /*
       * HOMBRE Y MUJER
       *
       * Como estas portadas no tienen botón "Guardar",
       * la imagen se guarda automáticamente en Supabase.
       */
      const portadaActual = portadas.find(
        (item) => item.tipo === tipo
      );

      let resultado;

      if (portadaActual?.id) {
        resultado = await supabase
          .from("store_covers")
          .update({
            imagen_url: nuevaUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", portadaActual.id)
          .select()
          .single();
      } else {
        resultado = await supabase
          .from("store_covers")
          .insert([
            {
              tipo,
              imagen_url: nuevaUrl,
              titulo: "",
              descripcion: "",
              texto_boton: "",
              destino_boton: "",
              activo: true,
              orden: tipo === "hombre" ? 2 : 3,
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();
      }

      if (resultado.error) {
        console.error(
          "ERROR GUARDANDO URL DE PORTADA:",
          resultado.error
        );

        setError(
          `La imagen se subió, pero no se pudo guardar en la portada ${
            tipo === "hombre" ? "Hombre" : "Mujer"
          }: ${
            resultado.error.message || "Error desconocido"
          }`
        );

        return;
      }

      /*
       * Reemplazamos el registro local por el que devolvió Supabase.
       * Así también queda actualizado el ID si fue un INSERT.
       */
      setPortadas((actuales) =>
        actuales.map((item) =>
          item.tipo === tipo
            ? resultado.data
            : item
        )
      );

      setMensaje(
        `Imagen de ${
          tipo === "hombre" ? "Hombre" : "Mujer"
        } guardada correctamente.`
      );

      setTimeout(() => {
        setMensaje("");
      }, 3000);
    } catch (err) {
      console.error("ERROR GENERAL SUBIENDO IMAGEN:", err);

      setError(
        err?.message ||
          "Ocurrió un error al subir y guardar la imagen."
      );
    } finally {
      setSubiendo(null);
      event.target.value = "";
    }
  }

  async function guardarPortada(portada) {
    setGuardando(portada.tipo);
    setMensaje("");
    setError("");

    const datos = {
      tipo: portada.tipo,
      imagen_url: portada.imagen_url?.trim() || "",
      titulo: portada.titulo?.trim() || "",
      descripcion: portada.descripcion?.trim() || "",
      texto_boton: portada.texto_boton?.trim() || "",
      destino_boton: portada.destino_boton?.trim() || "",
      activo: portada.activo,
      orden: portada.orden,
      updated_at: new Date().toISOString(),
    };

    let resultado;

    if (portada.id) {
      resultado = await supabase
        .from("store_covers")
        .update(datos)
        .eq("id", portada.id)
        .select()
        .single();
    } else {
      resultado = await supabase
        .from("store_covers")
        .insert([datos])
        .select()
        .single();
    }

    if (resultado.error) {
      console.error(resultado.error);

      setError(
        `No se pudo guardar la portada ${portada.tipo}.`
      );

      setGuardando(null);
      return;
    }

    setPortadas((actuales) =>
      actuales.map((item) =>
        item.tipo === portada.tipo
          ? resultado.data
          : item
      )
    );

    setMensaje(
      `${nombreTipo(portada.tipo)} guardada correctamente.`
    );

    setGuardando(null);

    setTimeout(() => {
      setMensaje("");
    }, 3000);
  }

  function nombreTipo(tipo) {
    const encontrada = TIPOS.find(
      (item) => item.id === tipo
    );

    return encontrada?.nombre || "Portada";
  }

  if (cargando) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "50vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f8f7f3",
          color: "#171717",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
          }}
        >
          Cargando portadas...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: "40px 2.5vw 70px",
        background: "#f8f7f3",
        color: "#171717",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* ENCABEZADO */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "38px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "Playfair Display, serif",
              fontSize: "30px",
              fontWeight: 500,
            }}
          >
            Portadas
          </h2>

          <p
            style={{
              maxWidth: "650px",
              margin: "10px auto 0",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              lineHeight: 1.7,
              color: "#777",
            }}
          >
            Administra las imágenes principales de Inicio, Hombre y Mujer.
          </p>
        </div>

        {/* MENSAJES */}
        {mensaje && (
          <div
            style={{
              marginBottom: "20px",
              textAlign: "center",
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
              marginBottom: "20px",
              textAlign: "center",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "#8a3333",
            }}
          >
            {error}
          </div>
        )}

        {/* PORTADAS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {TIPOS.map((tipo) => {
            const portada = portadas.find(
              (item) => item.tipo === tipo.id
            );

            if (!portada) return null;

            const esInicio = tipo.id === "inicio";

            return (
              <section
                key={tipo.id}
                style={{
                  width: "100%",
                  background: "#fff",
                  border: "1px solid #deddd8",
                  boxSizing: "border-box",
                  padding: "clamp(24px, 4vw, 45px)",
                }}
              >
                {/* TÍTULO */}
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "30px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "Playfair Display, serif",
                      fontSize: "25px",
                      fontWeight: 500,
                    }}
                  >
                    {tipo.nombre}
                  </h3>

                  <p
                    style={{
                      margin: "8px auto 0",
                      maxWidth: "650px",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      color: "#777",
                    }}
                  >
                    {tipo.descripcion}
                  </p>
                </div>

                {/* IMAGEN */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "900px",
                    margin: "0 auto 32px",
                  }}
                >
                  {portada.imagen_url ? (
                    <div
                      style={{
                        width: "100%",
                        border: "1px solid #deddd8",
                        background: "#f4f3ef",
                        padding: "8px",
                        boxSizing: "border-box",
                      }}
                    >
                      <img
                        src={portada.imagen_url}
                        alt={tipo.nombre}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "360px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "300px",
                        border: "1px dashed #c8c7c1",
                        background: "#fafaf8",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        boxSizing: "border-box",
                        color: "#999",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "13px",
                      }}
                    >
                      No hay una imagen seleccionada
                    </div>
                  )}

                  <input
                    ref={(element) => {
                      inputsImagen.current[tipo.id] = element;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(event) =>
                      subirImagen(tipo.id, event)
                    }
                    style={{ display: "none" }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        inputsImagen.current[tipo.id]?.click()
                      }
                      disabled={subiendo === tipo.id}
                      style={{
                        border: "1px solid #171717",
                        background: "#171717",
                        color: "#fff",
                        padding: "12px 25px",
                        cursor:
                          subiendo === tipo.id
                            ? "wait"
                            : "pointer",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "12px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        opacity:
                          subiendo === tipo.id ? 0.6 : 1,
                      }}
                    >
                      {subiendo === tipo.id
                        ? "GUARDANDO..."
                        : "CAMBIAR IMAGEN"}
                    </button>
                  </div>
                </div>

                {/* SOLO INICIO CONSERVA TODAS LAS OPCIONES */}
                {esInicio && (
                  <>
                    {/* CAMPOS */}
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
                        label="Título"
                        value={portada.titulo}
                        onChange={(value) =>
                          cambiarCampo(
                            tipo.id,
                            "titulo",
                            value
                          )
                        }
                        placeholder="Ej. NUEVA COLECCIÓN"
                      />

                      <Campo
                        label="Texto del botón"
                        value={portada.texto_boton}
                        onChange={(value) =>
                          cambiarCampo(
                            tipo.id,
                            "texto_boton",
                            value
                          )
                        }
                        placeholder="VER COLECCIÓN"
                      />

                      <div
                        style={{
                          width: "100%",
                          gridColumn: "1 / -1",
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            marginBottom: "9px",
                            textAlign: "center",
                            fontFamily:
                              "DM Sans, sans-serif",
                            fontSize: "12px",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}
                        >
                          Descripción
                        </label>

                        <textarea
                          value={portada.descripcion}
                          onChange={(event) =>
                            cambiarCampo(
                              tipo.id,
                              "descripcion",
                              event.target.value
                            )
                          }
                          rows={4}
                          placeholder="Texto que aparecerá sobre la portada..."
                          style={{
                            display: "block",
                            width: "100%",
                            boxSizing: "border-box",
                            border:
                              "1px solid #d7d6d1",
                            background: "#fafaf8",
                            padding: "14px 16px",
                            outline: "none",
                            resize: "vertical",
                            fontFamily:
                              "DM Sans, sans-serif",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "#171717",
                          }}
                        />
                      </div>

                      <Campo
                        label="Destino del botón"
                        value={portada.destino_boton}
                        onChange={(value) =>
                          cambiarCampo(
                            tipo.id,
                            "destino_boton",
                            value
                          )
                        }
                        placeholder="hombre, mujer, ofertas..."
                        fullWidth
                      />
                    </div>

                    {/* ACTIVO + GUARDAR */}
                    <div
                      style={{
                        marginTop: "30px",
                        paddingTop: "25px",
                        borderTop: "1px solid #e2e1dc",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "18px",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: "pointer",
                          fontFamily:
                            "DM Sans, sans-serif",
                          fontSize: "13px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={portada.activo}
                          onChange={(event) =>
                            cambiarCampo(
                              tipo.id,
                              "activo",
                              event.target.checked
                            )
                          }
                        />

                        Mostrar esta portada
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          guardarPortada(portada)
                        }
                        disabled={
                          guardando === tipo.id
                        }
                        style={{
                          border: "none",
                          background: "#171717",
                          color: "#fff",
                          padding: "14px 35px",
                          cursor:
                            guardando === tipo.id
                              ? "wait"
                              : "pointer",
                          fontFamily:
                            "DM Sans, sans-serif",
                          fontSize: "12px",
                          fontWeight: 600,
                          letterSpacing: "0.12em",
                          textTransform:
                            "uppercase",
                          opacity:
                            guardando === tipo.id
                              ? 0.6
                              : 1,
                        }}
                      >
                        {guardando === tipo.id
                          ? "GUARDANDO..."
                          : "GUARDAR PORTADA"}
                      </button>
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
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
        gridColumn: fullWidth
          ? "1 / -1"
          : undefined,
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
        onChange={(event) =>
          onChange(event.target.value)
        }
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