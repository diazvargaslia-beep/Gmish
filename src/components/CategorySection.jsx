const categories = [
  {
    name: "Camisas",
    description: "Diseños para todos los días",
    link: "#camisas",
  },
  {
    name: "Casacas",
    description: "Capas ligeras y modernas",
    link: "#casacas",
  },
  {
    name: "Pantalones",
    description: "Cortes clásicos y versátiles",
    link: "#pantalones",
  },
]

function CategorySection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#D4AF5A]">
          Explora GMISH
        </p>

        <h2 className="mt-2 text-3xl font-bold text-white">
          Compra por categoría
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {categories.map((category) => (
          <a
            key={category.name}
            href={category.link}
            className="group"
          >
            <article>
              <div className="flex aspect-[4/3] items-end rounded-xl border border-[#302E28] bg-[#1B1D1A] p-6 transition duration-300 group-hover:border-[#D4AF5A] group-hover:bg-[#20211D]">
                <div>
                  <h3 className="text-2xl font-semibold text-white">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-sm text-[#E7E1D2]">
                    {category.description}
                  </p>

                  <span className="mt-4 inline-block text-sm font-semibold text-[#D4AF5A]">
                    Ver categoría →
                  </span>
                </div>
              </div>
            </article>
          </a>
        ))}
      </div>
    </section>
  )
}

export default CategorySection
