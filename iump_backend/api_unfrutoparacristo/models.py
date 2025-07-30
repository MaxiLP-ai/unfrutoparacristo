# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from .utils import formatear_rut
import random
import string
import json # Para el campo JSONField en Regla

# --- Constantes para Choices ---
ROL_CHOICES = [
    ('alumno', 'Alumno(a)'),
    ('profesor', 'Profesor(a)'),
    ('profesor_jefe', 'Profesor(a) Jefe(a)'),
    ('profesor_asistente', 'Profesor(a) Asistente'),
    ('superadmin', 'Super Administrador(a)'),
]

APLICABLE_A_CHOICES = [
    ('desafio', 'Desafío'),
    ('asistencia', 'Asistencia'),
    ('general', 'General'), # Opción para reglas más generales
]

TIPO_SERVICIO_CHOICES = [
    ('clase', 'Clase'),
    ('evento', 'Evento'),
    ('reunion', 'Reunión'),
    # Agrega más tipos de servicio si es necesario
]

# --- Modelos de Entidades ---

class Mascota(models.Model):
    """
    Define las diferentes mascotas disponibles en el sistema.
    """
    mascota_id = models.AutoField(primary_key=True)
    mascota_nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre de la Mascota")
    mascota_logo = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ruta del Logo")
    mascota_modelo_3d_path = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ruta del Modelo 3D (.glb)")
    mascota_descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción Opcional")

    class Meta:
        verbose_name = "Mascota"
        verbose_name_plural = "Mascotas"

    def __str__(self):
        return self.mascota_nombre
    

class MascotaEstado(models.Model):
    mascota_estado_usuario = models.OneToOneField('Usuario', on_delete=models.CASCADE, related_name='mascota_estado')
    mascota_estado_hambre = models.IntegerField(default=100, verbose_name="Nivel de Hambre")
    mascota_estado_sed = models.IntegerField(default=100, verbose_name="Nivel de Sed")
    mascota_estado_sobrenombre = models.CharField(max_length=50, blank=True, null=True, verbose_name="Sobrenombre de la Mascota")
    mascota_estado_last_update = models.DateTimeField(auto_now=True)

    def get_mascota(self):
        if self.mascota_estado_usuario.usuario_clase_actual:
            return self.mascota_estado_usuario.usuario_clase_actual.clase_mascota
        return None

    def __str__(self):
        nombre = self.mascota_estado_sobrenombre if self.mascota_estado_sobrenombre else "Mascota sin sobrenombre"
        return f"{nombre} de {self.mascota_estado_usuario.username}"

    def actualizar_estado_si_corresponde(self):
        ahora = timezone.now()
        diferencia = (ahora - self.mascota_estado_last_update).total_seconds()

        if diferencia >= 600:  # 600 segundos = 10 minutos
            periodos = int(diferencia // 600)
            self.mascota_estado_hambre = max(0, self.mascota_estado_hambre - periodos * 1)
            self.mascota_estado_sed = max(0, self.mascota_estado_sed - periodos * 2)
            self.mascota_estado_last_update = ahora
            self.save()

class Clase(models.Model):
    """
    Representa un grupo o clase de la escuela dominical.
    """
    clase_id = models.AutoField(primary_key=True)
    clase_nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre de la Clase")
    clase_edad_referencia_min = models.IntegerField(blank=True, null=True, verbose_name="Edad Mínima de Referencia")
    clase_edad_referencia_max = models.IntegerField(blank=True, null=True, verbose_name="Edad Máxima de Referencia")
    clase_descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción de la Clase")
    clase_mascota = models.ForeignKey(Mascota, on_delete=models.SET_NULL, null=True, blank=True, related_name='clases_asociadas', verbose_name="Mascota Asociada")
    clase_profesor_jefe = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True, related_name='clases_como_jefe', verbose_name="Profesor(a) Jefe(a)")

    class Meta:
        verbose_name = "Clase"
        verbose_name_plural = "Clases"

    def __str__(self):
        return self.clase_nombre

