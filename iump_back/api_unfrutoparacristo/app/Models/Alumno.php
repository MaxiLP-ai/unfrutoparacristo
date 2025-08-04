<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Alumno extends Model
{
    protected $primaryKey = 'alumno_usuario_id';
    public $incrementing = false;

    protected $fillable = [
        'alumno_usuario_id',
        'alumno_codigo_invitacion',
        'alumno_invitado_por_id',
        'alumno_fecha_cambio_clase',
        'alumno_cambiado_por_id',
        'alumno_alergias',
        'alumno_enfermedades_base',
        'alumno_observaciones_profesor',
        'alumno_nombre_apoderado',
        'alumno_telefono_apoderado',
        'alumno_direccion'
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'alumno_usuario_id');
    }

    public function invitadoPor()
    {
        return $this->belongsTo(Usuario::class, 'alumno_invitado_por_id');
    }

    public function cambiadoPor()
    {
        return $this->belongsTo(Usuario::class, 'alumno_cambiado_por_id');
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($alumno) {
            if (empty($alumno->alumno_codigo_invitacion)) {
                $alumno->alumno_codigo_invitacion = self::generarCodigoUnico();
            }
        });
    }

    private static function generarCodigoUnico()
    {
        do {
            $codigo = Str::upper(Str::random(6));
        } while (self::where('alumno_codigo_invitacion', $codigo)->exists());

        return $codigo;
    }
}
