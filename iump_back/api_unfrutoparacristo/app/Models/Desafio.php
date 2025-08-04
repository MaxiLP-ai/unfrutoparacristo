<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Desafio extends Model
{
    protected $primaryKey = 'desafio_id';
    public $incrementing = true;

    protected $fillable = [
        'desafio_descripcion',
        'desafio_fruto_asociado_id',
        'desafio_asignacionAutomatica',
        'desafio_idregla',
    ];

    protected $casts = [
        'desafio_asignacionAutomatica' => 'boolean',
    ];

    public function frutoAsociado()
    {
        return $this->belongsTo(Fruto::class, 'desafio_fruto_asociado_id');
    }

    public function regla()
    {
        return $this->belongsTo(Regla::class, 'desafio_idregla');
    }

    public function detalles()
    {
        return $this->hasMany(DesafioDetalle::class, 'desafiodetalle_desafio_id');
    }

    public function cumplimientos()
    {
        return $this->hasMany(DesafioCumplido::class, 'desaficump_desafio_id');
    }
}
