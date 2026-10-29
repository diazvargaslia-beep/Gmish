import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

const SIZES = ["S", "M", "L", "XL"]

const inputClass =
  "w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/[0.05]"

const cardClass =
  "rounded-[30px] border border-neutral-200 bg-white shadow-[0_14px_50px_rgba(0,0,0,0.045)]"

const buttonClass =
  "inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-neutral-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"

const secondaryButtonClass =
  "inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"

const productTileClass =
  "h-[340px] w-full overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-[0_6px_20px_rgba(0,0,0,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] sm:h-[360px]"

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
    accesorio: "Accesorios",
    accesorios: "Accesorios",
    otro: "Otros",
    otros: "Otros",
  }

  if (aliases[normalized]) {
    return aliases[normalized]
  }

  return (
    normalized
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ") || "Sin subcategoría"
  )
}

function generateSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function createEmptyColor() {
  return {
    localId:
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

    name: "",
    hex: "#777777",
    images: [],

    sizes: SIZES.map((size) => ({
      size,
      stock: "",
      variantId: null,
    })),
  }
}

function SectionHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 md:text-4xl">
        {title}
      </h2>

      {description && (
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-500 md:text-base">
          {description}
        </p>
      )}
    </div>
  )
}

function ToggleCard({
  checked,
  onChange,
  title,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`group w-full rounded-2xl border p-5 text-left transition ${
        checked
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white hover:border-neutral-400"
      }`}
    >
      <div className="flex items-center justify-between gap-5">
        <p className="text-sm font-semibold">
          {title}
        </p>

        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            checked
              ? "bg-white"
              : "bg-neutral-200"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full transition ${
              checked
                ? "left-6 bg-neutral-950"
                : "left-1 bg-white shadow-sm"
            }`}
          />
        </span>
      </div>
    </button>
  )
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] =
    useState(null)

  const [view, setView] = useState("list")
  const [filterCategory, setFilterCategory] =
    useState("hombre")
  const [selectedSubcategory, setSelectedSubcategory] =
    useState("")
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] =
    useState("hombre")
  const [subcategory, setSubcategory] =
    useState("")
  const [price, setPrice] = useState("")
  const [oldPrice, setOldPrice] =
    useState("")
  const [isNew, setIsNew] = useState(false)
  const [isBestSeller, setIsBestSeller] =
    useState(false)
  const [colors, setColors] = useState([])

  const [selectedPhoto, setSelectedPhoto] =
    useState(null)

  const fileInputRefs = useRef({})

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state || {}

      setView(
        state.productsAdminView ||
          "list"
      )

      setFilterCategory(
        state.productsAdminCategory ||
          "hombre"
      )

      setSelectedSubcategory(
        state.productsAdminSubcategory ||
          ""
      )

      window.scrollTo({
        top: 0,
        behavior: "auto",
      })
    }

    window.addEventListener(
      "popstate",
      handlePopState
    )

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      )
    }
  }, [])

  function navigate(
    nextView,
    nextSubcategory = "",
    replace = false,
    nextCategory = filterCategory
  ) {
    const state = {
      ...window.history.state,
      adminSection: "productos",
      productsAdminView: nextView,
      productsAdminCategory:
        nextCategory,
      productsAdminSubcategory:
        nextSubcategory,
    }

    if (replace) {
      window.history.replaceState(
        state,
        ""
      )
    } else {
      window.history.pushState(
        state,
        ""
      )
    }

    setView(nextView)
    setFilterCategory(nextCategory)
    setSelectedSubcategory(
      nextSubcategory
    )

    window.scrollTo({
      top: 0,
      behavior: "auto",
    })
  }

  async function loadProducts() {
    setLoading(true)

    try {
      const {
        data: productRows,
        error: productError,
      } = await supabase
        .from("products")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (productError) {
        throw productError
      }

      if (!productRows?.length) {
        setProducts([])
        return
      }

      const productIds =
        productRows.map(
          (product) => product.id
        )

      const {
        data: variantRows,
        error: variantError,
      } = await supabase
        .from("product_variants")
        .select(
          "id, product_id, size, color, color_hex, color_image_url, stock, sku"
        )
        .in(
          "product_id",
          productIds
        )

      if (variantError) {
        throw variantError
      }

      const variantIds =
        (variantRows || []).map(
          (variant) => variant.id
        )

      let imageRows = []

      if (variantIds.length) {
        const {
          data,
          error,
        } = await supabase
          .from(
            "product_variant_images"
          )
          .select(
            "id, variant_id, image_url, position"
          )
          .in(
            "variant_id",
            variantIds
          )
          .order("position", {
            ascending: true,
          })

        if (error) {
          throw error
        }

        imageRows = data || []
      }

      const variants =
        (variantRows || []).map(
          (variant) => ({
            ...variant,
            product_variant_images:
              imageRows.filter(
                (image) =>
                  image.variant_id ===
                  variant.id
              ),
          })
        )

      setProducts(
        productRows.map(
          (product) => ({
            ...product,
            product_variants:
              variants.filter(
                (variant) =>
                  variant.product_id ===
                  product.id
              ),
          })
        )
      )
    } catch (error) {
      console.error(
        "Error cargando productos:",
        error
      )

      alert(
        error?.message ||
          "No se pudieron cargar los productos."
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm(
    nextCategory = filterCategory
  ) {
    setEditingId(null)
    setName("")
    setDescription("")
    setCategory(nextCategory)
    setSubcategory("")
    setPrice("")
    setOldPrice("")
    setIsNew(false)
    setIsBestSeller(false)
    setColors([createEmptyColor()])
    setSelectedPhoto(null)
  }

  function startNewProduct() {
    resetForm(filterCategory)

    navigate(
      "editor",
      "",
      false,
      filterCategory
    )
  }

  function addColor() {
    setColors((current) => [
      ...current,
      createEmptyColor(),
    ])
  }

  function removeColor(index) {
    setColors((current) =>
      current.filter(
        (_, colorIndex) =>
          colorIndex !== index
      )
    )

    setSelectedPhoto(null)
  }

  function moveColor(
    index,
    direction
  ) {
    setColors((current) => {
      const targetIndex =
        index + direction

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current
      }

      const next = [...current]

      const [selected] =
        next.splice(index, 1)

      next.splice(
        targetIndex,
        0,
        selected
      )

      return next
    })

    setSelectedPhoto(null)
  }

  function updateColor(
    index,
    field,
    value
  ) {
    setColors((current) =>
      current.map(
        (color, colorIndex) =>
          colorIndex === index
            ? {
                ...color,
                [field]: value,
              }
            : color
      )
    )
  }

  async function pickColorWithEyeDropper(
    colorIndex
  ) {
    if (
      typeof window === "undefined" ||
      !("EyeDropper" in window)
    ) {
      alert(
        "Tu navegador no tiene cuentagotas. Puedes usar el círculo de color para elegirlo manualmente."
      )
      return
    }

    try {
      const eyeDropper =
        new window.EyeDropper()

      const result =
        await eyeDropper.open()

      if (result?.sRGBHex) {
        updateColor(
          colorIndex,
          "hex",
          result.sRGBHex
        )
      }
    } catch (error) {
      if (
        error?.name !==
        "AbortError"
      ) {
        console.error(
          "Error usando el cuentagotas:",
          error
        )

        alert(
          "No se pudo seleccionar el color."
        )
      }
    }
  }

  function updateStock(
    colorIndex,
    sizeIndex,
    value
  ) {
    setColors((current) =>
      current.map(
        (color, currentColor) => {
          if (
            currentColor !==
            colorIndex
          ) {
            return color
          }

          return {
            ...color,
            sizes: color.sizes.map(
              (
                size,
                currentSize
              ) =>
                currentSize ===
                sizeIndex
                  ? {
                      ...size,
                      stock:
                        value === ""
                          ? ""
                          : Math.max(
                              0,
                              Number.parseInt(
                                value,
                                10
                              ) || 0
                            ),
                    }
                  : size
            ),
          }
        }
      )
    )
  }

  function selectPhoto(
    colorIndex,
    imageIndex
  ) {
    setSelectedPhoto(
      (current) => {
        if (
          current?.colorIndex ===
            colorIndex &&
          current?.imageIndex ===
            imageIndex
        ) {
          return null
        }

        return {
          colorIndex,
          imageIndex,
        }
      }
    )
  }

  function setMainImage(
    colorIndex,
    imageIndex
  ) {
    setColors((current) =>
      current.map(
        (color, index) => {
          if (
            index !== colorIndex
          ) {
            return color
          }

          const images = [
            ...(color.images || []),
          ]

          if (!images[imageIndex]) {
            return color
          }

          const selected =
            images.splice(
              imageIndex,
              1
            )[0]

          images.unshift(selected)

          return {
            ...color,
            images,
          }
        }
      )
    )

    setSelectedPhoto(null)
  }

  function removeImage(
    colorIndex,
    imageIndex
  ) {
    setColors((current) =>
      current.map(
        (color, index) => {
          if (
            index !== colorIndex
          ) {
            return color
          }

          return {
            ...color,
            images: (
              color.images || []
            ).filter(
              (_, imageIndexCurrent) =>
                imageIndexCurrent !==
                imageIndex
            ),
          }
        }
      )
    )

    setSelectedPhoto(null)
  }

  async function uploadImages(
    colorIndex,
    event
  ) {
    const files = Array.from(
      event.target.files || []
    )

    if (!files.length) {
      return
    }

    try {
      setUploadingImage(colorIndex)

      const uploaded = []

      for (const file of files) {
        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          continue
        }

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg"

        const filename =
          `${generateSlug(
            name || "producto"
          )}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}.${extension}`

        const path =
          `products/${filename}`

        const {
          error,
        } = await supabase.storage
          .from("product-images")
          .upload(
            path,
            file,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                file.type,
            }
          )

        if (error) {
          throw error
        }

        const {
          data,
        } = supabase.storage
          .from(
            "product-images"
          )
          .getPublicUrl(path)

        if (data?.publicUrl) {
          uploaded.push(
            data.publicUrl
          )
        }
      }

      setColors((current) =>
        current.map(
          (color, index) =>
            index === colorIndex
              ? {
                  ...color,
                  images: [
                    ...(color.images ||
                      []),
                    ...uploaded,
                  ],
                }
              : color
        )
      )
    } catch (error) {
      console.error(
        "Error subiendo imágenes:",
        error
      )

      alert(
        error?.message ||
          "No se pudieron subir las imágenes."
      )
    } finally {
      setUploadingImage(null)

      if (event.target) {
        event.target.value = ""
      }
    }
  }

  function startEditing(product) {
    const grouped = {}

    for (const variant of
      product.product_variants ||
      []) {
      const colorName =
        variant.color ||
        "Sin nombre"

      if (!grouped[colorName]) {
        const images = (
          variant
            .product_variant_images ||
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

        grouped[colorName] = {
          localId:
            `${Date.now()}-${Math.random()}`,
          name: colorName,
          hex:
            variant.color_hex ||
            "#777777",
          images: [
            ...new Set(
              images.length
                ? images
                : variant.color_image_url
                  ? [
                      variant.color_image_url,
                    ]
                  : []
            ),
          ],
          sizes:
            SIZES.map(
              (size) => ({
                size,
                stock: "",
                variantId:
                  null,
              })
            ),
        }
      }

      const size = grouped[
        colorName
      ].sizes.find(
        (item) =>
          item.size ===
          variant.size
      )

      if (size) {
        size.stock =
          variant.stock ?? 0
        size.variantId =
          variant.id
      }
    }

    setEditingId(product.id)
    setName(product.name || "")
    setDescription(
      product.description || ""
    )
    setCategory(
      product.category ||
        filterCategory
    )
    setSubcategory(
      product.subcategory ||
        ""
    )
    setPrice(
      product.price ?? ""
    )
    setOldPrice(
      product.old_price ?? ""
    )
    setIsNew(
      Boolean(product.is_new)
    )
    setIsBestSeller(
      Boolean(
        product.is_best_seller
      )
    )
    setColors(
      Object.values(grouped).length
        ? Object.values(grouped)
        : [createEmptyColor()]
    )
    setSelectedPhoto(null)

    navigate(
      "editor",
      "",
      false,
      product.category ||
        filterCategory
    )
  }

  function validateForm() {
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
        "Ingresa un precio válido."
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

    if (
      oldPrice !== "" &&
      Number(oldPrice) <=
        Number(price)
    ) {
      alert(
        "El precio anterior debe ser mayor que el precio actual."
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
          "Todos los colores necesitan un nombre."
        )
        return false
      }

      const hasStock =
        color.sizes.some(
          (size) =>
            Number(
              size.stock || 0
            ) > 0
        )

      if (!hasStock) {
        alert(
          `Agrega stock para ${color.name}.`
        )
        return false
      }

      for (const size of
        color.sizes) {
        if (
          size.stock !== "" &&
          (!Number.isInteger(
            Number(size.stock)
          ) ||
            Number(size.stock) < 0)
        ) {
          alert(
            `El stock de ${color.name} debe ser un número entero.`
          )
          return false
        }
      }
    }

    return true
  }

  function buildVariants() {
    const result = []

    colors.forEach(
      (color, colorIndex) => {
        for (const size of
          color.sizes) {
          if (
            Number(size.stock || 0) <=
            0
          ) {
            continue
          }

          result.push({
            id:
              size.variantId ||
              null,
            size: size.size,
            color:
              color.name.trim(),
            color_hex:
              color.hex ||
              "#777777",
            color_image_url:
              color.images?.[0] ||
              null,
            stock: Number(
              size.stock
            ),
            colorOrder:
              colorIndex,
          })
        }
      }
    )

    return result
  }

  async function saveImages(
    variants
  ) {
    for (const variant of
      variants) {
      if (!variant.id) {
        continue
      }

      const color = colors.find(
        (item) =>
          item.name.trim() ===
          variant.color
      )

      if (!color) {
        continue
      }

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

      if (!color.images?.length) {
        continue
      }

      const rows =
        color.images.map(
          (image, position) => ({
            variant_id:
              variant.id,
            image_url: image,
            position,
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

  async function createProduct() {
    const variants =
      buildVariants()

    const {
      data: product,
      error,
    } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        description:
          description.trim() ||
          null,
        slug: `${generateSlug(
          name
        )}-${Date.now()}`,
        category,
        subcategory:
          subcategory.trim(),
        price: Number(price),
        old_price:
          oldPrice === ""
            ? null
            : Number(oldPrice),
        is_new: isNew,
        is_best_seller:
          isBestSeller,
        is_active: true,
        owner_role: "principal",
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    const {
      data: insertedVariants,
      error:
        variantsError,
    } = await supabase
      .from("product_variants")
      .insert(
        variants.map(
          (variant) => ({
            product_id:
              product.id,
            size: variant.size,
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

    await saveImages(
      insertedVariants ||
        []
    )
  }

  async function updateProduct() {
    const variants =
      buildVariants()

    const {
      error: productError,
    } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        description:
          description.trim() ||
          null,
        category,
        subcategory:
          subcategory.trim(),
        price: Number(price),
        old_price:
          oldPrice === ""
            ? null
            : Number(oldPrice),
        is_new: isNew,
        is_best_seller:
          isBestSeller,
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
      data: existing,
      error: existingError,
    } = await supabase
      .from("product_variants")
      .select(
        "id, product_id, size, color, color_hex, color_image_url, stock"
      )
      .eq(
        "product_id",
        editingId
      )

    if (existingError) {
      throw existingError
    }

    const existingVariants =
      existing || []

    function variantKey(
      size,
      color
    ) {
      return `${String(size || "")
        .trim()
        .toLowerCase()}::${String(color || "")
        .trim()
        .toLowerCase()}`
    }

    const existingByKey =
      new Map()

    for (const existingVariant of
      existingVariants) {
      existingByKey.set(
        variantKey(
          existingVariant.size,
          existingVariant.color
        ),
        existingVariant
      )
    }

    const incomingKeys =
      new Set()

    for (const variant of variants) {
      const key = variantKey(
        variant.size,
        variant.color
      )

      if (incomingKeys.has(key)) {
        throw new Error(
          `La variante "${variant.color} - talla ${variant.size}" está repetida dentro de este producto.`
        )
      }

      incomingKeys.add(key)
    }

    for (const variant of variants) {
      const key = variantKey(
        variant.size,
        variant.color
      )

      const existingByCombination =
        existingByKey.get(key)

      if (
        !variant.id &&
        existingByCombination
      ) {
        variant.id =
          existingByCombination.id
      }
    }

    for (const variant of variants) {
      if (!variant.id) {
        continue
      }

      const {
        error: variantError,
      } = await supabase
        .from("product_variants")
        .update({
          size: variant.size,
          color: variant.color,
          color_hex:
            variant.color_hex,
          color_image_url:
            variant.color_image_url,
          stock: variant.stock,
        })
        .eq(
          "id",
          variant.id
        )
        .eq(
          "product_id",
          editingId
        )

      if (variantError) {
        throw variantError
      }
    }

    const newVariants =
      variants.filter(
        (variant) => !variant.id
      )

    if (newVariants.length) {
      const rowsToInsert =
        newVariants.map(
          (variant) => ({
            product_id:
              editingId,
            size: variant.size,
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

      const {
        data: inserted,
        error: insertError,
      } = await supabase
        .from("product_variants")
        .upsert(
          rowsToInsert,
          {
            onConflict:
              "product_id,size,color",
          }
        )
        .select()

      if (insertError) {
        throw insertError
      }

      const returnedByKey =
        new Map()

      for (const row of
        inserted || []) {
        returnedByKey.set(
          variantKey(
            row.size,
            row.color
          ),
          row
        )
      }

      for (const variant of
        newVariants) {
        const returned =
          returnedByKey.get(
            variantKey(
              variant.size,
              variant.color
            )
          )

        if (returned?.id) {
          variant.id =
            returned.id
        }
      }
    }

    const incomingIds =
      new Set(
        variants
          .map(
            (variant) =>
              variant.id
          )
          .filter(Boolean)
      )

    const variantsToRemove =
      existingVariants.filter(
        (existingVariant) =>
          !incomingIds.has(
            existingVariant.id
          )
      )

    for (const variant of
      variantsToRemove) {
      const {
        count,
        error: orderError,
      } = await supabase
        .from("order_items")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "variant_id",
          variant.id
        )

      if (orderError) {
        throw orderError
      }

      if ((count || 0) > 0) {
        const {
          error: stockError,
        } = await supabase
          .from(
            "product_variants"
          )
          .update({
            stock: 0,
          })
          .eq(
            "id",
            variant.id
          )

        if (stockError) {
          throw stockError
        }

        continue
      }

      const {
        error: imageDeleteError,
      } = await supabase
        .from(
          "product_variant_images"
        )
        .delete()
        .eq(
          "variant_id",
          variant.id
        )

      if (imageDeleteError) {
        throw imageDeleteError
      }

      const {
        error: deleteError,
      } = await supabase
        .from("product_variants")
        .delete()
        .eq(
          "id",
          variant.id
        )

      if (deleteError) {
        throw deleteError
      }
    }

    await saveImages(variants)
  }

  async function handleSubmit(
    event
  ) {
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
          "Producto creado correctamente."
        )
      }

      await loadProducts()
      resetForm(savedCategory)

      navigate(
        "category",
        "",
        true,
        savedCategory
      )
    } catch (error) {
      console.error(
        "Error guardando producto:",
        error
      )

      alert(
        error?.message ||
          "No se pudo guardar el producto."
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisibility(
    product
  ) {
    const next =
      !product.is_active

    const {
      error,
    } = await supabase
      .from("products")
      .update({
        is_active: next,
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

    setProducts((current) =>
      current.map(
        (item) =>
          item.id === product.id
            ? {
                ...item,
                is_active: next,
              }
            : item
      )
    )
  }

  async function deleteProduct(
    product
  ) {
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
        (variant) => variant.id
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
          "Este producto tiene ventas registradas. No se puede eliminar; puedes ocultarlo."
        )
        return
      }

      const {
        error: imageDeleteError,
      } = await supabase
        .from(
          "product_variant_images"
        )
        .delete()
        .in(
          "variant_id",
          variantIds
        )

      if (imageDeleteError) {
        alert(
          imageDeleteError.message
        )
        return
      }

      const {
        error:
          variantsError,
      } = await supabase
        .from(
          "product_variants"
        )
        .delete()
        .in(
          "id",
          variantIds
        )

      if (variantsError) {
        alert(
          variantsError.message
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

    setProducts((current) =>
      current.filter(
        (item) =>
          item.id !== product.id
      )
    )
  }

  function getColorImages(product) {
    const result = []
    const seen = new Set()

    for (const variant of
      product.product_variants ||
      []) {
      const color =
        String(
          variant.color || ""
        ).trim()

      if (
        !color ||
        seen.has(color)
      ) {
        continue
      }

      const images = (
        variant
          .product_variant_images ||
        []
      )
        .slice()
        .sort(
          (a, b) =>
            (a.position || 0) -
            (b.position || 0)
        )

      const image =
        images[0]?.image_url ||
        variant.color_image_url ||
        ""

      if (image) {
        result.push({
          color,
          image,
        })
      }

      seen.add(color)
    }

    return result
  }

  const visibleProducts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return products
        .filter(
          (product) =>
            product.category ===
            filterCategory
        )
        .filter((product) => {
          if (!query) {
            return true
          }

          return [
            product.name,
            product.subcategory,
            product.description,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query)
            )
        })
    }, [
      products,
      filterCategory,
      search,
    ])

  const groupedSubcategories =
    useMemo(() => {
      const groups = {}

      for (const product of
        visibleProducts) {
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

        groups[key].products.push(
          product
        )
      }

      return Object.values(
        groups
      ).sort((a, b) =>
        a.label.localeCompare(
          b.label,
          "es"
        )
      )
    }, [visibleProducts])

  const selectedGroup =
    groupedSubcategories.find(
      (group) =>
        group.key ===
        selectedSubcategory
    )

  function ProductCard({
    product,
  }) {
    const images =
      getColorImages(product)

    const [
      currentImage,
      setCurrentImage,
    ] = useState(0)

    const pointerStartX =
      useRef(null)

    const pointerStartY =
      useRef(null)

    const pointerMoved =
      useRef(false)

    const suppressClick =
      useRef(false)

    useEffect(() => {
      setCurrentImage(0)
      pointerStartX.current = null
      pointerStartY.current = null
      pointerMoved.current = false
      suppressClick.current = false
    }, [product.id])

    function previous(event) {
      event.preventDefault()
      event.stopPropagation()

      if (images.length < 2) {
        return
      }

      setCurrentImage(
        (current) =>
          current === 0
            ? images.length - 1
            : current - 1
      )
    }

    function next(event) {
      event.preventDefault()
      event.stopPropagation()

      if (images.length < 2) {
        return
      }

      setCurrentImage(
        (current) =>
          current ===
          images.length - 1
            ? 0
            : current + 1
      )
    }

    function handlePointerDown(
      event
    ) {
      if (images.length < 2) {
        return
      }

      pointerStartX.current =
        event.clientX

      pointerStartY.current =
        event.clientY

      pointerMoved.current =
        false

      suppressClick.current =
        false
    }

    function handlePointerMove(
      event
    ) {
      if (
        pointerStartX.current ===
          null ||
        pointerStartY.current ===
          null ||
        images.length < 2
      ) {
        return
      }

      const differenceX =
        event.clientX -
        pointerStartX.current

      const differenceY =
        event.clientY -
        pointerStartY.current

      if (
        Math.abs(differenceX) > 12 &&
        Math.abs(differenceX) >
          Math.abs(differenceY)
      ) {
        pointerMoved.current =
          true
      }
    }

    function handlePointerUp(
      event
    ) {
      if (
        pointerStartX.current ===
          null ||
        images.length < 2
      ) {
        return
      }

      const differenceX =
        event.clientX -
        pointerStartX.current

      const differenceY =
        event.clientY -
        pointerStartY.current

      const horizontalSwipe =
        Math.abs(differenceX) >
          45 &&
        Math.abs(differenceX) >
          Math.abs(differenceY)

      if (horizontalSwipe) {
        suppressClick.current =
          true

        if (differenceX < 0) {
          setCurrentImage(
            (current) =>
              (current + 1) %
              images.length
          )
        } else {
          setCurrentImage(
            (current) =>
              (current -
                1 +
                images.length) %
              images.length
          )
        }
      }

      pointerStartX.current =
        null

      pointerStartY.current =
        null

      pointerMoved.current =
        false

      if (horizontalSwipe) {
        window.setTimeout(() => {
          suppressClick.current =
            false
        }, 120)
      }
    }

    function handlePointerCancel() {
      pointerStartX.current =
        null

      pointerStartY.current =
        null

      pointerMoved.current =
        false
    }

    function handleCardClick(
      event
    ) {
      if (suppressClick.current) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      startEditing(product)
    }

    return (
      <article
        className={`${productTileClass} flex flex-col`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(event) => {
            if (
              event.key ===
                "Enter" ||
              event.key === " "
            ) {
              event.preventDefault()
              startEditing(product)
            }
          }}
          className="flex min-h-0 flex-1 cursor-pointer flex-col text-left outline-none"
        >
          <div
            className="group relative min-h-0 flex-1 overflow-hidden bg-[#f7f6f2]"
            style={{
              touchAction: "pan-y",
            }}
            onPointerDown={
              handlePointerDown
            }
            onPointerMove={
              handlePointerMove
            }
            onPointerUp={
              handlePointerUp
            }
            onPointerCancel={
              handlePointerCancel
            }
          >
            {images.length ? (
              <img
                src={
                  images[
                    currentImage
                  ].image
                }
                alt={
                  product.name
                }
                draggable="false"
                className="pointer-events-none h-full w-full select-none object-contain transition duration-300 group-hover:scale-[1.025]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                Sin fotografía
              </div>
            )}

            {(product.is_new ||
              product.is_best_seller) && (
              <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-16px)] flex-wrap gap-1">
                {product.is_new && (
                  <span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] shadow-sm">
                    Nuevo
                  </span>
                )}

                {product.is_best_seller && (
                  <span className="rounded-full bg-white/95 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] shadow-sm">
                    Más vendido
                  </span>
                )}
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  onClick={previous}
                  className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-neutral-900 shadow-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Anterior"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  onClick={next}
                  className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-neutral-900 shadow-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Siguiente"
                >
                  ›
                </button>

                <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-white/90 px-1.5 py-1">
                  {images.map(
                    (_, index) => (
                      <span
                        key={index}
                        className={`h-1 rounded-full transition-all ${
                          index ===
                          currentImage
                            ? "w-2.5 bg-neutral-950"
                            : "w-1 bg-neutral-300"
                        }`}
                      />
                    )
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex min-h-[92px] shrink-0 flex-col justify-center px-3 py-3 text-left sm:px-4">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              {normalizeSubcategory(
                product.subcategory
              )}
            </p>

            <h3 className="mt-1 line-clamp-2 text-[12px] font-semibold leading-4 text-neutral-900 sm:text-[13px]">
              {product.name}
            </h3>

            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-[12px] font-semibold text-neutral-950 sm:text-[13px]">
                S/{" "}
                {Number(
                  product.price
                ).toFixed(2)}
              </span>

              {product.old_price &&
                Number(
                  product.old_price
                ) >
                  Number(
                    product.price
                  ) && (
                  <span className="text-[9px] text-neutral-400 line-through sm:text-[10px]">
                    S/{" "}
                    {Number(
                      product.old_price
                    ).toFixed(2)}
                  </span>
                )}
            </div>
          </div>
        </div>

        <div className="grid h-[42px] shrink-0 grid-cols-2 gap-1.5 border-t border-neutral-100 p-1.5">
          <button
            type="button"
            onClick={() =>
              toggleVisibility(
                product
              )
            }
            className="min-h-7 rounded-lg border border-neutral-200 text-[8px] font-semibold transition hover:bg-neutral-50 sm:text-[9px]"
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
            className="min-h-7 rounded-lg border border-red-200 text-[8px] font-semibold text-red-600 transition hover:bg-red-50 sm:text-[9px]"
          >
            Eliminar
          </button>
        </div>
      </article>
    )
  }

  function AddProductCard() {
    return (
      <button
        type="button"
        onClick={
          startNewProduct
        }
        className={`${productTileClass} flex flex-col items-center justify-center border-dashed bg-white text-center hover:-translate-y-1 hover:border-neutral-500 hover:bg-neutral-50`}
      >
        <span className="text-4xl font-light text-neutral-400">
          +
        </span>

        <span className="mt-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-700 sm:text-[10px]">
          Agregar producto
        </span>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white text-sm text-neutral-500">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="min-h-full w-full bg-white px-4 py-10 text-neutral-900 sm:px-8 sm:py-12 md:px-12 lg:px-16 xl:px-20">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col items-center">
        {view === "list" && (
          <div className="flex w-full flex-col items-center gap-16">
            <SectionHeader
              eyebrow="Catálogo"
              title="Productos"
            />

            <div className="grid w-full max-w-[900px] grid-cols-1 gap-8 md:grid-cols-2">
              {[
                {
                  id: "hombre",
                  label: "HOMBRE",
                },
                {
                  id: "mujer",
                  label: "MUJER",
                },
              ].map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        "category",
                        "",
                        false,
                        item.id
                      )
                    }
                    className="group flex min-h-[260px] flex-col items-center justify-center gap-7 rounded-[28px] border border-neutral-200 bg-white px-10 py-12 text-center shadow-[0_10px_35px_rgba(0,0,0,0.035)] transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_18px_45px_rgba(0,0,0,0.07)]"
                  >
                    <span className="text-xl font-semibold tracking-[0.22em]">
                      {item.label}
                    </span>

                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-5 py-2.5 text-xs font-medium text-neutral-600">
                      {
                        products.filter(
                          (product) =>
                            product.category ===
                            item.id
                        ).length
                      }{" "}
                      productos
                    </span>

                    <span className="text-sm font-medium text-neutral-500 transition group-hover:text-neutral-900">
                      Administrar colección →
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {view === "category" && (
          <div className="flex w-full flex-col items-center gap-14">
            <SectionHeader
              eyebrow="Colección"
              title={
                filterCategory ===
                "hombre"
                  ? "HOMBRE"
                  : "MUJER"
              }
            />

            <div className="flex w-full max-w-[900px] items-center gap-3">
              <div className="shrink-0 text-neutral-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </div>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Buscar producto..."
                className={inputClass}
              />
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 lg:gap-4">
              <AddProductCard />

              {visibleProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>

            {!visibleProducts.length && (
              <div className="flex w-full flex-col items-center py-16 text-center">
                <p className="text-sm text-neutral-500">
                  No hay productos registrados en esta colección.
                </p>
              </div>
            )}
          </div>
        )}

        {view === "subcategory" && (
          <div className="flex w-full flex-col items-center gap-14">
            <SectionHeader
              eyebrow={
                filterCategory ===
                "hombre"
                  ? "HOMBRE"
                  : "MUJER"
              }
              title={
                selectedGroup?.label ||
                selectedSubcategory
              }
            />

            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 lg:gap-4">
              <AddProductCard />

              {selectedGroup?.products?.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>

            {!selectedGroup?.products
              ?.length && (
              <p className="py-20 text-sm text-neutral-500">
                No hay productos en esta subcategoría.
              </p>
            )}
          </div>
        )}

        {view === "editor" && (
          <form
            onSubmit={
              handleSubmit
            }
            className="flex w-full max-w-[1250px] flex-col gap-16"
          >
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
                {editingId
                  ? "Editar producto"
                  : "Nuevo producto"}
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {editingId
                  ? name ||
                    "Editar producto"
                  : "Agregar producto"}
              </h1>

              <span className="mt-6 rounded-full bg-neutral-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                {category ===
                "mujer"
                  ? "MUJER"
                  : "HOMBRE"}
              </span>
            </div>

            <section
              className={`${cardClass} p-5 sm:p-10 lg:p-14`}
            >
              <div className="mx-auto max-w-[900px]">
                <div className="grid grid-cols-2 gap-4 sm:gap-12">
                  <div>
                    <label className="mb-3 block text-xs font-semibold sm:mb-4 sm:text-sm">
                      Nombre del producto
                    </label>

                    <input
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      className={`${inputClass} px-3 py-3 text-xs sm:px-5 sm:py-4 sm:text-sm`}
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-xs font-semibold sm:mb-4 sm:text-sm">
                      Subcategoría
                    </label>

                    <input
                      value={
                        subcategory
                      }
                      onChange={(event) =>
                        setSubcategory(
                          event.target.value
                        )
                      }
                      list="gmish-subcategories"
                      className={`${inputClass} px-3 py-3 text-xs sm:px-5 sm:py-4 sm:text-sm`}
                    />

                    <datalist id="gmish-subcategories">
                      {[
                        ...new Set(
                          products
                            .filter(
                              (product) =>
                                product.category ===
                                category
                            )
                            .map(
                              (product) =>
                                normalizeSubcategory(
                                  product.subcategory
                                )
                            )
                        ),
                      ].map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          />
                        )
                      )}
                    </datalist>
                  </div>
                </div>

                <div className="mt-8 sm:mt-12">
                  <label className="mb-3 block text-xs font-semibold sm:mb-4 sm:text-sm">
                    Descripción
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Describe brevemente el producto, su tela, corte, estilo o características."
                    rows={4}
                    className={`${inputClass} min-h-[120px] resize-y px-3 py-3 text-xs leading-6 sm:px-5 sm:py-4 sm:text-sm`}
                  />
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-16 sm:gap-12">
                  <div>
                    <label className="mb-3 block text-xs font-semibold sm:mb-4 sm:text-sm">
                      Precio actual
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
                      className={`${inputClass} px-3 py-3 text-xs sm:px-5 sm:py-4 sm:text-sm`}
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-xs font-semibold sm:mb-4 sm:text-sm">
                      Precio anterior
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        oldPrice
                      }
                      onChange={(event) =>
                        setOldPrice(
                          event.target.value
                        )
                      }
                      className={`${inputClass} px-3 py-3 text-xs sm:px-5 sm:py-4 sm:text-sm`}
                    />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-16 sm:gap-7">
                  <ToggleCard
                    checked={
                      isBestSeller
                    }
                    onChange={
                      setIsBestSeller
                    }
                    title="Más vendido"
                  />

                  <ToggleCard
                    checked={isNew}
                    onChange={setIsNew}
                    title="Nuevo"
                  />
                </div>
              </div>
            </section>

            <section
              className={`${cardClass} p-5 sm:p-10 lg:p-14`}
            >
              <SectionHeader
                title="Colores y fotografías"
                description="Puedes cambiar el orden de los colores con las flechas."
              />

              <div className="mx-auto mt-10 flex max-w-[1050px] flex-col gap-12 sm:mt-14">
                {colors.map(
                  (
                    color,
                    colorIndex
                  ) => (
                    <div
                      key={
                        color.localId ||
                        colorIndex
                      }
                      className="relative rounded-[26px] border border-neutral-200 bg-[#faf9f6] p-5 pt-16 sm:p-10 sm:pt-20"
                    >
                      <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-6 sm:top-6">
                        <button
                          type="button"
                          onClick={() =>
                            moveColor(
                              colorIndex,
                              -1
                            )
                          }
                          disabled={
                            colorIndex === 0
                          }
                          title="Mover color hacia arriba"
                          aria-label="Mover color hacia arriba"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-lg text-neutral-700 shadow-sm transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveColor(
                              colorIndex,
                              1
                            )
                          }
                          disabled={
                            colorIndex ===
                            colors.length - 1
                          }
                          title="Mover color hacia abajo"
                          aria-label="Mover color hacia abajo"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-lg text-neutral-700 shadow-sm transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>

                      {colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeColor(
                              colorIndex
                            )
                          }
                          className="absolute right-4 top-4 rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50 sm:right-6 sm:top-6 sm:px-4 sm:text-xs"
                        >
                          Eliminar color
                        </button>
                      )}

                      <div className="flex flex-col items-center gap-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-semibold">
                          {String(
                            colorIndex +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-[1fr_190px] sm:gap-7">
                          <div className="text-left">
                            <label className="mb-3 block text-xs font-semibold sm:text-sm">
                              Nombre del color
                            </label>

                            <input
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
                              className={`${inputClass} px-3 py-3 text-xs sm:px-5 sm:py-4 sm:text-sm`}
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <label className="mb-3 block text-xs font-semibold sm:text-sm">
                              Color
                            </label>

                            <div className="flex items-center gap-2 sm:gap-3">
                              <label className="relative flex h-[48px] w-[48px] shrink-0 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-[0_0_0_1px_#d4d4d4] sm:h-[58px] sm:w-[58px]">
                                <input
                                  type="color"
                                  value={
                                    color.hex ||
                                    "#777777"
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
                                  className="absolute inset-[-10px] h-[70px] w-[70px] cursor-pointer opacity-0 sm:h-[80px] sm:w-[80px]"
                                />

                                <span
                                  className="h-full w-full rounded-full"
                                  style={{
                                    backgroundColor:
                                      color.hex ||
                                      "#777777",
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  pickColorWithEyeDropper(
                                    colorIndex
                                  )
                                }
                                title="Tomar color de la pantalla"
                                aria-label="Tomar color de la pantalla"
                                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-5 w-5"
                                >
                                  <path d="m18 2 4 4" />
                                  <path d="m7.5 16.5-5 5" />
                                  <path d="m14 4 6 6" />
                                  <path d="M17 7 7 17l-4 1 1-4L14 4" />
                                  <path d="m13 5 6 6" />
                                </svg>
                              </button>
                            </div>

                            <span className="mt-2 text-[9px] text-neutral-400">
                              {color.hex ||
                                "#777777"}
                            </span>
                          </div>
                        </div>

                        <div className="w-full border-t border-neutral-200 pt-9">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-sm font-semibold">
                              Fotografías
                            </p>

                            <p className="text-xs leading-5 text-neutral-500">
                              Toca una foto para ver sus opciones. La primera imagen es la principal.
                            </p>
                          </div>

                          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4">
                            {(
                              color.images ||
                              []
                            ).map(
                              (
                                image,
                                imageIndex
                              ) => {
                                const isSelected =
                                  selectedPhoto?.colorIndex ===
                                    colorIndex &&
                                  selectedPhoto?.imageIndex ===
                                    imageIndex

                                return (
                                  <div
                                    key={`${image}-${imageIndex}`}
                                    className={`relative aspect-[3/4] overflow-hidden rounded-2xl border-2 bg-white transition ${
                                      isSelected
                                        ? "border-neutral-950 ring-4 ring-neutral-950/10"
                                        : imageIndex ===
                                            0
                                          ? "border-neutral-950"
                                          : "border-neutral-200"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        selectPhoto(
                                          colorIndex,
                                          imageIndex
                                        )
                                      }
                                      className="absolute inset-0 z-10 h-full w-full"
                                      aria-label={`Seleccionar fotografía ${imageIndex + 1}`}
                                    />

                                    <img
                                      src={
                                        image
                                      }
                                      alt={`${color.name} ${imageIndex + 1}`}
                                      className="pointer-events-none h-full w-full object-contain"
                                    />

                                    {imageIndex ===
                                      0 && (
                                      <span className="pointer-events-none absolute left-2 top-2 z-20 rounded-full bg-neutral-950 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-[9px]">
                                        Principal
                                      </span>
                                    )}

                                    {isSelected && (
                                      <div
                                        className="absolute inset-0 z-30 flex items-end bg-black/20 p-2 sm:p-3"
                                        onClick={(
                                          event
                                        ) =>
                                          event.stopPropagation()
                                        }
                                      >
                                        <div className="flex w-full flex-col gap-2">
                                          {imageIndex !==
                                            0 && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setMainImage(
                                                  colorIndex,
                                                  imageIndex
                                                )
                                              }
                                              className="min-h-[38px] rounded-xl bg-white px-2 py-2 text-[9px] font-semibold text-neutral-900 shadow-sm sm:text-[10px]"
                                            >
                                              Usar como principal
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeImage(
                                                colorIndex,
                                                imageIndex
                                              )
                                            }
                                            className="min-h-[38px] rounded-xl bg-white px-2 py-2 text-[9px] font-semibold text-red-600 shadow-sm sm:text-[10px]"
                                          >
                                            Quitar
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setSelectedPhoto(
                                                null
                                              )
                                            }
                                            className="min-h-[34px] rounded-xl bg-neutral-950/90 px-2 py-2 text-[9px] font-semibold text-white shadow-sm sm:text-[10px]"
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPhoto(
                                  null
                                )

                                fileInputRefs.current[
                                  colorIndex
                                ]?.click()
                              }}
                              disabled={
                                uploadingImage ===
                                colorIndex
                              }
                              className="flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white px-2 text-center transition hover:border-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              <span className="text-3xl font-light">
                                +
                              </span>

                              <span className="text-[10px] font-semibold sm:text-xs">
                                {uploadingImage ===
                                colorIndex
                                  ? "Subiendo..."
                                  : "Agregar fotos"}
                              </span>
                            </button>

                            <input
                              ref={(element) => {
                                fileInputRefs.current[
                                  colorIndex
                                ] = element
                              }}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(
                                event
                              ) =>
                                uploadImages(
                                  colorIndex,
                                  event
                                )
                              }
                              className="hidden"
                            />
                          </div>
                        </div>

                        <div className="w-full border-t border-neutral-200 pt-9">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-sm font-semibold">
                              Stock por talla
                            </p>

                            <p className="text-xs text-neutral-500">
                              Las tallas con 0 no se publicarán.
                            </p>
                          </div>

                          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
                            {color.sizes.map(
                              (
                                size,
                                sizeIndex
                              ) => (
                                <div
                                  key={
                                    size.size
                                  }
                                  className="rounded-2xl border border-neutral-200 bg-white p-4 text-center sm:p-5"
                                >
                                  <p className="text-sm font-bold">
                                    {size.size}
                                  </p>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                      size.stock
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateStock(
                                        colorIndex,
                                        sizeIndex,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="0"
                                    className="mt-4 h-12 w-full rounded-xl border border-neutral-200 bg-white text-center text-sm outline-none focus:border-neutral-950"
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

                <button
                  type="button"
                  onClick={
                    addColor
                  }
                  className="mx-auto flex min-h-[58px] w-full max-w-[500px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-sm font-semibold text-neutral-700 transition hover:border-neutral-600 hover:bg-neutral-50"
                >
                  + Agregar otro color
                </button>
              </div>
            </section>

            <div className="mx-auto flex w-full max-w-[700px] flex-col gap-4 pb-8 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  resetForm()

                  navigate(
                    "category",
                    "",
                    false,
                    filterCategory
                  )
                }}
                className={`${secondaryButtonClass} flex-1`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className={`${buttonClass} flex-1`}
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Publicar producto"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}