<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Noticia extends Model
{
    protected $primaryKey = 'noticia_id';
    public $incrementing = true;

    protected $fillable = [
        'noticia_clase_id',
        'noticia_titulo',
        'noticia_contenido',
        'noticia_imagen',
        'noticia_fecha_publicacion',
        'noticia_publicada',
    ];

    protected $dates = ['noticia_fecha_publicacion'];

    protected $casts = [
        'noticia_publicada' => 'boolean',
    ];

    public function clase()
    {
        return $this->belongsTo(Clase::class, 'noticia_clase_id');
    }
}
