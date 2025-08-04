<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Actividad extends Model
{
    protected $primaryKey = 'actividad_id';
    public $incrementing = true;

    protected $fillable = [
        'actividad_servicioId',
        'actividad_descripcion',
        'Actividad_TipoActividad_id',
    ];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'actividad_servicioId');
    }

    public function tipoActividad()
    {
        return $this->belongsTo(TipoActividad::class, 'Actividad_TipoActividad_id');
    }

    public function detalles()
    {
        return $this->hasMany(ActividadDetalle::class, 'ActividadDetalle_ActividadId');
    }
}
