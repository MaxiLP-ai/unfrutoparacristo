<?php

// database/migrations/..._create_cesta_detalles_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('CestaDetalle', function (Blueprint $table) {
            $table->id('cestadetalle_id');
            $table->foreignId('cestadetalle_cesta')->constrained('Cesta', 'cesta_id')->onDelete('cascade');
            $table->foreignId('cestadetalle_fruto')->constrained('Fruto', 'fruto_id')->onDelete('cascade');
            $table->integer('cestadetalle_cantidad')->default(1);
            $table->timestamps();

            $table->unique(['cestadetalle_cesta_id', 'cestadetalle_fruto_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('CestaDetalle');
    }
};
