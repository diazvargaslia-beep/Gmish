
import { useMemo, useState } from "react"
import FeaturedProducts from "./FeaturedProducts"

function CategorySection({
  category,
  onSelectCategory,
  products = [],
}) {
  const [selectedSubcategory, setSelectedSubcategory] =
    useState("todos")

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
  }, [categoryProducts, selectedSubcategory])

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
            onClick={() => setSelectedSubcategory("todos")}
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
              onClick={() => setSelectedSubcategory(subcategory)}
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

      {categoryProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#302E28] bg-[#151714] px-6 py-12 text-center">
          <p className="text-lg font-semibold">
            Todavía no hay productos aquí.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Los productos que agregues desde el panel aparecerán automáticamente.
          </p>
        </div>
      ) : (
        <FeaturedProducts
          category={category}
          search={
            selectedSubcategory === "todos"
              ? ""
              : selectedSubcategory
          }
          newOnly={false}
          products={filteredProducts}
        />
      )}
    </section>
  )
}

export default CategorySection