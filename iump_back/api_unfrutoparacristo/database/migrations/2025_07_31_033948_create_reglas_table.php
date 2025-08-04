<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('Regla', function (Blueprint $table) {
            $table->id('regla_id');
            $table->string('regla_descripcion');
            $table->string('regla_aplicable_a');
            $table->json('regla_configuracion');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Regla');
    }
};
