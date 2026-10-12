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

  async function enviarPedido() {
    if (cart.length === 0) return;

    setErrorPedido("");
    setGuardandoPedido(true);

    try {
      /*
       * ---------------------------------------------------------
       * 1. OBTENER LOS PRODUCTOS Y SABER QUIÉN ES EL PROPIETARIO
       * ---------------------------------------------------------
       */

      const productIds = [
        ...new Set(
          cart.map((product) => product.productId || product.id)
        ),
      ];

      const { data: productosDB, error: errorProductos } =
        await supabase
          .from("products")
          .select("id, owner_role")
          .in("id", productIds);

      if (errorProductos) {
        throw new Error(
          errorProductos.message ||
            "No se pudieron verificar los productos."
        );
      }

      const propietarios = {};

      (productosDB || []).forEach((producto) => {
        propietarios[producto.id] =
          producto.owner_role || "principal";
      });

      /*
       * ---------------------------------------------------------
       * 2. SEPARAR CARRITO EN PRINCIPAL Y SECUNDARIO
       * ---------------------------------------------------------
       */

      const productosPrincipal = [];
      const productosSecundario = [];

      cart.forEach((product) => {
        const productId =
          product.productId || product.id;

        const ownerRole =
          product.owner_role ||
          product.ownerRole ||
          propietarios[productId] ||
          "principal";

        if (ownerRole === "secundario") {
          productosSecundario.push(product);
        } else {
          productosPrincipal.push(product);
        }
      });

      const tienePrincipal =
        productosPrincipal.length > 0;

      const tieneSecundario =
        productosSecundario.length > 0;

      /*
       * ---------------------------------------------------------
       * 3. SI HAY PRODUCTOS DEL PRINCIPAL,
       *    PEDIMOS NOMBRE, DIRECCIÓN Y REFERENCIA
       * ---------------------------------------------------------
       */

      if (tienePrincipal) {
        if (!cliente.nombre.trim()) {
          setErrorPedido("Escribe tu nombre.");
          setGuardandoPedido(false);
          return;
        }

        if (!cliente.direccion.trim()) {
          setErrorPedido(
            "Escribe tu dirección de entrega."
          );
          setGuardandoPedido(false);
          return;
        }
      }

      /*
       * ---------------------------------------------------------
       * 4. OBTENER LOS WHATSAPP CONFIGURADOS
       * ---------------------------------------------------------
       */

      const { data: configuracion, error: errorConfiguracion } =
        await supabase
          .from("store_settings")
          .select(
            "whatsapp_principal, whatsapp_secundario"
          )
          .limit(1)
          .maybeSingle();

      if (errorConfiguracion) {
        throw new Error(
          errorConfiguracion.message ||
            "No se pudo obtener la configuración de WhatsApp."
        );
      }

      const whatsappPrincipal =
        configuracion?.whatsapp_principal || "";

      const whatsappSecundario =
        configuracion?.whatsapp_secundario || "";

      if (
        tienePrincipal &&
        !whatsappPrincipal
      ) {
        throw new Error(
          "El WhatsApp principal todavía no está configurado."
        );
      }

      if (
        tieneSecundario &&
        !whatsappSecundario
      ) {
        throw new Error(
          "El WhatsApp secundario todavía no está configurado."
        );
      }

      /*
       * ---------------------------------------------------------
       * 5. CALCULAR SUBTOTALES
       * ---------------------------------------------------------
       */

      const subtotalPrincipal =
        productosPrincipal.reduce(
          (sum, product) =>
            sum +
            Number(product.price) *
              product.quantity,
          0
        );

      const subtotalSecundario =
        productosSecundario.reduce(
          (sum, product) =>
            sum +
            Number(product.price) *
              product.quantity,
          0
        );

      /*
       * ---------------------------------------------------------
       * 6. CREAR PEDIDO EN SUPABASE
       * ---------------------------------------------------------
       */

      const numeroPedido = `GM-${Date.now()
        .toString()
        .slice(-8)}`;

      const { data: pedido, error: errorPedidoSupabase } =
        await supabase
          .from("orders")
          .insert({
            customer_name: tienePrincipal
              ? cliente.nombre.trim()
              : null,

            customer_phone: null,

            status: "pendiente",

            total: total,

            order_number: numeroPedido,

            delivery_zone: null,

            delivery_address: tienePrincipal
              ? cliente.direccion.trim()
              : null,

            notes: null,

            delivery_reference:
              tienePrincipal &&
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
       * ---------------------------------------------------------
       * 7. GUARDAR PRODUCTOS DEL PEDIDO
       * ---------------------------------------------------------
       */

      const items = cart.map((product) => ({
        order_id: pedido.id,

        product_id:
          product.productId || product.id,

        quantity: product.quantity,

        unit_price: Number(product.price),

        size:
          product.selectedSize || null,

        color:
          product.selectedColor || null,

        subtotal:
          Number(product.price) *
          product.quantity,
      }));

      const { error: errorItems } =
        await supabase
          .from("order_items")
          .insert(items);

      if (errorItems) {
        console.error(
          "Error guardando productos:",
          errorItems
        );

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
       * ---------------------------------------------------------
       * 8. CREAR LÍNEAS DE WHATSAPP
       * ---------------------------------------------------------
       */

      function crearLineas(productos) {
        return productos.map((product) => {
          const talla =
            product.selectedSize ||
            "Sin talla";

          const color =
            product.selectedColor ||
            "Sin color";

          const cantidad =
            Number(product.quantity) > 1
              ? ` · ${product.quantity}`
              : "";

          return `• ${talla} / ${color}${cantidad}`;
        });
      }

      /*
       * ---------------------------------------------------------
       * 9. CREAR MENSAJE PRINCIPAL
       * ---------------------------------------------------------
       */

      function crearMensaje(productos, subtotal) {
        const lineas = crearLineas(productos);

        return [
          "Hola, me interesa este pedido:",
          "",
          ...lineas,
          "",
          `Subtotal: S/${subtotal.toFixed(2)}`,
        ].join("\n");
      }

      /*
       * ---------------------------------------------------------
       * 10. ABRIR WHATSAPP PRINCIPAL
       * ---------------------------------------------------------
       */

      if (tienePrincipal) {
        const mensajePrincipal =
          crearMensaje(
            productosPrincipal,
            subtotalPrincipal
          );

        const urlPrincipal =
          `https://wa.me/${whatsappPrincipal}` +
          `?text=${encodeURIComponent(
            mensajePrincipal
          )}`;

        window.open(
          urlPrincipal,
          "_blank",
          "noopener,noreferrer"
        );
      }

      /*
       * ---------------------------------------------------------
       * 11. ABRIR WHATSAPP SECUNDARIO
       * ---------------------------------------------------------
       */

      if (tieneSecundario) {
        const mensajeSecundario =
          crearMensaje(
            productosSecundario,
            subtotalSecundario
          );

        const urlSecundario =
          `https://wa.me/${whatsappSecundario}` +
          `?text=${encodeURIComponent(
            mensajeSecundario
          )}`;

        window.open(
          urlSecundario,
          "_blank",
          "noopener,noreferrer"
        );
      }

      /*
       * ---------------------------------------------------------
       * 12. LIMPIAR CARRITO
       * ---------------------------------------------------------
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
          className="fixed inset-0 z-[250] bg-black/35 backdrop-blur-[2px]"
          onClick={closeCart}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Tu carrito de compras"
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[#e9e3d9] bg-[#fffefa] text-[#292821] shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-[#e9e3d9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8c8578]">
                  GMISH COLLECTION
                </p>

                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Tu carrito

                  <span className="ml-2 text-sm font-normal text-[#898274]">
                    ({totalItems})
                  </span>
                </h2>
              </div>

              <button
                type="button"
                onClick={closeCart}
                aria-label="Cerrar carrito"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9e3d9] text-xl text-[#49463f] transition hover:bg-[#f2eee6]"
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f2eee6] text-2xl">
                  ♡
                </div>

                <h3 className="mt-5 text-lg font-medium">
                  Tu carrito está vacío
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-[#827b70]">
                  Descubre nuestra colección y
                  encuentra algo que vaya contigo.
                </p>

                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-6 rounded-full bg-[#292821] px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#454238]"
                >
                  Seguir comprando
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {cart.map((product, index) => (
                    <article
                      key={`${product.productId || product.id}-${product.variantId}-${product.selectedSize}-${product.selectedColor}`}
                      className="rounded-2xl border border-[#e9e3d9] bg-white p-4"
                    >
                      <div className="flex gap-4">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-28 w-20 shrink-0 rounded-xl bg-[#f5f1e9] object-cover"
                          />
                        ) : (
                          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f5f1e9] text-xs text-[#918979]">
                            GMISH
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold leading-5">
                              {product.name}
                            </h3>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(index)
                              }
                              aria-label={`Eliminar ${product.name}`}
                              className="text-xs text-[#8b8376] underline underline-offset-4 transition hover:text-red-600"
                            >
                              Eliminar
                            </button>
                          </div>

                          <p className="mt-2 text-xs text-[#777064]">
                            Talla:{" "}
                            {product.selectedSize ||
                              "No seleccionada"}
                          </p>

                          <div className="mt-1 flex items-center gap-2 text-xs text-[#777064]">
                            <span>Color:</span>

                            {product.selectedColorHex && (
                              <span
                                className="h-3 w-3 rounded-full border border-black/10"
                                style={{
                                  backgroundColor:
                                    product.selectedColorHex,
                                }}
                              />
                            )}

                            <span>
                              {product.selectedColor ||
                                "No seleccionado"}
                            </span>
                          </div>

                          <p className="mt-3 font-semibold text-[#292821]">
                            S/{" "}
                            {(
                              Number(product.price) *
                              product.quantity
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#eee9e0] pt-3">
                        <div className="flex items-center overflow-hidden rounded-full border border-[#e4ded3]">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(index)
                            }
                            aria-label="Disminuir cantidad"
                            className="flex h-9 w-9 items-center justify-center text-lg transition hover:bg-[#f2eee6]"
                          >
                            −
                          </button>

                          <span className="min-w-9 text-center text-sm">
                            {product.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(index)
                            }
                            aria-label="Aumentar cantidad"
                            disabled={
                              Number(
                                product.availableStock ??
                                  product.stock ??
                                  0
                              ) > 0 &&
                              product.quantity >=
                                Number(
                                  product.availableStock ??
                                    product.stock
                                )
                            }
                            className="flex h-9 w-9 items-center justify-center text-lg transition hover:bg-[#f2eee6] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs text-[#827b70]">
                          S/{" "}
                          {Number(
                            product.price
                          ).toFixed(2)}{" "}
                          c/u
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="border-t border-[#e9e3d9] bg-[#fffefa] px-6 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#777064]">
                      Total del pedido
                    </span>

                    <span className="text-2xl font-semibold tracking-tight">
                      S/ {total.toFixed(2)}
                    </span>
                  </div>

                  {!mostrarDatos ? (
                    <>
                      <p className="mt-2 text-xs leading-5 text-[#898274]">
                        {cart.some(
                          (product) =>
                            product.owner_role ===
                              "principal" ||
                            product.ownerRole ===
                              "principal"
                        )
                          ? "Completa tus datos para registrar el pedido."
                          : "Continúa para enviar tu pedido por WhatsApp."}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorPedido("");
                          setMostrarDatos(true);
                        }}
                        className="mt-5 w-full rounded-full bg-[#292821] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#454238] active:scale-[0.99]"
                      >
                        Continuar con el pedido ↗
                      </button>
                    </>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {cart.some(
                        (product) =>
                          product.owner_role ===
                            "principal" ||
                          product.ownerRole ===
                            "principal"
                      ) && (
                        <>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-[#625d53]">
                              Nombre
                            </label>

                            <input
                              type="text"
                              value={cliente.nombre}
                              onChange={(event) =>
                                actualizarCliente(
                                  "nombre",
                                  event.target.value
                                )
                              }
                              placeholder="Tu nombre"
                              className="w-full rounded-xl border border-[#ddd6ca] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#292821]"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-[#625d53]">
                              Dirección de entrega
                            </label>

                            <input
                              type="text"
                              value={cliente.direccion}
                              onChange={(event) =>
                                actualizarCliente(
                                  "direccion",
                                  event.target.value
                                )
                              }
                              placeholder="Dirección de entrega"
                              className="w-full rounded-xl border border-[#ddd6ca] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#292821]"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-[#625d53]">
                              Referencia
                            </label>

                            <input
                              type="text"
                              value={cliente.referencia}
                              onChange={(event) =>
                                actualizarCliente(
                                  "referencia",
                                  event.target.value
                                )
                              }
                              placeholder="Referencia de ubicación"
                              className="w-full rounded-xl border border-[#ddd6ca] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#292821]"
                            />
                          </div>
                        </>
                      )}

                      {errorPedido && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                          {errorPedido}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={enviarPedido}
                        disabled={guardandoPedido}
                        className="w-full rounded-full bg-[#292821] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#454238] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {guardandoPedido
                          ? "Registrando pedido..."
                          : "Confirmar y continuar por WhatsApp ↗"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMostrarDatos(false);
                          setErrorPedido("");
                        }}
                        disabled={guardandoPedido}
                        className="w-full py-2 text-xs text-[#827b70] underline underline-offset-4 transition hover:text-[#292821]"
                      >
                        Volver al carrito
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={guardandoPedido}
                    className="mt-3 w-full py-2 text-xs text-[#827b70] underline underline-offset-4 transition hover:text-red-600 disabled:opacity-40"
                  >
                    Vaciar carrito
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