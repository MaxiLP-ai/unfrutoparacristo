import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  User, Mail, Calendar, GraduationCap, QrCode, Smartphone, 
  HeartPulse, ClipboardList, Users, IdCard, Shield, Edit, 
  LogOut, Award, Activity, Save, XCircle, Info, Home, MapPin
} from 'lucide-react';
import { Canvas, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATA DE LA MASCOTA ---
const PET_DATA = {
  '3': {
    name: 'Valentin',
    clase: 'Transición Niños',
    modelPath: '/models/valentin.glb',
    initialScale: 0.85,
    initialPosition: [0, -0.2, 0],
  },
  '2': {
    name: 'Leo',
    clase: 'Valientes de David',
    modelPath: '/models/leo.glb',
    initialScale: 0.95,
    initialPosition: [-0.2, -0.2, 0],
  },
  '1': {
    name: 'Luna',
    clase: 'Semillas de Amor',
    modelPath: '/models/luna.glb',
    initialScale: 0.8,
    initialPosition: [0, -0.3, 0],
  },
  'default': {
    name: 'Mascota',
    modelPath: '/models/valentin.glb',
    initialScale: 0.7,
    initialPosition: [0, -0.2, 0],
  }
};

const CLOTHES_METADATA = [
  { id: 'skin_gorro', nombre: 'Gorro Divertido', emoji: '🎩', tipo: 'skin', modelPath: '/models/gorro.glb' },
  { id: 'skin_quico_gorro', nombre: 'Gorro de Quico', emoji: '🧢', tipo: 'skin', modelPath: '/models/quico_gorro.glb' },
  { id: 'skin_lentes', nombre: 'Lentes de Sol 3D', emoji: '🕶️', tipo: 'skin', modelPath: '/models/lentes_de_sol.glb' },
  { id: 'skin_lentes_vr', nombre: 'Lentes VR Box', emoji: '🥽', tipo: 'skin', modelPath: '/models/vr-glasses.glb' },
  { id: 'skin_guitarra', nombre: 'Guitarra Acústica', emoji: '🎸', tipo: 'skin', modelPath: '/models/guitarra_gibson_acustica.glb' },
  { id: 'skin_violin', nombre: 'Violín Clásico', emoji: '🎻', tipo: 'skin', modelPath: '/models/violin.glb' },
  { id: 'skin_bateria', nombre: 'Batería Musical', emoji: '🥁', tipo: 'skin', modelPath: '/models/bateria.glb' },
  { id: 'skin_pulpito', nombre: 'Púlpito de la Iglesia', emoji: '⛪', tipo: 'skin', modelPath: '/models/pulpito_iumpconcon.glb' },
  { id: 'skin_figurita_pastor', nombre: 'Figurita del Pastor', emoji: '👨‍💼', tipo: 'skin', modelPath: '/models/figurita_pastor.glb' },
  { id: 'bg_bosque', nombre: 'Fondo del Bosque', emoji: '🌲', tipo: 'fondo' },
  { id: 'bg_playa', nombre: 'Fondo de Playa', emoji: '🏖️', tipo: 'fondo' },
];

const DEFAULT_ACCESSORY_ADJUSTMENTS = {
  skin_gorro: {
    '1': { scale: [0.5058, 0.5058, 0.5058], position: [0.02, 0.291, -0.017], rotation: [0, 38, 0] },
    '2': { scale: [0.5298, 0.5298, 0.5298], position: [-0.1, 0.364, 0.073], rotation: [-6, 51, 0] },
    '3': { scale: [0.4, 0.4, 0.4], position: [0.037, 0.193, 0.018], rotation: [0, 29, 0] },
    default: { scale: [0.35, 0.35, 0.35], position: [0, 0.5, 0], rotation: [0, 0, 0] }
  },
  skin_quico_gorro: {
    '1': { scale: [4.5599, 4.5599, 4.5599], position: [0.039, 0.304, 0.026], rotation: [0, 44, 0] },
    '2': { scale: [4.1764, 4.1764, 4.1764], position: [-0.068, 0.591, 0.098], rotation: [0, 46, 0] },
    '3': { scale: [3.4472, 3.4472, 3.4472], position: [0.082, 0.181, 0.068], rotation: [0, 49, 0] },
    default: { scale: [0.35, 0.35, 0.35], position: [0, 0.5, 0], rotation: [0, 0, 0] }
  },
  skin_lentes: {
    '1': { scale: [0.06, 0.06, 0.06], position: [0.104, -0.756, 0.13], rotation: [0, 47, 0] },
    '2': { scale: [0.06, 0.06, 0.06], position: [0.075, -0.481, 0.242], rotation: [0, 42, 0] },
    '3': { scale: [0.0435, 0.0435, 0.0435], position: [0.09, -0.54, 0.095], rotation: [0, 48, 0] },
    default: { scale: [0.06, 0.06, 0.06], position: [0, 0.25, 0.35], rotation: [0, 0, 0] }
  },
  skin_lentes_vr: {
    '1': { scale: [0.0719, 0.0719, 0.0719], position: [0.344, 0.036, 0.35], rotation: [0, 31, 0] },
    '2': { scale: [0.0748, 0.0748, 0.0748], position: [0.223, 0.25, 0.4], rotation: [0, 42, 0] },
    '3': { scale: [0.045, 0.045, 0.045], position: [0.2, 0.009, 0.195], rotation: [0, 34, 0] },
    default: { scale: [0.05, 0.05, 0.05], position: [0, 0.25, 0.35], rotation: [0, 0, 0] }
  },
  skin_guitarra: {
    '1': { scale: [0.0299, 0.0299, 0.0299], position: [0.45, -1.004, 0.25], rotation: [15, 63, -35] },
    '2': { scale: [0.0253, 0.0253, 0.0253], position: [0.765, -0.96, -0.12], rotation: [360, 64, -3] },
    '3': { scale: [0.0191, 0.0191, 0.0191], position: [0.45, -0.8, 0.154], rotation: [28, 92, -47] },
    default: { scale: [0.015, 0.015, 0.015], position: [0.45, -0.35, 0.25], rotation: [15, 45, -35] }
  },
  skin_violin: {
    '1': { scale: [1.62, 1.62, 1.62], position: [0.362, -0.728, 0.3], rotation: [59, -8, -20] },
    '2': { scale: [1.6646, 1.6646, 1.6646], position: [0.26, -0.753, 0.434], rotation: [-109, -171, -226] },
    '3': { scale: [1.25, 1.25, 1.25], position: [0.4, -0.6, 0.3], rotation: [74, 16, -20] },
    default: { scale: [1.1, 1.1, 1.1], position: [0.4, -0.3, 0.3], rotation: [-30, 45, -20] }
  },
  skin_bateria: {
    '1': { scale: [0.1672, 0.1672, 0.1672], position: [0.501, -0.84, 0.375], rotation: [0, -124, 0] },
    '2': { scale: [0.1655, 0.1655, 0.1655], position: [0.4, -0.71, 0.83], rotation: [0, -146, 0] },
    '3': { scale: [0.1672, 0.1672, 0.1725], position: [0.454, -0.737, 0.384], rotation: [0, -132, 0] },
    default: { scale: [0.08, 0.08, 0.08], position: [0.6, -0.4, 0.1], rotation: [0, -45, 0] }
  },
  skin_pulpito: {
    '1': { scale: [0.3344, 0.3344, 0.3344], position: [0.455, -0.653, 0.483], rotation: [0, -131, 0] },
    '2': { scale: [0.4123, 0.4123, 0.4123], position: [0.56, -0.617, 0.691], rotation: [0, -136, 0] },
    '3': { scale: [0.4999, 0.4999, 0.4999], position: [0.284, -0.781, 0.316], rotation: [0, -143, 0] },
    default: { scale: [0.25, 0.25, 0.25], position: [0, -0.4, 0.35], rotation: [0, 0, 0] }
  },
  skin_figurita_pastor: {
    '1': { scale: [0.49, 0.49, 0.49], position: [0.856, -0.488, 0.014], rotation: [0, 44, 0] },
    '2': { scale: [0.4747, 0.4747, 0.4747], position: [1.07, -0.4, 0.25], rotation: [0, 42, 0] },
    '3': { scale: [0.4999, 0.4999, 0.4999], position: [0.779, -0.461, 0.18], rotation: [0, 30, 0] },
    default: { scale: [0.2, 0.2, 0.2], position: [0.35, -0.4, 0.25], rotation: [0, 0, 0] }
  }
};

const Model = React.memo(({ path, scale, position, rotation }) => {
  const gltf = useLoader(GLTFLoader, path);
  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      node.material.flatShading = false;
      node.material.needsUpdate = true;
    }
  });
  return <primitive object={gltf.scene} scale={scale} position={position} rotation={rotation} />;
});

