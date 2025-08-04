<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DesafioDetalle extends Model
{
    protected $primaryKey = 'desafiodetalle_id';
    public $incrementing = true;

    protected $fillable = [
        'desafiodetalle_desafio_id',
        'desafiodetalle_rutAprobado',
    ];

    public function desafio()
    {
        return $this->belongsTo(Desafio::class, 'desafiodetalle_desafio_id');
    }
}
