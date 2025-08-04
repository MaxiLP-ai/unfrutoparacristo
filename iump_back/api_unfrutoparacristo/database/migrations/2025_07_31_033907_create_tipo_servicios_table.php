<?php

// database/migrations/..._create_tiposervicios_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('TipoServicio', function (Blueprint $table) {
            $table->id('Tipo_ServicioId');
            $table->string('Tipo_ServicioDescripcion');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('TipoServicio');
    }
};
