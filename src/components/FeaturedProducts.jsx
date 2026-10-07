import { useMemo, useState } from "react"
import ProductDetailModal from "./ProductDetailModal"

function FeaturedProducts({
  category,
  search,
  newOnly,
  products = [],
}) {
  const [selectedProduct, setSelectedProduct] = useState(null)

  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        category === "todos" ||
        product.category === category ||
        (category === "ofertas" &&
          product.old_price &&
          Number(product.old_price) >
            Number(product.price))

      const matchesSearch =
        searchText === "" ||
        product.name
          .toLowerCase()
          .includes(searchText) ||
        product.subcategory
          .toLowerCase()
          .includes(searchText)

      const matchesNew =
        !newOnly || product.is_new === true

      return (
        matchesCategory &&
        matchesSearch &&
        matchesNew
      )
    })
  }, [
    products,
    category,
    search,
    newOnly,
  ])

  return (
    <section
      id="productos"
      className="mx-auto max-w-7xl px-4 py-12 md:py-16"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F0D58A]">
            {category === "ofertas"
              ? "Ofertas"
              : newOnly
                ? "Últimas novedades"
                : "Productos"}
          </p>

          <h2 className="mt-2 text-3xl font-black md:text-4xl">
            {category === "ofertas"
              ? "Ofertas GMISH"
              : newOnly
                ? "Lo último"
                : "Nuestros productos"}
          </h2>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#302E28] bg-[#151714] px-6 py-12 text-center">
          <p className="text-lg font-semibold">
            No encontramos productos.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Prueba con otra búsqueda.
          </p>
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {filteredProducts.map((product) => {
            const isOffer =
              product.old_price &&
              Number(product.old_price) >
                Number(product.price)

            return (
              <article
                key={product.id}
                className="w-[260px] min-w-[260px] snap-start overflow-hidden rounded-2xl border border-[#302E28] bg-[#151714] md:w-[280px] md:min-w-[280px]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProduct(product)
                  }
                  className="block w-full text-left"
                >
                  <div className="relative flex aspect-[4/5] items-center justify-center bg-[#111210]">
                    <span className="text-sm text-gray-600">
                      Sin imagen
                    </span>

                    {product.is_new && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#F0D58A] px-3 py-1 text-xs font-black text-black">
                        Nuevo
                      </span>
                    )}

                    {isOffer && (
                      <span className="absolute right-3 top-3 rounded-full bg-[#FF4D4D] px-3 py-1 text-xs font-black text-white">
                        Oferta
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {product.subcategory}
                    </p>

                    <h3 className="mt-1 text-lg font-bold">
                      {product.name}
                    </h3>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-lg font-black text-[#F0D58A]">
                        S/{" "}
                        {Number(
                          product.price
                        ).toFixed(2)}
                      </span>

                      {isOffer && (
                        <span className="text-sm text-gray-500 line-through">
                          S/{" "}
                          {Number(
                            product.old_price
                          ).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct(product)
                    }
                    className="w-full rounded-xl bg-[#F0D58A] px-4 py-3 text-sm font-black text-black transition hover:brightness-110"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() =>
            setSelectedProduct(null)
          }
        />
      )}
    </section>
  )
}

export default FeaturedProducts