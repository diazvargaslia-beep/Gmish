import { supabase } from "../lib/supabase";

/* =========================================
   OBTENER POSICIÓN NUMÉRICA
   ========================================= */

function obtenerPosicion(
  valor,
  fallback = Number.MAX_SAFE_INTEGER
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return fallback;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : fallback;
}

/* =========================================
   ORDENAR POR POSICIÓN
   ========================================= */

function ordenarPorPosicion(lista = []) {
  return [...lista].sort(
    (a, b) =>
      Number(a?.position ?? 0) -
      Number(b?.position ?? 0)
  );
}

/* =========================================
   ORDENAR PRODUCTOS MANUALMENTE

   1. Respeta product_position.
   2. Los productos sin posición quedan
      después de los que sí tienen posición.
   3. Como respaldo usa created_at.
   ========================================= */

function ordenarProductos(lista = []) {
  return [...lista].sort((a, b) => {
    const posicionA = obtenerPosicion(
      a?.product_position
    );

    const posicionB = obtenerPosicion(
      b?.product_position
    );

    if (posicionA !== posicionB) {
      return posicionA - posicionB;
    }

    const fechaA = new Date(
      a?.created_at || 0
    ).getTime();

    const fechaB = new Date(
      b?.created_at || 0
    ).getTime();

    if (fechaA !== fechaB) {
      return fechaA - fechaB;
    }

    return String(a?.name || "").localeCompare(
      String(b?.name || ""),
      "es",
      {
        sensitivity: "base",
      }
    );
  });
}

/* =========================================
   ORDENAR VARIANTES

   1. Respeta color_position.
   2. Después ordena las tallas dentro
      de cada color.
   ========================================= */

function ordenarVariantes(lista = []) {
  return [...lista].sort((a, b) => {
    const posicionColorA = Number(
      a?.color_position ?? 0
    );

    const posicionColorB = Number(
      b?.color_position ?? 0
    );

    if (
      posicionColorA !==
      posicionColorB
    ) {
      return (
        posicionColorA -
        posicionColorB
      );
    }

    const colorA = String(
      a?.color || ""
    ).trim();

    const colorB = String(
      b?.color || ""
    ).trim();

    const comparacionColor =
      colorA.localeCompare(
        colorB,
        "es",
        {
          sensitivity: "base",
        }
      );

    if (comparacionColor !== 0) {
      return comparacionColor;
    }

    const ordenTallas = {
      XS: 0,
      S: 1,
      M: 2,
      L: 3,
      XL: 4,
      XXL: 5,
    };

    const tallaA = String(
      a?.size || ""
    )
      .trim()
      .toUpperCase();

    const tallaB = String(
      b?.size || ""
    )
      .trim()
      .toUpperCase();

    const posicionA =
      ordenTallas[tallaA] ?? 999;

    const posicionB =
      ordenTallas[tallaB] ?? 999;

    if (posicionA !== posicionB) {
      return posicionA - posicionB;
    }

    return tallaA.localeCompare(
      tallaB,
      "es",
      {
        sensitivity: "base",
      }
    );
  });
}

/* =========================================
   OBTENER PRODUCTOS
   ========================================= */

