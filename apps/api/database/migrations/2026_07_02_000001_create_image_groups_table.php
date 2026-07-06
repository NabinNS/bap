<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('image_groups', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->morphs('imageable');        // imageable_type + imageable_id + index
            $table->string('slug');             // developer-defined, e.g. "product-photos"
            $table->string('name');             // user-visible label, e.g. "Photos of Products"
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            // One slug per entity — prevents duplicate groups on the same record
            $table->unique(['imageable_type', 'imageable_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_groups');
    }
};
