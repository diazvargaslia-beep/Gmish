function Navbar() {
  return (
    <header className="border-b border-[#302E28] bg-[#151714]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <a
          href="/"
          className="logo-glitter text-4xl font-black italic tracking-[0.08em]"
        >
          GMISH
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#"
            className="text-sm font-semibold text-white transition hover:text-[#F0D58A]"
          >
            Inicio
          </a>

          <a
            href="#"
            className="text-sm font-semibold text-white transition hover:text-[#F0D58A]"
          >
            Hombre
          </a>

          <a
            href="#"
            className="text-sm font-semibold text-white transition hover:text-[#F0D58A]"
          >
            Mujer
          </a>

          <a
            href="#"
            className="text-sm font-semibold text-[#FF4D4D] transition hover:text-[#FF7A7A]"
          >
            Ofertas
          </a>
        </nav>

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
    </header>
  )
}

export default Navbar
