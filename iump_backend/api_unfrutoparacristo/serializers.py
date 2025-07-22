from rest_framework import serializers
from .models import (
    Usuario, Alumno, Profesor, Clase, Mascota,
    Cesta, Fruto, FrutoAsignado, Servicio,
    Actividad, Desafio, DesafioDetalle, Regla, DesafioClase, 
    FrutoColocado, MascotaEstado, Noticia, TipoServicio
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.db.models import Q



# --- Serializadores para Modelos Base ---

class MascotaSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Mascota.
    """
    class Meta:
        model = Mascota
        fields = '__all__' # Incluye todos los campos del modelo Mascota

class ClaseSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Clase.
    Anida el serializador de Mascota y muestra el username del profesor jefe.
    """
    clase_mascota = MascotaSerializer(read_only=True) # Anidar el serializador de Mascota
    # Para profesor_jefe, solo mostrar el username, no el objeto completo
    clase_profesor_jefe_username = serializers.CharField(source='clase_profesor_jefe.username', read_only=True, allow_null=True)

    class Meta:
        model = Clase
        fields = [
            'clase_id', 'clase_nombre', 'clase_edad_referencia_min',
            'clase_edad_referencia_max', 'clase_descripcion',
            'clase_mascota', 'clase_profesor_jefe', 'clase_profesor_jefe_username'
        ]
        extra_kwargs = {
            'clase_profesor_jefe': {'write_only': True, 'required': False, 'allow_null': True}
        }

class FrutoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Fruto.
    """
    class Meta:
        model = Fruto
        fields = '__all__'

class ServicioSerializer(serializers.ModelSerializer):
    """

    Serializador para el modelo Servicio.
    """
    class Meta:
        model = Servicio
        fields = '__all__'

class ActividadSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Actividad.
    """
    class Meta:
        model = Actividad
        fields = '__all__'

class ReglaSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Regla.
    """
    class Meta:
        model = Regla
        fields = '__all__'

class DesafioSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Desafio.
    Anida el serializador de Fruto y maneja la relación con Regla.
    """
    desafio_fruto_asociado = FrutoSerializer(read_only=True) # Anidar el serializador de Fruto
    # Para enviar solo el ID del fruto al crear/actualizar
    desafio_fruto_asociado_id = serializers.PrimaryKeyRelatedField(queryset=Fruto.objects.all(), source='desafio_fruto_asociado', write_only=True, required=False, allow_null=True)
    
    desafio_idregla = ReglaSerializer(read_only=True) # Anidar el serializador de Regla
    desafio_idregla_id = serializers.PrimaryKeyRelatedField(queryset=Regla.objects.all(), source='desafio_idregla', write_only=True, required=False, allow_null=True)

    class Meta:
        model = Desafio
        fields = [
            'desafio_id', 'desafio_descripcion', 'desafio_fruto_asociado',
            'desafio_fruto_asociado_id', 'desafio_asignacionAutomatica',
            'desafio_idregla', 'desafio_idregla_id'
        ]

class DesafioDetalleSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo DesafioDetalle.
    """
    desafiodetalle_desafio = DesafioSerializer(read_only=True) # Anidar el serializador de Desafio
    desafiodetalle_desafio_id = serializers.PrimaryKeyRelatedField(queryset=Desafio.objects.all(), source='desafiodetalle_desafio', write_only=True)

    class Meta:
        model = DesafioDetalle
        fields = '__all__'



class MascotaEstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MascotaEstado
        fields = [
            'mascota_estado_hambre',
            'mascota_estado_sed',
            'mascota_estado_sobrenombre',
            'mascota_estado_last_update',
        ]

class MascotaEstadoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MascotaEstado
        fields = ['mascota_estado_hambre', 'mascota_estado_sed', 'mascota_estado_sobrenombre']
        read_only_fields = []  # Aquí puedes definir campos que no quieres actualizar si los hay

    def validate_mascota_estado_hambre(self, value):
        # Validar que el nivel de hambre esté entre 0 y 100, por ejemplo
        if not 0 <= value <= 100:
            raise serializers.ValidationError("El nivel de hambre debe estar entre 0 y 100.")
        return value

    def validate_mascota_estado_sed(self, value):
        # Igual validación para sed
        if not 0 <= value <= 100:
            raise serializers.ValidationError("El nivel de sed debe estar entre 0 y 100.")
        return value

# --- Serializadores para Modelos de Usuario y Perfiles ---

class AlumnoSerializer(serializers.ModelSerializer):
    alumno_invitado_por_username = serializers.SerializerMethodField()
    alumno_cambiado_por_username = serializers.SerializerMethodField()
    mascota_estado = MascotaEstadoSerializer(source='alumno_usuario.mascota_estado', read_only=True)
    manzanas_en_inventario = serializers.SerializerMethodField()
    
    class Meta:
        model = Alumno
        fields = [
            'alumno_codigo_invitacion', 'alumno_invitado_por_username',
            'alumno_fecha_cambio_clase', 'alumno_cambiado_por_username',
            'alumno_alergias', 'alumno_enfermedades_base', 'alumno_observaciones_profesor',
            'alumno_telefono_apoderado', 'alumno_direccion',
            'mascota_estado', 'manzanas_en_inventario', 'alumno_nombre_apoderado'
        ]

    def get_alumno_invitado_por_username(self, obj):
        if obj.alumno_invitado_por:
            return obj.alumno_invitado_por.username
        return None

    def get_alumno_cambiado_por_username(self, obj):
        if obj.alumno_cambiado_por:
            return obj.alumno_cambiado_por.username
        return None

    def get_manzanas_en_inventario(self, obj):
        user = obj.alumno_usuario
        if hasattr(user, 'cesta'):
            return (
                user.cesta.cesta_total_verdes +
                user.cesta.cesta_total_rojas +
                user.cesta.cesta_total_doradas
            )
        return 0



class ProfesorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profesor
        fields = [
            'profesor_clases_dirigidas',
            'profesor_fecha_proxima_clase',
        ]


class UsuarioSerializer(serializers.ModelSerializer):
    usuario_clase_actual = ClaseSerializer(read_only=True)
    perfil = serializers.SerializerMethodField()
    usuario_avatar = serializers.SerializerMethodField()


    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'usuario_email', 'usuario_rol', 'usuario_rut',
            'usuario_nombre_completo', 'usuario_clase_actual',
            'is_active', 'is_staff', 'is_superuser',
            'perfil', 'usuario_avatar', 'usuario_fecha_nacimiento'
        ]

    def get_usuario_avatar(self, obj):
        return obj.usuario_avatar or None

    def get_perfil(self, obj):
        if obj.usuario_rol == 'alumno' and hasattr(obj, 'perfil_alumno'):
            return AlumnoSerializer(obj.perfil_alumno).data
        elif obj.usuario_rol == 'profesor' and hasattr(obj, 'perfil_profesor'):
            return ProfesorSerializer(obj.perfil_profesor).data
        return None


class AlumnoUpdateSerializer(serializers.ModelSerializer):
    

    class Meta:
        model = Alumno
        fields = [
            'alumno_alergias', 'alumno_enfermedades_base',
            'alumno_observaciones_profesor', 'alumno_telefono_apoderado',
            'alumno_direccion',
        ]

class ProfesorUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profesor
        fields = [
            'profesor_clases_dirigidas',
            'profesor_fecha_proxima_clase',
            # otros campos editables de profesor
        ]


class UsuarioProfileUpdateSerializer(serializers.ModelSerializer):
    codigo_invitacion_a_usar = serializers.CharField(write_only=True, required=False, allow_blank=True)
    usuario_avatar = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Usuario
        fields = [
            'username', 'usuario_email', 'usuario_rut', 'usuario_nombre_completo',
            'usuario_fecha_nacimiento',
            'codigo_invitacion_a_usar', 'usuario_avatar',  # para que el alumno pueda agregar invitación
        ]

    def validate_username(self, value):
        if self.instance and Usuario.objects.filter(username=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value

    def validate_usuario_email(self, value):
        if value and self.instance and Usuario.objects.filter(usuario_email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Este correo electrónico ya está en uso.")
        return value

    def update(self, instance, validated_data):
        codigo_invitacion = validated_data.pop('codigo_invitacion_a_usar', None)

        if codigo_invitacion:
            if instance.usuario_rol != 'alumno':
                raise serializers.ValidationError({"codigo_invitacion_a_usar": "Solo los alumnos pueden usar códigos de invitación."})
            if hasattr(instance, 'perfil_alumno'):
                if instance.perfil_alumno.alumno_invitado_por:
                    raise serializers.ValidationError({"codigo_invitacion_a_usar": "Ya has ingresado un código de invitación y no se puede cambiar."})
                try:
                    invitador = Alumno.objects.get(alumno_codigo_invitacion=codigo_invitacion).alumno_usuario
                    if instance.id == invitador.id:
                        raise serializers.ValidationError({"codigo_invitacion_a_usar": "No puedes usar tu propio código de invitación."})
                    instance.perfil_alumno.alumno_invitado_por = invitador
                    instance.perfil_alumno.save()
                    # Aquí puedes agregar la lógica para la recompensa si tienes
                except Alumno.DoesNotExist:
                    raise serializers.ValidationError({"codigo_invitacion_a_usar": "Código de invitación no válido o no existe."})

        return super().update(instance, validated_data)



# --- Serializadores para Registro y Login ---

class RegistroAlumnoSerializer(serializers.ModelSerializer):
    """
    Serializador para el registro de nuevos alumnos.
    """
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    # Ahora esperamos el ID de la clase
    usuario_clase_actual = serializers.PrimaryKeyRelatedField(
        queryset=Clase.objects.all(),
        required=False,
        allow_null=True
    )
    # Campo para el código de invitación usado, si aplica
    # Se añade allow_null=True explícitamente para manejar el valor null de forma más robusta
    codigo_invitacion_usado = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    # Nuevos campos de Usuario
    usuario_rut = serializers.CharField(max_length=12, required=False, allow_blank=True, allow_null=True)
    usuario_nombre_completo = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    usuario_fecha_nacimiento = serializers.DateField(required=True, allow_null=False)
    usuario_telefono = serializers.CharField(required=False, allow_blank=True, allow_null=True)


    class Meta:
        model = Usuario
        fields = [
            'username', 'usuario_email', 'password', 'password2',
            'usuario_rut', 'usuario_nombre_completo', 'usuario_clase_actual',
            'codigo_invitacion_usado', 'usuario_fecha_nacimiento', 'usuario_telefono'
        ]
        extra_kwargs = {
            'usuario_email': {'required': False, 'allow_null': True}, # Email puede ser opcional
        }

    # NUEVA VALIDACIÓN PARA usuario_rut
    def validate_usuario_rut(self, value):
        if value and Usuario.objects.filter(usuario_rut=value).exists():
            raise serializers.ValidationError("Este RUT ya está en uso. Por favor, ingresa un RUT diferente.")
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})

        # Validar si el email ya existe si se proporciona
        if data.get('usuario_email') and Usuario.objects.filter(usuario_email=data['usuario_email']).exists():
            raise serializers.ValidationError({"usuario_email": "Este correo electrónico ya está en uso."})
        
        # Validar si el username ya existe
        if Usuario.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Este nombre de usuario ya está en uso."})

        codigo_invitacion_input = data.get('codigo_invitacion_usado')
        if codigo_invitacion_input: # Este 'if' bloque solo se ejecuta si no es None o cadena vacía
            try:
                # Buscar el Alumno que posee este código de invitación
                inviting_alumno_profile = Alumno.objects.get(alumno_codigo_invitacion=codigo_invitacion_input)
                
                # No puedes usar tu propio código (si ya existiera un usuario con ese username)
                if inviting_alumno_profile.alumno_usuario.username == data.get('username'):
                    raise serializers.ValidationError({"codigo_invitacion_usado": "No puedes usar tu propio código de invitación."})
            except Alumno.DoesNotExist:
                raise serializers.ValidationError({"codigo_invitacion_usado": "Código de invitación no válido o no existe."})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2')
        usuario_clase_actual = validated_data.pop('usuario_clase_actual', None)
        codigo_invitacion_usado_input = validated_data.pop('codigo_invitacion_usado', None)

        usuario = Usuario(
            username=validated_data.get('username'),
            usuario_email=validated_data.get('usuario_email'),
            usuario_rut=validated_data.get('usuario_rut'),
            usuario_nombre_completo=validated_data.get('usuario_nombre_completo'),
            usuario_fecha_nacimiento=validated_data.get('usuario_fecha_nacimiento'),
            usuario_telefono=validated_data.get('usuario_telefono'),
            usuario_rol='alumno',
            usuario_clase_actual=usuario_clase_actual, # Este campo ya recibe la instancia de Clase o None
        )
        usuario.set_password(password)
        usuario.save()

        try:
            # Crear el perfil de Alumno
            alumno = Alumno.objects.create(alumno_usuario=usuario)
            alumno.generar_codigo_invitacion() # Generar el código propio del nuevo alumno

            from api_unfrutoparacristo.models import Cesta, MascotaEstado  # Asegúrate de importar correctamente

            # ✅ Crear la cesta del usuario
            Cesta.objects.create(cesta_usuario=usuario)

            # ✅ Crear el estado de la mascota
            MascotaEstado.objects.create(
                mascota_estado_usuario=usuario,
                mascota_estado_sobrenombre=alumno.alumno_usuario.username,  # O cualquier valor inicial
                mascota_estado_hambre=100,
                mascota_estado_sed=100
            )

            # Si se usó un código de invitación, asignar el invitador
            if codigo_invitacion_usado_input:
                inviting_alumno_profile = Alumno.objects.get(alumno_codigo_invitacion=codigo_invitacion_usado_input)
                alumno.alumno_invitado_por = inviting_alumno_profile.alumno_usuario # Asignar el usuario invitador
                alumno.save()

                # Lógica de recompensa: Asignar un fruto al invitador
                try:
                    fruto_recompensa = Fruto.objects.get(fruto_id=1) # Asume que el ID 1 es el fruto de recompensa por invitación
                    FrutoAsignado.objects.create(
                        frutoasignado_usuario=inviting_alumno_profile.alumno_usuario,
                        frutoasignado_fruto=fruto_recompensa,
                        frutoasignado_motivo="Recompensa por invitación de nuevo alumno",
                        frutoasignado_origen="Invitación"
                    )
                except Fruto.DoesNotExist:
                    print("ADVERTENCIA: No se encontró el fruto de recompensa (ID 1). No se asignó recompensa.")
                except Exception as e:
                    print(f"ERROR al asignar fruto de recompensa: {e}")

        except Exception as e:
            usuario.delete() # Si falla la creación del perfil de alumno, eliminar el usuario para evitar inconsistencias
            raise serializers.ValidationError({"detail": f"Error al crear el perfil de alumno o procesar la invitación: {e}"})

        return usuario


class RegistroProfesorSerializer(serializers.ModelSerializer):
    """
    Serializador para el registro de nuevos profesores.
    """
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    # Ahora esperamos el ID de la clase
    usuario_clase_actual = serializers.PrimaryKeyRelatedField(
        queryset=Clase.objects.all(),
        required=False,
        allow_null=True
    )
    # Nuevos campos de Usuario
    usuario_rut = serializers.CharField(max_length=12, required=False, allow_blank=True, allow_null=True)
    usuario_nombre_completo = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    usuario_fecha_nacimiento = serializers.DateField(required=True, allow_null=False)
    usuario_telefono = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Usuario
        fields = [
            'username', 'usuario_email', 'password', 'password2',
            'usuario_rut', 'usuario_nombre_completo', 'usuario_clase_actual',
            'usuario_fecha_nacimiento', 'usuario_telefono'
        ]
        extra_kwargs = {
            'usuario_email': {'required': False, 'allow_null': True}, # Email puede ser opcional
        }

    # NUEVA VALIDACIÓN PARA usuario_rut
    def validate_usuario_rut(self, value):
        if value and Usuario.objects.filter(usuario_rut=value).exists():
            raise serializers.ValidationError("Este RUT ya está en uso. Por favor, ingresa un RUT diferente.")
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})
        
        # Validar si el email ya existe si se proporciona
        if data.get('usuario_email') and Usuario.objects.filter(usuario_email=data['usuario_email']).exists():
            raise serializers.ValidationError({"usuario_email": "Este correo electrónico ya está en uso."})
        
        # Validar si el username ya existe
        if Usuario.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Este nombre de usuario ya está en uso."})

        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2')
        usuario_clase_actual = validated_data.pop('usuario_clase_actual', None)

        usuario = Usuario(
            username=validated_data.get('username'),
            usuario_email=validated_data.get('usuario_email'),
            usuario_rut=validated_data.get('usuario_rut'),
            usuario_nombre_completo=validated_data.get('usuario_nombre_completo'),
            usuario_fecha_nacimiento=validated_data.get('usuario_fecha_nacimiento'),
            usuario_telefono=validated_data.get('usuario_telefono'),
            usuario_rol='profesor', # Rol por defecto para el registro de profesor
            usuario_clase_actual=usuario_clase_actual, # Este campo ya recibe la instancia de Clase o None
        )
        usuario.set_password(password)
        usuario.save()

        # Crear el perfil de Profesor
        Profesor.objects.create(profesor_usuario=usuario)

        return usuario

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializador personalizado para obtener tokens JWT.
    Permite autenticar por username, email o RUT, y añade el rol del usuario.
    """
    username_field = 'username'  # Campo que recibe el identificador

    def validate(self, attrs):
        identifier = attrs.get('username')
        password = attrs.get('password')
        user = None

        if identifier and password:
            # 1. Intentar autenticación directa con username
            user = authenticate(request=self.context.get('request'), username=identifier, password=password)

            # 2. Si no se encontró, intentar por email
            if not user:
                try:
                    temp_user = Usuario.objects.get(usuario_email__iexact=identifier)
                    user = authenticate(request=self.context.get('request'), username=temp_user.username, password=password)
                except Usuario.DoesNotExist:
                    pass

            # 3. Si no se encontró, intentar por RUT
            if not user:
                try:
                    temp_user = Usuario.objects.get(usuario_rut__iexact=identifier)
                    user = authenticate(request=self.context.get('request'), username=temp_user.username, password=password)
                except Usuario.DoesNotExist:
                    pass

        if user is None:
            raise serializers.ValidationError("Credenciales incorrectas (usuario, RUT o correo electrónico inválido, o contraseña incorrecta).")

        if not user.is_active:
            raise serializers.ValidationError("La cuenta está inactiva. Por favor, contacta al administrador.")

        # ⚠️ MUY IMPORTANTE: Actualizar el valor de username en attrs
        attrs['username'] = user.username
        self.user = user

        data = super().validate(attrs)

        data['usuario_rol'] = self.user.usuario_rol
        data['usuario_clase_actual_nombre'] = (
            self.user.usuario_clase_actual.clase_nombre if self.user.usuario_clase_actual else None
        )

        return data

# --- Serializadores para la Cesta y Frutos Colocados ---

class FrutoColocadoSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar los frutos ya colocados en el árbol.
    """
    # ¡CORRECCIÓN! Mapeamos el campo 'frutocolocado_id' del modelo
    # a un campo llamado 'id' en la respuesta JSON para el frontend.
    id = serializers.IntegerField(source='frutocolocado_id', read_only=True)
    
    tipo = serializers.CharField(source='frutocolocado_fruto.fruto_color', read_only=True)
    position = serializers.SerializerMethodField()
    
    class Meta:
        model = FrutoColocado
        # Ahora 'id' es un campo válido que hemos definido arriba.
        fields = ['id', 'tipo', 'position']

    def get_position(self, obj):
        # Combina los campos x, y, z en un array [x, y, z]
        return [obj.position_x, obj.position_y, obj.position_z]

class CestaSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Cesta.
    Ahora incluye los contadores de inventario Y la lista de frutos colocados.
    """
    # ¡NUEVO! Añadimos el campo que espera el frontend.
    # Usamos el related_name 'frutos_colocados' del nuevo modelo.
    frutos_colocados = FrutoColocadoSerializer(many=True, read_only=True)

    class Meta:
        model = Cesta
        # Incluimos el nuevo campo en la respuesta
        fields = [
            'cesta_id',
            'cesta_total_verdes', 'cesta_total_rojas', 'cesta_total_doradas',
            'cesta_verdes_puestas', 'cesta_rojas_puestas', 'cesta_doradas_puestas',
            'frutos_colocados' # Este es el campo clave para el frontend
        ]

class PonerFrutoSerializer(serializers.Serializer):
    """
    Este serializador no se basa en un modelo directamente.
    Se usa para validar los datos que envía el frontend al colocar un fruto.
    """
    # Los campos que esperamos recibir del frontend
    tipo = serializers.ChoiceField(choices=['verdes', 'rojas', 'doradas'])
    position = serializers.ListField(child=serializers.FloatField(), min_length=3, max_length=3)


# SERIALIZERS PARA ADMINISTRACION PROFESORES

class AlumnoSerializerProfeAdmin(serializers.ModelSerializer):
    alumno_cambiado_por_username = serializers.SerializerMethodField()
    alumno_invitado_por_username = serializers.SerializerMethodField()
    manzanas_en_inventario = serializers.SerializerMethodField()
    
    class Meta:
        model = Alumno
        fields = [
            'alumno_codigo_invitacion', 'alumno_invitado_por_username',
            'alumno_fecha_cambio_clase', 'alumno_cambiado_por_username',
            'alumno_alergias', 'alumno_enfermedades_base', 'alumno_observaciones_profesor',
            'alumno_telefono_apoderado', 'alumno_direccion', 'manzanas_en_inventario', 'alumno_nombre_apoderado'
        ]

    def get_alumno_invitado_por_username(self, obj):
        if obj.alumno_invitado_por:
            return obj.alumno_invitado_por.username
        return None

    def get_alumno_cambiado_por_username(self, obj):
        if obj.alumno_cambiado_por:
            return obj.alumno_cambiado_por.username
        return None

    def get_manzanas_en_inventario(self, obj):
        user = obj.alumno_usuario
        if hasattr(user, 'cesta'):
            return (
                user.cesta.cesta_total_verdes +
                user.cesta.cesta_total_rojas +
                user.cesta.cesta_total_doradas
            )
        return 0


class UsuarioSerializerProfeAdmin(serializers.ModelSerializer):
    usuario_clase_actual = ClaseSerializer(read_only=True)
    perfil = serializers.SerializerMethodField()
    usuario_avatar = serializers.SerializerMethodField()


    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'usuario_email', 'usuario_rol', 'usuario_rut',
            'usuario_nombre_completo', 'usuario_clase_actual',
            'is_active', 'is_staff', 'is_superuser',
            'perfil', 'usuario_avatar', 'usuario_fecha_nacimiento'
        ]

    def get_usuario_avatar(self, obj):
        return obj.usuario_avatar or None

    def get_perfil(self, obj):
        if obj.usuario_rol == 'alumno' and hasattr(obj, 'perfil_alumno'):
            return AlumnoSerializerProfeAdmin(obj.perfil_alumno).data
        return None


