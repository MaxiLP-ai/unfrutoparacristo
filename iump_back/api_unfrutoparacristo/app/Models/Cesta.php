<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cesta extends Model
{
    protected $primaryKey = 'cesta_id';
    public $incrementing = true;

    protected $fillable = [
        'cesta_usuario_id',
        'cesta_total_verdes',
        'cesta_total_rojas',
        'cesta_total_doradas',
        'cesta_verdes_puestas',
        'cesta_rojas_puestas',
        'cesta_doradas_puestas',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'cesta_usuario_id');
    }

    public function detalles()
    {
        return $this->hasMany(CestaDetalle::class, 'cestadetalle_cesta_id');
    }
}
