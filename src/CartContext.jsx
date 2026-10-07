import { createContext, useContext, useState } from "react"

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  const addToCart = (product) => {
    const quantityToAdd = product.quantity || 1

    const availableStock = Number(
      product.availableStock ??
        product.stock ??
        0
    )

    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex(
        (item) =>
          item.id === product.id &&
          item.variantId === product.variantId &&
          item.selectedSize === product.selectedSize &&
          item.selectedColor === product.selectedColor
      )

      if (existingIndex !== -1) {
        const existingProduct =
          currentCart[existingIndex]

        const newQuantity =
          existingProduct.quantity + quantityToAdd

        const finalQuantity =
          availableStock > 0
            ? Math.min(
                newQuantity,
                availableStock
              )
            : newQuantity

        return currentCart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: finalQuantity,
              }
            : item
        )
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: Math.min(
            quantityToAdd,
            availableStock > 0
              ? availableStock
              : quantityToAdd
          ),
        },
      ]
    })
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

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}