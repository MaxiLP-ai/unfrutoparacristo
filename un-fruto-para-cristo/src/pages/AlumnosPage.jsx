import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, User, Eye, Edit, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';

// --- FUNCIONES DE AYUDA PARA EL RUT CHILENO ---

/**
 * Limpia un RUT, quitando puntos y guiones.
 * @param {string} rut - El RUT con o sin formato.
 * @returns {string} El RUT limpio (ej: "12345678k").
 */
const cleanRut = (rut) => {
  return typeof rut === 'string' ? rut.replace(/[^0-9kK]/g, '').toUpperCase() : '';
};

/**
 * Valida un RUT chileno usando el algoritmo del Módulo 11.
 * @param {string} rut - El RUT limpio (sin puntos ni guion).
 * @returns {boolean} - True si el RUT es válido, false si no lo es.
 */
const validateRut = (rut) => {
  const rutLimpio = cleanRut(rut);
  if (rutLimpio.length < 2) return false;

  const body = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  let suma = 0;
  let multiplo = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body.charAt(i), 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado =
    dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  return dv === dvCalculado;
};

/**
 * Formatea un RUT limpio al formato XX.XXX.XXX-X.
 * @param {string} rut - El RUT limpio.
 * @returns {string} - El RUT formateado.
 */
const formatRut = (rut) => {
  const rutLimpio = cleanRut(rut);
  if (rutLimpio.length < 2) return rutLimpio;

  const body = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  let bodyFormateado = '';
  
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      bodyFormateado = '.' + bodyFormateado;
    }
    bodyFormateado = body.charAt(i) + bodyFormateado;
  }
  
  return bodyFormateado + '-' + dv;
};


