import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

const SIZES = ["S", "M", "L", "XL"]

const inputClass =
  "w-full rounded-xl border border-[#342c45] bg-[#121019] px-4 py-3 text-sm text-[#f4f0f8] outline-none transition focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"

const cardClass =
  "rounded-2xl border border-[#29233a] bg-[#17151f] shadow-[0_12px_35px_rgba(0,0,0,0.22)]"

function ProductButton({
  children,
  onClick,
  className = "",
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7c3aed] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
      setFilterCategory(state.productsAdminCategory || "hombre")
      setSelectedSubcategory(state.productsAdminSubcategory || "")
    }

    window.addEventListener("popstate", handlePopState)

    return () => window.removeEventListener("popstate", handlePopState)
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
    window.scrollTo({ top: 0, behavior: "auto" })
  }

  async function loadProducts() {
    setLoading(true)

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (
          id,
          size,
          color,
          color_hex,
          color_image_url,
          stock,
          product_variant_images (
            id,
            image_url,
            position
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error cargando productos:", error)
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
    setColors((current) => [...current, createEmptyColor()])
  }

  const removeColor = (colorIndex) => {
    setColors((current) =>
      current.filter((_, index) => index !== colorIndex)
    )
  }

  const updateColor = (colorIndex, field, value) => {
    setColors((current) =>
      current.map((color, index) =>
        index === colorIndex ? { ...color, [field]: value } : color
      )
    )
  }

  const updateColorSize = (colorIndex, sizeIndex, field, value) => {
    setColors((current) =>
      current.map((color, index) => {
        if (index !== colorIndex) return color

        return {
          ...color,
          sizes: color.sizes.map((item, currentIndex) =>
            currentIndex === sizeIndex
              ? { ...item, [field]: value }
              : item
          ),
        }
      })
    )
  }

  const uploadColorImages = async (colorIndex, event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    if (files.some((file) => !file.type.startsWith("image/"))) {
      alert("Selecciona solamente archivos de imagen.")
      event.target.value = ""
      return
    }

    try {
      setUploadingImage(colorIndex)
      const uploadedImages = []

      for (const file of files) {
        const extension =
          file.name.split(".").pop()?.toLowerCase() || "png"

        const safeName = generateSlug(name || "producto")

        const uniqueName =
          `${safeName}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}.${extension}`

        const filePath = `products/${uniqueName}`

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath)

        if (!data?.publicUrl) {
          throw new Error("No se pudo obtener la URL de la imagen.")
        }

        uploadedImages.push(data.publicUrl)
      }

      setColors((current) =>
        current.map((color, index) => {
          if (index !== colorIndex) return color

          const images = [...(color.images || []), ...uploadedImages]

          return {
            ...color,
            images,
            imageUrl: color.imageUrl || images[0] || "",
          }
        })
      )
    } catch (error) {
      console.error("Error subiendo imágenes:", error)
      alert(`No se pudieron subir las imágenes: ${error.message}`)
    } finally {
      setUploadingImage(null)

      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const removeColorImage = (colorIndex, imageIndex) => {
    setColors((current) =>
      current.map((color, index) => {
        if (index !== colorIndex) return color

        const images = (color.images || []).filter(
          (_, currentIndex) => currentIndex !== imageIndex
        )

        return {
          ...color,
          images,
          imageUrl: images[0] || "",
        }
      })
    )
  }

  const startEditing = (product) => {
    const groupedColors = {}

    product.product_variants?.forEach((variant) => {
      const colorName = variant.color || "Sin nombre"

      if (!groupedColors[colorName]) {
        const images = (variant.product_variant_images || [])
          .slice()
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((image) => image.image_url)

        const fallbackImages = variant.color_image_url
          ? [variant.color_image_url]
          : []

        const allImages = images.length
          ? [...new Set(images)]
          : fallbackImages

        groupedColors[colorName] = {
          name: colorName,
          hex: variant.color_hex || "#777777",
          imageUrl: allImages[0] || "",
          images: allImages,
          sizes: SIZES.map((size) => ({
            size,
            stock: "",
            enabled: false,
          })),
        }
      }

      const sizeItem = groupedColors[colorName].sizes.find(
        (item) => item.size === variant.size
      )

      if (sizeItem) {
        sizeItem.enabled = true
        sizeItem.stock = variant.stock ?? 0
      }
    })

    setEditingId(product.id)
    setName(product.name || "")
    setCategory(product.category || "hombre")
    setSubcategory(product.subcategory || "")
    setPrice(product.price ?? "")
    setOldPrice(product.old_price ?? "")
    setDescription(product.description || "")
    setIsNew(Boolean(product.is_new))
    setIsBestSeller(Boolean(product.is_best_seller))

    setColors(
      Object.values(groupedColors).length
        ? Object.values(groupedColors)
        : [createEmptyColor()]
    )

    navigate(
      "editor",
      null,
      false,
      product.category || "hombre"
    )
  }

  const validateForm = () => {
    if (!name.trim()) {
      alert("Completa el nombre del producto.")
      return false
    }

    if (!subcategory.trim()) {
      alert("Completa la subcategoría.")
      return false
    }

    if (price === "" || Number(price) < 0) {
      alert("Completa un precio válido.")
      return false
    }

    if (oldPrice !== "" && Number(oldPrice) < 0) {
      alert("El precio anterior no puede ser negativo.")
      return false
    }

    if (!colors.length) {
      alert("Agrega al menos un color.")
      return false
    }

    for (const color of colors) {
      if (!color.name.trim()) {
        alert("Completa el nombre de cada color.")
        return false
      }

      if (!color.sizes.some((item) => item.enabled)) {
        alert(`Selecciona al menos una talla para ${color.name}.`)
        return false
      }

      if (
        color.sizes.some(
          (item) =>
            item.enabled &&
            (item.stock === "" ||
              !Number.isInteger(Number(item.stock)) ||
              Number(item.stock) < 0)
        )
      ) {
        alert(`Revisa el stock de las tallas del color ${color.name}.`)
        return false
      }
    }

    return true
  }

  const buildVariants = () => {
    const variants = []

    colors.forEach((color) => {
      color.sizes.forEach((item) => {
        if (!item.enabled) return

        variants.push({
          size: item.size,
          color: color.name.trim(),
          color_hex: color.hex || "#777777",
          color_image_url: color.images?.[0] || null,
          stock: Math.max(0, Number(item.stock) || 0),
        })
      })
    })

    return variants
  }

  const saveVariantImages = async (variants) => {
    for (const variant of variants) {
      const colorData = colors.find(
        (color) => color.name.trim() === variant.color
      )

      if (!colorData) continue

      const images = [...new Set(colorData.images || [])]

      if (!images.length) continue

      const rows = images.map((imageUrl, index) => ({
        variant_id: variant.id,
        image_url: imageUrl,
        position: index,
      }))

      const { error } = await supabase
        .from("product_variant_images")
        .insert(rows)

      if (error) throw error
    }
  }

  const createProduct = async () => {
    const slug = `${generateSlug(name)}-${Date.now()}`
    const variants = buildVariants()

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        slug,
        category,
        subcategory: subcategory.trim(),
        price: Number(price),
        old_price: oldPrice ? Number(oldPrice) : null,
        is_new: isNew,
        is_best_seller: isBestSeller,
        is_active: true,
        description: description.trim() || null,
      })
      .select()
      .single()

    if (productError) throw productError

    const { data: insertedVariants, error: variantsError } =
      await supabase
        .from("product_variants")
        .insert(
          variants.map((variant) => ({
            ...variant,
            product_id: product.id,
          }))
        )
        .select()

    if (variantsError) {
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id)

      throw variantsError
    }

    await saveVariantImages(insertedVariants || [])
  }

  const updateProduct = async () => {
    const variants = buildVariants()

    const { error: productError } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        category,
        subcategory: subcategory.trim(),
        price: Number(price),
        old_price: oldPrice ? Number(oldPrice) : null,
        is_new: isNew,
        is_best_seller: isBestSeller,
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId)

    if (productError) throw productError

    const { data: existingVariants, error: readError } =
      await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", editingId)

    if (readError) throw readError

    const variantIds = (existingVariants || []).map(
      (variant) => variant.id
    )

    if (variantIds.length) {
      const { error } = await supabase
        .from("product_variant_images")
        .delete()
        .in("variant_id", variantIds)

      if (error) throw error
    }

    const { error: deleteError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", editingId)

    if (deleteError) throw deleteError

    const { data: insertedVariants, error: insertError } =
      await supabase
        .from("product_variants")
        .insert(
          variants.map((variant) => ({
            ...variant,
            product_id: editingId,
          }))
        )
        .select()

    if (insertError) throw insertError

    await saveVariantImages(insertedVariants || [])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) return

    setSaving(true)

    try {
      const savedCategory = category

      if (editingId) {
        await updateProduct()
        alert("Producto actualizado correctamente.")
      } else {
        await createProduct()
        alert("Producto guardado correctamente.")
      }

      await loadProducts()
      resetForm()
      navigate("category", null, true, savedCategory)
    } catch (error) {
      console.error("Error guardando producto:", error)
      alert(error.message || "No se pudo guardar el producto.")
    } finally {
      setSaving(false)
    }
  }

  const toggleProductVisibility = async (product) => {
    const newStatus = !product.is_active

    const { error } = await supabase
      .from("products")
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)

    if (error) {
      alert(error.message)
      return
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? { ...item, is_active: newStatus }
          : item
      )
    )
  }

  const deleteProduct = async (product) => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente "${product.name}"?`
      )
    ) {
      return
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)

    if (error) {
      alert(error.message)
      return
    }

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    )
  }

  const getProductImage = (product) => {
    for (const variant of product.product_variants || []) {
      const images = (variant.product_variant_images || [])
        .slice()
        .sort(
          (a, b) => (a.position || 0) - (b.position || 0)
        )

      if (images[0]?.image_url) return images[0].image_url
      if (variant.color_image_url) return variant.color_image_url
    }

    return ""
  }

  const visibleProducts = products.filter(
    (product) => product.category === filterCategory
  )

  const groupedSubcategories = Object.values(
    visibleProducts.reduce((groups, product) => {
      const label = normalizeSubcategory(product.subcategory)
      const key = label.toLowerCase()

      if (!groups[key]) {
        groups[key] = {
          key,
          label,
          products: [],
        }
      }

      groups[key].products.push(product)

      return groups
    }, {})
  ).sort((a, b) => a.label.localeCompare(b.label, "es"))

  const selectedGroup = groupedSubcategories.find(
    (group) => group.key === selectedSubcategory
  )

  const categoryCount = (categoryId) =>
    products.filter(
      (product) => product.category === categoryId
    ).length

  const ProductCard = ({ product }) => {
    const image = getProductImage(product)

    return (
      <article
        className={`${cardClass} w-full min-w-0 overflow-hidden`}
      >
        <button
          type="button"
          onClick={() => startEditing(product)}
          className="block aspect-[3/4] w-full overflow-hidden bg-[#121019]"
          aria-label={`Editar ${product.name}`}
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain transition duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[#81798e]">
              Sin fotografía
            </div>
          )}
        </button>

        <div className="flex flex-col gap-3 p-4 text-center">
          <h2 className="line-clamp-2 min-h-9 break-words text-xs font-semibold">
            {product.name}
          </h2>

          <button
            type="button"
            onClick={() =>
              toggleProductVisibility(product)
            }
            className="w-full rounded-lg border border-[#76509a] px-3 py-2.5 text-xs font-semibold text-[#b993ff] transition hover:bg-[#2a1d3e]"
          >
            {product.is_active ? "Ocultar" : "Mostrar"}
          </button>

          <button
            type="button"
            onClick={() => deleteProduct(product)}
            className="w-full rounded-lg border border-red-900 px-3 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-950"
          >
            Eliminar
          </button>
        </div>
      </article>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] w-full items-center justify-center bg-[#0f0d15] px-6 text-[#81798e]">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#0f0d15] px-4 py-10 text-[#eee9f5] sm:px-8 sm:py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12">
        {view === "list" && (
          <>
            <header className="mx-auto w-full max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b993ff]">
                GMISH COLLECTION
              </p>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                Productos
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#91889d]">
                Selecciona una categoría para administrar tus
                prendas.
              </p>
            </header>

            <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
              {[
                { id: "hombre", label: "HOMBRE" },
                { id: "mujer", label: "MUJER" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      "category",
                      null,
                      false,
                      item.id
                    )
                  }
                  className={`${cardClass} flex min-h-52 w-full flex-col items-center justify-center gap-6 p-8 text-center transition hover:border-[#8b5cf6] hover:bg-[#211c2d]`}
                >
                  <span className="text-lg font-bold tracking-[0.2em]">
                    {item.label}
                  </span>

                  <span className="rounded-full border border-[#76509a] bg-[#291d3b] px-5 py-2.5 text-sm text-[#b993ff]">
                    {categoryCount(item.id)} productos
                  </span>

                  <span className="text-xs text-[#81798e]">
                    Administrar prendas →
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {view === "category" && (
          <div className="flex w-full flex-col items-center gap-12">
            <header className="mx-auto w-full max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b993ff]">
                GMISH COLLECTION
              </p>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                {filterCategory === "hombre"
                  ? "HOMBRE"
                  : "MUJER"}
              </h1>

              <p className="mt-4 text-sm text-[#91889d]">
                {visibleProducts.length} productos registrados
              </p>
            </header>

            <div className="flex w-full justify-center">
              <ProductButton onClick={startNewProduct}>
                + Agregar producto
              </ProductButton>
            </div>

            {!visibleProducts.length ? (
              <div
                className={`${cardClass} mx-auto flex w-full max-w-2xl flex-col items-center gap-6 border-dashed px-8 py-16 text-center`}
              >
                <p className="text-[#91889d]">
                  Todavía no hay productos en esta categoría.
                </p>

                <ProductButton onClick={startNewProduct}>
                  + Registrar primera prenda
                </ProductButton>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-14">
                {groupedSubcategories.map((group) => (
                  <section
                    key={group.key}
                    className="mx-auto w-full"
                  >
                    <div className="mb-7 flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
                      <div>
                        <h2 className="text-xl font-bold">
                          {group.label}
                        </h2>

                        <p className="mt-2 text-xs text-[#81798e]">
                          {group.products.length}{" "}
                          {group.products.length === 1
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
                        className="shrink-0 rounded-lg border border-[#76509a] px-5 py-2.5 text-xs font-semibold text-[#b993ff] transition hover:bg-[#2a1d3e]"
                      >
                        Ver más →
                      </button>
                    </div>

                    <div className="flex w-full snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-6">
                      {group.products.map((product) => (
                        <div
                          key={product.id}
                          className="w-[170px] min-w-[170px] snap-start sm:w-[190px] sm:min-w-[190px]"
                        >
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "subcategory" && (
          <div className="flex w-full flex-col items-center gap-12">
            <header className="mx-auto w-full max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b993ff]">
                {filterCategory === "hombre"
                  ? "HOMBRE"
                  : "MUJER"}
              </p>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                {selectedGroup?.label ||
                  selectedSubcategory}
              </h1>

              <p className="mt-4 text-sm text-[#91889d]">
                {selectedGroup?.products.length || 0}{" "}
                productos registrados
              </p>
            </header>

            <div className="flex w-full justify-center">
              <ProductButton onClick={startNewProduct}>
                + Agregar producto
              </ProductButton>
            </div>

            {!selectedGroup ||
            !selectedGroup.products.length ? (
              <div className="mx-auto py-16 text-center text-[#91889d]">
                No hay productos en esta subcategoría.
              </div>
            ) : (
              <div className="mx-auto grid w-full max-w-6xl grid-cols-2 justify-items-center gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {selectedGroup.products.map((product) => (
                  <div
                    key={product.id}
                    className="w-full max-w-[190px]"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "editor" && (
          <div className="flex w-full flex-col items-center gap-12">
            <header className="mx-auto w-full max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b993ff]">
                GMISH COLLECTION
              </p>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                {editingId
                  ? "Editar producto"
                  : "Agregar producto"}
              </h1>
            </header>

            <form
              onSubmit={handleSubmit}
              className="mx-auto flex w-full max-w-5xl flex-col gap-10"
            >
              <section
                className={`${cardClass} w-full p-7 sm:p-10`}
              >
                <div className="mx-auto w-full max-w-4xl">
                  <h2 className="mb-8 text-center text-xl font-bold">
                    Información general
                  </h2>

                  <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-sm font-medium">
                        Nombre del producto *
                      </label>

                      <input
                        value={name}
                        onChange={(e) =>
                          setName(e.target.value)
                        }
                        placeholder="Ej. Polo Oversize"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-medium">
                        Categoría *
                      </label>

                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value)
                          setFilterCategory(e.target.value)
                        }}
                        className={inputClass}
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
                      <label className="mb-3 block text-sm font-medium">
                        Subcategoría *
                      </label>

                      <input
                        value={subcategory}
                        onChange={(e) =>
                          setSubcategory(e.target.value)
                        }
                        placeholder="Ej. Polos, pantalones, tops"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-sm font-medium">
                          Precio (S/) *
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) =>
                            setPrice(e.target.value)
                          }
                          className={inputClass}
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-medium">
                          Precio anterior
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={oldPrice}
                          onChange={(e) =>
                            setOldPrice(e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5 rounded-2xl border border-[#342c45] bg-[#121019] px-6 py-6 sm:col-span-2">
                      <label className="flex cursor-pointer items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={isNew}
                          onChange={(e) =>
                            setIsNew(e.target.checked)
                          }
                          className="h-4 w-4 accent-purple-700"
                        />

                        Mostrar como nuevo
                      </label>

                      <label className="flex cursor-pointer items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={isBestSeller}
                          onChange={(e) =>
                            setIsBestSeller(
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 accent-purple-700"
                        />

                        Mostrar como más vendido
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-3 block text-sm font-medium">
                        Descripción
                      </label>

                      <textarea
                        rows={5}
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value)
                        }
                        placeholder="Detalles de la prenda..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section
                className={`${cardClass} w-full p-7 sm:p-10`}
              >
                <div className="mb-10 flex flex-col items-center gap-6 text-center">
                  <div>
                    <h2 className="text-xl font-bold">
                      Colores, fotos y stock
                    </h2>

                    <p className="mt-2 text-sm text-[#91889d]">
                      Configura cada color, sus fotografías y
                      las tallas disponibles.
                    </p>
                  </div>

                  <ProductButton onClick={addColor}>
                    + Agregar color
                  </ProductButton>
                </div>

                {!colors.length && (
                  <div className="rounded-xl border border-dashed border-[#454052] p-10 text-center text-sm text-[#91889d]">
                    Sin colores.
                  </div>
                )}

                <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
                  {colors.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className="rounded-2xl border border-[#342c45] bg-[#121019] p-6 sm:p-8"
                    >
                      <div className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-[#b993ff]">
                            Variante
                          </p>

                          <h3 className="mt-2 font-bold">
                            Color {colorIndex + 1}
                            {color.name
                              ? ` · ${color.name}`
                              : ""}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeColor(colorIndex)
                          }
                          className="rounded-lg border border-red-900 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-950"
                        >
                          Eliminar color
                        </button>
                      </div>

                      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
                        <div>
                          <label className="mb-3 block text-sm font-medium">
                            Nombre del color *
                          </label>

                          <input
                            value={color.name}
                            onChange={(e) =>
                              updateColor(
                                colorIndex,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Ej. Negro"
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-3 block text-sm font-medium">
                            Color de referencia
                          </label>

                          <div className="flex min-h-12 items-center gap-4 rounded-xl border border-[#342c45] bg-[#17151f] p-2">
                            <input
                              type="color"
                              value={color.hex}
                              onChange={(e) =>
                                updateColor(
                                  colorIndex,
                                  "hex",
                                  e.target.value
                                )
                              }
                              className="h-10 w-12 cursor-pointer border-0 bg-transparent"
                            />

                            <span className="text-sm text-[#91889d]">
                              {color.hex}
                            </span>
                          </div>
                        </div>
                      </div>

                      <input
                        ref={(element) => {
                          fileInputRefs.current[colorIndex] =
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

                      <div className="mt-10 border-t border-[#29233a] pt-8">
                        <div className="mb-7 flex flex-col items-center gap-5 text-center">
                          <div>
                            <h4 className="font-semibold">
                              Fotografías
                            </h4>

                            <p className="mt-2 text-xs text-[#71687e]">
                              La primera fotografía será la
                              principal.
                            </p>
                          </div>

                          <ProductButton
                            onClick={() =>
                              fileInputRefs.current[
                                colorIndex
                              ]?.click()
                            }
                            disabled={
                              uploadingImage === colorIndex
                            }
                          >
                            {uploadingImage === colorIndex
                              ? "Subiendo..."
                              : "+ Agregar fotos"}
                          </ProductButton>
                        </div>

                        {!color.images?.length ? (
                          <div className="rounded-xl border border-dashed border-[#454052] bg-[#17151f] p-10 text-center text-sm text-[#91889d]">
                            Sin fotografías.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 justify-items-center gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                            {color.images.map(
                              (
                                imageUrl,
                                imageIndex
                              ) => (
                                <div
                                  key={`${imageUrl}-${imageIndex}`}
                                  className="w-full max-w-[220px] overflow-hidden rounded-xl border border-[#342c45] bg-[#17151f]"
                                >
                                  <div className="relative aspect-[3/4] bg-[#121019]">
                                    <img
                                      src={imageUrl}
                                      alt={`${
                                        color.name ||
                                        "Prenda"
                                      } foto ${
                                        imageIndex + 1
                                      }`}
                                      className="h-full w-full object-contain"
                                    />

                                    <span className="absolute left-2 top-2 rounded-full bg-[#0f0d15]/95 px-2 py-1 text-xs font-semibold">
                                      {imageIndex === 0
                                        ? "Principal"
                                        : `Foto ${
                                            imageIndex + 1
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
                                      aria-label="Quitar foto"
                                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white transition hover:bg-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>

                                  {imageIndex > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const images = [
                                          ...color.images,
                                        ]

                                        const [selected] =
                                          images.splice(
                                            imageIndex,
                                            1
                                          )

                                        images.unshift(
                                          selected
                                        )

                                        setColors(
                                          (current) =>
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
                                      className="w-full border-t border-[#342c45] px-3 py-3 text-xs font-semibold text-[#b993ff] transition hover:bg-[#2a1d3e]"
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

                      <div className="mt-10 border-t border-[#29233a] pt-8">
                        <div className="mb-7 text-center">
                          <h4 className="font-semibold">
                            Tallas y stock
                          </h4>

                          <p className="mt-2 text-xs text-[#71687e]">
                            Activa solamente las tallas que
                            tengas disponibles.
                          </p>
                        </div>

                        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                          {color.sizes.map(
                            (sizeItem, sizeIndex) => (
                              <div
                                key={sizeItem.size}
                                className={`rounded-xl border p-5 ${
                                  sizeItem.enabled
                                    ? "border-[#76509a] bg-[#211a2e]"
                                    : "border-[#342c45] bg-[#17151f]"
                                }`}
                              >
                                <label className="flex cursor-pointer items-center justify-center gap-3 font-semibold">
                                  <input
                                    type="checkbox"
                                    checked={
                                      sizeItem.enabled
                                    }
                                    onChange={(e) =>
                                      updateColorSize(
                                        colorIndex,
                                        sizeIndex,
                                        "enabled",
                                        e.target.checked
                                      )
                                    }
                                    className="h-4 w-4 accent-purple-700"
                                  />

                                  Talla {sizeItem.size}
                                </label>

                                <label className="mb-3 mt-5 block text-center text-xs text-[#91889d]">
                                  Unidades disponibles
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={sizeItem.stock}
                                  onChange={(e) =>
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
                                  className={`${inputClass} text-center disabled:opacity-40`}
                                />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex w-full justify-center border-t border-[#29233a] pt-8">
                <button
                  type="submit"
                  disabled={
                    saving || uploadingImage !== null
                  }
                  className="inline-flex min-h-12 w-full max-w-md items-center justify-center rounded-xl bg-[#7c3aed] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-50"
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