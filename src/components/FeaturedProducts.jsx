import { useMemo, useState, useRef } from "react"
import ProductDetailModal from "./ProductDetailModal"

function FeaturedProducts({
  category,
  search,
  newOnly,
  products = [],
}) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [carouselIndexes, setCarouselIndexes] = useState({})
  const [dragging, setDragging] = useState(false)

  const dragStartX = useRef(0)
  const dragCurrentX = useRef(0)

  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        category === "todos" ||
        product.category === category ||
        (category === "ofertas" &&
          product.old_price &&
          Number(product.old_price) >
            Number(product.price))

      const matchesSearch =
        searchText === "" ||
        product.name
          .toLowerCase()
          .includes(searchText) ||
        product.subcategory
          .toLowerCase()
          .includes(searchText)

      const matchesNew =
        !newOnly || product.is_new === true

      return (
        matchesCategory &&
        matchesSearch &&
        matchesNew
      )
    })
  }, [
    products,
    category,
    search,
    newOnly,
  ])

  const getColorImages = (product) => {
    const variants =
      product.product_variants || []

    const uniqueColors = new Map()

    variants.forEach((variant) => {
      if (
        Number(variant.stock) > 0 &&
        variant.color_image_url &&
        !uniqueColors.has(variant.color)
      ) {
        uniqueColors.set(variant.color, {
          name: variant.color,
          imageUrl: variant.color_image_url,
          hex:
            variant.color_hex ||
            "#777777",
        })
      }
    })

    return [...uniqueColors.values()]
  }

  const moveCarousel = (
    productId,
    direction,
    total
  ) => {
    if (total <= 1) return

    setCarouselIndexes((current) => {
      const currentIndex =
        current[productId] || 0

      let nextIndex =
        currentIndex + direction

      if (nextIndex < 0) {
        nextIndex = total - 1
      }

      if (nextIndex >= total) {
        nextIndex = 0
      }

      return {
        ...current,
        [productId]: nextIndex,
      }
    })
  }

  const selectCarouselImage = (
    productId,
    index
  ) => {
    setCarouselIndexes((current) => ({
      ...current,
      [productId]: index,
    }))
  }

  const handlePointerDown = (event) => {
    setDragging(true)
    dragStartX.current = event.clientX
    dragCurrentX.current = event.clientX

    event.currentTarget.setPointerCapture(
      event.pointerId
    )
  }

  const handlePointerMove = (event) => {
    if (!dragging) return

    dragCurrentX.current = event.clientX
  }

  const handlePointerUp = (
    event,
    productId,
    total
  ) => {
    if (!dragging) return

    const difference =
      dragStartX.current -
      dragCurrentX.current

    if (Math.abs(difference) > 40) {
      moveCarousel(
        productId,
        difference > 0 ? 1 : -1,
        total
      )
    }

    setDragging(false)

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      )
    } catch {
      // El puntero ya fue liberado.
    }
  }

  const handlePointerCancel = () => {
    setDragging(false)
  }

  const getRelativePosition = (
    index,
    activeIndex,
    total
  ) => {
    let difference =
      index - activeIndex

    if (difference > total / 2) {
      difference -= total
    }

    if (difference < -total / 2) {
      difference += total
    }

    return difference
  }

  return (
    <section
      id="productos"
      className="mx-auto max-w-7xl px-4 py-12 md:py-16"
    >
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F0D58A]">
          {category === "ofertas"
            ? "Ofertas"
            : newOnly
              ? "Últimas novedades"
              : "Productos"}
        </p>

        <h2 className="mt-2 text-3xl font-black md:text-4xl">
          {category === "ofertas"
            ? "Ofertas GMISH"
            : newOnly
              ? "Lo último"
              : "Nuestros productos"}
        </h2>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#302E28] bg-[#151714] px-6 py-12 text-center">
          <p className="text-lg font-semibold">
            No encontramos productos.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Prueba con otra búsqueda.
          </p>
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {filteredProducts.map((product) => {
            const isOffer =
              product.old_price &&
              Number(product.old_price) >
                Number(product.price)

            const colorImages =
              getColorImages(product)

            const productImages =
              product.product_images || []

            const firstProductImage =
              [...productImages]
                .sort(
                  (a, b) =>
                    Number(a.position || 0) -
                    Number(b.position || 0)
                )
                .find(
                  (image) =>
                    image.image_url
                )

            const images =
              colorImages.length > 0
                ? colorImages
                : firstProductImage
                  ? [
                      {
                        name: "",
                        imageUrl:
                          firstProductImage.image_url,
                        hex: "#777777",
                      },
                    ]
                  : []

            const total = images.length

            const activeIndex =
              carouselIndexes[product.id] || 0

            return (
              <article
                key={product.id}
                className="w-[260px] min-w-[260px] snap-start overflow-hidden rounded-2xl border border-[#302E28] bg-[#151714] md:w-[280px] md:min-w-[280px]"
              >
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden bg-[#111210]"
                  style={{
                    perspective: "1000px",
                    touchAction: "pan-y",
                    cursor:
                      total > 1
                        ? dragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                  }}
                  onPointerDown={
                    total > 1
                      ? handlePointerDown
                      : undefined
                  }
                  onPointerMove={
                    total > 1
                      ? handlePointerMove
                      : undefined
                  }
                  onPointerUp={
                    total > 1
                      ? (event) =>
                          handlePointerUp(
                            event,
                            product.id,
                            total
                          )
                      : undefined
                  }
                  onPointerCancel={
                    total > 1
                      ? handlePointerCancel
                      : undefined
                  }
                >
                  {total === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-sm text-gray-600">
                        Sin imagen
                      </span>
                    </div>
                  ) : total === 1 ? (
                    <img
                      src={images[0].imageUrl}
                      alt={product.name}
                      draggable="false"
                      className="h-full w-full select-none object-cover"
                    />
                  ) : (
                    <div className="relative h-full w-full">
                      {images.map(
                        (image, index) => {
                          const position =
                            getRelativePosition(
                              index,
                              activeIndex,
                              total
                            )

                          const isCenter =
                            position === 0

                          const isLeft =
                            position === -1

                          const isRight =
                            position === 1

                          const isLeftBack =
                            position === -2

                          const isRightBack =
                            position === 2

                          let transform =
                            "translateX(0) translateZ(-200px) scale(0.45)"

                          let opacity = 0
                          let zIndex = 1

                          if (isCenter) {
                            transform =
                              "translateX(0) translateZ(80px) scale(1)"
                            opacity = 1
                            zIndex = 30
                          }

                          if (isLeft) {
                            transform =
                              "translateX(-32%) translateZ(-30px) scale(0.78) rotateY(8deg)"
                            opacity = 0.55
                            zIndex = 20
                          }

                          if (isRight) {
                            transform =
                              "translateX(32%) translateZ(-30px) scale(0.78) rotateY(-8deg)"
                            opacity = 0.55
                            zIndex = 20
                          }

                          if (isLeftBack) {
                            transform =
                              "translateX(-55%) translateZ(-120px) scale(0.58) rotateY(12deg)"
                            opacity = 0.2
                            zIndex = 10
                          }

                          if (isRightBack) {
                            transform =
                              "translateX(55%) translateZ(-120px) scale(0.58) rotateY(-12deg)"
                            opacity = 0.2
                            zIndex = 10
                          }

                          return (
                            <img
                              key={`${image.name}-${index}`}
                              src={
                                image.imageUrl
                              }
                              alt={`${product.name} ${image.name}`}
                              draggable="false"
                              onClick={() => {
                                if (
                                  isLeft ||
                                  isRight
                                ) {
                                  selectCarouselImage(
                                    product.id,
                                    index
                                  )
                                }
                              }}
                              className="absolute inset-0 h-full w-full select-none object-cover transition-all duration-500 ease-out"
                              style={{
                                transform,
                                opacity,
                                zIndex,
                                pointerEvents:
                                  opacity > 0
                                    ? "auto"
                                    : "none",
                              }}
                            />
                          )
                        }
                      )}
                    </div>
                  )}

                  {product.is_new && (
                    <span className="absolute left-3 top-3 z-[60] rounded-full bg-[#F0D58A] px-3 py-1 text-xs font-black text-black">
                      Nuevo
                    </span>
                  )}

                  {isOffer && (
                    <span className="absolute right-3 top-3 z-[60] rounded-full bg-[#FF4D4D] px-3 py-1 text-xs font-black text-white">
                      Oferta
                    </span>
                  )}

                  {total > 1 && (
                    <>
                      <button
                        type="button"
                        onPointerDown={(event) =>
                          event.stopPropagation()
                        }
                        onClick={(event) => {
                          event.stopPropagation()

                          moveCarousel(
                            product.id,
                            -1,
                            total
                          )
                        }}
                        className="absolute left-2 top-1/2 z-[100] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-2xl text-white shadow-lg transition hover:bg-black"
                        aria-label="Imagen anterior"
                      >
                        ‹
                      </button>

                      <button
                        type="button"
                        onPointerDown={(event) =>
                          event.stopPropagation()
                        }
                        onClick={(event) => {
                          event.stopPropagation()

                          moveCarousel(
                            product.id,
                            1,
                            total
                          )
                        }}
                        className="absolute right-2 top-1/2 z-[100] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-2xl text-white shadow-lg transition hover:bg-black"
                        aria-label="Siguiente imagen"
                      >
                        ›
                      </button>

                      <div className="absolute bottom-3 left-1/2 z-[100] flex -translate-x-1/2 gap-1.5">
                        {images.map(
                          (
                            image,
                            index
                          ) => (
                            <button
                              key={`${image.name}-dot-${index}`}
                              type="button"
                              onPointerDown={(event) =>
                                event.stopPropagation()
                              }
                              onClick={(event) => {
                                event.stopPropagation()

                                selectCarouselImage(
                                  product.id,
                                  index
                                )
                              }}
                              className={`h-2 rounded-full transition-all ${
                                activeIndex ===
                                index
                                  ? "w-5 bg-[#F0D58A]"
                                  : "w-2 bg-white/50"
                              }`}
                              aria-label={`Mostrar imagen ${index + 1}`}
                            />
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div
                  onClick={() =>
                    setSelectedProduct(product)
                  }
                  className="cursor-pointer p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {product.subcategory}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {product.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-lg font-black text-[#F0D58A]">
                      S/{" "}
                      {Number(
                        product.price
                      ).toFixed(2)}
                    </span>

                    {isOffer && (
                      <span className="text-sm text-gray-500 line-through">
                        S/{" "}
                        {Number(
                          product.old_price
                        ).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct(product)
                    }
                    className="w-full rounded-xl bg-[#F0D58A] px-4 py-3 text-sm font-black text-black transition hover:brightness-110"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() =>
            setSelectedProduct(null)
          }
        />
      )}
    </section>
  )
}

export default FeaturedProducts