<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccCustomerBalance extends Model
{
    protected $table = 'acc_customer_balances';

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'fiscal_year_id',
        'opening_balance',
        'remaining_balance',
    ];

    protected $casts = [
        'opening_balance'   => 'decimal:2',
        'remaining_balance' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(AccCustomer::class, 'customer_id');
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }
}
