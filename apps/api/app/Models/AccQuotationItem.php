<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccQuotationItem extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $table = 'acc_quotation_items';

    protected $fillable = [
        'tenant_id',
        'quotation_id',
        'product_id',
        'quantity',
        'rate',
        'amount',
        'discount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'rate'     => 'integer',
        'amount'   => 'integer',
        'discount' => 'integer',
        'total'    => 'integer',
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(AccQuotation::class, 'quotation_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
