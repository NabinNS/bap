<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasPublicUlid;

    protected $fillable = ['name', 'slug', 'email', 'phone', 'address', 'map_url', 'longitude', 'latitude', 'status', 'created_by'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_users');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
