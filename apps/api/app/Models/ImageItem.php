<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImageItem extends Model
{
    use HasPublicUlid;

    protected $fillable = ['tenant_id', 'image_group_id', 'url', 'path', 'alt', 'sort_order'];

    public function imageGroup(): BelongsTo
    {
        return $this->belongsTo(ImageGroup::class, 'image_group_id');
    }
}
