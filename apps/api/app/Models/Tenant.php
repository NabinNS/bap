<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasPublicUlid;

    protected $fillable = ['name', 'slug', 'email', 'phone', 'address', 'map_url', 'longitude', 'latitude', 'status', 'created_by'];
}
