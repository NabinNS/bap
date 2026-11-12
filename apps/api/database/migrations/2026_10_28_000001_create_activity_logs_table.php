<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('ulid')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id');
            // The "account" this row should surface under for an aggregated feed — e.g. a
            // transaction or transaction-item row's owner is the vendor/customer it belongs
            // to, not itself. Set once at write time so a vendor/customer/product's activity
            // panel is a single indexed lookup (owner_type, owner_id) instead of first
            // collecting every one of that owner's transaction/item ids and matching against
            // them with a giant IN(...) list. Null for rows that aren't aggregated this way
            // (e.g. quotations).
            $table->string('owner_type')->nullable();
            $table->unsignedBigInteger('owner_id')->nullable();
            // The subject's activityLogLabel() at write time, e.g. "transaction 101 for
            // vendor 6" — kept as its own column (not just baked into `description`) so an
            // aggregated feed (e.g. a vendor's log showing its own edits plus its
            // transactions' and line items') can identify which record each row is about.
            $table->string('label')->nullable();
            $table->string('event');
            $table->text('description')->nullable();
            $table->json('changes')->nullable();
            // Groups log rows written during one continuous editing session (e.g. a panel left
            // open while the user tabs through several fields, each autosaving) so they merge
            // into a single row instead of one row per field blur. Set by the frontend via the
            // `X-Activity-Session` header; null for one-shot saves.
            $table->string('session_id')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'subject_type', 'subject_id']);
            $table->index(['tenant_id', 'subject_type', 'subject_id', 'session_id']);
            $table->index(['tenant_id', 'owner_type', 'owner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
