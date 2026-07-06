<?php

namespace App\Domain\Images;

enum ImageSlug: string
{
    // Product
    case ProductPhotos  = 'product-photos';
    case Barcodes       = 'barcodes';
    case Certificates   = 'certificates';

    // Category
    case CategoryBanner = 'category-banner';
    case CategoryIcon   = 'category-icon';

    // Tenant
    case TenantLogo     = 'tenant-logo';
    case TenantBanner   = 'tenant-banner';

    public function label(): string
    {
        return match($this) {
            self::ProductPhotos  => 'Product Photos',
            self::Barcodes       => 'Barcode Images',
            self::Certificates   => 'Certificates',
            self::CategoryBanner => 'Category Banner',
            self::CategoryIcon   => 'Category Icon',
            self::TenantLogo     => 'Logo',
            self::TenantBanner   => 'Banner',
        };
    }
}
