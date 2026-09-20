<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccCustomerTransactionItem extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $table = 'acc_customer_transaction_items';

    protected $fillable = [
        'tenant_id',
        'customer_id',
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
        return $this->belongsTo(AccCustomerTransaction::class, 'transaction_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(AccCustomer::class, 'customer_id');
    }
}
