<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccVendor extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $table = 'acc_vendors';

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

    public function openingBalances(): HasMany
    {
        return $this->hasMany(AccVendorOpeningBalance::class, 'vendor_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AccVendorTransaction::class, 'vendor_id');
    }
}
