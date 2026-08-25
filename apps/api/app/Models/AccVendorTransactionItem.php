<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccVendorTransactionItem extends Model
{
    use HasPublicUlid;

    protected $table = 'acc_vendor_transaction_items';

    protected $fillable = [
        'tenant_id',
        'vendor_id',
        'transaction_id',
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

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(AccVendorTransaction::class, 'transaction_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(AccVendor::class, 'vendor_id');
    }
}
