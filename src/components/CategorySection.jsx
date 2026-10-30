import { useMemo } from "react";
import FeaturedProducts from "./FeaturedProducts";

function CategorySection({
  category,
  products = [],
  selectedSubcategory = "todos",
  onSelectSubcategory,
}) {
  /* =========================================
     NORMALIZAR TEXTO
     ========================================= */

  function normalizarTexto(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .trim();
  }

  /* =========================================
     OBTENER POSICIÓN NUMÉRICA
     ========================================= */

  function obtenerPosicion(valor) {
    const numero = Number(valor);

    return Number.isFinite(numero)
      ? numero
      : Number.MAX_SAFE_INTEGER;
  }

  /* =========================================
     ORDENAR PRODUCTOS MANUALMENTE
     ========================================= */

  function ordenarProductos(lista) {
    return [...lista].sort((a, b) => {
      const posicionA = obtenerPosicion(
        a?.product_position
      );

      const posicionB = obtenerPosicion(
        b?.product_position
      );

      if (posicionA !== posicionB) {
        return posicionA - posicionB;
      }

      const fechaA = new Date(
        a?.created_at || 0
      ).getTime();

      const fechaB = new Date(
        b?.created_at || 0
      ).getTime();

      if (fechaA !== fechaB) {
        return fechaA - fechaB;
      }

      return String(a?.name || "").localeCompare(
        String(b?.name || ""),
        "es",
        {
          sensitivity: "base",
        }
      );
    });
  }

  /* =========================================
     PRODUCTOS DE LA CATEGORÍA
     ========================================= */

  const categoryProducts = useMemo(() => {
    const categoriaActual =
      normalizarTexto(category);

    const encontrados = products.filter(
      (product) =>
        normalizarTexto(
          product?.category
        ) === categoriaActual
    );

    return ordenarProductos(encontrados);
  }, [products, category]);

  /* =========================================
     SUBCATEGORÍAS DISPONIBLES

     YA NO SE ORDENAN ALFABÉTICAMENTE.
     RESPETAN subcategory_position.
     ========================================= */

  const subcategories = useMemo(() => {
    const uniqueSubcategories =
      new Map();

    categoryProducts.forEach(
      (product) => {
        const original = String(
          product?.subcategory || ""
        ).trim();

        if (!original) return;

        const normalized =
          normalizarTexto(original);

        const position =
          obtenerPosicion(
            product?.subcategory_position
          );

        if (
          !uniqueSubcategories.has(
            normalized
          )
        ) {
          uniqueSubcategories.set(
            normalized,
            {
              value: normalized,
              label: original,
              position,
            }
          );

          return;
        }

        const existing =
          uniqueSubcategories.get(
            normalized
          );

        if (
          position <
          existing.position
        ) {
          uniqueSubcategories.set(
            normalized,
            {
              ...existing,
              position,
            }
          );
        }
      }
    );

    return [
      ...uniqueSubcategories.values(),
    ].sort((a, b) => {
      if (
        a.position !== b.position
      ) {
        return (
          a.position - b.position
        );
      }

      return a.label.localeCompare(
        b.label,
        "es",
        {
          sensitivity: "base",
        }
      );
    });
  }, [categoryProducts]);

  /* =========================================
     SUBCATEGORÍA ACTUAL
     ========================================= */

  const subcategoriaActual =
    normalizarTexto(
      selectedSubcategory
    ) || "todos";

  /* =========================================
     PRODUCTOS FILTRADOS
     ========================================= */

  const filteredProducts =
    useMemo(() => {
      if (
        subcategoriaActual === "todos"
      ) {
        return categoryProducts;
      }

      const encontrados =
        categoryProducts.filter(
          (product) =>
            normalizarTexto(
              product?.subcategory
            ) === subcategoriaActual
        );

      return ordenarProductos(
        encontrados
      );
    }, [
      categoryProducts,
      subcategoriaActual,
    ]);

  /* =========================================
     SELECCIONAR SUBCATEGORÍA
     ========================================= */

  function seleccionarSubcategoria(
    value
  ) {
    if (
      typeof onSelectSubcategory ===
      "function"
    ) {
      onSelectSubcategory(value);
    }
  }

  /* =========================================
     CATEGORÍA VACÍA
     ========================================= */

  if (categoryProducts.length === 0) {
    return (
      <section className="categoria-pagina">
        <div className="catalogo-vacio">
          <span className="catalogo-vacio-icono">
            ⌕
          </span>

          <h2>Próximamente</h2>

          <p>
            Estamos preparando nuevas prendas
            para esta colección.
          </p>
        </div>
      </section>
    );
  }

  /* =========================================
     SUBCATEGORÍA ESPECÍFICA
     ========================================= */

  if (
    subcategoriaActual !== "todos"
  ) {
    return (
      <section className="categoria-pagina">
        <FeaturedProducts
          category="todos"
          search=""
          newOnly={false}
          products={
            filteredProducts
          }
          layout="grid"
          showSort={true}
        />
      </section>
    );
  }

  /* =========================================
     VISTA GENERAL DE LA CATEGORÍA
     ========================================= */

  return (
    <section className="categoria-pagina">
      <div className="categoria-listado-por-tipo">
        {subcategories.map(
          (subcategory) => {
            const productsInSubcategory =
              ordenarProductos(
                categoryProducts.filter(
                  (product) =>
                    normalizarTexto(
                      product?.subcategory
                    ) ===
                    subcategory.value
                )
              );

            if (
              productsInSubcategory.length ===
              0
            ) {
              return null;
            }

            return (
              <section
                className="categoria-bloque-horizontal"
                key={
                  subcategory.value
                }
              >
                <div className="categoria-encabezado-fila">
                  <h2>
                    {
                      subcategory.label
                    }
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      seleccionarSubcategoria(
                        subcategory.value
                      )
                    }
                  >
                    Ver todos{" "}
                    <span
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                </div>

                <div className="categoria-contenedor-deslizable">
                  <FeaturedProducts
                    category="todos"
                    search=""
                    newOnly={false}
                    products={
                      productsInSubcategory
                    }
                    layout="horizontal"
                    showSort={false}
                  />
                </div>
              </section>
            );
          }
        )}
      </div>
    </section>
  );
}

export default CategorySection;