<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoActividad extends Model
{
    protected $primaryKey = 'Tipo_ActividadId';
    public $incrementing = true;

    protected $fillable = [
        'Tipo_ActividadDescripcion',
    ];

    public $timestamps = false;

    public function actividades()
    {
        return $this->hasMany(Actividad::class, 'Actividad_TipoActividad_id');
    }
}
