import { useState } from "react"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import FeaturedProducts from "./components/FeaturedProducts"
import CategorySection from "./components/CategorySection"
import StoreInfo from "./components/StoreInfo"
import { CartProvider } from "./CartContext"

function App() {
  const [category, setCategory] = useState("todos")
  const [search, setSearch] = useState("")

  const selectCategory = (value) => {
    setCategory(value)
    setSearch("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
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

        {category === "todos" && (
          <>
            <Hero />

            <FeaturedProducts
              category="todos"
              search={search}
              newOnly={search.trim() === ""}
            />

            <StoreInfo
              onSelectCategory={selectCategory}
            />
          </>
        )}

        {(category === "hombre" || category === "mujer") && (
          <CategorySection
            category={category}
            onSelectCategory={selectCategory}
          />
        )}

        {category === "ofertas" && (
          <FeaturedProducts
            category="ofertas"
            search={search}
            newOnly={false}
          />
        )}

      </div>

    </CartProvider>
  )
}

export default App
