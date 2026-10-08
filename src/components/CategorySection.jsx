import { useMemo, useState } from "react"
import ProductDetailModal from "./ProductDetailModal"

function CategorySection({
  category,
  onSelectCategory,
  products = [],
}) {
  const [selectedSubcategory, setSelectedSubcategory] =
    useState("todos")

  const [selectedProduct, setSelectedProduct] =
    useState(null)

  const categoryProducts = useMemo(() => {
    return products.filter(
      (product) => product.category === category
    )
  }, [products, category])

  const subcategories = useMemo(() => {
    const values = categoryProducts
      .map((product) => product.subcategory)
      .filter(Boolean)
      .map((subcategory) =>
        String(subcategory).trim().toLowerCase()
      )

    return [...new Set(values)]
  }, [categoryProducts])

  const filteredProducts = useMemo(() => {
    if (selectedSubcategory === "todos") {
      return categoryProducts
    }

    return categoryProducts.filter(
      (product) =>
        String(product.subcategory || "")
          .trim()
          .toLowerCase() === selectedSubcategory
    )
  }, [
    categoryProducts,
    selectedSubcategory,
  ])

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F0D58A]">
          Colección
        </p>

        <h1 className="mt-2 text-3xl font-black capitalize md:text-5xl">
          {category}
        </h1>
      </div>

      {subcategories.length > 0 && (
        <div className="mb-10 flex gap-3 overflow-x-auto pb-2">

          <button
            type="button"
            onClick={() =>
              setSelectedSubcategory("todos")
            }
            className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition ${
              selectedSubcategory === "todos"
                ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                : "border-[#302E28] bg-[#151714] text-gray-300 hover:border-[#F0D58A]"
            }`}
          >
            Todos
          </button>

          {subcategories.map((subcategory) => (
            <button
              key={subcategory}
              type="button"
              onClick={() =>
                setSelectedSubcategory(
                  subcategory
                )
              }
              className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold capitalize transition ${
                selectedSubcategory === subcategory
                  ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                  : "border-[#302E28] bg-[#151714] text-gray-300 hover:border-[#F0D58A]"
              }`}
            >
              {subcategory}
            </button>
          ))}

        </div>
      )}

      {selectedSubcategory === "todos" ? (
        <div className="space-y-12">

          {subcategories.map((subcategory) => {
            const productsInSubcategory =
              categoryProducts.filter(
                (product) =>
                  String(
                    product.subcategory || ""
                  )
                    .trim()
                    .toLowerCase() ===
                  subcategory
              )

            if (productsInSubcategory.length === 0) {
              return null
            }

            return (
              <div key={subcategory}>

                <div className="mb-4 flex items-end justify-between gap-4">

                  <h2 className="text-2xl font-black capitalize md:text-3xl">
                    {subcategory}
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSubcategory(
                        subcategory
                      )
                    }
                    className="text-sm font-semibold text-[#F0D58A]"
                  >
                    Ver todos
                  </button>

                </div>

                <ProductCarousel
                  products={productsInSubcategory}
                  onSelectProduct={
                    setSelectedProduct
                  }
                />

              </div>
            )
          })}

          {/* PRODUCTOS SIN SUBCATEGORÍA */}
          {categoryProducts.some(
            (product) =>
              !product.subcategory
          ) && (
            <div>

              <div className="mb-4">
                <h2 className="text-2xl font-black md:text-3xl">
                  Otros
                </h2>
              </div>

              <ProductCarousel
                products={categoryProducts.filter(
                  (product) =>
                    !product.subcategory
                )}
                onSelectProduct={
                  setSelectedProduct
                }
              />

            </div>
          )}

        </div>
      ) : (
        <ProductCarousel
          products={filteredProducts}
          onSelectProduct={setSelectedProduct}
        />
      )}

      {categoryProducts.length === 0 && (
        <div className="rounded-2xl border border-[#302E28] bg-[#151714] px-6 py-12 text-center">

          <p className="text-lg font-semibold">
            Todavía no hay productos aquí.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Los productos que agregues desde el
            panel aparecerán automáticamente.
          </p>

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

function ProductCarousel({
  products,
  onSelectProduct,
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide">

      {products.map((product) => {
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
                onSelectProduct(product)
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
                  {product.subcategory || "Producto"}
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
                  onSelectProduct(product)
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
  )
}

export default CategorySection