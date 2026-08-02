<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductDiscount extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'product_id',
        'percentage',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'percentage' => 'integer',
        'starts_at'  => 'datetime',
        'ends_at'    => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(fn($q) => $q
                ->whereNull('starts_at')
                ->orWhere('starts_at', '<=', now())
            )
            ->where(fn($q) => $q
                ->whereNull('ends_at')
                ->orWhere('ends_at', '>=', now())
            );
    }
}
