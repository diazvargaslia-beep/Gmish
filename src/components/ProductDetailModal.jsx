
import { useEffect, useMemo, useState, useRef } from "react";
import { useCart } from "../CartContext";

function ProductDetailModal({ product, onClose }) {
  const { addToCart, getCartQuantity } = useCart();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [imageChanging, setImageChanging] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectionPulse, setSelectionPulse] = useState(false);

  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  const closingRef = useRef(false);
  const historyEntryAdded = useRef(false);
  const closeTimeout = useRef(null);
  const closeHandlerRef = useRef(() => {});

  // Reiniciar las opciones al cambiar de producto.
  useEffect(() => {
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);
    setActiveImage(0);
    setAdded(false);
    setSelectionPulse(false);
    setModalVisible(false);
    closingRef.current = false;

    const frame = requestAnimationFrame(() => {
      setModalVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [product]);

  // Registrar el detalle en el historial sin perder
  // la página ni la posición del catálogo.
  useEffect(() => {
    if (!historyEntryAdded.current) {
      const currentState = window.history.state;

      window.history.replaceState(
        {
          ...(currentState && typeof currentState === "object"
            ? currentState
            : {}),
          gmishScrollY: window.scrollY,
        },
        "",
        window.location.href
      );

      window.history.pushState(
        {
          ...(window.history.state &&
          typeof window.history.state === "object"
            ? window.history.state
            : {}),
          gmishProductModal: true,
          gmishProductId: product.id,
        },
        "",
        window.location.href
      );

      historyEntryAdded.current = true;
    }

    function closeModal() {
      if (closingRef.current) return;

      closingRef.current = true;
      setModalVisible(false);

      closeTimeout.current = window.setTimeout(() => {
        onClose();
      }, 220);
    }

    function handlePopState() {
      // Atrás cierra el detalle. App.jsx se encarga
      // de recuperar la página y el scroll anteriores.
      closeModal();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeHandlerRef.current();
      }
    }

    function handleClose() {
      if (closingRef.current) return;

      if (window.history.state?.gmishProductModal) {
        // La X utiliza el historial para cerrar el detalle.
        window.history.back();
      } else {
        closeModal();
      }
    }

    closeHandlerRef.current = handleClose;

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";

      if (closeTimeout.current) {
        window.clearTimeout(closeTimeout.current);
      }
    };
  }, [product.id, onClose]);

  function handleClose() {
    closeHandlerRef.current();
  }

  const variants = product.product_variants || [];

  const productImages = useMemo(
    () =>
      [...(product.product_images || [])]
        .sort(
          (a, b) =>
            Number(a.position || 0) - Number(b.position || 0)
        )
        .map((image) => image.image_url)
        .filter(Boolean),
    [product]
  );

  const sizes = useMemo(() => {
    const result = [];

    variants.forEach((variant) => {
      if (
        Number(variant.stock) > 0 &&
        !result.includes(variant.size)
      ) {
        result.push(variant.size);
      }
    });

    return result;
  }, [variants]);

  const colors = useMemo(() => {
    const uniqueColors = new Map();

    variants.forEach((variant) => {
      if (
        Number(variant.stock) > 0 &&
        !uniqueColors.has(variant.color)
      ) {
        const variantImages = [
          ...(variant.product_variant_images || []),
        ]
          .sort(
            (a, b) =>
              Number(a.position || 0) - Number(b.position || 0)
          )
          .map((image) => image.image_url)
          .filter(Boolean);

        uniqueColors.set(variant.color, {
          name: variant.color,
          hex: variant.color_hex || "#777777",
          images: variantImages,
          oldImage: variant.color_image_url || "",
        });
      }
    });

    return [...uniqueColors.values()];
  }, [variants]);

  const selectedColorData =
    colors.find((color) => color.name === selectedColor) || null;

  const generalColorImages = useMemo(() => {
    const images = [];

    colors.forEach((color) => {
      const firstImage = color.images?.[0] || color.oldImage || "";

      if (firstImage && !images.includes(firstImage)) {
        images.push(firstImage);
      }
    });

    return images;
  }, [colors]);

  const displayedImages = useMemo(() => {
    if (!selectedColorData) {
      return generalColorImages.length > 0
        ? generalColorImages
        : productImages;
    }

    if (selectedColorData.images.length > 0) {
      return selectedColorData.images;
    }

    if (selectedColorData.oldImage) {
      return [selectedColorData.oldImage];
    }

    return productImages;
  }, [selectedColorData, generalColorImages, productImages]);

  useEffect(() => {
    if (activeImage >= displayedImages.length) {
      setActiveImage(0);
    }
  }, [displayedImages, activeImage]);

  const displayedImage =
    displayedImages[activeImage] || displayedImages[0] || "";

  const selectedVariant = useMemo(() => {
    if (!selectedSize || !selectedColor) return null;

    return variants.find(
      (variant) =>
        variant.size === selectedSize &&
        variant.color === selectedColor &&
        Number(variant.stock) > 0
    );
  }, [variants, selectedSize, selectedColor]);

  const cartQuantity = selectedVariant
    ? getCartQuantity(
        product.id,
        selectedVariant.id,
        selectedSize,
        selectedColor
      )
    : 0;

  const stockAvailable = selectedVariant
    ? Number(selectedVariant.stock)
    : 0;

  const remainingStock = Math.max(
    stockAvailable - cartQuantity,
    0
  );

  const canAddToCart =
    !!selectedVariant &&
    remainingStock > 0 &&
    quantity <= remainingStock;

  const availableColorsForSize = useMemo(() => {
    if (!selectedSize) return colors;

    const availableNames = new Set(
      variants
        .filter(
          (variant) =>
            variant.size === selectedSize &&
            Number(variant.stock) > 0
        )
        .map((variant) => variant.color)
    );

    return colors.filter((color) =>
      availableNames.has(color.name)
    );
  }, [variants, colors, selectedSize]);

  const availableSizesForColor = useMemo(() => {
    if (!selectedColor) return sizes;

    return [
      ...new Set(
        variants
          .filter(
            (variant) =>
              variant.color === selectedColor &&
              Number(variant.stock) > 0
          )
          .map((variant) => variant.size)
      ),
    ];
  }, [variants, sizes, selectedColor]);

  function triggerSelectionPulse() {
    setSelectionPulse(false);

    requestAnimationFrame(() => {
      setSelectionPulse(true);
      setTimeout(() => setSelectionPulse(false), 350);
    });
  }

  function changeImage(index) {
    if (
      displayedImages.length <= 1 ||
      index === activeImage
    ) {
      return;
    }

    setImageChanging(true);

    setTimeout(() => {
      setActiveImage(index);
      setTimeout(() => setImageChanging(false), 180);
    }, 120);
  }

  function nextImage() {
    if (displayedImages.length <= 1) return;
    changeImage((activeImage + 1) % displayedImages.length);
  }

  function previousImage() {
    if (displayedImages.length <= 1) return;

    changeImage(
      activeImage === 0
        ? displayedImages.length - 1
        : activeImage - 1
    );
  }

  function handleColorChange(colorName) {
    if (colorName === selectedColor) return;

    setSelectedColor(colorName);
    setActiveImage(0);
    setImageChanging(true);
    setTimeout(() => setImageChanging(false), 300);
    triggerSelectionPulse();

    const availableSizes = variants
      .filter(
        (variant) =>
          variant.color === colorName &&
          Number(variant.stock) > 0
      )
      .map((variant) => variant.size);

    if (
      selectedSize &&
      !availableSizes.includes(selectedSize)
    ) {
      setSelectedSize("");
    }

    setQuantity(1);
  }

  function handleSizeChange(size) {
    if (size === selectedSize) return;

    setSelectedSize(size);
    setQuantity(1);
    triggerSelectionPulse();

    if (
      selectedColor &&
      !variants.some(
        (variant) =>
          variant.size === size &&
          variant.color === selectedColor &&
          Number(variant.stock) > 0
      )
    ) {
      setSelectedColor("");
      setActiveImage(0);
    }
  }

  function handleTouchStart(event) {
    if (displayedImages.length <= 1) return;

    touchStartX.current = event.touches[0].clientX;
    touchCurrentX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
    touchCurrentY.current = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (displayedImages.length <= 1) return;

    touchCurrentX.current = event.touches[0].clientX;
    touchCurrentY.current = event.touches[0].clientY;
  }

  function handleTouchEnd() {
    if (displayedImages.length <= 1) return;

    const differenceX =
      touchStartX.current - touchCurrentX.current;
    const differenceY =
      touchStartY.current - touchCurrentY.current;

    if (
      Math.abs(differenceX) < 45 ||
      Math.abs(differenceX) < Math.abs(differenceY)
    ) {
      return;
    }

    differenceX > 0 ? nextImage() : previousImage();
  }

  function increaseQuantity() {
    if (!selectedVariant) return;

    setQuantity((current) =>
      Math.min(current + 1, remainingStock)
    );
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(current - 1, 1));
  }

  function handleAddToCart() {
    if (!canAddToCart) return;

    addToCart({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: displayedImage,
      selectedSize,
      selectedColor,
      selectedColorHex: selectedColorData?.hex || "#777777",
      quantity,
      variantId: selectedVariant.id,
      availableStock: Number(selectedVariant.stock),
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const isOffer =
    product.old_price &&
    Number(product.old_price) > Number(product.price);

  const discount = isOffer
    ? Math.round(
        (1 -
          Number(product.price) / Number(product.old_price)) *
          100
      )
    : 0;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-2 transition-all duration-300 sm:p-5 md:p-6 ${
        modalVisible ? "bg-black/50" : "bg-black/0"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        className={`relative flex max-h-[96dvh] w-full max-w-[1250px] flex-col overflow-y-auto rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-2xl transition-all duration-300 md:max-h-[92vh] md:flex-row md:items-stretch md:gap-8 lg:gap-12 ${
          modalVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-[0.97] opacity-0"
        }`}
      >
        {/* Botón X para cerrar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-[250] flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-xl text-stone-700 shadow-sm transition hover:rotate-90 hover:bg-stone-100"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Imágenes del producto */}
        <div className="w-full shrink-0 overflow-visible bg-stone-50 md:w-[44%] lg:w-[46%]">
          <div
            className="relative h-[38vh] min-h-[230px] max-h-[420px] w-full overflow-hidden bg-stone-100 sm:h-[46vh] md:h-[72vh] md:max-h-none md:min-h-[500px]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {displayedImage ? (
              <img
                key={displayedImage}
                src={displayedImage}
                alt={product.name}
                draggable="false"
                className={`h-full w-full select-none object-cover transition-all duration-500 ${
                  imageChanging
                    ? "translate-x-3 scale-[1.01] opacity-0"
                    : "translate-x-0 scale-100 opacity-100"
                }`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-stone-400">
                Sin imagen
              </div>
            )}

            {product.is_new && (
              <span className="absolute left-5 top-16 rounded-full bg-stone-900 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow sm:top-5">
                Nuevo
              </span>
            )}

            {isOffer && (
              <span className="absolute right-16 top-5 rounded-full bg-red-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow">
                -{discount}%
              </span>
            )}

            {displayedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Imagen anterior"
                  className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-3xl text-stone-800 shadow transition hover:bg-white"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Siguiente imagen"
                  className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-3xl text-stone-800 shadow transition hover:bg-white"
                >
                  ›
                </button>

                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/90 px-3 py-2 shadow">
                  {displayedImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => changeImage(index)}
                      aria-label={`Mostrar imagen ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImage === index
                          ? "w-7 bg-stone-900"
                          : "w-1.5 bg-stone-300"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {displayedImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto border-t border-stone-200 bg-white p-3.5 md:p-4">
              {displayedImages.map((image, index) => (
                <button
                  key={`${image}-${index}-thumb`}
                  type="button"
                  onClick={() => changeImage(index)}
                  aria-label={`Ver miniatura ${index + 1}`}
                  className={`h-[76px] w-[58px] min-w-[58px] overflow-hidden rounded-lg border transition ${
                    activeImage === index
                      ? "border-stone-900 opacity-100"
                      : "border-stone-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    draggable="false"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="detalle-producto-info min-w-0 flex-1 overflow-visible px-6 pb-8 pt-16 sm:px-10 sm:pt-16 md:my-0 md:mr-0 md:ml-0 md:overflow-y-auto md:px-10 md:py-12 lg:px-14 lg:py-14">
          <div className="detalle-producto-cabecera">
            {product.subcategory && (
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500">
                {product.subcategory}
              </p>
            )}

            <h2 className="text-2xl font-bold leading-tight tracking-tight text-stone-900 sm:text-3xl lg:text-4xl">
              {product.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold tracking-tight text-stone-900">
                S/ {Number(product.price).toFixed(2)}
              </span>

              {isOffer && (
                <span className="text-sm text-stone-400 line-through">
                  S/ {Number(product.old_price).toFixed(2)}
                </span>
              )}
            </div>

            <p className="max-w-xl whitespace-pre-line text-sm leading-7 text-stone-500">
              {product.description || "Sin descripción disponible."}
            </p>
          </div>

          <div className="h-px bg-stone-200" />

          {/* Colores */}
          {colors.length > 0 && (
            <section>
              <p className="text-sm font-semibold text-stone-800">
                Elige tu color
              </p>

              <div className="mt-4 flex flex-wrap gap-4">
                {availableColorsForSize.map((color) => {
                  const isSelected = selectedColor === color.name;

                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleColorChange(color.name)}
                      title={color.name}
                      aria-label={`Color ${color.name}`}
                      aria-pressed={isSelected}
                      className={`relative flex h-12 w-12 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? "scale-105 border-stone-900"
                          : "border-stone-300 hover:border-stone-700"
                      }`}
                    >
                      <span
                        className="h-8 w-8 rounded-full border border-black/10"
                        style={{ backgroundColor: color.hex }}
                      />

                      {isSelected && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tallas */}
          {sizes.length > 0 && (
            <section className="border-t border-stone-100 pt-6">
              <p className="text-sm font-semibold text-stone-800">
                Elige tu talla
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {availableSizesForColor.map((size) => {
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeChange(size)}
                      aria-pressed={isSelected}
                      className={`min-w-[64px] rounded-lg border px-5 py-3.5 text-sm font-bold transition ${
                        isSelected
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-500"
                      }`}
                    >
                      {size}
                      {isSelected && <span className="ml-1">✓</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Disponibilidad */}
          {selectedVariant && (
            <div
              className={`flex flex-wrap items-center justify-start gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 transition ${
                selectionPulse ? "scale-[1.01]" : ""
              }`}
            >
              <span className="text-sm text-stone-600">
                Disponibilidad:
              </span>

              <span className="text-sm font-semibold text-stone-900">
                {remainingStock}{" "}
                {remainingStock === 1 ? "unidad" : "unidades"}
              </span>
            </div>
          )}

          {/* Cantidad */}
          <section className="border-t border-stone-100 pt-6">
            <p className="text-sm font-semibold text-stone-800">
              Cantidad
            </p>

            <div className="mt-4 flex w-fit items-center overflow-hidden rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                aria-label="Reducir cantidad"
                className="flex h-12 w-12 items-center justify-center text-lg text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>

              <span className="flex h-12 min-w-[50px] items-center justify-center border-x border-stone-200 text-sm font-semibold text-stone-900">
                {quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={!selectedVariant || quantity >= remainingStock}
                aria-label="Aumentar cantidad"
                className="flex h-12 w-12 items-center justify-center text-lg text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>
          </section>

          {/* Agregar al carrito */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`w-full rounded-xl px-5 py-4 text-sm font-bold tracking-wide transition ${
              added
                ? "bg-stone-700 text-white"
                : canAddToCart
                  ? "bg-stone-900 text-white hover:bg-stone-700 active:scale-[0.99]"
                  : "cursor-not-allowed bg-stone-100 text-stone-400"
            }`}
          >
            {added
              ? "✓ Agregado al carrito"
              : !selectedSize || !selectedColor
                ? "Elige talla y color"
                : remainingStock <= 0
                  ? "Stock agotado"
                  : "Agregar al carrito"}
          </button>

          <p className="pb-2 text-center text-xs leading-6 text-stone-400">
            Selecciona tu talla y color antes de añadir al carrito.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;