import { useState } from "react"
import products from "../data/products"
import ProductDetailModal from "./ProductDetailModal"
import { useCart } from "../CartContext"

function CategorySection({
  category,
  onSelectCategory,
}) {
  const { addToCart } = useCart()

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [notification, setNotification] = useState(null)

  const subcategories = {
    hombre: [
      {
        id: "polos",
        name: "Polos",
      },
      {
        id: "pantalones",
        name: "Pantalones",
      },
    ],

    mujer: [
      {
        id: "tops",
        name: "Tops",
      },
      {
        id: "conjuntos",
        name: "Conjuntos",
      },
      {
        id: "vestidos",
        name: "Vestidos",
      },
      {
        id: "pantalones",
        name: "Pantalones",
      },
      {
        id: "zapatos",
        name: "Zapatos",
      },
    ],
  }

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

  const ProductCard = ({ product }) => (
    <article className="w-[72vw] max-w-[300px] flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-[#302E28] bg-[#151714] transition hover:border-[#F0D58A] sm:w-[280px]">
      <button
        onClick={() => setSelectedProduct(product)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/5] w-full bg-[#22231F]">
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Foto del producto
          </div>

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
  )

  const CategoryCarousel = ({
    categoryId,
    subcategoryId,
    title,
  }) => {
    const categoryProducts = products.filter(
      (product) =>
        product.category === categoryId &&
        product.subcategory === subcategoryId
    )

    if (categoryProducts.length === 0) {
      return null
    }

    return (
      <div className="mb-12">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-bold">
            {title}
          </h3>

          {categoryProducts.length > 2 && (
            <span className="text-sm text-gray-500">
              Desliza →
            </span>
          )}
        </div>

        <div
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 pr-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {categoryProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    )
  }

  const categories = subcategories[category] || []

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10">
          <button
            onClick={() => onSelectCategory("todos")}
            className="mb-5 text-sm text-gray-400 transition hover:text-[#F0D58A]"
          >
            ← Volver a Inicio
          </button>

          <h2 className="text-3xl font-bold capitalize md:text-4xl">
            {category}
          </h2>

          <p className="mt-3 text-gray-400">
            Descubre nuestras prendas.
          </p>
        </div>

        {categories.map((item) => (
          <CategoryCarousel
            key={item.id}
            categoryId={category}
            subcategoryId={item.id}
            title={item.name}
          />
        ))}
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

export default CategorySection
