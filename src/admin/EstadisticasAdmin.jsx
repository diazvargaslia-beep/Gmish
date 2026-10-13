function EstadisticasAdmin() {
  const statistics = [
    {
      title: "Ventas totales",
      value: "—",
    },
    {
      title: "Pedidos",
      value: "—",
    },
    {
      title: "Productos vendidos",
      value: "—",
    },
    {
      title: "Ticket promedio",
      value: "—",
    },
  ];

  return (
    <section className="flex w-full flex-col items-center">
      <div className="flex w-full max-w-6xl flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
          <span className="text-xl">↗</span>
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          Estadísticas
        </h2>

        <p className="mt-4 max-w-xl text-[15px] leading-7 text-neutral-500">
          Aquí veremos el rendimiento de GMISH, las ventas y el movimiento
          de los productos.
        </p>

        {/* TARJETAS */}
        <div className="mt-14 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map((stat) => (
            <div
              key={stat.title}
              className="
                flex
                min-h-[155px]
                w-full
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-neutral-200
                bg-white
                px-6
                py-8
                text-center
                shadow-sm
              "
            >
              <p className="text-[13px] text-neutral-500">
                {stat.title}
              </p>

              <p className="mt-5 text-3xl font-semibold">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* GRÁFICO */}
        <div className="mt-8 flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white px-8 py-10 text-center shadow-sm">
          <h3 className="text-lg font-semibold">
            Rendimiento de la tienda
          </h3>

          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
            En esta sección agregaremos los gráficos de ventas, pedidos y
            productos más vendidos.
          </p>

          <button
            type="button"
            className="
              mt-8
              min-h-[51px]
              min-w-[170px]
              rounded-xl
              border
              border-neutral-900
              px-7
              py-3
              text-[14px]
              font-medium
              transition
              hover:bg-neutral-900
              hover:text-white
            "
          >
            Ver estadísticas
          </button>
        </div>
      </div>
    </section>
  );
}

export default EstadisticasAdmin;