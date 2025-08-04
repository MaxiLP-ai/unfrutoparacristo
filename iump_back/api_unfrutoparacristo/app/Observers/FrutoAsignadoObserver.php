<?php

// app/Observers/FrutoAsignadoObserver.php
namespace App\Observers;

use App\Models\FrutoAsignado;
use App\Models\Cesta;

class FrutoAsignadoObserver
{
    public function created(FrutoAsignado $frutoAsignado): void
    {
        $usuario = $frutoAsignado->usuario;
        $fruto = $frutoAsignado->fruto;

        $cesta = Cesta::firstOrCreate(['cesta_usuario_id' => $usuario->id]);

        if ($fruto->fruto_color === 'verdes') {
            $cesta->increment('cesta_total_verdes');
        } elseif ($fruto->fruto_color === 'rojas') {
            $cesta->increment('cesta_total_rojas');
        } elseif ($fruto->fruto_color === 'doradas') {
            $cesta->increment('cesta_total_doradas');
        }
    }
}
