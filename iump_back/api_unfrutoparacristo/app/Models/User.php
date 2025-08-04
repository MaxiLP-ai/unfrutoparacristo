<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuarios';
    protected $primaryKey = 'id';
    public $incrementing = true;

    protected $fillable = [
        'username',
        'usuario_avatar',
        'usuario_rut',
        'usuario_nombre_completo',
        'usuario_email',
        'usuario_rol',
        'usuario_clase_actual_id',
        'usuario_fecha_nacimiento',
        'usuario_telefono',
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'usuario_fecha_nacimiento' => 'date',
    ];

    public function claseActual()
    {
        return $this->belongsTo(Clase::class, 'usuario_clase_actual_id');
    }

    // Relaciones OneToOne con Alumno y Profesor
    public function perfilAlumno()
    {
        return $this->hasOne(Alumno::class, 'alumno_usuario_id');
    }

    public function perfilProfesor()
    {
        return $this->hasOne(Profesor::class, 'profesor_usuario_id');
    }
}