class Usuario(AbstractUser):
    """
    Modelo de Usuario personalizado.
    El campo 'username' es único por defecto al heredar de AbstractUser.
    """
    usuario_avatar = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ruta del Avatar", default='default.png')
    usuario_rut = models.CharField(max_length=12, unique=True, blank=True, null=True, verbose_name="RUT")
    usuario_nombre_completo = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nombre Completo")
    usuario_email = models.EmailField(unique=True, blank=True, null=True, verbose_name="Correo Electrónico")
    usuario_rol = models.CharField(max_length=50, choices=ROL_CHOICES, default='alumno', verbose_name="Rol")
    usuario_clase_actual = models.ForeignKey(Clase, on_delete=models.SET_NULL, null=True, blank=True, related_name='alumnos_actuales', verbose_name="Clase Actual")
    usuario_fecha_nacimiento = models.DateField(blank=False, null=False, verbose_name="Fecha de Nacimiento")
    usuario_telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefono")

    groups = models.ManyToManyField('auth.Group', related_name='custom_user_groups', blank=True, verbose_name="Grupos")
    user_permissions = models.ManyToManyField('auth.Permission', related_name='custom_user_permissions', blank=True, verbose_name="Permisos de Usuario")

    def save(self, *args, **kwargs):
        # Antes de guardar, nos aseguramos de que el RUT tenga el formato correcto
        if self.usuario_rut:
            self.usuario_rut = formatear_rut(self.usuario_rut)
        super().save(*args, **kwargs) # Llama al método de guardado original

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return self.username if self.username else self.usuario_email if self.usuario_email else self.usuario_rut if self.usuario_rut else "Usuario sin nombre"

class Alumno(models.Model):
    """
    Información específica para usuarios con rol de Alumno.
    """
    alumno_usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, primary_key=True, related_name='perfil_alumno', verbose_name="Usuario")
    alumno_codigo_invitacion = models.CharField(max_length=6, unique=True, blank=True, null=True, verbose_name="Código de Invitación")
    alumno_invitado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='alumnos_invitados', verbose_name="Invitado Por")
    alumno_fecha_cambio_clase = models.DateField(blank=True, null=True, verbose_name="Fecha de Último Cambio de Clase")
    alumno_cambiado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='alumnos_cambiados', verbose_name="Cambiado Por")

    # CAMPOS ADICIONALES
    alumno_alergias = models.TextField(blank=True, null=True, verbose_name="Alergias")
    alumno_enfermedades_base = models.TextField(blank=True, null=True, verbose_name="Enfermedades de Base")
    alumno_observaciones_profesor = models.TextField(blank=True, null=True, verbose_name="Observaciones del Profesor")
    alumno_nombre_apoderado = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nombre del Apoderado")
    alumno_telefono_apoderado = models.CharField(max_length=20, blank=True, null=True, verbose_name="Teléfono del Apoderado")
    alumno_direccion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dirección")

    class Meta:
        verbose_name = "Alumno"
        verbose_name_plural = "Alumnos"

    def generar_codigo_invitacion(self):
        """Genera un código de invitación aleatorio de 6 caracteres único"""
        if not self.alumno_codigo_invitacion:
            while True:
                codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                if not Alumno.objects.filter(alumno_codigo_invitacion=codigo).exists():
                    self.alumno_codigo_invitacion = codigo
                    self.save()
                    break

    def __str__(self):
        return f'Alumno: {self.alumno_usuario.username}'

class Profesor(models.Model):
    """
    Información específica para usuarios con rol de Profesor.
    """
    profesor_usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, primary_key=True, related_name='perfil_profesor', verbose_name="Usuario")
    profesor_clases_dirigidas = models.IntegerField(default=0, verbose_name="Número de Clases Dirigidas")
    profesor_fecha_proxima_clase = models.DateField(blank=True, null=True, verbose_name="Fecha de Próxima Clase")

    class Meta:
        verbose_name = "Profesor"
        verbose_name_plural = "Profesores"

    def __str__(self):
        return f'Profesor: {self.profesor_usuario.username}'