const AccessoryModel = React.memo(({ path, scale, position, rotation }) => {
  const gltf = useLoader(GLTFLoader, path);
  const clonedScene = React.useMemo(() => {
    if (!gltf) return null;
    return gltf.scene.clone();
  }, [gltf]);

  React.useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((node) => {
        if (node.isMesh) {
          node.material.flatShading = false;
          node.material.depthTest = true;
          node.material.transparent = false;
          node.material.opacity = 1.0;
          node.material.needsUpdate = true;
        }
      });
    }
  }, [clonedScene]);

  if (!clonedScene) return null;
  const radRotation = rotation ? rotation.map(deg => (deg * Math.PI) / 180) : [0, 0, 0];

  return (
    <group scale={scale} position={position} rotation={radRotation}>
      <primitive object={clonedScene} />
    </group>
  );
});

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

const EditProfileModal = ({ userData, onSave, onCancel }) => {
  const [editedUsername, setEditedUsername] = useState(userData.username || '');
  const [editedNombreCompleto, setEditedNombreCompleto] = useState(userData.usuario_nombre_completo || '');
  const [editedEmail, setEditedEmail] = useState(userData.usuario_email || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userData.usuario_avatar || AVATAR_OPTIONS[0]);
  const [editedFechaNacimiento, setEditedFechaNacimiento] = useState(userData.usuario_fecha_nacimiento || '');

  const [editedAlergias, setEditedAlergias] = useState(userData.perfil?.alumno_alergias || '');
  const [editedEnfermedades, setEditedEnfermedades] = useState(userData.perfil?.alumno_enfermedades_base || '');
  const [editedTelefono, setEditedTelefono] = useState(userData.perfil?.alumno_telefono || '');
  const [editedDireccion, setEditedDireccion] = useState(userData.perfil?.alumno_direccion || '');
  const [editedCodigoInvitacionUsado, setEditedCodigoInvitacionUsado] = useState(userData.perfil?.alumno_invitado_por_username || '');
  const [editedTelefonoApoderado, setEditedTelefonoApoderado] = useState(userData.perfil?.alumno_telefono_apoderado || '');

  const [emailError, setEmailError] = useState('');

  const handleSave = () => {
    if (editedEmail && !/\S+@\S+\.\S+/.test(editedEmail)) {
      setEmailError('Formato de correo electrónico inválido.');
      return;
    }
    
    const updatedData = {
      username: editedUsername,
      usuario_email: editedEmail === '' ? null : editedEmail,
      usuario_nombre_completo: editedNombreCompleto === '' ? null : editedNombreCompleto,
      usuario_fecha_nacimiento: editedFechaNacimiento === '' ? null : editedFechaNacimiento,
      usuario_avatar: selectedAvatar,
      alumno_telefono: editedTelefono === '' ? null : editedTelefono,
      alumno_direccion: editedDireccion === '' ? null : editedDireccion,
      alumno_alergias: editedAlergias === '' ? null : editedAlergias,
      alumno_enfermedades_base: editedEnfermedades === '' ? null : editedEnfermedades,
      alumno_telefono_apoderado: editedTelefonoApoderado === '' ? null : editedTelefonoApoderado,
    };

    if (userData.usuario_rol === 'alumno' && !userData.perfil?.alumno_invitado_por_username && editedCodigoInvitacionUsado) {
      updatedData.codigo_invitacion_a_usar = editedCodigoInvitacionUsado;
    }

    onSave(updatedData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Edit size={20} className="text-indigo-600" /> Editar Mi Información
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuario</label>
              <input type="text" value={editedUsername} onChange={(e) => setEditedUsername(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
              <input type="text" value={editedNombreCompleto} onChange={(e) => setEditedNombreCompleto(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
            <input type="email" value={editedEmail} onChange={(e) => setEditedEmail(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            {emailError && <p className="text-rose-500 text-xs mt-1 font-semibold">{emailError}</p>}
          </div>

          {userData.usuario_rol === 'alumno' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Nacimiento</label>
                  <input type="date" value={editedFechaNacimiento} onChange={(e) => setEditedFechaNacimiento(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Celular Alumno</label>
                  <input type="text" value={editedTelefono} onChange={(e) => setEditedTelefono(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección</label>
                <input type="text" value={editedDireccion} onChange={(e) => setEditedDireccion(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alergias</label>
                  <input type="text" value={editedAlergias} onChange={(e) => setEditedAlergias(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Enfermedades</label>
                  <input type="text" value={editedEnfermedades} onChange={(e) => setEditedEnfermedades(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono Apoderado</label>
                  <input type="text" value={editedTelefonoApoderado} onChange={(e) => setEditedTelefonoApoderado(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código Invitación</label>
                  <input type="text" disabled={!!userData.perfil?.alumno_invitado_por_username} value={editedCodigoInvitacionUsado} onChange={(e) => setEditedCodigoInvitacionUsado(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none" />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Seleccionar Avatar</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {AVATAR_OPTIONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedAvatar(name)}
                  className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedAvatar === name ? 'border-indigo-600 scale-105' : 'border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <img src={`/images/avatars/${name}`} alt="Avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage({ user, onLogout, makeAuthenticatedRequest }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [activeTab, setActiveTab] = useState('data');

  const [achievements, setAchievements] = useState([]);

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

  const getClassDisplayName = (claseId) => {
    const classOption = clasesDisponibles.find(option => option.value === claseId);
    return classOption ? classOption.label : 'Sin Asignar';
  };

  useEffect(() => {
    const fetchClases = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/clases/`);
        if (response.ok) {
          const data = await response.json();
          setClasesDisponibles(data.map(clase => ({ value: clase.clase_id, label: clase.clase_nombre })));
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchClases();
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setUserData(await response.json());
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Error al cargar los datos del perfil.");
      }
    } catch (err) {
      setError("Error de conexión al servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  const fetchAchievements = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/logros/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        const iconMap = {
          'logro_primer_fruto': '🍎',
          'logro_cosecha_inicial': '🧺',
          'logro_cosecha_abundante': '🌳',
          'logro_comprador_novato': '🛍️',
          'logro_estudiante_constante': '📚'
        };

        const completed = (data.logros_completados || []).map(logro => ({
          ...logro,
          icon: iconMap[logro.id] || '🏆',
          completed: true
        }));

        const pending = (data.logros_pendientes || []).map(logro => ({
          ...logro,
          icon: iconMap[logro.id] || '🔒',
          completed: false
        }));

        setAchievements([...completed, ...pending]);
      }
    } catch (err) {
      console.error("Error al cargar logros:", err);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (userData && userData.usuario_rol === 'alumno') {
      fetchAchievements();
    }
  }, [userData, fetchAchievements]);

  const handleLogoutClick = () => {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: "¿Quieres salir de tu cuenta?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Cerrar Sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
      }
    });
  };

  const handleSaveProfile = async (updatedFields) => {
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });

      if (response.ok) {
        setUserData(await response.json());
        setShowEditModal(false);
        Swal.fire('¡Éxito!', 'Perfil actualizado correctamente.', 'success');
      } else {
        const responseData = await response.json();
        Swal.fire('Error', responseData.detail || 'Fallo al actualizar el perfil.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700 p-6">
        <h1 className="text-xl font-bold mb-2">Error al Cargar Perfil</h1>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => { onLogout(); navigate('/'); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition">
          Volver a Login
        </button>
      </div>
    );
  }

  const userAge = calculateAge(userData?.usuario_fecha_nacimiento);
  const activePetId = userData?.usuario_clase_actual?.clase_id || '3';
  const currentPet = PET_DATA[activePetId] || PET_DATA['default'];
  const equippedSkins = (userData?.perfil?.alumno_skin_equipada || '').split(',').filter(Boolean);
  const isAlumno = userData?.usuario_rol === 'alumno';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-start items-center p-4 sm:p-8 pt-24 lg:pt-24 font-sans select-none">
      
      {/* Background Subtle Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40 z-0" />
      
      <div className="w-full max-w-5xl relative z-10">
        
        {/* Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: Tarjeta Principal */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            
            {/* Contenedor del Avatar (3D o 2D) */}
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden relative mb-4">
              {isAlumno && currentPet ? (
                <div className="w-full h-full">
                  <Canvas camera={{ position: [0, 0.05, 2.1], fov: 50 }}>
                    <ambientLight intensity={1.5} />
                    <hemisphereLight skyColor="#FFFFFF" groundColor="#333333" intensity={1.0} />
                    <directionalLight position={[3, 5, 3]} intensity={1.5} />
                    <OrbitControls 
                      enableZoom={false} 
                      autoRotate 
                      autoRotateSpeed={1.8} 
                      enablePan={false}
                      minPolarAngle={Math.PI / 2}
                      maxPolarAngle={Math.PI / 2}
                    />
                    <Suspense fallback={null}>
                      <Model
                        path={currentPet.modelPath}
                        scale={[currentPet.initialScale, currentPet.initialScale, currentPet.initialScale]}
                        position={[currentPet.initialPosition[0], currentPet.initialPosition[1] - 0.1, currentPet.initialPosition[2]]}
                        rotation={[0, Math.PI / 4, 0]}
                      />
                      {equippedSkins.map(itemId => {
                        const meta = CLOTHES_METADATA.find(c => c.id === itemId);
                        if (!meta || !meta.modelPath) return null;

                        let itemAdjusts = DEFAULT_ACCESSORY_ADJUSTMENTS[itemId]?.[activePetId] || 
                                         DEFAULT_ACCESSORY_ADJUSTMENTS[itemId]?.['default'] || 
                                         { scale: [1, 1, 1], position: [0, 0, 0], rotation: [0, 0, 0] };

                        let finalScale = [...itemAdjusts.scale];
                        let finalPos = [...itemAdjusts.position];
                        let finalRot = [...itemAdjusts.rotation];

                        if (itemId === 'skin_guitarra' && finalScale[0] === 1.0) {
                          finalScale = activePetId === '2' ? [0.0253, 0.0253, 0.0253] : [0.015, 0.015, 0.015];
                          finalPos = activePetId === '2' ? [0.765, -0.96, -0.12] : [0.45, -0.35, 0.25];
                          finalRot = activePetId === '2' ? [360, 64, -3] : [15, 45, -35];
                        } else if (itemId === 'skin_violin' && finalScale[0] === 1.0) {
                          finalScale = activePetId === '2' ? [1.6646, 1.6646, 1.6646] : [1.1, 1.1, 1.1];
                          finalPos = activePetId === '2' ? [0.26, -0.753, 0.434] : [0.4, -0.3, 0.3];
                          finalRot = activePetId === '2' ? [-109, -171, -226] : [-30, 45, -20];
                        } else if (itemId === 'skin_lentes' && finalScale[0] === 1.0) {
                          finalScale = [0.06, 0.06, 0.06];
                          finalPos = activePetId === '2' ? [0.075, -0.481, 0.242] : [0, 0.25, 0.35];
                          finalRot = activePetId === '2' ? [0, 42, 0] : [0, 0, 0];
                        } else if (itemId === 'skin_lentes_vr' && finalScale[0] === 1.0) {
                          finalScale = activePetId === '2' ? [0.0748, 0.0748, 0.0748] : [0.05, 0.05, 0.05];
                          finalPos = activePetId === '2' ? [0.223, 0.25, 0.4] : [0, 0.25, 0.35];
                          finalRot = activePetId === '2' ? [0, 42, 0] : [0, 0, 0];
                        } else if (itemId === 'skin_pulpito' && finalScale[0] === 1.0) {
                          finalScale = activePetId === '2' ? [0.4123, 0.4123, 0.4123] : [0.25, 0.25, 0.25];
                          finalPos = activePetId === '2' ? [0.56, -0.617, 0.691] : [0, -0.4, 0.35];
                          finalRot = activePetId === '2' ? [0, -136, 0] : [0, 0, 0];
                        } else if (itemId === 'skin_figurita_pastor' && finalScale[0] === 1.0) {
                          finalScale = activePetId === '2' ? [0.4747, 0.4747, 0.4747] : [0.2, 0.2, 0.2];
                          finalPos = activePetId === '2' ? [1.07, -0.4, 0.25] : [0.35, -0.4, 0.25];
                          finalRot = activePetId === '2' ? [0, 42, 0] : [0, 0, 0];
                        } else if (itemId === 'skin_bateria' && finalScale[0] === 1.0) {
                          finalScale = activePetId === '2' ? [0.1655, 0.1655, 0.1655] : [0.08, 0.08, 0.08];
                          finalPos = activePetId === '2' ? [0.4, -0.71, 0.83] : [0.6, -0.4, 0.1];
                          finalRot = activePetId === '2' ? [0, -146, 0] : [0, -45, 0];
                        }

                        finalPos[1] = finalPos[1] - 0.1;

                        return (
                          <AccessoryModel
                            key={itemId}
                            path={meta.modelPath}
                            scale={finalScale}
                            position={finalPos}
                            rotation={finalRot}
                          />
                        );
                      })}
                    </Suspense>
                  </Canvas>
                </div>
              ) : (
                <img
                  src={userData.usuario_avatar ? `/images/avatars/${userData.usuario_avatar}` : '/images/avatars/default.png'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Nombre y Rol */}
            <h2 className="text-xl font-bold text-slate-800">{userData.username}</h2>
            <div className="mt-1 flex items-center gap-1.5 justify-center">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                userData.usuario_rol === 'superadmin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                isAlumno ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {userData.usuario_rol === 'superadmin' ? <Shield size={10} /> : <User size={10} />}
                <span>{userData.usuario_rol === 'superadmin' ? 'Superadmin' : isAlumno ? 'Alumno(a)' : 'Docente'}</span>
              </span>
            </div>

            {/* Frutos/Monedas si es Alumno */}
            {isAlumno && (
              <div className="w-full flex flex-col gap-3 mt-6">
                <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cesta de Frutos</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">{userData.perfil?.manzanas_en_inventario ?? 0} Recolectados</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">🧺</div>
                </div>

                <div className="w-full bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Frutos en el Árbol</p>
                    <p className="text-lg font-black text-emerald-900 mt-0.5">{userData.perfil?.frutos_en_arbol ?? 0} Colocados</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">🍎</div>
                </div>
              </div>
            )}

            {/* Botones de Operaciones */}
            <div className="w-full mt-6 space-y-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <Edit size={14} /> Editar Información
              </button>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-100/55 text-rose-700 rounded-xl text-xs font-bold transition-colors"
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            </div>

          </div>

          {/* COLUMNA DERECHA: Pestañas de Datos */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Barra de Pestañas (Tab Bar) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm flex gap-1">
              <button
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'data' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Mis Datos
              </button>
              {isAlumno && (
                <>
                  <button
                    onClick={() => setActiveTab('health')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      activeTab === 'health' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Ficha de Salud
                  </button>
                  <button
                    onClick={() => setActiveTab('apoderado')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      activeTab === 'apoderado' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Apoderado
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab('achievements')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'achievements' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Logros
              </button>
            </div>

            {/* Contenido según Pestaña Activa */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* TAB 1: MIS DATOS */}
                  {activeTab === 'data' && (
                    <div className="space-y-4">
                      <h3 className="text-md font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                        <Info size={16} className="text-indigo-600" /> Información Personal
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'RUT / Identificación', value: userData.usuario_rut, icon: <IdCard size={15} className="text-slate-400" /> },
                          { label: 'Nombre Completo', value: userData.usuario_nombre_completo, icon: <User size={15} className="text-slate-400" /> },
                          { label: 'Correo Electrónico', value: userData.usuario_email, icon: <Mail size={15} className="text-slate-400" /> },
                          { label: 'Clase Asignada', value: userData.usuario_clase_actual ? getClassDisplayName(userData.usuario_clase_actual.clase_id) : 'Ninguna', icon: <GraduationCap size={15} className="text-slate-400" /> },
                          { label: 'Fecha de Nacimiento', value: userData.usuario_fecha_nacimiento ? `${userData.usuario_fecha_nacimiento} (${userAge} años)` : null, icon: <Calendar size={15} className="text-slate-400" /> },
                          { label: 'Código Invitación Propio', value: isAlumno ? userData.perfil?.alumno_codigo_invitacion : null, icon: <QrCode size={15} className="text-slate-400" /> },
                        ]
                          .filter(item => item.value)
                          .map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                              <div className="p-2 bg-white border border-slate-200/50 rounded-xl text-slate-600">
                                {item.icon}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                                <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: FICHA DE SALUD */}
                  {activeTab === 'health' && isAlumno && (
                    <div className="space-y-4">
                      <h3 className="text-md font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                        <HeartPulse size={16} className="text-indigo-600" /> Registro de Salud
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Celular de Contacto', value: userData.perfil.alumno_telefono, icon: <Smartphone size={15} className="text-slate-400" /> },
                          { label: 'Dirección de Habitación', value: userData.perfil.alumno_direccion, icon: <Home size={15} className="text-slate-400" /> },
                          { label: 'Alergias Conocidas', value: userData.perfil.alumno_alergias || 'Ninguna registrada', icon: <HeartPulse size={15} className="text-slate-400" /> },
                          { label: 'Enfermedades de Base', value: userData.perfil.alumno_enfermedades_base || 'Ninguna registrada', icon: <HeartPulse size={15} className="text-slate-400" /> },
                          { label: 'Observaciones Docentes', value: userData.perfil.alumno_observaciones_profesor, icon: <ClipboardList size={15} className="text-slate-400" /> },
                        ]
                          .filter(item => item.value)
                          .map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                              <div className="p-2 bg-white border border-slate-200/50 rounded-xl text-slate-600">
                                {item.icon}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                                <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: APODERADO */}
                  {activeTab === 'apoderado' && isAlumno && (
                    <div className="space-y-4">
                      <h3 className="text-md font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                        <Users size={16} className="text-indigo-600" /> Representante o Apoderado
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Nombre Completo del Apoderado', value: userData.perfil.alumno_nombre_apoderado, icon: <User size={15} className="text-slate-400" /> },
                          { label: 'Teléfono de Contacto del Apoderado', value: userData.perfil.alumno_telefono_apoderado, icon: <Smartphone size={15} className="text-slate-400" /> },
                        ]
                          .filter(item => item.value)
                          .map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                              <div className="p-2 bg-white border border-slate-200/50 rounded-xl text-slate-600">
                                {item.icon}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                                <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: LOGROS */}
                  {activeTab === 'achievements' && (
                    <div className="space-y-4">
                      <h3 className="text-md font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                        <Award size={16} className="text-indigo-600" /> Medallas y Hitos alcanzados
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isAlumno ? (
                          achievements.map((a) => (
                            <div key={a.id} className={`flex gap-3 p-3.5 border rounded-2xl transition-all duration-300 hover:scale-[1.01] ${
                              a.completed 
                                ? 'bg-emerald-50/40 border-emerald-200 shadow-sm' 
                                : 'bg-slate-50 border-slate-200/60 opacity-90'
                            }`}>
                              <div className="text-3xl filter drop-shadow-[1px_1px_0px_rgba(0,0,0,0.15)] flex-shrink-0">
                                {a.icon}
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-bold text-slate-800">{a.titulo || a.name}</p>
                                  {a.completed ? (
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">Completado (+{a.recompensa} 🪙)</span>
                                  ) : (
                                    <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">En Progreso</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{a.descripcion || a.description}</p>
                                {!a.completed && (
                                  <div className="mt-3">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                      <span>Progreso: {a.progreso} / {a.meta}</span>
                                      <span>+{a.recompensa} 🪙</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-indigo-500 h-full transition-all duration-300" 
                                        style={{ width: `${Math.min(100, (a.progreso / a.meta) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-8 text-slate-500 font-semibold">
                            Los logros y recompensas se habilitan exclusivamente para las cuentas de alumnos. ¡Gracias por tu labor docente!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>

      {showEditModal && (
        <EditProfileModal
          userData={userData}
          onSave={handleSaveProfile}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
