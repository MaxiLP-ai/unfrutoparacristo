<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoServicio extends Model
{
    protected $primaryKey = 'Tipo_ServicioId';
    public $incrementing = true;

    protected $fillable = [
        'Tipo_ServicioDescripcion',
    ];

    public $timestamps = false;

    public function servicios()
    {
        return $this->hasMany(Servicio::class, 'servicio_tiposervicio_id');
    }
}