class Fruto(models.Model):
    """
    Representa un tipo de fruto que los alumnos pueden obtener.
    """
    fruto_id = models.AutoField(primary_key=True)
    fruto_nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Fruto")
    fruto_color = models.CharField(max_length=50, blank=True, null=True, verbose_name="Color del Fruto")
    fruto_modelo_3d_path = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ruta del Modelo 3D (.glb)")
    fruto_descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción del Fruto")

    class Meta:
        verbose_name = "Fruto"
        verbose_name_plural = "Frutos"

    def __str__(self):
        return self.fruto_nombre

class FrutoAsignado(models.Model):
    frutoasignado_id = models.AutoField(primary_key=True)
    frutoasignado_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='frutos_recibidos', verbose_name="Usuario")
    frutoasignado_fruto = models.ForeignKey(Fruto, on_delete=models.CASCADE, related_name='asignaciones', verbose_name="Fruto")
    frutoasignado_fecha = models.DateField(auto_now_add=True, verbose_name="Fecha de Asignación")
    frutoasignado_motivo = models.CharField(max_length=255, verbose_name="Motivo de la Asignación")
    frutoasignado_origen = models.CharField(max_length=100, blank=True, null=True, verbose_name="Origen (ej. Actividad, Desafío, Manual)")
    frutoasignado_desafio_cumplido = models.ForeignKey('DesafioCumplido', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Desafío Cumplido", related_name='fruto_asignado')
    frutoasignado_asistencia = models.ForeignKey('Asistencia', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Asistencia Relacionada", related_name='fruto_asignado')


    class Meta:
        verbose_name = "Fruto Asignado"
        verbose_name_plural = "Frutos Asignados"
        ordering = ['-frutoasignado_fecha']

    def clean(self):
        from django.core.exceptions import ValidationError
        if not (self.frutoasignado_origen or self.frutoasignado_desafio_cumplido or self.frutoasignado_asistencia):
            raise ValidationError("Debe especificarse al menos un origen (manual, desafío cumplido o asistencia).")


    def __str__(self):
        return f"{self.frutoasignado_fruto.fruto_nombre} asignado a {self.frutoasignado_usuario.username} el {self.frutoasignado_fecha}"

class DesafioCumplido(models.Model):
    """
    Registra cuándo un alumno ha cumplido un desafío.
    Puede ser evaluado manualmente o marcado automáticamente en el futuro.
    """
    desaficump_id = models.AutoField(primary_key=True)
    desaficump_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='desafios_cumplidos', verbose_name="Usuario")
    desaficump_desafio = models.ForeignKey('Desafio', on_delete=models.CASCADE, related_name='cumplimientos', verbose_name="Desafío")
    desaficump_fecha = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Cumplimiento")
    desaficump_aprobado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='desafios_aprobados', verbose_name="Aprobado por")

    class Meta:
        verbose_name = "Desafío Cumplido"
        verbose_name_plural = "Desafíos Cumplidos"
        unique_together = ('desaficump_usuario', 'desaficump_desafio')  # Un mismo usuario no puede cumplir 2 veces el mismo desafío

    def __str__(self):
        return f"{self.desaficump_usuario.username} cumplió {self.desaficump_desafio.desafio_descripcion[:30]}"



class TipoServicio(models.Model):
    """
    Representa un Tipo de Servicio registrado en el sistema.
    """
    Tipo_ServicioId = models.AutoField(primary_key=True)
    Tipo_ServicioDescripcion = models.TextField(verbose_name="Descripción del Tipo de Servicio")
    class Meta:
        verbose_name = "Tipo Servicio"
        verbose_name_plural = "Tipo Servicios"
        ordering = ['-Tipo_ServicioId']
    def __str__(self):
        return f"TipoServicio: {self.Tipo_ServicioDescripcion[:50]}..." if len(self.Tipo_ServicioDescripcion) > 50 else self.Tipo_ServicioDescripcion    

