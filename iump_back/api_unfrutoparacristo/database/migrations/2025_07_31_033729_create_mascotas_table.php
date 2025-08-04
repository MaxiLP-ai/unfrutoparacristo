<?php

// database/migrations/..._create_mascotas_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mascotas', function (Blueprint $table) {
            $table->id('mascota_id');
            $table->string('mascota_nombre', 100)->unique();
            $table->string('mascota_logo')->nullable();
            $table->string('mascota_modelo_3d_path')->nullable();
            $table->text('mascota_descripcion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mascotas');
    }
};

