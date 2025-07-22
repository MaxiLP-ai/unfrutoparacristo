# api_unfrutoparacristo/views.py

from django.db import transaction
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated 
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView 
from django.utils import timezone
from .utils import formatear_rut
from .models import (
    Usuario, Clase, Cesta, Fruto, FrutoColocado, Asistencia, Servicio, 
    FrutoAsignado, DesafioClase, Noticia, TipoServicio
)
from .serializers import (
    RegistroAlumnoSerializer,
    RegistroProfesorSerializer,
    ClaseSerializer,
    UsuarioSerializer,
    CustomTokenObtainPairSerializer,
    UsuarioProfileUpdateSerializer,
    CestaSerializer,
    PonerFrutoSerializer, 
    FrutoColocadoSerializer,
    MascotaEstadoUpdateSerializer,
    GuardarAsistenciaSerializer,
    UsuarioSerializerProfeAdmin,
    AlumnoUpdateSerializer,
    EditarUsuarioAdminSerializer,
    ServicioSerializer,
    AlumnoAsistenciaSerializer,
    AsistenciaExistenteSerializer,
    ServicioAsistenciaSerializer,
    HomePageSerializer,
    CrearServicioSerializer,
    CrearDesafioSerializer,
    AsignarFrutoSerializer,
    TipoServicioSerializer,
    FrutoSerializer
)

# ===================================================================
# VISTAS DE AUTENTICACIÓN Y REGISTRO
# ===================================================================

class ValidarRutView(APIView):
    """
    Vista pública para validar si un RUT ya existe en el sistema.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        rut_param = request.query_params.get('rut', None)
        if not rut_param:
            return Response({'error': 'No se proporcionó un RUT.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Estandarizamos el RUT que llega a nuestro formato oficial
        rut_formateado = formatear_rut(rut_param)

        # 2. Buscamos en la base de datos usando ese formato estándar
        existe = Usuario.objects.filter(usuario_rut=rut_formateado).exists()
        
        return Response({'existe': existe})
    
class ValidarUsernameView(APIView):
    """
    Vista pública para validar si un nombre de usuario ya existe.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get('value', None)
        if not username:
            return Response({'error': 'No se proporcionó un nombre de usuario.'}, status=400)
        
        existe = Usuario.objects.filter(username__iexact=username).exists()
        return Response({'existe': existe})

