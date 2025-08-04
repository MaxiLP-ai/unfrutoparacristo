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
        Schema::create('Desafio', function (Blueprint $table) {
            $table->id('desafio_id');
            $table->string('desafio_nombre');
            $table->foreignId('desafio_fruto_asociado')->constrained('Fruto', 'fruto_id')->onDelete('cascade');
            $table->foreignId('desafio_idregla')->constrained('Regla', 'regla_id')->onDelete('cascade');
            $table->boolean('desafio_asignacionAutomatica')->nullable();
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Desafio');
    }
};
