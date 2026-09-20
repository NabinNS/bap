<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccCustomer extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $table = 'acc_customers';

    protected $fillable = [
        'tenant_id',
        'name',
        'address',
        'phone',
        'telephone',
        'vat_no',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function balances(): HasMany
    {
        return $this->hasMany(AccCustomerBalance::class, 'customer_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AccCustomerTransaction::class, 'customer_id');
    }
}
