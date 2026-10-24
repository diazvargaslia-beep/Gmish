import { useState } from "react";
import { useCart } from "../CartContext";
import { supabase } from "../lib/supabase";

function Cart() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    cartOpen,
    closeCart,
  } = useCart();

  const [mostrarDatos, setMostrarDatos] = useState(false);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [errorPedido, setErrorPedido] = useState("");

  const [cliente, setCliente] = useState({
    nombre: "",
    direccion: "",
    referencia: "",
  });

  const total = cart.reduce(
    (sum, product) =>
      sum + Number(product.price) * Number(product.quantity),
    0
  );

  const totalItems = cart.reduce(
    (sum, product) => sum + Number(product.quantity),
    0
  );

  function actualizarCliente(campo, valor) {
    setCliente((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    if (errorPedido) {
      setErrorPedido("");
    }
  }

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

    Object.entries(grupos).forEach(([nombre, variantes]) => {
      lineas.push(`• ${nombre}`);
      lineas.push(...variantes);
      lineas.push("");
    });

    return lineas;
  }

  function crearMensaje(productos) {
    const lineas = crearLineas(productos);

    return [
      "Hola, me interesa este pedido:",
      "",
      ...lineas,
      `Total · S/${total.toFixed(2)}`,
      "",
      `Cliente · ${cliente.nombre.trim()}`,
      `Entrega · ${cliente.direccion.trim()}`,
      cliente.referencia.trim()
        ? `Referencia · ${cliente.referencia.trim()}`
        : "",
    ]
      .join("\n")
      .trim();
  }

  function continuarConPedido() {
    setErrorPedido("");
    setMostrarDatos(true);
  }

  function volverAlCarrito() {
    if (guardandoPedido) return;

    setErrorPedido("");
    setMostrarDatos(false);
  }

  async function enviarPedido() {
    if (cart.length === 0 || guardandoPedido) return;

    setErrorPedido("");

    if (!cliente.nombre.trim()) {
      setErrorPedido("Escribe tu nombre.");
      return;
    }

    if (!cliente.direccion.trim()) {
      setErrorPedido("Escribe tu dirección de entrega.");
      return;
    }

    setGuardandoPedido(true);

    try {
      /*
       * 1. OBTENER WHATSAPP
       */
      const {
        data: configuracion,
        error: errorConfiguracion,
      } = await supabase
        .from("store_settings")
        .select("whatsapp_1, whatsapp_2")
        .limit(1)
        .maybeSingle();

      if (errorConfiguracion) {
        console.error(
          "Error obteniendo configuración:",
          errorConfiguracion
        );

        throw new Error(
          "No se pudo obtener la configuración de WhatsApp."
        );
      }

      const whatsapp1 =
        configuracion?.whatsapp_1?.trim() || "";

      const whatsapp2 =
        configuracion?.whatsapp_2?.trim() || "";

      const whatsappTienda =
        whatsapp1 || whatsapp2;

      if (!whatsappTienda) {
        throw new Error(
          "Los WhatsApp de la tienda todavía no están configurados."
        );
      }

      /*
       * 2. CREAR PEDIDO
       *
       * order_number NO se envía.
       * Supabase lo genera automáticamente.
       */
      const {
        data: pedido,
        error: errorPedidoSupabase,
      } = await supabase
        .from("orders")
        .insert({
          customer_name: cliente.nombre.trim(),
          customer_phone: null,
          status: "Pendiente",
          total: total,
          delivery_zone: null,
          delivery_address: cliente.direccion.trim(),
          notes: null,
          delivery_reference:
            cliente.referencia.trim() || null,
        })
        .select("id")
        .single();

      if (errorPedidoSupabase) {
        console.error(
          "Error creando pedido:",
          errorPedidoSupabase
        );

        throw new Error(
          errorPedidoSupabase.message ||
            "No se pudo registrar el pedido."
        );
      }

      /*
       * 3. CREAR ITEMS
       */
      const items = cart.map((product) => ({
        order_id: pedido.id,

        product_id:
          product.productId || product.id,

        product_name:
          product.name || "Producto",

        quantity:
          Number(product.quantity),

        unit_price:
          Number(product.price),

        size:
          product.selectedSize || null,

        color:
          product.selectedColor || null,

        subtotal:
          Number(product.price) *
          Number(product.quantity),
      }));

      const { error: errorItems } = await supabase
        .from("order_items")
        .insert(items);

      if (errorItems) {
        console.error(
          "Error guardando productos:",
          errorItems
        );

        /*
         * Intentamos eliminar el pedido incompleto.
         */
        const { error: errorEliminar } = await supabase
          .from("orders")
          .delete()
          .eq("id", pedido.id);

        if (errorEliminar) {
          console.error(
            "No se pudo eliminar el pedido incompleto:",
            errorEliminar
          );
        }

        throw new Error(
          errorItems.message ||
            "No se pudieron guardar los productos del pedido."
        );
      }

      /*
       * 4. PREPARAR WHATSAPP
       */
      const mensaje = crearMensaje(cart);

      const numeroWhatsApp =
        whatsappTienda.replace(/\D/g, "");

      const urlWhatsApp =
        `https://wa.me/${numeroWhatsApp}` +
        `?text=${encodeURIComponent(mensaje)}`;

      /*
       * 5. ABRIR WHATSAPP
       *
       * location.href funciona mejor en móviles
       * que depender exclusivamente de window.open.
       */
      clearCart();

      setCliente({
        nombre: "",
        direccion: "",
        referencia: "",
      });

      setMostrarDatos(false);

      window.location.href = urlWhatsApp;
    } catch (error) {
      console.error("Error registrando pedido:", error);

      setErrorPedido(
        error?.message ||
          "No se pudo registrar el pedido. Inténtalo nuevamente."
      );
    } finally {
      setGuardandoPedido(false);
    }
  }

  return (
    <>
      {cartOpen && (
        <div
          className="
            fixed inset-0 z-[250]
            bg-black/40
            backdrop-blur-[2px]
          "
          onClick={closeCart}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Tu carrito de compras"
            onClick={(event) => event.stopPropagation()}
            className="
              absolute right-0 top-0
              flex h-full w-full
              max-w-[680px]
              flex-col
              overflow-hidden
              border-l border-[#e9e5dd]
              bg-[#fffefa]
              text-[#24231f]
              shadow-[-24px_0_70px_rgba(0,0,0,0.12)]
            "
          >
            {/* HEADER */}
            <header
              className="
                flex shrink-0
                items-center justify-between
                border-b border-[#ebe7df]
                px-5 py-5
                sm:px-8 sm:py-6
              "
            >
              <div>
                <div className="flex items-center gap-3">
                  {mostrarDatos && cart.length > 0 && (
                    <button
                      type="button"
                      onClick={volverAlCarrito}
                      disabled={guardandoPedido}
                      aria-label="Volver al carrito"
                      className="
                        mr-1
                        flex h-9 w-9
                        items-center justify-center
                        rounded-full
                        border border-[#ded9d0]
                        text-[18px]
                        transition
                        hover:border-[#24231f]
                        disabled:opacity-40
                      "
                    >
                      ←
                    </button>
                  )}

                  <h2
                    className="
                      text-[26px]
                      font-medium
                      tracking-[-0.04em]
                      sm:text-[30px]
                    "
                  >
                    {mostrarDatos && cart.length > 0
                      ? "Finalizar pedido"
                      : "Tu carrito"}
                  </h2>

                  {!mostrarDatos && cart.length > 0 && (
                    <span
                      className="
                        flex h-7 min-w-7
                        items-center justify-center
                        rounded-full
                        bg-[#24231f]
                        px-2
                        text-[11px]
                        font-semibold
                        text-white
                      "
                    >
                      {totalItems}
                    </span>
                  )}
                </div>

                {cart.length > 0 && (
                  <p
                    className="
                      mt-2
                      text-[11px]
                      leading-5
                      text-[#898276]
                    "
                  >
                    {mostrarDatos
                      ? "Completa tus datos para coordinar la entrega."
                      : totalItems === 1
                      ? "1 producto seleccionado"
                      : `${totalItems} productos seleccionados`}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeCart}
                aria-label="Cerrar carrito"
                className="
                  ml-5
                  flex h-11 w-11
                  shrink-0
                  items-center justify-center
                  rounded-full
                  border border-[#ded9d0]
                  bg-transparent
                  text-[22px]
                  font-light
                  transition
                  hover:border-[#24231f]
                  hover:bg-[#24231f]
                  hover:text-white
                "
              >
                ×
              </button>
            </header>

            {/* CARRITO VACÍO */}
            {cart.length === 0 ? (
              <div
                className="
                  flex flex-1
                  flex-col
                  items-center justify-center
                  px-6 py-14
                  text-center
                "
              >
                <div
                  className="
                    flex h-20 w-20
                    items-center justify-center
                    rounded-full
                    border border-[#e6e1d8]
                    bg-[#f7f4ee]
                    text-[27px]
                  "
                >
                  ♡
                </div>

                <h3
                  className="
                    mt-7
                    text-[22px]
                    font-medium
                    tracking-[-0.03em]
                  "
                >
                  Tu carrito está vacío
                </h3>

                <p
                  className="
                    mt-3
                    max-w-[300px]
                    text-sm
                    leading-6
                    text-[#888175]
                  "
                >
                  Explora nuestra colección y encuentra
                  algo que vaya contigo.
                </p>

                <button
                  type="button"
                  onClick={closeCart}
                  className="
                    mt-8
                    bg-[#24231f]
                    px-9 py-4
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-white
                    transition
                    hover:bg-[#3d3b35]
                  "
                >
                  Seguir comprando
                </button>
              </div>
            ) : !mostrarDatos ? (
              /*
               * =====================================
               * PANTALLA 1 — PRODUCTOS
               * =====================================
               */
              <>
                <div
                  className="
                    min-h-0 flex-1
                    overflow-y-auto
                    px-5
                    sm:px-8
                  "
                >
                  <div>
                    {cart.map((product, index) => (
                      <article
                        key={`${product.productId || product.id}-${
                          product.variantId || ""
                        }-${product.selectedSize || ""}-${
                          product.selectedColor || ""
                        }-${index}`}
                        className="
                          border-b border-[#ebe7df]
                          py-8
                          sm:py-9
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-5
                            sm:gap-7
                          "
                        >
                          {/* IMAGEN */}
                          <div
                            className="
                              h-[132px] w-[100px]
                              shrink-0
                              overflow-hidden
                              rounded-[18px]
                              bg-[#f3efe8]
                              sm:h-[150px]
                              sm:w-[114px]
                            "
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="
                                  h-full w-full
                                  object-cover
                                "
                              />
                            ) : (
                              <div
                                className="
                                  flex h-full w-full
                                  items-center justify-center
                                  text-[9px]
                                  font-semibold
                                  tracking-[0.2em]
                                  text-[#999184]
                                "
                              >
                                GMISH
                              </div>
                            )}
                          </div>

                          {/* INFORMACIÓN */}
                          <div className="min-w-0 flex-1">
                            <div
                              className="
                                flex
                                items-start
                                justify-between
                                gap-4
                              "
                            >
                              <div className="min-w-0">
                                <h3
                                  className="
                                    text-[16px]
                                    font-semibold
                                    leading-6
                                    tracking-[-0.015em]
                                  "
                                >
                                  {product.name}
                                </h3>

                                <p
                                  className="
                                    mt-2
                                    text-[12px]
                                    leading-5
                                    text-[#918a7e]
                                  "
                                >
                                  S/{" "}
                                  {Number(
                                    product.price
                                  ).toFixed(2)}{" "}
                                  por unidad
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(index)
                                }
                                aria-label={`Eliminar ${product.name}`}
                                className="
                                  shrink-0
                                  text-[10px]
                                  font-medium
                                  uppercase
                                  tracking-[0.11em]
                                  text-[#8f887c]
                                  transition
                                  hover:text-red-600
                                "
                              >
                                Eliminar
                              </button>
                            </div>

                            {/* VARIANTE */}
                            <div
                              className="
                                mt-6
                                flex
                                flex-col
                                gap-3
                              "
                            >
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-3
                                "
                              >
                                <span
                                  className="
                                    w-[42px]
                                    text-[9px]
                                    font-semibold
                                    uppercase
                                    tracking-[0.14em]
                                    text-[#9c9589]
                                  "
                                >
                                  Talla
                                </span>

                                <span
                                  className="
                                    text-[13px]
                                    font-medium
                                  "
                                >
                                  {product.selectedSize ||
                                    "No seleccionada"}
                                </span>
                              </div>

                              <div
                                className="
                                  flex
                                  items-center
                                  gap-3
                                "
                              >
                                <span
                                  className="
                                    w-[42px]
                                    text-[9px]
                                    font-semibold
                                    uppercase
                                    tracking-[0.14em]
                                    text-[#9c9589]
                                  "
                                >
                                  Color
                                </span>

                                {product.selectedColorHex && (
                                  <span
                                    className="
                                      h-3.5 w-3.5
                                      rounded-full
                                      border border-black/10
                                    "
                                    style={{
                                      backgroundColor:
                                        product.selectedColorHex,
                                    }}
                                  />
                                )}

                                <span
                                  className="
                                    text-[13px]
                                    font-medium
                                  "
                                >
                                  {product.selectedColor ||
                                    "No seleccionado"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CANTIDAD + SUBTOTAL */}
                        <div
                          className="
                            mt-7
                            flex
                            items-center
                            justify-between
                            gap-5
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              overflow-hidden
                              rounded-full
                              border border-[#ddd7cd]
                            "
                          >
                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(index)
                              }
                              aria-label="Disminuir cantidad"
                              className="
                                flex h-10 w-12
                                items-center justify-center
                                text-[18px]
                                transition
                                hover:bg-[#f3efe8]
                              "
                            >
                              −
                            </button>

                            <span
                              className="
                                flex h-10 min-w-[44px]
                                items-center justify-center
                                border-x border-[#ddd7cd]
                                px-2
                                text-[12px]
                                font-semibold
                              "
                            >
                              {product.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(index)
                              }
                              aria-label="Aumentar cantidad"
                              className="
                                flex h-10 w-12
                                items-center justify-center
                                text-[18px]
                                transition
                                hover:bg-[#f3efe8]
                              "
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <p
                              className="
                                text-[9px]
                                font-semibold
                                uppercase
                                tracking-[0.13em]
                                text-[#999184]
                              "
                            >
                              Subtotal
                            </p>

                            <p
                              className="
                                mt-1.5
                                text-[18px]
                                font-semibold
                                tracking-[-0.025em]
                              "
                            >
                              S/{" "}
                              {(
                                Number(product.price) *
                                Number(product.quantity)
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                {/* FOOTER CARRITO */}
                <div
                  className="
                    shrink-0
                    border-t border-[#e9e5dd]
                    bg-[#fffefa]
                    px-5
                    py-6
                    sm:px-8
                    sm:py-7
                  "
                >
                  <div
                    className="
                      flex
                      items-end
                      justify-between
                      gap-6
                    "
                  >
                    <div>
                      <p
                        className="
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-[0.16em]
                          text-[#928b80]
                        "
                      >
                        Total
                      </p>

                      <p
                        className="
                          mt-2
                          text-[11px]
                          text-[#928b80]
                        "
                      >
                        {totalItems}{" "}
                        {totalItems === 1
                          ? "producto"
                          : "productos"}
                      </p>
                    </div>

                    <p
                      className="
                        text-[28px]
                        font-semibold
                        tracking-[-0.045em]
                      "
                    >
                      S/ {total.toFixed(2)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={continuarConPedido}
                    className="
                      mt-6
                      flex min-h-[54px] w-full
                      items-center justify-center
                      bg-[#24231f]
                      px-6 py-4
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.15em]
                      text-white
                      transition
                      hover:bg-[#3d3b35]
                      active:scale-[0.995]
                    "
                  >
                    Continuar con el pedido
                    <span className="ml-3 text-[16px]">
                      →
                    </span>
                  </button>
                </div>
              </>
            ) : (
              /*
               * =====================================
               * PANTALLA 2 — DATOS
               *
               * AQUÍ YA NO APARECEN LOS PRODUCTOS.
               * =====================================
               */
              <>
                <div
                  className="
                    min-h-0 flex-1
                    overflow-y-auto
                    px-5
                    py-7
                    sm:px-8
                    sm:py-9
                  "
                >
                  <div className="mx-auto max-w-[560px]">
                    <div
                      className="
                        border-b border-[#ebe7df]
                        pb-7
                      "
                    >
                      <p
                        className="
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-[0.18em]
                          text-[#918a7e]
                        "
                      >
                        Datos de entrega
                      </p>

                      <h3
                        className="
                          mt-3
                          text-[22px]
                          font-medium
                          tracking-[-0.03em]
                        "
                      >
                        ¿Dónde entregamos tu pedido?
                      </h3>

                      <p
                        className="
                          mt-3
                          max-w-[430px]
                          text-[12px]
                          leading-6
                          text-[#8b8479]
                        "
                      >
                        Completa la información para
                        registrar el pedido. Luego
                        continuarás por WhatsApp para
                        coordinar la entrega y el pago.
                      </p>
                    </div>

                    {/* FORMULARIO */}
                    <div className="mt-9">
                      {/* NOMBRE */}
                      <div>
                        <label
                          htmlFor="nombre-cliente"
                          className="
                            mb-3
                            block
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-[0.14em]
                            text-[#686258]
                          "
                        >
                          Nombre completo
                        </label>

                        <input
                          id="nombre-cliente"
                          type="text"
                          autoComplete="name"
                          value={cliente.nombre}
                          onChange={(event) =>
                            actualizarCliente(
                              "nombre",
                              event.target.value
                            )
                          }
                          placeholder="Escribe tu nombre"
                          disabled={guardandoPedido}
                          className="
                            h-[56px] w-full
                            rounded-[2px]
                            border border-[#ddd8cf]
                            bg-transparent
                            px-5
                            text-[14px]
                            outline-none
                            transition
                            placeholder:text-[#aaa398]
                            focus:border-[#24231f]
                            disabled:opacity-50
                          "
                        />
                      </div>

                      {/* DIRECCIÓN */}
                      <div className="mt-8">
                        <label
                          htmlFor="direccion-cliente"
                          className="
                            mb-3
                            block
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-[0.14em]
                            text-[#686258]
                          "
                        >
                          Dirección de entrega
                        </label>

                        <input
                          id="direccion-cliente"
                          type="text"
                          autoComplete="street-address"
                          value={cliente.direccion}
                          onChange={(event) =>
                            actualizarCliente(
                              "direccion",
                              event.target.value
                            )
                          }
                          placeholder="Av., calle, jirón, número..."
                          disabled={guardandoPedido}
                          className="
                            h-[56px] w-full
                            rounded-[2px]
                            border border-[#ddd8cf]
                            bg-transparent
                            px-5
                            text-[14px]
                            outline-none
                            transition
                            placeholder:text-[#aaa398]
                            focus:border-[#24231f]
                            disabled:opacity-50
                          "
                        />
                      </div>

                      {/* REFERENCIA */}
                      <div className="mt-8">
                        <div
                          className="
                            mb-3
                            flex
                            items-center
                            justify-between
                            gap-4
                          "
                        >
                          <label
                            htmlFor="referencia-cliente"
                            className="
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-[0.14em]
                              text-[#686258]
                            "
                          >
                            Referencia
                          </label>

                          <span
                            className="
                              text-[10px]
                              text-[#aaa398]
                            "
                          >
                            Opcional
                          </span>
                        </div>

                        <textarea
                          id="referencia-cliente"
                          value={cliente.referencia}
                          onChange={(event) =>
                            actualizarCliente(
                              "referencia",
                              event.target.value
                            )
                          }
                          placeholder="Ej. Frente al parque, puerta negra..."
                          disabled={guardandoPedido}
                          rows={3}
                          className="
                            min-h-[100px] w-full
                            resize-none
                            rounded-[2px]
                            border border-[#ddd8cf]
                            bg-transparent
                            px-5 py-4
                            text-[14px]
                            leading-6
                            outline-none
                            transition
                            placeholder:text-[#aaa398]
                            focus:border-[#24231f]
                            disabled:opacity-50
                          "
                        />
                      </div>

                      {/* ERROR */}
                      {errorPedido && (
                        <div
                          className="
                            mt-8
                            border border-red-200
                            bg-red-50
                            px-5 py-4
                            text-[12px]
                            leading-5
                            text-red-700
                          "
                        >
                          {errorPedido}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* TOTAL + CONFIRMAR */}
                <div
                  className="
                    shrink-0
                    border-t border-[#e9e5dd]
                    bg-[#fffefa]
                    px-5
                    py-6
                    sm:px-8
                    sm:py-7
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-6
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.16em]
                        text-[#8d867b]
                      "
                    >
                      Total del pedido
                    </p>

                    <p
                      className="
                        text-[28px]
                        font-semibold
                        tracking-[-0.045em]
                      "
                    >
                      S/ {total.toFixed(2)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={enviarPedido}
                    disabled={guardandoPedido}
                    className="
                      mt-6
                      flex min-h-[54px] w-full
                      items-center justify-center
                      bg-[#24231f]
                      px-6 py-4
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.14em]
                      text-white
                      transition
                      hover:bg-[#3d3b35]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {guardandoPedido ? (
                      <>
                        <span
                          className="
                            mr-3
                            inline-block
                            h-4 w-4
                            animate-spin
                            rounded-full
                            border-2
                            border-white/30
                            border-t-white
                          "
                        />

                        Registrando pedido...
                      </>
                    ) : (
                      <>
                        Continuar por WhatsApp
                        <span className="ml-3 text-[16px]">
                          →
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={volverAlCarrito}
                    disabled={guardandoPedido}
                    className="
                      mt-4
                      flex w-full
                      items-center justify-center
                      py-2
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-[0.12em]
                      text-[#8e877c]
                      transition
                      hover:text-[#24231f]
                      disabled:opacity-40
                    "
                  >
                    ← Volver al carrito
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

export default Cart;