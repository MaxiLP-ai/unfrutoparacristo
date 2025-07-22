import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Bell, PlusCircle, List, BarChart, Settings, Shield, Eye, Gift, Hammer, CalendarPlus, ListCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import ServicioActual from "../components/ServicioActual";
import ModalAsistencia from "../components/ModalAsistencia";
import CalendarioServicios from "../components/CalendarioServicios";

// --- MODAL PARA AÑADIR SERVICIO ---
const AddServicioModal = ({ isOpen, onClose, onSave, makeAuthenticatedRequest }) => {
  const [tiposServicio, setTiposServicio] = useState([]);
  const formRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const fetchTipos = async () => {
        try {
          // CORRECCIÓN: Se quita /api/ del inicio
          const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/tipos-servicio/`); 
          if (!response.ok) throw new Error('No se pudieron cargar los tipos de servicio.');
          const data = await response.json();
          setTiposServicio(data);
        } catch (error) {
          console.error("Error cargando tipos de servicio", error);
        }
      };
      fetchTipos();
    }
  }, [isOpen, makeAuthenticatedRequest]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Añadir Nuevo Servicio</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <select name="servicio_tiposervicio" className="w-full p-2 border rounded" required>
            <option value="">Seleccione un tipo de servicio</option>
            {tiposServicio.map(tipo => <option key={tipo.Tipo_ServicioId} value={tipo.Tipo_ServicioId}>{tipo.Tipo_ServicioDescripcion}</option>)}
          </select>
          <input name="servicio_descripcion" placeholder="Descripción del servicio" className="w-full p-2 border rounded" required />
          <input name="servicio_fecha_hora" type="datetime-local" className="w-full p-2 border rounded" required />
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Guardar Servicio</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL PARA AÑADIR DESAFÍO ---
const AddDesafioModal = ({ isOpen, onClose, onSave, makeAuthenticatedRequest }) => {
    const [frutos, setFrutos] = useState([]);
    const formRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            const fetchFrutos = async () => {
                try {
                    const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/frutos/`);
                    if (!response.ok) throw new Error('No se pudieron cargar los frutos.');
                    const data = await response.json();
                    setFrutos(data);
                } catch (error) {
                    console.error("Error cargando frutos", error);
                }
            };
            fetchFrutos();
        }
    }, [isOpen, makeAuthenticatedRequest]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const data = {
            desafio_descripcion: formData.get('desafio_descripcion'),
            desafio_fruto_asociado: formData.get('desafio_fruto_asociado') || null,
            desafio_asignacionAutomatica: formData.get('desafio_asignacionAutomatica') === 'on',
        };
        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
                <h2 className="text-2xl font-bold mb-4">Añadir Nuevo Desafío</h2>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <textarea name="desafio_descripcion" placeholder="Descripción del desafío" className="w-full p-2 border rounded" required />
                    <select name="desafio_fruto_asociado" className="w-full p-2 border rounded">
                        <option value="">Sin fruto asociado</option>
                        {frutos.map(f => <option key={f.fruto_id} value={f.fruto_id}>{f.fruto_nombre}</option>)}
                    </select>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" name="desafio_asignacionAutomatica" />
                        Asignación Automática
                    </label>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-lg">Guardar Desafío</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MODAL PARA ASIGNAR FRUTO ---
