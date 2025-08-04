import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaSeedling } from 'react-icons/fa';
import '../pages_css/ResetPassword.css';

// Componente reutilizable
const FloatingLabelInput = ({ id, label, type = 'text', value, onChange, required = false }) => {
    const isFilled = value !== '';
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

export default function ResetPasswordConfirmPage() {
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { uidb64, token } = useParams(); // ← recogemos uid y token

    const handleConfirmReset = async (e) => {
        e.preventDefault();

        if (password !== password2) {
            Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/auth/confirmar-reset/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: uidb64,
                    token: token,
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Contraseña actualizada!',
                    text: 'Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión.',
                }).then(() => {
                    navigate('/');
                });
            } else {
                let errorMsg = 'El enlace de recuperación no es válido o ha expirado.';
                if (data && typeof data === 'object') {
                    errorMsg = Object.values(data).flat().join(' ');
                }
                throw new Error(errorMsg);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Ocurrió un error',
                text: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
                rel="stylesheet"
            />
            <div className="register-background">
                <div className="fruit-logo-container">
                    <FaSeedling className="fruit-icon" />
                    <span className="fruit-title">Un Fruto para Cristo</span>
                </div>
                <div className="form-content-wrapper">
                    <h1 className="text-3xl sm:text-4xl reset-title">
                        Establecer Nueva Contraseña
                    </h1>
                    <form onSubmit={handleConfirmReset} className="w-full flex flex-col items-center">
                        <FloatingLabelInput
                            id="password"
                            label="Nueva Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <FloatingLabelInput
                            id="password2"
                            label="Confirmar Nueva Contraseña"
                            type="password"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="reset-button"
                        >
                            {isLoading ? 'Guardando...' : 'Guardar Contraseña'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
