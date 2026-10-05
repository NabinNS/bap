<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccQuotation extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $table = 'acc_quotations';

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'fiscal_year_id',
        'date',
        'voucher_no',
        'bill_details',
    ];

    protected $casts = [
        'bill_details' => 'array',
    ];

    /** Discount/VAT breakdown, e.g. ['discount_percent' => .., 'taxable_amount' => .., 'vat_amount' => .., 'grand_total' => ..]. */
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(AccCustomer::class, 'customer_id');
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(AccQuotationItem::class, 'quotation_id');
    }
}
