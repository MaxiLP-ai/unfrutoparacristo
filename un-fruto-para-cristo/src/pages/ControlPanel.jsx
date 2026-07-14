import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Bell, Newspaper, Loader, PlusCircle, Save, 
  List, BarChart, Settings, Shield, Eye, Gift, Hammer, CalendarPlus, ListCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import ServicioActual from "../components/ServicioActual";
import ModalAsistencia from "../components/ModalAsistencia";
import CalendarioServicios from "../components/CalendarioServicios";

// --- MODAL PARA AÑADIR SERVICIO ---
const AddServicioModal = ({ isOpen, onClose, onSave, makeAuthenticatedRequest, selectedClassId }) => {
  const [tiposServicio, setTiposServicio] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const formRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const tiposRes = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/tipos-servicio/`);
          const profesoresRes = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/profesores-de-mi-clase/${selectedClassId ? `?clase_id=${selectedClassId}` : ''}`);

          if (!tiposRes.ok || !profesoresRes.ok) throw new Error('Fallo al cargar datos.');

          const tiposData = await tiposRes.json();
          const profesoresData = await profesoresRes.json();

          setTiposServicio(tiposData);
          setProfesores(profesoresData);
        } catch (error) {
          console.error("Error cargando datos:", error);
        }
      };
      fetchData();
    }
  }, [isOpen, makeAuthenticatedRequest, selectedClassId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white border-4 border-slate-900 rounded-[2rem] shadow-[8px_8px_0px_0px_#1e293b] w-full max-w-lg p-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
          📅 Crear Nuevo Servicio
        </h2>
        <p className="text-slate-500 text-xs mb-6 font-bold">Añade una lección, evento o reunión especial.</p>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Servicio</label>
            <select name="servicio_tiposervicio" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" required>
              <option value="">Seleccione un tipo de servicio</option>
              {tiposServicio.map(tipo => (
                <option key={tipo.Tipo_ServicioId} value={tipo.Tipo_ServicioId}>
                  {tipo.Tipo_ServicioDescripcion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
            <input name="servicio_descripcion" placeholder="Descripción del servicio" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Fecha y Hora</label>
            <input name="servicio_fecha_hora" type="datetime-local" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Profesor Encargado (opcional)</label>
            <select name="servicio_profesor_encargado" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none">
              <option value="">Sin profesor encargado</option>
              {profesores.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="bubbly-button bg-slate-200 text-slate-700 border-slate-400 py-2 px-5 font-bold text-xs">Cancelar</button>
            <button type="submit" className="bubbly-button bg-blue-400 text-slate-900 border-blue-600 py-2 px-5 font-bold text-xs shadow-[2px_2px_0px_0px_#1e293b]">Guardar Servicio</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- MODAL PARA AÑADIR DESAFÍO ---
const AddDesafioModal = ({ isOpen, onClose, onSave, makeAuthenticatedRequest, selectedClassId }) => {
  const formRef = useRef(null);
  const [existingData, setExistingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const fetchCurrentDesafio = async () => {
        try {
          const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/gestionar-desafio-clase/${selectedClassId ? `?clase_id=${selectedClassId}` : ''}`); 
          if (response.ok) {
            const data = await response.json();
            setExistingData(data);
          } else {
            setExistingData(null);
          }
        } catch (error) {
          console.error("No se encontró un desafío existente, se creará uno nuevo.", error);
          setExistingData(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCurrentDesafio();
    }
  }, [isOpen, makeAuthenticatedRequest, selectedClassId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const titulo = formData.get('desafio_titulo')?.trim();
    const video = formData.get('desafio_video_url')?.trim();
    const contenido = formData.get('desafio_contenido')?.trim();

    if (!video && !contenido) {
      Swal.fire('Error', 'Debes ingresar una URL de video, contenido escrito, o ambos.', 'error');
      return;
    }

    const data = {
      desafio_titulo: titulo,
      desafio_video_url: video || null,
      desafio_contenido: contenido || null,
      desafio_activo: formData.get('desafio_activo') === 'on',
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white border-4 border-slate-900 rounded-[2rem] shadow-[8px_8px_0px_0px_#1e293b] w-full max-w-lg p-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
          ⚔️ Gestionar Desafío de Clase
        </h2>
        <p className="text-slate-500 text-xs mb-6 font-bold">Activa retos semanales para motivar a los niños.</p>
        
        {isLoading ? <p className="text-center py-4 font-bold text-slate-500">Cargando información del desafío...</p> : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título del Desafío</label>
              <input name="desafio_titulo" defaultValue={existingData?.desafio_titulo} placeholder="Título del Desafío" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL del Video (opcional)</label>
              <input name="desafio_video_url" defaultValue={existingData?.desafio_video_url} placeholder="https://www.youtube.com/embed/..." className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contenido Escrito (opcional)</label>
              <textarea name="desafio_contenido" defaultValue={existingData?.desafio_contenido} placeholder="Instrucciones detalladas del desafío..." className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none h-28" />
            </div>

            <label className="flex items-center gap-3 p-3 bg-slate-50 border-2 border-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors select-none">
              <input type="checkbox" name="desafio_activo" defaultChecked={existingData?.desafio_activo} className="h-5 w-5 rounded text-orange-500 focus:ring-orange-400" />
              <span className="font-bold text-xs text-slate-700">¿Activar y mostrar en el Home de los alumnos?</span>
            </label>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="bubbly-button bg-slate-200 text-slate-700 border-slate-400 py-2 px-5 font-bold text-xs">Cancelar</button>
              <button type="submit" className="bubbly-button bg-orange-400 text-slate-900 border-orange-600 py-2 px-5 font-bold text-xs shadow-[2px_2px_0px_0px_#1e293b]">Guardar Desafío</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- MODAL PARA VER PROGRESO DE LA CLASE ---
const ClassProgressModal = ({ isOpen, onClose, makeAuthenticatedRequest, selectedClassId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const res = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/clase-progreso/${selectedClassId ? `?clase_id=${selectedClassId}` : ''}`);
        if (!res.ok) throw new Error('No se pudo cargar el progreso de la clase');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error cargando progreso:', err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen, makeAuthenticatedRequest, selectedClassId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white border-4 border-slate-900 rounded-[2.25rem] shadow-[8px_8px_0px_0px_#1e293b] w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-slate-200">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">📊 Progreso de la Clase</h2>
          <button onClick={onClose} className="bubbly-button bg-slate-200 text-slate-700 py-1.5 px-4 text-xs font-bold">Cerrar</button>
        </div>
        {isLoading ? (
          <div className="p-8 text-center font-bold text-slate-500 animate-pulse">Cargando estadísticas de progreso...</div>
        ) : !data ? (
          <div className="p-8 text-center text-gray-500 font-bold">No hay datos disponibles para esta clase.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border-2 border-slate-800 p-4 rounded-2xl shadow-[2px_2px_0px_0px_#1e293b]">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alumnos Activos</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{data.total_alumnos}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-800 p-4 rounded-2xl shadow-[2px_2px_0px_0px_#1e293b]">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promedio Frutos (30d)</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{data.promedio_frutos_por_alumno}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-800 p-4 rounded-2xl shadow-[2px_2px_0px_0px_#1e293b]">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Servicios próximos (30d)</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{data.servicios_proximos_30d}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-800 p-4 rounded-2xl shadow-[2px_2px_0px_0px_#1e293b]">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa Desafío Completado</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{data.tasa_completacion_desafio_pct}%</p>
            </div>

            <div className="col-span-1 sm:col-span-2 bg-slate-50 border-2 border-slate-800 p-4 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b]">
              <p className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">Tendencia de Asistencia (Últimos 30 días)</p>
              <div className="flex items-end gap-1 h-24 pt-2">
                {data.attendance_trend.map((d, idx) => {
                  const max = Math.max(...data.attendance_trend.map(x => x.present, 0), 1);
                  const height = Math.round((d.present / (max || 1)) * 100);
                  return (
                    <div 
                      key={idx} 
                      title={`${d.date}: ${d.present} presentes`} 
                      className="bg-blue-400 border border-slate-800 hover:bg-blue-500 transition-colors" 
                      style={{ width: '4%', height: `${Math.max(8, height)}%`, borderRadius: '4px' }}
                    ></div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MODAL PARA CONFIGURAR CLASE ---
const ConfigClassModal = ({ isOpen, onClose, makeAuthenticatedRequest, selectedClassId, onSaved }) => {
  const formRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const res = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/configurar-clase/${selectedClassId ? `?clase_id=${selectedClassId}` : ''}`);
        if (!res.ok) throw new Error('No se pudo obtener la configuración de la clase');
        const json = await res.json();
        setExisting(json);
      } catch (err) {
        console.error('Error cargando config clase:', err);
        setExisting(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen, makeAuthenticatedRequest, selectedClassId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const payload = {
      clase_nombre: formData.get('clase_nombre')?.trim() || '',
      clase_edad_referencia_min: formData.get('clase_edad_referencia_min') ? Number(formData.get('clase_edad_referencia_min')) : null,
      clase_edad_referencia_max: formData.get('clase_edad_referencia_max') ? Number(formData.get('clase_edad_referencia_max')) : null,
      clase_descripcion: formData.get('clase_descripcion')?.trim() || '',
    };
    onSaved(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white border-4 border-slate-900 rounded-[2.25rem] shadow-[8px_8px_0px_0px_#1e293b] w-full max-w-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-800">⚙️ Configurar Clase</h2>
          <button onClick={onClose} className="bubbly-button bg-slate-200 text-slate-700 py-1.5 px-4 text-xs font-bold">Cerrar</button>
        </div>
        {isLoading ? (
          <p className="text-center py-4 font-bold text-slate-500">Cargando configuración...</p>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Clase</label>
              <input name="clase_nombre" defaultValue={existing?.clase_nombre || ''} placeholder="Nombre de la clase" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Edad Mínima</label>
                <input name="clase_edad_referencia_min" defaultValue={existing?.clase_edad_referencia_min ?? ''} type="number" min="0" placeholder="Edad min" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Edad Máxima</label>
                <input name="clase_edad_referencia_max" defaultValue={existing?.clase_edad_referencia_max ?? ''} type="number" min="0" placeholder="Edad max" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
              <textarea name="clase_descripcion" defaultValue={existing?.clase_descripcion || ''} placeholder="Describe los objetivos y tareas de esta clase..." className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none h-28" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="bubbly-button bg-slate-200 text-slate-700 border-slate-400 py-2 px-5 font-bold text-xs">Cancelar</button>
              <button type="submit" className="bubbly-button bg-blue-400 text-slate-900 border-blue-600 py-2 px-5 font-bold text-xs shadow-[2px_2px_0px_0px_#1e293b]">Guardar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- MODAL PARA GESTIONAR NOTICIAS ---
const GestionNoticiasModal = ({ isOpen, onClose, makeAuthenticatedRequest, selectedClassId }) => {
  const [noticias, setNoticias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNoticias = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/gestionar-noticias/${selectedClassId ? `?clase_id=${selectedClassId}` : ''}`);
      if (!response.ok) throw new Error('No se pudieron cargar las noticias.');
      const data = await response.json();
      setNoticias(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, makeAuthenticatedRequest, selectedClassId]);

  useEffect(() => {
    fetchNoticias();
  }, [fetchNoticias]);

  const handleUpdate = (id, updatedFields) => {
    setNoticias(prev => prev.map(n => n.noticia_id === id ? { ...n, ...updatedFields } : n));
  };

  const handleAddNew = () => {
    const newNoticia = {
      noticia_id: `new-${Date.now()}`,
      noticia_titulo: '',
      noticia_contenido: '',
      noticia_publicada: true,
      isNew: true,
    };
    setNoticias(prev => [newNoticia, ...prev]);
  };

  const handleSaveChanges = async () => {
    const toCreate = noticias.filter(n => n.isNew);
    const toUpdate = noticias.filter(n => !n.isNew);

    try {
      const createPromises = toCreate.map(noticia => {
        const { noticia_id, isNew, ...dataToSend } = noticia;
        const payload = { ...dataToSend, clase_id: selectedClassId };
        return makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/crear-noticia/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      });

      const updatePromise = makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/gestionar-noticias/${selectedClassId ? `?clase_id=${selectedClassId}` : ''}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toUpdate),
      });

      await Promise.all([...createPromises, updatePromise]);
      Swal.fire('¡Guardado!', 'Las noticias han sido actualizadas.', 'success');
      onClose();
    } catch (err) {
      Swal.fire('Error', 'No se pudieron guardar todos los cambios.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white border-4 border-slate-900 rounded-[2.25rem] shadow-[8px_8px_0px_0px_#1e293b] w-full max-w-2xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-2 border-b-2">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">📰 Gestionar Noticias</h2>
          <button onClick={handleAddNew} className="bubbly-button bg-green-400 text-slate-900 border-green-600 text-xs font-bold py-1.5 px-4 flex items-center gap-1">
            <PlusCircle size={14} /> Crear Nueva
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-4 max-h-[50vh]">
          {isLoading && <div className="flex justify-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>}
          {error && <p className="text-red-500 text-center font-bold">{error}</p>}
          {!isLoading && !error && noticias.length > 0 ? (
            noticias.map(noticia => (
              <div key={noticia.noticia_id} className="bg-slate-50 border-2 border-slate-800 p-4 rounded-2xl shadow-[2px_2px_0px_0px_#1e293b]">
                <div className="mb-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Título de la Noticia</label>
                  <input
                    type="text"
                    value={noticia.noticia_titulo}
                    onChange={(e) => handleUpdate(noticia.noticia_id, { noticia_titulo: e.target.value })}
                    className="w-full p-2 border-2 border-slate-800 rounded-xl font-bold focus:outline-none"
                    placeholder="Título de la noticia"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Contenido</label>
                  <textarea
                    value={noticia.noticia_contenido}
                    onChange={(e) => handleUpdate(noticia.noticia_id, { noticia_contenido: e.target.value })}
                    className="w-full p-2 border-2 border-slate-800 rounded-xl text-sm focus:outline-none h-20"
                    placeholder="Cuerpo de la noticia..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <span className="text-xs font-bold text-slate-600">Publicado y Visible:</span>
                  <input
                    type="checkbox"
                    checked={noticia.noticia_publicada}
                    onChange={(e) => handleUpdate(noticia.noticia_id, { noticia_publicada: e.target.checked })}
                    className="h-5 w-5 rounded text-blue-600"
                  />
                </div>
              </div>
            ))
          ) : (
            !isLoading && <p className="text-center text-gray-500 py-8 font-bold">No hay noticias creadas. ¡Sube la primera!</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t-2 mt-4">
          <button type="button" onClick={onClose} className="bubbly-button bg-slate-200 text-slate-700 border-slate-400 py-2 px-5 font-bold text-xs">Cerrar</button>
          <button type="button" onClick={handleSaveChanges} className="bubbly-button bg-blue-400 text-slate-900 border-blue-600 py-2 px-5 font-bold text-xs shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1.5">
            <Save size={14} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL PARA ASIGNAR FRUTO ---
const AsignarFrutoModal = ({ isOpen, onClose, onSave, makeAuthenticatedRequest, selectedClassId }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [frutos, setFrutos] = useState([]);
  const formRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [alumnosRes, frutosRes] = await Promise.all([
            makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/alumnos-clase/${selectedClassId ? `?clase_id=${selectedClassId}` : ''}`),
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
  }, [isOpen, makeAuthenticatedRequest, selectedClassId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white border-4 border-slate-900 rounded-[2.25rem] shadow-[8px_8px_0px_0px_#1e293b] w-full max-w-lg p-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
          🍎 Asignar Fruto Espiritual
        </h2>
        <p className="text-slate-500 text-xs mb-6 font-bold">Asigna recompensas a los alumnos destacados.</p>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alumno</label>
            <select name="alumno_id" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" required>
              <option value="">Seleccione un Alumno</option>
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.usuario_nombre_completo}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Fruto</label>
            <select name="fruto_id" className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" required>
              <option value="">Seleccione un Fruto</option>
              {frutos.map(f => <option key={f.fruto_id} value={f.fruto_id}>{f.fruto_nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Motivo</label>
            <input name="motivo" placeholder="Ej: Participación destacada, aprender versículo..." className="w-full p-2.5 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none" required />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="bubbly-button bg-slate-200 text-slate-700 border-slate-400 py-2 px-5 font-bold text-xs">Cancelar</button>
            <button type="submit" className="bubbly-button bg-purple-400 text-slate-900 border-purple-600 py-2 px-5 font-bold text-xs shadow-[2px_2px_0px_0px_#1e293b]">Asignar Fruto</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- COMPONENTES AUXILIARES DE LA INTERFAZ ---
const StatCard = ({ icon, title, value, color, delay }) => (
  <div className={`bg-white border-4 border-slate-900 p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_#1e293b] hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4`}>
    <div className={`p-3.5 bg-${color}-100 rounded-2xl border-2 border-slate-900/30 flex-shrink-0`}>
      {React.cloneElement(icon, { className: `text-${color}-600`, size: 28 })}
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const QuickActionButton = ({ icon, text, onClick, color, delay, isVisible }) => {
  if (!isVisible) return null;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 bg-white hover:bg-slate-50 border-4 border-slate-900 rounded-[2rem] shadow-[4px_4px_0px_0px_#1e293b] transition-all duration-300 transform hover:-translate-y-1.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1e293b]`}
    >
      <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-2xl border-2 border-${color}-900/10 mb-3 flex items-center justify-center`}>
        {icon}
      </div>
      <span className="text-xs font-black text-slate-800 text-center uppercase tracking-wide">{text}</span>
    </button>
  );
};


// --- COMPONENTE PRINCIPAL: PANEL DE CONTROL ---
export default function ControlPanel({ makeAuthenticatedRequest }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [stats, setStats] = useState({ totalAlumnos: 0, frutosRecolectados: 0, anunciosCount: 0 });
  const [anunciosRecientes, setAnunciosRecientes] = useState([]);
  const [claseInfo, setClaseInfo] = useState(null);
  const [servicioActual, setServicioActual] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isHeadTeacher, setIsHeadTeacher] = useState(false);
  const [userRole, setUserRole] = useState('');

  const [modalState, setModalState] = useState({
    asistencia: false,
    servicio: false,
    desafio: false,
    fruto: false,
    progreso: false,
    config: false,
    noticia: false,
  });

  const fetchDashboardData = useCallback(async (overrideClassId = null) => {
    setIsLoading(true);
    try {
      const claseIdToUse = overrideClassId ?? selectedClassId;
      const url = `${import.meta.env.VITE_API_URL}/teacher-dashboard/${claseIdToUse ? `?clase_id=${claseIdToUse}` : ''}`;
      const response = await makeAuthenticatedRequest(url);
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
  }, [makeAuthenticatedRequest, selectedClassId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Cargar clases del usuario y del sistema
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`);
        if (!res.ok) return;
        const user = await res.json();
        setUserRole(user.usuario_rol);

        let clasesList = user.usuario_clases || [];

        // SI ES SUPERADMIN: Cargar absolutamente TODAS las clases registradas en la iglesia
        if (user.usuario_rol === 'superadmin') {
          const allClasesRes = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/clases/`);
          if (allClasesRes.ok) {
            clasesList = await allClasesRes.json();
          }
        }

        setClasses(clasesList);
        
        if (!selectedClassId) {
          const defaultId = user.usuario_clase_actual?.clase_id || (clasesList[0]?.clase_id) || null;
          setSelectedClassId(defaultId);
        }
      } catch (e) {
        console.error('No se pudo obtener user-data', e);
      }
    };
    fetchUserData();
  }, [makeAuthenticatedRequest]);

  const handleOpenModal = (modalName) => {
    setModalState(prev => ({ ...prev, [modalName]: true }));
  };

  const handleCloseModal = (modalName) => {
    setModalState(prev => ({ ...prev, [modalName]: false }));
  };

  const handleClassChange = async (e) => {
    const newId = e.target.value || null;
    setSelectedClassId(newId);
    try {
      const res = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/set-active-clase/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clase_id: newId }),
      });
      if (res.ok) {
        fetchDashboardData(newId);
      }
    } catch (err) {
      console.error('No se pudo persistir la clase activa', err);
    }
  };

  const handleSave = async (url, data, modalName, successMessage) => {
    try {
      if (selectedClassId) data.clase_id = selectedClassId;
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

  const handleSaveClassConfig = async (data) => {
    try {
      const res = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/configurar-clase/${selectedClassId ? `?clase_id=${selectedClassId}` : ''}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || JSON.stringify(err));
      }
      Swal.fire('¡Guardado!', 'Configuración de la clase actualizada.', 'success');
      handleCloseModal('config');
      fetchDashboardData();
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo guardar la configuración.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-100">
        <p className="text-xl font-bold text-slate-700 animate-pulse">Cargando Panel Docente...</p>
      </div>
    );
  }

  // Permiso de escritura total para profesores jefes o superadministradores
  const canPerformWriteActions = isHeadTeacher || userRole === 'superadmin';

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Estilos e Iconos flotantes */}
      <style>{`
        .admin-background {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #f0fdf4, #f0f9ff, #faf5ff);
          font-family: 'Fredoka', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 5rem;
        }

        .bg-float-symbol {
          position: absolute;
          pointer-events: none;
          animation: floatSymbol 12s ease-in-out infinite;
          opacity: 0.15;
          z-index: 0;
        }

        @keyframes floatSymbol {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(12deg) scale(1.03); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        .admin-content {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 6.5rem 1.5rem 2rem 1.5rem;
          position: relative;
          z-index: 10;
        }

        .admin-title {
          font-weight: 700;
          color: #ffffff;
          text-shadow: 3.5px 3.5px 0px #1e293b;
          -webkit-text-stroke: 1.5px #1e293b;
        }

        .chunky-select {
          background-color: #ffffff;
          border: 3.5px solid #1e293b;
          border-radius: 1.25rem;
          padding: 0.5rem 2rem 0.5rem 1rem;
          font-weight: 700;
          color: #1e293b;
          box-shadow: 3px 3px 0px #1e293b;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
        }
        .chunky-select:hover {
          transform: translateY(-2px);
          box-shadow: 5px 5px 0px #1e293b;
        }
        
        .chunky-card {
          background: #ffffff;
          border: 4px solid #1e293b;
          border-radius: 2rem;
          box-shadow: 6px 6px 0px #1e293b;
        }
      `}</style>

      <div className="admin-background">
        
        {/* Símbolos lúdicos flotantes */}
        <span className="bg-float-symbol text-5xl" style={{ top: '10%', left: '3%', animationDelay: '0s' }}>📚</span>
        <span className="bg-float-symbol text-4xl" style={{ top: '22%', right: '5%', animationDelay: '3s' }}>🌱</span>
        <span className="bg-float-symbol text-5xl" style={{ top: '48%', left: '5%', animationDelay: '1s' }}>🍇</span>
        <span className="bg-float-symbol text-4xl" style={{ top: '65%', right: '8%', animationDelay: '5s' }}>🔔</span>
        <span className="bg-float-symbol text-4xl" style={{ top: '80%', left: '8%', animationDelay: '2s' }}>⭐</span>
        <span className="bg-float-symbol text-5xl" style={{ top: '85%', right: '35%', animationDelay: '4s' }}>🍎</span>

        <main className="admin-content">
          
          {/* Header Principal del Panel */}
          <header className="text-center mb-10">
            <h1 className="admin-title text-4xl md:text-5xl mb-3">
              Panel de Control
            </h1>
            
            {/* Selector de Clase */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
              <span className="text-slate-700 text-sm font-black uppercase tracking-wide">Administrando la Clase:</span>
              <select value={selectedClassId || ''} onChange={handleClassChange} className="chunky-select">
                <option value="">Seleccionar clase</option>
                {classes.map(c => (
                  <option key={c.clase_id} value={c.clase_id}>{c.clase_nombre}</option>
                ))}
              </select>
            </div>

            {/* Insignia de Rol Docente */}
            <div className="mt-5">
              <div className={`inline-flex items-center gap-2 px-5 py-2 border-3 border-slate-900 rounded-full text-xs font-black uppercase shadow-[2.5px_2.5px_0px_0px_#1e293b] select-none ${
                userRole === 'superadmin' 
                  ? 'bg-purple-300 text-purple-900 border-purple-800' 
                  : isHeadTeacher 
                    ? 'bg-emerald-300 text-emerald-950 border-emerald-800' 
                    : 'bg-sky-300 text-sky-950 border-sky-800'
              }`}>
                {userRole === 'superadmin' ? <Shield size={14} className="animate-pulse" /> : isHeadTeacher ? <Shield size={14} /> : <Eye size={14} />}
                <span>
                  {userRole === 'superadmin' 
                    ? 'Rol: Super Administrador' 
                    : isHeadTeacher 
                      ? 'Rol: Profesor(a) Jefe' 
                      : 'Rol: Profesor(a) de Apoyo'}
                </span>
              </div>
            </div>
          </header>

          {/* TARJETAS DE ESTADÍSTICAS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
            <StatCard icon={<Users />} title="Alumnos Inscritos" value={stats.totalAlumnos} color="blue" />
            <StatCard icon={<BookOpen />} title="Frutos Cosechados (Hoy)" value={stats.frutosRecolectados} color="emerald" />
            <StatCard icon={<Bell />} title="Anuncios en curso" value={stats.anunciosCount} color="amber" />
          </section>

          {/* ACCIONES DEL PROFESOR / SUPERADMIN */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              ⚡ Acciones Disponibles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              
              <QuickActionButton 
                isVisible={true} 
                icon={<List className="text-blue-600" size={24} />} 
                text="Ver Alumnos" 
                color="blue" 
                onClick={() => navigate('/alumnos')} 
              />
              
              <QuickActionButton 
                isVisible={true} 
                icon={<BarChart className="text-blue-600" size={24} />} 
                text="Ver Progreso" 
                color="blue" 
                onClick={() => handleOpenModal('progreso')} 
              />
              
              <QuickActionButton 
                isVisible={true} 
                icon={<ListCheck className="text-blue-600" size={24} />} 
                text="Tomar Asistencia" 
                color="blue" 
                onClick={() => handleOpenModal('asistencia')} 
              />
              
              <QuickActionButton 
                isVisible={canPerformWriteActions} 
                icon={<Settings className="text-indigo-600" size={24} />} 
                text="Configurar Clase" 
                color="indigo" 
                onClick={() => handleOpenModal('config')} 
              />
              
              <QuickActionButton 
                isVisible={canPerformWriteActions} 
                icon={<CalendarPlus className="text-indigo-600" size={24} />} 
                text="Añadir Servicio" 
                color="indigo" 
                onClick={() => handleOpenModal('servicio')} 
              />
              
              <QuickActionButton 
                isVisible={canPerformWriteActions} 
                icon={<Hammer className="text-indigo-600" size={24} />} 
                text="Añadir Desafío" 
                color="indigo" 
                onClick={() => handleOpenModal('desafio')} 
              />
              
              <QuickActionButton 
                isVisible={canPerformWriteActions} 
                icon={<Gift className="text-indigo-600" size={24} />} 
                text="Asignar Fruto" 
                color="indigo" 
                onClick={() => handleOpenModal('fruto')} 
              />
              
              <QuickActionButton 
                isVisible={canPerformWriteActions} 
                icon={<Newspaper className="text-indigo-600" size={24} />} 
                text="Gestionar Noticias" 
                color="indigo" 
                onClick={() => handleOpenModal('noticia')} 
              />

            </div>
          </section>

          {/* SERVICIO ACTUAL Y CALENDARIO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
            <div className="lg:col-span-6">
              <ServicioActual servicio={servicioActual} />
            </div>
            <div className="lg:col-span-6">
              <CalendarioServicios makeAuthenticatedRequest={makeAuthenticatedRequest} selectedClassId={selectedClassId} />
            </div>
          </div>

          {/* ANUNCIOS RECIENTES */}
          <section className="relative z-10">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              📢 Anuncios e Instrucciones Recientes
            </h2>
            <div className="chunky-card p-8">
              {anunciosRecientes.length > 0 ? (
                <ul className="space-y-6">
                  {anunciosRecientes.map((anuncio) => (
                    <li key={anuncio.id} className="border-b-2 border-slate-100 pb-5 last:border-b-0 last:pb-0">
                      <h3 className="text-lg font-black text-slate-800">{anuncio.titulo}</h3>
                      <p className="text-xs text-slate-400 font-bold mb-2">Publicado el: {new Date(anuncio.fecha).toLocaleDateString()}</p>
                      <p className="text-sm text-slate-600 font-semibold leading-relaxed">{anuncio.contenido}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 font-bold text-center py-6">No hay anuncios ni noticias publicadas en esta clase para el día de hoy.</p>
              )}
            </div>
          </section>

        </main>
      </div>

      {/* Renderizado de Modales de Gestión */}
      <ModalAsistencia 
        isOpen={modalState.asistencia} 
        onClose={() => handleCloseModal('asistencia')} 
        makeAuthenticatedRequest={makeAuthenticatedRequest} 
        selectedClassId={selectedClassId}
      />
      
      <AddServicioModal 
        isOpen={modalState.servicio} 
        onClose={() => handleCloseModal('servicio')} 
        onSave={(data) => handleSave(`${import.meta.env.VITE_API_URL}/crear-servicio/`, data, 'servicio', '¡El servicio ha sido creado con éxito!')} 
        makeAuthenticatedRequest={makeAuthenticatedRequest} 
        selectedClassId={selectedClassId} 
      />
      
      <AddDesafioModal 
        isOpen={modalState.desafio} 
        onClose={() => handleCloseModal('desafio')} 
        onSave={(data) => handleSave(`${import.meta.env.VITE_API_URL}/gestionar-desafio-clase/`, data, 'desafio', '¡El desafío se ha guardado correctamente!')} 
        makeAuthenticatedRequest={makeAuthenticatedRequest} 
        selectedClassId={selectedClassId} 
      />
      
      <GestionNoticiasModal 
        isOpen={modalState.noticia} 
        onClose={() => handleCloseModal('noticia')} 
        makeAuthenticatedRequest={makeAuthenticatedRequest} 
        selectedClassId={selectedClassId} 
      />
      
      <AsignarFrutoModal 
        isOpen={modalState.fruto} 
        onClose={() => handleCloseModal('fruto')} 
        onSave={(data) => handleSave(`${import.meta.env.VITE_API_URL}/asignar-fruto/`, data, 'fruto', '¡El fruto espiritual se ha asignado con éxito!')} 
        makeAuthenticatedRequest={makeAuthenticatedRequest} 
        selectedClassId={selectedClassId} 
      />
      
      <ClassProgressModal 
        isOpen={modalState.progreso} 
        onClose={() => handleCloseModal('progreso')} 
        makeAuthenticatedRequest={makeAuthenticatedRequest} 
        selectedClassId={selectedClassId} 
      />
      
      <ConfigClassModal 
        isOpen={modalState.config} 
        onClose={() => handleCloseModal('config')} 
        makeAuthenticatedRequest={makeAuthenticatedRequest} 
        selectedClassId={selectedClassId} 
        onSaved={(data) => handleSaveClassConfig(data)} 
      />
    </>
  );
}
