<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use App\Models\ImageGroup;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'category_id',
        'brand_id',
        'name',
        'sku',
        'slug',
        'description',
        'image',
        'cost_price',
        'wacc',
        'sales_price',
        'discount_percent',
        'stock',
        'low_stock_quantity',
        'is_active',
        'is_featured',
        'sort_order',
        'additional_information',
    ];

    protected $casts = [
        'is_active'          => 'boolean',
        'is_featured'        => 'boolean',
        'cost_price'         => 'integer',
        'wacc'               => 'integer',
        'sales_price'        => 'integer',
        'discount_percent'   => 'integer',
        'stock'              => 'integer',
        'low_stock_quantity'     => 'integer',
        'additional_information' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function discounts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProductDiscount::class);
    }

    public function activeDiscount(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ProductDiscount::class)
            ->where('is_active', true)
            ->where(fn($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->latestOfMany();
    }

    public function imageGroups(): MorphMany
    {
        return $this->morphMany(ImageGroup::class, 'imageable')->orderBy('sort_order');
    }
}
