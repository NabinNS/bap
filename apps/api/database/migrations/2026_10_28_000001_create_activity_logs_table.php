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
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
