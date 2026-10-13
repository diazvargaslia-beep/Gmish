function PortadasAdmin() {
  return (
    <section className="flex w-full flex-col items-center">
      <div className="flex w-full max-w-5xl flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
          <span className="text-xl">✦</span>
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          Portadas
        </h2>

        <p className="mt-4 max-w-xl text-[15px] leading-7 text-neutral-500">
          Aquí podrás administrar las imágenes principales que aparecen en
          la tienda GMISH.
        </p>

        <div className="mt-12 flex w-full max-w-4xl flex-col items-center rounded-2xl border border-neutral-200 bg-white px-8 py-12 text-center shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
            <span className="text-2xl text-neutral-400">+</span>
          </div>

          <h3 className="mt-6 text-lg font-semibold">
            Nueva portada
          </h3>

          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
            Aquí agregaremos las imágenes, textos y botones de las portadas
            principales.
          </p>

          <button
            type="button"
            className="
              mt-8
              min-h-[51px]
              min-w-[170px]
              rounded-xl
              bg-neutral-900
              px-7
              py-3
              text-[14px]
              font-medium
              text-white
              transition
              hover:bg-neutral-700
            "
          >
            Agregar portada
          </button>
        </div>
      </div>
    </section>
  );
}

export default PortadasAdmin;