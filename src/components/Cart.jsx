import { useCart } from "../CartContext";
import store from "../data/store";

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

  const total = cart.reduce(
    (sum, product) =>
      sum + Number(product.price) * product.quantity,
    0
  );

  const totalItems = cart.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const sendToWhatsApp = () => {
    if (cart.length === 0) return;

    const orderLines = cart.map(
      (product) =>
        `• ${product.name} | Talla: ${product.selectedSize} | Color: ${product.selectedColor} | Cantidad: ${product.quantity} | Subtotal: S/${(
          Number(product.price) * product.quantity
        ).toFixed(2)}`
    );

    const message = [
      "Hola, quiero realizar este pedido en GMISH:",
      "",
      ...orderLines,
      "",
      `Total: S/${total.toFixed(2)}`,
    ].join("\n");

    const url = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

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
            onClick={(event) => event.stopPropagation()}
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
                  Descubre nuestra colección y encuentra algo que vaya contigo.
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
                              onClick={() => removeFromCart(index)}
                              aria-label={`Eliminar ${product.name}`}
                              className="text-xs text-[#8b8376] underline underline-offset-4 transition hover:text-red-600"
                            >
                              Eliminar
                            </button>
                          </div>

                          <p className="mt-2 text-xs text-[#777064]">
                            Talla: {product.selectedSize || "No seleccionada"}
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
                              {product.selectedColor || "No seleccionado"}
                            </span>
                          </div>

                          <p className="mt-3 font-semibold text-[#292821]">
                            S/{" "}
                            {(
                              Number(product.price) * product.quantity
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#eee9e0] pt-3">
                        <div className="flex items-center overflow-hidden rounded-full border border-[#e4ded3]">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(index)}
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
                            onClick={() => increaseQuantity(index)}
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
                          S/ {Number(product.price).toFixed(2)} c/u
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

                  <p className="mt-2 text-xs leading-5 text-[#898274]">
                    Confirma tu pedido por WhatsApp para coordinar la compra.
                  </p>

                  <button
                    type="button"
                    onClick={sendToWhatsApp}
                    className="mt-5 w-full rounded-full bg-[#292821] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#454238] active:scale-[0.99]"
                  >
                    Continuar por WhatsApp ↗
                  </button>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="mt-3 w-full py-2 text-xs text-[#827b70] underline underline-offset-4 transition hover:text-red-600"
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