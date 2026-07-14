# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    Usuario, Alumno, Profesor, Clase, Mascota,
    Cesta, Fruto, FrutoAsignado, Servicio, TipoServicio,
    Actividad, TipoActividad, ActividadDetalle,
    Desafio, DesafioDetalle, Regla, Asistencia, FrutoColocado, MascotaEstado, 
    CestaDetalle, DesafioCumplido, DesafioClase,
    Noticia
)

# --- Inlines para una mejor gestión de Relaciones ---

# Inline para que el perfil de Alumno se pueda editar dentro del Usuario
class AlumnoInline(admin.StackedInline):
    model = Alumno
    can_delete = False
    verbose_name_plural = 'Perfil de Alumno'
    fk_name = 'alumno_usuario'
    fields = (
        'alumno_codigo_invitacion', 'alumno_invitado_por', 'alumno_monedas',
        'alumno_skin_equipada', 'alumno_inventario',
        'alumno_alergias', 'alumno_enfermedades_base', 'alumno_observaciones_profesor',
        'alumno_nombre_apoderado', 'alumno_telefono_apoderado', 'alumno_direccion'
    )
    readonly_fields = ('alumno_codigo_invitacion',) # El código no se debe editar manualmente
    autocomplete_fields = ['alumno_invitado_por'] # Facilita la búsqueda de quien invita

# Inline para que el perfil de Profesor se pueda editar dentro del Usuario
class ProfesorInline(admin.StackedInline):
    model = Profesor
    can_delete = False
    verbose_name_plural = 'Perfil de Profesor'
    fk_name = 'profesor_usuario'

# Inline para ver/modificar el estado de la mascota desde el Usuario
class MascotaEstadoInline(admin.TabularInline):
    model = MascotaEstado
    extra = 0
    verbose_name_plural = 'Estado de Mascota'
    fields = ('mascota_estado_sobrenombre', 'mascota_estado_hambre', 'mascota_estado_sed')

# Inline para ver/modificar la cesta desde el Usuario
class CestaInline(admin.TabularInline):
    model = Cesta
    extra = 0
    verbose_name_plural = 'Cesta de Frutos'
    fields = ('cesta_total_verdes', 'cesta_total_rojas', 'cesta_total_doradas')

# Inline para los detalles de la cesta (ladrillos/ladrillitos de frutas)
class CestaDetalleInline(admin.TabularInline):
    model = CestaDetalle
    extra = 1
    autocomplete_fields = ['cestadetalle_fruto']

# Inline para ver frutos puestos físicamente en el árbol por el alumno
class FrutoColocadoInline(admin.TabularInline):
    model = FrutoColocado
    extra = 1
    autocomplete_fields = ['frutocolocado_fruto']

# Inline para detalles adicionales de los desafíos
class DesafioDetalleInline(admin.TabularInline):
    model = DesafioDetalle
    extra = 1

# Inline para los detalles de la actividad vinculada a desafíos
class ActividadDetalleInline(admin.TabularInline):
    model = ActividadDetalle
    extra = 1
    autocomplete_fields = ['ActividadDetalle_ActividadId', 'ActividadDetalle_DesafioID']


