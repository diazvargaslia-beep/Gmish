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
      sum + Number(product.price) * product.quantity,
    0
  );

  const totalItems = cart.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  function actualizarCliente(campo, valor) {
    setCliente((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  /*
   * Agrupa las variantes que pertenecen al mismo producto.
   *
   * Resultado:
   *
   * • Polo Boxi Fit
   *    S · Gris
   *    S · Hueso
   *    M · Hueso
   *
   * • Polo Oversize
   *    S · Negro
   */
  function crearLineas(productos) {
    const grupos = {};

    productos.forEach((product) => {
      const nombre =
        product.name || "Producto";

      const talla =
        product.selectedSize || "Sin talla";

      const color =
        product.selectedColor || "Sin color";

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

  /*
   * Crea el mensaje final de WhatsApp.
   */
  function crearMensaje(productos) {
    const lineas =
      crearLineas(productos);

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
      .filter(
        (linea) => linea !== ""
      )
      .join("\n");
  }

  async function enviarPedido() {
    if (cart.length === 0) return;

    setErrorPedido("");
    setGuardandoPedido(true);

    try {
      if (!cliente.nombre.trim()) {
        setErrorPedido(
          "Escribe tu nombre."
        );

        setGuardandoPedido(false);
        return;
      }

      if (!cliente.direccion.trim()) {
        setErrorPedido(
          "Escribe tu dirección."
        );

        setGuardandoPedido(false);
        return;
      }

      /*
       * WhatsApp principal y de respaldo.
       */
      const {
        data: configuracion,
        error: errorConfiguracion,
      } = await supabase
        .from("store_settings")
        .select(
          "whatsapp_1, whatsapp_2"
        )
        .limit(1)
        .maybeSingle();

      if (errorConfiguracion) {
        console.error(
          "Error obteniendo configuración:",
          errorConfiguracion
        );

        throw new Error(
          errorConfiguracion.message ||
            "No se pudo obtener la configuración de WhatsApp."
        );
      }

      const whatsapp1 =
        configuracion?.whatsapp_1 ||
        "";

      const whatsapp2 =
        configuracion?.whatsapp_2 ||
        "";

      /*
       * Primero utiliza whatsapp_1.
       * Si está vacío, utiliza whatsapp_2.
       */
      const whatsappTienda =
        whatsapp1 || whatsapp2;

      if (!whatsappTienda) {
        throw new Error(
          "Los WhatsApp de la tienda todavía no están configurados."
        );
      }

      /*
       * Guardamos el pedido.
       *
       * IMPORTANTE:
       * NO enviamos order_number.
       * La base de datos lo genera automáticamente.
       */
      const {
        data: pedido,
        error: errorPedidoSupabase,
      } = await supabase
        .from("orders")
        .insert({
          customer_name:
            cliente.nombre.trim(),

          customer_phone:
            null,

          status:
            "Pendiente",

          total:
            total,

          delivery_zone:
            null,

          delivery_address:
            cliente.direccion.trim(),

          notes:
            null,

          delivery_reference:
            cliente.referencia.trim()
              ? cliente.referencia.trim()
              : null,
        })
        .select()
        .single();

      if (errorPedidoSupabase) {
        console.error(
          "Error creando pedido:",
          errorPedidoSupabase
        );

        throw new Error(
          errorPedidoSupabase.message ||
            "No se pudo guardar el pedido."
        );
      }

      /*
       * Guardamos los productos
       * asociados al pedido.
       */
      const items = cart.map(
        (product) => ({
          order_id:
            pedido.id,

          product_id:
            product.productId ||
            product.id,

          product_name:
            product.name,

          quantity:
            product.quantity,

          unit_price:
            Number(product.price),

          size:
            product.selectedSize ||
            null,

          color:
            product.selectedColor ||
            null,

          subtotal:
            Number(product.price) *
            product.quantity,
        })
      );

      const {
        error: errorItems,
      } = await supabase
        .from("order_items")
        .insert(items);

      if (errorItems) {
        console.error(
          "Error guardando productos:",
          errorItems
        );

        /*
         * Si los productos no se guardaron,
         * eliminamos el pedido para no dejar
         * un pedido incompleto.
         */
        await supabase
          .from("orders")
          .delete()
          .eq("id", pedido.id);

        throw new Error(
          errorItems.message ||
            "No se pudieron guardar los productos."
        );
      }

      /*
       * Generamos el mensaje minimalista.
       */
      const mensaje =
        crearMensaje(cart);

      const urlWhatsApp =
        `https://wa.me/${whatsappTienda}` +
        `?text=${encodeURIComponent(
          mensaje
        )}`;

      /*
       * Abrimos WhatsApp.
       */
      window.open(
        urlWhatsApp,
        "_blank",
        "noopener,noreferrer"
      );

      /*
       * Limpiamos el carrito.
       */
      clearCart();

      setMostrarDatos(false);

      setCliente({
        nombre: "",
        direccion: "",
        referencia: "",
      });
    } catch (error) {
      console.error(error);

      setErrorPedido(
        error.message ||
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
            fixed
            inset-0
            z-[250]
            bg-black/40
            backdrop-blur-[3px]
          "
          onClick={closeCart}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Tu carrito de compras"
            className="
              absolute
              right-0
              top-0
              flex
              h-full
              w-full
              max-w-[760px]
              flex-col
              overflow-hidden
              border-l
              border-[#e6e0d5]
              bg-[#fffefa]
              text-[#292821]
              shadow-[-20px_0_60px_rgba(0,0,0,0.10)]
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className="
                mx-2
                flex
                h-full
                min-h-0
                flex-1
                flex-col
                py-3
                sm:mx-3
                sm:py-4
                lg:mx-4
                lg:py-5
              "
            >
              {/* HEADER */}
              <header
                className="
                  flex
                  shrink-0
                  items-center
                  justify-between
                  border-b
                  border-[#e9e3d9]
                  px-1
                  py-4
                  sm:py-5
                "
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h2
                      className="
                        text-[28px]
                        font-medium
                        tracking-[-0.04em]
                        text-[#292821]
                        sm:text-[30px]
                      "
                    >
                      Tu carrito
                    </h2>

                    <span
                      className="
                        flex
                        h-7
                        min-w-7
                        items-center
                        justify-center
                        rounded-full
                        bg-[#292821]
                        px-2
                        text-[11px]
                        font-semibold
                        text-white
                      "
                    >
                      {totalItems}
                    </span>
                  </div>

                  <p
                    className="
                      mt-1.5
                      text-[11px]
                      tracking-[0.02em]
                      text-[#8b8376]
                    "
                  >
                    {totalItems === 1
                      ? "1 producto seleccionado"
                      : `${totalItems} productos seleccionados`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Cerrar carrito"
                  className="
                    ml-5
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#ded7cb]
                    bg-[#fffefa]
                    text-[22px]
                    font-light
                    text-[#49463f]
                    transition
                    duration-200
                    hover:border-[#292821]
                    hover:bg-[#292821]
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
                    flex
                    flex-1
                    flex-col
                    items-center
                    justify-center
                    py-12
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      h-20
                      w-20
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#e7e0d5]
                      bg-[#f7f3ec]
                      text-[28px]
                      text-[#555047]
                    "
                  >
                    ♡
                  </div>

                  <h3
                    className="
                      mt-7
                      text-[22px]
                      font-medium
                      tracking-[-0.025em]
                    "
                  >
                    Tu carrito está vacío
                  </h3>

                  <p
                    className="
                      mt-3
                      max-w-[290px]
                      text-sm
                      leading-6
                      text-[#827b70]
                    "
                  >
                    Explora nuestra colección
                    y encuentra algo que
                    realmente vaya contigo.
                  </p>

                  <div
                    className="
                      mt-9
                      flex
                      w-full
                      justify-center
                    "
                  >
                    <button
                      type="button"
                      onClick={closeCart}
                      className="
                        rounded-full
                        border
                        border-[#292821]
                        bg-[#292821]
                        px-10
                        py-4
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-[0.16em]
                        text-white
                        shadow-sm
                        transition
                        duration-200
                        hover:bg-[#454238]
                        hover:shadow-lg
                      "
                    >
                      Seguir comprando
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* LISTA DE PRODUCTOS */}
                  <div
                    className="
                      min-h-0
                      flex-1
                      overflow-y-auto
                      px-1
                      py-5
                      sm:py-6
                    "
                  >
                    <div className="space-y-8">
                      {cart.map(
                        (product, index) => (
                          <article
                            key={`
                              ${
                                product.productId ||
                                product.id
                              }-
                              ${product.variantId}-
                              ${product.selectedSize}-
                              ${product.selectedColor}
                            `}
                            className="
                              border-b
                              border-[#e9e3d9]
                              pb-8
                              last:border-b-0
                            "
                          >
                            <div
                              className="
                                flex
                                gap-5
                                sm:gap-6
                              "
                            >
                              {/* IMAGEN */}
                              <div
                                className="
                                  h-[122px]
                                  w-[91px]
                                  shrink-0
                                  overflow-hidden
                                  rounded-2xl
                                  bg-[#f4f0e8]
                                  sm:h-[138px]
                                  sm:w-[104px]
                                "
                              >
                                {product.image ? (
                                  <img
                                    src={
                                      product.image
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="
                                      h-full
                                      w-full
                                      object-cover
                                      transition
                                      duration-500
                                      hover:scale-[1.04]
                                    "
                                  />
                                ) : (
                                  <div
                                    className="
                                      flex
                                      h-full
                                      w-full
                                      items-center
                                      justify-center
                                      text-[9px]
                                      font-semibold
                                      tracking-[0.18em]
                                      text-[#918979]
                                    "
                                  >
                                    GMISH
                                  </div>
                                )}
                              </div>

                              {/* INFORMACIÓN */}
                              <div
                                className="
                                  min-w-0
                                  flex-1
                                "
                              >
                                <div
                                  className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-3
                                  "
                                >
                                  <div className="min-w-0">
                                    <h3
                                      className="
                                        truncate
                                        text-[15px]
                                        font-semibold
                                        leading-6
                                        tracking-[-0.01em]
                                      "
                                    >
                                      {product.name}
                                    </h3>

                                    <p
                                      className="
                                        mt-1
                                        text-xs
                                        text-[#8a8275]
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
                                      removeFromCart(
                                        index
                                      )
                                    }
                                    aria-label={`Eliminar ${product.name}`}
                                    className="
                                      shrink-0
                                      text-[10px]
                                      uppercase
                                      tracking-[0.12em]
                                      text-[#91897d]
                                      underline
                                      underline-offset-4
                                      transition
                                      hover:text-red-600
                                    "
                                  >
                                    Eliminar
                                  </button>
                                </div>

                                {/* TALLA Y COLOR */}
                                <div
                                  className="
                                    mt-5
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-x-5
                                    gap-y-2
                                  "
                                >
                                  <div
                                    className="
                                      flex
                                      items-center
                                      gap-2
                                    "
                                  >
                                    <span
                                      className="
                                        text-[10px]
                                        uppercase
                                        tracking-[0.12em]
                                        text-[#9a9285]
                                      "
                                    >
                                      Talla
                                    </span>

                                    <span
                                      className="
                                        text-xs
                                        font-medium
                                        text-[#49463f]
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
                                      gap-2
                                    "
                                  >
                                    <span
                                      className="
                                        text-[10px]
                                        uppercase
                                        tracking-[0.12em]
                                        text-[#9a9285]
                                      "
                                    >
                                      Color
                                    </span>

                                    {product.selectedColorHex && (
                                      <span
                                        className="
                                          h-3.5
                                          w-3.5
                                          rounded-full
                                          border
                                          border-black/10
                                        "
                                        style={{
                                          backgroundColor:
                                            product.selectedColorHex,
                                        }}
                                      />
                                    )}

                                    <span
                                      className="
                                        text-xs
                                        font-medium
                                        text-[#49463f]
                                      "
                                    >
                                      {product.selectedColor ||
                                        "No seleccionado"}
                                    </span>
                                  </div>
                                </div>

                                {/* SUBTOTAL */}
                                <div
                                  className="
                                    mt-4
                                    text-[17px]
                                    font-semibold
                                    tracking-[-0.02em]
                                  "
                                >
                                  S/{" "}
                                  {(
                                    Number(
                                      product.price
                                    ) *
                                    product.quantity
                                  ).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* CANTIDAD */}
                            <div
                              className="
                                mt-6
                                flex
                                items-center
                                justify-between
                              "
                            >
                              <div
                                className="
                                  flex
                                  items-center
                                  overflow-hidden
                                  rounded-full
                                  border
                                  border-[#ded7cb]
                                  bg-[#fffefa]
                                "
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      index
                                    )
                                  }
                                  aria-label="Disminuir cantidad"
                                  className="
                                    flex
                                    h-10
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    px-2
                                    text-[18px]
                                    text-[#49463f]
                                    transition
                                    hover:bg-[#f2eee6]
                                  "
                                >
                                  −
                                </button>

                                <span
                                  className="
                                    flex
                                    h-10
                                    min-w-11
                                    items-center
                                    justify-center
                                    border-x
                                    border-[#ded7cb]
                                    px-2
                                    text-xs
                                    font-semibold
                                  "
                                >
                                  {product.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    increaseQuantity(
                                      index
                                    )
                                  }
                                  aria-label="Aumentar cantidad"
                                  className="
                                    flex
                                    h-10
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    px-2
                                    text-[18px]
                                    text-[#49463f]
                                    transition
                                    hover:bg-[#f2eee6]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-30
                                  "
                                >
                                  +
                                </button>
                              </div>

                              <span
                                className="
                                  text-[10px]
                                  uppercase
                                  tracking-[0.12em]
                                  text-[#a0988c]
                                "
                              >
                                Cantidad:{" "}
                                {product.quantity}
                              </span>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  </div>

                  {/* RESUMEN */}
                  <div
                    className="
                      shrink-0
                      border-t
                      border-[#e9e3d9]
                      bg-[#fffefa]
                      px-1
                      py-5
                      sm:py-6
                    "
                  >
                    <div
                      className="
                        flex
                        items-end
                        justify-between
                        gap-5
                      "
                    >
                      <div>
                        <p
                          className="
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-[0.16em]
                            text-[#91897d]
                          "
                        >
                          Total del pedido
                        </p>

                        <p
                          className="
                            mt-1.5
                            text-xs
                            text-[#8a8275]
                          "
                        >
                          {totalItems}{" "}
                          {totalItems === 1
                            ? "producto"
                            : "productos"}
                        </p>
                      </div>

                      <span
                        className="
                          text-[26px]
                          font-semibold
                          tracking-[-0.04em]
                          text-[#292821]
                          sm:text-[29px]
                        "
                      >
                        S/ {total.toFixed(2)}
                      </span>
                    </div>

                    {/* CONTINUAR */}
                    {!mostrarDatos && (
                      <>
                        <p
                          className="
                            mt-4
                            max-w-[470px]
                            text-xs
                            leading-5
                            text-[#8a8275]
                          "
                        >
                          Completa tus datos de
                          entrega para registrar tu
                          pedido y continuar por
                          WhatsApp.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setErrorPedido("");
                            setMostrarDatos(true);
                          }}
                          className="
                            mt-5
                            flex
                            min-h-12
                            w-full
                            items-center
                            justify-center
                            bg-[#292821]
                            px-7
                            py-4
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-[0.14em]
                            text-white
                            shadow-sm
                            transition
                            duration-200
                            hover:bg-[#454238]
                            hover:shadow-lg
                            active:scale-[0.99]
                          "
                        >
                          Continuar con el pedido
                        </button>
                      </>
                    )}

                    {/* DATOS */}
                    {mostrarDatos && (
                      <div className="mt-5">
                        <div
                          className="
                            border-b
                            border-[#e9e3d9]
                            pb-5
                          "
                        >
                          <p
                            className="
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-[0.16em]
                              text-[#91897d]
                            "
                          >
                            Datos de entrega
                          </p>

                          <p
                            className="
                              mt-2
                              text-xs
                              leading-5
                              text-[#8a8275]
                            "
                          >
                            Necesitamos estos datos
                            para registrar correctamente
                            tu pedido y coordinar la
                            entrega.
                          </p>
                        </div>

                        <div
                          className="
                            mt-5
                            space-y-4
                          "
                        >
                          {/* NOMBRE */}
                          <div>
                            <label
                              htmlFor="nombre-cliente"
                              className="
                                mb-2
                                block
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-[0.13em]
                                text-[#6f685d]
                              "
                            >
                              Nombre
                            </label>

                            <input
                              id="nombre-cliente"
                              type="text"
                              value={
                                cliente.nombre
                              }
                              onChange={(event) =>
                                actualizarCliente(
                                  "nombre",
                                  event.target.value
                                )
                              }
                              placeholder="Tu nombre completo"
                              disabled={
                                guardandoPedido
                              }
                              className="
                                h-12
                                w-full
                                border
                                border-[#ded7cb]
                                bg-[#fffefa]
                                px-4
                                text-sm
                                text-[#292821]
                                outline-none
                                transition
                                placeholder:text-[#aaa296]
                                focus:border-[#292821]
                              "
                            />
                          </div>

                          {/* DIRECCIÓN */}
                          <div>
                            <label
                              htmlFor="direccion-cliente"
                              className="
                                mb-2
                                block
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-[0.13em]
                                text-[#6f685d]
                              "
                            >
                              Dirección de entrega
                            </label>

                            <input
                              id="direccion-cliente"
                              type="text"
                              value={
                                cliente.direccion
                              }
                              onChange={(event) =>
                                actualizarCliente(
                                  "direccion",
                                  event.target.value
                                )
                              }
                              placeholder="Ej. Av. Circunvalación 123"
                              disabled={
                                guardandoPedido
                              }
                              className="
                                h-12
                                w-full
                                border
                                border-[#ded7cb]
                                bg-[#fffefa]
                                px-4
                                text-sm
                                text-[#292821]
                                outline-none
                                transition
                                placeholder:text-[#aaa296]
                                focus:border-[#292821]
                              "
                            />
                          </div>

                          {/* REFERENCIA */}
                          <div>
                            <label
                              htmlFor="referencia-cliente"
                              className="
                                mb-2
                                block
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-[0.13em]
                                text-[#6f685d]
                              "
                            >
                              Referencia
                              <span
                                className="
                                  ml-1
                                  normal-case
                                  tracking-normal
                                  text-[#aaa296]
                                "
                              >
                                (opcional)
                              </span>
                            </label>

                            <input
                              id="referencia-cliente"
                              type="text"
                              value={
                                cliente.referencia
                              }
                              onChange={(event) =>
                                actualizarCliente(
                                  "referencia",
                                  event.target.value
                                )
                              }
                              placeholder="Ej. Cerca del parque"
                              disabled={
                                guardandoPedido
                              }
                              className="
                                h-12
                                w-full
                                border
                                border-[#ded7cb]
                                bg-[#fffefa]
                                px-4
                                text-sm
                                text-[#292821]
                                outline-none
                                transition
                                placeholder:text-[#aaa296]
                                focus:border-[#292821]
                              "
                            />
                          </div>
                        </div>

                        {/* CONFIRMAR */}
                        <button
                          type="button"
                          onClick={enviarPedido}
                          disabled={
                            guardandoPedido
                          }
                          className="
                            mt-5
                            flex
                            min-h-12
                            w-full
                            items-center
                            justify-center
                            bg-[#292821]
                            px-7
                            py-4
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-[0.13em]
                            text-white
                            shadow-sm
                            transition
                            duration-200
                            hover:bg-[#454238]
                            hover:shadow-lg
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
                                  h-4
                                  w-4
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
                              Confirmar y continuar por WhatsApp

                              <span className="ml-3 text-base">
                                →
                              </span>
                            </>
                          )}
                        </button>

                        {/* VOLVER */}
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarDatos(false);
                            setErrorPedido("");
                          }}
                          disabled={
                            guardandoPedido
                          }
                          className="
                            mt-3
                            flex
                            w-full
                            items-center
                            justify-center
                            py-2
                            text-[10px]
                            font-medium
                            uppercase
                            tracking-[0.12em]
                            text-[#8a8275]
                            transition
                            hover:text-[#292821]
                            disabled:opacity-40
                          "
                        >
                          ← Volver al carrito
                        </button>
                      </div>
                    )}

                    {/* ERROR */}
                    {errorPedido && (
                      <div
                        className="
                          mt-4
                          border
                          border-red-200
                          bg-red-50
                          px-4
                          py-3
                          text-xs
                          leading-5
                          text-red-700
                        "
                      >
                        {errorPedido}
                      </div>
                    )}

                    {/* VACIAR */}
                    <div
                      className="
                        mt-5
                        flex
                        justify-center
                        border-t
                        border-[#eee9e0]
                        pt-5
                      "
                    >
                      <button
                        type="button"
                        onClick={clearCart}
                        disabled={
                          guardandoPedido
                        }
                        className="
                          px-5
                          py-2
                          text-[10px]
                          font-medium
                          uppercase
                          tracking-[0.14em]
                          text-[#928a7e]
                          underline
                          underline-offset-4
                          transition
                          hover:text-red-600
                          disabled:opacity-40
                        "
                      >
                        Vaciar carrito
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default Cart;