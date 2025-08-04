<?php

// database/migrations/..._create_cestas_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Cesta', function (Blueprint $table) {
            $table->id('cesta_id');
            $table->foreignId('cesta_usuario')->unique()->constrained('users', 'id')->onDelete('cascade');
            $table->integer('cesta_total_verdes')->default(0);
            $table->integer('cesta_total_rojas')->default(0);
            $table->integer('cesta_total_doradas')->default(0);
            $table->integer('cesta_verdes_puestas')->default(0);
            $table->integer('cesta_rojas_puestas')->default(0);
            $table->integer('cesta_doradas_puestas')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Cesta');
    }
};