class PerfilCompletoSerializer(serializers.Serializer):
    rol = serializers.CharField()
    es_jefe = serializers.BooleanField()

class GestionAlumnosSerializer(serializers.Serializer):
    perfil_profesor = PerfilCompletoSerializer()
    alumnos = UsuarioSerializerProfeAdmin(many=True)

class EditarUsuarioAdminSerializer(serializers.ModelSerializer):
    """
    Serializer para editar los campos principales del modelo Usuario
    cuando un administrador o profesor jefe realiza la acción.
    No incluye campos sensibles como la contraseña o códigos de invitación.
    """
    class Meta:
        model = Usuario
        # Campos del modelo Usuario que el admin puede editar
        fields = [
            'username', 
            'usuario_nombre_completo', 
            'usuario_email', 
            'usuario_rut', 
            'usuario_fecha_nacimiento'
        ]
        # Hacemos que todos los campos sean opcionales para permitir actualizaciones parciales (PATCH)
        extra_kwargs = {
            'username': {'required': False},
            'usuario_nombre_completo': {'required': False},
            'usuario_email': {'required': False},
            'usuario_rut': {'required': False},
            'usuario_fecha_nacimiento': {'required': False},
        }


class ServicioSerializer(serializers.ModelSerializer):
    tipo_servicio = serializers.CharField(source='servicio_tiposervicio.Tipo_ServicioDescripcion', read_only=True)
    profesor_encargado = serializers.CharField(source='servicio_profesor_encargado.username', default=None, read_only=True)

    class Meta:
        model = Servicio
        fields = [
            'servicio_id',
            'servicio_descripcion',
            'servicio_fecha_hora',
            'tipo_servicio',
            'profesor_encargado',
        ]

