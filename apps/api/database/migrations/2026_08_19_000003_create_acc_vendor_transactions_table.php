<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_vendor_transactions', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('acc_vendors')->cascadeOnDelete();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years')->cascadeOnDelete();
            $table->string('date', 20);
            $table->string('particular');
            $table->string('voucher_no')->nullable();
            $table->string('cheque_no')->nullable();
            $table->string('type')->nullable();
            $table->decimal('debit', 15, 2)->nullable();
            $table->decimal('credit', 15, 2)->nullable();
            // Purchase-bill breakdown (discount_percent, taxable_amount, vat_amount, grand_total) —
            // only meaningful for item-based (purchase) transactions.
            $table->jsonb('bill_details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_vendor_transactions');
    }
};
