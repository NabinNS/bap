<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ImageGroup extends Model
{
    use HasPublicUlid;

    protected $fillable = ['tenant_id', 'imageable_type', 'imageable_id', 'slug', 'name', 'sort_order'];

    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }

    public function imageItems(): HasMany
    {
        return $this->hasMany(ImageItem::class)->orderBy('sort_order');
    }
}
