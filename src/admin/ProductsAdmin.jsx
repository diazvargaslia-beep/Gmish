import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function ProductsAdmin() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [name, setName] = useState("")
  const [category, setCategory] = useState("hombre")
  const [subcategory, setSubcategory] = useState("polos")
  const [price, setPrice] = useState("")
  const [oldPrice, setOldPrice] = useState("")
  const [description, setDescription] = useState("")
  const [isNew, setIsNew] = useState(true)

  const [sizes, setSizes] = useState(["S", "M"])
  const [colors, setColors] = useState(["Negro"])
  const [stock, setStock] = useState({
    "S-Negro": 0,
    "M-Negro": 0,
  })

  const subcategories =
    category === "hombre"
      ? ["polos", "pantalones"]
      : ["tops", "conjuntos", "vestidos", "pantalones", "zapatos"]

  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"]

  const loadProducts = async () => {
    setLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleCategoryChange = (value) => {
    setCategory(value)

    if (value === "hombre") {
      setSubcategory("polos")
    } else {
      setSubcategory("tops")
    }
  }

  const createStockKey = (size, color) => {
    return `${size}-${color}`
  }

  const updateStock = (size, color, value) => {
    const key = createStockKey(size, color)

    setStock((current) => ({
      ...current,
      [key]: Number(value),
    }))
  }

  const toggleSize = (size) => {
    setSizes((current) => {
      if (current.includes(size)) {
        return current.filter((item) => item !== size)
      }

      return [...current, size]
    })
  }

  const addColor = () => {
    const color = window.prompt("Escribe el nombre del color:")

    if (!color) {
      return
    }

    const cleanColor = color.trim()

    if (!cleanColor) {
      return
    }

    const exists = colors.some(
      (item) => item.toLowerCase() === cleanColor.toLowerCase()
    )

    if (exists) {
      return
    }

    setColors((current) => [...current, cleanColor])

    setStock((current) => {
      const updated = { ...current }

      sizes.forEach((size) => {
        updated[createStockKey(size, cleanColor)] = 0
      })

      return updated
    })
  }

  const removeColor = (color) => {
    if (colors.length === 1) {
      return
    }

    setColors((current) =>
      current.filter((item) => item !== color)
    )

    setStock((current) => {
      const updated = { ...current }

      sizes.forEach((size) => {
        delete updated[createStockKey(size, color)]
      })

      return updated
    })
  }

  const resetForm = () => {
    setName("")
    setCategory("hombre")
    setSubcategory("polos")
    setPrice("")
    setOldPrice("")
    setDescription("")
    setIsNew(true)

    setSizes(["S", "M"])
    setColors(["Negro"])

    setStock({
      "S-Negro": 0,
      "M-Negro": 0,
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setError("")
    resetForm()
  }

  const handleSave = async (event) => {
    event.preventDefault()

    setSaving(true)
    setError("")
    setSuccess("")

    const cleanName = name.trim()

    if (!cleanName) {
      setError("Escribe el nombre del producto.")
      setSaving(false)
      return
    }

    if (!price || Number(price) < 0) {
      setError("Escribe un precio válido.")
      setSaving(false)
      return
    }

    if (sizes.length === 0) {
      setError("Selecciona al menos una talla.")
      setSaving(false)
      return
    }

    if (colors.length === 0) {
      setError("Agrega al menos un color.")
      setSaving(false)
      return
    }

    const slugBase = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const slug = `${slugBase}-${Date.now()}`

    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        name: cleanName,
        slug,
        category,
        subcategory,
        price: Number(price),
        old_price: oldPrice
          ? Number(oldPrice)
          : null,
        is_new: isNew,
        is_active: true,
        description: description.trim() || null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    const variants = []

    sizes.forEach((size) => {
      colors.forEach((color) => {
        variants.push({
          product_id: product.id,
          size,
          color,
          stock: Number(
            stock[createStockKey(size, color)] || 0
          ),
        })
      })
    })

    const { error: variantsError } = await supabase
      .from("product_variants")
      .insert(variants)

    if (variantsError) {
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id)

      setError(
        `El producto no pudo guardar sus variantes: ${variantsError.message}`
      )

      setSaving(false)
      return
    }

    setSuccess("Producto guardado correctamente.")

    resetForm()
    setShowForm(false)

    await loadProducts()

    setSaving(false)
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-xl font-bold">
            Catálogo
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Administra las prendas de tu tienda.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setSuccess("")
              setError("")
            }}
            className="rounded-xl bg-[#F0D58A] px-4 py-3 font-bold text-black transition hover:brightness-110"
          >
            + Agregar producto
          </button>
        )}

      </div>

      {success && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-[#302E28] bg-[#151714] p-5 md:p-7"
        >

          <div className="mb-6">
            <h2 className="text-2xl font-black">
              Nuevo producto
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Completa la información de la prenda y su inventario.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Nombre del producto
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ej. Camisa Mónaco"
                required
                className="w-full rounded-xl border border-[#302E28] bg-[#0D0F0C] px-4 py-3 text-white outline-none transition focus:border-[#F0D58A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Género
              </label>

              <select
                value={category}
                onChange={(event) =>
                  handleCategoryChange(event.target.value)
                }
                className="w-full rounded-xl border border-[#302E28] bg-[#0D0F0C] px-4 py-3 text-white outline-none focus:border-[#F0D58A]"
              >
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Categoría
              </label>

              <select
                value={subcategory}
                onChange={(event) =>
                  setSubcategory(event.target.value)
                }
                className="w-full rounded-xl border border-[#302E28] bg-[#0D0F0C] px-4 py-3 text-white outline-none focus:border-[#F0D58A]"
              >
                {subcategories.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Precio
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="0.00"
                required
                className="w-full rounded-xl border border-[#302E28] bg-[#0D0F0C] px-4 py-3 text-white outline-none focus:border-[#F0D58A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Precio anterior
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={oldPrice}
                onChange={(event) =>
                  setOldPrice(event.target.value)
                }
                placeholder="Opcional"
                className="w-full rounded-xl border border-[#302E28] bg-[#0D0F0C] px-4 py-3 text-white outline-none focus:border-[#F0D58A]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Descripción
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe brevemente el producto..."
                rows="4"
                className="w-full resize-none rounded-xl border border-[#302E28] bg-[#0D0F0C] px-4 py-3 text-white outline-none focus:border-[#F0D58A]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-semibold">
                Tallas disponibles
              </label>

              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const selected = sizes.includes(size)

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        selected
                          ? "border-[#F0D58A] bg-[#F0D58A] text-black"
                          : "border-[#302E28] bg-[#0D0F0C] text-gray-300 hover:border-[#F0D58A]"
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-4">

                <div>
                  <label className="block text-sm font-semibold">
                    Colores
                  </label>

                  <p className="mt-1 text-xs text-gray-500">
                    Agrega todos los colores disponibles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addColor}
                  className="rounded-xl border border-[#F0D58A] px-4 py-2 text-sm font-bold text-[#F0D58A] transition hover:bg-[#F0D58A] hover:text-black"
                >
                  + Agregar color
                </button>

              </div>

              <div className="flex flex-wrap gap-2">

                {colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-2 rounded-xl border border-[#302E28] bg-[#0D0F0C] px-3 py-2"
                  >
                    <span className="text-sm">
                      {color}
                    </span>

                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="text-xs text-gray-500 hover:text-red-400"
                        aria-label={`Eliminar ${color}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

              </div>
            </div>

            <div className="md:col-span-2">

              <div className="mb-3">
                <h3 className="text-sm font-semibold">
                  Stock por talla y color
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Indica cuántas unidades tienes de cada combinación.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#302E28]">

                <table className="w-full min-w-[500px] text-sm">

                  <thead className="bg-[#0D0F0C]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-400">
                        Talla
                      </th>

                      {colors.map((color) => (
                        <th
                          key={color}
                          className="px-4 py-3 text-left font-semibold text-gray-400"
                        >
                          {color}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>

                    {sizes.map((size) => (
                      <tr
                        key={size}
                        className="border-t border-[#302E28]"
                      >
                        <td className="px-4 py-3 font-bold text-[#F0D58A]">
                          {size}
                        </td>

                        {colors.map((color) => {
                          const key = createStockKey(
                            size,
                            color
                          )

                          return (
                            <td
                              key={color}
                              className="px-4 py-3"
                            >
                              <input
                                type="number"
                                min="0"
                                value={stock[key] ?? 0}
                                onChange={(event) =>
                                  updateStock(
                                    size,
                                    color,
                                    event.target.value
                                  )
                                }
                                className="w-24 rounded-lg border border-[#302E28] bg-[#0D0F0C] px-3 py-2 text-white outline-none focus:border-[#F0D58A]"
                              />
                            </td>
                          )
                        })}

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-3">

                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(event) =>
                    setIsNew(event.target.checked)
                  }
                  className="h-5 w-5 accent-[#F0D58A]"
                />

                <span className="font-semibold">
                  Marcar como novedad
                </span>

              </label>

              <p className="ml-8 mt-1 text-sm text-gray-500">
                Aparecerá en la sección de novedades de GMISH.
              </p>
            </div>

          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[#302E28] pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-[#302E28] px-5 py-3 font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#F0D58A] px-5 py-3 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : "Guardar producto"}
            </button>

          </div>

        </form>
      )}

      {!showForm && loading && (
        <div className="rounded-2xl border border-[#302E28] bg-[#151714] p-8 text-center text-gray-400">
          Cargando productos...
        </div>
      )}

      {!showForm && !loading && products.length === 0 && (
        <div className="rounded-2xl border border-[#302E28] bg-[#151714] p-8 text-center">

          <p className="text-lg font-semibold">
            Todavía no hay productos.
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Usa “Agregar producto” para comenzar tu catálogo.
          </p>

        </div>
      )}

      {!showForm && !loading && products.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">

          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-[#302E28] bg-[#151714] p-5"
            >

              <div className="flex items-start justify-between gap-4">

                <div>
                  <h3 className="text-lg font-bold">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm capitalize text-gray-400">
                    {product.category} · {product.subcategory}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    product.is_active
                      ? "bg-green-400/10 text-green-300"
                      : "bg-red-400/10 text-red-300"
                  }`}
                >
                  {product.is_active
                    ? "Activo"
                    : "Inactivo"}
                </span>

              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#302E28] pt-4">

                <div>
                  <p className="text-xs text-gray-500">
                    Precio
                  </p>

                  <p className="text-xl font-black text-[#F0D58A]">
                    S/ {Number(product.price).toFixed(2)}
                  </p>
                </div>

                {product.old_price && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Antes
                    </p>

                    <p className="text-sm text-gray-400 line-through">
                      S/ {Number(product.old_price).toFixed(2)}
                    </p>
                  </div>
                )}

              </div>

              <div className="mt-4 flex gap-2">

                {product.is_new && (
                  <span className="rounded-lg bg-[#F0D58A]/10 px-3 py-1 text-xs font-semibold text-[#F0D58A]">
                    Nuevo
                  </span>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  )
}

export default ProductsAdmin