class AlumnoAsistenciaSerializer(serializers.ModelSerializer):
    """
    Un serializer simple para mostrar la información básica de un alumno 
    en la lista de asistencia.
    """
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'usuario_rut', 'usuario_nombre_completo']


class AsistenciaExistenteSerializer(serializers.Serializer):
    """
    Serializa la lista de RUTs de los alumnos presentes en una asistencia.
    """
    ruts_presentes = serializers.ListField(
        child=serializers.CharField()
    )


class GuardarAsistenciaSerializer(serializers.Serializer):
    """
    Valida los datos enviados desde el frontend para guardar la asistencia.
    """
    servicio_id = serializers.IntegerField()
    ruts_presentes = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True  # Permite enviar una lista vacía
    )

class ServicioAsistenciaSerializer(serializers.ModelSerializer):
    tipo_servicio = serializers.CharField(source='servicio_tiposervicio.Tipo_ServicioDescripcion', read_only=True)
    
    class Meta:
        model = Servicio
        fields = ['servicio_id', 'servicio_descripcion', 'servicio_fecha_hora', 'tipo_servicio'] # O los campos que necesites mostrar

# SERIALIZERS PARA HOME

class NoticiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticia
        fields = ['noticia_id', 'noticia_titulo', 'noticia_contenido', 'noticia_imagen', 'noticia_fecha_publicacion']

class DesafioClaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DesafioClase
        fields = ['desafio_titulo', 'desafio_video_url', 'desafio_activo']

class ServicioSimpleSerializer(serializers.ModelSerializer):
    tipo_servicio = serializers.CharField(source='servicio_tiposervicio.Tipo_ServicioDescripcion', read_only=True)
    
    class Meta:
        model = Servicio
        fields = ['servicio_id', 'servicio_descripcion', 'servicio_fecha_hora', 'tipo_servicio'] 

class HomeStatsSerializer(serializers.Serializer):
    total_alumnos = serializers.IntegerField()
    frutos_recolectados = serializers.IntegerField()
    clases_activas = serializers.IntegerField()
    asistencia_promedio = serializers.CharField()

class HomePageSerializer(serializers.Serializer):
    """
    Serializer principal que empaqueta todos los datos para el Home.
    """
    stats = HomeStatsSerializer()
    noticias = NoticiaSerializer(many=True)
    desafioClase = DesafioClaseSerializer(allow_null=True)
    proximoServicio = ServicioSimpleSerializer(allow_null=True)
        
class CrearServicioSerializer(serializers.ModelSerializer):
    """
    Valida los datos para crear un nuevo Servicio.
    La clase se asignará automáticamente en la vista.
    """
    class Meta:
        model = Servicio
        # El campo 'servicio_clase' se añade en la vista, no se espera del frontend.
        fields = ['servicio_tiposervicio', 'servicio_descripcion', 'servicio_fecha_hora', 'servicio_profesor_encargado']

class CrearDesafioSerializer(serializers.ModelSerializer):
    """
    Valida los datos para crear un nuevo Desafío general.
    """
    class Meta:
        model = Desafio
        fields = ['desafio_descripcion', 'desafio_fruto_asociado', 'desafio_asignacionAutomatica', 'desafio_idregla']

class AsignarFrutoSerializer(serializers.Serializer):
    """
    Valida los datos para asignar manualmente un fruto a un alumno.
    """
    alumno_id = serializers.IntegerField()
    fruto_id = serializers.IntegerField()
    motivo = serializers.CharField(max_length=255)

    def validate_alumno_id(self, value):
        if not Usuario.objects.filter(id=value, usuario_rol='alumno').exists():
            raise serializers.ValidationError("El alumno seleccionado no existe.")
        return value

    def validate_fruto_id(self, value):
        if not Fruto.objects.filter(fruto_id=value).exists():
            raise serializers.ValidationError("El fruto seleccionado no existe.")
        return value
    
class TipoServicioSerializer(serializers.ModelSerializer):
    """
    Serializa el modelo TipoServicio para ser usado en dropdowns.
    """
    class Meta:
        model = TipoServicio
        fields = ['Tipo_ServicioId', 'Tipo_ServicioDescripcion']