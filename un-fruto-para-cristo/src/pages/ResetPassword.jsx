import React, { useState } from 'react';
import 'animate.css/animate.min.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaSeedling } from 'react-icons/fa';
import '../pages_css/ResetPassword.css';

// --- CORRECCIÓN: Componente movido fuera del componente principal ---
// Al estar aquí, React lo trata como un componente reutilizable y no lo destruye en cada render.
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
                placeholder=" "
            />
            <label htmlFor={id} className={`floating-label ${isFilled ? 'active' : ''}`}>
                {label} {required && '*'}
            </label>
        </div>
    );
};

function ResetPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!email || !email.includes('@')) {
            Swal.fire({
                icon: 'warning',
                title: 'Correo no válido',
                text: 'Ingresa un correo electrónico válido.',
            });
            setIsLoading(false);
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/auth/enviar-reset/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email }),
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Correo de recuperación enviado!',
                    text: 'Revisa tu bandeja de entrada para instrucciones.',
                    confirmButtonText: 'Aceptar',
                }).then(() => {
                    navigate('/');
                });
            } else {
                let errorMessage = 'Ocurrió un error al enviar el correo.';
                if (data && data.detail) {
                    errorMessage = data.detail;
                } else if (data && data.email) {
                    errorMessage = `Correo electrónico: ${data.email.join(', ')}`;
                } else if (data) {
                    errorMessage = JSON.stringify(data);
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage,
                    confirmButtonText: 'Aceptar',
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Inténtalo más tarde.',
                confirmButtonText: 'Aceptar',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

            <div className="register-background">
                <div className="floating-element"></div>
                <div className="floating-element"></div>
                <div className="floating-element"></div>
                <div className="floating-element"></div>
                <div className="floating-element"></div>

                <div className="fruit-logo-container">
                    <FaSeedling className="fruit-icon" />
                    <span className="fruit-title">Un Fruto para Cristo</span>
                </div>

                <div className="form-content-wrapper">
                    <h1 className="text-3xl sm:text-4xl reset-title">Recuperar Contraseña</h1>
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
                            disabled={isLoading}
                            className="reset-button"
                        >
                            {isLoading ? 'Enviando...' : 'Enviar correo de recuperación'}
                        </button>
                    </form>

                    <div className="text-center text-sm space-y-2 mt-6">
                        <p>
                            ¿Ya tienes una cuenta?{' '}
                            <button onClick={() => navigate('/')} className="action-link-button">
                                Inicia sesión
                            </button>
                        </p>
                        <p>
                            ¿Aún no tienes cuenta?{' '}
                            <button onClick={() => navigate('/registro')} className="action-link-button">
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
