from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Usuario, Alumno, Profesor, Clase, Mascota,
    Cesta, Fruto, FrutoAsignado, Servicio, TipoServicio,
    Actividad, TipoActividad, ActividadDetalle,
    Desafio, DesafioDetalle, Regla, Asistencia, FrutoColocado, MascotaEstado, 
    CestaDetalle, DesafioCumplido, DesafioClase,
    Noticia
)

# --- Inlines para una mejor gestión ---

# Inline para que el perfil de Alumno se pueda editar dentro del Usuario
class AlumnoInline(admin.StackedInline):
    model = Alumno
    can_delete = False
    verbose_name_plural = 'Perfil de Alumno'
    fk_name = 'alumno_usuario'
    # Campos que se mostrarán en el inline
    fields = ('alumno_codigo_invitacion', 'alumno_invitado_por', 'alumno_alergias', 'alumno_enfermedades_base', 'alumno_observaciones_profesor', 'alumno_nombre_apoderado', 'alumno_telefono_apoderado', 'alumno_direccion')
    readonly_fields = ('alumno_codigo_invitacion',) # El código no se debe editar manualmente
    autocomplete_fields = ['alumno_invitado_por'] # Facilita la búsqueda de quien invita

# Inline para que el perfil de Profesor se pueda editar dentro del Usuario
class ProfesorInline(admin.StackedInline):
    model = Profesor
    can_delete = False
    verbose_name_plural = 'Perfil de Profesor'
    fk_name = 'profesor_usuario'

# Inline para los detalles de la cesta
class CestaDetalleInline(admin.TabularInline):
    model = CestaDetalle
    extra = 1 # Cuántos campos vacíos mostrar
    autocomplete_fields = ['cestadetalle_fruto']


# --- Configuraciones del Admin para cada Modelo ---

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    """
    Configuración personalizada para el modelo Usuario en el admin.
    """
    # Usa los inlines para Alumno y Profesor
    inlines = (AlumnoInline, ProfesorInline)
    
    # Campos a mostrar en la lista de usuarios
    list_display = ('username', 'usuario_nombre_completo', 'usuario_rol', 'usuario_clase_actual', 'is_staff')
    # Filtros en la barra lateral
    list_filter = ('usuario_rol', 'is_staff', 'is_superuser', 'groups', 'usuario_clase_actual')
    # Campos por los que se puede buscar
    search_fields = ('username', 'usuario_nombre_completo', 'usuario_email', 'usuario_rut')
    
    # Organización de los campos en la vista de edición
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {'fields': ('usuario_nombre_completo', 'usuario_email', 'usuario_rut', 'usuario_fecha_nacimiento', 'usuario_telefono', 'usuario_avatar')}),
        ('Asignaciones', {'fields': ('usuario_rol', 'usuario_clase_actual')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ('last_login', 'date_joined')


@admin.register(Clase)
class ClaseAdmin(admin.ModelAdmin):
    list_display = ('clase_nombre', 'clase_profesor_jefe', 'clase_mascota')
    search_fields = ('clase_nombre',)
    list_filter = ('clase_profesor_jefe',)
    # Autocompletar para facilitar la búsqueda de usuarios
    autocomplete_fields = ['clase_profesor_jefe', 'clase_mascota']

@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ('mascota_nombre', 'mascota_id')
    search_fields = ('mascota_nombre',)

@admin.register(MascotaEstado)
class MascotaEstadoAdmin(admin.ModelAdmin):
    list_display = ('mascota_estado_usuario', 'mascota_estado_hambre', 'mascota_estado_sed', 'mascota_estado_sobrenombre')
    search_fields = ('mascota_estado_usuario__username',)
    readonly_fields = ('mascota_estado_last_update',)

@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'servicio_clase', 'servicio_fecha_hora', 'servicio_profesor_encargado')
    list_filter = ('servicio_clase', 'servicio_tiposervicio', 'servicio_fecha_hora')
    search_fields = ('servicio_descripcion',)
    autocomplete_fields = ['servicio_clase', 'servicio_tiposervicio', 'servicio_profesor_encargado']
    date_hierarchy = 'servicio_fecha_hora'

@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('asistencia_servicio', 'asistencia_fecha', 'asistencia_tipo_clase')
    list_filter = ('asistencia_tipo_clase', 'asistencia_fecha')
    autocomplete_fields = ['asistencia_servicio', 'asistencia_tipo_clase', 'asistencia_fruto_asociado']
    readonly_fields = ('asistencia_rutAsistentes',) # Es mejor no editar esta cadena directamente

@admin.register(Fruto)
class FrutoAdmin(admin.ModelAdmin):
    list_display = ('fruto_nombre', 'fruto_color', 'fruto_id')
    search_fields = ('fruto_nombre',)

@admin.register(FrutoAsignado)
class FrutoAsignadoAdmin(admin.ModelAdmin):
    list_display = ('frutoasignado_usuario', 'frutoasignado_fruto', 'frutoasignado_fecha', 'frutoasignado_origen')
    list_filter = ('frutoasignado_fruto', 'frutoasignado_fecha', 'frutoasignado_origen')
    search_fields = ('frutoasignado_usuario__username', 'frutoasignado_motivo')
    autocomplete_fields = ['frutoasignado_usuario', 'frutoasignado_fruto']
    date_hierarchy = 'frutoasignado_fecha'

@admin.register(Cesta)
class CestaAdmin(admin.ModelAdmin):
    inlines = [CestaDetalleInline]
    list_display = ('cesta_usuario', 'cesta_total_verdes', 'cesta_total_rojas', 'cesta_total_doradas')
    search_fields = ('cesta_usuario__username',)
    autocomplete_fields = ['cesta_usuario']

@admin.register(Desafio)
class DesafioAdmin(admin.ModelAdmin):
    list_display = ('desafio_descripcion', 'desafio_fruto_asociado', 'desafio_asignacionAutomatica')
    list_filter = ('desafio_asignacionAutomatica',)
    search_fields = ('desafio_descripcion',)
    autocomplete_fields = ['desafio_fruto_asociado', 'desafio_idregla']

# --- Registros para modelos relacionados (CORREGIDO) ---

@admin.register(TipoServicio)
class TipoServicioAdmin(admin.ModelAdmin):
    search_fields = ['Tipo_ServicioDescripcion']

@admin.register(Regla)
class ReglaAdmin(admin.ModelAdmin):
    search_fields = ['regla_descripcion']
    list_display = ('regla_descripcion', 'regla_aplicable_a')
    list_filter = ('regla_aplicable_a',)

# --- Registros para otros modelos ---

@admin.register(TipoActividad)
class TipoActividadAdmin(admin.ModelAdmin):
    search_fields = ['Tipo_ActividadDescripcion']

@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = ('actividad_descripcion', 'actividad_servicioId', 'Actividad_TipoActividad')
    search_fields = ['actividad_descripcion']
    autocomplete_fields = ['actividad_servicioId', 'Actividad_TipoActividad']

@admin.register(ActividadDetalle)
class ActividadDetalleAdmin(admin.ModelAdmin):
    autocomplete_fields = ['ActividadDetalle_ActividadId', 'ActividadDetalle_DesafioID']

@admin.register(DesafioDetalle)
class DesafioDetalleAdmin(admin.ModelAdmin):
    autocomplete_fields = ['desafiodetalle_desafio']

@admin.register(DesafioCumplido)
class DesafioCumplidoAdmin(admin.ModelAdmin):
    list_display = ('desaficump_usuario', 'desaficump_desafio', 'desaficump_fecha')
    search_fields = ('desaficump_usuario__username', 'desaficump_desafio__desafio_descripcion')
    date_hierarchy = 'desaficump_fecha'
    autocomplete_fields = ['desaficump_usuario', 'desaficump_desafio', 'desaficump_aprobado_por']

@admin.register(FrutoColocado)
class FrutoColocadoAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'position_x', 'position_y', 'position_z')
    autocomplete_fields = ['frutocolocado_cesta', 'frutocolocado_fruto']

