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
        Schema::create('ActividadDetalle', function (Blueprint $table) {
            $table->id('ActividadDetalle_id');
            $table->foreignId('ActividadDetalle_ActividadId')->constrained('Actividad', 'actividad_id')->onDelete('cascade');
            $table->foreignId('ActividadDetalle_DesafioID')->constrained('users', 'id')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ActividadDetalle');
    }
};
