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
        Schema::create('Profesor', function (Blueprint $table) {
            $table->foreignId('profesor_usuario')->primary()->constrained('users', 'id')->onDelete('cascade');
            $table->integer('profesor_clases_dirigidas')->default(0);
            $table->date('profesor_fecha_proxima_clase')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Profesor');
    }
};