// Componente del Modal para Ver, Editar o Añadir Alumno
const AlumnoModal = ({ isOpen, onClose, mode, alumno, onSave, profesorClase }) => {
  // Usamos useRef para cada campo del formulario.
  const rutRef = useRef(null);
  const usernameRef = useRef(null);
  const nombreCompletoRef = useRef(null);
  const emailRef = useRef(null);
  const fechaNacimientoRef = useRef(null);
  const passwordRef = useRef(null);
  const password2Ref = useRef(null);
  // Refs para campos del perfil del alumno
  const telefonoApoderadoRef = useRef(null);
  const alergiasRef = useRef(null);
  const direccionRef = useRef(null);
  const nombreApoderadoRef = useRef(null);
  const observacionesRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // --- VALIDACIÓN Y FORMATEO DEL RUT ---
    const rutValue = rutRef.current?.value;
    if (!validateRut(rutValue)) {
      Swal.fire('RUT Inválido', 'Por favor, ingresa un RUT chileno válido.', 'error');
      return; // Detiene el envío si el RUT no es válido
    }
    const formattedRut = formatRut(rutValue);
    // --- FIN DE LA VALIDACIÓN ---

    let dataToSave = {};

    if (mode === 'add') {
      const password = passwordRef.current?.value;
      const password2 = password2Ref.current?.value;
      if (password !== password2) {
        Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
        return;
      }

      dataToSave = {
        usuario_rut: formattedRut, // Se envía el RUT formateado
        username: usernameRef.current?.value,
        usuario_nombre_completo: nombreCompletoRef.current?.value,
        usuario_email: emailRef.current?.value,
        password: password,
        password2: password2,
        usuario_fecha_nacimiento: fechaNacimientoRef.current?.value,
        usuario_clase_actual: profesorClase?.id,
      };
    } else if (mode === 'edit') {
      dataToSave = {
        id: alumno?.id,
        usuario_rut: formattedRut, // Se envía el RUT formateado
        username: usernameRef.current?.value,
        usuario_nombre_completo: nombreCompletoRef.current?.value,
        usuario_email: emailRef.current?.value,
        usuario_fecha_nacimiento: fechaNacimientoRef.current?.value,
        perfil: {
          alumno_telefono_apoderado: telefonoApoderadoRef.current?.value,
          alumno_alergias: alergiasRef.current?.value,
          alumno_direccion: direccionRef.current?.value,
          alumno_nombre_apoderado: nombreApoderadoRef.current?.value,
          alumno_observaciones_profesor: observacionesRef.current?.value,
        }
      };
    }
    
    onSave(dataToSave, mode);
  };

  const isViewMode = mode === 'view';
  const title = { view: 'Detalles del Alumno', edit: 'Editar Alumno', add: 'Añadir Nuevo Alumno' }[mode];

  const FormInput = ({ label, name, type = "text", defaultValue, inputRef, required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input ref={inputRef} type={type} name={name} defaultValue={defaultValue || ''} placeholder={label} className="mt-1 block w-full px-3 py-2 border rounded-md" required={required} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={28} /></button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {isViewMode ? (
            <div className="space-y-3">
              <p><strong>Usuario:</strong> {alumno?.username}</p>
              <p><strong>Nombre:</strong> {alumno?.usuario_nombre_completo}</p>
              <p><strong>Email:</strong> {alumno?.usuario_email}</p>
              <p><strong>Tel. Apoderado:</strong> {alumno?.perfil?.alumno_telefono_apoderado}</p>
              <p><strong>Alergias:</strong> {alumno?.perfil?.alumno_alergias || 'No especificado'}</p>
            </div>
          ) : (
            <>
              <FormInput label="RUT" name="usuario_rut" inputRef={rutRef} defaultValue={alumno?.usuario_rut} required />
              <FormInput label="Nombre de Usuario" name="username" inputRef={usernameRef} defaultValue={alumno?.username} required />
              <FormInput label="Nombre Completo" name="usuario_nombre_completo" inputRef={nombreCompletoRef} defaultValue={alumno?.usuario_nombre_completo} required />
              <FormInput label="Email" name="usuario_email" type="email" inputRef={emailRef} defaultValue={alumno?.usuario_email} required />
              <FormInput label="Fecha de Nacimiento" name="usuario_fecha_nacimiento" type="date" inputRef={fechaNacimientoRef} defaultValue={alumno?.usuario_fecha_nacimiento} required />
              
              {mode === 'add' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Clase</label>
                    <input type="text" value={profesorClase?.clase_nombre || 'Asignada por el sistema'} className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md" disabled />
                  </div>
                  <FormInput label="Contraseña" name="password" type="password" inputRef={passwordRef} required />
                  <FormInput label="Confirmar Contraseña" name="password2" type="password" inputRef={password2Ref} required />
                </>
              )}
              
              {mode === 'edit' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-700 pt-4 border-t mt-4">Datos Adicionales</h3>
                  <FormInput label="Teléfono Apoderado" name="alumno_telefono_apoderado" inputRef={telefonoApoderadoRef} defaultValue={alumno?.perfil?.alumno_telefono_apoderado} />
                  <FormInput label="Nombre Apoderado" name="alumno_nombre_apoderado" inputRef={nombreApoderadoRef} defaultValue={alumno?.perfil?.alumno_nombre_apoderado} />
                  <FormInput label="Dirección" name="alumno_direccion" inputRef={direccionRef} defaultValue={alumno?.perfil?.alumno_direccion} />
                  <FormInput label="Alergias" name="alumno_alergias" inputRef={alergiasRef} defaultValue={alumno?.perfil?.alumno_alergias} />
                  <FormInput label="Observaciones" name="alumno_observaciones_profesor" inputRef={observacionesRef} defaultValue={alumno?.perfil?.alumno_observaciones_profesor} />
                </>
              )}
            </>
          )}
          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg">{isViewMode ? 'Cerrar' : 'Cancelar'}</button>
            {!isViewMode && <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal de la página
export default function AlumnosPage({ makeAuthenticatedRequest }) {
  const [alumnos, setAlumnos] = useState([]);
  const [perfilProfesor, setPerfilProfesor] = useState({ rol: '', es_jefe: false, clase_info: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedAlumno, setSelectedAlumno] = useState(null);

  const fetchAlumnos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/alumnos-clase/`);
      if (!response.ok) throw new Error('No se pudo obtener la lista de alumnos.');
      const data = await response.json();
      setAlumnos(data.alumnos || []);
      setPerfilProfesor(data.perfil_profesor || { rol: '', es_jefe: false, clase_info: null });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);

  const handleOpenModal = (mode, alumno = null) => {
    setModalMode(mode);
    setSelectedAlumno(alumno);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlumno(null);
  };

  const handleSaveAlumno = async (data, mode) => {
    const isAdding = mode === 'add';
    const url = isAdding 
        ? `${import.meta.env.VITE_API_URL}/crear-alumno/` 
        : `${import.meta.env.VITE_API_URL}/editar-alumno/${data.id}/`;
    const method = isAdding ? 'POST' : 'PATCH';

    try {
      const response = await makeAuthenticatedRequest(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.entries(errorData).map(([key, value]) => `${key}: ${value}`).join('\n');
        throw new Error(errorMessage || 'Falló la operación.');
      }
      
      Swal.fire('¡Éxito!', `Alumno ${isAdding ? 'añadido' : 'actualizado'} correctamente.`, 'success');
      handleCloseModal();
      fetchAlumnos();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: err.message,
      });
    }
  };

  const handleDeleteAlumno = (alumno) => {
    Swal.fire({
      title: `¿Eliminar a ${alumno.usuario_nombre_completo}?`,
      text: "Esta acción no se puede revertir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/eliminar-alumno/${alumno.id}/`, {
            method: 'DELETE',
          });
          if (response.status !== 204) throw new Error('No se pudo eliminar al alumno.');
          
          Swal.fire('¡Eliminado!', 'El alumno ha sido eliminado.', 'success');
          fetchAlumnos();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  const filteredAlumnos = alumnos.filter(alumno =>
    (alumno.usuario_nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alumno.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const canManage = perfilProfesor.es_jefe || perfilProfesor.rol === 'profesor_jefe' || perfilProfesor.rol === 'superadmin';

  return (
    <div className="min-h-screen bg-gray-50 pt-24 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-green-800 mb-3 animate__animated animate__fadeInDown">Gestión Alumnos</h1>
          <p className="text-lg text-gray-500 mt-2">Administra la lista de alumnos de tu clase.</p>
        </header>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <input type="text" placeholder="Buscar por nombre o usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 border rounded-lg w-full sm:w-auto" />
          {canManage && (
            <button onClick={() => handleOpenModal('add')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
              <Plus size={20} /> Añadir Alumno
            </button>
          )}
        </div>

        {isLoading && <p className="text-center">Cargando alumnos...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        
        {!isLoading && !error && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="space-y-2 p-4">
              {filteredAlumnos.length > 0 ? filteredAlumnos.map(alumno => (
                <div key={alumno.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-100 group">
                  <div className="flex items-center gap-4">
                    <img src={`/images/avatars/${alumno.usuario_avatar || 'default.png'}`} alt="Avatar" className="w-12 h-12 rounded-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/100x100/cccccc/000000?text=A"; }} />
                    <div>
                      <p className="font-bold text-gray-800">{alumno.usuario_nombre_completo}</p>
                      <p className="text-sm text-gray-500">@{alumno.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => handleOpenModal('view', alumno)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full"><Eye size={20} /></button>
                    {canManage && (
                      <>
                        <button onClick={() => handleOpenModal('edit', alumno)} className="p-2 text-gray-500 hover:text-green-600 rounded-full"><Edit size={20} /></button>
                        <button onClick={() => handleDeleteAlumno(alumno)} className="p-2 text-gray-500 hover:text-red-600 rounded-full"><Trash2 size={20} /></button>
                      </>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-500 p-8">No se encontraron alumnos en esta clase.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <AlumnoModal
        key={selectedAlumno?.id || 'add-new'}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        alumno={selectedAlumno}
        onSave={handleSaveAlumno}
        profesorClase={perfilProfesor.clase_info}
      />
    </div>
  );
}