const AsignarFrutoModal = ({ isOpen, onClose, onSave, makeAuthenticatedRequest }) => {
    const [alumnos, setAlumnos] = useState([]);
    const [frutos, setFrutos] = useState([]);
    const formRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [alumnosRes, frutosRes] = await Promise.all([
                        // CORRECCIÓN: Se quita /api/ del inicio
                        makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/alumnos-clase/`),
                        makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/frutos/`)
                    ]);
                    const alumnosData = await alumnosRes.json();
                    const frutosData = await frutosRes.json();
                    setAlumnos(alumnosData.alumnos || []);
                    setFrutos(frutosData);
                } catch (error) {
                    console.error("Error cargando datos para asignar fruto", error);
                }
            };
            fetchData();
        }
    }, [isOpen, makeAuthenticatedRequest]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const data = Object.fromEntries(formData.entries());
        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
                <h2 className="text-2xl font-bold mb-4">Asignar Fruto Manualmente</h2>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <select name="alumno_id" className="w-full p-2 border rounded" required>
                        <option value="">Seleccione un Alumno</option>
                        {alumnos.map(a => <option key={a.id} value={a.id}>{a.usuario_nombre_completo}</option>)}
                    </select>
                    <select name="fruto_id" className="w-full p-2 border rounded" required>
                        <option value="">Seleccione un Fruto</option>
                        {frutos.map(f => <option key={f.fruto_id} value={f.fruto_id}>{f.fruto_nombre}</option>)}
                    </select>
                    <input name="motivo" placeholder="Motivo de la asignación" className="w-full p-2 border rounded" required />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg">Asignar Fruto</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Componentes de la página principal ---
const StatCard = ({ icon, title, value, color, delay }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4 animate__animated animate__zoomIn animate__delay-${delay}s`}>
    <div className={`p-4 bg-${color}-100 rounded-full`}>
      {React.cloneElement(icon, { className: `text-${color}-600`, size: 32 })}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const QuickActionButton = ({ icon, text, onClick, color, delay, isVisible }) => {
  if (!isVisible) return null;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 bg-${color}-500 text-white rounded-2xl shadow-md hover:bg-${color}-600 transition-all duration-300 transform hover:scale-105 animate__animated animate__fadeInUp animate__delay-${delay}s`}
    >
      {icon}
      <span className="text-lg font-semibold mt-2 text-center">{text}</span>
    </button>
  );
};

