from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Usuario, Clase, Servicio, Asistencia, FrutoAsignado, Cesta
from django.utils.timezone import now


@receiver(post_save, sender=Usuario)
def asignar_profesor_jefe(sender, instance, **kwargs):
    if instance.usuario_rol == 'profesor_jefe' and instance.usuario_clase_actual:
        clase = instance.usuario_clase_actual

        # Asignar como profesor jefe si no hay ninguno
        if clase.clase_profesor_jefe is None:
            clase.clase_profesor_jefe = instance
            clase.save()

    # Caso inverso: si se le cambia el rol desde profesor_jefe a otro
    elif instance.usuario_rol != 'profesor_jefe':
        # Buscar si era profesor jefe de alguna clase
        clases_jefe = Clase.objects.filter(clase_profesor_jefe=instance)
        for clase in clases_jefe:
            clase.clase_profesor_jefe = None
            clase.save()

@receiver(post_save, sender=Servicio)
def crear_asistencia_al_crear_servicio(sender, instance, created, **kwargs):
    if created:
        # Evita duplicar si por alguna razón ya existía
        if not hasattr(instance, 'asistencia'):
            clase = None
            if instance.servicio_profesor_encargado and instance.servicio_profesor_encargado.usuario_clase_actual:
                clase = instance.servicio_profesor_encargado.usuario_clase_actual

            if clase:
                Asistencia.objects.create(
                    asistencia_servicio=instance,
                    asistencia_fecha=instance.servicio_fecha_hora.date(),
                    asistencia_tipo_clase=clase,
                    asistencia_fruto_asociado=None  # Puedes definir lógica adicional aquí si quieres asignar un fruto por defecto
                )

@receiver(post_save, sender=FrutoAsignado)
def actualizar_cesta_al_asignar_fruto(sender, instance, created, **kwargs):
    """
    Esta señal se activa cada vez que se guarda un objeto FrutoAsignado.
    Si es una nueva asignación (created=True), actualiza la cesta del usuario.
    """
    # Solo queremos ejecutar esta lógica cuando se CREA una nueva asignación de fruto.
    if created:
        usuario = instance.frutoasignado_usuario
        fruto = instance.frutoasignado_fruto

        # Nos aseguramos de que el usuario tenga una cesta. Si no la tiene, se crea.
        cesta, cesta_created = Cesta.objects.get_or_create(cesta_usuario=usuario)

        # Verificamos el color del fruto y actualizamos el contador correspondiente.
        if fruto.fruto_color == 'verdes':
            cesta.cesta_total_verdes += 1
        elif fruto.fruto_color == 'rojas':
            cesta.cesta_total_rojas += 1
        elif fruto.fruto_color == 'doradas':
            cesta.cesta_total_doradas += 1
        
        # Guardamos los cambios en la cesta.
        cesta.save()
        print(f"Cesta de {usuario.username} actualizada: +1 {fruto.fruto_color}")