@admin.register(Noticia)
class NoticiaAdmin(admin.ModelAdmin):
    """
    Configuración personalizada para el modelo Noticia en el panel de administración de Django.
    """
    
    # Campos que se mostrarán en la lista de noticias
    list_display = ('noticia_titulo', 'noticia_fecha_publicacion', 'noticia_publicada')
    
    # Filtros que aparecerán en la barra lateral derecha
    list_filter = ('noticia_publicada', 'noticia_fecha_publicacion')
    
    # Campos por los que se podrá buscar
    search_fields = ('noticia_titulo', 'noticia_contenido')
    
    # Añade una jerarquía de navegación por fechas debajo de la barra de búsqueda
    date_hierarchy = 'noticia_fecha_publicacion'
    
    # Define el orden y la disposición de los campos en el formulario de edición
    fields = ('noticia_titulo', 'noticia_contenido', 'noticia_imagen', 'noticia_publicada')
    
    # Permite activar o desactivar noticias en masa desde la lista
    actions = ['marcar_como_publicada', 'marcar_como_no_publicada']

    def marcar_como_publicada(self, request, queryset):
        """Acción para publicar las noticias seleccionadas."""
        queryset.update(noticia_publicada=True)
    marcar_como_publicada.short_description = "Publicar noticias seleccionadas"

    def marcar_como_no_publicada(self, request, queryset):
        """Acción para despublicar las noticias seleccionadas."""
        queryset.update(noticia_publicada=False)
    marcar_como_no_publicada.short_description = "Ocultar noticias seleccionadas"


@admin.register(DesafioClase)
class DesafioClaseAdmin(admin.ModelAdmin):
    """
    Configuración para el modelo DesafioClase en el panel de admin.
    """
    list_display = ('desafio_clase', 'desafio_titulo', 'desafio_activo')
    list_filter = ('desafio_activo', 'desafio_clase')
    search_fields = ('desafio_titulo', 'desafio_clase__clase_nombre')
    # Facilita la selección de la clase
    autocomplete_fields = ['desafio_clase']
    
    # Permite activar o desactivar desafíos en masa desde la lista
    actions = ['activar_desafios', 'desactivar_desafios']

    def activar_desafios(self, request, queryset):
        queryset.update(desafio_activo=True)
    activar_desafios.short_description = "Activar desafíos seleccionados"

    def desactivar_desafios(self, request, queryset):
        queryset.update(desafio_activo=False)
    desactivar_desafios.short_description = "Desactivar desafíos seleccionados"
