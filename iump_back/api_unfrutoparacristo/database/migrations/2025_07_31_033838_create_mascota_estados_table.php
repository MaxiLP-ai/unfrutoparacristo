<?php
// database/migrations/..._create_mascota_estados_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('MascotaEstado', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mascota_estado_usuario')->unique()->constrained('users', 'id')->onDelete('cascade');
            $table->integer('mascota_estado_hambre')->default(100);
            $table->integer('mascota_estado_sed')->default(100);
            $table->string('mascota_estado_sobrenombre', 50)->nullable();
            $table->timestamp('mascota_estado_last_update')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('MascotaEstado');
    }
};
