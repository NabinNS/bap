<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');

            // Reference the ulid directly — no integer id lookup needed
            $table->string('category_ulid')->nullable()->after('tenant_id');
            $table->foreign('category_ulid')->references('ulid')->on('categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_ulid']);
            $table->dropColumn('category_ulid');

            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
        });
    }
};
