<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccPurchaseOrderItem extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $table = 'acc_purchase_order_items';

    protected $fillable = [
        'tenant_id',
        'purchase_order_id',
        'product_id',
        'quantity',
        'rate',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'rate'     => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(AccPurchaseOrder::class, 'purchase_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
