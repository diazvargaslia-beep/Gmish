
import { useMemo } from "react";
import FeaturedProducts from "./FeaturedProducts";

function CategorySection({
  category,
  products = [],
  selectedSubcategory = "todos",
  onSelectSubcategory,
}) {
  const categoryProducts = useMemo(() => {
    return products.filter(
      (product) =>
        String(product.category || "").trim().toLowerCase() ===
        String(category || "").trim().toLowerCase()
    );
  }, [products, category]);

  const subcategories = useMemo(() => {
    const uniqueSubcategories = new Map();

    categoryProducts.forEach((product) => {
      const original = String(product.subcategory || "").trim();

      if (!original) return;

      const normalized = original.toLocaleLowerCase("es");

      if (!uniqueSubcategories.has(normalized)) {
        uniqueSubcategories.set(normalized, original);
      }
    });

    return [...uniqueSubcategories.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "es"))
      .map(([value, label]) => ({ value, label }));
  }, [categoryProducts]);

  function seleccionarSubcategoria(value) {
    if (onSelectSubcategory) {
      onSelectSubcategory(value);
    }
  }

  const filteredProducts =
    selectedSubcategory === "todos"
      ? categoryProducts
      : categoryProducts.filter(
          (product) =>
            String(product.subcategory || "")
              .trim()
              .toLocaleLowerCase("es") ===
            String(selectedSubcategory).trim().toLocaleLowerCase("es")
        );

  if (categoryProducts.length === 0) {
    return (
      <section className="categoria-pagina">
        <div className="catalogo-vacio">
          <span className="catalogo-vacio-icono">⌕</span>
          <h2>Próximamente</h2>
          <p>
            Estamos preparando nuevas prendas para esta colección.
          </p>
        </div>
      </section>
    );
  }

  if (selectedSubcategory !== "todos") {
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

  return (
    <section className="categoria-pagina">
      <div className="categoria-listado-por-tipo">
        {subcategories.map((subcategory) => {
          const productsInSubcategory = categoryProducts.filter(
            (product) =>
              String(product.subcategory || "")
                .trim()
                .toLocaleLowerCase("es") === subcategory.value
          );

          if (productsInSubcategory.length === 0) return null;

          return (
            <section
              className="categoria-bloque-horizontal"
              key={subcategory.value}
            >
              <div className="categoria-encabezado-fila">
                <h2>{subcategory.label}</h2>

                <button
                  type="button"
                  onClick={() =>
                    seleccionarSubcategoria(subcategory.value)
                  }
                >
                  Ver todos <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="categoria-contenedor-deslizable">
                <FeaturedProducts
                  category="todos"
                  search=""
                  newOnly={false}
                  products={productsInSubcategory}
                  layout="horizontal"
                />
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default CategorySection;
