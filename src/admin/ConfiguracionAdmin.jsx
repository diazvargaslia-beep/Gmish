function ConfiguracionAdmin() {
  return (
    <section className="flex w-full flex-col items-center">
      <div className="flex w-full max-w-5xl flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
          <span className="text-xl">⚙</span>
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          Configuración
        </h2>

        <p className="mt-4 max-w-xl text-[15px] leading-7 text-neutral-500">
          Desde aquí podrás configurar la información general de GMISH.
        </p>

        {/* CONFIGURACIÓN GENERAL */}
        <div className="mt-14 flex w-full flex-col items-center rounded-2xl border border-neutral-200 bg-white px-7 py-10 text-center shadow-sm">
          <h3 className="text-xl font-semibold">
            Configuración general
          </h3>

          <p className="mt-3 max-w-lg text-sm leading-6 text-neutral-500">
            Próximamente podrás editar la información de la tienda,
            dirección, redes sociales y números de WhatsApp.
          </p>

          <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex min-h-[105px] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-6">
              <span className="text-sm font-medium">
                Información de tienda
              </span>

              <span className="mt-2 text-xs text-neutral-400">
                Nombre y dirección
              </span>
            </div>

            <div className="flex min-h-[105px] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-6">
              <span className="text-sm font-medium">
                Redes sociales
              </span>

              <span className="mt-2 text-xs text-neutral-400">
                Instagram, TikTok y Facebook
              </span>
            </div>

            <div className="flex min-h-[105px] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-6">
              <span className="text-sm font-medium">
                WhatsApp
              </span>

              <span className="mt-2 text-xs text-neutral-400">
                Números de contacto
              </span>
            </div>

            <div className="flex min-h-[105px] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-6">
              <span className="text-sm font-medium">
                Tienda física
              </span>

              <span className="mt-2 text-xs text-neutral-400">
                Dirección y mapa
              </span>
            </div>
          </div>

          <button
            type="button"
            className="
              mt-10
              min-h-[51px]
              min-w-[180px]
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
            Editar configuración
          </button>
        </div>
      </div>
    </section>
  );
}

export default ConfiguracionAdmin;