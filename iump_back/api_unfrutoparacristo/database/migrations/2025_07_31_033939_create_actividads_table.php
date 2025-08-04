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
        Schema::create('Actividad', function (Blueprint $table) {
            $table->id('actividad_id');
            $table->foreignId('Actividad_TipoActividad')->constrained('TipoActividad', 'Tipo_ActividadId')->onDelete('cascade');
            $table->foreignId('actividad_servicioId')->constrained('Servicio', 'servicio_id')->onDelete('cascade');
            $table->string('actividad_descripcion');
            $table->date('actividad_fecha');
            $table->string('actividad_lugar')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Actividad');
    }
};
