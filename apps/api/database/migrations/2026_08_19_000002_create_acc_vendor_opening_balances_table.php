<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_vendor_opening_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('acc_vendors')->cascadeOnDelete();
            $table->string('fiscal_year'); // e.g. "2081-82"
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['vendor_id', 'fiscal_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_vendor_opening_balances');
    }
};
