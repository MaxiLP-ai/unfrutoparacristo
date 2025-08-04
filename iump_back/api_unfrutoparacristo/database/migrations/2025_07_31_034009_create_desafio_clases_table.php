<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desafio_clases', function (Blueprint $table) {
            $table->id('desafioclase_id');
            $table->foreignId('desafioclase_desafio_id')->constrained('desafios', 'desafio_id')->onDelete('cascade');
            $table->foreignId('desafioclase_clase_id')->constrained('clases', 'clase_id')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desafio_clases');
    }
};