export async function getProducts() {
  try {
    /* =======================================
       1. PRODUCTOS ACTIVOS

       Ya no usamos created_at DESC como
       orden principal.

       El orden final lo controla
       product_position.
       ======================================= */

    const {
      data: products,
      error: productsError,
    } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (productsError) {
      console.error(
        "Error cargando products:",
        productsError
      );

      throw productsError;
    }

    if (
      !Array.isArray(products) ||
      products.length === 0
    ) {
      console.log(
        "No hay productos activos."
      );

      return [];
    }

    const productIds = products
      .map((product) => product.id)
      .filter(Boolean);

    if (productIds.length === 0) {
      return [];
    }

    /* =======================================
       2. VARIANTES
       ======================================= */

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
        stock,
        color_position
      `)
      .in(
        "product_id",
        productIds
      )
      .order(
        "color_position",
        {
          ascending: true,
        }
      );

    if (variantsError) {
      console.error(
        "Error cargando product_variants:",
        variantsError
      );

      throw variantsError;
    }

    const listaVariantes =
      Array.isArray(variants)
        ? variants
        : [];

    /* =======================================
       3. IMÁGENES DE VARIANTES
       ======================================= */

    const variantIds =
      listaVariantes
        .map(
          (variant) =>
            variant.id
        )
        .filter(Boolean);

    let variantImages = [];

    if (variantIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "product_variant_images"
        )
        .select(`
          id,
          variant_id,
          image_url,
          position
        `)
        .in(
          "variant_id",
          variantIds
        )
        .order(
          "position",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "Error cargando product_variant_images:",
          error
        );

        throw error;
      }

      variantImages =
        Array.isArray(data)
          ? data
          : [];
    }

    /* =======================================
       4. IMÁGENES GENERALES DE PRODUCTOS
       ======================================= */

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
      .in(
        "product_id",
        productIds
      )
      .order(
        "position",
        {
          ascending: true,
        }
      );

    if (productImagesError) {
      console.error(
        "Error cargando product_images:",
        productImagesError
      );

      throw productImagesError;
    }

    const listaImagenesProducto =
      Array.isArray(productImages)
        ? productImages
        : [];

    /* =======================================
       5. PROMOCIONES
       ======================================= */

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
      .in(
        "product_id",
        productIds
      );

    if (promotionsError) {
      console.error(
        "Error cargando promotions:",
        promotionsError
      );

      throw promotionsError;
    }

    const listaPromociones =
      Array.isArray(promotions)
        ? promotions
        : [];

    /* =======================================
       6. AGRUPAR IMÁGENES POR VARIANTE
       ======================================= */

    const imagesByVariant = {};

    variantImages.forEach(
      (image) => {
        const variantId =
          image?.variant_id;

        if (!variantId) {
          return;
        }

        if (
          !imagesByVariant[
            variantId
          ]
        ) {
          imagesByVariant[
            variantId
          ] = [];
        }

        imagesByVariant[
          variantId
        ].push(image);
      }
    );

    Object.keys(
      imagesByVariant
    ).forEach((variantId) => {
      imagesByVariant[
        variantId
      ] = ordenarPorPosicion(
        imagesByVariant[
          variantId
        ]
      );
    });

    /* =======================================
       7. AGRUPAR VARIANTES POR PRODUCTO
       ======================================= */

    const variantsByProduct = {};

    listaVariantes.forEach(
      (variant) => {
        const productId =
          variant?.product_id;

        if (!productId) {
          return;
        }

        const variantCompleta = {
          ...variant,

          color_position:
            Number(
              variant.color_position ??
                0
            ),

          product_variant_images:
            imagesByVariant[
              variant.id
            ] || [],
        };

        if (
          !variantsByProduct[
            productId
          ]
        ) {
          variantsByProduct[
            productId
          ] = [];
        }

        variantsByProduct[
          productId
        ].push(
          variantCompleta
        );
      }
    );

    Object.keys(
      variantsByProduct
    ).forEach((productId) => {
      variantsByProduct[
        productId
      ] = ordenarVariantes(
        variantsByProduct[
          productId
        ]
      );
    });

    /* =======================================
       8. AGRUPAR IMÁGENES GENERALES
          POR PRODUCTO
       ======================================= */

    const imagesByProduct = {};

    listaImagenesProducto.forEach(
      (image) => {
        const productId =
          image?.product_id;

        if (!productId) {
          return;
        }

        if (
          !imagesByProduct[
            productId
          ]
        ) {
          imagesByProduct[
            productId
          ] = [];
        }

        imagesByProduct[
          productId
        ].push(image);
      }
    );

    Object.keys(
      imagesByProduct
    ).forEach((productId) => {
      imagesByProduct[
        productId
      ] = ordenarPorPosicion(
        imagesByProduct[
          productId
        ]
      );
    });

    /* =======================================
       9. AGRUPAR PROMOCIONES POR PRODUCTO
       ======================================= */

    const promotionsByProduct = {};

    listaPromociones.forEach(
      (promotion) => {
        const productId =
          promotion?.product_id;

        if (!productId) {
          return;
        }

        if (
          !promotionsByProduct[
            productId
          ]
        ) {
          promotionsByProduct[
            productId
          ] = [];
        }

        promotionsByProduct[
          productId
        ].push(
          promotion
        );
      }
    );

    /* =======================================
       10. RECONSTRUIR PRODUCTOS
       ======================================= */

    const resultado =
      products.map(
        (product) => {
          const productId =
            product.id;

          const variantesOrdenadas =
            ordenarVariantes(
              variantsByProduct[
                productId
              ] || []
            );

          return {
            ...product,

            product_position:
              product.product_position ===
                null ||
              product.product_position ===
                undefined
                ? null
                : Number(
                    product.product_position
                  ),

            subcategory_position:
              product.subcategory_position ===
                null ||
              product.subcategory_position ===
                undefined
                ? null
                : Number(
                    product.subcategory_position
                  ),

            product_variants:
              variantesOrdenadas,

            product_images:
              imagesByProduct[
                productId
              ] || [],

            promotions:
              promotionsByProduct[
                productId
              ] || [],
          };
        }
      );

    /* =======================================
       11. APLICAR ORDEN MANUAL
       ======================================= */

    const productosOrdenados =
      ordenarProductos(resultado);

    console.log(
      "Productos cargados correctamente:",
      productosOrdenados
    );

    return productosOrdenados;
  } catch (error) {
    console.error(
      "Error general cargando productos:",
      error
    );

    throw error;
  }
}