<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FrutoAsignado extends Model
{
    protected $primaryKey = 'frutoasignado_id';
    public $incrementing = true;

    protected $fillable = [
        'frutoasignado_usuario_id',
        'frutoasignado_fruto_id',
        'frutoasignado_fecha',
        'frutoasignado_motivo',
        'frutoasignado_origen',
        'frutoasignado_desafio_cumplido_id',
        'frutoasignado_asistencia_id',
    ];

    protected $dates = ['frutoasignado_fecha'];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'frutoasignado_usuario_id');
    }

    public function fruto()
    {
        return $this->belongsTo(Fruto::class, 'frutoasignado_fruto_id');
    }

    public function desafioCumplido()
    {
        return $this->belongsTo(DesafioCumplido::class, 'frutoasignado_desafio_cumplido_id');
    }

    public function asistencia()
    {
        return $this->belongsTo(Asistencia::class, 'frutoasignado_asistencia_id');
    }

    public function validate()
    {
        // Custom validation logic can be implemented in service layer or form request
        if (
            empty($this->frutoasignado_origen) &&
            empty($this->frutoasignado_desafio_cumplido_id) &&
            empty($this->frutoasignado_asistencia_id)
        ) {
            throw new \Exception("Debe especificarse al menos un origen (manual, desafío cumplido o asistencia).");
        }
    }
}
