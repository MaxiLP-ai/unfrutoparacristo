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
        Schema::create('DesafioDetalle', function (Blueprint $table) {
            $table->id('desafiodetalle_id');
            $table->foreignId('desafiodetalle_desafio')->constrained('Desafio', 'desafio_id')->onDelete('cascade');
            $table->text('desafiodetalle_rutAprobado');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('DesafioDetalle');
    }
};
