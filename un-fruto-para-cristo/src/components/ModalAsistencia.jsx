import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { X, ListChecks, UserCheck, ArrowLeft, CalendarDays } from 'lucide-react';

export default function ModalAsistencia({ isOpen, onClose, makeAuthenticatedRequest }) {
  const [servicios, setServicios] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState(null);
  
  const [alumnos, setAlumnos] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Paso 1: Cargar la lista de servicios disponibles
  const fetchServicios = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/servicios-disponibles/`);
      if (!response.ok) throw new Error('No se pudieron cargar los servicios disponibles.');
      const data = await response.json();
      setServicios(data);
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, makeAuthenticatedRequest]);

  useEffect(() => {
    if (isOpen) {
      setSelectedServicio(null);
      setAlumnos([]);
      setAsistencia({});
      fetchServicios();
    }
  }, [isOpen, fetchServicios]);


  // Paso 2: Cargar los datos de asistencia después de seleccionar un servicio
  const fetchAsistenciaData = useCallback(async (servicioId) => {
    if (!servicioId) return;

    setIsLoading(true);
    try {
      const [alumnosResponse, asistenciaResponse] = await Promise.all([
        makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/alumnos-para-asistencia/`),
        makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/asistencia-existente/${servicioId}/`)
      ]);

      if (!alumnosResponse.ok || !asistenciaResponse.ok) {
        throw new Error('No se pudieron cargar los datos para la asistencia.');
      }

      const alumnosData = await alumnosResponse.json();
      const asistenciaData = await asistenciaResponse.json();

      setAlumnos(alumnosData);

      const asistenciaInicial = {};
      alumnosData.forEach(alumno => {
        asistenciaInicial[alumno.usuario_rut] = asistenciaData.ruts_presentes?.includes(alumno.usuario_rut) || false;
      });
      setAsistencia(asistenciaInicial);

    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  const handleSelectServicio = (servicio) => {
    setSelectedServicio(servicio);
    fetchAsistenciaData(servicio.servicio_id);
  };

  const toggleAsistencia = (rut) => {
    setAsistencia(prev => ({ ...prev, [rut]: !prev[rut] }));
  };

  const guardarAsistencia = async () => {
    const rutsPresentes = Object.keys(asistencia).filter(rut => asistencia[rut]);

    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/guardar-asistencia/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            servicio_id: selectedServicio.servicio_id, 
            ruts_presentes: rutsPresentes 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join('\n');
        throw new Error(errorMessage || 'No se pudo guardar la asistencia.');
      }

      Swal.fire('Guardado', 'Asistencia registrada correctamente.', 'success');
      onClose();

    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  if (!isOpen) return null;

  // Función para formatear la fecha de manera legible
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-CL', options);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ListChecks size={28} className="text-blue-600" />
            {selectedServicio ? `Asistencia: ${selectedServicio.servicio_descripcion}` : 'Seleccionar Servicio'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        
        {!selectedServicio ? (
          <div className="max-h-80 overflow-y-auto border-t border-b py-2">
            {isLoading ? (
              <p className="text-center text-gray-500 p-4">Cargando servicios...</p>
            ) : (
              <ul className="space-y-2">
                {servicios.map((servicio) => (
                  <li key={servicio.servicio_id}>
                    <button onClick={() => handleSelectServicio(servicio)} className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <CalendarDays size={24} className="text-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        {/* 👇 --- FORMATO DE VISUALIZACIÓN ACTUALIZADO --- 👇 */}
                        <span className="font-bold text-gray-800">
                          {servicio.tipo_servicio}: {servicio.servicio_descripcion}
                        </span>
                        <span className="block text-sm text-gray-500">{formatDate(servicio.servicio_fecha_hora)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto border-t border-b py-2">
            {isLoading ? (
              <p className="text-center text-gray-500 p-4">Cargando alumnos...</p>
            ) : (
              <ul className="space-y-1">
                {alumnos.map((alumno) => (
                  <li 
                    key={alumno.id} 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${asistencia[alumno.usuario_rut] ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleAsistencia(alumno.usuario_rut)}
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck size={20} className={asistencia[alumno.usuario_rut] ? 'text-blue-600' : 'text-gray-400'} />
                      <span className={`font-medium ${asistencia[alumno.usuario_rut] ? 'text-gray-800' : 'text-gray-600'}`}>
                        {alumno.usuario_nombre_completo}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-blue-600"
                      checked={asistencia[alumno.usuario_rut] || false}
                      onChange={() => toggleAsistencia(alumno.usuario_rut)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div>
            {selectedServicio && (
              <button onClick={() => setSelectedServicio(null)} className="flex items-center gap-2 bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">
                <ArrowLeft size={16} /> Volver
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
            {selectedServicio && <button onClick={guardarAsistencia} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Guardar Asistencia</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
