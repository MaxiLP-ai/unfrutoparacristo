import React, { useState, useEffect } from 'react';
import 'animate.css/animate.min.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaSeedling } from 'react-icons/fa';
import '../pages_css/LoginPage.css';

// Componente de Input con Floating Label
const FloatingLabelInput = ({ id, label, type = 'text', value, onChange, required = false }) => {
  const isFilled = value !== '' && value !== null;
  return (
    <div className="input-group">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className={`oval-input ${isFilled ? 'filled' : ''}`}
        required={required}
        placeholder=" " // Espacio para activar el floating label
      />
      <label htmlFor={id} className={`floating-label ${isFilled ? 'active' : ''}`}>
        {label} {required && '*'}
      </label>
    </div>
  );
};

function LoginPage({ setUser }) { // Recibe setUser como prop desde App.jsx
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const formatearRut = (rut) => {
    let rutLimpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();

    if (rutLimpio.length < 2) return rut; // demasiado corto

    let cuerpo = rutLimpio.slice(0, -1);
    let dv = rutLimpio.slice(-1);

    if (cuerpo.length === 8) {
      cuerpo = cuerpo.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3');
    } else if (cuerpo.length === 7) {
      cuerpo = cuerpo.replace(/^(\d{1})(\d{3})(\d{3})$/, '$1.$2.$3');
    } else {
      return rut;
    }

    return `${cuerpo}-${dv}`;
  };

  // Redirige si el usuario ya está autenticado (basado en localStorage)
  useEffect(() => {
    const authToken = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('user_rol');

    if (authToken && userRole) {
      console.log("LoginPage useEffect: Usuario ya autenticado, redirigiendo...");
      if (userRole === 'profesor') {
        navigate('/control-panel');
      } else {
        navigate('/tree'); // O '/home' o '/pet-screen' según tu lógica inicial para alumnos
      }
    }
  }, [navigate]); // No depende de authToken aquí para evitar bucles si setUser lo cambia.
                   // La verificación de localStorage es suficiente para el redireccionamiento inicial.

  const handleUsernameChange = (e) => {
    const newValue = e.target.value;
    setUsername(newValue);
  };

  const handlePasswordChange = (e) => {
    const newValue = e.target.value;
    setPassword(newValue);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const rutFormateado = formatearRut(username);
    

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rutFormateado, password: password }),

      });

      const data = await response.json();

      if (response.ok) {
        // CORRECCIÓN CLAVE: Desestructurar 'usuario_rol' en lugar de 'rol'
        const { access, refresh, usuario_rol } = data; 
        
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user_rol', usuario_rol); // Usar usuario_rol aquí
        
        setUser(access, usuario_rol); // Llama a la función setUser de App.jsx con usuario_rol
        
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: `Has iniciado sesión correctamente como ${usuario_rol}.`, // Usar usuario_rol aquí
          confirmButtonColor: '#3085d6',
        }).then(() => {
          if (usuario_rol === 'profesor') { // Usar usuario_rol aquí
            navigate('/control-panel');
          } else {
            navigate('/home'); // O a la ruta inicial para alumnos
          }
        });
      } else {
        let errorMessage = 'Credenciales inválidas. Intenta de nuevo.';
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.username) {
          errorMessage = `Usuario: ${data.username.join(', ')}`;
        } else if (data.password) {
          errorMessage = `Contraseña: ${data.password.join(', ')}`;
        } else if (data.non_field_errors) {
          errorMessage = data.non_field_errors.join(', ');
        } else {
          errorMessage = JSON.stringify(data);
        }
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: errorMessage,
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Intenta de nuevo más tarde.',
        confirmButtonColor: '#d33',
      });
      console.error('Error de red o parseo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Enlace a Google Fonts para 'Poppins' */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="register-background">
        {/* Elementos flotantes decorativos */}
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>

        {/* Contenedor del icono y el título */}
        <div className="fruit-logo-container">
          <FaSeedling className="fruit-icon" />
          <span className="fruit-title">Un Fruto para Cristo</span>
        </div>

        {/* Nuevo contenedor para el contenido del formulario */}
        <div className="form-content-wrapper">
          <h1 className="text-3xl sm:text-4xl login-title">
            Iniciar Sesión
          </h1>
          <form onSubmit={handleLogin} className="w-full flex flex-col items-center">
            <FloatingLabelInput
              id="username"
              label="Nombre de usuario"
              type="text"
              value={username}
              onChange={handleUsernameChange} // Usa el nuevo handler
              required
            />
            <FloatingLabelInput
              id="password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={handlePasswordChange} // Usa el nuevo handler
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="text-center text-sm space-y-2 mt-6">
            <p>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => navigate('/registro')}
                className="action-link-button"
              >
                Regístrate
              </button>
            </p>
            <p>
              ¿Olvidaste tu contraseña?{' '}
              <button
                onClick={() => navigate('/reset-password')}
                className="action-link-button"
              >
                Recupérala aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
