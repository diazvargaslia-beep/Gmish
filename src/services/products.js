import { supabase } from "../lib/supabase"

export async function getProducts() {
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
      ),
      product_images (
        id,
        image_url,
        position
      ),
      promotions (
        id,
        type,
        discount_percent,
        special_price,
        quantity_required,
        starts_at,
        ends_at,
        is_active
      )
    `)
    .eq("is_active", true)
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    console.error(
      "Error cargando productos:",
      error
    )

    throw error
  }

  return data || []
}