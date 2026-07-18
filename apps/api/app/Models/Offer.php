<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Offer extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'title',
        'sub_title',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function imageGroups(): MorphMany
    {
        return $this->morphMany(ImageGroup::class, 'imageable')->orderBy('sort_order');
    }
}
