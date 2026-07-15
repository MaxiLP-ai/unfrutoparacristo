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
from django.db.models import Q
from django.core.mail import send_mail
from rest_framework.decorators import api_view
from django.utils.crypto import get_random_string
from django.conf import settings
from django.urls import reverse
from rest_framework.decorators import permission_classes
import datetime
from .models import (
    Usuario, Clase, Cesta, Fruto, FrutoColocado, Asistencia, Servicio, 
    FrutoAsignado, DesafioClase, Noticia, TipoServicio, Alumno, MascotaEstado
)
from .models import DesafioCumplido

FOOD_NUTRITION = {
    'food_watermelon': {'hambre': 10, 'sed': 15, 'nombre': 'Sandía'},
    'food_cookie': {'hambre': 15, 'sed': 5, 'nombre': 'Galleta'},
    'food_donut': {'hambre': 20, 'sed': 5, 'nombre': 'Dona'},
    'food_icecream': {'hambre': 15, 'sed': 25, 'nombre': 'Helado'},
    'food_pizza': {'hambre': 35, 'sed': 10, 'nombre': 'Pizza'}
}
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
    DesafioClaseSerializer,
    FrutoSerializer,
    GestionNoticiaSerializer,
    CrearNoticiaSerializer
)

from .serializers import ClaseSerializer


