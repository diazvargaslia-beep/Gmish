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

  const whatsappUrl =
    "https://wa.me/51921366147"

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">

          {/* VISÍTANOS */}
          <div className="rounded-3xl border border-[#302E28] bg-[#151714] p-6 sm:p-8">

            <p className="text-sm font-semibold uppercase tracking-wider text-[#F0D58A]">
              Visítanos
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Encuéntranos
            </h2>

            <div className="mt-6 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-[#22231F]">
              <p className="text-sm text-gray-500">
                Foto del local
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-400">
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

          {/* WHATSAPP + REDES */}
          <div className="flex flex-col gap-6">

            {/* WHATSAPP */}
            <div className="rounded-3xl border border-[#302E28] bg-[#151714] p-6 sm:p-8">

              <p className="text-sm font-semibold uppercase tracking-wider text-[#F0D58A]">
                WhatsApp
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                ¿Tienes alguna consulta?
              </h2>

              <p className="mt-3 leading-7 text-gray-400">
                Escríbenos y te ayudaremos con disponibilidad,
                pagos, envíos o cualquier otra consulta.
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block w-full rounded-full border border-[#F0D58A] px-5 py-3.5 text-center text-sm font-bold text-[#F0D58A] transition hover:bg-[#F0D58A] hover:text-black"
              >
                Escríbenos por WhatsApp
              </a>

            </div>

            {/* REDES */}
            <div className="rounded-3xl border border-[#302E28] bg-[#151714] p-6 sm:p-8">

              <p className="text-sm font-semibold uppercase tracking-wider text-[#F0D58A]">
                Redes sociales
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Síguenos en redes
              </h2>

              <p className="mt-3 leading-7 text-gray-400">
                Descubre novedades, outfits y promociones.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">

                <button
                  className="rounded-2xl border border-[#302E28] p-4 text-sm font-semibold transition hover:border-[#F0D58A] hover:text-[#F0D58A]"
                >
                  Instagram
                </button>

                <button
                  className="rounded-2xl border border-[#302E28] p-4 text-sm font-semibold transition hover:border-[#F0D58A] hover:text-[#F0D58A]"
                >
                  TikTok
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-[#302E28] p-4 text-center text-sm font-semibold transition hover:border-[#F0D58A] hover:text-[#F0D58A]"
                >
                  WhatsApp
                </a>

              </div>
            </div>

          </div>
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
