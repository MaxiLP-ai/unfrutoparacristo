<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model
{
    protected $primaryKey = 'asistencia_id';
    public $incrementing = true;

    protected $fillable = [
        'asistencia_servicio_id',
        'asistencia_fecha',
        'asistencia_tipo_clase_id',
        'asistencia_fruto_asociado_id',
        'asistencia_rutAsistentes',
    ];

    protected $dates = ['asistencia_fecha'];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'asistencia_servicio_id');
    }

    public function tipoClase()
    {
        return $this->belongsTo(Clase::class, 'asistencia_tipo_clase_id');
    }

    public function frutoAsociado()
    {
        return $this->belongsTo(Fruto::class, 'asistencia_fruto_asociado_id');
    }

    public function obtenerListaRuts()
    {
        return array_filter(array_map('trim', explode(',', $this->asistencia_rutAsistentes)));
    }
}
