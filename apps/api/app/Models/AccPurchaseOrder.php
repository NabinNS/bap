<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccPurchaseOrder extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $table = 'acc_purchase_orders';

    protected $fillable = [
        'tenant_id',
        'vendor_id',
        'fiscal_year_id',
        'date',
        'voucher_no',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(AccVendor::class, 'vendor_id');
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(AccPurchaseOrderItem::class, 'purchase_order_id');
    }
}
