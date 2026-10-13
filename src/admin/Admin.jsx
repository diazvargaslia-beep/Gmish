import { useState } from "react";

import ProductsAdmin from "./ProductsAdmin";
import OrdersAdmin from "./OrdersAdmin";
import InicioAdmin from "./InicioAdmin";
import PortadasAdmin from "./PortadasAdmin";
import EstadisticasAdmin from "./EstadisticasAdmin";
import ConfiguracionAdmin from "./ConfiguracionAdmin";

function MenuIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h12l2 4v12H4V8l2-4Z" />
      <path d="M4 8h16" />
      <path d="M9 12h6" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function CoverIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="M21 15l-5-5L6 20" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
  );
}

function SettingsIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 6.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0-1.5 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

const menuItems = [
  {
    id: "inicio",
    label: "Inicio",
    icon: <HomeIcon />,
  },
  {
    id: "productos",
    label: "Productos",
    icon: <ProductsIcon />,
  },
  {
    id: "pedidos",
    label: "Pedidos y ventas",
    icon: <OrdersIcon />,
  },
  {
    id: "portadas",
    label: "Portadas",
    icon: <CoverIcon />,
  },
  {
    id: "estadisticas",
    label: "Estadísticas",
    icon: <StatsIcon />,
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: <SettingsIcon />,
  },
];

function Admin() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  const navigateTo = (section) => {
    setActiveSection(section);
    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const renderSection = () => {
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
        return <InicioAdmin onNavigate={navigateTo} />;
    }
  };

  const currentSection =
    menuItems.find((item) => item.id === activeSection)?.label || "Inicio";

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900">
      {/* OVERLAY */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* MENÚ LATERAL */}
      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          h-full
          w-[310px]
          max-w-[85vw]
          border-r
          border-neutral-200
          bg-white
          shadow-xl
          transition-transform
          duration-300
          ease-out
          ${menuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* CABECERA DEL MENÚ */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-7 py-6">
            <div className="text-center">
              <p className="text-[19px] font-semibold tracking-[0.18em]">
                GMISH
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Administración
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="
                flex
                h-[44px]
                w-[44px]
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
              <CloseIcon />
            </button>
          </div>

          {/* OPCIONES */}
          <nav className="flex flex-1 flex-col gap-3 px-5 py-8">
            {menuItems.map((item) => {
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`
                    flex
                    min-h-[53px]
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-xl
                    px-5
                    py-3
                    text-[15px]
                    font-medium
                    transition
                    duration-200
                    ${
                      active
                        ? "bg-neutral-100 text-black"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* PIE */}
          <div className="border-t border-neutral-200 px-6 py-6 text-center">
            <p className="text-[11px] text-neutral-400">
              Panel de administración GMISH
            </p>
          </div>
        </div>
      </aside>

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="relative mx-auto flex h-[76px] w-full max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* MENÚ */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="
              flex
              h-[46px]
              w-[46px]
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
            <MenuIcon />
          </button>

          {/* LOGO */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-[21px] font-semibold tracking-[0.22em]">
              GMISH
            </p>

            <p className="mt-1 hidden text-[9px] uppercase tracking-[0.2em] text-neutral-400 sm:block">
              Administración
            </p>
          </div>

          {/* VER TIENDA */}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="
              flex
              min-h-[46px]
              items-center
              justify-center
              rounded-xl
              border
              border-neutral-900
              px-5
              py-3
              text-[14px]
              font-medium
              transition
              hover:bg-neutral-900
              hover:text-white
            "
          >
            Ver tienda
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full">
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[1500px]
            flex-col
            items-center
            px-5
            py-12
            sm:px-8
            sm:py-16
            lg:px-10
            lg:py-20
          "
        >
          {/* TÍTULO GENERAL */}
          <div className="mb-12 flex w-full flex-col items-center justify-center text-center">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-400">
              Panel de administración
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              {currentSection}
            </h1>
          </div>

          {/* CONTENIDO DE LA SECCIÓN */}
          <div className="flex w-full items-center justify-center">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Admin;