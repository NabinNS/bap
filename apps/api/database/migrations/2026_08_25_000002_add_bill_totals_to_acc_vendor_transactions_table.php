<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acc_vendor_transactions', function (Blueprint $table) {
            // Bill-level breakdown for purchase transactions with line items — discount percent
            // applied to the raw item total (debit, before this breakdown is applied).
            $table->unsignedTinyInteger('discount_percent')->nullable()->after('credit');
            $table->unsignedInteger('taxable_amount')->nullable()->after('discount_percent');
            $table->unsignedInteger('vat_amount')->nullable()->after('taxable_amount');
            $table->unsignedInteger('grand_total')->nullable()->after('vat_amount');
        });
    }

    public function down(): void
    {
        Schema::table('acc_vendor_transactions', function (Blueprint $table) {
            $table->dropColumn(['discount_percent', 'taxable_amount', 'vat_amount', 'grand_total']);
        });
    }
};
