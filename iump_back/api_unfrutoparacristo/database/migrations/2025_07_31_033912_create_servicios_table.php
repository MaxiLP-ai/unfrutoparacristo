<?php

// database/migrations/..._create_servicios_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('Servicio', function (Blueprint $table) {
            $table->id('servicio_id');
            $table->foreignId('servicio_clase')->constrained('Clase', 'clase_id')->onDelete('cascade');
            $table->foreignId('servicio_profesor_encargado')->constrained('users', 'id')->onDelete('cascade');
            $table->foreignId('servicio_tiposervicio')->constrained('TipoServicio', 'Tipo_ServicioId')->onDelete('cascade');
            $table->date('servicio_fecha');
            $table->string('servicio_observacion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('Servicio');
    }
};