function CategorySection({
  category,
  onSelectCategory,
  onSelectSubcategory,
}) {
  const mainCategories = [
    {
      id: "hombre",
      name: "Hombre",
      description: "Descubre nuestra colección para hombre",
    },
    {
      id: "mujer",
      name: "Mujer",
      description: "Descubre nuestra colección para mujer",
    },
    {
      id: "ofertas",
      name: "Ofertas",
      description: "Encuentra nuestras mejores promociones",
    },
  ]

  const subcategories = {
    hombre: [
      {
        id: "polos",
        name: "Polos",
        description: "Polos para todos los días",
      },
      {
        id: "pantalones",
        name: "Pantalones",
        description: "Pantalones para diferentes estilos",
      },
    ],

    mujer: [
      {
        id: "tops",
        name: "Tops",
        description: "Tops para diferentes estilos",
      },
      {
        id: "conjuntos",
        name: "Conjuntos",
        description: "Conjuntos para completar tu look",
      },
      {
        id: "vestidos",
        name: "Vestidos",
        description: "Vestidos para diferentes ocasiones",
      },
      {
        id: "pantalones",
        name: "Pantalones",
        description: "Pantalones para mujer",
      },
      {
        id: "zapatos",
        name: "Zapatos",
        description: "Calzado para mujer",
      },
    ],
  }

  if (category === "todos") {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Explora GMISH
          </h2>

          <p className="mt-3 text-gray-400">
            Encuentra tu estilo y descubre nuestras colecciones.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {mainCategories.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectCategory(item.id)}
              className="group rounded-2xl border border-[#302E28] bg-[#151714] p-8 text-left transition hover:border-[#F0D58A] hover:bg-[#1B1D19]"
            >
              <h3 className="text-2xl font-bold transition group-hover:text-[#F0D58A]">
                {item.name}
              </h3>

              <p className="mt-3 text-sm text-gray-400">
                {item.description}
              </p>

              <span className="mt-6 inline-block text-sm font-semibold text-[#F0D58A]">
                Explorar →
              </span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (category === "hombre" || category === "mujer") {
    const categories = subcategories[category]

    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
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
            Elige una categoría para ver nuestras prendas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {categories.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectSubcategory(item.id)}
              className="group rounded-2xl border border-[#302E28] bg-[#151714] p-6 text-left transition hover:border-[#F0D58A] hover:bg-[#1B1D19]"
            >
              <h3 className="text-xl font-bold transition group-hover:text-[#F0D58A]">
                {item.name}
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                {item.description}
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-[#F0D58A]">
                Ver prendas →
              </span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return null
}

export default CategorySection
