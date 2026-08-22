<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FiscalYear extends Model
{
    use HasPublicUlid, SoftDeletes;

    protected $fillable = [
        'name',
        'sort_order',
    ];
}
