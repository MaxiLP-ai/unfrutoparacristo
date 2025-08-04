<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Renombramos el campo 'name' a 'usuario_nombre_completo' para consistencia
            $table->renameColumn('name', 'usuario_nombre_completo');
            $table->string('usuario_avatar')->nullable()->default('default.png');
            $table->string('usuario_rut', 12)->unique()->nullable();
            $table->string('usuario_rol', 50)->default('alumno');
            $table->foreignId('usuario_clase_actual_id')->nullable()->constrained('clases', 'clase_id')->onDelete('set null');
            $table->date('usuario_fecha_nacimiento');
            $table->string('usuario_telefono', 20)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('usuario_nombre_completo', 'name');
            $table->dropColumn(['usuario_avatar', 'usuario_rut', 'usuario_rol', 'usuario_clase_actual_id', 'usuario_fecha_nacimiento', 'usuario_telefono']);
        });
    }
};

