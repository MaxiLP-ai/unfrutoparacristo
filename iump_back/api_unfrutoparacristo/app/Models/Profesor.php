<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profesor extends Model
{
    protected $primaryKey = 'profesor_usuario_id';
    public $incrementing = false;

    protected $fillable = [
        'profesor_usuario_id',
        'profesor_clases_dirigidas',
        'profesor_fecha_proxima_clase',
    ];

    protected $dates = [
        'profesor_fecha_proxima_clase',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'profesor_usuario_id');
    }
}
