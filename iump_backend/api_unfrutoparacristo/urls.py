# api_unfrutoparacristo/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView 

# Importa TODAS tus vistas personalizadas desde tu archivo views.py
from .views import (
    CustomTokenObtainPairView,
    RegistroAlumnoView,
    RegistroProfesorView,
    UserDataView,
    ClaseListView,
    CestaDetailView, 
    PonerFrutoView,
    DevolverFrutoView,
    MascotaEstadoUpdateView,
    ValidarRutView,
    ValidarUsernameView,
    ValidarEmailView,
    GestionAlumnosListView,
    AlumnosDeClaseListView,
    AsistenciaExistenteView,
    CrearAlumnoDesdeAdminView,
    EliminarAlumnoView,
    EditarAlumnoView,
    ServicioListAPIView,
    TeacherDashboardView,
    GuardarAsistenciaView,
    ServiciosDisponiblesListView,
    HomePageDataView,
    CrearServicioView,
    CrearDesafioView,
    AsignarFrutoView,
    TipoServicioListView,
    FrutoListView
)

urlpatterns = [
    # Rutas de autenticación JWT
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Rutas de registro
    path('usuarios/validar-rut/', ValidarRutView.as_view(), name='validar_rut'),
    path('usuarios/validar-username/', ValidarUsernameView.as_view(), name='validar-username'),
    path('usuarios/validar-email/', ValidarEmailView.as_view(), name='validar-email'),
    path('registro/alumno/', RegistroAlumnoView.as_view(), name='registro_alumno'),
    path('registro/profesor/', RegistroProfesorView.as_view(), name='registro_profesor'), # Asegúrate que el nombre de la vista sea correcto

    # ¡IMPORTANTE! Ruta para obtener datos del usuario
    path('user-data/', UserDataView.as_view(), name='user_data'),
    path('clases/', ClaseListView.as_view(), name='clase-list'),

    # Rutas para administración de Profesores
    path('teacher-dashboard/', TeacherDashboardView.as_view(), name='teacher-dashboard'),
    path('alumnos-clase/', GestionAlumnosListView.as_view(), name='alumnos-clase'),
    path('alumnos-para-asistencia/', AlumnosDeClaseListView.as_view(), name='alumnos-para-asistencia'),
    path('asistencia-existente/<int:servicio_id>/', AsistenciaExistenteView.as_view(), name='asistencia-existente'),
    path('guardar-asistencia/', GuardarAsistenciaView.as_view(), name='guardar-asistencia'),
    path('crear-alumno/', CrearAlumnoDesdeAdminView.as_view(), name='crear-alumno-admin'),
    path('editar-alumno/<int:pk>/', EditarAlumnoView.as_view(), name='editar-alumno-admin'),
    path('eliminar-alumno/<int:pk>/', EliminarAlumnoView.as_view(), name='eliminar-alumno-admin'),
    path('servicios/', ServicioListAPIView.as_view(), name='api_servicios'),
    path('servicios-disponibles/', ServiciosDisponiblesListView.as_view(), name='servicios-disponibles'),

    # --- URLs para la Cesta y el Árbol ---
    path('cesta/', CestaDetailView.as_view(), name='cesta-detail'),
    path('cesta/poner_fruto/', PonerFrutoView.as_view(), name='poner-fruto'),
    path('cesta/devolver_fruto/<int:pk>/', DevolverFrutoView.as_view(), name='devolver-fruto'),

    # --- URLs para el Cuidado de la Mascota ---
    path('mascota-estado/', MascotaEstadoUpdateView.as_view(), name='mascota-estado-update'),

    # --- URLs para el Home ---
    path('home-data/', HomePageDataView.as_view(), name='home-data'),
    path('crear-servicio/', CrearServicioView.as_view(), name='crear-servicio'),
    path('crear-desafio/', CrearDesafioView.as_view(), name='crear-desafio'),
    path('asignar-fruto/', AsignarFrutoView.as_view(), name='asignar-fruto'),
    path('tipos-servicio/', TipoServicioListView.as_view(), name='tipos-servicio-list'),
    path('frutos/', FrutoListView.as_view(), name='frutos-list'),

]
