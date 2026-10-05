function Navbar() {
  return (
    <header className="border-b border-[#302E28] bg-[#151714]">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex h-16 items-center justify-between">
          <a
            href="/"
            className="logo-glitter text-3xl font-black italic tracking-[0.08em] md:text-4xl"
          >
            GMISH
          </a>

          <div className="flex items-center gap-5">
            <button
              aria-label="Buscar"
              className="text-lg text-white transition hover:text-[#F0D58A]"
            >
              🔍
            </button>

            <button
              aria-label="Carrito"
              className="text-lg text-white transition hover:text-[#F0D58A]"
            >
              🛒
            </button>
          </div>
        </div>

        <nav className="flex items-center justify-center gap-5 overflow-x-auto pt-3 md:gap-8">
          <a
            href="#"
            className="whitespace-nowrap text-sm font-semibold text-white transition hover:text-[#F0D58A]"
          >
            Inicio
          </a>

          <a
            href="#"
            className="whitespace-nowrap text-sm font-semibold text-white transition hover:text-[#F0D58A]"
          >
            Hombre
          </a>

          <a
            href="#"
            className="whitespace-nowrap text-sm font-semibold text-white transition hover:text-[#F0D58A]"
          >
            Mujer
          </a>

          <a
            href="#"
            className="whitespace-nowrap text-sm font-semibold text-[#FF4D4D] transition hover:text-[#FF7A7A]"
          >
            Ofertas
          </a>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
