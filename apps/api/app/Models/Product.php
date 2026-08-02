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
        'name',
        'brand',
        'sku',
        'slug',
        'description',
        'image',
        'price',
        'cost_price',
        'sales_price',
        'discount_percent',
        'stock',
        'low_stock_quantity',
        'is_active',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'is_active'          => 'boolean',
        'is_featured'        => 'boolean',
        'price'              => 'integer',
        'cost_price'         => 'integer',
        'sales_price'        => 'integer',
        'discount_percent'   => 'integer',
        'stock'              => 'integer',
        'low_stock_quantity' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function imageGroups(): MorphMany
    {
        return $this->morphMany(ImageGroup::class, 'imageable')->orderBy('sort_order');
    }
}
