import { useState } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

export default function Cart() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [mostrarDatos, setMostrarDatos] = useState(false);
  const [guardandoPedido, setGuardandoPedido] = useState(false);

  const [cliente, setCliente] = useState({
    nombre: "",
    direccion: "",
    referencia: "",
  });

  const total = cart.reduce(
    (acc, product) =>
      acc + Number(product.price || 0) * Number(product.quantity || 1),
    0
  );

  const totalItems = cart.reduce(
    (acc, product) => acc + Number(product.quantity || 1),
    0
  );

  function crearLineas(productos) {
    const grupos = {};

    productos.forEach((product) => {
      const nombre = product.name || "Producto";

      const talla = product.selectedSize || "Sin talla";

      const color = product.selectedColor || "Sin color";

      const cantidad =
        Number(product.quantity) > 1
          ? ` · ${product.quantity}`
          : "";

      if (!grupos[nombre]) {
        grupos[nombre] = [];
      }

      grupos[nombre].push(
        `   ${talla} · ${color}${cantidad}`
      );
    });

    const lineas = [];

    Object.entries(grupos).forEach(
      ([nombre, variantes]) => {
        lineas.push(`• ${nombre}`);
        lineas.push(...variantes);
        lineas.push("");
      }
    );

    return lineas;
  }

  function crearMensaje(whatsapp) {
    const lineasProductos = crearLineas(cart);

    const mensaje = [
      "Hola, me interesa este pedido:",
      "",
      ...lineasProductos,
      `Total · S/${total.toFixed(2)}`,
      "",
      `Cliente · ${cliente.nombre.trim()}`,
      `Entrega · ${cliente.direccion.trim()}`,
      `Referencia · ${
        cliente.referencia.trim() || "No especificada"
      }`,
    ].join("\n");

    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(
      mensaje
    )}`;
  }

  async function continuarConPedido() {
    if (!cart.length) return;

    setMostrarDatos(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function enviarPedido() {
    if (guardandoPedido) return;

    if (!cliente.nombre.trim()) {
      alert("Ingresa tu nombre.");
      return;
    }

    if (!cliente.direccion.trim()) {
      alert("Ingresa tu dirección de entrega.");
      return;
    }

    setGuardandoPedido(true);

    try {
      // ============================================
      // DIAGNÓSTICO DE SESIÓN
      // ============================================

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log(
        "USUARIO ACTUAL:",
        session?.user?.email || "SIN SESIÓN (ANON)"
      );

      console.log(
        "ROL:",
        session ? "authenticated" : "anon"
      );

      // ============================================
      // OBTENER WHATSAPP DE LA TIENDA
      // ============================================

      const { data: configuracion, error: errorConfig } =
        await supabase
          .from("store_settings")
          .select("whatsapp_1, whatsapp_2")
          .maybeSingle();

      if (errorConfig) {
        console.error(
          "Error al obtener configuración:",
          errorConfig
        );

        throw new Error(
          "No se pudo obtener la configuración de WhatsApp."
        );
      }

      const whatsappTienda =
        configuracion?.whatsapp_1 ||
        configuracion?.whatsapp_2 ||
        "";

      if (!whatsappTienda) {
        throw new Error(
          "La tienda todavía no tiene configurado un número de WhatsApp."
        );
      }

      // ============================================
      // CREAR PEDIDO
      // ============================================

      const { data: pedido, error: errorPedido } =
        await supabase
          .from("orders")
          .insert({
            customer_name: cliente.nombre.trim(),

            customer_phone: null,

            status: "Pendiente",

            sale_type: "online",

            total: total,

            delivery_zone: null,

            delivery_address:
              cliente.direccion.trim(),

            notes: null,

            delivery_reference:
              cliente.referencia.trim() || null,
          })
          .select("id")
          .single();

      if (errorPedido) {
        console.error(
          "ERROR AL CREAR PEDIDO:",
          errorPedido
        );

        throw errorPedido;
      }

      console.log(
        "PEDIDO CREADO CORRECTAMENTE:",
        pedido
      );

      // ============================================
      // CREAR ITEMS DEL PEDIDO
      // ============================================

      const itemsPedido = cart.map((product) => ({
        order_id: pedido.id,

        product_id: product.product_id || product.id,

        product_name: product.name,

        quantity: Number(product.quantity || 1),

        unit_price: Number(product.price || 0),

        size: product.selectedSize || null,

        color: product.selectedColor || null,

        subtotal:
          Number(product.price || 0) *
          Number(product.quantity || 1),
      }));

      const { error: errorItems } = await supabase
        .from("order_items")
        .insert(itemsPedido);

      if (errorItems) {
        console.error(
          "ERROR AL CREAR ITEMS:",
          errorItems
        );

        // Si los items fallan, intentamos eliminar
        // solamente el pedido recién creado.
        await supabase
          .from("orders")
          .delete()
          .eq("id", pedido.id);

        throw errorItems;
      }

      console.log(
        "ITEMS DEL PEDIDO CREADOS CORRECTAMENTE"
      );

      // ============================================
      // CREAR URL DE WHATSAPP
      // ============================================

      const urlWhatsApp = crearMensaje(
        whatsappTienda
      );

      // ============================================
      // LIMPIAR CARRITO Y FORMULARIO
      // ============================================

      clearCart();

      setCliente({
        nombre: "",
        direccion: "",
        referencia: "",
      });

      setMostrarDatos(false);

      // ============================================
      // ABRIR WHATSAPP
      // ============================================

      window.location.href = urlWhatsApp;
    } catch (error) {
      console.error(
        "ERROR COMPLETO AL ENVIAR PEDIDO:",
        error
      );

      alert(
        error?.message ||
          "No se pudo registrar el pedido. Inténtalo nuevamente."
      );
    } finally {
      setGuardandoPedido(false);
    }
  }

  // ============================================
  // CARRITO VACÍO
  // ============================================

  if (!cart.length) {
    return (
      <div className="min-h-[70vh] bg-[#f7f3ec] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-xs tracking-[0.3em] uppercase text-black/50 mb-4">
            G'MISH
          </p>

          <h1 className="font-serif text-4xl text-black mb-4">
            Tu carrito está vacío
          </h1>

          <p className="text-sm text-black/60 leading-7">
            Agrega productos para comenzar tu pedido.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // PANTALLA DE DATOS
  // ============================================

  if (mostrarDatos) {
    return (
      <section className="min-h-screen bg-[#f7f3ec] px-5 sm:px-8 lg:px-12 py-10 lg:py-16">
        <div className="max-w-2xl mx-auto">

          {/* ENCABEZADO */}

          <div className="mb-12">
            <button
              type="button"
              onClick={() => {
                setMostrarDatos(false);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className="text-xs tracking-[0.18em] uppercase text-black/55 hover:text-black transition mb-7"
            >
              ← Volver al carrito
            </button>

            <p className="text-[10px] tracking-[0.35em] uppercase text-black/45 mb-3">
              G'MISH · PEDIDO
            </p>

            <h1 className="font-serif text-4xl sm:text-5xl text-black">
              Tus datos
            </h1>

            <p className="text-sm text-black/55 mt-4 leading-6">
              Completa tus datos para continuar con tu pedido por WhatsApp.
            </p>
          </div>

          {/* FORMULARIO */}

          <div className="space-y-8">

            {/* NOMBRE */}

            <div>
              <label className="block text-xs tracking-[0.14em] uppercase text-black/55 mb-3">
                Nombre
              </label>

              <input
                type="text"
                value={cliente.nombre}
                onChange={(e) =>
                  setCliente({
                    ...cliente,
                    nombre: e.target.value,
                  })
                }
                placeholder="Tu nombre"
                className="w-full bg-transparent border-0 border-b border-black/20 px-0 py-4 text-base text-black placeholder:text-black/30 focus:outline-none focus:border-black transition"
              />
            </div>

            {/* DIRECCIÓN */}

            <div>
              <label className="block text-xs tracking-[0.14em] uppercase text-black/55 mb-3">
                Dirección de entrega
              </label>

              <input
                type="text"
                value={cliente.direccion}
                onChange={(e) =>
                  setCliente({
                    ...cliente,
                    direccion: e.target.value,
                  })
                }
                placeholder="Dirección donde recibirás tu pedido"
                className="w-full bg-transparent border-0 border-b border-black/20 px-0 py-4 text-base text-black placeholder:text-black/30 focus:outline-none focus:border-black transition"
              />
            </div>

            {/* REFERENCIA */}

            <div>
              <label className="block text-xs tracking-[0.14em] uppercase text-black/55 mb-3">
                Referencia
                <span className="normal-case tracking-normal text-black/35 ml-2">
                  opcional
                </span>
              </label>

              <input
                type="text"
                value={cliente.referencia}
                onChange={(e) =>
                  setCliente({
                    ...cliente,
                    referencia: e.target.value,
                  })
                }
                placeholder="Ej. frente al parque"
                className="w-full bg-transparent border-0 border-b border-black/20 px-0 py-4 text-base text-black placeholder:text-black/30 focus:outline-none focus:border-black transition"
              />
            </div>
          </div>

          {/* RESUMEN */}

          <div className="mt-14 pt-7 border-t border-black/15">

            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.18em] uppercase text-black/50">
                Total del pedido
              </span>

              <span className="font-serif text-3xl text-black">
                S/{total.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-black/40 mt-3">
              {totalItems}{" "}
              {totalItems === 1
                ? "producto"
                : "productos"}
            </p>
          </div>

          {/* BOTÓN */}

          <button
            type="button"
            onClick={enviarPedido}
            disabled={guardandoPedido}
            className="w-full mt-9 bg-black text-white py-5 text-xs tracking-[0.2em] uppercase hover:bg-black/85 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardandoPedido
              ? "Registrando pedido..."
              : "Continuar por WhatsApp"}
          </button>

          <p className="text-center text-[11px] text-black/40 mt-5 leading-5">
            Tu pedido será registrado y luego podrás coordinar
            la entrega directamente por WhatsApp.
          </p>
        </div>
      </section>
    );
  }

  // ============================================
  // PANTALLA PRINCIPAL DEL CARRITO
  // ============================================

  return (
    <section className="min-h-screen bg-[#f7f3ec] px-5 sm:px-8 lg:px-12 py-10 lg:py-16">

      <div className="max-w-6xl mx-auto">

        {/* ENCABEZADO */}

        <div className="mb-12">

          <p className="text-[10px] tracking-[0.35em] uppercase text-black/45 mb-3">
            G'MISH · CARRITO
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">

            <div>
              <h1 className="font-serif text-4xl sm:text-5xl text-black">
                Tu carrito
              </h1>

              <p className="text-sm text-black/50 mt-3">
                {totalItems}{" "}
                {totalItems === 1
                  ? "producto"
                  : "productos"}
              </p>
            </div>

          </div>
        </div>

        {/* PRODUCTOS */}

        <div className="border-t border-black/15">

          {cart.map((product, index) => {
            const cantidad =
              Number(product.quantity || 1);

            const precio =
              Number(product.price || 0);

            const subtotal =
              precio * cantidad;

            return (
              <div
                key={`${product.id}-${product.selectedSize}-${product.selectedColor}-${index}`}
                className="py-8 border-b border-black/15"
              >

                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-6 md:gap-8 items-start">

                  {/* IMAGEN */}

                  <div className="w-full md:w-[120px] aspect-[4/5] bg-[#e9e4dc] overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-black/30">
                        G'MISH
                      </div>
                    )}
                  </div>

                  {/* INFORMACIÓN */}

                  <div className="min-w-0">

                    <h2 className="font-serif text-2xl text-black mb-5">
                      {product.name}
                    </h2>

                    <div className="space-y-2.5 text-sm text-black/60">

                      <p>
                        <span className="text-black/40">
                          Talla
                        </span>{" "}
                        ·{" "}
                        {product.selectedSize ||
                          "Sin talla"}
                      </p>

                      <p>
                        <span className="text-black/40">
                          Color
                        </span>{" "}
                        ·{" "}
                        {product.selectedColor ||
                          "Sin color"}
                      </p>

                      <p>
                        <span className="text-black/40">
                          Precio
                        </span>{" "}
                        · S/{precio.toFixed(2)}
                      </p>

                    </div>

                    {/* CONTROLES */}

                    <div className="flex items-center gap-5 mt-7">

                      <div className="flex items-center border border-black/15">

                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              product.id,
                              product.selectedSize,
                              product.selectedColor
                            )
                          }
                          className="w-10 h-10 flex items-center justify-center text-lg hover:bg-black hover:text-white transition"
                        >
                          −
                        </button>

                        <span className="w-10 text-center text-sm">
                          {cantidad}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(
                              product.id,
                              product.selectedSize,
                              product.selectedColor
                            )
                          }
                          className="w-10 h-10 flex items-center justify-center text-lg hover:bg-black hover:text-white transition"
                        >
                          +
                        </button>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(
                            product.id,
                            product.selectedSize,
                            product.selectedColor
                          )
                        }
                        className="text-[10px] tracking-[0.16em] uppercase text-black/45 hover:text-black transition"
                      >
                        Eliminar
                      </button>

                    </div>
                  </div>

                  {/* SUBTOTAL */}

                  <div className="md:text-right">

                    <p className="text-xs tracking-[0.12em] uppercase text-black/35 mb-2">
                      Subtotal
                    </p>

                    <p className="font-serif text-2xl text-black">
                      S/{subtotal.toFixed(2)}
                    </p>

                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* TOTAL */}

        <div className="mt-10 max-w-md ml-auto">

          <div className="flex items-center justify-between py-5 border-t border-black/20">

            <span className="text-xs tracking-[0.18em] uppercase text-black/50">
              Total
            </span>

            <span className="font-serif text-3xl text-black">
              S/{total.toFixed(2)}
            </span>

          </div>

          <button
            type="button"
            onClick={continuarConPedido}
            className="w-full bg-black text-white py-5 mt-4 text-xs tracking-[0.2em] uppercase hover:bg-black/85 transition"
          >
            Continuar con el pedido
          </button>

          <p className="text-[11px] text-center text-black/40 mt-5 leading-5">
            En el siguiente paso ingresarás tus datos de entrega.
          </p>

        </div>
      </div>
    </section>
  );
}