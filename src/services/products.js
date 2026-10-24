import { supabase } from "../lib/supabase";

export async function getProducts() {
  try {
    // 1. Productos activos
    const {
      data: products,
      error: productsError,
    } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", {
        ascending: false,
      });

    if (productsError) {
      console.error(
        "Error cargando products:",
        productsError
      );

      throw productsError;
    }

    if (!products || products.length === 0) {
      console.log("No hay productos activos.");
      return [];
    }

    const productIds = products.map(
      (product) => product.id
    );

    // 2. Variantes
    const {
      data: variants,
      error: variantsError,
    } = await supabase
      .from("product_variants")
      .select(`
        id,
        product_id,
        size,
        color,
        color_hex,
        color_image_url,
        stock
      `)
      .in("product_id", productIds);

    if (variantsError) {
      console.error(
        "Error cargando product_variants:",
        variantsError
      );

      throw variantsError;
    }

    // 3. Imágenes de variantes
    const variantIds = (variants || []).map(
      (variant) => variant.id
    );

    let variantImages = [];

    if (variantIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("product_variant_images")
        .select(`
          id,
          variant_id,
          image_url,
          position
        `)
        .in("variant_id", variantIds);

      if (error) {
        console.error(
          "Error cargando product_variant_images:",
          error
        );

        throw error;
      }

      variantImages = data || [];
    }

    // 4. Imágenes generales de productos
    const {
      data: productImages,
      error: productImagesError,
    } = await supabase
      .from("product_images")
      .select(`
        id,
        product_id,
        image_url,
        position
      `)
      .in("product_id", productIds);

    if (productImagesError) {
      console.error(
        "Error cargando product_images:",
        productImagesError
      );

      throw productImagesError;
    }

    // 5. Promociones
    const {
      data: promotions,
      error: promotionsError,
    } = await supabase
      .from("promotions")
      .select(`
        id,
        product_id,
        type,
        discount_percent,
        special_price,
        quantity_required,
        starts_at,
        ends_at,
        is_active
      `)
      .in("product_id", productIds);

    if (promotionsError) {
      console.error(
        "Error cargando promotions:",
        promotionsError
      );

      throw promotionsError;
    }

    // 6. Agrupar imágenes por variante
    const imagesByVariant = {};

    (variantImages || []).forEach((image) => {
      if (!imagesByVariant[image.variant_id]) {
        imagesByVariant[image.variant_id] = [];
      }

      imagesByVariant[image.variant_id].push(image);
    });

    // 7. Agrupar variantes por producto
    const variantsByProduct = {};

    (variants || []).forEach((variant) => {
      const variantCompleta = {
        ...variant,
        product_variant_images:
          imagesByVariant[variant.id] || [],
      };

      if (!variantsByProduct[variant.product_id]) {
        variantsByProduct[variant.product_id] = [];
      }

      variantsByProduct[variant.product_id].push(
        variantCompleta
      );
    });

    // 8. Agrupar imágenes generales por producto
    const imagesByProduct = {};

    (productImages || []).forEach((image) => {
      if (!imagesByProduct[image.product_id]) {
        imagesByProduct[image.product_id] = [];
      }

      imagesByProduct[image.product_id].push(image);
    });

    // 9. Agrupar promociones por producto
    const promotionsByProduct = {};

    (promotions || []).forEach((promotion) => {
      if (!promotionsByProduct[promotion.product_id]) {
        promotionsByProduct[promotion.product_id] = [];
      }

      promotionsByProduct[promotion.product_id].push(
        promotion
      );
    });

    // 10. Reconstruir la estructura que espera la tienda
    const resultado = products.map((product) => ({
      ...product,

      product_variants:
        variantsByProduct[product.id] || [],

      product_images:
        imagesByProduct[product.id] || [],

      promotions:
        promotionsByProduct[product.id] || [],
    }));

    console.log(
      "Productos cargados correctamente:",
      resultado
    );

    return resultado;
  } catch (error) {
    console.error(
      "Error general cargando productos:",
      error
    );

    throw error;
  }
}