class Servicio(models.Model):
    """
    Representa un servicio o evento registrado en el sistema.
    """
    servicio_id = models.AutoField(primary_key=True)
    servicio_clase = models.ForeignKey(Clase, on_delete=models.CASCADE, related_name='servicios', verbose_name="Clase Asociada")
    servicio_tiposervicio = models.ForeignKey(TipoServicio, on_delete=models.CASCADE, null=True, related_name='TipoServicio', verbose_name="Tipo Servicio")
    servicio_descripcion = models.TextField(verbose_name="Descripción del Servicio")
    servicio_fecha_hora = models.DateTimeField(verbose_name="Fecha y Hora del Servicio")
    servicio_profesor_encargado = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Profesor(a) Encargado")

    class Meta:
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"
        ordering = ['-servicio_fecha_hora']

    def __str__(self):
        return f"{self.servicio_tiposervicio} - {self.servicio_clase.clase_nombre} ({self.servicio_fecha_hora.strftime('%d-%m-%Y')})"

class TipoActividad(models.Model):
    """
    Representa un Tipo de Actividad registrado en el sistema.
    """
    Tipo_ActividadId = models.AutoField(primary_key=True)
    Tipo_ActividadDescripcion = models.TextField(verbose_name="Descripción del Tipo de Actividad")
    class Meta:
        verbose_name = "Tipo Actividad"
        verbose_name_plural = "Tipo Actividades"
        ordering = ['-Tipo_ActividadId']
    def __str__(self):
        return f"Tipo_Actividad: {self.Tipo_ActividadDescripcion[:50]}..." if len(self.Tipo_ActividadDescripcion) > 50 else self.Tipo_ActividadDescripcion    

class Actividad(models.Model):
    """
    Representa una actividad que los alumnos pueden realizar.
    """
    actividad_id = models.AutoField(primary_key=True)
    actividad_servicioId = models.ForeignKey(Servicio, on_delete=models.CASCADE, null=True, related_name='Servicio', verbose_name="Servicio")
    actividad_descripcion = models.TextField(verbose_name="Descripción de la Actividad")
    Actividad_TipoActividad = models.ForeignKey(TipoActividad, on_delete=models.CASCADE, null=True, related_name='Tipo_Actividad', verbose_name='Tipo_Actividad')

    class Meta:
        verbose_name = "Actividad"
        verbose_name_plural = "Actividades"

    def __str__(self):
        return f"Actividad: {self.actividad_descripcion[:50]}..." if len(self.actividad_descripcion) > 50 else self.actividad_descripcion


class Regla(models.Model):
    """
    Define reglas que pueden aplicarse a desafíos o asistencia,
    permitiendo configuraciones flexibles mediante JSON.
    """
    regla_id = models.AutoField(primary_key=True)
    regla_descripcion = models.TextField(verbose_name="Descripción de la Regla")
    regla_aplicable_a = models.CharField(max_length=50, choices=APLICABLE_A_CHOICES, verbose_name="Aplicable a")
    regla_configuracion = models.JSONField(blank=True, null=True, verbose_name="Configuración de la Regla (JSON)")

    class Meta:
        verbose_name = "Regla"
        verbose_name_plural = "Reglas"

    def __str__(self):
        return f"Regla: {self.regla_descripcion[:50]}..." if len(self.regla_descripcion) > 50 else self.regla_descripcion

class Noticia(models.Model):
    """
    Modelo para las noticias o anuncios generales de la comunidad.
    """
    noticia_id = models.AutoField(primary_key=True)
    
    noticia_clase = models.ForeignKey(
        Clase, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name="Clase Específica (Opcional)",
        help_text="Dejar en blanco si la noticia es para todas las clases."
    )
    
    noticia_titulo = models.CharField(max_length=200, verbose_name="Título")
    noticia_contenido = models.TextField(verbose_name="Contenido")
    noticia_imagen = models.ImageField(
        upload_to='noticias/', 
        blank=True, 
        null=True, 
        verbose_name="Imagen de la Noticia (Opcional)"
    )
    noticia_fecha_publicacion = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Publicación")
    noticia_publicada = models.BooleanField(default=True, verbose_name="¿Está publicada?")

    class Meta:
        verbose_name = "Noticia"
        verbose_name_plural = "Noticias"
        ordering = ['-noticia_fecha_publicacion']

    def __str__(self):
        return self.noticia_titulo
    
