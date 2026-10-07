function StoreInfo({ onSelectCategory }) {
  const handleDirections = () => {
    const confirmed = window.confirm(
      "¿Quieres abrir Google Maps?"
    )

    if (confirmed) {
      window.open(
        "https://www.google.com/maps",
        "_blank",
        "noopener,noreferrer"
      )
    }
  }

  const whatsappUrl = "https://wa.me/51921366147"

  return (
    <>
      {/* INFORMACIÓN */}
      <section className="mx-auto max-w-7xl px-4 py-16">

        <div
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >

          {/* VISÍTANOS */}
          <div className="w-[88vw] max-w-[420px] flex-shrink-0 snap-start rounded-3xl border border-[#302E28] bg-[#151714] p-6 sm:w-[420px] sm:p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#22231F] text-2xl">
                📍
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F0D58A]">
                  Visítanos
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Encuéntranos
                </h2>
              </div>

            </div>

            <div className="mt-6 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-[#22231F]">
              <p className="text-sm text-gray-500">
                Foto del local
              </p>
            </div>

            <div className="mt-5">

              <p className="text-xs text-gray-500">
                Dirección
              </p>

              <p className="mt-1 font-semibold">
                Próximamente
              </p>

            </div>

            <div className="mt-5 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-[#302E28] bg-[#0D0F0C]">

              <div className="text-center">

                <p className="text-3xl">
                  📍
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Aquí aparecerá nuestro mapa
                </p>

              </div>

            </div>

            <button
              onClick={handleDirections}
              className="mt-5 w-full rounded-full bg-[#F0D58A] px-5 py-3.5 text-sm font-bold text-black transition hover:bg-white"
            >
              Cómo llegar
            </button>

          </div>


          {/* WHATSAPP */}
          <div className="w-[88vw] max-w-[420px] flex-shrink-0 snap-start rounded-3xl border border-[#302E28] bg-[#151714] p-6 sm:w-[420px] sm:p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#22231F] text-2xl">
                💬
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F0D58A]">
                  WhatsApp
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  ¿Tienes alguna consulta?
                </h2>
              </div>

            </div>

            <p className="mt-6 leading-7 text-gray-400">
              Escríbenos para consultar disponibilidad,
              pagos, envíos o cualquier otra duda.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 block w-full rounded-full border border-[#F0D58A] px-5 py-3.5 text-center text-sm font-bold text-[#F0D58A] transition hover:bg-[#F0D58A] hover:text-black"
            >
              Escríbenos por WhatsApp
            </a>

          </div>


          {/* REDES SOCIALES */}
          <div className="w-[88vw] max-w-[420px] flex-shrink-0 snap-start rounded-3xl border border-[#302E28] bg-[#151714] p-6 sm:w-[420px] sm:p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#22231F] text-2xl">
                ✨
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F0D58A]">
                  Redes
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Síguenos
                </h2>
              </div>

            </div>

            <p className="mt-6 text-sm leading-6 text-gray-400">
              Descubre novedades, outfits y promociones.
            </p>


            <div className="mt-6 space-y-3">

              {/* INSTAGRAM */}
              <button
                className="flex w-full items-center gap-4 rounded-2xl border border-[#302E28] p-4 text-left transition hover:border-[#F0D58A]"
              >

                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#22231F] text-xl">
                  ◎
                </span>

                <span>
                  <span className="block text-sm font-semibold">
                    Instagram
                  </span>

                  <span className="block text-xs text-gray-500">
                    @gmish
                  </span>
                </span>

              </button>


              {/* TIKTOK */}
              <button
                className="flex w-full items-center gap-4 rounded-2xl border border-[#302E28] p-4 text-left transition hover:border-[#F0D58A]"
              >

                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#22231F] text-xl">
                  ♪
                </span>

                <span>
                  <span className="block text-sm font-semibold">
                    TikTok
                  </span>

                  <span className="block text-xs text-gray-500">
                    @gmish
                  </span>
                </span>

              </button>


              {/* FACEBOOK */}
              <button
                className="flex w-full items-center gap-4 rounded-2xl border border-[#302E28] p-4 text-left transition hover:border-[#F0D58A]"
              >

                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#22231F] text-xl font-bold">
                  f
                </span>

                <span>
                  <span className="block text-sm font-semibold">
                    Facebook
                  </span>

                  <span className="block text-xs text-gray-500">
                    GMISH
                  </span>
                </span>

              </button>

            </div>

          </div>

        </div>


        {/* INDICADOR */}
        <div className="mt-2 flex justify-center gap-2 sm:hidden">

          <span className="h-1.5 w-6 rounded-full bg-[#F0D58A]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#302E28]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#302E28]" />

        </div>

      </section>


      {/* FOOTER */}
      <footer className="border-t border-[#302E28] bg-[#0A0C09]">

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xl font-bold tracking-wide">
              GMISH
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Tu estilo, tu esencia.
            </p>

          </div>


          <div className="flex flex-wrap gap-5 text-sm text-gray-400">

            <button
              onClick={() => onSelectCategory("hombre")}
              className="transition hover:text-[#F0D58A]"
            >
              Hombre
            </button>

            <button
              onClick={() => onSelectCategory("mujer")}
              className="transition hover:text-[#F0D58A]"
            >
              Mujer
            </button>

            <button
              onClick={() => onSelectCategory("ofertas")}
              className="transition hover:text-[#F0D58A]"
            >
              Ofertas
            </button>

          </div>


          <div className="text-sm text-gray-500">
            © 2026 GMISH
          </div>

        </div>

      </footer>
    </>
  )
}

export default StoreInfo
