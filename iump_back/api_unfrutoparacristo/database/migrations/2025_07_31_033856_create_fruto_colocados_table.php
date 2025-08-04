<?php

// database/migrations/..._create_fruto_colocados_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('FrutoColocado', function (Blueprint $table) {
            $table->id('frutocolocado_id');
            $table->foreignId('frutocolocado_cesta')->constrained('Cesta', 'cesta_id')->onDelete('cascade');
            $table->foreignId('frutocolocado_fruto')->constrained('Fruto', 'fruto_id')->onDelete('cascade');
            $table->float('position_x')->default(0.0);
            $table->float('position_y')->default(0.0);
            $table->float('position_z')->default(0.0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('FrutoColocado');
    }
};
