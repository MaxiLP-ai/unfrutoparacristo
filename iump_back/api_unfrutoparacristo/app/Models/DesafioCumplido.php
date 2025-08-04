<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DesafioCumplido extends Model
{
    protected $primaryKey = 'desaficump_id';
    public $incrementing = true;

    protected $fillable = [
        'desaficump_usuario_id',
        'desaficump_desafio_id',
        'desaficump_fecha',
        'desaficump_aprobado_por_id',
    ];

    protected $dates = ['desaficump_fecha'];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'desaficump_usuario_id');
    }

    public function desafio()
    {
        return $this->belongsTo(Desafio::class, 'desaficump_desafio_id');
    }

    public function aprobadoPor()
    {
        return $this->belongsTo(Usuario::class, 'desaficump_aprobado_por_id');
    }
}
