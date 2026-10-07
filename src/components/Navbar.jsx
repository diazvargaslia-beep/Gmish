import { useState } from "react"
import Cart from "./Cart"

function Navbar({
  category,
  setCategory,
  search,
  setSearch,
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(search)

  const selectCategory = (value) => {
    setCategory(value)
    setSearch("")
    setSearchInput("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const openSearch = () => {
    setSearchOpen(true)
    setSearchInput(search)
  }

  const closeSearch = () => {
    setSearch("")
    setSearchInput("")
    setSearchOpen(false)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const submitSearch = (event) => {
    event.preventDefault()

    const value = searchInput.trim()

    if (value === "") {
      setSearch("")
      return
    }

    setSearch(value)

    setTimeout(() => {
      const productsSection = document.getElementById("productos")

      if (productsSection) {
        productsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 100)
  }

  return (
    <header className="border-b border-[#302E28] bg-[#151714]">
      <div className="mx-auto max-w-7xl px-4 py-4">

        <div className="flex h-16 items-center justify-between">

          <button
            onClick={() => selectCategory("todos")}
            className="logo-glitter text-3xl font-black italic tracking-[0.08em] md:text-4xl"
          >
            GMISH
          </button>

          <div className="flex items-center gap-4">

            {searchOpen ? (
              <form
                onSubmit={submitSearch}
                className="flex items-center rounded-full border border-[#302E28] bg-[#111210]"
              >

                <span className="pl-3">
                  🔍
                </span>

                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Buscar productos..."
                  autoFocus
                  enterKeyHint="search"
                  className="w-40 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-gray-500 md:w-56"
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  className="px-3 text-gray-400 transition hover:text-white"
                  aria-label="Cerrar búsqueda"
                >
                  ✕
                </button>

              </form>
            ) : (
              <button
                onClick={openSearch}
                aria-label="Buscar"
                className="text-lg text-white transition hover:text-[#F0D58A]"
              >
                🔍
              </button>
            )}

            <Cart />

          </div>
        </div>

        <nav className="flex items-center justify-center gap-5 overflow-x-auto pt-3 md:gap-8">

          <button
            onClick={() => selectCategory("todos")}
            className={`whitespace-nowrap text-sm font-semibold transition ${
              category === "todos"
                ? "text-[#F0D58A]"
                : "text-white hover:text-[#F0D58A]"
            }`}
          >
            Inicio
          </button>

          <button
            onClick={() => selectCategory("hombre")}
            className={`whitespace-nowrap text-sm font-semibold transition ${
              category === "hombre"
                ? "text-[#F0D58A]"
                : "text-white hover:text-[#F0D58A]"
            }`}
          >
            Hombre
          </button>

          <button
            onClick={() => selectCategory("mujer")}
            className={`whitespace-nowrap text-sm font-semibold transition ${
              category === "mujer"
                ? "text-[#F0D58A]"
                : "text-white hover:text-[#F0D58A]"
            }`}
          >
            Mujer
          </button>

          <button
            onClick={() => selectCategory("ofertas")}
            className={`whitespace-nowrap text-sm font-semibold transition ${
              category === "ofertas"
                ? "text-[#FF4D4D]"
                : "text-[#FF4D4D] hover:text-[#FF7A7A]"
            }`}
          >
            Ofertas
          </button>

        </nav>

      </div>
    </header>
  )
}

export default Navbar
