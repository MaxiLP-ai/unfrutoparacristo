<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FrutoColocado extends Model
{
    protected $primaryKey = 'frutocolocado_id';
    public $incrementing = true;

    protected $fillable = [
        'frutocolocado_cesta_id',
        'frutocolocado_fruto_id',
        'position_x',
        'position_y',
        'position_z',
    ];

    public function cesta()
    {
        return $this->belongsTo(Cesta::class, 'frutocolocado_cesta_id');
    }

    public function fruto()
    {
        return $this->belongsTo(Fruto::class, 'frutocolocado_fruto_id');
    }
}
