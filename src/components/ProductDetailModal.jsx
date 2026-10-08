import { 
  useEffect, 
  useMemo, 
  useState, 
  useRef, 
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
 
  const [selectedSize, setSelectedSize] = 
    useState("") 
  const [selectedColor, setSelectedColor] = 
    useState("") 
  const [quantity, setQuantity] = useState(1) 
  const [activeImage, setActiveImage] = 
    useState(0) 
  const [added, setAdded] = useState(false) 
  const [imageChanging, setImageChanging] = 
    useState(false) 
  const [modalVisible, setModalVisible] = 
    useState(false) 
  const [selectionPulse, setSelectionPulse] = 
    useState(false) 
 
  const touchStartX = useRef(0) 
  const touchCurrentX = useRef(0) 
 
  useEffect(() => { 
    setSelectedSize("") 
    setSelectedColor("") 
    setQuantity(1) 
    setActiveImage(0) 
    setAdded(false) 
    setSelectionPulse(false) 
 
    requestAnimationFrame(() => { 
      setModalVisible(true) 
    }) 
  }, [product]) 
 
  useEffect(() => { 
    const handleEscape = (event) => { 
      if (event.key === "Escape") { 
        handleClose() 
      } 
    } 
 
    document.addEventListener( 
      "keydown", 
      handleEscape 
    ) 
 
    document.body.style.overflow = "hidden" 
 
    return () => { 
      document.removeEventListener( 
        "keydown", 
        handleEscape 
      ) 
 
      document.body.style.overflow = "" 
    } 
  }, []) 
 
  const handleClose = () => { 
    setModalVisible(false) 
 
    setTimeout(() => { 
      onClose() 
    }, 220) 
  } 
 
  const variants = 
    product.product_variants || [] 
 
  const productImages = 
    [...(product.product_images || [])] 
      .sort( 
        (a, b) => 
          Number(a.position || 0) - 
          Number(b.position || 0) 
      ) 
      .map((image) => image.image_url) 
      .filter(Boolean) 
 
  const sizes = useMemo(() => { 
    const uniqueSizes = [] 
 
    variants.forEach((variant) => { 
      if ( 
        Number(variant.stock) > 0 && 
        !uniqueSizes.includes(variant.size) 
      ) { 
        uniqueSizes.push(variant.size) 
      } 
    }) 
 
    return uniqueSizes 
  }, [variants]) 
 
  const colors = useMemo(() => { 
    const uniqueColors = new Map() 
 
    variants.forEach((variant) => { 
      if ( 
        Number(variant.stock) > 0 && 
        !uniqueColors.has(variant.color) 
      ) { 
        const variantImages = 
          [ 
            ...(variant.product_variant_images || 
              []), 
          ] 
            .sort( 
              (a, b) => 
                Number(a.position || 0) - 
                Number(b.position || 0) 
            ) 
            .map((image) => image.image_url) 
            .filter(Boolean) 
 
        uniqueColors.set( 
          variant.color, 
          { 
            name: variant.color, 
            hex: 
              variant.color_hex || 
              "#777777", 
            images: variantImages, 
            oldImage: 
              variant.color_image_url || 
              "", 
          } 
        ) 
      } 
    }) 
 
    return [...uniqueColors.values()] 
  }, [variants]) 
 
  const selectedColorData = 
    colors.find( 
      (color) => 
        color.name === selectedColor 
    ) || null 
 
  const generalColorImages = useMemo(() => { 
    const images = [] 
 
    colors.forEach((color) => { 
      const firstImage = 
        color.images?.[0] || 
        color.oldImage || 
        "" 
 
      if ( 
        firstImage && 
        !images.includes(firstImage) 
      ) { 
        images.push(firstImage) 
      } 
    }) 
 
    return images 
  }, [colors]) 
 
  const displayedImages = useMemo(() => { 
    if (!selectedColorData) { 
      if ( 
        generalColorImages.length > 0 
      ) { 
        return generalColorImages 
      } 
 
      return productImages 
    } 
 
    const colorImages = 
      selectedColorData.images || [] 
 
    if (colorImages.length > 0) { 
      return colorImages 
    } 
 
    if (selectedColorData.oldImage) { 
      return [ 
        selectedColorData.oldImage, 
      ] 
    } 
 
    return productImages 
  }, [ 
    selectedColorData, 
    generalColorImages, 
    productImages, 
  ]) 
 
  useEffect(() => { 
    if ( 
      activeImage >= displayedImages.length 
    ) { 
      setActiveImage(0) 
    } 
  }, [ 
    displayedImages, 
    activeImage, 
  ]) 
 
  const displayedImage = 
    displayedImages[activeImage] || 
    displayedImages[0] || 
    "" 
 
  const selectedVariant = useMemo(() => { 
    if ( 
      !selectedSize || 
      !selectedColor 
    ) { 
      return null 
    } 
 
    return variants.find( 
      (variant) => 
        variant.size === selectedSize && 
        variant.color === selectedColor && 
        Number(variant.stock) > 0 
    ) 
  }, [ 
    variants, 
    selectedSize, 
    selectedColor, 
  ]) 
 
  const cartQuantity = 
    selectedVariant 
      ? getCartQuantity( 
          product.id, 
          selectedVariant.id, 
          selectedSize, 
          selectedColor 
        ) 
      : 0 
 
  const stockAvailable = 
    selectedVariant 
      ? Number(selectedVariant.stock) 
      : 0 
 
  const remainingStock = Math.max( 
    stockAvailable - cartQuantity, 
    0 
  ) 
 
  const canAddToCart = 
    !!selectedVariant && 
    remainingStock > 0 && 
    quantity <= remainingStock 
 
  const availableColorsForSize = 
    useMemo(() => { 
      if (!selectedSize) { 
        return colors 
      } 
 
      const availableNames = 
        new Set( 
          variants 
            .filter( 
              (variant) => 
                variant.size === 
                  selectedSize && 
                Number(variant.stock) > 0 
            ) 
            .map( 
              (variant) => variant.color 
            ) 
        ) 
 
      return colors.filter((color) => 
        availableNames.has(color.name) 
      ) 
    }, [ 
      variants, 
      colors, 
      selectedSize, 
    ]) 
 
  const availableSizesForColor = 
    useMemo(() => { 
      if (!selectedColor) { 
        return sizes 
      } 
 
      return [ 
        ...new Set( 
          variants 
            .filter( 
              (variant) => 
                variant.color === 
                  selectedColor && 
                Number(variant.stock) > 0 
            ) 
            .map( 
              (variant) => variant.size 
            ) 
        ), 
      ] 
    }, [ 
      variants, 
      sizes, 
      selectedColor, 
    ]) 
 
  const triggerSelectionPulse = () => { 
    setSelectionPulse(false) 
 
    requestAnimationFrame(() => { 
      setSelectionPulse(true) 
 
      setTimeout(() => { 
        setSelectionPulse(false) 
      }, 350) 
    }) 
  } 
 
  const changeImage = (index) => { 
    if ( 
      displayedImages.length <= 1 || 
      index === activeImage 
    ) { 
      return 
    } 
 
    setImageChanging(true) 
 
    setTimeout(() => { 
      setActiveImage(index) 
 
      setTimeout(() => { 
        setImageChanging(false) 
      }, 180) 
    }, 120) 
  } 
 
  const nextImage = () => { 
    if (displayedImages.length <= 1) { 
      return 
    } 
 
    const next = 
      (activeImage + 1) % 
      displayedImages.length 
 
    changeImage(next) 
  } 
 
  const previousImage = () => { 
    if (displayedImages.length <= 1) { 
      return 
    } 
 
    const previous = 
      activeImage === 0 
        ? displayedImages.length - 1 
        : activeImage - 1 
 
    changeImage(previous) 
  } 
 
  const handleColorChange = ( 
    colorName 
  ) => { 
    if (colorName === selectedColor) { 
      return 
    } 
 
    setSelectedColor(colorName) 
    setActiveImage(0) 
    setImageChanging(true) 
 
    setTimeout(() => { 
      setImageChanging(false) 
    }, 300) 
 
    triggerSelectionPulse() 
 
    const availableSizes = 
      variants 
        .filter( 
          (variant) => 
            variant.color === 
              colorName && 
            Number(variant.stock) > 0 
        ) 
        .map( 
          (variant) => variant.size 
        ) 
 
    if ( 
      selectedSize && 
      !availableSizes.includes( 
        selectedSize 
      ) 
    ) { 
      setSelectedSize("") 
    } 
 
    setQuantity(1) 
  } 
 
  const handleSizeChange = ( 
    size 
  ) => { 
    if (size === selectedSize) { 
      return 
    } 
 
    setSelectedSize(size) 
    setQuantity(1) 
    triggerSelectionPulse() 
 
    if ( 
      selectedColor && 
      !variants.some( 
        (variant) => 
          variant.size === size && 
          variant.color === 
            selectedColor && 
          Number(variant.stock) > 0 
      ) 
    ) { 
      setSelectedColor("") 
      setActiveImage(0) 
    } 
  } 
 
  const handleTouchStart = ( 
    event 
  ) => { 
    if (displayedImages.length <= 1) { 
      return 
    } 
 
    touchStartX.current = 
      event.touches[0].clientX 
 
    touchCurrentX.current = 
      event.touches[0].clientX 
  } 
 
  const handleTouchMove = ( 
    event 
  ) => { 
    if (displayedImages.length <= 1) { 
      return 
    } 
 
    touchCurrentX.current = 
      event.touches[0].clientX 
  } 
 
  const handleTouchEnd = () => { 
    if (displayedImages.length <= 1) { 
      return 
    } 
 
    const difference = 
      touchStartX.current - 
      touchCurrentX.current 
 
    if (Math.abs(difference) < 45) { 
      return 
    } 
 
    if (difference > 0) { 
      nextImage() 
    } else { 
      previousImage() 
    } 
  } 
 
  const increaseQuantity = () => { 
    if (!selectedVariant) { 
      return 
    } 
 
    setQuantity((current) => 
      Math.min( 
        current + 1, 
        remainingStock 
      ) 
    ) 
  } 
 
  const decreaseQuantity = () => { 
    setQuantity((current) => 
      Math.max(current - 1, 1) 
    ) 
  } 
 
  const handleAddToCart = () => { 
    if (!canAddToCart) { 
      return 
    } 
 
    addToCart({ 
      productId: product.id, 
      name: product.name, 
      price: Number(product.price), 
      image: displayedImage, 
      selectedSize, 
      selectedColor, 
      selectedColorHex: 
        selectedColorData?.hex || 
        "#777777", 
      quantity, 
      variantId: selectedVariant.id, 
      availableStock: 
        Number(selectedVariant.stock), 
    }) 
 
    setAdded(true) 
 
    setTimeout(() => { 
      setAdded(false) 
    }, 1800) 
  } 
 
  const isOffer = 
    product.old_price && 
    Number(product.old_price) > 
      Number(product.price) 
 
  const discount = 
    isOffer 
      ? Math.round( 
          (1 - 
            Number(product.price) / 
              Number( 
                product.old_price 
              )) * 
            100 
        ) 
      : 0 
 
  return ( 
    <div 
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-3 transition-all duration-300 md:p-6 ${ 
        modalVisible 
          ? "bg-black/80 backdrop-blur-md" 
          : "bg-black/0" 
      }`} 
      onMouseDown={(event) => { 
        if ( 
          event.target === 
          event.currentTarget 
        ) { 
          handleClose() 
        } 
      }} 
    > 
      <div 
        className={`relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-y-auto rounded-[28px] border border-white/[0.08] bg-[#141512] shadow-[0_30px_100px_rgba(0,0,0,0.65)] transition-all duration-300 md:flex-row md:overflow-hidden ${ 
          modalVisible 
            ? "translate-y-0 scale-100 opacity-100" 
            : "translate-y-8 scale-[0.97] opacity-0" 
        }`} 
      > 
        <button 
          type="button" 
          onClick={handleClose} 
          className="absolute right-4 top-4 z-[250] flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-lg text-white backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:bg-black hover:text-[#F0D58A]" 
          aria-label="Cerrar" 
        > 
          ✕ 
        </button> 
 
        {/* GALERÍA */} 
        <div className="w-full shrink-0 overflow-visible md:w-[56%] md:overflow-y-auto"> 
          <div 
            className="relative h-[40vh] min-h-[240px] w-full overflow-hidden bg-[#0D0E0C] md:h-[78vh] md:min-h-[560px]" 
            onTouchStart={ 
              handleTouchStart 
            } 
            onTouchMove={ 
              handleTouchMove 
            } 
            onTouchEnd={ 
              handleTouchEnd 
            } 
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
              <div className="flex h-full items-center justify-center text-sm text-gray-500"> 
                Sin imagen 
              </div> 
            )} 
 
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" /> 
 
            {product.is_new && ( 
              <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-[#F0D58A] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-black shadow-lg"> 
                Nuevo 
              </span> 
            )} 
 
            {isOffer && ( 
              <span className="absolute right-16 top-5 rounded-full border border-white/10 bg-[#D94A4A] px-3.5 py-1.5 text-[11px] font-black tracking-wider text-white shadow-lg"> 
                -{discount}% 
              </span> 
            )} 
 
            {displayedImages.length > 1 && ( 
              <> 
                <button 
                  type="button" 
                  onClick={previousImage} 
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-3xl font-light text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-black/65 active:scale-90" 
                  aria-label="Imagen anterior" 
                > 
                  ‹ 
                </button> 
 
                <button 
                  type="button" 
                  onClick={nextImage} 
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-3xl font-light text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-black/65 active:scale-90" 
                  aria-label="Siguiente imagen" 
                > 
                  › 
                </button> 
 
                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md"> 
                  {displayedImages.map( 
                    (image, index) => ( 
                      <button 
                        key={`${image}-${index}`} 
                        type="button" 
                        onClick={() => 
                          changeImage(index) 
                        } 
                        className={`h-1.5 rounded-full transition-all duration-300 ${ 
                          activeImage === 
                          index 
                            ? "w-7 bg-[#F0D58A]" 
                            : "w-1.5 bg-white/45 hover:bg-white/80" 
                        }`} 
                        aria-label={`Mostrar imagen ${ 
                          index + 1 
                        }`} 
                      /> 
                    ) 
                  )} 
                </div> 
              </> 
            )} 
          </div> 
 
          {displayedImages.length > 1 && ( 
            <div className="flex gap-2.5 overflow-x-auto border-t border-white/[0.05] bg-[#11120F] p-3.5 scrollbar-hide"> 
              {displayedImages.map( 
                (image, index) => ( 
                  <button 
                    key={`${image}-${index}-thumb`} 
                    type="button" 
                    onClick={() => 
                      changeImage(index) 
                    } 
                    className={`h-[76px] w-[58px] min-w-[58px] overflow-hidden rounded-xl border transition-all duration-300 ${ 
                      activeImage === 
                      index 
                        ? "scale-105 border-[#F0D58A] opacity-100 shadow-[0_0_15px_rgba(240,213,138,0.12)]" 
                        : "border-white/[0.06] opacity-50 hover:scale-105 hover:border-white/20 hover:opacity-90" 
                    }`} 
                  > 
                    <img 
                      src={image} 
                      alt="" 
                      draggable="false" 
                      className="h-full w-full object-cover" 
                    /> 
                  </button> 
                ) 
              )} 
            </div> 
          )} 
        </div> 
 
        {/* INFORMACIÓN */} 
        <div className="flex-1 overflow-visible p-5 md:overflow-y-auto md:p-8"> 
          <div className="pr-8"> 
            {product.subcategory && ( 
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#F0D58A]/80"> 
                {product.subcategory} 
              </p> 
            )} 
 
            <h2 className="mt-2 text-[30px] font-black leading-[1.05] tracking-tight text-white md:text-[38px]"> 
              {product.name} 
            </h2> 
 
            <p className="mt-2.5 max-w-xl text-[13px] leading-6 text-white/45"> 
              {product.description || 
                "Sin descripción disponible."} 
            </p> 
 
            <div className="mt-3 flex items-end gap-3"> 
              <span className="text-[25px] font-black tracking-tight text-[#F0D58A]"> 
                S/{" "} 
                {Number( 
                  product.price 
                ).toFixed(2)} 
              </span> 
 
              {isOffer && ( 
                <span className="mb-0.5 text-sm text-white/35 line-through"> 
                  S/{" "} 
                  {Number( 
                    product.old_price 
                  ).toFixed(2)} 
                </span> 
              )} 
            </div> 
          </div> 
 
          <div className="my-4 h-px bg-white/[0.07]" /> 
 
          {colors.length > 0 && ( 
            <div> 
              <div className="flex items-center justify-between"> 
                <p className="text-[13px] font-bold text-white/90"> 
                  Color 
                </p> 
 
                {selectedColor && ( 
                  <span className="text-[11px] text-white/35"> 
                    {selectedColor} 
                  </span> 
                )} 
              </div> 
 
              <div className="mt-3 flex flex-wrap gap-3.5"> 
                {availableColorsForSize.map( 
                  (color) => { 
                    const isSelected = 
                      selectedColor === 
                      color.name 
 
                    return ( 
                      <button 
                        key={color.name} 
                        type="button" 
                        onClick={() => 
                          handleColorChange( 
                            color.name 
                          ) 
                        } 
                        title={color.name} 
                        className={`group relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${ 
                          isSelected 
                            ? "scale-110 border-[#F0D58A] shadow-[0_0_20px_rgba(240,213,138,0.18)]" 
                            : "border-white/15 hover:scale-105 hover:border-white/40" 
                        }`} 
                      > 
                        <span 
                          className="h-[30px] w-[30px] rounded-full border border-black/20 shadow-inner" 
                          style={{ 
                            backgroundColor: 
                              color.hex, 
                          }} 
                        /> 
 
                        {isSelected && ( 
                          <span className="absolute inset-0 flex items-center justify-center"> 
                            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#F0D58A] text-[10px] font-black text-black shadow-lg animate-[scaleIn_0.25s_ease-out]"> 
                              ✓ 
                            </span> 
                          </span> 
                        )} 
                      </button> 
                    ) 
                  } 
                )} 
              </div> 
            </div> 
          )} 
 
          {sizes.length > 0 && ( 
            <div className="mt-4"> 
              <div className="flex items-center justify-between"> 
                <p className="text-[13px] font-bold text-white/90"> 
                  Talla 
                </p> 
 
                {selectedSize && ( 
                  <span className="text-[11px] text-white/35"> 
                    {selectedSize} 
                  </span> 
                )} 
              </div> 
 
              <div className="mt-2.5 flex flex-wrap gap-2.5"> 
                {availableSizesForColor.map( 
                  (size) => { 
                    const isSelected = 
                      selectedSize === size 
 
                    return ( 
                      <button 
                        key={size} 
                        type="button" 
                        onClick={() => 
                          handleSizeChange( 
                            size 
                          ) 
                        } 
                        className={`min-w-[58px] rounded-xl border px-4 py-3 text-xs font-bold transition-all duration-300 ${ 
                          isSelected 
                            ? "scale-105 border-[#F0D58A] bg-[#F0D58A] text-black shadow-[0_6px_22px_rgba(240,213,138,0.14)]" 
                            : "border-white/[0.09] bg-white/[0.025] text-white/80 hover:-translate-y-0.5 hover:border-[#F0D58A]/50 hover:bg-white/[0.05]" 
                        }`} 
                      > 
                        {size} 
 
                        {isSelected && ( 
                          <span className="ml-1"> 
                            ✓ 
                          </span> 
                        )} 
                      </button> 
                    ) 
                  } 
                )} 
              </div> 
            </div> 
          )} 
 
          {selectedVariant && ( 
            <div 
              className={`mt-3 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 transition-all duration-300 ${ 
                selectionPulse 
                  ? "scale-[1.015] border-[#F0D58A]/30" 
                  : "scale-100" 
              }`} 
            > 
              <span className="text-xs text-white/45"> 
                Disponibilidad 
              </span> 
 
              <span className="text-xs font-bold text-white/85"> 
                {remainingStock}{" "} 
                {remainingStock === 1 
                  ? "unidad disponible" 
                  : "unidades disponibles"} 
              </span> 
            </div> 
          )} 
 
          <div className="mt-4"> 
            <p className="text-[13px] font-bold text-white/90"> 
              Cantidad 
            </p> 
 
            <div className="mt-2 flex w-fit items-center overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.025]"> 
              <button 
                type="button" 
                onClick={decreaseQuantity} 
                disabled={ 
                  quantity <= 1 
                } 
                className="flex h-11 w-11 items-center justify-center text-lg text-white/60 transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-25" 
              > 
                − 
              </button> 
 
              <span className="flex h-11 min-w-[46px] items-center justify-center border-x border-white/[0.07] text-sm font-bold text-white"> 
                {quantity} 
              </span> 
 
              <button 
                type="button" 
                onClick={increaseQuantity} 
                disabled={ 
                  !selectedVariant || 
                  quantity >= 
                    remainingStock 
                } 
                className="flex h-11 w-11 items-center justify-center text-lg text-white/60 transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-25" 
              > 
                + 
              </button> 
            </div> 
          </div> 
 
          <button 
            type="button" 
            onClick={handleAddToCart} 
            disabled={!canAddToCart} 
            className={`mt-4 w-full rounded-2xl px-5 py-4 text-sm font-black tracking-wide transition-all duration-300 ${ 
              added 
                ? "scale-[1.015] bg-green-500 text-white shadow-[0_10px_35px_rgba(34,197,94,0.18)]" 
                : canAddToCart 
                  ? "bg-[#F0D58A] text-black hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_10px_35px_rgba(240,213,138,0.14)] active:translate-y-0 active:scale-[0.98]" 
                  : "bg-white/[0.07] text-white/25" 
            } disabled:cursor-not-allowed disabled:shadow-none`} 
          > 
            {added 
              ? "✓ Agregado al carrito" 
              : !selectedSize || 
                  !selectedColor 
                ? "Elige talla y color" 
                : remainingStock <= 0 
                  ? "Stock agotado" 
                  : "Agregar al carrito"} 
          </button> 
        </div> 
      </div> 
 
      <style> 
        {` 
          @keyframes scaleIn { 
            0% { 
              transform: scale(0); 
              opacity: 0; 
            } 
 
            70% { 
              transform: scale(1.15); 
              opacity: 1; 
            } 
 
            100% { 
              transform: scale(1); 
              opacity: 1; 
            } 
          } 
        `} 
      </style> 
    </div> 
  ) 
} 
 
export default ProductDetailModal