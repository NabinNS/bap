<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Weighted average cost — auto-derived from vendor purchases (see
            // RecordAccVendorTransactionItemAction). Kept separate from cost_price, which
            // stays a manually-entered reference cost on the product form.
            $table->unsignedInteger('wacc')->nullable()->after('cost_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('wacc');
        });
    }
};
