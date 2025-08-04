<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mascota extends Model
{
    protected $primaryKey = 'mascota_id';
    public $incrementing = true; 
    protected $fillable = [
        'mascota_nombre',
        'mascota_logo',
        'mascota_modelo_3d_path',
        'mascota_descripcion'
    ];

    public function clases()
    {
        return $this->hasMany(Clase::class, 'clase_mascota_id');
    }
}
