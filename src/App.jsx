import { useEffect, useState } from "react"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import FeaturedProducts from "./components/FeaturedProducts"
import CategorySection from "./components/CategorySection"
import StoreInfo from "./components/StoreInfo"
import { CartProvider } from "./CartContext"
import Admin from "./admin/Admin"
import { getProducts } from "./services/products"

function App() {
  const [category, setCategory] = useState("todos")
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState("")

  const isAdmin = window.location.pathname === "/admin"

  const selectCategory = (value) => {
    setCategory(value)
    setSearch("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  useEffect(() => {
    if (isAdmin) {
      return
    }

    const loadProducts = async () => {
      try {
        setLoadingProducts(true)
        setProductsError("")

        const data = await getProducts()

        setProducts(data)
      } catch (error) {
        console.error(error)
        setProductsError(
          "No se pudieron cargar los productos."
        )
      } finally {
        setLoadingProducts(false)
      }
    }

    loadProducts()
  }, [isAdmin])

  if (isAdmin) {
    return <Admin />
  }

  if (loadingProducts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F0C] text-white">
        <div className="text-center">
          <p className="logo-glitter text-4xl font-black italic tracking-[0.08em]">
            GMISH
          </p>

          <p className="mt-4 text-gray-400">
            Cargando productos...
          </p>
        </div>
      </div>
    )
  }

  if (productsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F0C] px-4 text-white">
        <div className="text-center">
          <p className="logo-glitter text-4xl font-black italic tracking-[0.08em]">
            GMISH
          </p>

          <p className="mt-4 text-red-300">
            {productsError}
          </p>
        </div>
      </div>
    )
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#0D0F0C] text-white">

        <Navbar
          category={category}
          setCategory={selectCategory}
          search={search}
          setSearch={setSearch}
        />

        {/* INICIO */}
        {category === "todos" && (
          <>
            <Hero />

            <FeaturedProducts
              category="todos"
              search={search}
              newOnly={search.trim() === ""}
              products={products}
            />

            <StoreInfo
              onSelectCategory={selectCategory}
            />
          </>
        )}

        {/* HOMBRE */}
        {category === "hombre" && (
          <CategorySection
            category="hombre"
            onSelectCategory={selectCategory}
            products={products}
          />
        )}

        {/* MUJER */}
        {category === "mujer" && (
          <section className="flex min-h-[60vh] items-center justify-center px-6 py-20">
            <div className="text-center">

              <p className="logo-glitter text-4xl font-black italic tracking-[0.08em] md:text-5xl">
                GMISH
              </p>

              <h2 className="mt-6 text-2xl font-semibold text-white md:text-3xl">
                Mujer
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">
                Próximamente encontrarás nuestra colección para mujer.
              </p>

            </div>
          </section>
        )}

        {/* OFERTAS */}
        {category === "ofertas" && (
          <FeaturedProducts
            category="ofertas"
            search={search}
            newOnly={false}
            products={products}
          />
        )}

      </div>
    </CartProvider>
  )
}

export default App