export default function ControlPanel({ makeAuthenticatedRequest }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalAlumnos: 0, frutosRecolectados: 0, anunciosCount: 0 });
  const [anunciosRecientes, setAnunciosRecientes] = useState([]);
  const [claseInfo, setClaseInfo] = useState(null);
  const [servicioActual, setServicioActual] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeadTeacher, setIsHeadTeacher] = useState(false);

  const [modalState, setModalState] = useState({
      asistencia: false,
      servicio: false,
      desafio: false,
      fruto: false,
  });

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
        // CORRECCIÓN: Se quita /api/ del inicio
        const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/teacher-dashboard/`);
        if (!response.ok) throw new Error('No se pudieron cargar los datos del panel.');
        const data = await response.json();
        setStats({
            totalAlumnos: data.total_alumnos || 0,
            frutosRecolectados: data.frutos_recolectados_hoy || 0,
            anunciosCount: data.anuncios_recientes?.length || 0,
        });
        setAnunciosRecientes(data.anuncios_recientes || []);
        setClaseInfo(data.clase_info || null);
        setServicioActual(data.servicio_actual || null);
        setIsHeadTeacher(data.clase_info?.clase_profesor_jefe_id === data.current_profesor_id);
    } catch (error) {
        console.error("Error al cargar datos del panel:", error);
        Swal.fire('Error de Carga', error.message || 'No se pudo conectar con el servidor.', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenModal = (modalName) => {
      setModalState(prev => ({ ...prev, [modalName]: true }));
  };

  const handleCloseModal = (modalName) => {
      setModalState(prev => ({ ...prev, [modalName]: false }));
  };

  const handleSave = async (url, data, modalName, successMessage) => {
    try {
        const response = await makeAuthenticatedRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = Object.values(errorData).flat().join('\n');
            throw new Error(errorMessage || 'Falló la operación.');
        }
        Swal.fire('¡Éxito!', successMessage, 'success');
        handleCloseModal(modalName);
        fetchDashboardData();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600 animate-pulse">Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 text-gray-800 pt-20">
      <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-green-800 mb-3">Panel de Control</h1>
          <p className="text-lg text-gray-600">
            Gestión para la clase: <span className="font-bold text-blue-700">{claseInfo?.clase_nombre || 'No asignada'}</span>
          </p>
          <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold ${isHeadTeacher ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {isHeadTeacher ? <Shield size={16} /> : <Eye size={16} />}
            <span>{isHeadTeacher ? 'Rol: Profesor(a) Jefe' : 'Rol: Profesor(a) de Apoyo'}</span>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
          <StatCard icon={<Users />} title="Alumnos en tu Clase" value={stats.totalAlumnos} color="blue" delay="0" />
          <StatCard icon={<BookOpen />} title="Frutos de Hoy" value={stats.frutosRecolectados} color="green" delay="0.1" />
          <StatCard icon={<Bell />} title="Anuncios Activos" value={stats.anunciosCount} color="yellow" delay="0.2" />
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-700 mb-6">Acciones</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <QuickActionButton isVisible={true} icon={<List />} text="Ver Alumnos" color="blue" delay="0.1" onClick={() => navigate('/alumnos')} />
            <QuickActionButton isVisible={true} icon={<BarChart />} text="Ver Progreso" color="blue" delay="0.2" onClick={() => Swal.fire('En desarrollo')} />
            <QuickActionButton isVisible={true} icon={<ListCheck />} text="Tomar Asistencia" color="blue" delay="0.3" onClick={() => handleOpenModal('asistencia')} />
            {isHeadTeacher && <QuickActionButton icon={<Settings />} text="Configurar Clase" color="gray" delay="0.3" onClick={() => Swal.fire('En desarrollo')} isVisible={true} />}
            {isHeadTeacher && <QuickActionButton icon={<CalendarPlus />} text="Añadir Servicio" color="green" delay="0" onClick={() => handleOpenModal('servicio')} isVisible={true} />}
            {isHeadTeacher && <QuickActionButton icon={<Hammer />} text="Añadir Desafío" color="orange" delay="0" onClick={() => handleOpenModal('desafio')} isVisible={true} />}
            {isHeadTeacher && <QuickActionButton icon={<Gift />} text="Asignar Fruto" color="purple" delay="0" onClick={() => handleOpenModal('fruto')} isVisible={true} />}
          </div>
        </section>

        <ServicioActual servicio={servicioActual} />
        <CalendarioServicios makeAuthenticatedRequest={makeAuthenticatedRequest} />
        
        <section>
          <h2 className="text-3xl font-bold text-gray-700 mb-6">Anuncios Recientes</h2>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            {anunciosRecientes.length > 0 ? (
              <ul className="space-y-4">
                {anunciosRecientes.map((anuncio) => (
                  <li key={anuncio.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <h3 className="text-xl font-semibold text-gray-800">{anuncio.titulo}</h3>
                    <p className="text-sm text-gray-500 mb-1">Publicado el: {new Date(anuncio.fecha).toLocaleDateString()}</p>
                    <p className="text-gray-700">{anuncio.contenido}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-center py-4">No hay anuncios recientes para tu clase.</p>
            )}
          </div>
        </section>
      </main>

      {/* Renderizado de los modales */}
      <ModalAsistencia isOpen={modalState.asistencia} onClose={() => handleCloseModal('asistencia')} makeAuthenticatedRequest={makeAuthenticatedRequest} />
      <AddServicioModal isOpen={modalState.servicio} onClose={() => handleCloseModal('servicio')} onSave={(data) => handleSave(`${import.meta.env.VITE_API_URL}/crear-servicio/`, data, 'servicio', 'Servicio creado con éxito')} makeAuthenticatedRequest={makeAuthenticatedRequest} />
      <AddDesafioModal isOpen={modalState.desafio} onClose={() => handleCloseModal('desafio')} onSave={(data) => handleSave(`${import.meta.env.VITE_API_URL}/crear-desafio/`, data, 'desafio', 'Desafío creado con éxito')} makeAuthenticatedRequest={makeAuthenticatedRequest} />
      <AsignarFrutoModal isOpen={modalState.fruto} onClose={() => handleCloseModal('fruto')} onSave={(data) => handleSave(`${import.meta.env.VITE_API_URL}/asignar-fruto/`, data, 'fruto', 'Fruto asignado con éxito')} makeAuthenticatedRequest={makeAuthenticatedRequest} />
    </div>
  );
}
