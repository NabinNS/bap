<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductTransactionItem extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'product_id',
        'fiscal_year_id',
        'date',
        'type',
        'purchase_quantity',
        'purchase_price',
        'sales_quantity',
        'sales_price',
        'reference_type',
        'reference_id',
    ];

    protected $casts = [
        'purchase_quantity' => 'integer',
        'purchase_price'    => 'integer',
        'sales_quantity'    => 'integer',
        'sales_price'       => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }
}
