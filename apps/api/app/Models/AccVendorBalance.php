<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccVendorBalance extends Model
{
    protected $table = 'acc_vendor_balances';

    protected $fillable = [
        'tenant_id',
        'vendor_id',
        'fiscal_year_id',
        'opening_balance',
        'remaining_balance',
    ];

    protected $casts = [
        'opening_balance'   => 'decimal:2',
        'remaining_balance' => 'decimal:2',
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
