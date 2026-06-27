<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_types', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('tenant_tenant_type', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_type_id')->constrained('tenant_types')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->unique(['tenant_id', 'tenant_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_tenant_type');
        Schema::dropIfExists('tenant_types');
    }
};
