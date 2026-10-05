import { useState } from "react"
import products from "../data/products"
import { useCart } from "../CartContext"

function FeaturedProducts({ category }) {
  const { addToCart } = useCart()

  const [selectedOptions, setSelectedOptions] = useState({})

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

    addToCart({
      ...product,
      selectedSize: size,
      selectedColor: color,
    })
  }

  const filteredProducts = products.filter((product) => {
    if (category === "todos") {
      return true
    }

    if (category === "ofertas") {
      return product.offer === true
    }

    return product.category === category
  })

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">

      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          {category === "hombre" && "Hombre"}
          {category === "mujer" && "Mujer"}
          {category === "ofertas" && "Ofertas"}
          {category === "todos" && "Productos destacados"}
        </h2>

        <p className="mt-2 text-gray-400">
          {category === "ofertas"
            ? "Encuentra nuestros productos con descuento."
            : "Descubre algunos de nuestros favoritos."}
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#302E28] bg-[#151714] p-10 text-center">
          <p className="text-gray-400">
            No hay productos disponibles en esta categoría todavía.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">

          {filteredProducts.map((product) => {
            const options = selectedOptions[product.id] || {}

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-[#302E28] bg-[#151714]"
              >

                <div className="relative flex aspect-[4/5] items-center justify-center bg-[#22231F] text-gray-500">

                  {product.offer && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#FF4D4D] px-3 py-1 text-xs font-bold text-white">
                      OFERTA
                    </span>
                  )}

                  Foto del producto

                </div>

                <div className="p-4">

                  <h3 className="font-semibold">
                    {product.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-2">

                    {product.oldPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        S/ {product.oldPrice}
                      </span>
                    )}

                    <span className="text-lg font-bold text-[#F0D58A]">
                      S/ {product.price}
                    </span>

                  </div>

                  <div className="mt-4">

                    <p className="mb-2 text-sm text-gray-400">
                      Talla
                    </p>

                    <div className="flex gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() =>
                            updateOption(product.id, "size", size)
                          }
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

                  </div>

                  <div className="mt-4">

                    <p className="mb-2 text-sm text-gray-400">
                      Color
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            updateOption(product.id, "color", color)
                          }
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

                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-5 w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#F0D58A]"
                  >
                    Agregar al carrito
                  </button>

                </div>

              </article>
            )
          })}

        </div>
      )}

    </section>
  )
}

export default FeaturedProducts
