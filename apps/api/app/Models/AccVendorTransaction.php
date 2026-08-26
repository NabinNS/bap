<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'cheque_no',
        'type',
        'debit',
        'credit',
        'bill_details',
    ];

    protected $casts = [
        'debit'        => 'decimal:2',
        'credit'       => 'decimal:2',
        'bill_details' => 'array',
    ];

    /** Purchase-bill breakdown, e.g. ['discount_percent' => .., 'taxable_amount' => .., 'vat_amount' => .., 'grand_total' => ..]. Only meaningful for item-based (purchase) transactions. */
    protected function discountPercent(): Attribute
    {
        return Attribute::get(fn () => $this->bill_details['discount_percent'] ?? null);
    }

    protected function discountAmount(): Attribute
    {
        return Attribute::get(fn () => $this->bill_details['discount_amount'] ?? null);
    }

    protected function taxableAmount(): Attribute
    {
        return Attribute::get(fn () => $this->bill_details['taxable_amount'] ?? null);
    }

    protected function vatAmount(): Attribute
    {
        return Attribute::get(fn () => $this->bill_details['vat_amount'] ?? null);
    }

    protected function grandTotal(): Attribute
    {
        return Attribute::get(fn () => $this->bill_details['grand_total'] ?? null);
    }

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
