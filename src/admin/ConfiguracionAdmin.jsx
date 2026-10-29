import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const HORARIO_INICIAL = {
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
};

const DIAS = [
  { id: "lunes", nombre: "Lunes" },
  { id: "martes", nombre: "Martes" },
  { id: "miercoles", nombre: "Miércoles" },
  { id: "jueves", nombre: "Jueves" },
  { id: "viernes", nombre: "Viernes" },
  { id: "sabado", nombre: "Sábado" },
  { id: "domingo", nombre: "Domingo" },
];

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

  const [horarios, setHorarios] = useState(HORARIO_INICIAL);
  const [fechasEspeciales, setFechasEspeciales] = useState([]);

  const [modalFecha, setModalFecha] = useState(false);

  const [fechaNueva, setFechaNueva] = useState({
    fecha: "",
    abierto: false,
    apertura: "09:00",
    cierre: "21:00",
    motivo: "",
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
        tienda_horarios,
        tienda_fechas_especiales,
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

      if (data.tienda_horarios) {
        setHorarios(
          normalizarHorarios(data.tienda_horarios)
        );
      } else {
        setHorarios(HORARIO_INICIAL);
      }

      if (Array.isArray(data.tienda_fechas_especiales)) {
        setFechasEspeciales(
          ordenarFechasEspeciales(data.tienda_fechas_especiales)
        );
      } else {
        setFechasEspeciales([]);
      }
    }

    setCargando(false);
  }

  function normalizarHorarios(horariosGuardados) {
    const resultado = {};

    DIAS.forEach(({ id }) => {
      const horario = horariosGuardados?.[id];

      resultado[id] = {
        abierto:
          typeof horario?.abierto === "boolean"
            ? horario.abierto
            : HORARIO_INICIAL[id].abierto,
        apertura:
          horario?.apertura ||
          HORARIO_INICIAL[id].apertura,
        cierre:
          horario?.cierre ||
          HORARIO_INICIAL[id].cierre,
      };
    });

    return resultado;
  }

  function ordenarFechasEspeciales(fechas) {
    return [...fechas].sort((a, b) =>
      String(a.fecha || "").localeCompare(
        String(b.fecha || "")
      )
    );
  }

  function cambiarCampo(campo, valor) {
    setConfig((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function cambiarHorario(dia, campo, valor) {
    setHorarios((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [campo]: valor,
      },
    }));
  }

  function normalizarWhatsApp(numero) {
    return numero.replace(/[^\d]/g, "");
  }

  function formatoHorarioTexto() {
    const diasAbiertos = DIAS.filter(
      ({ id }) => horarios[id]?.abierto
    );

    if (diasAbiertos.length === 0) {
      return "Tienda cerrada";
    }

    const horariosUnicos = [
      ...new Set(
        diasAbiertos.map(
          ({ id }) =>
            `${horarios[id].apertura} — ${horarios[id].cierre}`
        )
      ),
    ];

    if (horariosUnicos.length === 1) {
      const dias = diasAbiertos.map(({ nombre }) => nombre);

      return `${dias.join(", ")}: ${horariosUnicos[0]}`;
    }

    return "Horario actualizado en configuración";
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

      // Se mantiene sincronizado como texto para compatibilidad
      // con cualquier parte antigua de la tienda.
      tienda_horario: formatoHorarioTexto(),

      tienda_horarios: horarios,
      tienda_fechas_especiales: fechasEspeciales,

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
        "No se pudo guardar la configuración. Verifica que las columnas tienda_horarios y tienda_fechas_especiales existan en Supabase."
      );

      setGuardando(false);
      return;
    }

    setConfig((prev) => ({
      ...prev,
      id: resultado.data.id,
      tienda_horario:
        resultado.data.tienda_horario ?? "",
      whatsapp_1: resultado.data.whatsapp_1 ?? "",
      whatsapp_2: resultado.data.whatsapp_2 ?? "",
    }));

    setMensaje("Configuración guardada correctamente.");
    setGuardando(false);

    setTimeout(() => {
      setMensaje("");
    }, 3000);
  }

  function abrirModalFecha() {
    setFechaNueva({
      fecha: "",
      abierto: false,
      apertura: "09:00",
      cierre: "21:00",
      motivo: "",
    });

    setError("");
    setModalFecha(true);
  }

  function cerrarModalFecha() {
    setModalFecha(false);
  }

  function guardarFechaEspecial() {
    setError("");

    if (!fechaNueva.fecha) {
      setError("Selecciona una fecha especial.");
      return;
    }

    const yaExiste = fechasEspeciales.some(
      (item) => item.fecha === fechaNueva.fecha
    );

    if (yaExiste) {
      setError(
        "Ya existe una fecha especial configurada para ese día."
      );
      return;
    }

    if (
      fechaNueva.abierto &&
      (!fechaNueva.apertura || !fechaNueva.cierre)
    ) {
      setError(
        "Si la tienda estará abierta, debes indicar la hora de apertura y cierre."
      );
      return;
    }

    if (
      fechaNueva.abierto &&
      fechaNueva.apertura >= fechaNueva.cierre
    ) {
      setError(
        "La hora de apertura debe ser anterior a la hora de cierre."
      );
      return;
    }

    const nuevaFecha = {
      fecha: fechaNueva.fecha,
      abierto: fechaNueva.abierto,
      apertura: fechaNueva.abierto
        ? fechaNueva.apertura
        : null,
      cierre: fechaNueva.abierto
        ? fechaNueva.cierre
        : null,
      motivo: fechaNueva.motivo.trim(),
    };

    setFechasEspeciales((prev) =>
      ordenarFechasEspeciales([
        ...prev,
        nuevaFecha,
      ])
    );

    setModalFecha(false);

    setFechaNueva({
      fecha: "",
      abierto: false,
      apertura: "09:00",
      cierre: "21:00",
      motivo: "",
    });
  }

  function eliminarFechaEspecial(fecha) {
    setFechasEspeciales((prev) =>
      prev.filter((item) => item.fecha !== fecha)
    );
  }

  function cambiarFechaEspecial(
    fecha,
    campo,
    valor
  ) {
    setFechasEspeciales((prev) =>
      prev.map((item) =>
        item.fecha === fecha
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );
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

      cambiarCampo(
        "tienda_imagen_url",
        data.publicUrl
      );

      setMensaje("Imagen seleccionada correctamente.");
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al subir la imagen.");
    } finally {
      setSubiendoImagen(false);
      event.target.value = "";
    }
  }

  function formatearFecha(fecha) {
    if (!fecha) return "";

    const [anio, mes, dia] = fecha.split("-");

    if (!anio || !mes || !dia) {
      return fecha;
    }

    const fechaObj = new Date(
      Number(anio),
      Number(mes) - 1,
      Number(dia)
    );

    return fechaObj.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
                label="Enlace de Google Maps"
                value={config.tienda_maps_url}
                onChange={(value) =>
                  cambiarCampo("tienda_maps_url", value)
                }
                placeholder="https://maps.google.com/..."
                fullWidth
              />
            </div>

            {/* HORARIO DE ATENCIÓN */}
            <div
              style={{
                marginTop: "42px",
                borderTop: "1px solid #e2e1dc",
                paddingTop: "35px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "25px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Horario de atención
                </h3>

                <p
                  style={{
                    margin: "8px 0 0",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "12px",
                    color: "#888",
                  }}
                >
                  Puedes modificar el horario cuando quieras.
                </p>
              </div>

              <div
                style={{
                  width: "100%",
                  border: "1px solid #deddd8",
                  background: "#fafaf8",
                }}
              >
                {DIAS.map(({ id, nombre }, index) => {
                  const horario = horarios[id];

                  return (
                    <div
                      key={id}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(110px, 1fr) minmax(100px, 1fr) minmax(180px, 1.5fr)",
                        gap: "15px",
                        alignItems: "center",
                        padding: "16px 18px",
                        borderBottom:
                          index < DIAS.length - 1
                            ? "1px solid #e5e4df"
                            : "none",
                        boxSizing: "border-box",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        {nombre}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarHorario(
                            id,
                            "abierto",
                            !horario.abierto
                          )
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "12px",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          color: horario.abierto
                            ? "#171717"
                            : "#999",
                        }}
                      >
                        {horario.abierto
                          ? "● ABIERTO"
                          : "○ CERRADO"}
                      </button>

                      {horario.abierto ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <input
                            type="time"
                            value={horario.apertura}
                            onChange={(e) =>
                              cambiarHorario(
                                id,
                                "apertura",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100%",
                              border: "1px solid #d7d6d1",
                              background: "#fff",
                              padding: "10px",
                              boxSizing: "border-box",
                              fontFamily:
                                "DM Sans, sans-serif",
                              fontSize: "13px",
                            }}
                          />

                          <span
                            style={{
                              fontFamily:
                                "DM Sans, sans-serif",
                              color: "#888",
                            }}
                          >
                            —
                          </span>

                          <input
                            type="time"
                            value={horario.cierre}
                            onChange={(e) =>
                              cambiarHorario(
                                id,
                                "cierre",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100%",
                              border: "1px solid #d7d6d1",
                              background: "#fff",
                              padding: "10px",
                              boxSizing: "border-box",
                              fontFamily:
                                "DM Sans, sans-serif",
                              fontSize: "13px",
                            }}
                          />
                        </div>
                      ) : (
                        <span
                          style={{
                            fontFamily:
                              "DM Sans, sans-serif",
                            fontSize: "12px",
                            color: "#999",
                          }}
                        >
                          No atendemos este día
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FECHAS ESPECIALES */}
            <div
              style={{
                marginTop: "38px",
                borderTop: "1px solid #e2e1dc",
                paddingTop: "35px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                  marginBottom:
                    fechasEspeciales.length > 0 ? "22px" : "0",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    Fechas especiales
                  </h3>

                  {fechasEspeciales.length > 0 && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontFamily:
                          "DM Sans, sans-serif",
                        fontSize: "12px",
                        color: "#888",
                      }}
                    >
                      Estas fechas reemplazan el horario habitual.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={abrirModalFecha}
                  style={{
                    flexShrink: 0,
                    border: "1px solid #171717",
                    background: "#171717",
                    color: "#fff",
                    padding: "11px 16px",
                    cursor: "pointer",
                    fontFamily:
                      "DM Sans, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  + Agregar fecha
                </button>
              </div>

              {fechasEspeciales.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {fechasEspeciales.map((item) => (
                    <div
                      key={item.fecha}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(180px, 1.5fr) minmax(100px, 0.7fr) minmax(160px, 1fr) auto",
                        gap: "15px",
                        alignItems: "center",
                        border: "1px solid #deddd8",
                        background: "#fafaf8",
                        padding: "15px 16px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontFamily:
                              "DM Sans, sans-serif",
                            fontSize: "13px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {formatearFecha(item.fecha)}
                        </p>

                        {item.motivo && (
                          <p
                            style={{
                              margin: "5px 0 0",
                              fontFamily:
                                "DM Sans, sans-serif",
                              fontSize: "11px",
                              color: "#888",
                            }}
                          >
                            {item.motivo}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarFechaEspecial(
                            item.fecha,
                            "abierto",
                            !item.abierto
                          )
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily:
                            "DM Sans, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: item.abierto
                            ? "#171717"
                            : "#999",
                        }}
                      >
                        {item.abierto
                          ? "● ABIERTO"
                          : "○ CERRADO"}
                      </button>

                      {item.abierto ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="time"
                            value={item.apertura || "09:00"}
                            onChange={(e) =>
                              cambiarFechaEspecial(
                                item.fecha,
                                "apertura",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100%",
                              border: "1px solid #d7d6d1",
                              background: "#fff",
                              padding: "8px",
                              boxSizing: "border-box",
                              fontFamily:
                                "DM Sans, sans-serif",
                              fontSize: "12px",
                            }}
                          />

                          <span
                            style={{
                              color: "#888",
                            }}
                          >
                            —
                          </span>

                          <input
                            type="time"
                            value={item.cierre || "21:00"}
                            onChange={(e) =>
                              cambiarFechaEspecial(
                                item.fecha,
                                "cierre",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100%",
                              border: "1px solid #d7d6d1",
                              background: "#fff",
                              padding: "8px",
                              boxSizing: "border-box",
                              fontFamily:
                                "DM Sans, sans-serif",
                              fontSize: "12px",
                            }}
                          />
                        </div>
                      ) : (
                        <span
                          style={{
                            fontFamily:
                              "DM Sans, sans-serif",
                            fontSize: "12px",
                            color: "#999",
                          }}
                        >
                          Cerrado todo el día
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          eliminarFechaEspecial(item.fecha)
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#999",
                          cursor: "pointer",
                          fontFamily:
                            "DM Sans, sans-serif",
                          fontSize: "11px",
                          textDecoration: "underline",
                          padding: "5px",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DESCRIPCIÓN */}
            <div style={{ marginTop: "35px", width: "100%" }}>
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
                    fontFamily:
                      "DM Sans, sans-serif",
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
                onClick={() =>
                  inputImagenRef.current?.click()
                }
                disabled={subiendoImagen}
                style={{
                  border: "1px solid #171717",
                  background: "#171717",
                  color: "#fff",
                  padding: "12px 25px",
                  cursor: subiendoImagen
                    ? "wait"
                    : "pointer",
                  fontFamily:
                    "DM Sans, sans-serif",
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
                fontFamily:
                  "DM Sans, sans-serif",
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
                fontFamily:
                  "DM Sans, sans-serif",
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
              fontFamily:
                "DM Sans, sans-serif",
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
              fontFamily:
                "DM Sans, sans-serif",
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
              cursor: guardando
                ? "wait"
                : "pointer",
              fontFamily:
                "DM Sans, sans-serif",
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
            fontFamily:
              "DM Sans, sans-serif",
            fontSize: "12px",
            lineHeight: 1.6,
            color: "#888",
          }}
        >
          Los cambios se reflejarán en la información pública de G’MISH.
        </p>
      </div>

      {/* MODAL FECHA ESPECIAL */}
      {modalFecha && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarModalFecha();
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "#fff",
              border: "1px solid #deddd8",
              padding: "30px",
              boxSizing: "border-box",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "28px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily:
                    "Playfair Display, serif",
                  fontSize: "25px",
                  fontWeight: 500,
                }}
              >
                Fecha especial
              </h3>

              <p
                style={{
                  margin: "8px 0 0",
                  fontFamily:
                    "DM Sans, sans-serif",
                  fontSize: "12px",
                  color: "#888",
                }}
              >
                Esta fecha reemplazará el horario habitual.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <Campo
                label="Fecha"
                value={fechaNueva.fecha}
                onChange={(value) =>
                  setFechaNueva((prev) => ({
                    ...prev,
                    fecha: value,
                  }))
                }
                type="date"
              />

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "9px",
                    textAlign: "center",
                    fontFamily:
                      "DM Sans, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Estado
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setFechaNueva((prev) => ({
                        ...prev,
                        abierto: true,
                      }))
                    }
                    style={{
                      border: fechaNueva.abierto
                        ? "1px solid #171717"
                        : "1px solid #d7d6d1",
                      background:
                        fechaNueva.abierto
                          ? "#171717"
                          : "#fafaf8",
                      color:
                        fechaNueva.abierto
                          ? "#fff"
                          : "#171717",
                      padding: "12px",
                      cursor: "pointer",
                      fontFamily:
                        "DM Sans, sans-serif",
                      fontSize: "12px",
                    }}
                  >
                    ABIERTO
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFechaNueva((prev) => ({
                        ...prev,
                        abierto: false,
                      }))
                    }
                    style={{
                      border: !fechaNueva.abierto
                        ? "1px solid #171717"
                        : "1px solid #d7d6d1",
                      background:
                        !fechaNueva.abierto
                          ? "#171717"
                          : "#fafaf8",
                      color:
                        !fechaNueva.abierto
                          ? "#fff"
                          : "#171717",
                      padding: "12px",
                      cursor: "pointer",
                      fontFamily:
                        "DM Sans, sans-serif",
                      fontSize: "12px",
                    }}
                  >
                    CERRADO
                  </button>
                </div>
              </div>

              {fechaNueva.abierto && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <Campo
                    label="Apertura"
                    value={fechaNueva.apertura}
                    onChange={(value) =>
                      setFechaNueva((prev) => ({
                        ...prev,
                        apertura: value,
                      }))
                    }
                    type="time"
                  />

                  <Campo
                    label="Cierre"
                    value={fechaNueva.cierre}
                    onChange={(value) =>
                      setFechaNueva((prev) => ({
                        ...prev,
                        cierre: value,
                      }))
                    }
                    type="time"
                  />
                </div>
              )}

              <Campo
                label="Motivo · Opcional"
                value={fechaNueva.motivo}
                onChange={(value) =>
                  setFechaNueva((prev) => ({
                    ...prev,
                    motivo: value,
                  }))
                }
                placeholder="Ej. Feriado, aniversario..."
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "28px",
              }}
            >
              <button
                type="button"
                onClick={cerrarModalFecha}
                style={{
                  border: "1px solid #d7d6d1",
                  background: "#fff",
                  color: "#171717",
                  padding: "12px 20px",
                  cursor: "pointer",
                  fontFamily:
                    "DM Sans, sans-serif",
                  fontSize: "12px",
                }}
              >
                CANCELAR
              </button>

              <button
                type="button"
                onClick={guardarFechaEspecial}
                style={{
                  border: "1px solid #171717",
                  background: "#171717",
                  color: "#fff",
                  padding: "12px 20px",
                  cursor: "pointer",
                  fontFamily:
                    "DM Sans, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                AGREGAR FECHA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  fullWidth = false,
  type = "text",
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
          fontFamily:
            "DM Sans, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
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
          fontFamily:
            "DM Sans, sans-serif",
          fontSize: "14px",
          color: "#171717",
          textAlign:
            type === "text"
              ? "center"
              : "left",
        }}
      />
    </div>
  );
}