<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;

class MascotaEstado extends Model
{
    protected $table = 'mascota_estado';
    protected $primaryKey = 'mascota_estado_usuario_id';
    public $incrementing = false;

    protected $fillable = [
        'mascota_estado_usuario_id',
        'mascota_estado_hambre',
        'mascota_estado_sed',
        'mascota_estado_sobrenombre',
        'mascota_estado_last_update'
    ];

    protected $dates = ['mascota_estado_last_update'];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'mascota_estado_usuario_id');
    }

    // Ejemplo de método para actualizar estados (se puede llamar desde controller o command)
    public function actualizarEstadoSiCorresponde()
    {
        $ahora = now();
        $diferencia = $ahora->diffInSeconds($this->mascota_estado_last_update);

        if ($diferencia >= 600) {
            $periodos = intval($diferencia / 600);
            $this->mascota_estado_hambre = max(0, $this->mascota_estado_hambre - $periodos * 1);
            $this->mascota_estado_sed = max(0, $this->mascota_estado_sed - $periodos * 2);
            $this->mascota_estado_last_update = $ahora;
            $this->save();
        }
    }
}
