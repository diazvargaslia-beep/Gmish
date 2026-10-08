import { createContext, useContext, useState } from "react"

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [cartNotification, setCartNotification] =
    useState(null)
  const [cartOpen, setCartOpen] = useState(false)

  const showCartNotification = (product) => {
    setCartNotification({
      message: `${product.name} agregado al carrito`,
    })

    if (navigator.vibrate) {
      navigator.vibrate(80)
    }

    setTimeout(() => {
      setCartNotification(null)
    }, 3000)
  }

  const getCartQuantity = (
    productId,
    variantId,
    selectedSize,
    selectedColor
  ) => {
    const item = cart.find(
      (product) =>
        (product.productId || product.id) === productId &&
        product.variantId === variantId &&
        product.selectedSize === selectedSize &&
        product.selectedColor === selectedColor
    )

    return item ? item.quantity : 0
  }

  const addToCart = (product) => {
    const quantityToAdd = Math.max(
      Number(product.quantity) || 1,
      1
    )

    const availableStock = Number(
      product.availableStock ??
        product.stock ??
        0
    )

    let addedSuccessfully = false

    setCart((currentCart) => {
      const productId =
        product.productId || product.id

      const existingIndex =
        currentCart.findIndex(
          (item) =>
            (item.productId || item.id) ===
              productId &&
            item.variantId ===
              product.variantId &&
            item.selectedSize ===
              product.selectedSize &&
            item.selectedColor ===
              product.selectedColor
        )

      if (existingIndex !== -1) {
        const existingProduct =
          currentCart[existingIndex]

        const newQuantity =
          existingProduct.quantity +
          quantityToAdd

        const finalQuantity =
          availableStock > 0
            ? Math.min(
                newQuantity,
                availableStock
              )
            : newQuantity

        if (
          finalQuantity ===
          existingProduct.quantity
        ) {
          return currentCart
        }

        addedSuccessfully = true

        return currentCart.map(
          (item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  quantity: finalQuantity,
                }
              : item
        )
      }

      addedSuccessfully = true

      const finalQuantity =
        availableStock > 0
          ? Math.min(
              quantityToAdd,
              availableStock
            )
          : quantityToAdd

      return [
        ...currentCart,
        {
          ...product,
          quantity: finalQuantity,
        },
      ]
    })

    setTimeout(() => {
      if (addedSuccessfully) {
        showCartNotification(product)
      }
    }, 0)
  }

  const increaseQuantity = (index) => {
    setCart((currentCart) =>
      currentCart.map((item, i) => {
        if (i !== index) {
          return item
        }

        const availableStock = Number(
          item.availableStock ??
            item.stock ??
            0
        )

        if (
          availableStock > 0 &&
          item.quantity >= availableStock
        ) {
          return item
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        }
      })
    )
  }

  const decreaseQuantity = (index) => {
    setCart((currentCart) =>
      currentCart
        .map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    )
  }

  const removeFromCart = (index) => {
    setCart((currentCart) =>
      currentCart.filter(
        (_, i) => i !== index
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const openCart = () => {
    setCartNotification(null)
    setCartOpen(true)
  }

  const closeCart = () => {
    setCartOpen(false)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        cartNotification,
        cartOpen,
        openCart,
        closeCart,
        getCartQuantity,
      }}
    >
      {children}

      {cartNotification && (
        <div className="fixed bottom-6 left-1/2 z-[300] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#F0D58A]/30 bg-[#151714] px-4 py-3 shadow-2xl">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#78B87A] text-sm font-black text-white">
                ✓
              </span>

              <span className="truncate text-sm font-semibold text-white">
                {cartNotification.message}
              </span>
            </div>

            <button
              type="button"
              onClick={openCart}
              className="flex-shrink-0 rounded-full bg-[#F0D58A] px-4 py-2 text-xs font-black text-black transition hover:bg-white"
            >
              Ver carrito
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}