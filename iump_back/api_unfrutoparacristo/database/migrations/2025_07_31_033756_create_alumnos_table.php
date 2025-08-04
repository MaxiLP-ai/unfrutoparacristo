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
        Schema::create('Alumno', function (Blueprint $table) {
            $table->foreignId('alumno_usuario')->primary()->constrained('users', 'id')->onDelete('cascade');
            $table->string('alumno_codigo_invitacion', 6)->unique()->nullable();
            $table->foreignId('alumno_invitado_por')->nullable()->constrained('users', 'id')->onDelete('set null');
            $table->date('alumno_fecha_cambio_clase')->nullable();
            $table->foreignId('alumno_cambiado_por')->nullable()->constrained('users', 'id')->onDelete('set null');
            $table->text('alumno_alergias')->nullable();
            $table->text('alumno_enfermedades_base')->nullable();
            $table->text('alumno_observaciones_profesor')->nullable();
            $table->string('alumno_nombre_apoderado')->nullable();
            $table->string('alumno_telefono_apoderado', 20)->nullable();
            $table->string('alumno_direccion')->nullable();
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Alumno');
    }
};
