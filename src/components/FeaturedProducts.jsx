
import { useMemo, useState, useRef } from "react";
import ProductDetailModal from "./ProductDetailModal";

function FeaturedProducts({
  category = "todos",
  search = "",
  newOnly = false,
  products = [],
  layout = "grid",
  showSort = false,
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [carouselIndexes, setCarouselIndexes] = useState({});
  const [dragging, setDragging] = useState(false);
  const [sortMode, setSortMode] = useState("default");

  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragCurrentX = useRef(0);
  const dragCurrentY = useRef(0);
  const movedRef = useRef(false);

  const filteredProducts = useMemo(() => {
    const searchText = String(search || "").trim().toLowerCase();

    let result = products.filter((product) => {
      const matchesCategory =
        category === "todos" ||
        product.category === category ||
        (category === "ofertas" &&
          product.old_price &&
          Number(product.old_price) > Number(product.price));

      const name = String(product.name || "").toLowerCase();
      const subcategory = String(product.subcategory || "").toLowerCase();
      const description = String(product.description || "").toLowerCase();

      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        subcategory.includes(searchText) ||
        description.includes(searchText);

      const matchesNew =
        !newOnly || product.is_new === true || product.is_new === 1;

      return matchesCategory && matchesSearch && matchesNew;
    });

    if (sortMode === "offers") {
      result = result.filter(
        (product) =>
          Number(product.old_price) > Number(product.price)
      );
    }

    return [...result].sort((a, b) => {
      if (sortMode === "price-asc") {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (sortMode === "price-desc") {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      if (sortMode === "offers") {
        const discountA =
          Number(a.old_price) > Number(a.price)
            ? (Number(a.old_price) - Number(a.price)) /
              Number(a.old_price)
            : 0;

        const discountB =
          Number(b.old_price) > Number(b.price)
            ? (Number(b.old_price) - Number(b.price)) /
              Number(b.old_price)
            : 0;

        return discountB - discountA;
      }

      if (sortMode === "best-sellers") {
        const salesA = Number(
          a.units_sold ?? a.sales_count ?? a.sold_count ?? 0
        );

        const salesB = Number(
          b.units_sold ?? b.sales_count ?? b.sold_count ?? 0
        );

        return salesB - salesA;
      }

            if (sortMode === "new-in") {
        const nuevoA = a.is_new === true || a.is_new === 1;
        const nuevoB = b.is_new === true || b.is_new === 1;

        if (nuevoA !== nuevoB) {
          return Number(nuevoB) - Number(nuevoA);
        }

        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });
  }, [products, category, search, newOnly, sortMode]);

  const getColorImages = (product) => {
    const variants = product.product_variants || [];
    const uniqueColors = new Map();

    variants.forEach((variant) => {
      if (
        Number(variant.stock) > 0 &&
        variant.color_image_url &&
        !uniqueColors.has(variant.color)
      ) {
        uniqueColors.set(variant.color, {
          name: variant.color,
          imageUrl: variant.color_image_url,
          hex: variant.color_hex || "#b8b1a5",
        });
      }
    });

    return [...uniqueColors.values()];
  };

  const moveCarousel = (productId, direction, total) => {
    if (total <= 1) return;

    setCarouselIndexes((current) => {
      const currentIndex = current[productId] || 0;
      const nextIndex = (currentIndex + direction + total) % total;

      return { ...current, [productId]: nextIndex };
    });
  };

  const selectCarouselImage = (productId, index) => {
    setCarouselIndexes((current) => ({
      ...current,
      [productId]: index,
    }));
  };

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    movedRef.current = false;
    setDragging(true);

    dragStartX.current = event.clientX;
    dragStartY.current = event.clientY;
    dragCurrentX.current = event.clientX;
    dragCurrentY.current = event.clientY;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // El navegador puede haber liberado el puntero.
    }
  }

  function handlePointerMove(event) {
    if (!dragging) return;

    dragCurrentX.current = event.clientX;
    dragCurrentY.current = event.clientY;

    const differenceX = Math.abs(
      dragCurrentX.current - dragStartX.current
    );

    const differenceY = Math.abs(
      dragCurrentY.current - dragStartY.current
    );

    if (differenceX > 10 || differenceY > 10) {
      movedRef.current = true;
    }
  }

  function handlePointerUp(event, productId, total) {
    const differenceX = dragStartX.current - dragCurrentX.current;
    const differenceY = dragStartY.current - dragCurrentY.current;

    const horizontalSwipe =
      Math.abs(differenceX) > 40 &&
      Math.abs(differenceX) > Math.abs(differenceY);

    if (horizontalSwipe) {
      moveCarousel(productId, differenceX > 0 ? 1 : -1, total);
    }

    setDragging(false);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // El puntero ya se liberó.
    }
  }

  function openProduct(product) {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }

    setSelectedProduct(product);
  }

  const getRelativePosition = (index, activeIndex, total) => {
    let difference = index - activeIndex;

    if (difference > total / 2) difference -= total;
    if (difference < -total / 2) difference += total;

    return difference;
  };

  return (
    <>
      {showSort && (
        <div
          className="gmish-ordenar"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            margin: "20px 0",
          }}
        >
          <label
            htmlFor="gmish-orden-productos"
            style={{ fontSize: "13px" }}
          >
            Ordenar por
          </label>

          <select
            id="gmish-orden-productos"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
            style={{
              maxWidth: "100%",
              padding: "10px 12px",
              border: "1px solid #dedede",
              borderRadius: "4px",
              background: "#fff",
              color: "#151515",
              fontSize: "13px",
            }}
          >
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="offers">Ofertas</option>
            <option value="best-sellers">Más vendidos</option>
            <option value="new-in">New In</option>
          </select>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="catalogo-vacio">
          <span className="catalogo-vacio-icono">⌕</span>
          <h2>No encontramos prendas</h2>
          <p>
            Prueba con otra búsqueda o vuelve a explorar la colección.
          </p>
        </div>
      ) : (
        <div
          className={`productos-grid ${
            layout === "horizontal"
              ? "productos-grid-horizontal"
              : "productos-grid-catalogo"
          }`}
        >
          {filteredProducts.map((product) => {
            const isOffer =
              Number(product.old_price) > Number(product.price);

            const colorImages = getColorImages(product);

            const productImages = [
              ...(product.product_images || []),
            ].sort(
              (a, b) =>
                Number(a.position || 0) - Number(b.position || 0)
            );

            const regularImages = productImages
              .filter((image) => image.image_url)
              .map((image) => ({
                name: "",
                imageUrl: image.image_url,
                hex: "#b8b1a5",
              }));

            const images =
              colorImages.length > 0 ? colorImages : regularImages;

            const total = images.length;
            const activeIndex =
              (carouselIndexes[product.id] || 0) % (total || 1);

            return (
              <article className="producto-card" key={product.id}>
                <div
                  className="producto-imagen-contenedor"
                  style={{
                    touchAction: "pan-y",
                    cursor: "pointer",
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={(event) =>
                    handlePointerUp(event, product.id, total)
                  }
                  onPointerCancel={() => setDragging(false)}
                  onClick={() => openProduct(product)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalles de ${product.name}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openProduct(product);
                    }
                  }}
                >
                  {total === 0 ? (
                    <div className="producto-sin-imagen">
                      <span>GMISH</span>
                    </div>
                  ) : total === 1 ? (
                    <img
                      src={images[0].imageUrl}
                      alt={product.name}
                      className="producto-imagen"
                      draggable="false"
                    />
                  ) : (
                    <div className="producto-carrusel">
                      {images.map((image, index) => {
                        const position = getRelativePosition(
                          index,
                          activeIndex,
                          total
                        );

                        let transform = "translateX(0) scale(.55)";
                        let opacity = 0;
                        let zIndex = 1;

                        if (position === 0) {
                          transform = "translateX(0) scale(1)";
                          opacity = 1;
                          zIndex = 3;
                        } else if (position === -1) {
                          transform = "translateX(-27%) scale(.8)";
                          opacity = 0.5;
                          zIndex = 2;
                        } else if (position === 1) {
                          transform = "translateX(27%) scale(.8)";
                          opacity = 0.5;
                          zIndex = 2;
                        }

                        return (
                          <img
                            key={`${image.name}-${index}`}
                            src={image.imageUrl}
                            alt={
                              image.name
                                ? `${product.name}, ${image.name}`
                                : product.name
                            }
                            draggable="false"
                            className="producto-carrusel-imagen"
                            style={{ transform, opacity, zIndex }}
                          />
                        );
                      })}
                    </div>
                  )}

                  {product.is_new && (
                    <span className="producto-etiqueta producto-etiqueta-nuevo">
                      Nuevo
                    </span>
                  )}

                  {isOffer && (
                    <span className="producto-etiqueta producto-etiqueta-oferta">
                      Oferta
                    </span>
                  )}

                  {total > 1 && (
                    <>
                      <button
                        type="button"
                        className="producto-flecha producto-flecha-izquierda"
                        aria-label="Imagen anterior"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveCarousel(product.id, -1, total);
                        }}
                      >
                        ‹
                      </button>

                      <button
                        type="button"
                        className="producto-flecha producto-flecha-derecha"
                        aria-label="Imagen siguiente"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveCarousel(product.id, 1, total);
                        }}
                      >
                        ›
                      </button>

                      <div className="producto-puntos">
                        {images.map((image, index) => (
                          <button
                            key={`${image.name}-dot-${index}`}
                            type="button"
                            aria-label={`Mostrar imagen ${index + 1}`}
                            className={`producto-punto ${
                              activeIndex === index ? "activo" : ""
                            }`}
                            onPointerDown={(event) =>
                              event.stopPropagation()
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              selectCarouselImage(product.id, index);
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className="producto-informacion"
                  onClick={() => setSelectedProduct(product)}
                >
                  {product.subcategory && (
                    <span className="producto-subcategoria">
                      {product.subcategory}
                    </span>
                  )}

                  <h3 className="producto-nombre">{product.name}</h3>

                  <div className="producto-precios">
                    <span className="producto-precio">
                      S/ {Number(product.price).toFixed(2)}
                    </span>

                    {isOffer && (
                      <span className="producto-precio-anterior">
                        S/ {Number(product.old_price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <span className="producto-ver-detalle">
                    Ver producto ↗
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}

export default FeaturedProducts;
