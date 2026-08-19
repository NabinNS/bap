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
            $table->foreignId('vendor_id')->constrained('acc_vendors')->cascadeOnDelete();
            $table->string('fiscal_year'); // e.g. "2081-82"
            $table->date('date');
            $table->string('particular');
            $table->string('voucher_no')->nullable();
            $table->enum('type', ['purchase', 'payment', 'credit_note', 'journal']);
            $table->decimal('debit', 15, 2)->nullable();
            $table->decimal('credit', 15, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_vendor_transactions');
    }
};
