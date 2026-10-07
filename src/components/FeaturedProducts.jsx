import { useState } from "react"
import products from "../data/products"
import { useCart } from "../CartContext"
import ProductDetailModal from "./ProductDetailModal"

function FeaturedProducts({
  category = "todos",
  search = "",
  newOnly = false,
}) {
  const { addToCart } = useCart()

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [notification, setNotification] = useState(null)

  const normalizedSearch = search.trim().toLowerCase()

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === "todos" ||
      category === "ofertas"
        ? category === "todos"
          ? true
          : product.offer === true
        : product.category === category

    const matchesNew =
      newOnly ? product.new === true : true

    const matchesSearch =
      normalizedSearch === ""
        ? true
        : product.name.toLowerCase().includes(normalizedSearch) ||
          product.category.toLowerCase().includes(normalizedSearch) ||
          product.subcategory.toLowerCase().includes(normalizedSearch) ||
          product.colors.some((color) =>
            color.toLowerCase().includes(normalizedSearch)
          ) ||
          product.sizes.some((size) =>
            size.toLowerCase().includes(normalizedSearch)
          )

    return (
      matchesCategory &&
      matchesNew &&
      matchesSearch
    )
  })

  const addProductToCart = (product) => {
    addToCart(product)

    setNotification({
      name: product.name,
      quantity: product.quantity || 1,
    })

    setSelectedProduct(null)

    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }

  const groupedProducts = filteredProducts.reduce(
    (groups, product) => {
      const key = product.subcategory || "otros"

      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push(product)

      return groups
    },
    {}
  )

  const categoryNames = {
    polos: "Polos",
    pantalones: "Pantalones",
    tops: "Tops",
    conjuntos: "Conjuntos",
    vestidos: "Vestidos",
    zapatos: "Zapatos",
    otros: "Otros",
  }

  const categoryDescriptions = {
    polos: "Encuentra nuestros modelos de polos.",
    pantalones: "Modelos para diferentes estilos.",
    tops: "Descubre nuestra selección de tops.",
    conjuntos: "Conjuntos para completar tu look.",
    vestidos: "Modelos para diferentes ocasiones.",
    zapatos: "Calzado para complementar tu estilo.",
    otros: "Descubre nuestros modelos.",
  }

  const sectionTitle =
    category === "ofertas"
      ? "Ofertas"
      : newOnly
        ? "Últimas novedades"
        : category === "hombre"
          ? "Hombre"
          : category === "mujer"
            ? "Mujer"
            : "Colección"

  const sectionDescription =
    category === "ofertas"
      ? "Aprovecha nuestros modelos con descuento."
      : newOnly
        ? "Descubre nuestras prendas más recientes."
        : "Explora nuestros modelos y encuentra tu estilo."

  return (
    <>
      <section
        id="productos"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12"
      >
        <div className="mb-10">
          <h2 className="text-3xl font-bold md:text-4xl">
            {sectionTitle}
          </h2>

          <p className="mt-2 text-gray-400">
            {sectionDescription}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#302E28] bg-[#151714] p-10 text-center">
            <p className="text-gray-400">
              Aún no hay productos disponibles.
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {Object.entries(groupedProducts).map(
              ([subcategory, categoryProducts]) => (
                <div key={subcategory}>
                  {!newOnly && category !== "ofertas" && (
                    <div className="mb-5">
                      <h3 className="text-2xl font-bold">
                        {categoryNames[subcategory] || subcategory}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {categoryDescriptions[subcategory] ||
                          "Descubre nuestros modelos."}
                      </p>
                    </div>
                  )}

                  <div className="relative">
                    <div
                      className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 pr-4 scrollbar-hide"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {categoryProducts.map((product) => (
                        <article
                          key={product.id}
                          className="w-[72vw] max-w-[300px] flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-[#302E28] bg-[#151714] transition hover:border-[#F0D58A] sm:w-[280px]"
                        >
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="block w-full text-left"
                          >
                            <div className="relative aspect-[4/5] w-full bg-[#22231F]">
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                                  Foto del producto
                                </div>
                              )}

                              {product.offer && (
                                <span className="absolute left-3 top-3 rounded-full bg-[#FF4D4D] px-3 py-1 text-xs font-bold text-white">
                                  OFERTA
                                </span>
                              )}

                              {product.new && (
                                <span className="absolute right-3 top-3 rounded-full border border-[#F0D58A] bg-[#111210]/90 px-3 py-1 text-xs font-bold text-[#F0D58A]">
                                  NUEVO
                                </span>
                              )}
                            </div>

                            <div className="p-4">
                              <h4 className="text-lg font-semibold">
                                {product.name}
                              </h4>

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

                              <p className="mt-3 text-xs text-gray-500">
                                Ver producto →
                              </p>
                            </div>
                          </button>
                        </article>
                      ))}
                    </div>

                    {categoryProducts.length > 2 && (
                      <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-[#302E28] bg-[#111210]/90 px-3 py-2 text-lg text-[#F0D58A] shadow-lg sm:block">
                        →
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          addToCart={addProductToCart}
        />
      )}

      {notification && (
        <div className="fixed bottom-5 left-1/2 z-[110] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[#302E28] bg-[#151714] p-4 shadow-2xl">
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
    </>
  )
}

export default FeaturedProducts
