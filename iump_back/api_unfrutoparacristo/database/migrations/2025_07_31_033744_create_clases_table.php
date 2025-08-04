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
        Schema::create('clases', function (Blueprint $table) {
            $table->id('clase_id');
            $table->string('clase_nombre', 100)->unique();
            $table->integer('clase_edad_referencia_min')->nullable();
            $table->integer('clase_edad_referencia_max')->nullable();
            $table->text('clase_descripcion')->nullable();
            $table->foreignId('clase_mascota')->nullable()->constrained('mascotas', 'mascota_id')->onDelete('set null');
            $table->foreignId('clase_profesor_jefe')->nullable()->constrained('users', 'id')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clases');
    }
};
