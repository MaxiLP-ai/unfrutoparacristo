import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  User, Mail, Phone, Calendar, Briefcase, Tag, LogOut, Award, 
  Activity, Edit, Save, XCircle, Image as ImageIcon, 
  Fingerprint, Info, Apple, MapPin, AlertTriangle, MessageSquare, 
  PhoneCall 
} from 'lucide-react';
import '../pages_css/ProfilePage.css';

// Lista de opciones de avatares (nombres de archivo)
const AVATAR_OPTIONS = [
  'default.png',
  'hombre.png',
  'mujer.png',
  'abraham.png',
  'david.png',
  'moises.png',
  'noe.png',
  'pedro.png',
  'juanbautista.png',
];


// Custom hook para animaciones al hacer scroll
const useIntersectionObserver = (options) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target); // Animación una sola vez
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, isVisible];
};

// Componente del Modal de Edición
const EditProfileModal = ({ userData, onSave, onCancel, clasesDisponibles }) => {
  // DATOS PARA USUARIO
  const [editedUsername, setEditedUsername] = useState(userData.username || '');
  const [editedNombreCompleto, setEditedNombreCompleto] = useState(userData.usuario_nombre_completo || '');
  const [editedEmail, setEditedEmail] = useState(userData.usuario_email || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userData.usuario_avatar || AVATAR_OPTIONS[0]);
  const [editedFechaNacimiento, setEditedFechaNacimiento] = useState(userData.usuario_fecha_nacimiento || '');

  // DATOS PARA ALUMNO
  const [editedAlergias, setEditedAlergias] = useState(userData.perfil.alumno_alergias || '');
  const [editedEnfermedades, setEditedEnfermedades] = useState(userData.perfil.alumno_enfermedades_base || '');
  const [editedTelefono, setEditedTelefono] = useState(userData.perfil.alumno_telefono || '');
  const [editedDireccion, setEditedDireccion] = useState(userData.perfil.alumno_direccion || '');
  const [editedCodigoInvitacionUsado, setEditedCodigoInvitacionUsado] = useState(userData.perfil.alumno_invitado_por_username || '');
  
  // DATOS DE APODERADO
  const [editedTelefonoApoderado, setEditedTelefonoApoderado] = useState(userData.perfil.alumno_telefono_apoderado || '');

  // DATOS NO NULLEABLES
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [fechanaciminentoError, setFechaNaciminentoError] = useState('');

  // Sincronizar el estado del modal con los datos de usuario si cambian
  useEffect(() => {
    // DATOS PARA USUARIO
    setEditedUsername(userData.username || '');
    setEditedNombreCompleto(userData.usuario_nombre_completo || '');
    setEditedEmail(userData.usuario_email || '');
    setSelectedAvatar(userData.usuario_avatar || AVATAR_OPTIONS[0]);
    setEditedFechaNacimiento(userData.usuario_fecha_nacimiento || '');

    // DATOS PARA ALUMNO
    setEditedAlergias(userData.perfil.alumno_alergias || '');
    setEditedEnfermedades(userData.perfil.alumno_enfermedades_base || '');
    setEditedTelefono(userData.perfil.alumno_telefono || '');
    setEditedDireccion(userData.perfil.alumno_direccion || '');
    setEditedCodigoInvitacionUsado(userData.perfil.alumno_invitado_por_username || '');

    // DATOS DE APODERADO
    setEditedTelefonoApoderado(userData.perfil.alumno_telefono_apoderado || '');

  }, [userData]);



  const handleSave = () => {
    let isValid = true;
    setUsernameError('');
    setEmailError('');
    setFechaNaciminentoError('');

    if (editedEmail && !/\S+@\S+\.\S+/.test(editedEmail)) {
      setEmailError('Formato de correo electrónico inválido.');
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const updatedData = {
      // DATOS DE USUARIO
      username: editedUsername,
      usuario_email: editedEmail === '' ? null : editedEmail,
      usuario_nombre_completo: editedNombreCompleto === '' ? null : editedNombreCompleto,
      usuario_fecha_nacimiento: editedFechaNacimiento === '' ? null : editedFechaNacimiento,
      usuario_avatar: selectedAvatar,

      // DATOS DE ALUMNO
      alumno_telefono: editedTelefono === '' ? null : editedTelefono,
      alumno_direccion: editedDireccion === '' ? null : editedDireccion,
      alumno_alergias: editedAlergias === '' ? null : editedAlergias,
      alumno_enfermedades_base: editedEnfermedades === '' ? null : editedEnfermedades,

      // DATOS DEL APODERADO
      alumno_telefono_apoderado: editedTelefonoApoderado === '' ? null : editedTelefonoApoderado,
    };

    // Solo añadir código de invitación si aplica
    if (
      userData.usuario_rol === 'alumno' &&
      !userData.perfil.alumno_invitado_por_username && // Ojo, debe ser desde `perfil`
      editedCodigoInvitacionUsado
    ) {
      updatedData.codigo_invitacion_a_usar = editedCodigoInvitacionUsado;
    }

    onSave(updatedData);
  };

  return (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto animate__animated animate__zoomIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 flex items-center justify-center">
        <Edit size={28} className="mr-3 text-blue-600" /> Editar Perfil
      </h2>

      <div className="space-y-5 pb-4">
        <div>
          <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">Nombre de Usuario</label>
          <input
            id="username"
            type="text"
            value={editedUsername}
            onChange={(e) => setEditedUsername(e.target.value)}
            placeholder="Tu nombre de usuario"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Correo Electrónico</label>
          <input
            id="email"
            type="email"
            value={editedEmail}
            onChange={(e) => setEditedEmail(e.target.value)}
            placeholder="Tu correo electrónico"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="nombreCompleto" className="block text-gray-700 text-sm font-semibold mb-2">Nombre Completo</label>
          <input
            id="nombreCompleto"
            type="text"
            value={editedNombreCompleto}
            onChange={(e) => setEditedNombreCompleto(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Solo para alumnos */}
        {userData.usuario_rol === 'alumno' && (
          <>
            <div>
              <label htmlFor="fechaNacimiento" className="block text-gray-700 text-sm font-semibold mb-2">Fecha de Nacimiento</label>
              <input
                id="fechaNacimiento"
                type="date"
                value={editedFechaNacimiento}
                onChange={(e) => setEditedFechaNacimiento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-gray-700 text-sm font-semibold mb-2">Teléfono</label>
              <input
                id="telefono"
                type="text"
                value={editedTelefono}
                onChange={(e) => setEditedTelefono(e.target.value)}
                placeholder="Número de contacto"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="codigoInvitacionUsado" className="block text-gray-700 text-sm font-semibold mb-2">Código de Invitación</label>
              {userData.alumno_invitado_por_username ? (
                <input
                  id="codigoInvitacionUsado"
                  type="text"
                  value={userData.alumno_codigo_invitacion}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                  readOnly
                  disabled
                />
              ) : (
                <input
                  id="codigoInvitacionUsado"
                  type="text"
                  value={editedCodigoInvitacionUsado}
                  onChange={(e) => setEditedCodigoInvitacionUsado(e.target.value)}
                  placeholder="Ingresa un código de invitación"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {userData.alumno_invitado_por_username
                  ? 'Ya has utilizado un código de invitación. No se puede cambiar.'
                  : 'Solo puedes ingresar un código una vez.'}
              </p>
            </div>
          </>
        )}

        <div className="flex flex-col items-center mb-6">
          <label className="block text-gray-700 text-lg font-semibold mb-3">Selecciona tu Avatar</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
            {AVATAR_OPTIONS.map((avatarName) => (
              <div
                key={avatarName}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden cursor-pointer transition-all duration-200
                  ${selectedAvatar === avatarName ? 'border-4 border-blue-500 shadow-lg scale-105' : 'border-2 border-gray-200 hover:border-blue-300'}`}
                onClick={() => setSelectedAvatar(avatarName)}
              >
                <img
                  src={`/images/avatars/${avatarName}`}
                  alt={`Avatar ${avatarName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/500x500/cccccc/000000?text=Error";
                  }}
                />
                {selectedAvatar === avatarName && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-30 rounded-full">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition flex items-center"
        >
          <XCircle size={20} className="mr-2" /> Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <Save size={20} className="mr-2" /> Guardar Cambios
        </button>
      </div>
    </div>
  </div>
  );
};



// Componente principal ProfilePage
export default function ProfilePage({ user, onLogout, makeAuthenticatedRequest }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);

  const [achievements, setAchievements] = useState([
    { id: 1, name: "Proximamente", description: "Logros por desbloquear.", icon: "🍎" },
  ]);

  // Refs para las secciones animadas
  const [headerSectionRef, isHeaderSectionVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [detailsSectionRef, isDetailsSectionVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [achievementsSectionRef, isAchievementsSectionVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [activitySectionRef, isActivitySectionVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [buttonsSectionRef, isButtonsSectionVisible] = useIntersectionObserver({ threshold: 0.1 });


  // Función para calcular la edad a partir de la fecha de nacimiento
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Mapeo simple para nombres de clase (ahora usará las clases cargadas dinámicamente)
  const getClassDisplayName = (claseId) => {
    const classOption = clasesDisponibles.find(option => option.value === claseId);
    return classOption ? classOption.label : 'N/A';
  };

  // Cargar clases disponibles al montar el componente
  useEffect(() => {
    const fetchClases = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/clases/`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar las clases');
        }
        const data = await response.json();
        const formattedClases = [{ value: '', label: 'Selecciona una clase (Opcional)' }, ...data.map(clase => ({
          value: clase.clase_id,
          label: clase.clase_nombre
        }))];
        setClasesDisponibles(formattedClases);
      } catch (error) {
        console.error("Error al cargar clases en ProfilePage:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error de carga',
          text: 'No se pudieron cargar las clases disponibles para edición.',
        });
      }
    };
    fetchClases();
  }, []);


  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Error al cargar los datos del perfil.");
        // Si el error es 401, onLogout ya debería haber sido llamado por makeAuthenticatedRequest
      }
    } catch (err) {
      setError("Error de conexión al servidor.");
      console.error("Error fetching user profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleLogoutClick = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Quieres cerrar tu sesión?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
        Swal.fire(
          '¡Sesión cerrada!',
          'Has cerrado tu sesión exitosamente.',
          'success'
        );
      }
    });
  };

  const handleSaveProfile = async (updatedFields) => {
    setIsLoading(true);

    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      });

      const responseData = await response.json();

      if (response.ok) {
        setUserData(responseData);
        setShowEditModal(false);
        Swal.fire('¡Éxito!', 'Perfil actualizado correctamente.', 'success');
      } else {
        console.error("Error completo del backend:", responseData);

        let errorMessage = "Error al actualizar el perfil.";
        if (responseData) {
            const errorMessagesArray = Object.keys(responseData).map(key => {
                const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const errorValue = responseData[key];

                if (Array.isArray(errorValue)) {
                    return `${fieldName}: ${errorValue.join(', ')}`;
                } else if (typeof errorValue === 'string') {
                    return `${fieldName}: ${errorValue}`;
                } else {
                    return `${fieldName}: ${JSON.stringify(errorValue)}`;
                }
            });
            errorMessage = errorMessagesArray.join('; ');

            if (responseData.detail) errorMessage = responseData.detail;
            else if (responseData.message) errorMessage = responseData.message;
            else if (errorMessagesArray.length === 0) errorMessage = JSON.stringify(responseData);
        }
        Swal.fire('Error', errorMessage, 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error de conexión al servidor.', 'error');
      console.error("Error saving profile (network/parsing error):", err);
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 text-red-700 p-4">
        <h1 className="text-3xl font-bold mb-4">Error al cargar el perfil</h1>
        <p className="text-lg">{error}</p>
        <button
          onClick={() => {
            onLogout();
            navigate('/');
          }}
          className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
        >
          Volver al Login
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-700 p-4">
        <h1 className="text-3xl font-bold mb-4">Perfil no disponible</h1>
        <p className="text-lg">No se pudieron cargar los datos del usuario.</p>
      </div>
    );
  }

  const userAge = calculateAge(userData.usuario_fecha_nacimiento); // Usar alumno_fecha_nacimiento

  return (
    <>
      {/* Enlace a Google Fonts para 'Poppins' */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="profile-background">
        <h1 className="text-4xl lg:text-5xl font-bold text-center mb-12 main-profile-title">
          Mi Perfil
        </h1>

        {/* Sección de Información Principal (Avatar, Nombre, Rol) */}
        <section
          ref={headerSectionRef}
          className={`w-full max-w-4xl mx-auto profile-card animated-section ${isHeaderSectionVisible ? 'is-visible' : ''}`}
        >
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shadow-lg mb-4 border-4 border-blue-400">
            {/* Usar userData.usuario_avatar */}
            {userData.usuario_avatar ? (
              <img
                src={`/images/avatars/${userData.usuario_avatar}`}
                alt="Avatar de usuario"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/500x500/cccccc/000000?text=Error"; }}
              />
            ) : (
              <User size={80} className="text-gray-500" />
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">{userData.username}</h2>
          <p className="text-xl text-gray-600 mb-4">
            {/* Usar userData.usuario_rol */}
            <span className="font-semibold">{userData.usuario_rol === 'alumno' ? 'Alumno(a)' : 'Profesor(a)'}</span>
          </p>
        </section>

        {/* Sección de Detalles de Usuario (SIEMPRE si es alumno o profesor) */}
        
        {['alumno', 'profesor', 'profesor_jefe', 'profesor_asistente', 'superadmin'].includes(userData.usuario_rol) && (
          
          <section
            ref={detailsSectionRef}
            className={`w-full max-w-4xl mx-auto profile-card animated-section ${isDetailsSectionVisible ? 'is-visible' : ''}`}
          >
            <h3 className="text-2xl font-bold profile-section-title">
              <Info size={24} className="mr-2 text-purple-600 detail-icon" /> Detalles de Usuario
            </h3>

            <div className="space-y-3 text-gray-700 w-full text-center md:text-left">
              {[
                {
                  label: 'Rut',
                  value: userData.usuario_rut,
                  icon: <Fingerprint size={20} className="text-blue-500 detail-icon" />,
                },
                {
                  label: 'Nombre',
                  value: userData.usuario_nombre_completo,
                  icon: <User size={20} className="text-blue-500 detail-icon" />,
                },
                {
                  label: 'Correo Electrónico',
                  value: userData.usuario_email,
                  icon: <Mail size={20} className="text-blue-500 detail-icon" />,
                },
                {
                  label: 'Clase',
                  value: userData.usuario_clase_actual ? getClassDisplayName(userData.usuario_clase_actual.clase_id) : null,
                  icon: <Briefcase size={20} className="text-blue-500 detail-icon" />,
                },
                {
                  label: 'Fecha de Nacimiento',
                  value: userData.usuario_fecha_nacimiento
                    ? `${userData.usuario_fecha_nacimiento} (${userAge} años)`
                    : null,
                  icon: <Calendar size={20} className="text-blue-500 detail-icon" />,
                },
                {
                  label: 'Código de Invitación Propio',
                  value: userData.usuario_rol === 'alumno' ? userData.perfil?.alumno_codigo_invitacion : null,
                  icon: <Tag size={20} className="text-green-600 detail-icon" />,
                },
                {
                  label: 'Fui Invitado Por',
                  value: userData.usuario_rol === 'alumno' ? userData.perfil?.alumno_invitado_por_username : null,
                  icon: <User size={20} className="text-purple-600 detail-icon" />,
                },
              ]
                .filter((item) => item.value)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 justify-center md:justify-start">
                    {item.icon}
                    <p className="text-md sm:text-lg">
                      <span className="font-semibold">{item.label}:</span> {item.value}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Sección de Información Adicional (SOLO si es alumno) */}
        {userData.usuario_rol === 'alumno' && (
          <section
            ref={detailsSectionRef}
            className={`w-full max-w-4xl mx-auto profile-card animated-section ${isDetailsSectionVisible ? 'is-visible' : ''}`}
          >
            <h3 className="text-2xl font-bold profile-section-title">
              <Info size={24} className="mr-2 text-purple-600 detail-icon" /> Información Adicional
            </h3>

            <div className="space-y-3 text-gray-700 w-full text-center md:text-left">
              {[
                {
                  label: 'Teléfono',
                  value: userData.perfil.alumno_telefono,
                  icon: <Phone size={20} className="text-blue-500 detail-icon" />,
                },
                {
                  label: 'Dirección',
                  value: userData.perfil?.alumno_direccion,
                  icon: <MapPin size={20} className="text-blue-500 detail-icon" />,
                },
                {
                  label: 'Alergias',
                  value: userData.perfil?.alumno_alergias,
                  icon: <AlertTriangle size={20} className="text-red-500 detail-icon" />,
                },
                {
                  label: 'Enfermedades de Base',
                  value: userData.perfil?.alumno_enfermedades_base,
                  icon: <Activity size={20} className="text-yellow-500 detail-icon" />,
                },
                {
                  label: 'Observaciones del Profesor',
                  value: userData.perfil?.alumno_observaciones_profesor,
                  icon: <MessageSquare size={20} className="text-purple-500 detail-icon" />,
                },
              ]
                .filter((item) => item.value)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 justify-center md:justify-start">
                    {item.icon}
                    <p className="text-md sm:text-lg">
                      <span className="font-semibold">{item.label}:</span> {item.value}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Sección de Información del Apoderado (SOLO si es alumno) */}
        {userData.usuario_rol === 'alumno' && (
          <section
            ref={detailsSectionRef}
            className={`w-full max-w-4xl mx-auto profile-card animated-section ${isDetailsSectionVisible ? 'is-visible' : ''}`}
          >
            <h3 className="text-2xl font-bold profile-section-title">
              <Info size={24} className="mr-2 text-purple-600 detail-icon" /> Información del Apoderado
            </h3>

            <div className="space-y-3 text-gray-700 w-full text-center md:text-left">
              {[
                {
                  label: 'Nombre Apoderado(a)',
                  value: userData.perfil?.alumno_nombre_apoderado,
                  icon: <User size={20} className="text-blue-500 detail-icon" />,
                },
                {
                  label: 'Teléfono Apoderado(a)',
                  value: userData.perfil?.alumno_telefono_apoderado,
                  icon: <PhoneCall size={20} className="text-blue-500 detail-icon" />,
                },
              ]
                .filter((item) => item.value)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 justify-center md:justify-start">
                    {item.icon}
                    <p className="text-md sm:text-lg">
                      <span className="font-semibold">{item.label}:</span> {item.value}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}


        {userData.usuario_rol === 'alumno' && ( // Usar usuario_rol
          <section
            ref={achievementsSectionRef}
            className={`w-full max-w-4xl mx-auto profile-card animated-section ${isAchievementsSectionVisible ? 'is-visible' : ''}`}
          >
            <h3 className="text-2xl font-bold profile-section-title">
              <Award size={24} className="mr-2 text-yellow-600 detail-icon" /> Mis Logros
            </h3>
            {achievements.length > 0 ? (
              <ul className="space-y-3 w-full text-left">
                {achievements.map(achievement => (
                  <li key={achievement.id} className="flex items-start space-x-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="font-semibold text-lg">{achievement.name}</p>
                      <p className="text-gray-600 text-sm">{achievement.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-center">Aún no tienes logros. ¡Sigue cosechando frutos!</p>
            )}
          </section>
        )}
        
        {/* Sección de Manzanas en Inventario (Solo para Alumnos) */}
        {userData.usuario_rol === 'alumno' && (
            <section
                ref={activitySectionRef} // Puedes reutilizar una ref o crear una nueva
                className={`w-full max-w-4xl mx-auto profile-card animated-section ${isActivitySectionVisible ? 'is-visible' : ''}`}
            >
                <h3 className="text-2xl font-bold profile-section-title">
                    <Apple size={24} className="mr-2 text-orange-600 detail-icon" /> Mis Frutos
                </h3>
                <p className="text-gray-600 text-center text-lg font-bold">
                    Total de frutos en inventario: {userData.perfil?.manzanas_en_inventario !== undefined ? userData.perfil?.manzanas_en_inventario : 'Cargando...'}
                </p>
                
                
            </section>
        )}

        <section
          ref={activitySectionRef}
          className={`w-full max-w-4xl mx-auto profile-card animated-section ${isActivitySectionVisible ? 'is-visible' : ''}`}
        >
          <h3 className="text-2xl font-bold profile-section-title">
            <Activity size={24} className="mr-2 text-teal-600 detail-icon" /> Actividad Reciente
          </h3>
          <p className="text-gray-600 text-center">Aquí se mostrará tu actividad reciente en la plataforma.</p>
        </section>

        <div
          ref={buttonsSectionRef}
          className={`flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-4xl mx-auto mt-8 animated-section ${isButtonsSectionVisible ? 'is-visible' : ''}`}
        >
          <button
            onClick={() => setShowEditModal(true)}
            className="profile-button"
          >
            <Edit size={20} className="mr-2" /> Editar Perfil
          </button>

          <button
            onClick={handleLogoutClick}
            className="profile-button bg-red-600 hover:bg-red-700" // Sobreescribe el gradiente para el botón de logout
            style={{ background: 'linear-gradient(45deg, #DC2626, #B91C1C)' }} // Gradiente rojo para logout
          >
            <LogOut size={20} className="mr-2" /> Cerrar Sesión
          </button>
        </div>

        {showEditModal && (
          <EditProfileModal
            userData={userData}
            onSave={handleSaveProfile}
            onCancel={() => setShowEditModal(false)}
            clasesDisponibles={clasesDisponibles} // Pasa las clases disponibles al modal
          />
        )}
      </div>
    </>
  );
}
