<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Regla extends Model
{
    protected $primaryKey = 'regla_id';
    public $incrementing = true;

    protected $fillable = [
        'regla_descripcion',
        'regla_aplicable_a',
        'regla_configuracion', // JSON field
    ];

    protected $casts = [
        'regla_configuracion' => 'array',
    ];

    public $timestamps = false;

    public function desafios()
    {
        return $this->hasMany(Desafio::class, 'desafio_idregla');
    }
}
