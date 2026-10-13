function InicioAdmin({ onNavigate }) {
  const cards = [
    {
      id: "productos",
      title: "Productos",
      description: "Administra tus productos, precios, tallas, colores y stock.",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4h12l2 4v12H4V8l2-4Z" />
          <path d="M4 8h16" />
          <path d="M9 12h6" />
        </svg>
      ),
    },
    {
      id: "pedidos",
      title: "Pedidos y ventas",
      description: "Revisa los pedidos realizados y gestiona tus ventas.",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 4h14v16H5z" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      ),
    },
    {
      id: "portadas",
      title: "Portadas",
      description: "Gestiona las imágenes y contenido principal de tu tienda.",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="M21 15l-5-5L6 20" />
        </svg>
      ),
    },
    {
      id: "estadisticas",
      title: "Estadísticas",
      description: "Consulta el rendimiento y las estadísticas de tu tienda.",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 16v-4" />
          <path d="M12 16V8" />
          <path d="M16 16v-7" />
          <path d="M20 16V5" />
        </svg>
      ),
    },
    {
      id: "configuracion",
      title: "Configuración",
      description: "Configura los datos y las opciones de tu tienda.",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 6.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 .3 1.9 1.7 1.7 0 0 0 1.5 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="flex w-full flex-col items-center justify-center">
      {/* BIENVENIDA */}
      <div className="mb-14 flex w-full flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Bienvenida a GMISH
        </h1>

        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-neutral-500">
          Desde aquí podrás administrar todos los aspectos de tu tienda.
        </p>
      </div>

      {/* CUADRÍCULA */}
      <div className="grid w-full max-w-[1100px] grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onNavigate(card.id)}
            className="
              flex
              min-h-[230px]
              w-full
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-neutral-200
              bg-white
              px-8
              py-9
              text-center
              text-neutral-900
              shadow-sm
              transition
              duration-200
              hover:-translate-y-1
              hover:border-neutral-300
              hover:shadow-md
              active:translate-y-0
            "
          >
            {/* ICONO */}
            <div className="mb-6 flex h-[62px] w-[62px] items-center justify-center rounded-full border border-neutral-200 text-neutral-700">
              {card.icon}
            </div>

            {/* TÍTULO */}
            <h2 className="text-[18px] font-semibold">
              {card.title}
            </h2>

            {/* DESCRIPCIÓN */}
            <p className="mt-3 max-w-[270px] text-[14px] leading-6 text-neutral-500">
              {card.description}
            </p>

            {/* INDICADOR */}
            <div className="mt-6 text-[13px] font-medium text-neutral-700">
              Administrar →
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default InicioAdmin;