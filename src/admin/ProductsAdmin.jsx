import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

const SIZES = ["S", "M", "L", "XL"]

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-[18px] py-[14px] text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"

const cardClass =
  "rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.05)]"

function ProductButton({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[48px] items-center justify-center rounded-xl bg-neutral-900 px-7 py-[14px] text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

function normalizeSubcategory(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")

  const aliases = {
    polo: "Polos",
    polos: "Polos",
    pantalon: "Pantalones",
    pantalones: "Pantalones",
    top: "Tops",
    tops: "Tops",
    conjunto: "Conjuntos",
    conjuntos: "Conjuntos",
    vestido: "Vestidos",
    vestidos: "Vestidos",
    zapato: "Zapatos",
    zapatos: "Zapatos",
    camisa: "Camisas",
    camisas: "Camisas",
    short: "Shorts",
    shorts: "Shorts",
    casaca: "Casacas",
    casacas: "Casacas",
    chompa: "Chompas",
    chompas: "Chompas",
    accesorios: "Accesorios",
    accesorio: "Accesorios",
    otros: "Otros",
    otro: "Otros",
  }

  if (aliases[normalized]) return aliases[normalized]

  return (
    normalized
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ") || "Sin subcategoría"
  )
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(null)

  const [view, setView] = useState("list")
  const [filterCategory, setFilterCategory] = useState("hombre")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [editingId, setEditingId] = useState(null)

  const [name, setName] = useState("")
  const [category, setCategory] = useState("hombre")
  const [subcategory, setSubcategory] = useState("")
  const [price, setPrice] = useState("")
  const [oldPrice, setOldPrice] = useState("")
  const [description, setDescription] = useState("")
  const [isNew, setIsNew] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [colors, setColors] = useState([])

  const fileInputRefs = useRef({})

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    window.history.replaceState(
      {
        ...window.history.state,
        productsAdminView: "list",
        productsAdminCategory: "hombre",
        productsAdminSubcategory: null,
      },
      ""
    )

    const handlePopState = (event) => {
      const state = event.state || {}

      setView(state.productsAdminView || "list")
      setFilterCategory(
        state.productsAdminCategory || "hombre"
      )
      setSelectedSubcategory(
        state.productsAdminSubcategory || ""
      )
    }

    window.addEventListener("popstate", handlePopState)

    return () =>
      window.removeEventListener(
        "popstate",
        handlePopState
      )
  }, [])

  const navigate = (
    nextView,
    nextSubcategory = null,
    replace = false,
    nextCategory = filterCategory
  ) => {
    const state = {
      ...window.history.state,
      productsAdminView: nextView,
      productsAdminCategory: nextCategory,
      productsAdminSubcategory: nextSubcategory,
    }

    if (replace) {
      window.history.replaceState(state, "")
    } else {
      window.history.pushState(state, "")
    }

    setView(nextView)
    setFilterCategory(nextCategory)
    setSelectedSubcategory(nextSubcategory || "")

    window.scrollTo({
      top: 0,
      behavior: "auto",
    })
  }

  async function loadProducts() {
    setLoading(true)

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (
          id,
          product_id,
          size,
          color,
          color_hex,
          color_image_url,
          stock,
          sku,
          product_variant_images (
            id,
            variant_id,
            image_url,
            position
          )
        )
      `)
      .order("created_at", {
        ascending: false,
      })

    if (error) {
      console.error(
        "Error cargando productos:",
        error
      )

      alert(error.message)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  const generateSlug = (value) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

  const createEmptyColor = () => ({
    name: "",
    hex: "#777777",
    imageUrl: "",
    images: [],
    sizes: SIZES.map((size) => ({
      size,
      stock: "",
      enabled: false,
      variantId: null,
    })),
  })

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setCategory(filterCategory)
    setSubcategory("")
    setPrice("")
    setOldPrice("")
    setDescription("")
    setIsNew(false)
    setIsBestSeller(false)
    setColors([])
  }

  const startNewProduct = () => {
    setEditingId(null)
    setName("")
    setCategory(filterCategory)
    setSubcategory("")
    setPrice("")
    setOldPrice("")
    setDescription("")
    setIsNew(false)
    setIsBestSeller(false)
    setColors([createEmptyColor()])

    navigate("editor")
  }

  const addColor = () => {
    setColors((current) => [
      ...current,
      createEmptyColor(),
    ])
  }

  const removeColor = (colorIndex) => {
    setColors((current) =>
      current.filter(
        (_, index) => index !== colorIndex
      )
    )
  }

  const updateColor = (
    colorIndex,
    field,
    value
  ) => {
    setColors((current) =>
      current.map((color, index) =>
        index === colorIndex
          ? {
              ...color,
              [field]: value,
            }
          : color
      )
    )
  }

  const updateColorSize = (
    colorIndex,
    sizeIndex,
    field,
    value
  ) => {
    setColors((current) =>
      current.map((color, index) => {
        if (index !== colorIndex) {
          return color
        }

        return {
          ...color,
          sizes: color.sizes.map(
            (item, currentIndex) =>
              currentIndex === sizeIndex
                ? {
                    ...item,
                    [field]: value,
                  }
                : item
          ),
        }
      })
    )
  }

  const uploadColorImages = async (
    colorIndex,
    event
  ) => {
    const files = Array.from(
      event.target.files || []
    )

    if (!files.length) return

    if (
      files.some(
        (file) =>
          !file.type.startsWith("image/")
      )
    ) {
      alert(
        "Selecciona solamente archivos de imagen."
      )

      event.target.value = ""
      return
    }

    try {
      setUploadingImage(colorIndex)

      const uploadedImages = []

      for (const file of files) {
        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() || "png"

        const safeName = generateSlug(
          name || "producto"
        )

        const uniqueName =
          `${safeName}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}.${extension}`

        const filePath =
          `products/${uniqueName}`

        const {
          error: uploadError,
        } = await supabase.storage
          .from("product-images")
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            }
          )

        if (uploadError) {
          throw uploadError
        }

        const {
          data,
        } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath)

        if (!data?.publicUrl) {
          throw new Error(
            "No se pudo obtener la URL de la imagen."
          )
        }

        uploadedImages.push(
          data.publicUrl
        )
      }

      setColors((current) =>
        current.map((color, index) => {
          if (index !== colorIndex) {
            return color
          }

          const images = [
            ...(color.images || []),
            ...uploadedImages,
          ]

          return {
            ...color,
            images,
            imageUrl:
              color.imageUrl ||
              images[0] ||
              "",
          }
        })
      )
    } catch (error) {
      console.error(
        "Error subiendo imágenes:",
        error
      )

      alert(
        `No se pudieron subir las imágenes: ${error.message}`
      )
    } finally {
      setUploadingImage(null)

      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const removeColorImage = (
    colorIndex,
    imageIndex
  ) => {
    setColors((current) =>
      current.map((color, index) => {
        if (index !== colorIndex) {
          return color
        }

        const images = (
          color.images || []
        ).filter(
          (_, currentIndex) =>
            currentIndex !== imageIndex
        )

        return {
          ...color,
          images,
          imageUrl:
            images[0] || "",
        }
      })
    )
  }

  const startEditing = (product) => {
    const groupedColors = {}

    ;(
      product.product_variants || []
    ).forEach((variant) => {
      const colorName =
        variant.color || "Sin nombre"

      if (!groupedColors[colorName]) {
        const images = (
          variant.product_variant_images ||
          []
        )
          .slice()
          .sort(
            (a, b) =>
              (a.position || 0) -
              (b.position || 0)
          )
          .map(
            (image) =>
              image.image_url
          )

        const fallbackImages =
          variant.color_image_url
            ? [variant.color_image_url]
            : []

        const allImages = images.length
          ? [...new Set(images)]
          : fallbackImages

        groupedColors[colorName] = {
          name: colorName,
          hex:
            variant.color_hex ||
            "#777777",
          imageUrl:
            allImages[0] || "",
          images: allImages,
          sizes: SIZES.map(
            (size) => ({
              size,
              stock: "",
              enabled: false,
              variantId: null,
            })
          ),
        }
      }

      const sizeItem =
        groupedColors[
          colorName
        ].sizes.find(
          (item) =>
            item.size === variant.size
        )

      if (sizeItem) {
        sizeItem.enabled = true
        sizeItem.stock =
          variant.stock ?? 0
        sizeItem.variantId =
          variant.id
      }
    })

    setEditingId(product.id)
    setName(product.name || "")
    setCategory(
      product.category || "hombre"
    )
    setSubcategory(
      product.subcategory || ""
    )
    setPrice(product.price ?? "")
    setOldPrice(
      product.old_price ?? ""
    )
    setDescription(
      product.description || ""
    )
    setIsNew(
      Boolean(product.is_new)
    )
    setIsBestSeller(
      Boolean(product.is_best_seller)
    )

    setColors(
      Object.values(groupedColors)
        .length
        ? Object.values(groupedColors)
        : [createEmptyColor()]
    )

    navigate(
      "editor",
      null,
      false,
      product.category ||
        "hombre"
    )
  }

  const validateForm = () => {
    if (!name.trim()) {
      alert(
        "Completa el nombre del producto."
      )
      return false
    }

    if (!subcategory.trim()) {
      alert(
        "Completa la subcategoría."
      )
      return false
    }

    if (
      price === "" ||
      Number(price) < 0
    ) {
      alert(
        "Completa un precio válido."
      )
      return false
    }

    if (
      oldPrice !== "" &&
      Number(oldPrice) < 0
    ) {
      alert(
        "El precio anterior no puede ser negativo."
      )
      return false
    }

    if (!colors.length) {
      alert(
        "Agrega al menos un color."
      )
      return false
    }

    for (const color of colors) {
      if (!color.name.trim()) {
        alert(
          "Completa el nombre de cada color."
        )
        return false
      }

      if (
        !color.sizes.some(
          (item) => item.enabled
        )
      ) {
        alert(
          `Selecciona al menos una talla para ${color.name}.`
        )
        return false
      }

      if (
        color.sizes.some(
          (item) =>
            item.enabled &&
            (
              item.stock === "" ||
              !Number.isInteger(
                Number(item.stock)
              ) ||
              Number(item.stock) < 0
            )
        )
      ) {
        alert(
          `Revisa el stock de las tallas del color ${color.name}.`
        )
        return false
      }
    }

    return true
  }

  const buildVariants = () => {
    const variants = []

    colors.forEach((color) => {
      color.sizes.forEach(
        (item) => {
          if (!item.enabled) {
            return
          }

          variants.push({
            id:
              item.variantId ||
              null,
            size: item.size,
            color:
              color.name.trim(),
            color_hex:
              color.hex ||
              "#777777",
            color_image_url:
              color.images?.[0] ||
              null,
            stock: Math.max(
              0,
              Number(item.stock) || 0
            ),
          })
        }
      )
    })

    return variants
  }

  const saveVariantImages = async (
    variants
  ) => {
    for (const variant of variants) {
      const colorData =
        colors.find(
          (color) =>
            color.name.trim() ===
            variant.color
        )

      if (!colorData) {
        continue
      }

      const images = [
        ...new Set(
          colorData.images || []
        ),
      ]

      const {
        error: deleteError,
      } = await supabase
        .from(
          "product_variant_images"
        )
        .delete()
        .eq(
          "variant_id",
          variant.id
        )

      if (deleteError) {
        throw deleteError
      }

      if (!images.length) {
        continue
      }

      const rows = images.map(
        (
          imageUrl,
          index
        ) => ({
          variant_id:
            variant.id,
          image_url:
            imageUrl,
          position: index,
        })
      )

      const {
        error: insertError,
      } = await supabase
        .from(
          "product_variant_images"
        )
        .insert(rows)

      if (insertError) {
        throw insertError
      }
    }
  }

  const createProduct = async () => {
    const slug =
      `${generateSlug(name)}-${Date.now()}`

    const variants =
      buildVariants()

    const {
      data: product,
      error: productError,
    } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        slug,
        category,
        subcategory:
          subcategory.trim(),
        price: Number(price),
        old_price: oldPrice
          ? Number(oldPrice)
          : null,
        is_new: isNew,
        is_best_seller:
          isBestSeller,
        is_active: true,
        description:
          description.trim() ||
          null,
      })
      .select()
      .single()

    if (productError) {
      throw productError
    }

    const {
      data: insertedVariants,
      error: variantsError,
    } = await supabase
      .from("product_variants")
      .insert(
        variants.map(
          (variant) => ({
            size:
              variant.size,
            color:
              variant.color,
            color_hex:
              variant.color_hex,
            color_image_url:
              variant.color_image_url,
            stock:
              variant.stock,
            product_id:
              product.id,
          })
        )
      )
      .select()

    if (variantsError) {
      await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          product.id
        )

      throw variantsError
    }

    await saveVariantImages(
      insertedVariants || []
    )
  }

  const updateProduct = async () => {
    const variants =
      buildVariants()

    const {
      error: productError,
    } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        category,
        subcategory:
          subcategory.trim(),
        price: Number(price),
        old_price: oldPrice
          ? Number(oldPrice)
          : null,
        is_new: isNew,
        is_best_seller:
          isBestSeller,
        description:
          description.trim() ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        editingId
      )

    if (productError) {
      throw productError
    }

    const {
      data: existingVariants,
      error: readError,
    } = await supabase
      .from("product_variants")
      .select(
        "id, size, color"
      )
      .eq(
        "product_id",
        editingId
      )

    if (readError) {
      throw readError
    }

    const existingIds =
      (existingVariants || []).map(
        (variant) =>
          variant.id
      )

    const incomingIds =
      variants
        .filter(
          (variant) =>
            variant.id
        )
        .map(
          (variant) =>
            variant.id
        )

    for (const variant of variants) {
      if (!variant.id) {
        continue
      }

      const {
        error,
      } = await supabase
        .from(
          "product_variants"
        )
        .update({
          size:
            variant.size,
          color:
            variant.color,
          color_hex:
            variant.color_hex,
          color_image_url:
            variant.color_image_url,
          stock:
            variant.stock,
        })
        .eq(
          "id",
          variant.id
        )
        .eq(
          "product_id",
          editingId
        )

      if (error) {
        throw error
      }
    }

    const newVariants =
      variants.filter(
        (variant) =>
          !variant.id
      )

    let insertedNewVariants = []

    if (newVariants.length) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "product_variants"
        )
        .insert(
          newVariants.map(
            (variant) => ({
              product_id:
                editingId,
              size:
                variant.size,
              color:
                variant.color,
              color_hex:
                variant.color_hex,
              color_image_url:
                variant.color_image_url,
              stock:
                variant.stock,
            })
          )
        )
        .select()

      if (error) {
        throw error
      }

      insertedNewVariants =
        data || []

      newVariants.forEach(
        (
          variant,
          index
        ) => {
          variant.id =
            insertedNewVariants[
              index
            ]?.id || null
        }
      )
    }

    const idsToRemove =
      existingIds.filter(
        (id) =>
          !incomingIds.includes(
            id
          )
      )

    for (const variantId of idsToRemove) {
      const {
        count,
        error:
          orderItemsError,
      } = await supabase
        .from("order_items")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "variant_id",
          variantId
        )

      if (orderItemsError) {
        throw orderItemsError
      }

      if ((count || 0) > 0) {
        const {
          error,
        } = await supabase
          .from(
            "product_variants"
          )
          .update({
            stock: 0,
          })
          .eq(
            "id",
            variantId
          )

        if (error) {
          throw error
        }

        continue
      }

      await supabase
        .from(
          "product_variant_images"
        )
        .delete()
        .eq(
          "variant_id",
          variantId
        )

      const {
        error,
      } = await supabase
        .from(
          "product_variants"
        )
        .delete()
        .eq(
          "id",
          variantId
        )

      if (error) {
        throw error
      }
    }

    await saveVariantImages(
      variants
    )
  }

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const savedCategory =
        category

      if (editingId) {
        await updateProduct()

        alert(
          "Producto actualizado correctamente."
        )
      } else {
        await createProduct()

        alert(
          "Producto guardado correctamente."
        )
      }

      await loadProducts()

      resetForm()

      navigate(
        "category",
        null,
        true,
        savedCategory
      )
    } catch (error) {
      console.error(
        "Error guardando producto:",
        error
      )

      alert(
        error.message ||
          "No se pudo guardar el producto."
      )
    } finally {
      setSaving(false)
    }
  }

  const toggleProductVisibility =
    async (product) => {
      const newStatus =
        !product.is_active

      const {
        error,
      } = await supabase
        .from("products")
        .update({
          is_active:
            newStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          product.id
        )

      if (error) {
        alert(error.message)
        return
      }

      setProducts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    is_active:
                      newStatus,
                  }
                : item
          )
      )
    }

  const deleteProduct =
    async (product) => {
      if (
        !window.confirm(
          `¿Eliminar definitivamente "${product.name}"?`
        )
      ) {
        return
      }

      const variantIds =
        (
          product.product_variants ||
          []
        ).map(
          (variant) =>
            variant.id
        )

      if (variantIds.length) {
        const {
          count,
          error,
        } = await supabase
          .from("order_items")
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .in(
            "variant_id",
            variantIds
          )

        if (error) {
          alert(error.message)
          return
        }

        if ((count || 0) > 0) {
          alert(
            "No puedes eliminar este producto porque tiene ventas registradas. Puedes ocultarlo de la tienda."
          )
          return
        }
      }

      const {
        error,
      } = await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          product.id
        )

      if (error) {
        alert(error.message)
        return
      }

      setProducts(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              product.id
          )
      )
    }

  const getProductImage =
    (product) => {
      for (const variant of
        product.product_variants ||
        []) {
        const images = (
          variant.product_variant_images ||
          []
        )
          .slice()
          .sort(
            (a, b) =>
              (a.position || 0) -
              (b.position || 0)
          )

        if (
          images[0]?.image_url
        ) {
          return images[0]
            .image_url
        }

        if (
          variant.color_image_url
        ) {
          return variant.color_image_url
        }
      }

      return ""
    }

  const visibleProducts =
    products.filter(
      (product) =>
        product.category ===
        filterCategory
    )

  const groupedSubcategories =
    Object.values(
      visibleProducts.reduce(
        (
          groups,
          product
        ) => {
          const label =
            normalizeSubcategory(
              product.subcategory
            )

          const key =
            label.toLowerCase()

          if (!groups[key]) {
            groups[key] = {
              key,
              label,
              products: [],
            }
          }

          groups[
            key
          ].products.push(
            product
          )

          return groups
        },
        {}
      )
    ).sort(
      (a, b) =>
        a.label.localeCompare(
          b.label,
          "es"
        )
    )

  const selectedGroup =
    groupedSubcategories.find(
      (group) =>
        group.key ===
        selectedSubcategory
    )

  const categoryCount =
    (categoryId) =>
      products.filter(
        (product) =>
          product.category ===
          categoryId
      ).length

  const ProductCard = ({
    product,
  }) => {
    const image =
      getProductImage(
        product
      )

    return (
      <article
        className={`${cardClass} w-full min-w-0 overflow-hidden`}
      >
        <button
          type="button"
          onClick={() =>
            startEditing(
              product
            )
          }
          className="block aspect-[3/4] w-full overflow-hidden bg-neutral-50"
          aria-label={`Editar ${product.name}`}
        >
          {image ? (
            <img
              src={image}
              alt={
                product.name
              }
              loading="lazy"
              className="h-full w-full object-contain transition duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-neutral-400">
              Sin fotografía
            </div>
          )}
        </button>

        <div className="flex flex-col gap-[14px] p-[18px] text-center">
          <h2 className="line-clamp-2 min-h-10 break-words text-xs font-semibold text-neutral-900">
            {product.name}
          </h2>

          <p className="text-sm font-semibold text-neutral-900">
            S/{" "}
            {Number(
              product.price || 0
            ).toFixed(2)}
          </p>

          <button
            type="button"
            onClick={() =>
              toggleProductVisibility(
                product
              )
            }
            className="min-h-[42px] w-full rounded-xl border border-neutral-300 px-3 py-[11px] text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            {product.is_active
              ? "Ocultar"
              : "Mostrar"}
          </button>

          <button
            type="button"
            onClick={() =>
              deleteProduct(
                product
              )
            }
            className="min-h-[42px] w-full rounded-xl border border-red-200 px-3 py-[11px] text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </article>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] w-full items-center justify-center bg-white px-6 text-neutral-500">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="w-full bg-white px-5 py-12 text-neutral-900 sm:px-8 sm:py-16 lg:px-10">
      {/* IMPORTANTE:
          Este contenedor ya no tiene max-w-[1250px].
          Ahora ocupa todo el ancho disponible que
          le entrega Admin.jsx. */}
      <div className="flex w-full flex-col items-center gap-16">

        {/* =========================
            SELECCIÓN DE CATEGORÍA
        ========================== */}
        {view === "list" && (
          <div className="flex w-full flex-col items-center justify-center gap-12">
            
            <div className="flex w-full flex-col items-center justify-center text-center">
              <div className="mb-8 h-px w-16 bg-neutral-200" />

              <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                Selecciona una categoría
              </p>

              <div className="mt-4 h-px w-10 bg-neutral-200" />
            </div>

            {/* ESTE CONTENEDOR OCUPA TODO EL ANCHO DISPONIBLE */}
            <div className="flex w-full items-center justify-center">
              
              {/* SOLO LAS TARJETAS TIENEN UN ANCHO MÁXIMO */}
              <div className="grid w-full max-w-[900px] grid-cols-1 gap-9 sm:grid-cols-2">
                
                {/* HOMBRE */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "category",
                      null,
                      false,
                      "hombre"
                    )
                  }
                  className="flex min-h-[230px] w-full flex-col items-center justify-center gap-7 rounded-2xl border border-neutral-200 bg-white px-8 py-10 text-center shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)]"
                >
                  <span className="text-xl font-semibold tracking-[0.2em] text-neutral-900">
                    HOMBRE
                  </span>

                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-6 py-3 text-sm font-medium text-neutral-700">
                    {categoryCount("hombre")}{" "}
                    productos
                  </span>

                  <span className="text-sm font-medium text-neutral-500">
                    Administrar prendas →
                  </span>
                </button>

                {/* MUJER */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "category",
                      null,
                      false,
                      "mujer"
                    )
                  }
                  className="flex min-h-[230px] w-full flex-col items-center justify-center gap-7 rounded-2xl border border-neutral-200 bg-white px-8 py-10 text-center shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)]"
                >
                  <span className="text-xl font-semibold tracking-[0.2em] text-neutral-900">
                    MUJER
                  </span>

                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-6 py-3 text-sm font-medium text-neutral-700">
                    {categoryCount("mujer")}{" "}
                    productos
                  </span>

                  <span className="text-sm font-medium text-neutral-500">
                    Administrar prendas →
                  </span>
                </button>

              </div>
            </div>
          </div>
        )}

        {/* =========================
            CATEGORÍA
        ========================== */}
        {view === "category" && (
          <div className="flex w-full flex-col items-center gap-16">
            <header className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center text-center">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                Categoría
              </p>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {filterCategory ===
                "hombre"
                  ? "HOMBRE"
                  : "MUJER"}
              </h1>

              <p className="mt-5 text-sm text-neutral-500">
                {visibleProducts.length}{" "}
                productos registrados
              </p>
            </header>

            <div className="flex w-full justify-center">
              <ProductButton
                onClick={
                  startNewProduct
                }
              >
                + Agregar producto
              </ProductButton>
            </div>

            {!visibleProducts.length ? (
              <div
                className={`${cardClass} mx-auto flex w-full max-w-2xl flex-col items-center gap-7 border-dashed px-9 py-[70px] text-center`}
              >
                <p className="text-neutral-500">
                  Todavía no hay
                  productos en esta
                  categoría.
                </p>

                <ProductButton
                  onClick={
                    startNewProduct
                  }
                >
                  + Registrar primera prenda
                </ProductButton>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[72px]">
                {groupedSubcategories.map(
                  (group) => (
                    <section
                      key={
                        group.key
                      }
                      className="mx-auto w-full"
                    >
                      <div className="mb-9 flex w-full flex-col items-center justify-center gap-5 text-center">
                        <div>
                          <h2 className="text-xl font-semibold text-neutral-900">
                            {group.label}
                          </h2>

                          <p className="mt-2 text-sm text-neutral-500">
                            {
                              group
                                .products
                                .length
                            }{" "}
                            {group
                              .products
                              .length ===
                            1
                              ? "producto"
                              : "productos"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "subcategory",
                              group.key
                            )
                          }
                          className="min-h-[43px] rounded-xl border border-neutral-300 px-6 py-[11px] text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Ver más →
                        </button>
                      </div>

                      <div className="mx-auto flex w-full snap-x snap-mandatory gap-7 overflow-x-auto px-2 pb-7">
                        {group.products.map(
                          (
                            product
                          ) => (
                            <div
                              key={
                                product.id
                              }
                              className="w-[185px] min-w-[185px] snap-start sm:w-[205px] sm:min-w-[205px]"
                            >
                              <ProductCard
                                product={
                                  product
                                }
                              />
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================
            SUBCATEGORÍA
        ========================== */}
        {view === "subcategory" && (
          <div className="flex w-full flex-col items-center gap-16">
            <header className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center text-center">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                {filterCategory ===
                "hombre"
                  ? "HOMBRE"
                  : "MUJER"}
              </p>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {
                  selectedGroup?.label ||
                  selectedSubcategory
                }
              </h1>

              <p className="mt-5 text-sm text-neutral-500">
                {
                  selectedGroup
                    ?.products
                    .length || 0
                }{" "}
                productos registrados
              </p>
            </header>

            <div className="flex w-full justify-center">
              <ProductButton
                onClick={
                  startNewProduct
                }
              >
                + Agregar producto
              </ProductButton>
            </div>

            {!selectedGroup ||
            !selectedGroup.products
              .length ? (
              <div className="mx-auto py-[70px] text-center text-neutral-500">
                No hay productos en
                esta subcategoría.
              </div>
            ) : (
              <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 justify-items-center gap-x-8 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {selectedGroup.products.map(
                  (product) => (
                    <div
                      key={
                        product.id
                      }
                      className="w-full max-w-[205px]"
                    >
                      <ProductCard
                        product={
                          product
                        }
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================
            EDITOR
        ========================== */}
        {view === "editor" && (
          <div className="flex w-full flex-col items-center gap-16">
            <header className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center text-center">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                Productos
              </p>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {editingId
                  ? "Editar producto"
                  : "Agregar producto"}
              </h1>
            </header>

            <form
              onSubmit={
                handleSubmit
              }
              className="mx-auto flex w-full max-w-[1100px] flex-col gap-12"
            >
              {/* INFORMACIÓN GENERAL */}
              <section
                className={`${cardClass} w-full p-8 sm:p-12`}
              >
                <div className="mx-auto w-full max-w-[950px]">
                  <h2 className="mb-10 text-center text-xl font-semibold text-neutral-900">
                    Información general
                  </h2>

                  <div className="grid gap-x-9 gap-y-9 sm:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-sm font-medium text-neutral-800">
                        Nombre del producto *
                      </label>

                      <input
                        value={name}
                        onChange={(e) =>
                          setName(
                            e.target.value
                          )
                        }
                        placeholder="Ej. Polo Oversize"
                        className={
                          inputClass
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-medium text-neutral-800">
                        Categoría *
                      </label>

                      <select
                        value={
                          category
                        }
                        onChange={(
                          e
                        ) => {
                          setCategory(
                            e.target.value
                          )

                          setFilterCategory(
                            e.target.value
                          )
                        }}
                        className={
                          inputClass
                        }
                      >
                        <option value="hombre">
                          Hombre
                        </option>

                        <option value="mujer">
                          Mujer
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-medium text-neutral-800">
                        Subcategoría *
                      </label>

                      <input
                        value={
                          subcategory
                        }
                        onChange={(e) =>
                          setSubcategory(
                            e.target.value
                          )
                        }
                        placeholder="Ej. Polos, pantalones, tops"
                        className={
                          inputClass
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-sm font-medium text-neutral-800">
                          Precio (S/) *
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) =>
                            setPrice(
                              e.target.value
                            )
                          }
                          className={
                            inputClass
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-medium text-neutral-800">
                          Precio anterior
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            oldPrice
                          }
                          onChange={(e) =>
                            setOldPrice(
                              e.target.value
                            )
                          }
                          className={
                            inputClass
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-7 py-7 sm:col-span-2">
                      <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-800">
                        <input
                          type="checkbox"
                          checked={
                            isNew
                          }
                          onChange={(e) =>
                            setIsNew(
                              e.target.checked
                            )
                          }
                          className="h-5 w-5 accent-neutral-900"
                        />

                        Mostrar como nuevo
                      </label>

                      <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-800">
                        <input
                          type="checkbox"
                          checked={
                            isBestSeller
                          }
                          onChange={(e) =>
                            setIsBestSeller(
                              e.target.checked
                            )
                          }
                          className="h-5 w-5 accent-neutral-900"
                        />

                        Mostrar como más vendido
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-3 block text-sm font-medium text-neutral-800">
                        Descripción
                      </label>

                      <textarea
                        rows={6}
                        value={
                          description
                        }
                        onChange={(e) =>
                          setDescription(
                            e.target.value
                          )
                        }
                        placeholder="Detalles de la prenda..."
                        className={
                          inputClass
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* COLORES, FOTOS Y STOCK */}
              <section
                className={`${cardClass} w-full p-8 sm:p-12`}
              >
                <div className="mb-12 flex flex-col items-center gap-7 text-center">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">
                      Colores, fotos y stock
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-neutral-500">
                      Configura cada color,
                      sus fotografías y las
                      tallas disponibles.
                    </p>
                  </div>

                  <ProductButton
                    onClick={
                      addColor
                    }
                  >
                    + Agregar color
                  </ProductButton>
                </div>

                {!colors.length && (
                  <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
                    Sin colores.
                  </div>
                )}

                <div className="mx-auto flex w-full max-w-[950px] flex-col gap-12">
                  {colors.map(
                    (
                      color,
                      colorIndex
                    ) => (
                      <div
                        key={
                          colorIndex
                        }
                        className="rounded-2xl border border-neutral-200 bg-neutral-50 p-7 sm:p-9"
                      >
                        <div className="mb-9 flex flex-col items-center justify-center gap-6 text-center">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-neutral-400">
                              Variante
                            </p>

                            <h3 className="mt-2 font-semibold text-neutral-900">
                              Color{" "}
                              {colorIndex +
                                1}
                              {color.name
                                ? ` · ${color.name}`
                                : ""}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeColor(
                                colorIndex
                              )
                            }
                            className="min-h-[43px] rounded-xl border border-red-200 px-6 py-[11px] text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Eliminar color
                          </button>
                        </div>

                        <div className="grid gap-x-9 gap-y-9 sm:grid-cols-2">
                          <div>
                            <label className="mb-3 block text-sm font-medium text-neutral-800">
                              Nombre del color *
                            </label>

                            <input
                              value={
                                color.name
                              }
                              onChange={(e) =>
                                updateColor(
                                  colorIndex,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Ej. Negro"
                              className={
                                inputClass
                              }
                              required
                            />
                          </div>

                          <div>
                            <label className="mb-3 block text-sm font-medium text-neutral-800">
                              Color de referencia
                            </label>

                            <div className="flex min-h-[52px] items-center justify-center gap-4 rounded-xl border border-neutral-200 bg-white p-2">
                              <input
                                type="color"
                                value={
                                  color.hex
                                }
                                onChange={(e) =>
                                  updateColor(
                                    colorIndex,
                                    "hex",
                                    e.target.value
                                  )
                                }
                                className="h-10 w-12 cursor-pointer border-0 bg-transparent"
                              />

                              <span className="text-sm text-neutral-500">
                                {color.hex}
                              </span>
                            </div>
                          </div>
                        </div>

                        <input
                          ref={(
                            element
                          ) => {
                            fileInputRefs.current[
                              colorIndex
                            ] =
                              element
                          }}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) =>
                            uploadColorImages(
                              colorIndex,
                              e
                            )
                          }
                        />

                        {/* FOTOGRAFÍAS */}
                        <div className="mt-12 border-t border-neutral-200 pt-10">
                          <div className="mb-8 flex flex-col items-center gap-6 text-center">
                            <div>
                              <h4 className="font-semibold text-neutral-900">
                                Fotografías
                              </h4>

                              <p className="mt-2 text-xs text-neutral-500">
                                La primera será la
                                principal.
                              </p>
                            </div>

                            <ProductButton
                              onClick={() =>
                                fileInputRefs
                                  .current[
                                    colorIndex
                                  ]
                                  ?.click()
                              }
                              disabled={
                                uploadingImage ===
                                colorIndex
                              }
                            >
                              {uploadingImage ===
                              colorIndex
                                ? "Subiendo..."
                                : "+ Agregar fotos"}
                            </ProductButton>
                          </div>

                          {!color
                            .images
                            ?.length ? (
                            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500">
                              Sin fotografías.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 justify-items-center gap-x-9 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                              {color.images.map(
                                (
                                  imageUrl,
                                  imageIndex
                                ) => (
                                  <div
                                    key={`${imageUrl}-${imageIndex}`}
                                    className="w-full max-w-[230px] overflow-hidden rounded-xl border border-neutral-200 bg-white"
                                  >
                                    <div className="relative aspect-[3/4] bg-neutral-50">
                                      <img
                                        src={
                                          imageUrl
                                        }
                                        alt={`${
                                          color.name ||
                                          "Prenda"
                                        } foto ${
                                          imageIndex +
                                          1
                                        }`}
                                        className="h-full w-full object-contain"
                                      />

                                      <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm">
                                        {imageIndex ===
                                        0
                                          ? "Principal"
                                          : `Foto ${
                                              imageIndex +
                                              1
                                            }`}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeColorImage(
                                            colorIndex,
                                            imageIndex
                                          )
                                        }
                                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-red-600 shadow-sm transition hover:bg-red-50"
                                      >
                                        ×
                                      </button>
                                    </div>

                                    {imageIndex >
                                      0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const images =
                                            [
                                              ...color.images,
                                            ]

                                          const [
                                            selected,
                                          ] =
                                            images.splice(
                                              imageIndex,
                                              1
                                            )

                                          images.unshift(
                                            selected
                                          )

                                          setColors(
                                            (
                                              current
                                            ) =>
                                              current.map(
                                                (
                                                  item,
                                                  index
                                                ) =>
                                                  index ===
                                                  colorIndex
                                                    ? {
                                                        ...item,
                                                        images,
                                                        imageUrl:
                                                          images[0] ||
                                                          "",
                                                      }
                                                    : item
                                              )
                                          )
                                        }}
                                        className="min-h-[46px] w-full border-t border-neutral-200 px-3 py-3 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
                                      >
                                        Usar como principal
                                      </button>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {/* TALLAS Y STOCK */}
                        <div className="mt-12 border-t border-neutral-200 pt-10">
                          <div className="mb-8 text-center">
                            <h4 className="font-semibold text-neutral-900">
                              Tallas y stock
                            </h4>

                            <p className="mt-2 text-xs text-neutral-500">
                              Activa solamente las
                              tallas disponibles.
                            </p>
                          </div>

                          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
                            {color.sizes.map(
                              (
                                sizeItem,
                                sizeIndex
                              ) => (
                                <div
                                  key={
                                    sizeItem.size
                                  }
                                  className={`rounded-xl border p-6 ${
                                    sizeItem.enabled
                                      ? "border-neutral-400 bg-white shadow-sm"
                                      : "border-neutral-200 bg-white"
                                  }`}
                                >
                                  <label className="flex cursor-pointer items-center justify-center gap-3 font-semibold text-neutral-900">
                                    <input
                                      type="checkbox"
                                      checked={
                                        sizeItem.enabled
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateColorSize(
                                          colorIndex,
                                          sizeIndex,
                                          "enabled",
                                          e.target.checked
                                        )
                                      }
                                      className="h-5 w-5 accent-neutral-900"
                                    />

                                    Talla{" "}
                                    {sizeItem.size}
                                  </label>

                                  <label className="mb-3 mt-6 block text-center text-xs text-neutral-500">
                                    Unidades disponibles
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                      sizeItem.stock
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateColorSize(
                                        colorIndex,
                                        sizeIndex,
                                        "stock",
                                        e.target.value
                                      )
                                    }
                                    disabled={
                                      !sizeItem.enabled
                                    }
                                    placeholder="Cantidad"
                                    className={`${inputClass} text-center disabled:bg-neutral-50 disabled:text-neutral-300`}
                                  />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>

              {/* GUARDAR */}
              <div className="flex w-full justify-center border-t border-neutral-200 pt-10">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    uploadingImage !==
                      null
                  }
                  className="inline-flex min-h-[52px] w-full max-w-[440px] items-center justify-center rounded-xl bg-neutral-900 px-7 py-[15px] text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Guardando..."
                    : editingId
                      ? "Guardar cambios"
                      : "Guardar producto"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}