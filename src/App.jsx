import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedProducts from "./components/FeaturedProducts";
import CategorySection from "./components/CategorySection";
import { CartProvider } from "./CartContext";

function App() {
  const [category, setCategory] = useState("todos");
  const [subcategory, setSubcategory] = useState("todos");
  const [search, setSearch] = useState("");

  const selectCategory = (value) => {
    setCategory(value);
    setSubcategory("todos");
    setSearch("");
  };

  const selectSubcategory = (value) => {
    setSubcategory(value);
  };

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
              subcategory="todos"
              search={search}
              newOnly={true}
            />
          </>
        )}

        {category === "hombre" && (
          <>
            <CategorySection
              category="hombre"
              onSelectCategory={selectCategory}
              onSelectSubcategory={selectSubcategory}
            />

            {subcategory !== "todos" && (
              <FeaturedProducts
                category="hombre"
                subcategory={subcategory}
                search={search}
              />
            )}
          </>
        )}

        {category === "mujer" && (
          <>
            <CategorySection
              category="mujer"
              onSelectCategory={selectCategory}
              onSelectSubcategory={selectSubcategory}
            />

            {subcategory !== "todos" && (
              <FeaturedProducts
                category="mujer"
                subcategory={subcategory}
                search={search}
              />
            )}
          </>
        )}

        {category === "ofertas" && (
          <FeaturedProducts
            category="ofertas"
            subcategory="todos"
            search={search}
          />
        )}
      </div>
    </CartProvider>
  );
}

export default App;
