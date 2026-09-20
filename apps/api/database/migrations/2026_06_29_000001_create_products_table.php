<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->string('slug');
            $table->text('description')->nullable();
            $table->json('additional_information')->nullable();
            $table->string('image')->nullable();
            $table->unsignedInteger('cost_price')->nullable();
            // Weighted average cost — auto-derived from vendor purchases (see
            // RecordAccVendorTransactionItemAction). Kept separate from cost_price, which
            // stays a manually-entered reference cost on the product form.
            $table->unsignedInteger('wacc')->nullable();
            $table->unsignedInteger('sales_price')->nullable();
            $table->unsignedTinyInteger('discount_percent')->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('low_stock_quantity')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
