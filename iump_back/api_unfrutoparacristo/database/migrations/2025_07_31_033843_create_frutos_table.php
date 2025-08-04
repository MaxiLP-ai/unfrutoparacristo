<?php
// database/migrations/..._create_frutos_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Fruto', function (Blueprint $table) {
            $table->id('fruto_id');
            $table->string('fruto_nombre', 100)->unique();
            $table->string('fruto_color', 50)->nullable();
            $table->string('fruto_modelo_3d_path')->nullable();
            $table->text('fruto_descripcion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Fruto');
    }
};