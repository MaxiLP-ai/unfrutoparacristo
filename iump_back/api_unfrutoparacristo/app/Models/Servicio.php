<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    protected $primaryKey = 'servicio_id';
    public $incrementing = true;

    protected $fillable = [
        'servicio_clase_id',
        'servicio_tiposervicio_id',
        'servicio_descripcion',
        'servicio_fecha_hora',
        'servicio_profesor_encargado_id',
    ];

    protected $dates = ['servicio_fecha_hora'];

    public function clase()
    {
        return $this->belongsTo(Clase::class, 'servicio_clase_id');
    }

    public function tipoServicio()
    {
        return $this->belongsTo(TipoServicio::class, 'servicio_tiposervicio_id');
    }

    public function profesorEncargado()
    {
        return $this->belongsTo(Usuario::class, 'servicio_profesor_encargado_id');
    }

    public function actividades()
    {
        return $this->hasMany(Actividad::class, 'actividad_servicioId');
    }

    public function asistencia()
    {
        return $this->hasOne(Asistencia::class, 'asistencia_servicio_id');
    }
}
