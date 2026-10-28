import { useEffect, useState } from "react";

import ProductsAdmin from "./ProductsAdmin";
import OrdersAdmin from "./OrdersAdmin";
import InicioAdmin from "./InicioAdmin";
import PortadasAdmin from "./PortadasAdmin";
import EstadisticasAdmin from "./EstadisticasAdmin";
import ConfiguracionAdmin from "./ConfiguracionAdmin";

/* =========================================================
   ICONOS
   ========================================================= */

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    );
  }

  if (name === "products") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...common}>
        <path d="M6 3h12v18H6z" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h3" />
      </svg>
    );
  }

  if (name === "cover") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m5 17 4.5-4 3 2.5 2.5-2 4 3.5" />
      </svg>
    );
  }

  if (name === "stats") {
    return (
      <svg {...common}>
        <path d="M5 20V10" />
        <path d="M12 20V4" />
        <path d="M19 20v-7" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L9 6.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </svg>
    );
  }

  if (name === "store") {
    return (
      <svg {...common}>
        <path d="M4 10v10h16V10" />
        <path d="M3 10 5 4h14l2 6" />
        <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
        <path d="M9 20v-5h6v5" />
      </svg>
    );
  }

  return null;
}

/* =========================================================
   MENÚ
   ========================================================= */

const menuItems = [
  {
    id: "inicio",
    label: "Inicio",
    icon: <Icon name="home" size={19} />,
  },
  {
    id: "productos",
    label: "Productos",
    icon: <Icon name="products" size={19} />,
  },
  {
    id: "pedidos",
    label: "Pedidos y ventas",
    icon: <Icon name="orders" size={19} />,
  },
  {
    id: "portadas",
    label: "Portadas",
    icon: <Icon name="cover" size={19} />,
  },
  {
    id: "estadisticas",
    label: "Estadísticas",
    icon: <Icon name="stats" size={19} />,
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: <Icon name="settings" size={19} />,
  },
];

/* =========================================================
   ADMIN
   ========================================================= */