class AttendanceDetailView(APIView):
    """
    Devuelve detalle de asistencia por alumno para una clase dada.
    - Si el usuario es alumno: devuelve su historial y porcentaje (usa su clase actual).
    - Si el usuario es profesor: requiere `?clase_id=` y devuelve lista de alumnos con asistencias y porcentaje.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        clase_id = request.query_params.get('clase_id')

        # Alumno -> devolver histórico propio
        if usuario.usuario_rol == 'alumno':
            clase_alumno = usuario.usuario_clase_actual
            if not clase_alumno:
                return Response({'error': 'Alumno no tiene clase asignada.'}, status=status.HTTP_400_BAD_REQUEST)

            asistencias = Asistencia.objects.filter(asistencia_tipo_clase=clase_alumno).order_by('-asistencia_fecha')
            total = asistencias.count()
            presentes = 0
            historial = []
            for a in asistencias:
                presente = usuario.usuario_rut in a.obtener_lista_ruts()
                if presente:
                    presentes += 1
                historial.append({
                    'fecha': a.asistencia_fecha,
                    'presente': presente,
                })
            pct = round((presentes / total) * 100) if total > 0 else 0
            return Response({'total_sesiones': total, 'presentes': presentes, 'porcentaje': f"{pct}%", 'historial': historial})

        # Profesor -> necesita clase_id (o puede usar su clase actual si está autorizada)
        if usuario.usuario_rol in ['profesor', 'profesor_jefe', 'profesor_asistente', 'superadmin']:
            clase = None
            if clase_id:
                try:
                    clase = Clase.objects.get(pk=clase_id)
                except Clase.DoesNotExist:
                    return Response({'error': 'Clase no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
                # permisos: solo superuser o profesor asignado
                if not (usuario.is_superuser or clase in usuario.usuario_clases.all() or usuario.usuario_clase_actual == clase):
                    return Response({'error': 'No autorizado para ver esta clase.'}, status=status.HTTP_403_FORBIDDEN)
            else:
                clase = _obtener_clase_seleccionada(request, usuario)
                if not clase:
                    return Response({'error': 'No hay clase seleccionada.'}, status=status.HTTP_400_BAD_REQUEST)

            alumnos = Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase)
            sesiones = Asistencia.objects.filter(asistencia_tipo_clase=clase)
            total_sesiones = sesiones.count()
            alumnos_data = []
            for alumno in alumnos:
                asistencias_presente = 0
                historial = []
                for s in sesiones:
                    presente = alumno.usuario_rut in s.obtener_lista_ruts()
                    if presente:
                        asistencias_presente += 1
                    historial.append({'fecha': s.asistencia_fecha, 'presente': presente})
                pct = round((asistencias_presente / total_sesiones) * 100) if total_sesiones > 0 else 0
                alumnos_data.append({'alumno_id': alumno.id, 'alumno_nombre': alumno.usuario_nombre_completo or alumno.username, 'presentes': asistencias_presente, 'porcentaje': f"{pct}%", 'historial': historial})

            return Response({'clase_id': clase.clase_id, 'clase_nombre': clase.clase_nombre, 'total_sesiones': total_sesiones, 'alumnos': alumnos_data})

        return Response({'error': 'Rol no soportado para esta operación.'}, status=status.HTTP_403_FORBIDDEN)


def _obtener_clase_seleccionada(request, usuario):
    """
    Helper que determina qué `Clase` usar para acciones de profesor.
    - Prioriza `clase_id` en `request.data` o `request.query_params` (si viene del frontend).
    - Si no viene, usa `usuario.usuario_clase_actual`.
    - Si aún no hay, usa la primera clase en `usuario.usuario_clases`.
    - Comprueba que el usuario esté asignado a la clase (o sea superuser).
    Devuelve instancia `Clase` o `None`.
    """
    from .models import Clase

    clase_id = None
    if hasattr(request, 'data') and isinstance(request.data, dict):
        clase_id = request.data.get('clase_id')
    if not clase_id:
        clase_id = request.query_params.get('clase_id') if hasattr(request, 'query_params') else None

    # Si se proporcionó clase_id explícita, validarla y chequear pertenencia
    if clase_id:
        try:
            clase = Clase.objects.get(pk=clase_id)
        except Clase.DoesNotExist:
            return None

        # Permitir si es superuser o si la clase está en las asignadas del profesor
        if usuario.is_superuser or clase in usuario.usuario_clases.all() or usuario.usuario_clase_actual == clase:
            return clase
        return None

    # Fallbacks: clase actual o primera asignada
    if usuario.usuario_clase_actual:
        return usuario.usuario_clase_actual

    primera = usuario.usuario_clases.first()
    return primera

# ===================================================================
# VISTAS DE RESETEO DE PASSWORD
# ===================================================================

# Aquí guardamos tokens en memoria temporal por simplicidad (idealmente usar modelo o cache)
TOKENS = {}

@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_reset(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email requerido'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = Usuario.objects.get(usuario_email=email)
    except Usuario.DoesNotExist:
        return Response({'error': 'No se encontró un usuario con ese email'}, status=status.HTTP_404_NOT_FOUND)

    token = get_random_string(32)
    TOKENS[token] = {'user_id': user.id, 'expires': datetime.datetime.now() + datetime.timedelta(hours=1)}

    reset_link = f"{settings.FRONTEND_URL}/reset-password/{token}"

    send_mail(
        'Restablecer contraseña',
        f'Hola {user.username}, haz clic aquí para restablecer tu contraseña:\n{reset_link}',
        settings.EMAIL_HOST_USER,
        [email],
        fail_silently=False,
    )

    return Response({'message': 'Correo de restablecimiento enviado.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def confirmar_reset(request):
    token = request.data.get('token')
    nueva_password = request.data.get('password')

    if not token or not nueva_password:
        return Response({'error': 'Token y nueva contraseña son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

    info = TOKENS.get(token)
    if not info or info['expires'] < datetime.datetime.now():
        return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = Usuario.objects.get(id=info['user_id'])
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(nueva_password)
    user.save()

    del TOKENS[token]

    return Response({'message': 'Contraseña actualizada exitosamente'})

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
        # Determinar clase seleccionada (si aplica):
        clase_seleccionada_para_home = None
        if usuario.usuario_rol in ['profesor', 'profesor_jefe', 'profesor_asistente', 'superadmin']:
            clase_seleccionada_para_home = _obtener_clase_seleccionada(request, usuario)

        # 1. Estadísticas Generales
        # Estos cálculos son ejemplos. Puedes hacerlos tan complejos como necesites.
        stats_data = {
            "total_alumnos": Usuario.objects.filter(usuario_rol='alumno').count(),
            "frutos_recolectados": FrutoAsignado.objects.count(),
            "clases_activas": Clase.objects.count(), # Asumiendo un campo 'is_active' en Clase
            "asistencia_promedio": None # Calcularemos abajo según el usuario
        }

        # 2. Últimas Noticias
        # --- 2. LÓGICA DE FILTRADO DE NOTICIAS CORREGIDA ---
        # Para noticias y desafío usamos la clase seleccionada (si el usuario es profesor),
        # de lo contrario para alumnos usamos su `usuario_clase_actual`.
        clase_para_contenido = clase_seleccionada_para_home if clase_seleccionada_para_home else usuario.usuario_clase_actual

        noticias = Noticia.objects.filter(
            Q(noticia_clase__isnull=True) | Q(noticia_clase=clase_para_contenido),
            noticia_publicada=True
        ).distinct().order_by('-noticia_fecha_publicacion')[:8]

        # 3. Desafío de la Clase
        # Busca el desafío específico para la clase del usuario actual.
        desafio_clase = None
        if clase_para_contenido:
            try:
                desafio_clase = DesafioClase.objects.get(
                    desafio_clase=clase_para_contenido,
                    desafio_activo=True # Solo muestra el desafío si está activo
                )
            except DesafioClase.DoesNotExist:
                desafio_clase = None

        # 4. Próximo Servicio de la Clase
        # Busca el servicio más próximo en el futuro para la clase del usuario.
        proximo_servicio = None
        if clase_para_contenido:
            proximo_servicio = Servicio.objects.filter(
                servicio_clase=clase_para_contenido,
                servicio_fecha_hora__gte=timezone.now()
            ).order_by('servicio_fecha_hora').first()

        # 5. Empaquetar todo en el serializer principal
        # Calcular asistencia promedio real:
        asistencia_promedio = None

        try:
            if usuario.usuario_rol == 'alumno':
                # Promedio del alumno: cuántas asistencias registradas para su clase
                clase_alumno = usuario.usuario_clase_actual
                if clase_alumno:
                    asistencias = Asistencia.objects.filter(asistencia_tipo_clase=clase_alumno)
                    total_asistencias = asistencias.count()
                    if total_asistencias > 0:
                        asistencias_presente = 0
                        rut = usuario.usuario_rut
                        for a in asistencias:
                            if rut in a.obtener_lista_ruts():
                                asistencias_presente += 1
                        pct = round((asistencias_presente / total_asistencias) * 100)
                        asistencia_promedio = f"{pct}%"
            elif usuario.usuario_rol in ['profesor', 'profesor_jefe', 'profesor_asistente', 'superadmin']:
                # Promedio para la clase seleccionada por el profesor (o por query param)
                clase_prof = clase_seleccionada_para_home
                if clase_prof:
                    alumnos = Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase_prof)
                    num_alumnos = alumnos.count()
                    asistencias = Asistencia.objects.filter(asistencia_tipo_clase=clase_prof)
                    total_asistencias = asistencias.count()
                    if num_alumnos > 0 and total_asistencias > 0:
                        total_asistencias_registradas = 0
                        for a in asistencias:
                            total_asistencias_registradas += len(a.obtener_lista_ruts())
                        max_posible = num_alumnos * total_asistencias
                        pct = round((total_asistencias_registradas / max_posible) * 100)
                        asistencia_promedio = f"{pct}%"
        except Exception:
            asistencia_promedio = None

        stats_data['asistencia_promedio'] = asistencia_promedio or "0%"

        # --- Métricas adicionales ---
        fecha_hoy = timezone.now().date()
        desde_30d = fecha_hoy - datetime.timedelta(days=30)

        # 1) Asistencia en último mes (porcentaje)
        asistencia_ultimo_mes = None
        try:
            if usuario.usuario_rol == 'alumno':
                clase_alumno = usuario.usuario_clase_actual
                if clase_alumno:
                    sesiones_mes = Asistencia.objects.filter(asistencia_tipo_clase=clase_alumno, asistencia_fecha__gte=desde_30d)
                    total_sesiones = sesiones_mes.count()
                    if total_sesiones > 0:
                        presentes = sum(1 for s in sesiones_mes if usuario.usuario_rut in s.obtener_lista_ruts())
                        asistencia_ultimo_mes = f"{round((presentes/total_sesiones)*100)}%"
            else:
                clase_prof = clase_seleccionada_para_home
                if clase_prof:
                    sesiones_mes = Asistencia.objects.filter(asistencia_tipo_clase=clase_prof, asistencia_fecha__gte=desde_30d)
                    total_posibles = sesiones_mes.count() * Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase_prof).count()
                    if total_posibles > 0:
                        presentes = sum(len(s.obtener_lista_ruts()) for s in sesiones_mes)
                        asistencia_ultimo_mes = f"{round((presentes/total_posibles)*100)}%"
        except Exception:
            asistencia_ultimo_mes = None

        # 2) Promedio de frutos por alumno (últimos 30 días)
        promedio_frutos_por_alumno = None
        try:
            if usuario.usuario_rol == 'alumno':
                clase_alumno = usuario.usuario_clase_actual
                if clase_alumno:
                    alumnos = Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase_alumno)
                    if alumnos.exists():
                        total_frutos = FrutoAsignado.objects.filter(frutoasignado_usuario__usuario_clase_actual=clase_alumno, frutoasignado_fecha__gte=desde_30d).count()
                        promedio_frutos_por_alumno = round(total_frutos / alumnos.count(), 2)
            else:
                clase_prof = clase_seleccionada_para_home
                if clase_prof:
                    alumnos = Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase_prof)
                    if alumnos.exists():
                        total_frutos = FrutoAsignado.objects.filter(frutoasignado_usuario__usuario_clase_actual=clase_prof, frutoasignado_fecha__gte=desde_30d).count()
                        promedio_frutos_por_alumno = round(total_frutos / alumnos.count(), 2)
        except Exception:
            promedio_frutos_por_alumno = None

        # 3) Servicios próximos 30 días (para la clase)
        servicios_proximos_30d = 0
        try:
            clase_consulta = clase_para_contenido
            if clase_consulta:
                hasta_30d = timezone.now() + datetime.timedelta(days=30)
                servicios_proximos_30d = Servicio.objects.filter(servicio_clase=clase_consulta, servicio_fecha_hora__gte=timezone.now(), servicio_fecha_hora__lte=hasta_30d).count()
        except Exception:
            servicios_proximos_30d = 0

        # 4) % alumnos activos (asistieron al menos una vez en últimos 30 días)
        porcentaje_alumnos_activos = None
        try:
            clase_consulta = clase_para_contenido
            if clase_consulta:
                alumnos = Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase_consulta)
                total_al = alumnos.count()
                if total_al > 0:
                    asistentes = 0
                    sesiones_mes = Asistencia.objects.filter(asistencia_tipo_clase=clase_consulta, asistencia_fecha__gte=desde_30d)
                    ruts_presentes = set()
                    for s in sesiones_mes:
                        ruts_presentes.update(s.obtener_lista_ruts())
                    # Contar alumnos cuyo rut esté en ruts_presentes
                    asistentes = Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase_consulta, usuario_rut__in=list(ruts_presentes)).count()
                    porcentaje_alumnos_activos = f"{round((asistentes/total_al)*100)}%"
        except Exception:
            porcentaje_alumnos_activos = None

        stats_data.update({
            'asistencia_ultimo_mes': asistencia_ultimo_mes or "0%",
            'promedio_frutos_por_alumno': promedio_frutos_por_alumno or 0,
            'servicios_proximos_30d': servicios_proximos_30d,
            'porcentaje_alumnos_activos': porcentaje_alumnos_activos or "0%",
        })

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

        clase_asignada = _obtener_clase_seleccionada(request, user)
        if not clase_asignada:
            return Response({"detail": "No se encontró una clase asignada. Pasa `clase_id` o asigna clases al profesor."}, status=status.HTTP_400_BAD_REQUEST)

        total_alumnos = Usuario.objects.filter(usuario_clase_actual=clase_asignada, usuario_rol='alumno').count()

        hoy = timezone.now().date()
        frutos_recolectados = FrutoAsignado.objects.filter(
            frutoasignado_usuario__usuario_clase_actual=clase_asignada,
            frutoasignado_fecha=hoy
        ).count() if clase_asignada else 0

        servicio_actual = None
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
            # Determina la clase a usar (por `clase_id`, por `usuario_clase_actual` o por asignación)
            clase_para_servicio = _obtener_clase_seleccionada(request, request.user)
            if not clase_para_servicio:
                return Response({"detail": "No se encontró una clase válida para crear el servicio."}, status=status.HTTP_400_BAD_REQUEST)

            serializer.save(servicio_clase=clase_para_servicio)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DesafioClaseActualView(APIView):
    """
    NUEVA VISTA: Devuelve el desafío de clase actual para el profesor logueado.
    Permite al modal de React pre-rellenar los campos si ya existe un desafío.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        clase = _obtener_clase_seleccionada(request, usuario)
        if not clase:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            desafio = DesafioClase.objects.get(desafio_clase=clase)
            serializer = DesafioClaseSerializer(desafio)
            return Response(serializer.data)
        except DesafioClase.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class CrearDesafioView(APIView):
    """
    Permite a un profesor jefe obtener, crear o actualizar el Desafío de su Clase.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Devuelve el desafío de la clase actual para pre-rellenar el formulario."""
        usuario = request.user
        clase = _obtener_clase_seleccionada(request, usuario)
        if not clase:
            return Response({"detail": "Profesor no tiene clase asignada."}, status=status.HTTP_404_NOT_FOUND)

        try:
            desafio = DesafioClase.objects.get(desafio_clase=clase)
            serializer = CrearDesafioSerializer(desafio)
            return Response(serializer.data)
        except DesafioClase.DoesNotExist:
            return Response({"detail": "No existe un desafío para esta clase aún."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """Crea o actualiza el desafío de la clase."""
        usuario = request.user
        clase = _obtener_clase_seleccionada(request, usuario)

        if not clase:
            return Response({"detail": "El profesor no tiene una clase asignada."}, status=status.HTTP_400_BAD_REQUEST)

        # Validamos los datos primero para aplicar reglas (ej. requerir video o contenido)
        serializer_input = CrearDesafioSerializer(data=request.data)
        serializer_input.is_valid(raise_exception=True)

        # Normalizar y usar los datos validados al guardar para evitar problemas con '' vs None
        validated = serializer_input.validated_data

        desafio, created = DesafioClase.objects.update_or_create(
            desafio_clase=clase,
            defaults=validated
        )

        serializer = CrearDesafioSerializer(desafio)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class ClaseProgresoView(APIView):
    """Devuelve métricas de progreso para la clase seleccionada (attendance trend, frutas por alumno, servicios próximos, completaciones)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        clase = _obtener_clase_seleccionada(request, usuario)
        if not clase:
            return Response({"detail": "No se encontró una clase válida."}, status=status.HTTP_400_BAD_REQUEST)

        hoy = timezone.now().date()
        inicio_30 = hoy - datetime.timedelta(days=29)  # incluir hoy -> 30 días

        # Alumnos activos en la clase (según usuario_clase_actual)
        total_alumnos = Usuario.objects.filter(usuario_rol='alumno', usuario_clase_actual=clase).count()

        # Frutos en últimos 30 días por alumnos de la clase
        frutos_30 = FrutoAsignado.objects.filter(frutoasignado_fecha__gte=inicio_30, frutoasignado_usuario__usuario_clase_actual=clase).count()
        promedio_frutos_por_alumno = round(frutos_30 / total_alumnos, 2) if total_alumnos else 0

        # Servicios próximos 30 días
        ahora = timezone.now()
        fin_30 = ahora + datetime.timedelta(days=30)
        servicios_prox = Servicio.objects.filter(servicio_clase=clase, servicio_fecha_hora__gte=ahora, servicio_fecha_hora__lte=fin_30).count()

        # Completaciones de desafíos en últimos 30 días (usuarios únicos)
        completaciones_unicas = DesafioCumplido.objects.filter(desaficump_fecha__date__gte=inicio_30, desaficump_usuario__usuario_clase_actual=clase).values('desaficump_usuario').distinct().count()
        tasa_completacion = round((completaciones_unicas / total_alumnos) * 100, 2) if total_alumnos else 0

        # Tendencia de asistencia (lista de fechas con cantidad de presentes)
        attendance_trend = []
        asistencias = Asistencia.objects.filter(asistencia_tipo_clase=clase, asistencia_fecha__gte=inicio_30).order_by('asistencia_fecha')
        # Build a dict date->count
        fecha_map = {a.asistencia_fecha: len(a.obtener_lista_ruts()) for a in asistencias}
        for i in range(30):
            d = inicio_30 + datetime.timedelta(days=i)
            attendance_trend.append({"date": d.isoformat(), "present": fecha_map.get(d, 0)})

        data = {
            'total_alumnos': total_alumnos,
            'promedio_frutos_por_alumno': promedio_frutos_por_alumno,
            'servicios_proximos_30d': servicios_prox,
            'tasa_completacion_desafio_pct': tasa_completacion,
            'attendance_trend': attendance_trend,
        }

        return Response(data)


class ClassConfigView(APIView):
    """Permite obtener y actualizar datos básicos de una clase (nombre, edades, descripción)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        clase = _obtener_clase_seleccionada(request, usuario)
        if not clase:
            return Response({"detail": "No se encontró una clase válida."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ClaseSerializer(clase)
        return Response(serializer.data)

    def patch(self, request):
        usuario = request.user
        clase = _obtener_clase_seleccionada(request, usuario)
        if not clase:
            return Response({"detail": "No se encontró una clase válida."}, status=status.HTTP_400_BAD_REQUEST)

        # Permisos: solo superuser o profesor jefe/assignado pueden editar
        if not (usuario.is_superuser or clase in usuario.usuario_clases.all() or usuario.usuario_clase_actual == clase):
            return Response({"detail": "No autorizado."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClaseSerializer(clase, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class CrearNoticiaView(APIView):
    """
    Permite a un profesor jefe o superadmin crear una nueva noticia para su clase.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = CrearNoticiaSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            # Asigna la clase elegida por el profesor
            clase_para_noticia = _obtener_clase_seleccionada(request, request.user)
            if not clase_para_noticia:
                return Response({"detail": "No se encontró una clase válida para la noticia."}, status=status.HTTP_400_BAD_REQUEST)

            serializer.save(noticia_clase=clase_para_noticia)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GestionNoticiasView(APIView):
    """
    Permite a un profesor obtener y actualizar las noticias de su clase.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        clase_profesor = _obtener_clase_seleccionada(request, usuario)

        if not clase_profesor:
            return Response({"error": "Este usuario no tiene una clase asignada."}, status=status.HTTP_400_BAD_REQUEST)

        noticias = Noticia.objects.filter(noticia_clase=clase_profesor).order_by('-noticia_fecha_publicacion')
        serializer = GestionNoticiaSerializer(noticias, many=True)
        return Response(serializer.data)

    def patch(self, request):
        noticias_data = request.data
        if not isinstance(noticias_data, list):
            return Response({"error": "Se esperaba una lista de noticias."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                for noticia_data in noticias_data:
                    noticia_id = noticia_data.get('noticia_id')
                    if not noticia_id:
                        continue

                    noticia_obj = Noticia.objects.get(pk=noticia_id)
                    serializer = GestionNoticiaSerializer(noticia_obj, data=noticia_data, partial=True)
                    if serializer.is_valid(raise_exception=True):
                        serializer.save()

        except Noticia.DoesNotExist:
            return Response({"error": "Una de las noticias no fue encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Noticias actualizadas correctamente."}, status=status.HTTP_200_OK)

class AsignarFrutoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AsignarFrutoSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            profesor = request.user
            # Determinar la clase que el profesor está administrando (puede venir por `clase_id`)
            clase_activa = _obtener_clase_seleccionada(request, profesor)
            if not clase_activa:
                return Response({"detail": "No tienes una clase asignada para realizar esta acción."}, status=status.HTTP_403_FORBIDDEN)

            # 2. Obtenemos el alumno al que se le quiere asignar el fruto.
            alumno = Usuario.objects.get(id=data['alumno_id'])

            # 3. Verificamos si la clase del alumno es la misma que la que administra el profesor.
            if alumno.usuario_clase_actual != clase_activa:
                return Response({"detail": "No puedes asignar frutos a un alumno que no pertenece a tu clase."}, status=status.HTTP_403_FORBIDDEN)
            
            # --- FIN DE LA LÓGICA DE VALIDACIÓN ---

            fruto = Fruto.objects.get(fruto_id=data['fruto_id'])
            
            # Si todas las validaciones pasan, se crea la asignación.
            FrutoAsignado.objects.create(
                frutoasignado_usuario=alumno,
                frutoasignado_fruto=fruto,
                frutoasignado_motivo=data['motivo'],
                frutoasignado_origen='Manual'
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
        es_jefe = False
        clase_del_profesor = _obtener_clase_seleccionada(request, usuario)

        if not clase_del_profesor:
            return Response({
                "perfil_profesor": {"rol": usuario.usuario_rol, "es_jefe": False, "clase_info": None},
                "alumnos": []
            })

        # Consulta OPTIMIZADA:
        # Usamos `select_related` para la relación OneToOne (cesta)
        # y `prefetch_related` para la relación inversa ManyToOne (frutos_colocados)
        alumnos = Usuario.objects.filter(
            usuario_rol='alumno',
            usuario_clase_actual=clase_del_profesor
        ).select_related('perfil_alumno', 'cesta').prefetch_related('cesta__frutos_colocados', 'cesta__frutos_colocados__frutocolocado_fruto')


        if usuario.is_superuser:
            es_jefe = True
        elif hasattr(usuario, 'perfil_profesor'):
            # Comparar el profesor jefe asignado en la clase con el usuario actual
            if clase_del_profesor.clase_profesor_jefe == usuario:
                es_jefe = True
        
        data = {
            "perfil_profesor": {
                "rol": usuario.usuario_rol,
                "es_jefe": es_jefe,
                "clase_info": ClaseSerializer(clase_del_profesor).data
            },
            # Usa el serializer que ya tenías
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
            clase_default = _obtener_clase_seleccionada(request, usuario)
            if clase_default:
                data["usuario_clase_actual"] = clase_default.clase_id
        
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
        clase = _obtener_clase_seleccionada(request, usuario)

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
            clase = _obtener_clase_seleccionada(request, request.user)
            if not clase:
                return Response({"error": "Usuario no tiene una clase asignada."}, status=status.HTTP_400_BAD_REQUEST)
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


class SetActiveClassView(APIView):
    """Permite al usuario autenticado (profesor) establecer su clase activa.
    Valida que el usuario esté asignado a la clase o sea superuser.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        clase_id = request.data.get('clase_id')
        if not clase_id:
            return Response({'detail': 'clase_id requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            clase = Clase.objects.get(pk=clase_id)
        except Clase.DoesNotExist:
            return Response({'detail': 'Clase no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        usuario = request.user
        # Permitir si es superuser o si la clase está entre las asignadas al usuario
        if not (usuario.is_superuser or clase in usuario.usuario_clases.all()):
            return Response({'detail': 'No autorizado para seleccionar esta clase.'}, status=status.HTTP_403_FORBIDDEN)

        usuario.usuario_clase_actual = clase
        usuario.save()

        return Response({'detail': 'Clase activa actualizada.', 'usuario_clase_actual': ClaseSerializer(clase).data}, status=status.HTTP_200_OK)

    
class ServicioListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        clase = _obtener_clase_seleccionada(request, usuario)

        if not clase:
            return Response([], status=status.HTTP_200_OK)

        servicios = Servicio.objects.filter(servicio_clase=clase).order_by('servicio_fecha_hora')

        serializer = ServicioSerializer(servicios, many=True)
        return Response(serializer.data)



class ServiciosDisponiblesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        clase_del_profesor = _obtener_clase_seleccionada(request, usuario)
        if not clase_del_profesor:
            return Response([], status=status.HTTP_200_OK)

        # 👇 --- LÓGICA DE FILTRADO CORREGIDA --- 👇
        # Filtramos los servicios que pertenecen a la clase del profesor
        servicios = Servicio.objects.filter(
            servicio_clase=clase_del_profesor
        ).order_by('-servicio_fecha_hora') # Ordenamos por fecha descendente

        # Necesitarás un serializer simple para Servicio
        serializer = ServicioAsistenciaSerializer(servicios, many=True) 
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profesores_de_mi_clase(request):
    user = request.user
    clase = _obtener_clase_seleccionada(request, user)
    if not clase:
        return Response([], status=200)

    profesores = Usuario.objects.filter(
        usuario_clase_actual=clase,
        usuario_rol__in=['profesor', 'profesor_jefe', 'profesor_asistente']
    )

    data = [{
        'id': prof.id,
        'nombre': prof.usuario_nombre_completo or prof.username
    } for prof in profesores]

    return Response(data)


# ===================================================================
# SISTEMA DE MINIJUEGOS Y TIENDA
# ===================================================================
from django.db import transaction

class CompletarMinijuegoView(APIView):
    """
    Registra monedas ganadas al completar un minijuego.
    POST /api/minijuegos/completar/
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        usuario = request.user
        if usuario.usuario_rol != 'alumno' and not usuario.is_superuser and usuario.usuario_rol != 'superadmin':
            return Response({'detail': 'Solo los alumnos pueden ganar monedas.'}, status=status.HTTP_403_FORBIDDEN)

        # Usar get_or_create para permitir que el administrador juegue y tenga su propio perfil de alumno
        alumno, created = Alumno.objects.get_or_create(alumno_usuario=usuario)

        minijuego = request.data.get('minijuego')
        puntos = request.data.get('puntos', 0)

        # Lógica de cálculo de monedas y anti-trampa básica
        monedas_a_ganar = 0
        if minijuego == 'memoria':
            # Max 50 monedas
            monedas_a_ganar = min(50, int(puntos))
        elif minijuego == 'atrapa_frutas':
            # Max 60 monedas
            monedas_a_ganar = min(60, int(puntos))
        elif minijuego == 'trivia':
            # Max 10 monedas por respuesta (puntos = correctas)
            monedas_a_ganar = min(100, int(puntos) * 5)
        elif minijuego in ['salto_fe', 'flappy_dove', 'clicker', 'jericho', 'snake', 'math', 'simon']:
            # Max 60 monedas
            monedas_a_ganar = min(60, int(puntos))
        else:
            return Response({'detail': 'Minijuego no válido.'}, status=status.HTTP_400_BAD_REQUEST)

        alumno.alumno_monedas += monedas_a_ganar
        alumno.save()

        return Response({
            'detail': f'Ganaste {monedas_a_ganar} monedas.',
            'monedas_ganadas': monedas_a_ganar,
            'total_monedas': alumno.alumno_monedas
        }, status=status.HTTP_200_OK)


class ComprarTiendaView(APIView):
    """
    Realiza una compra en la tienda de recompensas.
    POST /api/shop/comprar/
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        usuario = request.user
        if usuario.usuario_rol != 'alumno' and not usuario.is_superuser and usuario.usuario_rol != 'superadmin':
            return Response({'detail': 'Solo los alumnos pueden realizar compras.'}, status=status.HTTP_403_FORBIDDEN)

        # Obtener o crear perfil del alumno para el administrador
        alumno, created = Alumno.objects.get_or_create(alumno_usuario=usuario)

        item_id = request.data.get('item_id')
        item_tipo = request.data.get('item_tipo') # 'fruto' | 'skin' | 'fondo'
        costo = request.data.get('costo', 0)

        if not item_id or not item_tipo:
            return Response({'detail': 'item_id e item_tipo requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar saldo
        if alumno.alumno_monedas < costo:
            return Response({'detail': 'No tienes monedas suficientes.'}, status=status.HTTP_400_BAD_REQUEST)

        # Descontar saldo
        alumno.alumno_monedas -= costo

        # Procesar según tipo de item
        if item_tipo == 'fruto':
            cesta, _ = Cesta.objects.get_or_create(cesta_usuario=usuario)
            if item_id == 'verdes':
                cesta.cesta_total_verdes += 1
            elif item_id == 'rojas':
                cesta.cesta_total_rojas += 1
            elif item_id == 'doradas':
                cesta.cesta_total_doradas += 1
            else:
                return Response({'detail': 'Tipo de fruto no válido.'}, status=status.HTTP_400_BAD_REQUEST)
            cesta.save()
        elif item_tipo in ['skin', 'fondo', 'food']:
            # Deserializar inventario JSON
            import json
            try:
                inventario = json.loads(alumno.alumno_inventario or '[]')
            except Exception:
                inventario = []

            # Skins y fondos son de posesión única, la comida es acumulable
            if item_tipo in ['skin', 'fondo'] and item_id in inventario:
                return Response({'detail': 'Ya tienes este artículo comprado.'}, status=status.HTTP_400_BAD_REQUEST)

            inventario.append(item_id)
            alumno.alumno_inventario = json.dumps(inventario)

        alumno.save()

        # Obtener inventario como lista para retornar
        import json
        try:
            inv_list = json.loads(alumno.alumno_inventario or '[]')
        except Exception:
            inv_list = []

        cesta, _ = Cesta.objects.get_or_create(cesta_usuario=usuario)
        return Response({
            'detail': 'Compra realizada con éxito.',
            'total_monedas': alumno.alumno_monedas,
            'inventario': inv_list,
            'cesta': {
                'verdes': cesta.cesta_total_verdes,
                'rojas': cesta.cesta_total_rojas,
                'doradas': cesta.cesta_total_doradas,
            } if item_tipo == 'fruto' else None
        }, status=status.HTTP_200_OK)


class EquiparMascotaView(APIView):
    """
    Equipa o desequipa una skin o fondo de mascota (soporta ambos simultáneamente).
    POST /api/mascota/equipar/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario = request.user
        if usuario.usuario_rol != 'alumno' and not usuario.is_superuser and usuario.usuario_rol != 'superadmin':
            return Response({'detail': 'Solo los alumnos pueden equipar skins.'}, status=status.HTTP_403_FORBIDDEN)

        # Obtener o crear perfil del alumno para el administrador
        alumno, created = Alumno.objects.get_or_create(alumno_usuario=usuario)

        item_id = request.data.get('item_id') # Ej. 'skin_gorro', 'bg_bosque', o None para quitar todo
        
        # Validar si tiene la skin en su inventario
        import json
        try:
            inventario = json.loads(alumno.alumno_inventario or '[]')
        except Exception:
            inventario = []

        # Permitir bg_normal aunque no este en inventario
        if item_id and item_id != 'bg_normal' and item_id not in inventario:
            return Response({'detail': 'No posees este artículo en tu inventario.'}, status=status.HTTP_400_BAD_REQUEST)

        actuales = [x for x in (alumno.alumno_skin_equipada or '').split(',') if x]

        if not item_id:
            # Desequipar todo
            alumno.alumno_skin_equipada = ''
        else:
            es_fondo = item_id.startswith('bg_')
            
            # Toggle: si ya está equipado, se remueve
            if item_id in actuales:
                actuales.remove(item_id)
            else:
                # Quitar el anterior de la misma categoría
                if es_fondo:
                    actuales = [x for x in actuales if not x.startswith('bg_')]
                else:
                    gorros = ['skin_gorro', 'skin_quico_gorro']
                    lentes = ['skin_lentes', 'skin_lentes_vr']
                    instrumentos = ['skin_guitarra', 'skin_violin', 'skin_bateria', 'skin_pulpito']
                    
                    if item_id in gorros:
                        actuales = [x for x in actuales if x not in gorros]
                    elif item_id in lentes:
                        actuales = [x for x in actuales if x not in lentes]
                    elif item_id in instrumentos:
                        actuales = [x for x in actuales if x not in instrumentos]
                        
                actuales.append(item_id)
            
            alumno.alumno_skin_equipada = ','.join(actuales)

        alumno.save()

        return Response({
            'detail': 'Equipamiento actualizado.',
            'alumno_skin_equipada': alumno.alumno_skin_equipada
        }, status=status.HTTP_200_OK)


class AlimentarMascotaView(APIView):
    """
    Alimenta a la mascota descontando un alimento del inventario del alumno
    y sumando salud a la mascota (hambre/sed).
    POST /api/mascota/alimentar/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario = request.user
        if usuario.usuario_rol != 'alumno' and not usuario.is_superuser and usuario.usuario_rol != 'superadmin':
            return Response({'detail': 'Solo los alumnos pueden alimentar a la mascota.'}, status=status.HTTP_403_FORBIDDEN)

        food_id = request.data.get('food_id')
        if not food_id or food_id not in FOOD_NUTRITION:
            return Response({'detail': 'Alimento no válido o no especificado.'}, status=status.HTTP_400_BAD_REQUEST)

        alumno, created = Alumno.objects.get_or_create(alumno_usuario=usuario)
        
        import json
        try:
            inventario = json.loads(alumno.alumno_inventario or '[]')
        except Exception:
            inventario = []

        # Verificar si tiene el alimento
        if food_id not in inventario:
            return Response({'detail': 'No posees este alimento en tu inventario.'}, status=status.HTTP_400_BAD_REQUEST)

        # Descontar una unidad del alimento
        inventario.remove(food_id)
        alumno.alumno_inventario = json.dumps(inventario)
        alumno.save()

        # Obtener o crear el estado de la mascota
        mascota_estado, _ = MascotaEstado.objects.get_or_create(mascota_estado_usuario=usuario)
        
        # Incrementar hambre y sed sin pasar de 100
        nutricion = FOOD_NUTRITION[food_id]
        hambre_previa = mascota_estado.mascota_estado_hambre
        sed_previa = mascota_estado.mascota_estado_sed

        mascota_estado.mascota_estado_hambre = min(100, hambre_previa + nutricion['hambre'])
        mascota_estado.mascota_estado_sed = min(100, sed_previa + nutricion['sed'])
        mascota_estado.save()

        # Calcular cuánto se incrementó realmente
        incremento_hambre = mascota_estado.mascota_estado_hambre - hambre_previa
        incremento_sed = mascota_estado.mascota_estado_sed - sed_previa

        return Response({
            'detail': f'¡Mascota alimentada con {nutricion["nombre"]}! 😋',
            'hambre': mascota_estado.mascota_estado_hambre,
            'sed': mascota_estado.mascota_estado_sed,
            'inventario': inventario,
            'nutricion_aplicada': {
                'hambre': incremento_hambre,
                'sed': incremento_sed,
            }
        }, status=status.HTTP_200_OK)


class SuperAdminToolsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.usuario_rol != 'superadmin':
            return Response({'detail': 'Acceso restringido a Súper Administradores.'}, status=status.HTTP_403_FORBIDDEN)
        
        total_usuarios = Usuario.objects.count()
        total_alumnos = Alumno.objects.count()
        total_profesores = Usuario.objects.filter(usuario_rol__in=['profesor', 'profesor_jefe', 'profesor_asistente']).count()
        total_clases = Clase.objects.count()
        
        alumnos = Alumno.objects.all()
        total_monedas = sum(a.alumno_monedas for a in alumnos)
        promedio_monedas = round(total_monedas / total_alumnos) if total_alumnos > 0 else 0
        
        alumnos_list = Alumno.objects.select_related('alumno_usuario', 'alumno_usuario__usuario_clase_actual').all()
        alumnos_data = [{
            'id': a.id,
            'nombre': a.alumno_usuario.usuario_nombre_completo or a.alumno_usuario.username,
            'clase_nombre': a.alumno_usuario.usuario_clase_actual.clase_nombre if a.alumno_usuario.usuario_clase_actual else 'Sin Asignar',
            'clase_id': a.alumno_usuario.usuario_clase_actual.clase_id if a.alumno_usuario.usuario_clase_actual else None,
            'monedas': a.alumno_monedas
        } for a in alumnos_list]
        
        return Response({
            'total_usuarios': total_usuarios,
            'total_alumnos': total_alumnos,
            'total_profesores': total_profesores,
            'total_clases': total_clases,
            'promedio_monedas': promedio_monedas,
            'total_monedas_sistema': total_monedas,
            'alumnos': alumnos_data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.usuario_rol != 'superadmin':
            return Response({'detail': 'Acceso restringido a Súper Administradores.'}, status=status.HTTP_403_FORBIDDEN)
            
        action = request.data.get('action')
        if action == 'award_coins':
            clase_id = request.data.get('clase_id')
            alumno_id = request.data.get('alumno_id')
            cantidad = int(request.data.get('cantidad', 0))
            motivo = request.data.get('motivo', 'Recompensa especial del administrador')
            
            if cantidad <= 0:
                return Response({'detail': 'La cantidad de cristo monedas debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if alumno_id:
                try:
                    alumnos_a_premiar = Alumno.objects.filter(pk=alumno_id)
                    if not alumnos_a_premiar.exists():
                        return Response({'detail': 'El alumno especificado no existe.'}, status=status.HTTP_404_NOT_FOUND)
                except Exception:
                    return Response({'detail': 'ID de alumno no válido.'}, status=status.HTTP_400_BAD_REQUEST)
            elif not clase_id or clase_id == 'all':
                alumnos_a_premiar = Alumno.objects.all()
            else:
                try:
                    clase = Clase.objects.get(pk=clase_id)
                    alumnos_a_premiar = Alumno.objects.filter(alumno_usuario__usuario_clase_actual=clase)
                except Clase.DoesNotExist:
                    return Response({'detail': 'La clase especificada no existe.'}, status=status.HTTP_404_NOT_FOUND)
            
            total_premiados = 0
            with transaction.atomic():
                for alumno in alumnos_a_premiar:
                    alumno.alumno_monedas += cantidad
                    alumno.save()
                    total_premiados += 1
                    
            destinatario = "todos los alumnos"
            if alumno_id:
                alumno_obj = alumnos_a_premiar.first()
                destinatario = f"el alumno {alumno_obj.alumno_usuario.usuario_nombre_completo or alumno_obj.alumno_usuario.username}"
            elif clase_id and clase_id != 'all':
                destinatario = f"los alumnos de la clase {clase.clase_nombre}"
                
            return Response({
                'detail': f'¡Se han otorgado {cantidad} cristo monedas a {destinatario} con éxito! 🪙',
                'total_premiados': total_premiados
            }, status=status.HTTP_200_OK)
            
        return Response({'detail': 'Acción no soportada.'}, status=status.HTTP_400_BAD_REQUEST)


# ===================================================================
# SISTEMA DE LOGROS AUTOMÁTICOS
# ===================================================================
from .logros import LOGROS_ESTABLECIDOS

class ObtenerLogrosView(APIView):
    """
    Retorna el progreso de los logros del alumno y automáticamente premia los completados.
    GET /api/logros/
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def get(self, request):
        usuario = request.user
        if usuario.usuario_rol != 'alumno' and not usuario.is_superuser and usuario.usuario_rol != 'superadmin':
            return Response({'detail': 'Solo aplicable a alumnos.'}, status=status.HTTP_403_FORBIDDEN)

        alumno, created = Alumno.objects.get_or_create(alumno_usuario=usuario)
        
        # Calcular métricas del alumno
        frutos_colocados = FrutoColocado.objects.filter(frutocolocado_usuario=usuario).count()
        asistencias = Asistencia.objects.filter(asistencia_alumno=alumno, asistencia_presente=True).count()
        
        import json
        try:
            inventario = json.loads(alumno.alumno_inventario or '[]')
            items_inventario = len(inventario)
        except:
            items_inventario = 0

        metricas = {
            'frutos_colocados': frutos_colocados,
            'asistencias': asistencias,
            'items_inventario': items_inventario
        }

        # Analizar logros
        logros_completados_ids = alumno.alumno_logros_completados if isinstance(alumno.alumno_logros_completados, list) else []
        logros_completados = []
        logros_pendientes = []
        logros_recien_completados = []

        monedas_ganadas_ahora = 0

        for logro in LOGROS_ESTABLECIDOS:
            lid = logro['id']
            progreso_actual = metricas.get(logro['tipo_metrica'], 0)
            
            if lid in logros_completados_ids:
                logros_completados.append({
                    'id': lid,
                    'titulo': logro['titulo'],
                    'descripcion': logro['descripcion'],
                    'progreso': logro['meta'],
                    'meta': logro['meta'],
                    'recompensa': logro['recompensa']
                })
            elif progreso_actual >= logro['meta']:
                # Completó el logro ahora mismo
                logros_completados_ids.append(lid)
                monedas_ganadas_ahora += logro['recompensa']
                logro_info = {
                    'id': lid,
                    'titulo': logro['titulo'],
                    'descripcion': logro['descripcion'],
                    'progreso': logro['meta'],
                    'meta': logro['meta'],
                    'recompensa': logro['recompensa']
                }
                logros_completados.append(logro_info)
                logros_recien_completados.append(logro_info)
            else:
                # Sigue pendiente
                logros_pendientes.append({
                    'id': lid,
                    'titulo': logro['titulo'],
                    'descripcion': logro['descripcion'],
                    'progreso': progreso_actual,
                    'meta': logro['meta'],
                    'recompensa': logro['recompensa']
                })
        
        # Si hubo cambios, guardar
        if logros_recien_completados:
            alumno.alumno_logros_completados = logros_completados_ids
            alumno.alumno_monedas += monedas_ganadas_ahora
            alumno.save()

        # Retornar los próximos 3 pendientes
        proximos_logros = logros_pendientes[:3]

        return Response({
            'logros_completados': logros_completados,
            'logros_pendientes': logros_pendientes,
            'proximos_logros': proximos_logros,
            'recien_completados': logros_recien_completados,
            'total_monedas': alumno.alumno_monedas,
            'metricas': metricas
        }, status=status.HTTP_200_OK)