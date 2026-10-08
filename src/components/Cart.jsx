import { useEffect, useState } from "react"
import { useCart } from "../CartContext"
import store from "../data/store"

function Cart() {
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    const openCart = () => setCartOpen(true)

    window.addEventListener("open-cart", openCart)

    return () => {
      window.removeEventListener("open-cart", openCart)
    }
  }, [])

  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart()

  const total = cart.reduce(
    (sum, product) =>
      sum + Number(product.price) * product.quantity,
    0
  )

  const totalItems = cart.reduce(
    (sum, product) => sum + product.quantity,
    0
  )

  const sendToWhatsApp = () => {
    const orderLines = cart.map(
      (product) =>
        `• ${product.name} | Talla: ${product.selectedSize} | Color: ${product.selectedColor} | Cantidad: ${product.quantity} | S/${Number(product.price) * product.quantity}`
    )

    const message = [
      "Hola, quiero realizar este pedido:",
      "",
      ...orderLines,
      "",
      `Total: S/${total}`,
    ].join("\n")

    const url = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`

    window.open(url, "_blank")
  }

  return (
    <>
      <button
        onClick={() => setCartOpen(true)}
        aria-label="Carrito"
        className={`text-lg text-white transition hover:text-[#F0D58A] ${
          totalItems > 0
            ? "scale-110 text-[#F0D58A]"
            : ""
        }`}
      >
        🛒

        {totalItems > 0 && (
          <span className="ml-1 text-xs text-[#F0D58A]">
            {totalItems}
          </span>
        )}
      </button>

      {cartOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/60"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-[#151714] p-6 text-white shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-[#302E28] pb-4">
              <h2 className="text-xl font-bold">
                Tu carrito
              </h2>

              <button
                onClick={() => setCartOpen(false)}
                className="text-xl text-gray-400 transition hover:text-white"
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex h-[70%] items-center justify-center text-center text-gray-400">
                <p>
                  Tu carrito está vacío.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <div className="space-y-4">
                  {cart.map((product, index) => (
                    <div
                      key={`${product.id}-${index}`}
                      className="rounded-xl border border-[#302E28] p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {product.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-400">
                            Talla:{" "}
                            {product.selectedSize}
                          </p>

                          <p className="text-sm text-gray-400">
                            Color:{" "}
                            {product.selectedColor}
                          </p>

                          <p className="mt-2 font-semibold text-[#F0D58A]">
                            S/{" "}
                            {Number(product.price) *
                              product.quantity}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(index)
                          }
                          className="text-sm text-gray-400 transition hover:text-red-400"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() =>
                            decreaseQuantity(index)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#302E28] text-lg transition hover:border-[#F0D58A]"
                        >
                          −
                        </button>

                        <span className="min-w-5 text-center">
                          {product.quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(index)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#302E28] text-lg transition hover:border-[#F0D58A]"
                        >
                          +
                        </button>

                        <span className="ml-2 text-sm text-gray-400">
                          S/ {product.price} c/u
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-[#302E28] pt-5">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      S/ {total}
                    </span>
                  </div>

                  <button
                    onClick={sendToWhatsApp}
                    className="mt-5 w-full rounded-full bg-[#25D366] px-4 py-3 font-semibold text-black transition hover:opacity-90"
                  >
                    Pedir por WhatsApp
                  </button>

                  <button
                    onClick={clearCart}
                    className="mt-3 w-full rounded-full border border-[#302E28] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#22231F]"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Cart