export default function Admin() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [activeSection, setActiveSection] = useState(
    window.history.state?.adminSection || "inicio"
  );

  /* ---------------------------------------------------------
     HISTORIAL DEL NAVEGADOR

     Esto permite utilizar el botón/gesto de retroceder
     propio del navegador o del dispositivo.
     --------------------------------------------------------- */

  useEffect(() => {
    const currentState = window.history.state || {};

    if (!currentState.adminSection) {
      window.history.replaceState(
        {
          ...currentState,
          adminSection: "inicio",
        },
        ""
      );
    }

    function handlePopState(event) {
      const state = event.state || {};

      setActiveSection(
        state.adminSection || "inicio"
      );

      setMenuOpen(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  /* ---------------------------------------------------------
     NAVEGACIÓN
     --------------------------------------------------------- */

  function navigateTo(section) {
    const state = {
      ...(window.history.state || {}),
      adminSection: section,
    };

    if (section === "productos") {
      state.productsAdminView = "list";
      state.productsAdminCategory = "hombre";
      state.productsAdminSubcategory = null;
    }

    window.history.pushState(
      state,
      "",
      window.location.href
    );

    setActiveSection(section);
    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* ---------------------------------------------------------
     SECCIÓN ACTUAL
     --------------------------------------------------------- */

  const currentItem =
    menuItems.find(
      (item) => item.id === activeSection
    ) || menuItems[0];

  /* ---------------------------------------------------------
     CONTENIDO
     --------------------------------------------------------- */

  function renderSection() {
    switch (activeSection) {
      case "productos":
        return <ProductsAdmin />;

      case "pedidos":
        return <OrdersAdmin />;

      case "portadas":
        return <PortadasAdmin />;

      case "estadisticas":
        return <EstadisticasAdmin />;

      case "configuracion":
        return <ConfiguracionAdmin />;

      case "inicio":
      default:
        return (
          <InicioAdmin
            onNavigate={navigateTo}
          />
        );
    }
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="min-h-screen w-full bg-[#fafafa] text-neutral-900">
      {/* =====================================================
          OVERLAY DEL MENÚ
          ===================================================== */}

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          h-full
          w-[330px]
          max-w-[88vw]
          border-r
          border-neutral-200
          bg-white
          shadow-[12px_0_45px_rgba(0,0,0,0.06)]
          transition-transform
          duration-300
          ease-out
          ${
            menuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div className="flex h-full flex-col">
          {/* CABECERA */}

          <div className="flex items-center justify-between border-b border-neutral-200 px-8 py-8">
            <div>
              <p className="text-[20px] font-semibold tracking-[0.2em]">
                GMISH
              </p>

              <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-neutral-400">
                Administración
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMenuOpen(false)
              }
              aria-label="Cerrar menú"
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                border
                border-neutral-200
                text-neutral-700
                transition
                hover:bg-neutral-100
              "
            >
              <Icon
                name="close"
                size={19}
              />
            </button>
          </div>

          {/* NAVEGACIÓN */}

          <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-10">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
              Gestión
            </p>

            {menuItems.map((item) => {
              const active =
                activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    navigateTo(item.id)
                  }
                  className={`
                    group
                    flex
                    min-h-[58px]
                    w-full
                    items-center
                    gap-4
                    rounded-2xl
                    px-5
                    text-left
                    text-[14px]
                    font-medium
                    transition
                    ${
                      active
                        ? "bg-neutral-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                    }
                  `}
                >
                  <span
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        active
                          ? "bg-white/10"
                          : "bg-neutral-100 group-hover:bg-white"
                      }
                    `}
                  >
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* PIE DEL MENÚ */}

          <div className="border-t border-neutral-200 px-8 py-7">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="
                flex
                min-h-[48px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-neutral-200
                text-xs
                font-semibold
                text-neutral-700
                transition
                hover:border-neutral-900
                hover:bg-neutral-900
                hover:text-white
              "
            >
              <Icon
                name="store"
                size={16}
              />

              Ver tienda
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex h-[86px] w-full max-w-[1680px] items-center justify-between px-7 sm:px-12 lg:px-16 xl:px-20">
          {/* MENÚ */}

          <button
            type="button"
            onClick={() =>
              setMenuOpen(true)
            }
            aria-label="Abrir menú"
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              border
              border-neutral-200
              text-neutral-800
              transition
              hover:bg-neutral-100
            "
          >
            <Icon
              name="menu"
              size={21}
            />
          </button>

          {/* LOGO CENTRADO */}

          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-[21px] font-semibold tracking-[0.24em]">
              GMISH
            </p>

            <p className="mt-1 hidden text-[9px] uppercase tracking-[0.25em] text-neutral-400 sm:block">
              Administración
            </p>
          </div>

          {/* TIENDA */}

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="
              min-h-[46px]
              rounded-xl
              border
              border-neutral-900
              px-5
              py-3
              text-[13px]
              font-semibold
              transition
              hover:bg-neutral-900
              hover:text-white
            "
          >
            Ver tienda
          </button>
        </div>
      </header>

      {/* =====================================================
          CONTENIDO PRINCIPAL
          ===================================================== */}

      <main className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col items-center">
          {/* =================================================
              ENCABEZADO DE SECCIÓN
              ================================================= */}

          <div className="mb-16 flex w-full max-w-[1500px] items-center justify-between gap-8 border-b border-neutral-200 pb-10">
            <div className="flex items-center gap-5">
              {/* ICONO */}

              <span
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-neutral-900
                  text-white
                  shadow-[0_8px_24px_rgba(0,0,0,0.12)]
                "
              >
                {currentItem.icon}
              </span>

              {/* TÍTULO */}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                  Sección
                </p>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {currentItem.label}
                </h1>
              </div>
            </div>

            {/* INFORMACIÓN SUPERIOR */}

            <div className="hidden text-right md:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                GMISH / ADMIN
              </p>

              <p className="mt-2 text-xs text-neutral-500">
                Gestión central de la tienda
              </p>
            </div>
          </div>

          {/* =================================================
              SECCIÓN
              ================================================= */}

          <div className="flex w-full max-w-[1500px] items-center justify-center">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
}