<?php

// database/migrations/..._create_fruto_asignados_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('FrutoAsignado', function (Blueprint $table) {
            $table->id('frutoasignado_id');
            $table->foreignId('frutoasignado_usuario')->constrained('users', 'id')->onDelete('cascade');
            $table->foreignId('frutoasignado_fruto')->constrained('Fruto', 'fruto_id')->onDelete('cascade');
            $table->date('frutoasignado_fecha')->useCurrent();
            $table->string('frutoasignado_motivo');
            $table->string('frutoasignado_origen', 100)->nullable();
            $table->foreignId('frutoasignado_desafio_cumplido')->nullable()->constrained('DesafioCumplido', 'desaficump_id')->onDelete('set null');
            $table->foreignId('frutoasignado_asistencia_id')->nullable()->constrained('Asistencia', 'asistencia_id')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('FrutoAsignado');
    }
};