# --- Configuraciones del Admin para cada Modelo ---

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    """
    Configuración personalizada para el modelo Usuario en el admin.
    """
    inlines = (AlumnoInline, ProfesorInline, MascotaEstadoInline, CestaInline)
    list_display = ('username', 'usuario_nombre_completo', 'usuario_rol', 'usuario_clase_actual', 'is_staff', 'is_active')
    list_filter = ('usuario_rol', 'is_staff', 'is_superuser', 'is_active', 'groups', 'usuario_clase_actual')
    search_fields = ('username', 'usuario_nombre_completo', 'usuario_email', 'usuario_rut')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {'fields': ('usuario_nombre_completo', 'usuario_email', 'usuario_rut', 'usuario_fecha_nacimiento', 'usuario_telefono', 'usuario_avatar')}),
        ('Asignaciones', {'fields': ('usuario_rol', 'usuario_clase_actual', 'usuario_clases')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ('last_login', 'date_joined')
    filter_horizontal = ('usuario_clases',)
    actions = ['activar_usuarios', 'desactivar_usuarios']

    def activar_usuarios(self, request, queryset):
        queryset.update(is_active=True)
    activar_usuarios.short_description = "🟢 Activar usuarios seleccionados"

    def desactivar_usuarios(self, request, queryset):
        queryset.update(is_active=False)
    desactivar_usuarios.short_description = "🔴 Desactivar usuarios seleccionados"


@admin.register(Alumno)
class AlumnoAdmin(admin.ModelAdmin):
    """
    Administración detallada de Alumnos con edición rápida en lista.
    """
    list_display = ('alumno_usuario', 'alumno_monedas', 'alumno_skin_equipada', 'alumno_codigo_invitacion')
    list_editable = ('alumno_monedas', 'alumno_skin_equipada') # Edición directa desde la lista
    search_fields = ('alumno_usuario__username', 'alumno_usuario__usuario_nombre_completo', 'alumno_codigo_invitacion')
    list_filter = ('alumno_monedas', 'alumno_skin_equipada')
    readonly_fields = ('alumno_codigo_invitacion',)
    autocomplete_fields = ['alumno_usuario', 'alumno_invitado_por', 'alumno_cambiado_por']
    actions = ['dar_100_monedas', 'dar_500_monedas', 'reiniciar_monedas']

    def dar_100_monedas(self, request, queryset):
        for alumno in queryset:
            alumno.alumno_monedas += 100
            alumno.save()
    dar_100_monedas.short_description = "🪙 Otorgar +100 monedas a alumnos seleccionados"

    def dar_500_monedas(self, request, queryset):
        for alumno in queryset:
            alumno.alumno_monedas += 500
            alumno.save()
    dar_500_monedas.short_description = "🪙 Otorgar +500 monedas a alumnos seleccionados"

    def reiniciar_monedas(self, request, queryset):
        queryset.update(alumno_monedas=0)
    reiniciar_monedas.short_description = "❌ Restablecer monedas a 0"


@admin.register(Profesor)
class ProfesorAdmin(admin.ModelAdmin):
    list_display = ('profesor_usuario', 'profesor_clases_dirigidas', 'profesor_fecha_proxima_clase')
    list_editable = ('profesor_clases_dirigidas', 'profesor_fecha_proxima_clase')
    search_fields = ('profesor_usuario__username', 'profesor_usuario__usuario_nombre_completo')
    autocomplete_fields = ['profesor_usuario']


@admin.register(Clase)
class ClaseAdmin(admin.ModelAdmin):
    list_display = ('clase_nombre', 'clase_profesor_jefe', 'clase_mascota', 'clase_edad_referencia_min', 'clase_edad_referencia_max')
    list_editable = ('clase_profesor_jefe', 'clase_mascota') # Cambiar jefatura o mascota desde grilla
    search_fields = ('clase_nombre',)
    list_filter = ('clase_profesor_jefe', 'clase_mascota')
    autocomplete_fields = ['clase_profesor_jefe', 'clase_mascota']


@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ('mascota_nombre', 'mascota_id', 'mascota_modelo_3d_path')
    list_editable = ('mascota_modelo_3d_path',)
    search_fields = ('mascota_nombre',)


@admin.register(MascotaEstado)
class MascotaEstadoAdmin(admin.ModelAdmin):
    """
    Muestra los estados de hambre/sed con barras de progreso de colores HTML5.
    """
    list_display = ('mascota_estado_usuario', 'mascota_estado_sobrenombre', 'hambre_barra', 'sed_barra', 'mascota_estado_last_update')
    list_editable = ('mascota_estado_sobrenombre',)
    search_fields = ('mascota_estado_usuario__username', 'mascota_estado_sobrenombre')
    readonly_fields = ('mascota_estado_last_update',)
    list_filter = ('mascota_estado_hambre', 'mascota_estado_sed')
    autocomplete_fields = ['mascota_estado_usuario']
    actions = ['alimentar_totalmente', 'simular_necesidad']

    def hambre_barra(self, obj):
        color = '#10b981' if obj.mascota_estado_hambre > 50 else '#f59e0b' if obj.mascota_estado_hambre > 20 else '#ef4444'
        return format_html(
            '<div style="width:100px; background-color:#e2e8f0; border-radius:4px; overflow:hidden; display:inline-block; vertical-align:middle; margin-right:5px;">'
            '<div style="width:{}px; background-color:{}; height:10px;"></div>'
            '</div> <span style="font-size:11px; font-weight:bold; color: {};">{}%</span>',
            obj.mascota_estado_hambre, color, color, obj.mascota_estado_hambre
        )
    hambre_barra.short_description = "Hambre 🍖"

    def sed_barra(self, obj):
        color = '#3b82f6' if obj.mascota_estado_sed > 50 else '#f59e0b' if obj.mascota_estado_sed > 20 else '#ef4444'
        return format_html(
            '<div style="width:100px; background-color:#e2e8f0; border-radius:4px; overflow:hidden; display:inline-block; vertical-align:middle; margin-right:5px;">'
            '<div style="width:{}px; background-color:{}; height:10px;"></div>'
            '</div> <span style="font-size:11px; font-weight:bold; color: {};">{}%</span>',
            obj.mascota_estado_sed, color, color, obj.mascota_estado_sed
        )
    sed_barra.short_description = "Sed 💧"

    def alimentar_totalmente(self, request, queryset):
        queryset.update(mascota_estado_hambre=100, mascota_estado_sed=100)
    alimentar_totalmente.short_description = "🍗 Alimentar e hidratar al 100% las mascotas seleccionadas"

    def simular_necesidad(self, request, queryset):
        for estado in queryset:
            estado.mascota_estado_hambre = max(0, estado.mascota_estado_hambre - 25)
            estado.mascota_estado_sed = max(0, estado.mascota_estado_sed - 25)
            estado.save()
    simular_necesidad.short_description = "⏳ Simular paso del tiempo (-25% hambre y sed)"


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'servicio_clase', 'servicio_tiposervicio', 'servicio_fecha_hora', 'servicio_profesor_encargado')
    list_editable = ('servicio_profesor_encargado',)
    list_filter = ('servicio_clase', 'servicio_tiposervicio', 'servicio_fecha_hora')
    search_fields = ('servicio_descripcion',)
    autocomplete_fields = ['servicio_clase', 'servicio_tiposervicio', 'servicio_profesor_encargado']
    date_hierarchy = 'servicio_fecha_hora'


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('asistencia_servicio', 'asistencia_fecha', 'asistencia_tipo_clase', 'asistencia_fruto_asociado')
    list_editable = ('asistencia_fruto_asociado',)
    list_filter = ('asistencia_tipo_clase', 'asistencia_fecha')
    autocomplete_fields = ['asistencia_servicio', 'asistencia_tipo_clase', 'asistencia_fruto_asociado']
    readonly_fields = ('asistencia_rutAsistentes',) # Es mejor no editar esta cadena directamente


@admin.register(Fruto)
class FrutoAdmin(admin.ModelAdmin):
    list_display = ('fruto_nombre', 'fruto_color', 'fruto_id', 'fruto_modelo_3d_path')
    list_editable = ('fruto_color', 'fruto_modelo_3d_path')
    search_fields = ('fruto_nombre',)


@admin.register(FrutoAsignado)
class FrutoAsignadoAdmin(admin.ModelAdmin):
    list_display = ('frutoasignado_usuario', 'frutoasignado_fruto', 'frutoasignado_fecha', 'frutoasignado_origen', 'frutoasignado_motivo')
    list_filter = ('frutoasignado_fruto', 'frutoasignado_fecha', 'frutoasignado_origen')
    search_fields = ('frutoasignado_usuario__username', 'frutoasignado_motivo')
    autocomplete_fields = ['frutoasignado_usuario', 'frutoasignado_fruto']
    date_hierarchy = 'frutoasignado_fecha'


@admin.register(Cesta)
class CestaAdmin(admin.ModelAdmin):
    inlines = [CestaDetalleInline, FrutoColocadoInline]
    list_display = (
        'cesta_usuario', 'cesta_total_verdes', 'cesta_total_rojas', 'cesta_total_doradas',
        'cesta_verdes_puestas', 'cesta_rojas_puestas', 'cesta_doradas_puestas'
    )
    search_fields = ('cesta_usuario__username',)
    autocomplete_fields = ['cesta_usuario']


@admin.register(Desafio)
class DesafioAdmin(admin.ModelAdmin):
    inlines = [DesafioDetalleInline]
    list_display = ('desafio_descripcion', 'desafio_fruto_asociado', 'desafio_asignacionAutomatica')
    list_editable = ('desafio_asignacionAutomatica',)
    list_filter = ('desafio_asignacionAutomatica',)
    search_fields = ('desafio_descripcion',)
    autocomplete_fields = ['desafio_fruto_asociado', 'desafio_idregla']


@admin.register(TipoServicio)
class TipoServicioAdmin(admin.ModelAdmin):
    search_fields = ['Tipo_ServicioDescripcion']
    list_display = ('Tipo_ServicioDescripcion',)


@admin.register(Regla)
class ReglaAdmin(admin.ModelAdmin):
    search_fields = ['regla_descripcion']
    list_display = ('regla_descripcion', 'regla_aplicable_a')
    list_filter = ('regla_aplicable_a',)


@admin.register(TipoActividad)
class TipoActividadAdmin(admin.ModelAdmin):
    search_fields = ['Tipo_ActividadDescripcion']
    list_display = ('Tipo_ActividadDescripcion',)


@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    inlines = [ActividadDetalleInline]
    list_display = ('actividad_descripcion', 'actividad_servicioId', 'Actividad_TipoActividad')
    search_fields = ['actividad_descripcion']
    autocomplete_fields = ['actividad_servicioId', 'Actividad_TipoActividad']


@admin.register(ActividadDetalle)
class ActividadDetalleAdmin(admin.ModelAdmin):
    list_display = ('ActividadDetalle_id', 'ActividadDetalle_ActividadId', 'ActividadDetalle_DesafioID')
    autocomplete_fields = ['ActividadDetalle_ActividadId', 'ActividadDetalle_DesafioID']


@admin.register(DesafioDetalle)
class DesafioDetalleAdmin(admin.ModelAdmin):
    list_display = ('desafiodetalle_id', 'desafiodetalle_desafio')
    autocomplete_fields = ['desafiodetalle_desafio']


@admin.register(DesafioCumplido)
class DesafioCumplidoAdmin(admin.ModelAdmin):
    list_display = ('desaficump_usuario', 'desaficump_desafio', 'desaficump_fecha', 'desaficump_aprobado_por')
    search_fields = ('desaficump_usuario__username', 'desaficump_desafio__desafio_descripcion')
    date_hierarchy = 'desaficump_fecha'
    autocomplete_fields = ['desaficump_usuario', 'desaficump_desafio', 'desaficump_aprobado_por']


@admin.register(FrutoColocado)
class FrutoColocadoAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'position_x', 'position_y', 'position_z')
    autocomplete_fields = ['frutocolocado_cesta', 'frutocolocado_fruto']


