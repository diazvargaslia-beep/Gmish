import { useEffect, useMemo, useState } from "react"
import { useCart } from "../CartContext"

function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useCart()

  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setSelectedSize("")
    setSelectedColor("")
    setQuantity(1)
    setActiveImage(0)
    setAdded(false)
  }, [product])

  useEffect(() => {
    if (!product) return

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      )

      document.body.style.overflow = ""
    }
  }, [product, onClose])

  if (!product) return null

  const variants = product.product_variants || []
  const images = product.product_images || []

  const sizes = [
    ...new Set(
      variants
        .filter(
          (variant) => Number(variant.stock) > 0
        )
        .map((variant) => variant.size)
    ),
  ]

  const colors = [
    ...new Set(
      variants
        .filter(
          (variant) => Number(variant.stock) > 0
        )
        .map((variant) => variant.color)
    ),
  ]

  const productImages = [...images]
    .sort(
      (a, b) =>
        Number(a.position || 0) -
        Number(b.position || 0)
    )
    .map((image) => image.image_url)

  const selectedVariant = variants.find(
    (variant) =>
      variant.size === selectedSize &&
      variant.color === selectedColor &&
      Number(variant.stock) > 0
  )

  const availableStock = selectedVariant
    ? Number(selectedVariant.stock || 0)
    : 0

  const availableColorsForSize = useMemo(() => {
    if (!selectedSize) {
      return colors
    }

    return [
      ...new Set(
        variants
          .filter(
            (variant) =>
              variant.size === selectedSize &&
              Number(variant.stock) > 0
          )
          .map((variant) => variant.color)
      ),
    ]
  }, [variants, selectedSize, colors])

  const availableSizesForColor = useMemo(() => {
    if (!selectedColor) {
      return sizes
    }

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
    ]
  }, [variants, selectedColor, sizes])

  const increaseQuantity = () => {
    if (!selectedVariant) return

    setQuantity((current) =>
      Math.min(current + 1, availableStock)
    )
  }

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(1, current - 1)
    )
  }

  const handleSizeChange = (size) => {
    setSelectedSize(size)
    setQuantity(1)

    if (selectedColor) {
      const matchingVariant = variants.find(
        (variant) =>
          variant.size === size &&
          variant.color === selectedColor &&
          Number(variant.stock) > 0
      )

      if (!matchingVariant) {
        setSelectedColor("")
      }
    }
  }

  const handleColorChange = (color) => {
    setSelectedColor(color)
    setQuantity(1)

    if (selectedSize) {
      const matchingVariant = variants.find(
        (variant) =>
          variant.size === selectedSize &&
          variant.color === color &&
          Number(variant.stock) > 0
      )

      if (!matchingVariant) {
        setSelectedSize("")
      }
    }
  }

  const handleAddToCart = () => {
    if (!selectedVariant || availableStock <= 0) {
      return
    }

    addToCart({
      ...product,
      selectedSize,
      selectedColor,
      quantity,
      variantId: selectedVariant.id,
      availableStock,
    })

    setAdded(true)

    if (navigator.vibrate) {
      navigator.vibrate(80)
    }

    setTimeout(() => {
      setAdded(false)
    }, 1800)
  }

  const nextImage = () => {
    if (productImages.length === 0) return

    setActiveImage((current) =>
      current === productImages.length - 1
        ? 0
        : current + 1
    )
  }

  const previousImage = () => {
    if (productImages.length === 0) return

    setActiveImage((current) =>
      current === 0
        ? productImages.length - 1
        : current - 1
    )
  }

  const isOffer =
    product.old_price &&
    Number(product.old_price) >
      Number(product.price)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-[#302E28] bg-[#111210] sm:rounded-3xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#302E28] bg-[#111210]/90 text-xl text-gray-300 transition hover:border-[#F0D58A] hover:text-[#F0D58A]"
        >
          ×
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative bg-[#1B1D1A]">
            <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden">
              {productImages.length > 0 ? (
                <img
                  src={productImages[activeImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-500">
                  <span className="text-5xl">
                    ◌
                  </span>

                  <p className="mt-4 text-sm">
                    Aquí aparecerá la imagen
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Foto / galería / giro 360°
                  </p>
                </div>
              )}

              {productImages.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80"
                  >
                    ‹
                  </button>

                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-4">
                {productImages.map(
                  (image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() =>
                        setActiveImage(index)
                      }
                      className={`h-16 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                        activeImage === index
                          ? "border-[#F0D58A]"
                          : "border-[#302E28]"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}

            <div className="border-t border-[#302E28] p-4">
              <div className="rounded-2xl border border-[#302E28] bg-[#111210] p-4 text-center">
                <p className="text-sm font-semibold text-[#F0D58A]">
                  Vista 360°
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Aquí colocaremos el giro del modelo
                  cuando tengamos las imágenes o
                  video 360°.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {isOffer && (
              <span className="inline-block rounded-full bg-[#FF4D4D] px-3 py-1 text-xs font-bold text-white">
                OFERTA
              </span>
            )}

            {product.is_new && (
              <span className="ml-2 inline-block rounded-full border border-[#F0D58A] px-3 py-1 text-xs font-bold text-[#F0D58A]">
                NUEVO
              </span>
            )}

            <h2 className="mt-4 text-3xl font-bold">
              {product.name}
            </h2>

            <div className="mt-3 flex items-center gap-3">
              {isOffer && (
                <span className="text-base text-gray-500 line-through">
                  S/{" "}
                  {Number(
                    product.old_price
                  ).toFixed(2)}
                </span>
              )}

              <span className="text-2xl font-bold text-[#F0D58A]">
                S/{" "}
                {Number(product.price).toFixed(2)}
              </span>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold">
                Talla
              </p>

              <div className="flex flex-wrap gap-2">
                {sizes
                  .filter((size) =>
                    availableSizesForColor.includes(
                      size
                    )
                  )
                  .map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        handleSizeChange(size)
                      }
                      className={`rounded-full border px-5 py-2.5 text-sm transition ${
                        selectedSize === size
                          ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                          : "border-[#302E28] text-white hover:border-[#F0D58A]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
              </div>

              {!selectedSize && (
                <p className="mt-2 text-xs text-gray-500">
                  Selecciona una talla.
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold">
                Color
              </p>

              <div className="flex flex-wrap gap-2">
                {colors
                  .filter((color) =>
                    availableColorsForSize.includes(
                      color
                    )
                  )
                  .map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        handleColorChange(color)
                      }
                      className={`rounded-full border px-4 py-2.5 text-sm transition ${
                        selectedColor === color
                          ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                          : "border-[#302E28] text-white hover:border-[#F0D58A]"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
              </div>

              {!selectedColor && (
                <p className="mt-2 text-xs text-gray-500">
                  Selecciona un color.
                </p>
              )}
            </div>

            {selectedVariant && (
              <div className="mt-5 rounded-xl border border-[#302E28] bg-[#151714] p-3">
                {availableStock <= 3 ? (
                  <p className="text-sm text-gray-300">
                    <span className="font-bold text-[#F0D58A]">
                      Últimas unidades
                    </span>{" "}
                    · quedan {availableStock}
                  </p>
                ) : (
                  <p className="text-sm text-gray-300">
                    Stock disponible:{" "}
                    <span className="font-bold text-white">
                      {availableStock}
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold">
                Cantidad
              </p>

              <div className="flex w-full items-center justify-between rounded-full border border-[#302E28] bg-[#0D0F0C] px-2 py-1">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#302E28] text-lg text-[#F0D58A] transition hover:border-[#F0D58A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>

                <span className="font-semibold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={
                    !selectedVariant ||
                    quantity >= availableStock
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#302E28] text-lg text-[#F0D58A] transition hover:border-[#F0D58A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                !selectedVariant ||
                availableStock <= 0
              }
              className={`mt-6 w-full rounded-full px-5 py-3.5 text-sm font-bold transition ${
                added
                  ? "bg-[#78B87A] text-white"
                  : !selectedVariant ||
                      availableStock <= 0
                    ? "cursor-not-allowed bg-[#302E28] text-gray-500"
                    : "bg-[#F0D58A] text-black hover:bg-white"
              }`}
            >
              {added
                ? "✓ Agregado al carrito"
                : !selectedSize ||
                    !selectedColor
                  ? "Selecciona talla y color"
                  : availableStock <= 0
                    ? "Agotado"
                    : "Agregar al carrito"}
            </button>

            <div className="mt-8 border-t border-[#302E28] pt-6">
              <h3 className="text-lg font-semibold">
                Descripción
              </h3>

              <p className="mt-3 text-sm leading-7 text-gray-400">
                {product.description ||
                  "Descubre los detalles de esta prenda, sus acabados y su estilo."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal