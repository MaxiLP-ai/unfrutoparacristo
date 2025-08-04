<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DesafioClase extends Model
{
    protected $primaryKey = 'desafio_id';
    public $incrementing = true;

    protected $fillable = [
        'desafio_clase_id',
        'desafio_titulo',
        'desafio_video_url',
        'desafio_activo',
    ];

    protected $casts = [
        'desafio_activo' => 'boolean',
    ];

    public function clase()
    {
        return $this->belongsTo(Clase::class, 'desafio_clase_id');
    }
}
