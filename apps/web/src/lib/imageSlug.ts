// Single source of truth for image group slugs.
// Add new slugs here when adding new image fields to any form.
export const ImageSlug = {
  // Product
  ProductPhotos:  "product-photos",
  Barcodes:       "barcodes",
  Certificates:   "certificates",

  // Category
  CategoryBanner: "category-banner",
  CategoryIcon:   "category-icon",

  // Tenant
  TenantLogo:     "tenant-logo",
  TenantBanner:   "tenant-banner",
} as const;

export type ImageSlugValue = typeof ImageSlug[keyof typeof ImageSlug];
