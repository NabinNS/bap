<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = ['name', 'slug', 'email', 'phone', 'address', 'map_url', 'longitude', 'latitude', 'status', 'created_by'];
}
