<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductStockBalance extends Model
{
    protected $table = 'product_stock_balances';

    protected $fillable = [
        'tenant_id',
        'product_id',
        'fiscal_year_id',
        'opening_quantity',
        'remaining_quantity',
    ];

    protected $casts = [
        'opening_quantity'   => 'integer',
        'remaining_quantity' => 'integer',
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
