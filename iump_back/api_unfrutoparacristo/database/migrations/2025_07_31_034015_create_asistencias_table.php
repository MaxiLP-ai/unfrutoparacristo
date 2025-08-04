<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id('asistencia_id');
            $table->foreignId('asistencia_usuario_id')->constrained('users', 'id')->onDelete('cascade');
            $table->foreignId('asistencia_clase_id')->constrained('clases', 'clase_id')->onDelete('cascade');
            $table->date('asistencia_fecha')->useCurrent();
            $table->boolean('asistencia_presente')->default(true);
            $table->string('asistencia_observaciones', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias');
    }
};
