import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

const DEFAULT_SIZES = ["S", "M", "L", "XL"]

function ProductsAdmin() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const [name, setName] = useState("")
  const [category, setCategory] = useState("hombre")
  const [subcategory, setSubcategory] = useState("")
  const [price, setPrice] = useState("")
  const [oldPrice, setOldPrice] = useState("")
  const [description, setDescription] = useState("")
  const [isNew, setIsNew] = useState(false)

  const [colors, setColors] = useState([])

  const fileInputRefs = useRef({})

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
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
      .order("created_at", {
        ascending: false,
      })

    if (error) {
      console.error("Error cargando productos:", error)
      alert(error.message)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  const generateSlug = (value) => {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const createEmptyColor = () => ({
    name: "",
    hex: "#777777",
    imageUrl: "",
    images: [],
    sizes: DEFAULT_SIZES.map((size) => ({
      size,
      stock: "",
      enabled: false,
    })),
  })

  const addColor = () => {
    setColors((currentColors) => [
      ...currentColors,
      createEmptyColor(),
    ])
  }

  const removeColor = (colorIndex) => {
    setColors((currentColors) =>
      currentColors.filter(
        (_, index) => index !== colorIndex
      )
    )
  }

  const updateColor = (colorIndex, field, value) => {
    setColors((currentColors) =>
      currentColors.map((color, index) =>
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
    setColors((currentColors) =>
      currentColors.map((color, index) => {
        if (index !== colorIndex) {
          return color
        }

        return {
          ...color,
          sizes: color.sizes.map(
            (sizeItem, currentSizeIndex) =>
              currentSizeIndex === sizeIndex
                ? {
                    ...sizeItem,
                    [field]: value,
                  }
                : sizeItem
          ),
        }
      })
    )
  }

  const uploadColorImages = async (colorIndex, event) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) {
      return
    }

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/")
    )

    if (invalidFile) {
      alert("Selecciona solamente archivos de imagen.")
      return
    }

    try {
      setUploadingImage(colorIndex)

      const uploadedImages = []

      for (const file of files) {
        const extension =
          file.name.split(".").pop()?.toLowerCase() || "png"

        const safeName = generateSlug(
          name || "producto"
        )

        const uniqueName =
          `${safeName}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}.${extension}`

        const filePath = `products/${uniqueName}`

        const { error: uploadError } =
          await supabase.storage
            .from("product-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            })

        if (uploadError) {
          throw uploadError
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath)

        const publicUrl =
          publicUrlData?.publicUrl

        if (!publicUrl) {
          throw new Error(
            "No se pudo obtener la URL pública de una imagen."
          )
        }

        uploadedImages.push(publicUrl)
      }

      setColors((currentColors) =>
        currentColors.map((color, index) => {
          if (index !== colorIndex) {
            return color
          }

          const currentImages = color.images || []

          return {
            ...color,
            images: [
              ...currentImages,
              ...uploadedImages,
            ],
            imageUrl:
              color.imageUrl ||
              uploadedImages[0] ||
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

      if (fileInputRefs.current[colorIndex]) {
        fileInputRefs.current[colorIndex].value = ""
      }
    }
  }

  const removeColorImage = (
    colorIndex,
    imageIndex
  ) => {
    setColors((currentColors) =>
      currentColors.map((color, index) => {
        if (index !== colorIndex) {
          return color
        }

        const newImages = (
          color.images || []
        ).filter(
          (_, currentIndex) =>
            currentIndex !== imageIndex
        )

        return {
          ...color,
          images: newImages,
          imageUrl:
            newImages[0] || "",
        }
      })
    )
  }

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setCategory("hombre")
    setSubcategory("")
    setPrice("")
    setOldPrice("")
    setDescription("")
    setIsNew(false)
    setColors([])
  }

  const startEditing = (product) => {
    const groupedColors = {}

    product.product_variants?.forEach((variant) => {
      if (!groupedColors[variant.color]) {
        const variantImages =
          (variant.product_variant_images || [])
            .sort(
              (a, b) =>
                (a.position || 0) -
                (b.position || 0)
            )
            .map(
              (image) => image.image_url
            )

        const fallbackImages =
          variant.color_image_url
            ? [variant.color_image_url]
            : []

        const allImages =
          variantImages.length > 0
            ? variantImages
            : fallbackImages

        groupedColors[variant.color] = {
          name: variant.color,
          hex:
            variant.color_hex ||
            "#777777",
          imageUrl:
            allImages[0] || "",
          images: allImages,
          sizes: DEFAULT_SIZES.map(
            (size) => ({
              size,
              stock: "",
              enabled: false,
            })
          ),
        }
      }

      const sizeItem =
        groupedColors[
          variant.color
        ].sizes.find(
          (item) =>
            item.size === variant.size
        )

      if (sizeItem) {
        sizeItem.enabled = true
        sizeItem.stock =
          variant.stock
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
    setIsNew(Boolean(product.is_new))
    setColors(
      Object.values(groupedColors)
    )

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
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

    if (!price) {
      alert("Completa el precio.")
      return false
    }

    if (colors.length === 0) {
      alert("Agrega al menos un color.")
      return false
    }

    for (const color of colors) {
      if (!color.name.trim()) {
        alert(
          "Completa el nombre de cada color."
        )
        return false
      }

      const hasSize =
        color.sizes.some(
          (sizeItem) =>
            sizeItem.enabled
        )

      if (!hasSize) {
        alert(
          `Selecciona al menos una talla para el color ${color.name}.`
        )
        return false
      }
    }

    return true
  }

  const buildVariants = () => {
    const variants = []

    colors.forEach((color) => {
      color.sizes.forEach((sizeItem) => {
        if (!sizeItem.enabled) {
          return
        }

        variants.push({
          size: sizeItem.size,
          color: color.name.trim(),
          color_hex:
            color.hex || "#777777",
          color_image_url:
            color.images?.[0] ||
            color.imageUrl?.trim() ||
            null,
          stock:
            Number(sizeItem.stock) || 0,
        })
      })
    })

    return variants
  }

  const saveVariantImages = async (
    productId,
    variants
  ) => {
    for (const variant of variants) {
      const colorData = colors.find(
        (color) =>
          color.name.trim() ===
          variant.color
      )

      if (!colorData) {
        continue
      }

      const images =
        colorData.images || []

      if (images.length === 0) {
        continue
      }

      const uniqueImages = [
        ...new Set(images),
      ]

      const rows =
        uniqueImages.map(
          (imageUrl, index) => ({
            variant_id:
              variant.id,
            image_url: imageUrl,
            position: index,
          })
        )

      const {
        error,
      } = await supabase
        .from(
          "product_variant_images"
        )
        .insert(rows)

      if (error) {
        throw error
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

    const variantsToInsert =
      variants.map(
        (variant) => ({
          ...variant,
          product_id: product.id,
        })
      )

    const {
      data: insertedVariants,
      error: variantsError,
    } = await supabase
      .from("product_variants")
      .insert(
        variantsToInsert
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
      product.id,
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
      error: deleteImagesError,
    } = await supabase
      .from(
        "product_variant_images"
      )
      .delete()
      .in(
        "variant_id",
        (
          await supabase
            .from(
              "product_variants"
            )
            .select("id")
            .eq(
              "product_id",
              editingId
            )
        ).data?.map(
          (variant) =>
            variant.id
        ) || []
      )

    if (
      deleteImagesError &&
      !deleteImagesError.message
        ?.toLowerCase()
        .includes("no rows")
    ) {
      throw deleteImagesError
    }

    const {
      error: deleteVariantsError,
    } = await supabase
      .from("product_variants")
      .delete()
      .eq(
        "product_id",
        editingId
      )

    if (deleteVariantsError) {
      throw deleteVariantsError
    }

    const variantsToInsert =
      variants.map(
        (variant) => ({
          ...variant,
          product_id: editingId,
        })
      )

    const {
      data: insertedVariants,
      error: variantsError,
    } = await supabase
      .from("product_variants")
      .insert(
        variantsToInsert
      )
      .select()

    if (variantsError) {
      throw variantsError
    }

    await saveVariantImages(
      editingId,
      insertedVariants || []
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
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

      resetForm()
      await loadProducts()
    } catch (error) {
      console.error(
        "Error guardando producto:",
        error
      )

      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleProductVisibility =
    async (product) => {
      const newStatus =
        !product.is_active

      const { error } =
        await supabase
          .from("products")
          .update({
            is_active: newStatus,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            product.id
          )

      if (error) {
        console.error(
          "Error cambiando visibilidad:",
          error
        )

        alert(error.message)
        return
      }

      setProducts(
        (currentProducts) =>
          currentProducts.map(
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

  const deleteProduct = async (
    product
  ) => {
    const confirmed =
      window.confirm(
        "¿Eliminar este producto definitivamente?"
      )

    if (!confirmed) {
      return
    }

    const { error } =
      await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          product.id
        )

    if (error) {
      console.error(
        "Error eliminando producto:",
        error
      )

      alert(error.message)
      return
    }

    setProducts(
      (currentProducts) =>
        currentProducts.filter(
          (item) =>
            item.id !==
            product.id
        )
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F0C] p-6 text-white">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0F0C] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F0D58A]">
            Productos
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Administra los productos de GMISH.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#302E28] bg-[#151714] p-5"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingId
                  ? "Editar producto"
                  : "Nuevo producto"}
              </h2>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Nombre
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Nombre del producto"
                  className="w-full rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2.5 outline-none focus:border-[#F0D58A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Categoría
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2.5 outline-none"
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
                <label className="mb-2 block text-sm text-gray-300">
                  Subcategoría
                </label>

                <input
                  type="text"
                  value={subcategory}
                  onChange={(event) =>
                    setSubcategory(
                      event.target.value
                    )
                  }
                  placeholder="Subcategoría"
                  className="w-full rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2.5 outline-none focus:border-[#F0D58A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Precio
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(
                        event.target.value
                      )
                    }
                    placeholder="Precio"
                    className="w-full rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Precio anterior
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={oldPrice}
                    onChange={(event) =>
                      setOldPrice(
                        event.target.value
                      )
                    }
                    placeholder="Precio anterior"
                    className="w-full rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Descripción
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Descripción"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2.5 outline-none"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(event) =>
                    setIsNew(
                      event.target.checked
                    )
                  }
                />

                Marcar como novedad
              </label>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">
                    Colores
                  </h3>

                  <button
                    type="button"
                    onClick={addColor}
                    className="rounded-lg border border-[#F0D58A] px-3 py-2 text-sm text-[#F0D58A]"
                  >
                    + Agregar color
                  </button>
                </div>

                {colors.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#302E28] p-5 text-center text-sm text-gray-500">
                    Agrega un color
                  </div>
                )}

                <div className="space-y-4">
                  {colors.map(
                    (
                      color,
                      colorIndex
                    ) => (
                      <div
                        key={
                          colorIndex
                        }
                        className="rounded-xl border border-[#302E28] p-4"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span className="font-semibold">
                            Color
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeColor(
                                colorIndex
                              )
                            }
                            className="text-sm text-red-400"
                          >
                            Eliminar
                          </button>
                        </div>

                        <div className="space-y-3">
                          <input
                            type="text"
                            value={
                              color.name
                            }
                            onChange={(
                              event
                            ) =>
                              updateColor(
                                colorIndex,
                                "name",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Nombre del color"
                            className="w-full rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2.5 outline-none"
                          />

                          <div className="flex items-center gap-3 rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2">
                            <input
                              type="color"
                              value={
                                color.hex
                              }
                              onChange={(
                                event
                              ) =>
                                updateColor(
                                  colorIndex,
                                  "hex",
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="h-10 w-12 cursor-pointer border-0 bg-transparent"
                              title="Seleccionar color"
                            />

                            <span className="text-sm text-gray-400">
                              Seleccionar color
                            </span>
                          </div>

                          <div className="space-y-3">
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
                              onChange={(
                                event
                              ) =>
                                uploadColorImages(
                                  colorIndex,
                                  event
                                )
                              }
                              className="hidden"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                fileInputRefs.current[
                                  colorIndex
                                ]?.click()
                              }
                              disabled={
                                uploadingImage ===
                                colorIndex
                              }
                              className="w-full rounded-lg border border-[#F0D58A]/60 px-3 py-2.5 text-sm font-semibold text-[#F0D58A] transition hover:bg-[#F0D58A]/10 disabled:opacity-50"
                            >
                              {uploadingImage ===
                              colorIndex
                                ? "Subiendo imágenes..."
                                : "📷 Agregar fotos"}
                            </button>

                            {color.images?.length >
                              0 && (
                              <div className="rounded-xl border border-[#302E28] bg-[#111210] p-3">
                                <p className="mb-3 text-xs text-gray-500">
                                  Fotos de este color
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                  {color.images.map(
                                    (
                                      imageUrl,
                                      imageIndex
                                    ) => (
                                      <div
                                        key={
                                          imageUrl
                                        }
                                        className="relative overflow-hidden rounded-lg border border-[#302E28] bg-[#0D0F0C]"
                                      >
                                        <img
                                          src={
                                            imageUrl
                                          }
                                          alt={`${color.name || "Color"} ${imageIndex + 1}`}
                                          className="h-40 w-full object-contain"
                                        />

                                        <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                                          {imageIndex +
                                            1}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeColorImage(
                                              colorIndex,
                                              imageIndex
                                            )
                                          }
                                          className="absolute right-2 top-2 rounded-full bg-red-600/90 px-2 py-1 text-xs font-bold text-white"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                  Puedes subir varias fotos del mismo color: frente, espalda, lateral, etc.
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="mb-2 text-sm text-gray-400">
                              Tallas y stock
                            </p>

                            <div className="space-y-2">
                              {color.sizes.map(
                                (
                                  sizeItem,
                                  sizeIndex
                                ) => (
                                  <div
                                    key={
                                      sizeItem.size
                                    }
                                    className="flex items-center gap-3"
                                  >
                                    <label className="flex w-14 items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={
                                          sizeItem.enabled
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          updateColorSize(
                                            colorIndex,
                                            sizeIndex,
                                            "enabled",
                                            event
                                              .target
                                              .checked
                                          )
                                        }
                                      />

                                      {
                                        sizeItem.size
                                      }
                                    </label>

                                    <input
                                      type="number"
                                      min="0"
                                      value={
                                        sizeItem.stock
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateColorSize(
                                          colorIndex,
                                          sizeIndex,
                                          "stock",
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      disabled={
                                        !sizeItem.enabled
                                      }
                                      placeholder="Stock"
                                      className="flex-1 rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2 text-sm outline-none disabled:opacity-40"
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#F0D58A] px-4 py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Guardar producto"}
              </button>
            </div>
          </form>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Productos registrados
              </h2>

              <span className="text-sm text-gray-400">
                {products.length} productos
              </span>
            </div>

            <div className="space-y-3">
              {products.length ===
              0 ? (
                <div className="rounded-2xl border border-[#302E28] bg-[#151714] p-6 text-center text-gray-400">
                  No hay productos registrados.
                </div>
              ) : (
                products.map(
                  (product) => (
                    <div
                      key={
                        product.id
                      }
                      className={`rounded-2xl border p-4 ${
                        product.is_active
                          ? "border-[#302E28] bg-[#151714]"
                          : "border-red-900/40 bg-[#17100F]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {
                                product.name
                              }
                            </h3>

                            {!product.is_active && (
                              <span className="rounded-full bg-red-900/40 px-2 py-1 text-xs text-red-300">
                                Oculto
                              </span>
                            )}

                            {product.is_new && (
                              <span className="rounded-full bg-[#F0D58A]/20 px-2 py-1 text-xs text-[#F0D58A]">
                                Nuevo
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-gray-400">
                            {
                              product.category
                            }{" "}
                            ·{" "}
                            {
                              product.subcategory
                            }
                          </p>

                          <p className="mt-2 font-semibold text-[#F0D58A]">
                            S/{" "}
                            {Number(
                              product.price
                            ).toFixed(
                              2
                            )}
                          </p>

                          {product
                            .product_variants
                            ?.length >
                            0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {[
                                ...new Set(
                                  product.product_variants.map(
                                    (
                                      variant
                                    ) =>
                                      variant.color
                                  )
                                ),
                              ].map(
                                (
                                  color
                                ) => (
                                  <span
                                    key={
                                      color
                                    }
                                    className="rounded-full border border-[#302E28] px-3 py-1 text-xs text-gray-300"
                                  >
                                    {
                                      color
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                product
                              )
                            }
                            className="rounded-lg border border-[#F0D58A]/50 px-3 py-2 text-sm font-semibold text-[#F0D58A] hover:bg-[#F0D58A]/10"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleProductVisibility(
                                product
                              )
                            }
                            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                              product.is_active
                                ? "border border-red-500/40 text-red-300 hover:bg-red-900/20"
                                : "border border-green-500/40 text-green-300 hover:bg-green-900/20"
                            }`}
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
                            className="rounded-lg border border-red-900/50 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductsAdmin