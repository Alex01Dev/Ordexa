import { classifyCategory, StoreCategory } from '../constants/categories';

export interface BarcodeProductInfo {
  name?: string;
  category?: StoreCategory;
  imageUrl?: string;
}

export async function lookupBarcode(code: string): Promise<BarcodeProductInfo | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // lc=es le pide a Open Food Facts que traduzca nombres/categorías a español
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${code}.json?lc=es`,
      { signal: controller.signal }
    );
    const data = await response.json();
    clearTimeout(timeout);

    if (data.status !== 1 || !data.product) {
      return null;
    }

    // "categories" viene como texto separado por comas, de lo más general
    // a lo más específico, ej: "Bebidas, Bebidas alcohólicas, Cervezas"
    const categoryNames: string[] = data.product.categories
      ? data.product.categories.split(',').map((c: string) => c.trim())
      : data.product.categories_tags ?? [];

    return {
      name: data.product.product_name_es || data.product.product_name || undefined,
      category: classifyCategory(categoryNames),
      imageUrl: data.product.image_url || undefined,
    };
  } catch (error) {
    clearTimeout(timeout);
    return null;
  }
}