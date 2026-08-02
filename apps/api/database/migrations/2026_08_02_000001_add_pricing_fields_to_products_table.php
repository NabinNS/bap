<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('cost_price')->nullable()->after('price');
            $table->unsignedInteger('sales_price')->nullable()->after('cost_price');
            $table->unsignedTinyInteger('discount_percent')->nullable()->after('sales_price');
            $table->unsignedInteger('low_stock_quantity')->nullable()->after('stock');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['cost_price', 'sales_price', 'discount_percent', 'low_stock_quantity']);
        });
    }
};