class ValidarEmailView(APIView):
    """
    Vista pública para validar si un email ya existe.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get('value', None)
        if not email:
            return Response({'error': 'No se proporcionó un email.'}, status=400)
            
        existe = Usuario.objects.filter(usuario_email__iexact=email).exists()
        return Response({'existe': existe})


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para la obtención de tokens JWT.
    Utiliza un serializador personalizado para la autenticación.
    """
    serializer_class = CustomTokenObtainPairSerializer 

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class RegistroAlumnoView(APIView):
    """
    Vista para el registro de nuevos alumnos.
    """
    permission_classes = [AllowAny] 

    def post(self, request):
        serializer = RegistroAlumnoSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            usuario = serializer.save() 
            alumno_profile = usuario.perfil_alumno 
            refresh = RefreshToken.for_user(usuario)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'mensaje': "Registrado(a) exitosamente.",
                'username': usuario.username, 
                'email': usuario.usuario_email,
                'codigo_invitacion': alumno_profile.alumno_codigo_invitacion 
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegistroProfesorView(APIView):
    """
    Vista para el registro de nuevos profesores.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroProfesorSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            usuario = serializer.save() 
            refresh = RefreshToken.for_user(usuario)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'mensaje': "Registrado(a) exitosamente.",
                'username': usuario.username, 
                'email': usuario.usuario_email,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ===================================================================
# VISTAS DE DATOS DE USUARIO Y PERFILES
# ===================================================================

class UserDataView(APIView):
    permission_classes = [IsAuthenticated]

    def aplicar_desgaste_mascota(self, mascota_estado):
        ahora = timezone.now()
        ultima_actualizacion = mascota_estado.mascota_estado_last_update

        tiempo_pasado = ahora - ultima_actualizacion
        bloques = int(tiempo_pasado.total_seconds() // (10 * 60))

        if bloques >= 1:
            mascota_estado.mascota_estado_hambre = max(0, mascota_estado.mascota_estado_hambre - bloques)
            mascota_estado.mascota_estado_sed = max(0, mascota_estado.mascota_estado_sed - (bloques * 2))
            mascota_estado.mascota_estado_last_update = ahora
            mascota_estado.save()

    def get(self, request):
        user = Usuario.objects.select_related('perfil_alumno', 'perfil_profesor', 'mascota_estado').get(id=request.user.id)

        if hasattr(user, 'mascota_estado'):
            self.aplicar_desgaste_mascota(user.mascota_estado)

        serializer = UsuarioSerializer(user)  # Usa UsuarioSerializer con 'perfil' anidado
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = Usuario.objects.select_related('perfil_alumno', 'perfil_profesor').get(id=request.user.id)
        serializer = UsuarioProfileUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()

        # Refrescar user para que datos relacionados estén actualizados
        user.refresh_from_db()

        response_serializer = UsuarioSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

class MascotaEstadoUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = MascotaEstadoUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Obtiene la mascota_estado asociada al usuario autenticado
        return self.request.user.mascota_estado
    
# ===================================================================
# VISTAS PARA LA PÁGINA DE INICIO (HOME)
# ===================================================================

class HomePageDataView(APIView):
    """
    Vista que recopila y sirve todos los datos necesarios para la página de inicio.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        
        # 1. Estadísticas Generales
        # Estos cálculos son ejemplos. Puedes hacerlos tan complejos como necesites.
        stats_data = {
            "total_alumnos": Usuario.objects.filter(usuario_rol='alumno').count(),
            "frutos_recolectados": FrutoAsignado.objects.count(),
            "clases_activas": Clase.objects.count(), # Asumiendo un campo 'is_active' en Clase
            "asistencia_promedio": "75%" # Esto requeriría un cálculo más complejo
        }

        # 2. Últimas Noticias
        # Obtiene las 8 noticias más recientes que estén marcadas como publicadas.
        noticias = Noticia.objects.filter(noticia_publicada=True)[:8]

        # 3. Desafío de la Clase
        # Busca el desafío específico para la clase del usuario actual.
        desafio_clase = None
        if usuario.usuario_clase_actual:
            try:
                desafio_clase = DesafioClase.objects.get(
                    desafio_clase=usuario.usuario_clase_actual,
                    desafio_activo=True # Solo muestra el desafío si está activo
                )
            except DesafioClase.DoesNotExist:
                desafio_clase = None

        # 4. Próximo Servicio de la Clase
        # Busca el servicio más próximo en el futuro para la clase del usuario.
        proximo_servicio = None
        if usuario.usuario_clase_actual:
            proximo_servicio = Servicio.objects.filter(
                servicio_clase=usuario.usuario_clase_actual,
                servicio_fecha_hora__gte=timezone.now()
            ).order_by('servicio_fecha_hora').first()

        # 5. Empaquetar todo en el serializer principal
        data = {
            'stats': stats_data,
            'noticias': noticias,
            'desafioClase': desafio_clase,
            'proximoServicio': proximo_servicio
        }
        
        serializer = HomePageSerializer(data)
        return Response(serializer.data)
    
# ===================================================================
# VISTAS PARA EL PANEL DE CONTROL DEL PROFESOR
# ===================================================================

class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.usuario_rol not in ['profesor', 'profesor_jefe', 'profesor_asistente', 'superadmin']:
            return Response({"detail": "Acceso no autorizado."}, status=status.HTTP_403_FORBIDDEN)

        clase_asignada = user.usuario_clase_actual
        total_alumnos = 0
        if clase_asignada:
            total_alumnos = Usuario.objects.filter(usuario_clase_actual=clase_asignada, usuario_rol='alumno').count()

        hoy = timezone.now().date()
        frutos_recolectados = FrutoAsignado.objects.filter(
            frutoasignado_usuario__usuario_clase_actual=clase_asignada,
            frutoasignado_fecha=hoy
        ).count() if clase_asignada else 0

        servicio_actual = None
        if clase_asignada:
            servicio_actual = Servicio.objects.filter(
                servicio_clase=clase_asignada,
                servicio_fecha_hora__gte=timezone.now()
            ).order_by('servicio_fecha_hora').first()
        
        # Lógica de anuncios (puedes reemplazarla con tu modelo Noticia)
        anuncios_recientes = [] 

        clase_info = None
        if clase_asignada:
            clase_info = {
                "clase_id": clase_asignada.clase_id,
                "clase_nombre": clase_asignada.clase_nombre,
                "clase_profesor_jefe_id": clase_asignada.clase_profesor_jefe_id
            }

        return Response({
            "current_profesor_id": user.id,
            "total_alumnos": total_alumnos,
            "frutos_recolectados_hoy": frutos_recolectados,
            "servicio_actual": ServicioSerializer(servicio_actual).data if servicio_actual else None,
            "anuncios_recientes": anuncios_recientes,
            "clase_info": clase_info
        })
    
class CrearServicioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CrearServicioSerializer(data=request.data)
        if serializer.is_valid():
            # Asigna la clase del profesor que está creando el servicio
            serializer.save(servicio_clase=request.user.usuario_clase_actual)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CrearDesafioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CrearDesafioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AsignarFrutoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AsignarFrutoSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            alumno = Usuario.objects.get(id=data['alumno_id'])
            fruto = Fruto.objects.get(fruto_id=data['fruto_id'])
            
            # Crear la asignación
            FrutoAsignado.objects.create(
                frutoasignado_usuario=alumno,
                frutoasignado_fruto=fruto,
                frutoasignado_motivo=data['motivo'],
                frutoasignado_origen='Manual' # Origen manual desde el panel
            )
            return Response({"detail": "Fruto asignado correctamente."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
# ===================================================================
# VISTAS PARA LA GESTIÓN DE ALUMNOS (CRUD)
# ===================================================================

class GestionAlumnosListView(APIView):
    """
    Vista que devuelve la lista de alumnos de la clase de un profesor
    y el perfil del profesor (incluyendo si es jefe de clase).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        alumnos = []
        es_jefe = False

        # Caso 1: El usuario es un superadmin
        if usuario.is_superuser:
            alumnos = Usuario.objects.filter(usuario_rol='alumno')
            es_jefe = True # El superadmin tiene todos los permisos

        # Caso 2: El usuario es un profesor o profesor_jefe
        elif usuario.usuario_rol in ['profesor', 'profesor_jefe']:
            # Se verifica que el profesor tenga una clase asignada
            if hasattr(usuario, 'usuario_clase_actual') and usuario.usuario_clase_actual is not None:
                clase_del_profesor = usuario.usuario_clase_actual

                # Se verifica si el profesor es el jefe de esa clase
                if hasattr(usuario, 'perfil_profesor'):
                    if clase_del_profesor.clase_profesor_jefe == usuario.perfil_profesor:
                        es_jefe = True
                
                # Se obtienen los alumnos de esa clase
                alumnos = Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase_del_profesor)

        # Se prepara la respuesta
        data = {
            "perfil_profesor": {
                "rol": usuario.usuario_rol,
                "es_jefe": es_jefe,
                "clase_info": ClaseSerializer(usuario.usuario_clase_actual).data if usuario.usuario_clase_actual else None
            },
            "alumnos": UsuarioSerializerProfeAdmin(alumnos, many=True).data
        }

        return Response(data)
    
class CrearAlumnoDesdeAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario = request.user

        # --- VALIDACIÓN DE PERMISOS ELIMINADA ---
        # La verificación de si es superadmin o profesor jefe ha sido removida.
        # Ahora, cualquier profesor autenticado puede intentar crear un alumno.

        data = request.data.copy()

        # La lógica para asignar la clase del profesor se mantiene.
        # Esto es útil si el profesor que crea al alumno tiene una clase asignada.
        if usuario.usuario_rol in ['profesor', 'profesor_jefe'] and not data.get("usuario_clase_actual"):
            if usuario.usuario_clase_actual:
                data["usuario_clase_actual"] = usuario.usuario_clase_actual.clase_id
        
        # Se utiliza el serializer de registro para crear el nuevo alumno.
        serializer = RegistroAlumnoSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Alumno creado correctamente"}, status=status.HTTP_201_CREATED)
        else:
            # Si hay un error de validación en los datos, se devolverá aquí.
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

class EliminarAlumnoView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            alumno = Usuario.objects.get(pk=pk, usuario_rol='alumno')
            alumno.delete()
            return Response({"detail": "Alumno eliminado correctamente."}, status=status.HTTP_204_NO_CONTENT)
        except Usuario.DoesNotExist:
            return Response({"detail": "Alumno no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        
class EditarAlumnoView(APIView):
    """
    Vista para que un profesor jefe o superadmin edite los datos de un alumno.
    La verificación de permisos se delega al frontend.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        # --- VERIFICACIÓN DE PERMISOS ELIMINADA ---
        # Se asume que el frontend ya ha validado que el usuario tiene permisos.

        # 1. Encontrar al alumno
        try:
            alumno_usuario = Usuario.objects.get(pk=pk, usuario_rol='alumno')
        except Usuario.DoesNotExist:
            return Response(
                {"detail": "Alumno no encontrado."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Separar los datos del usuario y del perfil
        # El frontend envía un objeto 'perfil' anidado
        perfil_data = request.data.pop('perfil', {})
        usuario_data = request.data

        # 3. Validar y guardar datos del modelo Usuario
        usuario_serializer = EditarUsuarioAdminSerializer(
            instance=alumno_usuario, 
            data=usuario_data, 
            partial=True # Permite actualizaciones parciales
        )
        if not usuario_serializer.is_valid():
            return Response(usuario_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Guardar los cambios del Usuario
        usuario_serializer.save()

        # 4. Validar y guardar datos del perfil del Alumno si se enviaron
        if perfil_data and hasattr(alumno_usuario, 'perfil_alumno'):
            # Reutilizamos tu AlumnoUpdateSerializer
            perfil_serializer = AlumnoUpdateSerializer(
                instance=alumno_usuario.perfil_alumno, 
                data=perfil_data, 
                partial=True
            )
            if not perfil_serializer.is_valid():
                # Si los datos del perfil son inválidos, devolvemos el error
                # pero los datos del usuario ya se guardaron. Se puede mejorar con transacciones si es necesario.
                return Response(perfil_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Guardar los cambios del Perfil del Alumno
            perfil_serializer.save()
            
        # 5. Devolver el alumno completamente actualizado
        # Usamos el serializer de lectura para enviar la respuesta completa
        response_serializer = UsuarioSerializerProfeAdmin(alumno_usuario)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
# ===================================================================
# VISTAS PARA LA GESTIÓN DE ASISTENCIA
# ===================================================================

class AlumnosDeClaseListView(APIView):
    """
    Devuelve la lista de alumnos pertenecientes a la clase del profesor logueado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        clase = usuario.usuario_clase_actual

        if not clase:
            return Response([], status=status.HTTP_200_OK)

        # Filtra los usuarios que son alumnos y pertenecen a la clase del profesor
        alumnos = Usuario.objects.filter(
            usuario_rol='alumno', 
            usuario_clase_actual=clase
        )
        
        serializer = AlumnoAsistenciaSerializer(alumnos, many=True)
        return Response(serializer.data)


class AsistenciaExistenteView(APIView):
    """
    Devuelve los RUTs de los alumnos ya marcados como presentes para un servicio específico.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, servicio_id):
        try:
            asistencia = Asistencia.objects.get(asistencia_servicio_id=servicio_id)
            data = {"ruts_presentes": asistencia.obtener_lista_ruts()}
            serializer = AsistenciaExistenteSerializer(data)
            return Response(serializer.data)
        except Asistencia.DoesNotExist:
            # Si no existe, devuelve una lista vacía, lo cual es correcto
            return Response({"ruts_presentes": []})


class GuardarAsistenciaView(APIView):
    """
    Guarda o actualiza la lista de asistencia para un servicio.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Validar los datos de entrada usando el serializer
        serializer = GuardarAsistenciaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 2. Obtener los datos validados
        validated_data = serializer.validated_data
        servicio_id = validated_data.get("servicio_id")
        ruts_presentes = validated_data.get("ruts_presentes", [])

        # 3. Ejecutar la lógica de negocio
        try:
            servicio = Servicio.objects.get(pk=servicio_id)
            clase = request.user.usuario_clase_actual
            fecha = servicio.servicio_fecha_hora.date()

            # get_or_create es una excelente forma de manejar esto
            asistencia, created = Asistencia.objects.get_or_create(
                asistencia_servicio=servicio,
                defaults={
                    'asistencia_fecha': fecha,
                    'asistencia_tipo_clase': clase,
                    'asistencia_rutAsistentes': ','.join(ruts_presentes)
                }
            )

            # Si el registro de asistencia ya existía, se actualiza
            if not created:
                asistencia.asistencia_rutAsistentes = ','.join(ruts_presentes)
                asistencia.save()

            return Response({"status": "ok", "detail": "Asistencia guardada correctamente."}, status=status.HTTP_200_OK)
        
        except Servicio.DoesNotExist:
            return Response({"error": "El servicio especificado no existe."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===================================================================
# VISTAS PARA EL ÁRBOL DE FRUTOS
# ===================================================================

class CestaDetailView(generics.RetrieveAPIView):
    """
    Vista para obtener la cesta del usuario actual.
    GET /api/cesta/
    """
    serializer_class = CestaSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Busca (o crea si no existe) la cesta para el usuario autenticado.
        cesta, created = Cesta.objects.get_or_create(cesta_usuario=self.request.user)
        return cesta

class FrutoListView(APIView):
    """
    Devuelve una lista de todos los frutos disponibles.
    """
    permission_classes = [IsAuthenticated]
    def get(self, request):
        frutos = Fruto.objects.all()
        # Asume que ya tienes un 'FrutoSerializer'
        serializer = FrutoSerializer(frutos, many=True)
        return Response(serializer.data)

class PonerFrutoView(APIView):
    """
    Vista para añadir un fruto al árbol.
    POST /api/cesta/poner_fruto/
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        # --- DEBUG: Imprimimos los datos crudos que llegan desde React ---
        print("======================================================")
        print("DATOS RECIBIDOS DESDE EL FRONTEND:")
        print(request.data)
        print("======================================================")

        serializer = PonerFrutoSerializer(data=request.data)
        if not serializer.is_valid():
            # --- DEBUG: Si la validación falla, imprimimos los errores ---
            print("!!! ERROR DE VALIDACIÓN DEL SERIALIZER:")
            print(serializer.errors)
            print("======================================================")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        # --- DEBUG: Imprimimos el tipo de fruto validado ---
        tipo = data['tipo']
        print(f"TIPO DE FRUTO RECIBIDO (validado): '{tipo}'")
        
        # ==================================================================
        # ¡CORRECCIÓN! Usamos get_or_create para evitar errores si la cesta no existe.
        # Esto busca la cesta y, si no la encuentra, la crea.
        # ==================================================================
        cesta, created = Cesta.objects.select_for_update().get_or_create(cesta_usuario=request.user)
        if created:
            print(f"Se ha creado una nueva cesta para el usuario: {request.user.username}")
        
        # Verificación de inventario
        if tipo == 'verdes' and cesta.cesta_total_verdes <= 0:
            return Response({"error": "No tienes frutos verdes disponibles."}, status=status.HTTP_400_BAD_REQUEST)
        if tipo == 'rojas' and cesta.cesta_total_rojas <= 0:
            return Response({"error": "No tienes frutos rojos disponibles."}, status=status.HTTP_400_BAD_REQUEST)
        if tipo == 'doradas' and cesta.cesta_total_doradas <= 0:
            return Response({"error": "No tienes frutos dorados disponibles."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # --- DEBUG: Intentamos buscar el fruto en la base de datos ---
            print(f"Buscando en la DB un Fruto con fruto_color='{tipo}'")
            fruto_obj = Fruto.objects.get(fruto_color=tipo)
            print(f"Fruto encontrado: {fruto_obj}")

        except Fruto.DoesNotExist:
            # --- DEBUG: Si no se encuentra, lo informamos ---
            print(f"!!! ERROR: No se encontró ningún Fruto con fruto_color='{tipo}'")
            print("======================================================")
            return Response({"error": "Tipo de fruto no válido"}, status=status.HTTP_400_BAD_REQUEST)

        # Creamos el nuevo FrutoColocado
        nuevo_fruto = FrutoColocado.objects.create(
            frutocolocado_cesta=cesta,
            frutocolocado_fruto=fruto_obj,
            position_x=data['position'][0],
            position_y=data['position'][1],
            position_z=data['position'][2],
        )
        
        # Actualizamos los contadores en el modelo Cesta
        if tipo == 'verdes':
            cesta.cesta_total_verdes -= 1
            cesta.cesta_verdes_puestas += 1
        elif tipo == 'rojas':
            cesta.cesta_total_rojas -= 1
            cesta.cesta_rojas_puestas += 1
        elif tipo == 'doradas':
            cesta.cesta_total_doradas -= 1
            cesta.cesta_doradas_puestas += 1
        cesta.save()

        response_serializer = FrutoColocadoSerializer(nuevo_fruto)
        print("Respuesta enviada al frontend:", response_serializer.data)
        print("======================================================")
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
class DevolverFrutoView(APIView):
    """
    Vista para devolver un fruto del árbol al inventario.
    Se accede a través de: DELETE /api/cesta/devolver_fruto/<id>/
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def delete(self, request, pk, *args, **kwargs):
        # Usamos select_for_update para bloquear la fila de la cesta y evitar condiciones de carrera
        cesta = Cesta.objects.select_for_update().get(cesta_usuario=request.user)
        
        try:
            # Buscamos el fruto colocado por su ID y nos aseguramos de que pertenezca a la cesta del usuario.
            fruto_a_devolver = FrutoColocado.objects.get(pk=pk, frutocolocado_cesta=cesta)
        except FrutoColocado.DoesNotExist:
            return Response(
                {"error": "Fruto no encontrado o no te pertenece."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Guardamos el tipo de fruto antes de borrarlo para saber qué contador actualizar
        tipo_fruto = fruto_a_devolver.frutocolocado_fruto.fruto_color
        
        # Actualizamos los contadores en el modelo Cesta
        if tipo_fruto == 'verdes':
            cesta.cesta_total_verdes += 1
            cesta.cesta_verdes_puestas -= 1
        elif tipo_fruto == 'rojas':
            cesta.cesta_total_rojas += 1
            cesta.cesta_rojas_puestas -= 1
        elif tipo_fruto == 'doradas':
            cesta.cesta_total_doradas += 1
            cesta.cesta_doradas_puestas -= 1
        
        cesta.save()
        
        # Eliminamos el registro del fruto colocado
        fruto_a_devolver.delete()
        
        # Devolvemos una respuesta exitosa sin contenido, estándar para DELETE
        return Response(status=status.HTTP_204_NO_CONTENT)
    
# ===================================================================
# VISTAS AUXILIARES PARA LISTAS (Dropdowns, etc.)
# ===================================================================


class TipoServicioListView(APIView):
    """
    Devuelve una lista de todos los tipos de servicio disponibles.
    """
    permission_classes = [IsAuthenticated]
    def get(self, request):
        tipos = TipoServicio.objects.all()
        # Asume que ya tienes un 'TipoServicioSerializer'
        serializer = TipoServicioSerializer(tipos, many=True)
        return Response(serializer.data)

class ClaseListView(generics.ListAPIView):
    """
    Vista de API para listar todas las clases disponibles.
    """
    queryset = Clase.objects.all()
    serializer_class = ClaseSerializer
    permission_classes = [AllowAny]

    
class ServicioListAPIView(generics.ListAPIView):
    queryset = Servicio.objects.all().order_by('servicio_fecha_hora')
    serializer_class = ServicioSerializer


class ServiciosDisponiblesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        
        # Primero, verificamos que el profesor tenga una clase asignada
        if not hasattr(usuario, 'usuario_clase_actual') or not usuario.usuario_clase_actual:
            # Si no tiene clase, no puede ver ningún servicio
            return Response([], status=status.HTTP_200_OK)

        clase_del_profesor = usuario.usuario_clase_actual

        # 👇 --- LÓGICA DE FILTRADO CORREGIDA --- 👇
        # Filtramos los servicios que pertenecen a la clase del profesor
        servicios = Servicio.objects.filter(
            servicio_clase=clase_del_profesor
        ).order_by('-servicio_fecha_hora') # Ordenamos por fecha descendente

        # Necesitarás un serializer simple para Servicio
        serializer = ServicioAsistenciaSerializer(servicios, many=True) 
        return Response(serializer.data)
