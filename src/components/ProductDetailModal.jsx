import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useCart } from "../CartContext"

function ProductDetailModal({
  product,
  onClose,
}) {
  const {
    addToCart,
    getCartQuantity,
  } = useCart()

  const [selectedColor, setSelectedColor] =
    useState("")
  const [selectedSize, setSelectedSize] =
    useState("")
  const [quantity, setQuantity] =
    useState(1)
  const [currentImage, setCurrentImage] =
    useState(0)

  const touchStartX = useRef(null)

  useEffect(() => {
    if (!product) return

    const firstVariant =
      product.variants?.find(
        (variant) =>
          Number(
            variant.stock ?? 0
          ) > 0
      ) ||
      product.variants?.[0]

    setSelectedColor(
      firstVariant?.color || ""
    )

    setSelectedSize("")
    setQuantity(1)
    setCurrentImage(0)
  }, [product])

  useEffect(() => {
    if (!product) return

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    )

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      )
    }
  }, [product, onClose])

  const variants = product?.variants || []

  const colors = useMemo(() => {
    return [
      ...new Map(
        variants
          .filter((variant) => variant.color)
          .map((variant) => [
            variant.color,
            variant,
          ])
      ).values(),
    ]
  }, [variants])

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) {
      return null
    }

    return (
      variants.find(
        (variant) =>
          variant.color === selectedColor &&
          variant.size === selectedSize &&
          Number(
            variant.stock ?? 0
          ) > 0
      ) || null
    )
  }, [
    variants,
    selectedColor,
    selectedSize,
  ])

  const selectedColorVariant =
    variants.find(
      (variant) =>
        variant.color === selectedColor
    ) || null

  const sizesForColor = useMemo(() => {
    return [
      ...new Set(
        variants
          .filter(
            (variant) =>
              variant.color ===
              selectedColor
          )
          .map((variant) => variant.size)
          .filter(Boolean)
      ),
    ]
  }, [variants, selectedColor])

  const displayedImages = useMemo(() => {
    if (!selectedColorVariant) {
      return product?.imageUrl
        ? [product.imageUrl]
        : []
    }

    if (
      selectedColorVariant.images &&
      selectedColorVariant.images.length > 0
    ) {
      return selectedColorVariant.images
    }

    if (selectedColorVariant.imageUrl) {
      return [selectedColorVariant.imageUrl]
    }

    if (product?.imageUrl) {
      return [product.imageUrl]
    }

    return []
  }, [
    product,
    selectedColorVariant,
  ])

  useEffect(() => {
    setCurrentImage(0)
  }, [selectedColor])

  const cartQuantity =
    selectedVariant
      ? getCartQuantity(
          product.id,
          selectedVariant.id,
          selectedSize,
          selectedColor
        )
      : 0

  const stockAvailable = selectedVariant
    ? Number(
        selectedVariant.stock ?? 0
      )
    : 0

  const remainingStock = Math.max(
    stockAvailable - cartQuantity,
    0
  )

  const maxQuantity =
    remainingStock > 0
      ? remainingStock
      : 0

  useEffect(() => {
    if (
      maxQuantity > 0 &&
      quantity > maxQuantity
    ) {
      setQuantity(maxQuantity)
    }

    if (maxQuantity === 0) {
      setQuantity(1)
    }
  }, [maxQuantity, quantity])

  const nextImage = () => {
    if (displayedImages.length <= 1) {
      return
    }

    setCurrentImage(
      (current) =>
        (current + 1) %
        displayedImages.length
    )
  }

  const previousImage = () => {
    if (displayedImages.length <= 1) {
      return
    }

    setCurrentImage(
      (current) =>
        (current -
          1 +
          displayedImages.length) %
        displayedImages.length
    )
  }

  const handleTouchStart = (event) => {
    touchStartX.current =
      event.touches[0].clientX
  }

  const handleTouchEnd = (event) => {
    if (
      touchStartX.current === null
    ) {
      return
    }

    const endX =
      event.changedTouches[0].clientX

    const difference =
      touchStartX.current - endX

    if (Math.abs(difference) > 50) {
      if (difference > 0) {
        nextImage()
      } else {
        previousImage()
      }
    }

    touchStartX.current = null
  }

  const handleColorChange = (color) => {
    setSelectedColor(color)
    setSelectedSize("")
    setQuantity(1)
    setCurrentImage(0)
  }

  const handleAddToCart = () => {
    if (
      !selectedVariant ||
      remainingStock <= 0
    ) {
      return
    }

    addToCart({
      ...product,
      variantId: selectedVariant.id,
      selectedSize,
      selectedColor,
      quantity,
      availableStock: stockAvailable,
      imageUrl:
        displayedImages[0] ||
        product.imageUrl,
    })

    setQuantity(1)
  }

  if (!product) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-4 md:items-center md:px-6 md:py-8"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#302E28] bg-[#151714] text-white shadow-2xl md:max-h-[92vh] md:flex-row"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* BOTÓN CERRAR */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-lg text-white transition hover:bg-black hover:text-[#F0D58A]"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* GALERÍA */}
        <div className="w-full shrink-0 bg-[#0D0E0C] md:w-1/2">
          <div
            className="relative h-[50vh] min-h-[280px] max-h-[450px] w-full overflow-hidden bg-[#0D0E0C] md:h-[92vh] md:max-h-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {displayedImages.length > 0 ? (
              <img
                src={
                  displayedImages[
                    currentImage
                  ]
                }
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Sin imagen
              </div>
            )}

            {displayedImages.length >
              1 && (
              <>
                {/* ANTERIOR */}
                <button
                  type="button"
                  onClick={previousImage}
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm transition hover:bg-black/80"
                  aria-label="Imagen anterior"
                >
                  ‹
                </button>

                {/* SIGUIENTE */}
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm transition hover:bg-black/80"
                  aria-label="Imagen siguiente"
                >
                  ›
                </button>

                {/* PUNTOS */}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                  {displayedImages.map(
                    (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          setCurrentImage(
                            index
                          )
                        }
                        className={`h-2 w-2 rounded-full transition ${
                          index ===
                          currentImage
                            ? "scale-125 bg-white"
                            : "bg-white/40"
                        }`}
                        aria-label={`Imagen ${
                          index + 1
                        }`}
                      />
                    )
                  )}
                </div>
              </>
            )}
          </div>

          {/* MINIATURAS */}
          {displayedImages.length >
            1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {displayedImages.map(
                (image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() =>
                      setCurrentImage(
                        index
                      )
                    }
                    className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      index === currentImage
                        ? "border-[#F0D58A]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* INFORMACIÓN */}
        <div className="w-full min-w-0 flex-1 overflow-visible p-5 md:w-1/2 md:overflow-y-auto md:p-8">
          {/* CATEGORÍA */}
          {product.category && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              {product.category}
            </p>
          )}

          {/* NOMBRE */}
          <h2 className="mt-2 pr-10 text-2xl font-bold text-white md:text-3xl">
            {product.name}
          </h2>

          {/* PRECIO */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-[#F0D58A]">
              S/
              {Number(product.price).toFixed(
                2
              )}
            </span>

            {product.oldPrice &&
              Number(product.oldPrice) >
                Number(product.price) && (
                <span className="text-sm text-gray-500 line-through">
                  S/
                  {Number(
                    product.oldPrice
                  ).toFixed(2)}
                </span>
              )}
          </div>

          {/* DESCRIPCIÓN */}
          {product.description && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white">
                Descripción
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                {product.description}
              </p>
            </div>
          )}

          {/* COLORES */}
          {colors.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Color
                </h3>

                {selectedColor && (
                  <span className="text-xs text-gray-400">
                    {selectedColor}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((variant) => {
                  const isSelected =
                    variant.color ===
                    selectedColor

                  return (
                    <button
                      key={variant.color}
                      type="button"
                      onClick={() =>
                        handleColorChange(
                          variant.color
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        isSelected
                          ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                          : "border-[#3A3933] bg-[#1D1F1B] text-gray-300 hover:border-[#F0D58A] hover:text-white"
                      }`}
                    >
                      {variant.color}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* TALLAS */}
          {sizesForColor.length >
            0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white">
                Talla
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {sizesForColor.map(
                  (size) => {
                    const variant =
                      variants.find(
                        (item) =>
                          item.color ===
                            selectedColor &&
                          item.size ===
                            size
                      )

                    const sizeStock =
                      Number(
                        variant?.stock ??
                          0
                      )

                    const isAvailable =
                      sizeStock > 0

                    const isSelected =
                      selectedSize ===
                      size

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={
                          !isAvailable
                        }
                        onClick={() => {
                          setSelectedSize(
                            size
                          )
                          setQuantity(1)
                        }}
                        className={`min-w-14 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                          !isAvailable
                            ? "cursor-not-allowed border-[#292A27] bg-[#191A18] text-gray-600 line-through"
                            : isSelected
                            ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                            : "border-[#3A3933] bg-[#1D1F1B] text-gray-300 hover:border-[#F0D58A] hover:text-white"
                        }`}
                      >
                        {size}
                      </button>
                    )
                  }
                )}
              </div>
            </div>
          )}

          {/* STOCK */}
          {selectedVariant && (
            <div className="mt-4">
              {remainingStock > 0 ? (
                <p className="text-xs text-gray-400">
                  {remainingStock === 1
                    ? "Última unidad disponible"
                    : `${remainingStock} unidades disponibles`}
                </p>
              ) : (
                <p className="text-xs text-red-400">
                  Ya tienes el máximo disponible
                  en tu carrito.
                </p>
              )}
            </div>
          )}

          {/* CANTIDAD */}
          {selectedVariant &&
            remainingStock > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white">
                  Cantidad
                </h3>

                <div className="mt-3 flex w-fit items-center overflow-hidden rounded-lg border border-[#3A3933]">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (current) =>
                          Math.max(
                            current - 1,
                            1
                          )
                      )
                    }
                    disabled={
                      quantity <= 1
                    }
                    className="flex h-10 w-10 items-center justify-center text-lg text-white transition hover:bg-[#252720] disabled:cursor-not-allowed disabled:text-gray-600"
                  >
                    −
                  </button>

                  <span className="flex h-10 w-12 items-center justify-center border-x border-[#3A3933] text-sm font-semibold">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (current) =>
                          Math.min(
                            current + 1,
                            maxQuantity
                          )
                      )
                    }
                    disabled={
                      quantity >=
                      maxQuantity
                    }
                    className="flex h-10 w-10 items-center justify-center text-lg text-white transition hover:bg-[#252720] disabled:cursor-not-allowed disabled:text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

          {/* BOTÓN */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={
              !selectedVariant ||
              remainingStock <= 0
            }
            className="mt-7 w-full rounded-xl bg-[#F0D58A] px-5 py-3.5 text-sm font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#363731] disabled:text-gray-500"
          >
            {!selectedColor
              ? "Selecciona un color"
              : !selectedSize
              ? "Selecciona una talla"
              : remainingStock <= 0
              ? "Sin stock disponible"
              : "Agregar al carrito"}
          </button>

          {/* INFORMACIÓN EXTRA */}
          <div className="mt-6 border-t border-[#302E28] pt-5">
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="text-gray-500">
                Envíos
              </span>

              <span className="text-gray-300">
                Consulta por WhatsApp
              </span>
            </div>

            <div className="flex items-center justify-between py-2 text-xs">
              <span className="text-gray-500">
                Compra segura
              </span>

              <span className="text-gray-300">
                Atención personalizada
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal