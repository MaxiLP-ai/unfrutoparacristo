<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActividadDetalle extends Model
{
    protected $primaryKey = 'ActividadDetalle_id';
    public $incrementing = true;

    protected $fillable = [
        'ActividadDetalle_ActividadId',
        'ActividadDetalle_DesafioID',
    ];

    public function actividad()
    {
        return $this->belongsTo(Actividad::class, 'ActividadDetalle_ActividadId');
    }

    public function desafio()
    {
        return $this->belongsTo(Desafio::class, 'ActividadDetalle_DesafioID');
    }
}
