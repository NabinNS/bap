<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    ];

    protected $casts = [
        'debit'  => 'decimal:2',
        'credit' => 'decimal:2',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(AccVendor::class, 'vendor_id');
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }
}
