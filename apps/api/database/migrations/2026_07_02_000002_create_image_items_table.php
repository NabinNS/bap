<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('image_items', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('image_group_id')
                ->constrained('image_groups')
                ->cascadeOnDelete(); // deleting a group removes all its items
            $table->string('url');              // full public R2 URL — used in <img src>
            $table->string('path');             // storage key — used to delete from R2
            $table->string('alt')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['image_group_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_items');
    }
};