@admin.register(Noticia)
class NoticiaAdmin(admin.ModelAdmin):
    list_display = ('noticia_titulo', 'noticia_clase', 'noticia_fecha_publicacion', 'noticia_publicada')
    list_editable = ('noticia_publicada', 'noticia_clase')
    list_filter = ('noticia_publicada', 'noticia_clase', 'noticia_fecha_publicacion')
    search_fields = ('noticia_titulo', 'noticia_contenido')
    date_hierarchy = 'noticia_fecha_publicacion'
    fields = ('noticia_titulo', 'noticia_contenido', 'noticia_imagen', 'noticia_clase', 'noticia_publicada')
    autocomplete_fields = ['noticia_clase']
    actions = ['marcar_como_publicada', 'marcar_como_no_publicada']

    def marcar_como_publicada(self, request, queryset):
        queryset.update(noticia_publicada=True)
    marcar_como_publicada.short_description = "🟢 Publicar noticias seleccionadas"

    def marcar_como_no_publicada(self, request, queryset):
        queryset.update(noticia_publicada=False)
    marcar_como_no_publicada.short_description = "🔴 Ocultar/Despublicar noticias seleccionadas"


@admin.register(DesafioClase)
class DesafioClaseAdmin(admin.ModelAdmin):
    list_display = ('desafio_clase', 'desafio_titulo', 'desafio_activo')
    list_editable = ('desafio_activo',)
    list_filter = ('desafio_activo', 'desafio_clase')
    search_fields = ('desafio_titulo', 'desafio_clase__clase_nombre')
    autocomplete_fields = ['desafio_clase']
    actions = ['activar_desafios', 'desactivar_desafios']

    def activar_desafios(self, request, queryset):
        queryset.update(desafio_activo=True)
    activar_desafios.short_description = "🟢 Activar desafíos de clase seleccionados"

    def desactivar_desafios(self, request, queryset):
        queryset.update(desafio_activo=False)
    desactivar_desafios.short_description = "🔴 Desactivar desafíos de clase seleccionados"
