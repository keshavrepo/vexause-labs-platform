export type ShopProduct = {
  id: string; name: string; slug: string; shortDescription: string; description: string;
  pricePaise: number; compareAtPaise: number | null; sku: string | null; stockQuantity: number;
  images: { id: string; altText: string; url: string }[];
  available?: boolean; reviewCount?: number; trackInventory?: boolean; hasVariants?: boolean;
  variants?: { id: string; name: string; sku: string | null; optionValues: Record<string,string>; pricePaise: number; compareAtPaise: number | null; stockQuantity: number; trackInventory: boolean; available: boolean }[];
  category: { id: string; name: string; slug: string } | null;
};
export type CartLine = { productId: string; variantId?: string | null; quantity: number };
