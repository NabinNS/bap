<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccVendorTransaction extends Model
{
    use HasPublicUlid;

    protected $table = 'acc_vendor_transactions';

    protected $fillable = [
        'tenant_id',
        'vendor_id',
        'fiscal_year_id',
        'date',
        'particular',
        'voucher_no',
        'type',
        'debit',
        'credit',
        'discount_percent',
        'taxable_amount',
        'vat_amount',
        'grand_total',
    ];

    protected $casts = [
        'debit'            => 'decimal:2',
        'credit'           => 'decimal:2',
        'discount_percent' => 'integer',
        'taxable_amount'   => 'integer',
        'vat_amount'       => 'integer',
        'grand_total'      => 'integer',
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
        return $this->hasMany(AccVendorTransactionItem::class, 'transaction_id');
    }
}
