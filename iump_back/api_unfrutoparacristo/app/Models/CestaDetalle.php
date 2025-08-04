<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CestaDetalle extends Model
{
    protected $primaryKey = 'cestadetalle_id';
    public $incrementing = true;

    protected $fillable = [
        'cestadetalle_cesta_id',
        'cestadetalle_fruto_id',
        'cestadetalle_cantidad',
    ];

    public function cesta()
    {
        return $this->belongsTo(Cesta::class, 'cestadetalle_cesta_id');
    }

    public function fruto()
    {
        return $this->belongsTo(Fruto::class, 'cestadetalle_fruto_id');
    }
}
