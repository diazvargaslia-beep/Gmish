import { useState } from "react"
import products from "../data/products"
import { useCart } from "../CartContext"

function FeaturedProducts({ category, subcategory, search, newOnly = false }) {
  const { addToCart } = useCart()

  const [selectedOptions, setSelectedOptions] = useState({})
  const [addedProduct, setAddedProduct] = useState(null)
  const [notification, setNotification] = useState(null)
  const [openColors, setOpenColors] = useState({})
  const [openSizes, setOpenSizes] = useState({})

  const updateOption = (productId, field, value) => {
    setSelectedOptions((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }))
  }

  const handleAddToCart = (product) => {
    const options = selectedOptions[product.id] || {}

    const size = options.size || product.sizes[0]
    const color = options.color || product.colors[0]
    const quantity = options.quantity || 1

    addToCart({
      ...product,
      selectedSize: size,
      selectedColor: color,
      quantity,
    })

    setAddedProduct(product.id)

    setNotification({
      name: product.name,
      quantity,
    })

    setOpenColors((current) => ({
      ...current,
      [product.id]: false,
    }))

    setOpenSizes((current) => ({
      ...current,
      [product.id]: false,
    }))

    if (navigator.vibrate) {
      navigator.vibrate(80)
    }

    setTimeout(() => {
      setAddedProduct(null)
    }, 1800)

    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }

  const changeQuantity = (productId, amount) => {
    setSelectedOptions((current) => {
      const currentQuantity = current[productId]?.quantity || 1
      const newQuantity = Math.max(1, currentQuantity + amount)

      return {
        ...current,
        [productId]: {
          ...current[productId],
          quantity: newQuantity,
        },
      }
    })
  }

  const toggleColors = (productId) => {
    setOpenColors((current) => ({
      ...current,
      [productId]: !current[productId],
    }))

    setOpenSizes((current) => ({
      ...current,
      [productId]: false,
    }))
  }

  const toggleSizes = (productId) => {
    setOpenSizes((current) => ({
      ...current,
      [productId]: !current[productId],
    }))

    setOpenColors((current) => ({
      ...current,
      [productId]: false,
    }))
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === "todos"
        ? true
        : category === "ofertas"
          ? product.offer === true
          : product.category === category

    const matchesSubcategory =
      subcategory === "todos" ||
      !subcategory ||
      product.subcategory === subcategory

    const matchesNew =
      newOnly ? product.new === true : true

    const searchText = search.trim().toLowerCase()

    const matchesSearch =
      searchText === ""
        ? true
        : product.name.toLowerCase().includes(searchText) ||
          product.category.toLowerCase().includes(searchText) ||
          (product.subcategory &&
            product.subcategory.toLowerCase().includes(searchText)) ||
          product.colors.some((color) =>
            color.toLowerCase().includes(searchText)
          ) ||
          product.sizes.some((size) =>
            size.toLowerCase().includes(searchText)
          )

    return (
      matchesCategory &&
      matchesSubcategory &&
      matchesNew &&
      matchesSearch
    )
  })

  const title =
    category === "ofertas"
      ? "Ofertas"
      : newOnly
        ? "Últimas novedades"
        : subcategory !== "todos"
          ? subcategory
          : category

  const description =
    category === "ofertas"
      ? "Encuentra nuestras prendas con descuento."
      : newOnly
        ? "Descubre nuestras prendas más recientes."
        : subcategory !== "todos"
          ? `Prendas de ${subcategory} para ti.`
          : "Explora nuestra colección."

  return (
    <section
      id="productos"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12"
    >
      <div className="mb-8">
        <button
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          className="mb-5 text-sm text-gray-400 transition hover:text-[#F0D58A]"
        >
          ↑ Volver arriba
        </button>

        <h2 className="text-3xl font-bold capitalize">
          {title}
        </h2>

        <p className="mt-2 text-gray-400">
          {description}
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#302E28] bg-[#151714] p-10 text-center">
          <p className="text-gray-400">
            Aún no hay productos en esta categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const options = selectedOptions[product.id] || {}
            const quantity = options.quantity || 1
            const colorsAreOpen = openColors[product.id] || false
            const sizesAreOpen = openSizes[product.id] || false

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-[#302E28] bg-[#151714]"
              >
                <div className="relative flex aspect-[4/5] w-full items-center justify-center bg-[#22231F] text-gray-500">
                  {product.offer && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#FF4D4D] px-3 py-1 text-xs font-bold text-white">
                      OFERTA
                    </span>
                  )}

                  <span className="text-sm">
                    Foto del producto
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold">
                    {product.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-2">
                    {product.oldPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        S/ {product.oldPrice}
                      </span>
                    )}

                    <span className="text-xl font-bold text-[#F0D58A]">
                      S/ {product.price}
                    </span>
                  </div>

                  {/* TALLA */}
                  <div className="mt-5">
                    <button
                      onClick={() => toggleSizes(product.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#302E28] bg-[#111210] px-4 py-3 text-sm transition hover:border-[#F0D58A]"
                    >
                      <span>
                        Talla:{" "}
                        <span className="text-[#F0D58A]">
                          {options.size || product.sizes[0]}
                        </span>
                      </span>

                      <span className="text-lg text-gray-400">
                        {sizesAreOpen ? "⌃" : "⌄"}
                      </span>
                    </button>

                    {sizesAreOpen && (
                      <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-[#302E28] bg-[#111210] p-3">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              updateOption(product.id, "size", size)

                              setOpenSizes((current) => ({
                                ...current,
                                [product.id]: false,
                              }))
                            }}
                            className={`rounded-full border px-4 py-2 text-sm transition ${
                              (options.size || product.sizes[0]) === size
                                ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                                : "border-[#302E28] text-white hover:border-[#F0D58A]"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* COLOR */}
                  <div className="mt-3">
                    <button
                      onClick={() => toggleColors(product.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#302E28] bg-[#111210] px-4 py-3 text-sm transition hover:border-[#F0D58A]"
                    >
                      <span>
                        Color:{" "}
                        <span className="text-[#F0D58A]">
                          {options.color || product.colors[0]}
                        </span>
                      </span>

                      <span className="text-lg text-gray-400">
                        {colorsAreOpen ? "⌃" : "⌄"}
                      </span>
                    </button>

                    {colorsAreOpen && (
                      <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-[#302E28] bg-[#111210] p-3">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              updateOption(product.id, "color", color)

                              setOpenColors((current) => ({
                                ...current,
                                [product.id]: false,
                              }))
                            }}
                            className={`rounded-full border px-3 py-2 text-xs transition ${
                              (options.color || product.colors[0]) === color
                                ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                                : "border-[#302E28] text-white hover:border-[#F0D58A]"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CANTIDAD */}
                  <div className="mt-4">
                    <p className="mb-2 text-sm text-gray-400">
                      Cantidad
                    </p>

                    <div className="flex items-center justify-between rounded-full border border-[#302E28] bg-[#111210] px-2 py-1">
                      <button
                        onClick={() =>
                          changeQuantity(product.id, -1)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#302E28] text-lg text-[#F0D58A] transition hover:border-[#F0D58A] hover:bg-[#22231F]"
                      >
                        −
                      </button>

                      <span className="font-semibold text-white">
                        {quantity}
                      </span>

                      <button
                        onClick={() =>
                          changeQuantity(product.id, 1)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#302E28] text-lg text-[#F0D58A] transition hover:border-[#F0D58A] hover:bg-[#22231F]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* AGREGAR AL CARRITO */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                      addedProduct === product.id
                        ? "bg-[#78B87A] text-white"
                        : "bg-[#F0D58A] text-black hover:bg-white"
                    }`}
                  >
                    {addedProduct === product.id
                      ? "✓ Agregado al carrito"
                      : "Agregar al carrito"}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {notification && (
        <div className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[#302E28] bg-[#151714] p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                ✓ Producto agregado
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {notification.name} · Cantidad: {notification.quantity}
              </p>
            </div>

            <button
              onClick={() => {
                setNotification(null)
                window.dispatchEvent(new Event("open-cart"))
              }}
              className="whitespace-nowrap rounded-full bg-[#F0D58A] px-4 py-2 text-sm font-semibold text-black"
            >
              Ver carrito
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default FeaturedProducts