class DesafioClase(models.Model):
    """
    Modelo para el desafío semanal o mensual de una clase específica.
    Funciona como un "espacio destacado" para un video.
    """
    desafio_id = models.AutoField(primary_key=True)
    # Cada clase solo puede tener un desafío destacado a la vez.
    desafio_clase = models.OneToOneField(Clase, on_delete=models.CASCADE, related_name='desafio_clase', verbose_name="Clase Asociada")
    desafio_titulo = models.CharField(max_length=200, verbose_name="Título del Desafío")
    desafio_video_url = models.URLField(max_length=500, help_text="Pega aquí la URL 'embed' de YouTube", verbose_name="URL del Video")
    # El booleano que controla si se muestra o no en el Home.
    desafio_activo = models.BooleanField(default=False, verbose_name="¿Desafío visible para los alumnos?")

    class Meta:
        verbose_name = "Desafío de la Clase"
        verbose_name_plural = "Desafíos de las Clases"

    def __str__(self):
        return f"Desafío para {self.desafio_clase.clase_nombre}"


class Desafio(models.Model):
    """
    Representa un desafío que los alumnos pueden completar.
    """
    desafio_id = models.AutoField(primary_key=True)
    desafio_descripcion = models.TextField(verbose_name="Descripción del Desafío")
    desafio_fruto_asociado = models.ForeignKey(Fruto, on_delete=models.SET_NULL, null=True, blank=True, related_name='desafios_asociados', verbose_name="Fruto Asociado")
    desafio_asignacionAutomatica = models.BooleanField(default=False, verbose_name="Asignación Automática")
    desafio_idregla = models.ForeignKey(Regla, on_delete=models.SET_NULL, null=True, blank=True, related_name='desafios_con_regla', verbose_name="Regla Asociada")

    class Meta:
        verbose_name = "Desafío"
        verbose_name_plural = "Desafíos"

    def __str__(self):
        return f"Desafío: {self.desafio_descripcion[:50]}..." if len(self.desafio_descripcion) > 50 else self.desafio_descripcion

class DesafioDetalle(models.Model):
    """
    Detalles adicionales para un desafío.
    """
    desafiodetalle_id = models.AutoField(primary_key=True)
    desafiodetalle_desafio = models.ForeignKey(Desafio, on_delete=models.CASCADE, related_name='detalles', verbose_name="Desafío")
    desafiodetalle_rutAprobado = models.TextField(null=True, verbose_name="RUTs de Aprobacion (separados por coma)")
    class Meta:
        verbose_name = "Detalle de Desafío"
        verbose_name_plural = "Detalles de Desafíos"

    def __str__(self):
        return f"Detalle para Desafío {self.desafiodetalle_desafio.desafio_id}"

class ActividadDetalle(models.Model):
    """
    Representa un Detalle de actividad que los alumnos pueden realizar.
    """
    ActividadDetalle_id = models.AutoField(primary_key=True)
    ActividadDetalle_ActividadId = models.ForeignKey(Actividad, on_delete=models.CASCADE, null=True, related_name='Actividad', verbose_name="Actividad")
    ActividadDetalle_DesafioID = models.ForeignKey(Desafio, on_delete=models.CASCADE, null=True, related_name='Desafio', verbose_name="Desafio")
    class Meta:
        verbose_name = "Detalle de Actividad"
        verbose_name_plural = "Detalles de Actividad"

    def __str__(self):
        return f"Detalle para Actividad {self.ActividadDetalle_ActividadId }"

class Asistencia(models.Model):
    asistencia_id = models.AutoField(primary_key=True)
    asistencia_servicio = models.OneToOneField('Servicio', on_delete=models.CASCADE, related_name='asistencia', verbose_name="Servicio Relacionado")
    asistencia_fecha = models.DateField(verbose_name="Fecha de la Asistencia")
    asistencia_tipo_clase = models.ForeignKey(Clase, on_delete=models.CASCADE, related_name='asistencias', verbose_name="Tipo de Clase")
    asistencia_fruto_asociado = models.ForeignKey(Fruto, on_delete=models.SET_NULL, null=True, blank=True, related_name='asistencias_con_fruto', verbose_name="Fruto Asociado (Opcional)")
    asistencia_rutAsistentes = models.TextField(verbose_name="RUTs de Asistentes (separados por coma)")

    class Meta:
        verbose_name = "Asistencia"
        verbose_name_plural = "Asistencias"
        ordering = ['-asistencia_fecha']

    def obtener_lista_ruts(self):
        return [rut.strip() for rut in self.asistencia_rutAsistentes.split(',') if rut.strip()]

    def __str__(self):
        return f"Asistencia para {self.asistencia_tipo_clase.clase_nombre} el {self.asistencia_fecha}"


