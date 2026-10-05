import { useState } from "react"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import FeaturedProducts from "./components/FeaturedProducts"
import CategorySection from "./components/CategorySection"
import { CartProvider } from "./CartContext"

function App() {
  const [category, setCategory] = useState("todos")

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#111210] text-white">

        <Navbar
          category={category}
          setCategory={setCategory}
        />

        <Hero />

        <CategorySection />

        <FeaturedProducts
          category={category}
        />

      </div>
    </CartProvider>
  )
}

export default App
