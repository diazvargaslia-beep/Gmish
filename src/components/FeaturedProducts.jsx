const products = [
  {
    code: "C1",
    category: "Camisas",
    price: 65,
    sizes: ["S", "M"],
    colors: ["Marrón", "Negro", "Beige"],
  },

  {
    code: "A1",
    category: "Casacas",
    price: 90,
    sizes: ["S", "M"],
    colors: ["Azul", "Negro"],
  },

  {
    code: "C2",
    category: "Camisas",
    price: 65,
    sizes: ["S", "M"],
    colors: ["Azul", "Negro", "Blanco"],
  },

  {
    code: "B1",
    category: "Pantalones",
    price: 99,
    sizes: ["S", "M"],
    colors: ["Beige", "Negro"],
  },
]

function FeaturedProducts() {
  return (
    <section
      id="productos"
      className="mx-auto max-w-7xl px-6 py-16"
    >
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#D4AF5A]">
            Selección GMISH
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            Destacados
          </h2>
        </div>

        <button className="text-sm font-semibold text-[#E7E1D2] underline underline-offset-4 transition hover:text-[#D4AF5A]">
          Ver todos
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.map((product) => (
          <article
            key={product.code}
            className="group"
          >
            <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-[#302E28] bg-[#1B1D1A] transition duration-300 group-hover:border-[#D4AF5A]">
              <span className="text-2xl font-semibold text-[#D4AF5A]">
                {product.code}
              </span>
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#D4AF5A]">
              {product.category}
            </p>

            <h3 className="mt-1 font-medium text-white">
              Producto {product.code}
            </h3>

            <p className="mt-2 font-semibold text-[#F0D58A]">
              S/ {product.price}
            </p>

            <div className="mt-3">
              <p className="text-xs text-[#E7E1D2]">
                Tallas: {product.sizes.join(", ")}
              </p>

              <p className="mt-1 text-xs text-[#E7E1D2]">
                Colores: {product.colors.join(", ")}
              </p>
            </div>

            <button className="mt-4 w-full rounded-full border border-[#D4AF5A] px-4 py-2 text-sm font-semibold text-[#D4AF5A] transition hover:bg-[#D4AF5A] hover:text-[#111210]">
              Ver producto
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FeaturedProducts
