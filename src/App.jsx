import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import FeaturedProducts from "./components/FeaturedProducts"
import CategorySection from "./components/CategorySection"

function App() {
  return (
    <div className="min-h-screen bg-[#111210] text-white">
      <Navbar />
      <Hero />
      <CategorySection />
      <FeaturedProducts />
    </div>
  )
}

export default App
