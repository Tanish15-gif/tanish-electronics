import type { ProductListItem } from "./productService";

export function selectHomeFeaturedProduct(products: ProductListItem[]) {
  const available = products.filter(
    (product) => product.isAvailable && product.stockQuantity > 0
  );
  return (
    available.find(
      (product) => product.isFeatured && product.primaryImageUrl
    ) ??
    available.find((product) => product.isFeatured) ??
    available.find((product) => product.primaryImageUrl) ??
    available[0] ??
    null
  );
}
