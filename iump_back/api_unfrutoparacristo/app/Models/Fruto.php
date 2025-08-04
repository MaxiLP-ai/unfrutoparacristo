<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fruto extends Model
{
    protected $primaryKey = 'fruto_id';
    public $incrementing = true;

    protected $fillable = [
        'fruto_nombre',
        'fruto_color',
        'fruto_modelo_3d_path',
        'fruto_descripcion',
    ];

    public function asignaciones()
    {
        return $this->hasMany(FrutoAsignado::class, 'frutoasignado_fruto_id');
    }
}
