import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'animate.css/animate.min.css';
import Swal from 'sweetalert2';
import { FaSeedling, FaArrowRight, FaArrowLeft, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import '../pages_css/RegisterPage.css';

// --- FUNCIONES DE AYUDA PARA EL RUT CHILENO ---
const cleanRut = (rut) => typeof rut === 'string' ? rut.replace(/[^0-9kK]/g, '').toUpperCase() : '';

const validateRutDigit = (rut) => {
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
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  return dv === dvCalculado;
};

const formatRut = (rut) => {
  const rutLimpio = cleanRut(rut);
  if (!rutLimpio) return '';
  const body = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  let bodyFormateado = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return `${bodyFormateado}-${dv}`;
};
// --- FIN DE FUNCIONES DE AYUDA ---

const FloatingLabelInput = ({ id, label, type = 'text', value, onChange, required = false, isSelect = false, options = [] }) => {
    const isFilled = value !== '' && value !== null && value !== undefined;
    const isDateInput = type === 'date';
    const isSelectActive = isSelect && (value !== '' || options.length > 1);

    return (
        <div className="input-group">
            {isSelect ? (
                <select id={id} name={id} value={value} onChange={onChange} className={`oval-input oval-select ${isFilled ? 'filled' : ''}`} required={required}>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            ) : (
                <input id={id} name={id} type={type} value={value} onChange={onChange} className={`oval-input ${isFilled ? 'filled' : ''}`} required={required} placeholder={isDateInput ? '' : ' '} />
            )}
            <label htmlFor={id} className={`floating-label ${isFilled || isDateInput || isSelectActive ? 'active' : ''}`}>{label} {required && '*'}</label>
        </div>
    );
};

const ProfesorKeyModal = ({ show, onClose, onSubmit, value, onChange }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate__animated animate__fadeIn">
            <div className="bg-white p-6 rounded-lg shadow-xl animate__animated animate__zoomIn max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-blue-800">Ingresar Clave de Profesor</h2>
                <FloatingLabelInput id="profesorKey" label="Clave Secreta" type="password" value={value} onChange={onChange} required />
                <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={onClose} className="back-button">Cancelar</button>
                    <button type="button" onClick={onSubmit} className="register-button">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

// Hook personalizado para validación con debounce
const useDebouncedValidation = (value, validationFn) => {
    const [status, setStatus] = useState('idle'); // idle, validating, valid, invalid
    const [error, setError] = useState('');

    useEffect(() => {
        if (!value) {
            setStatus('idle');
            setError('');
            return;
        }

        const handler = setTimeout(async () => {
            setStatus('validating');
            setError('');
            await validationFn(value, setStatus, setError);
        }, 500); // 500ms de espera

        return () => clearTimeout(handler);
    }, [value, validationFn]);

    return [status, error];
};


export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        usuario_email: '',
        password: '',
        password2: '',
        usuario_rut: '',
        usuario_nombre_completo: '',
        usuario_clase_actual: '',
        usuario_fecha_nacimiento: '',
        usuario_telefono: '',
        codigo_invitacion_usado: '',
    });
    
    const [tipoUsuario, setTipoUsuario] = useState('alumno');
    const [showProfesorKeyModal, setShowProfesorKeyModal] = useState(false);
    const [profesorKeyInput, setProfesorKeyInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [clasesDisponibles, setClasesDisponibles] = useState([]);
    
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const PROFESOR_SECRET_KEY = import.meta.env.VITE_PROFESOR_SECRET_KEY;

    // --- LÓGICA DE VALIDACIÓN ---
    const validateAndCheckApi = useCallback(async (endpoint, value, paramName, setStatus, setError, existsMsg) => {
        try {
            // CORRECCIÓN: El nombre del parámetro ahora es dinámico
            const response = await fetch(`${API_URL}${endpoint}?${paramName}=${encodeURIComponent(value)}`);
            const data = await response.json();
            if (data.existe) {
                setStatus('invalid');
                setError(existsMsg);
            } else {
                setStatus('valid');
                setError('');
            }
        } catch {
            setStatus('invalid');
            setError('Error de red al validar.');
        }
    }, [API_URL]);

    const rutValidationFn = useCallback(async (value, setStatus, setError) => {
        if (!validateRutDigit(value)) {
            setStatus('invalid');
            setError('El RUT no es válido.');
            return;
        }
        // CORRECCIÓN: Se pasa 'rut' como nombre del parámetro
        await validateAndCheckApi('/usuarios/validar-rut/', formatRut(value), 'rut', setStatus, setError, 'Este RUT ya está registrado.');
    }, [validateAndCheckApi]);

    const usernameValidationFn = useCallback(async (value, setStatus, setError) => {
        if (value.length < 3) {
            setStatus('invalid');
            setError('Debe tener al menos 3 caracteres.');
            return;
        }
        // CORRECCIÓN: Se pasa 'value' como nombre del parámetro
        await validateAndCheckApi('/usuarios/validar-username/', value, 'value', setStatus, setError, 'Este usuario ya existe.');
    }, [validateAndCheckApi]);

    const emailValidationFn = useCallback(async (value, setStatus, setError) => {
        if (!/\S+@\S+\.\S+/.test(value)) {
            setStatus('invalid');
            setError('Formato de email no válido.');
            return;
        }
        // CORRECCIÓN: Se pasa 'value' como nombre del parámetro
        await validateAndCheckApi('/usuarios/validar-email/', value, 'value', setStatus, setError, 'Este email ya está en uso.');
    }, [validateAndCheckApi]);

    const [rutStatus, rutError] = useDebouncedValidation(formData.usuario_rut, rutValidationFn);
    const [usernameStatus, usernameError] = useDebouncedValidation(formData.username, usernameValidationFn);
    const [emailStatus, emailError] = useDebouncedValidation(formData.usuario_email, emailValidationFn);

    // Cargar clases
    useEffect(() => { 
        const fetchClases = async () => {
            try {
                const response = await fetch(`${API_URL}/clases/`);
                if (!response.ok) throw new Error('No se pudieron cargar las clases');
                const data = await response.json();
                const formattedClases = [{ value: '', label: 'Selecciona una clase' }, ...data.map(clase => ({
                    value: clase.clase_id,
                    label: clase.clase_nombre
                }))];
                setClasesDisponibles(formattedClases);
            } catch (error) {
                console.error("Error al cargar clases:", error);
                Swal.fire('Error de carga', 'No se pudieron cargar las clases disponibles.', 'error');
            }
        };
        fetchClases();
     }, [API_URL]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleRutChange = useCallback((e) => {
        const formatted = formatRut(e.target.value);
        setFormData(prev => ({ ...prev, usuario_rut: formatted }));
    }, []);

    const handleNextStep = useCallback(() => {
        if (currentStep === 1) {
            if (rutStatus === 'valid') setCurrentStep(2);
            else Swal.fire({ icon: 'error', title: 'RUT Inválido', text: 'Por favor, corrige el RUT para continuar.' });
        } else if (currentStep === 2) {
            const { username, password, password2, usuario_email } = formData;
            if (!username || !password || !password2 || !usuario_email) {
                Swal.fire({ icon: 'error', title: 'Campos obligatorios', text: 'Por favor, completa todos los campos obligatorios.' }); return;
            }
            if (password !== password2) {
                Swal.fire({ icon: 'error', title: 'Contraseñas no coinciden', text: 'Las contraseñas no coinciden.' }); return;
            }
            if (usernameStatus !== 'valid' || emailStatus !== 'valid') {
                Swal.fire({ icon: 'error', title: 'Datos inválidos', text: 'Revisa el usuario y el email antes de continuar.' }); return;
            }
            setCurrentStep(3);
        }
    }, [currentStep, rutStatus, usernameStatus, emailStatus, formData]);

    const handlePreviousStep = useCallback(() => setCurrentStep(prev => prev - 1), []);

    const handleRegister = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const url = tipoUsuario === 'alumno' ? `${API_URL}/registro/alumno/` : `${API_URL}/registro/profesor/`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Registro Exitoso!',
                    text: `¡Felicidades, ${data.username || formData.username}! Tu cuenta ha sido creada.`,
                }).then(() => navigate('/'));
            } else {
                const errorMessage = Object.values(data).flat().join('; ');
                Swal.fire('Error en el registro', errorMessage, 'error');
            }
        } catch (error) {
            Swal.fire('Error de conexión', 'No se pudo conectar con el servidor.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [formData, tipoUsuario, navigate, API_URL]);
    
    const toggleTipoUsuario = useCallback(() => {
        if (tipoUsuario === 'alumno') {
            setShowProfesorKeyModal(true);
        } else {
            setTipoUsuario('alumno');
        }
    }, [tipoUsuario]);

    const handleProfesorKeySubmit = useCallback(() => {
        if (profesorKeyInput === PROFESOR_SECRET_KEY) {
            setTipoUsuario('profesor');
            setShowProfesorKeyModal(false);
        } else {
            Swal.fire('Clave incorrecta', 'No tienes permiso para registrarte como profesor.', 'error');
        }
        setProfesorKeyInput('');
    }, [profesorKeyInput, PROFESOR_SECRET_KEY]);

    const ValidationStatus = ({ status, error }) => {
        if (status === 'validating') return <p className="validating"><FaSpinner className="animate-spin" /> Validando...</p>;
        if (error) return <p className="error"><FaTimesCircle /> {error}</p>;
        if (status === 'valid') return <p className="valid"><FaCheckCircle /> Disponible</p>;
        return <div className="h-5"></div>; // Placeholder para mantener el espacio
    };

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="register-background">
                <div className="fruit-logo-container"><FaSeedling className="fruit-icon" /><span className="fruit-title">Un Fruto para Cristo</span></div>
                <div className="form-content-wrapper">
                    <h1 className="text-3xl sm:text-4xl register-title">Crear Cuenta</h1>
                    
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className={tipoUsuario === 'alumno' ? 'font-bold text-blue-700' : 'text-gray-500'}>Alumno</span>
                        <button type="button" onClick={toggleTipoUsuario} className={`relative inline-flex h-8 w-16 rounded-full border-2 border-blue-400 transition-colors duration-300 focus:outline-none ${tipoUsuario === 'profesor' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${tipoUsuario === 'profesor' ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                        <span className={tipoUsuario === 'profesor' ? 'font-bold text-blue-700' : 'text-gray-500'}>Profesor</span>
                    </div>
                    
                    <form onSubmit={handleRegister} className="w-full flex flex-col items-center">
                        {currentStep === 1 && (
                            <div className="w-full flex flex-col items-center animate__animated animate__fadeIn">
                                <FloatingLabelInput id="usuario_rut" name="usuario_rut" label="RUT" value={formData.usuario_rut} onChange={handleRutChange} required />
                                <div className="rut-status-container"><ValidationStatus status={rutStatus} error={rutError} /></div>
                                <button type="button" onClick={handleNextStep} disabled={rutStatus !== 'valid' || isLoading} className="register-button">Siguiente <FaArrowRight /></button>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="w-full flex flex-col items-center animate__animated animate__fadeIn">
                                <FloatingLabelInput id="username" name="username" label="Nombre de usuario" value={formData.username} onChange={handleChange} required />
                                <div className="rut-status-container"><ValidationStatus status={usernameStatus} error={usernameError} /></div>
                                <FloatingLabelInput id="usuario_email" name="usuario_email" label="Correo electrónico" type="email" value={formData.usuario_email} onChange={handleChange} required />
                                <div className="rut-status-container"><ValidationStatus status={emailStatus} error={emailError} /></div>
                                <FloatingLabelInput id="password" name="password" label="Contraseña" type="password" value={formData.password} onChange={handleChange} required />
                                <FloatingLabelInput id="password2" name="password2" label="Confirmar Contraseña" type="password" value={formData.password2} onChange={handleChange} required />
                                <div className="flex justify-between w-full max-w-[400px] gap-4 mt-4">
                                    <button type="button" onClick={handlePreviousStep} className="back-button flex-1"><FaArrowLeft /> Volver</button>
                                    <button type="button" onClick={handleNextStep} disabled={usernameStatus !== 'valid' || emailStatus !== 'valid' || isLoading} className="register-button flex-1">Siguiente <FaArrowRight /></button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="w-full flex flex-col items-center animate__animated animate__fadeIn">
                                <FloatingLabelInput id="usuario_nombre_completo" name="usuario_nombre_completo" label="Nombre Completo" value={formData.usuario_nombre_completo} onChange={handleChange} />
                                <FloatingLabelInput id="usuario_clase_actual" name="usuario_clase_actual" label="Clase Actual" isSelect={true} options={clasesDisponibles} value={formData.usuario_clase_actual} onChange={handleChange} required />
                                <FloatingLabelInput id="usuario_fecha_nacimiento" name="usuario_fecha_nacimiento" label="Fecha de Nacimiento" type="date" value={formData.usuario_fecha_nacimiento} onChange={handleChange} required />
                                {tipoUsuario === 'alumno' && <FloatingLabelInput id="codigo_invitacion_usado" name="codigo_invitacion_usado" label="Código de Invitación (Opcional)" value={formData.codigo_invitacion_usado} onChange={handleChange} />}
                                <div className="flex justify-between w-full max-w-[400px] gap-4 mt-4">
                                    <button type="button" onClick={handlePreviousStep} className="back-button flex-1"><FaArrowLeft /> Volver</button>
                                    <button type="submit" disabled={isLoading} className="register-button flex-1">{isLoading ? 'Registrando...' : 'Registrarse'}</button>
                                </div>
                            </div>
                        )}
                    </form>
                    <div className="mt-6 text-center">
                        ¿Ya tienes una cuenta?{' '}
                        <button type="button" onClick={() => navigate('/login')} className="login-link-button">Inicia sesión aquí</button>
                    </div>
                </div>
            </div>
            <ProfesorKeyModal show={showProfesorKeyModal} onClose={() => setShowProfesorKeyModal(false)} onSubmit={handleProfesorKeySubmit} value={profesorKeyInput} onChange={(e) => setProfesorKeyInput(e.target.value)} />
        </>
    );
}
