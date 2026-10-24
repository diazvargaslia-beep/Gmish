import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Contactanos({ onSelectCategory }) {
  const [config, setConfig] = useState({
    whatsapp_1: "",
    whatsapp_2: "",
    tiktok_url: "",
  });

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarContacto();
  }, []);

  async function cargarContacto() {
    const { data, error } = await supabase
      .from("store_settings")
      .select("whatsapp_1, whatsapp_2, tiktok_url")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error cargando datos de contacto:", error);
    }

    if (data) {
      setConfig({
        whatsapp_1: data.whatsapp_1 || "",
        whatsapp_2: data.whatsapp_2 || "",
        tiktok_url: data.tiktok_url || "",
      });
    }

    setCargando(false);
  }

  function crearLinkWhatsApp(numero) {
    const limpio = numero.replace(/\D/g, "");

    if (!limpio) {
      return "";
    }

    return `https://wa.me/${limpio}`;
  }

  const whatsapp1 = crearLinkWhatsApp(config.whatsapp_1);
  const whatsapp2 = crearLinkWhatsApp(config.whatsapp_2);

  return (
    <main
      className="bg-[#f8f7f3] text-[#171717]"
      style={{
        width: "100vw",
        minWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: 0,
          padding: "58px 2.5vw 75px",
          boxSizing: "border-box",
        }}
      >
        {/* ENCABEZADO */}
        <section
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            margin: 0,
            padding: 0,
          }}
        >
          <p className="seccion-etiqueta">
            ESTAMOS PARA TI
          </p>

          <h1
            className="mt-3"
            style={{
              width: "100%",
              textAlign: "center",
              marginLeft: 0,
              marginRight: 0,
            }}
          >
            Contáctanos
          </h1>

          <p
            className="mt-5"
            style={{
              width: "100%",
              maxWidth: "620px",
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center",
              color: "rgba(0,0,0,0.5)",
              fontSize: "15px",
              lineHeight: "1.8",
            }}
          >
            Estamos a un mensaje de distancia
            <br />
            Siempre estaremos pendientes a tus dudas, comentarios y sugerencias
          </p>
        </section>

        {/* CONTACTOS */}
        {!cargando && (
          <section
            style={{
              width: "100%",
              marginTop: "64px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "1050px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  display:
                    whatsapp1 && whatsapp2
                      ? "grid"
                      : "flex",
                  gridTemplateColumns:
                    whatsapp1 && whatsapp2
                      ? "1fr 1fr"
                      : undefined,
                  flexDirection:
                    !whatsapp1 || !whatsapp2
                      ? "column"
                      : undefined,
                }}
              >
                {/* WHATSAPP 1 */}
                {whatsapp1 && (
                  <div
                    style={{
                      padding: "36px 32px",
                      textAlign: "center",
                      borderTop:
                        "1px solid rgba(0,0,0,0.12)",
                      borderBottom:
                        "1px solid rgba(0,0,0,0.12)",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "10px",
                        fontWeight: 500,
                        letterSpacing: "0.22em",
                        color: "rgba(0,0,0,0.42)",
                      }}
                    >
                      WHATSAPP
                    </p>

                    <p
                      style={{
                        marginTop: "16px",
                        marginBottom: 0,
                        fontSize: "15px",
                        letterSpacing: "0.03em",
                        color: "rgba(0,0,0,0.62)",
                      }}
                    >
                      {config.whatsapp_1}
                    </p>

                    <a
                      href={whatsapp1}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        marginTop: "22px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "40px",
                        padding: "0 24px",
                        background: "#deddd9",
                        color: "rgba(0,0,0,0.7)",
                        fontSize: "10px",
                        fontWeight: 500,
                        letterSpacing: "0.16em",
                        textDecoration: "none",
                        transition:
                          "background 0.25s ease, color 0.25s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "#d0cfcb";
                        e.currentTarget.style.color =
                          "#111";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "#deddd9";
                        e.currentTarget.style.color =
                          "rgba(0,0,0,0.7)";
                      }}
                    >
                      CONTACTAR
                    </a>
                  </div>
                )}

                {/* WHATSAPP 2 */}
                {whatsapp2 && (
                  <div
                    style={{
                      padding: "36px 32px",
                      textAlign: "center",
                      borderTop:
                        "1px solid rgba(0,0,0,0.12)",
                      borderBottom:
                        "1px solid rgba(0,0,0,0.12)",
                      borderLeft:
                        whatsapp1
                          ? "1px solid rgba(0,0,0,0.12)"
                          : "none",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "10px",
                        fontWeight: 500,
                        letterSpacing: "0.22em",
                        color: "rgba(0,0,0,0.42)",
                      }}
                    >
                      WHATSAPP
                    </p>

                    <p
                      style={{
                        marginTop: "16px",
                        marginBottom: 0,
                        fontSize: "15px",
                        letterSpacing: "0.03em",
                        color: "rgba(0,0,0,0.62)",
                      }}
                    >
                      {config.whatsapp_2}
                    </p>

                    <a
                      href={whatsapp2}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        marginTop: "22px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "40px",
                        padding: "0 24px",
                        background: "#deddd9",
                        color: "rgba(0,0,0,0.7)",
                        fontSize: "10px",
                        fontWeight: 500,
                        letterSpacing: "0.16em",
                        textDecoration: "none",
                        transition:
                          "background 0.25s ease, color 0.25s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "#d0cfcb";
                        e.currentTarget.style.color =
                          "#111";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "#deddd9";
                        e.currentTarget.style.color =
                          "rgba(0,0,0,0.7)";
                      }}
                    >
                      CONTACTAR
                    </a>
                  </div>
                )}
              </div>

              {/* TIKTOK */}
              {config.tiktok_url && (
                <div
                  style={{
                    marginTop: "42px",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.22em",
                      color: "rgba(0,0,0,0.4)",
                    }}
                  >
                    SÍGUENOS Y NO TE PIERDAS DE NADA
                  </p>

                  <p
                    style={{
                      marginTop: "15px",
                      marginBottom: 0,
                      fontSize: "15px",
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    VISITAR TIK TOK
                  </p>

                  <a
                    href={config.tiktok_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      marginTop: "20px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "40px",
                      padding: "0 24px",
                      background: "#deddd9",
                      color: "rgba(0,0,0,0.7)",
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.16em",
                      textDecoration: "none",
                      transition:
                        "background 0.25s ease, color 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "#d0cfcb";
                      e.currentTarget.style.color = "#111";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "#deddd9";
                      e.currentTarget.style.color =
                        "rgba(0,0,0,0.7)";
                    }}
                  >
                    @gmishshop
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SEPARADOR */}
        <div
          style={{
            width: "100%",
            maxWidth: "1050px",
            height: "1px",
            marginTop: "78px",
            background: "rgba(0,0,0,0.10)",
          }}
        />

        {/* VISÍTANOS */}
        <section
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginTop: "60px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.22em",
              color: "rgba(0,0,0,0.4)",
            }}
          >
            G’MISH
          </p>

          <h2
            style={{
              width: "100%",
              marginTop: "16px",
              marginBottom: 0,
              textAlign: "center",
              fontSize: "27px",
              fontWeight: 500,
              letterSpacing: "-0.025em",
            }}
          >
            Visítanos
          </h2>

          <p
            style={{
              width: "100%",
              maxWidth: "500px",
              marginTop: "16px",
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center",
              fontSize: "14px",
              lineHeight: "1.8",
              color: "rgba(0,0,0,0.5)",
            }}
          >
            Si estás cerca, también puedes conocernos
            directamente en nuestra tienda.
          </p>

          <button
            type="button"
            onClick={() => onSelectCategory?.("visitanos")}
            style={{
              marginTop: "24px",
              minHeight: "40px",
              padding: "0 28px",
              border: "none",
              background: "#d6d5d1",
              color: "rgba(0,0,0,0.7)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.16em",
              cursor: "pointer",
              transition:
                "background 0.25s ease, color 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "#c9c8c4";
              e.currentTarget.style.color = "#111";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "#d6d5d1";
              e.currentTarget.style.color =
                "rgba(0,0,0,0.7)";
            }}
          >
            VER TIENDA
          </button>
        </section>

        {/* VOLVER */}
        <button
          type="button"
          onClick={() => onSelectCategory?.("inicio")}
          style={{
            marginTop: "52px",
            border: "none",
            background: "transparent",
            padding: 0,
            color: "rgba(0,0,0,0.35)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.16em",
            cursor: "pointer",
            transition: "color 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color =
              "rgba(0,0,0,0.7)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              "rgba(0,0,0,0.35)";
          }}
        >
          VOLVER AL INICIO
        </button>
      </div>
    </main>
  );
}