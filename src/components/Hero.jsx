function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#D4AF5A]">
            Nueva colección
          </p>

          <h1 className="mt-4 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Estilo que habla por tí
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-[#E7E1D2]">
            Prendas versátiles y modernas pensadas para tu estilo diario
          </p>

          <a
            href="#productos"
            className="mt-8 inline-block rounded-full bg-[#D4AF5A] px-7 py-3 text-sm font-bold text-[#111210] transition hover:bg-[#F0D58A]"
          >
            Ver colección
          </a>
        </div>

        <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-[#1B1D1A]">
          <span className="text-sm font-medium text-[#E7E1D2]">
            Imagen principal
          </span>
        </div>
      </div>
    </section>
  )
}

export default Hero