class Cesta(models.Model):
    """
    Representa una 'cesta' o colección de frutos para un usuario.
    Se asume que cada usuario tiene una única cesta.
    """
    cesta_id = models.AutoField(primary_key=True)
    cesta_usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='cesta', verbose_name="Usuario")
    
    # Contadores de TOTALES DE FRUTOS POR COLOR EN LA CESTA
    cesta_total_verdes = models.IntegerField(default=0, verbose_name="Total Manzanas Verdes")
    cesta_total_rojas = models.IntegerField(default=0, verbose_name="Total Manzanas Rojas")
    cesta_total_doradas = models.IntegerField(default=0, verbose_name="Total Manzanas Doradas")

    # Contadores de FRUTOS PUESTOS/CONSUMIDOS POR COLOR
    cesta_verdes_puestas = models.IntegerField(default=0, verbose_name="Manzanas Verdes Puestas")
    cesta_rojas_puestas = models.IntegerField(default=0, verbose_name="Manzanas Rojas Puestas")
    cesta_doradas_puestas = models.IntegerField(default=0, verbose_name="Manzanas Doradas Puestas")

    class Meta:
        verbose_name = "Cesta"
        verbose_name_plural = "Cestas"

    def __str__(self):
        return f"Cesta de {self.cesta_usuario.username}"

class CestaDetalle(models.Model):
    """
    Detalle de los frutos dentro de una cesta.
    Cada fila representa un TIPO ESPECÍFICO de Fruto y su cantidad.
    """
    cestadetalle_id = models.AutoField(primary_key=True)
    cestadetalle_cesta = models.ForeignKey(Cesta, on_delete=models.CASCADE, related_name='detalles', verbose_name="Cesta")
    cestadetalle_fruto = models.ForeignKey(Fruto, on_delete=models.CASCADE, related_name='detalles_cesta', verbose_name="Fruto")
    cestadetalle_cantidad = models.IntegerField(default=1, verbose_name="Cantidad")

    class Meta:
        verbose_name = "Detalle de Cesta"
        verbose_name_plural = "Detalles de Cesta"
        unique_together = ('cestadetalle_cesta', 'cestadetalle_fruto') # Un fruto (tipo) solo puede estar una vez por cesta

    def __str__(self):
        return f"{self.cestadetalle_cantidad}x {self.cestadetalle_fruto.fruto_nombre} en Cesta {self.cestadetalle_cesta.cesta_id}"


class FrutoColocado(models.Model):
    """
    Registra cada instancia de un fruto que ha sido colocado en el árbol por un usuario.
    """
    frutocolocado_id = models.AutoField(primary_key=True)
    # A qué cesta (y por tanto, a qué usuario) pertenece este fruto
    frutocolocado_cesta = models.ForeignKey('Cesta', on_delete=models.CASCADE, related_name='frutos_colocados')
    # Qué tipo de fruto es (verde, rojo, dorado)
    frutocolocado_fruto = models.ForeignKey('Fruto', on_delete=models.CASCADE)
    
    # Parámetros 3D para la posición
    position_x = models.FloatField(default=0.0)
    position_y = models.FloatField(default=0.0)
    position_z = models.FloatField(default=0.0)

    class Meta:
        verbose_name = "Fruto Colocado"
        verbose_name_plural = "Frutos Colocados"

    def __str__(self):
        return f"Fruto {self.frutocolocado_fruto.fruto_nombre} en Cesta {self.frutocolocado_cesta.cesta_id}"