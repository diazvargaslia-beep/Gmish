
import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

const SIZES = ["S", "M", "L", "XL"]

const inputClass =
  "w-full rounded-xl border border-[#303030] bg-[#0d0d0d] px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-[#76509a] focus:ring-2 focus:ring-[#261535]"

function ProductButton({ children, onClick, className = "", disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-50 ${className}`}
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
        const extension = file.name.split(".").pop()?.toLowerCase() || "png"
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
      if (event.target) event.target.value = ""
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

        const allImages = images.length ? [...new Set(images)] : fallbackImages

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

    navigate("editor", null, false, product.category || "hombre")
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

    const { data: insertedVariants, error: variantsError } = await supabase
      .from("product_variants")
      .insert(
        variants.map((variant) => ({
          ...variant,
          product_id: product.id,
        }))
      )
      .select()

    if (variantsError) {
      await supabase.from("products").delete().eq("id", product.id)
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

    const { data: existingVariants, error: readError } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", editingId)

    if (readError) throw readError

    const variantIds = (existingVariants || []).map((variant) => variant.id)

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

    const { data: insertedVariants, error: insertError } = await supabase
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
        item.id === product.id ? { ...item, is_active: newStatus } : item
      )
    )
  }

  const deleteProduct = async (product) => {
    if (!window.confirm(`¿Eliminar definitivamente "${product.name}"?`)) {
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
        .sort((a, b) => (a.position || 0) - (b.position || 0))

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
        groups[key] = { key, label, products: [] }
      }

      groups[key].products.push(product)
      return groups
    }, {})
  ).sort((a, b) => a.label.localeCompare(b.label, "es"))

  const selectedGroup = groupedSubcategories.find(
    (group) => group.key === selectedSubcategory
  )

  const categoryCount = (categoryId) =>
    products.filter((product) => product.category === categoryId).length

  const ProductCard = ({ product }) => {
    const image = getProductImage(product)

    return (
      <article className="w-full min-w-0 overflow-hidden rounded-xl border border-[#303030] bg-[#141414]">
        <button
          type="button"
          onClick={() => startEditing(product)}
          className="block aspect-[3/4] w-full overflow-hidden bg-[#0d0d0d]"
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
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-500">
              Sin fotografía
            </div>
          )}
        </button>

        <div className="flex flex-col gap-1 p-2 text-center">
          <h2 className="line-clamp-2 min-h-8 break-words text-xs font-semibold">
            {product.name}
          </h2>

          <button
            type="button"
            onClick={() => toggleProductVisibility(product)}
            className="w-full rounded-lg border border-[#76509a] px-2 py-2 text-xs font-semibold text-purple-200 transition hover:bg-[#261535]"
          >
            {product.is_active ? "Ocultar" : "Mostrar"}
          </button>

          <button
            type="button"
            onClick={() => deleteProduct(product)}
            className="w-full rounded-lg border border-red-900 px-2 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950"
          >
            Eliminar
          </button>
        </div>
      </article>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#0b0b0b] text-gray-400">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-gray-100 sm:px-7">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col items-center gap-8">
        {view === "list" && (
          <>
            <header className="w-full text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                GMISH COLLECTION
              </p>
              <h1 className="mt-3 text-3xl font-bold">Productos</h1>
              <p className="mt-2 text-sm text-gray-400">
                Selecciona una categoría para administrar tus prendas.
              </p>
            </header>

            <div className="grid w-full max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
              {[
                { id: "hombre", label: "HOMBRE" },
                { id: "mujer", label: "MUJER" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate("category", null, false, item.id)}
                  className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-2xl border border-[#303030] bg-[#141414] p-6 text-center transition hover:border-purple-500 hover:bg-[#19131f]"
                >
                  <span className="text-lg font-bold tracking-widest">
                    {item.label}
                  </span>
                  <span className="rounded-full bg-[#261535] px-4 py-2 text-sm text-purple-200">
                    {categoryCount(item.id)} productos
                  </span>
                  <span className="text-xs text-gray-400">
                    Administrar prendas →
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {view === "category" && (
          <div className="flex w-full flex-col items-center gap-7">
            <header className="w-full text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                GMISH COLLECTION
              </p>
              <h1 className="mt-3 text-2xl font-bold">
                {filterCategory === "hombre" ? "HOMBRE" : "MUJER"}
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                {visibleProducts.length} productos registrados
              </p>
            </header>

            <ProductButton onClick={startNewProduct}>
              + Agregar producto
            </ProductButton>

            {!visibleProducts.length ? (
              <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed border-[#454545] px-5 py-12 text-center">
                <p className="text-gray-400">
                  Todavía no hay productos en esta categoría.
                </p>
                <ProductButton onClick={startNewProduct}>
                  + Registrar primera prenda
                </ProductButton>
              </div>
            ) : (
              <div className="w-full space-y-10">
                {groupedSubcategories.map((group) => (
                  <section key={group.key} className="w-full min-w-0">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold">{group.label}</h2>
                        <p className="mt-1 text-xs text-gray-400">
                          {group.products.length}{" "}
                          {group.products.length === 1
                            ? "producto"
                            : "productos"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate("subcategory", group.key)}
                        className="shrink-0 rounded-lg border border-[#76509a] px-4 py-2 text-xs font-semibold text-purple-200 transition hover:bg-[#261535]"
                      >
                        Ver más →
                      </button>
                    </div>

                    <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
                      {group.products.map((product) => (
                        <div
                          key={product.id}
                          className="w-[155px] min-w-[155px] snap-start sm:w-[175px] sm:min-w-[175px]"
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
          <div className="flex w-full flex-col items-center gap-7">
            <header className="w-full text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                {filterCategory === "hombre" ? "HOMBRE" : "MUJER"}
              </p>
              <h1 className="mt-3 text-2xl font-bold">
                {selectedGroup?.label || selectedSubcategory}
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                {selectedGroup?.products.length || 0} productos registrados
              </p>
            </header>

            <ProductButton onClick={startNewProduct}>
              + Agregar producto
            </ProductButton>

            {!selectedGroup || !selectedGroup.products.length ? (
              <p className="py-12 text-center text-gray-400">
                No hay productos en esta subcategoría.
              </p>
            ) : (
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {selectedGroup.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {view === "editor" && (
          <div className="flex w-full flex-col items-center gap-6">
            <header className="w-full text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                GMISH COLLECTION
              </p>
              <h1 className="mt-3 text-2xl font-bold">
                {editingId ? "Editar producto" : "Agregar producto"}
              </h1>
            </header>

            <form
              onSubmit={handleSubmit}
              className="mx-auto flex w-full max-w-4xl flex-col gap-6"
            >
              <section className="rounded-2xl border border-[#303030] bg-[#141414] p-5 sm:p-7">
                <h2 className="mb-6 text-center text-lg font-bold">
                  Información general
                </h2>

                <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Nombre del producto *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Polo Oversize"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
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
                      <option value="hombre">Hombre</option>
                      <option value="mujer">Mujer</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Subcategoría *
                    </label>
                    <input
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="Ej. Polos, pantalones, tops"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Precio (S/) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Precio anterior
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={oldPrice}
                        onChange={(e) => setOldPrice(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* OPCIONES DE DESTACADO, ENCIMA DE LA DESCRIPCIÓN */}
                  <div className="sm:col-span-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-xl border border-[#303030] bg-[#0d0d0d] px-4 py-4">
                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={isNew}
                        onChange={(e) => setIsNew(e.target.checked)}
                        className="h-4 w-4 accent-purple-700"
                      />
                      Mostrar como nuevo
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={isBestSeller}
                        onChange={(e) => setIsBestSeller(e.target.checked)}
                        className="h-4 w-4 accent-purple-700"
                      />
                      Mostrar como más vendido
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Descripción
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalles de la prenda..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#303030] bg-[#141414] p-5 sm:p-7">
                <div className="mb-6 flex flex-col items-center gap-4 text-center">
                  <h2 className="text-lg font-bold">Colores, fotos y stock</h2>
                  <ProductButton onClick={addColor}>
                    + Agregar color
                  </ProductButton>
                </div>

                {!colors.length && (
                  <div className="rounded-xl border border-dashed border-[#454545] p-8 text-center text-sm text-gray-400">
                    Sin colores.
                  </div>
                )}

                <div className="flex flex-col gap-6">
                  {colors.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className="rounded-2xl border border-[#303030] bg-[#0d0d0d] p-4 sm:p-6"
                    >
                      <div className="mb-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between">
                        <h3 className="font-bold">
                          Color {colorIndex + 1}
                          {color.name ? ` · ${color.name}` : ""}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeColor(colorIndex)}
                          className="rounded-lg border border-red-900 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-950"
                        >
                          Eliminar color
                        </button>
                      </div>

                      <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Nombre del color *
                          </label>
                          <input
                            value={color.name}
                            onChange={(e) =>
                              updateColor(colorIndex, "name", e.target.value)
                            }
                            placeholder="Ej. Negro"
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Color de referencia
                          </label>
                          <div className="flex items-center gap-3 rounded-xl border border-[#303030] bg-[#141414] p-2">
                            <input
                              type="color"
                              value={color.hex}
                              onChange={(e) =>
                                updateColor(colorIndex, "hex", e.target.value)
                              }
                              className="h-10 w-12 cursor-pointer border-0 bg-transparent"
                            />
                            <span className="text-sm text-gray-400">
                              {color.hex}
                            </span>
                          </div>
                        </div>
                      </div>

                      <input
                        ref={(element) => {
                          fileInputRefs.current[colorIndex] = element
                        }}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => uploadColorImages(colorIndex, e)}
                      />

                      <div className="mt-7 border-t border-[#303030] pt-6">
                        <div className="mb-5 flex flex-col items-center gap-4 text-center">
                          <h4 className="font-semibold">Fotografías</h4>
                          <ProductButton
                            onClick={() =>
                              fileInputRefs.current[colorIndex]?.click()
                            }
                            disabled={uploadingImage === colorIndex}
                          >
                            {uploadingImage === colorIndex
                              ? "Subiendo..."
                              : "+ Agregar fotos"}
                          </ProductButton>
                        </div>

                        {!color.images?.length ? (
                          <div className="rounded-xl border border-dashed border-[#454545] bg-[#141414] p-6 text-center text-sm text-gray-400">
                            Sin fotografías.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {color.images.map((imageUrl, imageIndex) => (
                              <div
                                key={`${imageUrl}-${imageIndex}`}
                                className="w-full max-w-[220px] overflow-hidden rounded-xl border border-[#303030] bg-[#141414]"
                              >
                                <div className="relative aspect-[3/4] bg-[#0d0d0d]">
                                  <img
                                    src={imageUrl}
                                    alt={`${color.name || "Prenda"} foto ${imageIndex + 1}`}
                                    className="h-full w-full object-contain"
                                  />
                                  <span className="absolute left-2 top-2 rounded-full bg-[#0b0b0b]/95 px-2 py-1 text-xs font-semibold">
                                    {imageIndex === 0
                                      ? "Principal"
                                      : `Foto ${imageIndex + 1}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeColorImage(colorIndex, imageIndex)
                                    }
                                    aria-label="Quitar foto"
                                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white hover:bg-red-700"
                                  >
                                    ×
                                  </button>
                                </div>

                                {imageIndex > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const images = [...color.images]
                                      const [selected] = images.splice(
                                        imageIndex,
                                        1
                                      )
                                      images.unshift(selected)

                                      setColors((current) =>
                                        current.map((item, index) =>
                                          index === colorIndex
                                            ? {
                                                ...item,
                                                images,
                                                imageUrl: images[0] || "",
                                              }
                                            : item
                                        )
                                      )
                                    }}
                                    className="w-full border-t border-[#303030] px-2 py-3 text-xs font-semibold text-purple-300 hover:bg-[#261535]"
                                  >
                                    Usar como principal
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-7 border-t border-[#303030] pt-6">
                        <h4 className="mb-5 text-center font-semibold">
                          Tallas y stock
                        </h4>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          {color.sizes.map((sizeItem, sizeIndex) => (
                            <div
                              key={sizeItem.size}
                              className={`rounded-xl border p-4 ${
                                sizeItem.enabled
                                  ? "border-[#76509a] bg-[#141414]"
                                  : "border-[#303030] bg-[#1b1b1b]"
                              }`}
                            >
                              <label className="flex cursor-pointer items-center justify-center gap-2 font-semibold">
                                <input
                                  type="checkbox"
                                  checked={sizeItem.enabled}
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

                              <label className="mb-2 mt-4 block text-center text-xs text-gray-400">
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
                                disabled={!sizeItem.enabled}
                                placeholder="Cantidad"
                                className={`${inputClass} text-center disabled:opacity-40`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="sticky bottom-0 z-10 flex w-full items-center justify-center border-t border-[#303030] bg-[#0b0b0b] py-5">
                <button
                  type="submit"
                  disabled={saving || uploadingImage !== null}
                  className="inline-flex w-full max-w-sm items-center justify-center rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-50"
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
