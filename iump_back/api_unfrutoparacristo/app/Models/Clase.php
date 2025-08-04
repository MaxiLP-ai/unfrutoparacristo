<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clase extends Model
{
    protected $primaryKey = 'clase_id';
    public $incrementing = true;

    protected $fillable = [
        'clase_nombre',
        'clase_edad_referencia_min',
        'clase_edad_referencia_max',
        'clase_descripcion',
        'clase_mascota_id',
        'clase_profesor_jefe_id'
    ];

    public function mascota()
    {
        return $this->belongsTo(Mascota::class, 'clase_mascota_id');
    }

    public function profesorJefe()
    {
        return $this->belongsTo(Usuario::class, 'clase_profesor_jefe_id');
    }

    public function alumnosActuales()
    {
        return $this->hasMany(Usuario::class, 'usuario_clase_actual_id')->where('usuario_rol', 'alumno');
    }
}
