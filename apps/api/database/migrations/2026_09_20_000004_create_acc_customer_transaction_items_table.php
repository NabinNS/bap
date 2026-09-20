<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_customer_transaction_items', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('acc_customers')->cascadeOnDelete();
            $table->foreignId('transaction_id')->constrained('acc_customer_transactions')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('rate');
            $table->unsignedInteger('amount');            // quantity x rate
            $table->unsignedInteger('discount')->default(0);
            $table->unsignedInteger('total');             // amount - discount, feeds the bill subtotal
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_customer_transaction_items');
    }
};
