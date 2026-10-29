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
     PRODUCTOS DE LA CATEGORÍA
     ========================================= */

  const categoryProducts = useMemo(() => {
    const categoriaActual =
      normalizarTexto(category);

    return products.filter(
      (product) =>
        normalizarTexto(
          product?.category
        ) === categoriaActual
    );
  }, [products, category]);

  /* =========================================
     SUBCATEGORÍAS DISPONIBLES
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

        if (
          !uniqueSubcategories.has(
            normalized
          )
        ) {
          uniqueSubcategories.set(
            normalized,
            original
          );
        }
      }
    );

    return [
      ...uniqueSubcategories.entries(),
    ]
      .sort((a, b) =>
        a[1].localeCompare(
          b[1],
          "es",
          {
            sensitivity: "base",
          }
        )
      )
      .map(([value, label]) => ({
        value,
        label,
      }));
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

      return categoryProducts.filter(
        (product) =>
          normalizarTexto(
            product?.subcategory
          ) === subcategoriaActual
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

     Ejemplo:
     Hombre → Polos → Ver todos

     Aquí sí mostramos:
     "Ordenar por"
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
          products={filteredProducts}
          layout="grid"
          showSort={true}
        />
      </section>
    );
  }

  /* =========================================
     VISTA GENERAL DE LA CATEGORÍA

     Ejemplo:
     HOMBRE

     Polos          Ver todos →
     [productos...]

     Pantalones     Ver todos →
     [productos...]
     ========================================= */

  return (
    <section className="categoria-pagina">
      <div className="categoria-listado-por-tipo">
        {subcategories.map(
          (subcategory) => {
            const productsInSubcategory =
              categoryProducts.filter(
                (product) =>
                  normalizarTexto(
                    product?.subcategory
                  ) ===
                  subcategory.value
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