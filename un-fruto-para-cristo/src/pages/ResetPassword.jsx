import React, { useState } from 'react';
import 'animate.css/animate.min.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaSeedling } from 'react-icons/fa'; // Importa el icono para el fruto
import '../pages_css/ResetPassword.css';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para el botón de carga
  const navigate = useNavigate();

  // Componente de Input con Floating Label (reutilizado)
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

  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Activa el estado de carga

    try {
      // Simular una llamada a tu backend para la recuperación de contraseña
      // Asegúrate de que tu backend tenga un endpoint para esto, por ejemplo: /auth/reset-password/
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/auth/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
      });

      const data = await response.json(); // Siempre parsea la respuesta JSON

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Correo de recuperación enviado!',
          text: 'Revisa tu bandeja de entrada para instrucciones.',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          navigate('/'); // Redirige al login
        });
      } else {
        let errorMessage = 'Ocurrió un error al enviar el correo de recuperación.';
        if (data && data.detail) {
          errorMessage = data.detail;
        } else if (data && data.email) {
          errorMessage = `Correo electrónico: ${data.email.join(', ')}`;
        } else if (data) {
          errorMessage = JSON.stringify(data);
        }

        Swal.fire({
          icon: 'error',
          title: 'Ocurrió un error',
          text: errorMessage,
          confirmButtonText: 'Aceptar',
        });
      }
    } catch (error) {
      console.error('Error de red o parseo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setIsLoading(false); // Desactiva el estado de carga
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
          <h1 className="text-3xl sm:text-4xl reset-title">
            Recuperar Contraseña
          </h1>
          <form onSubmit={handleReset} className="w-full flex flex-col items-center">
            <FloatingLabelInput
              id="email"
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isLoading} // Deshabilita el botón mientras carga
              className="reset-button"
            >
              {isLoading ? 'Enviando...' : 'Enviar correo de recuperación'}
            </button>
          </form>

          <div className="text-center text-sm space-y-2 mt-6">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => navigate('/')}
                className="action-link-button"
              >
                Inicia sesión
              </button>
            </p>
            <p>
              ¿Aún no tienes cuenta?{' '}
              <button
                onClick={() => navigate('/registro')}
                className="action-link-button"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;
