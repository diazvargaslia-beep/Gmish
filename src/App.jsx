import { useState } from "react"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import FeaturedProducts from "./components/FeaturedProducts"
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
              newOnly={true}
            />
          </>
        )}

        {category === "hombre" && (
          <FeaturedProducts
            category="hombre"
            search={search}
          />
        )}

        {category === "mujer" && (
          <FeaturedProducts
            category="mujer"
            search={search}
          />
        )}

        {category === "ofertas" && (
          <FeaturedProducts
            category="ofertas"
            search={search}
          />
        )}
      </div>
    </CartProvider>
  )
}

export default App
