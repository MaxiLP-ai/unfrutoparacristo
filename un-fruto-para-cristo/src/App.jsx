import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPassword from './pages/ResetPassword';
import ProfilePage from './pages/ProfilePage';
import TreePage from './pages/TreePage';
import ControlPanelPage from './pages/ControlPanel';
import AlumnosPage from './pages/AlumnosPage';
import HomePage from './pages/Home';
import PetScreen from './pages/PetScreen';
import Navbar from './components/Navbar';
import Swal from 'sweetalert2';

function App() {
  const [user, setUser] = useState(null);

  const handleSetUser = useCallback((token, rol) => {
    setUser({ token, rol });
    console.log('App.js: Usuario establecido:', { token, rol });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_rol');
    setUser(null);
    console.log('App.js: Sesión cerrada.');
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      handleLogout();
      return null;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        setUser(prev => ({ ...prev, token: data.access }));
        return data.access;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Sesión Expirada',
          text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
          confirmButtonColor: '#d33',
        }).then(() => handleLogout());
        return null;
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'No se pudo refrescar la sesión.',
        confirmButtonColor: '#d33',
      });
      handleLogout();
      return null;
    }
  }, [handleLogout]);

  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    let currentAccessToken = localStorage.getItem('access_token');
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentAccessToken}`,
    };

    let response = await fetch(url, options);

    if (response.status === 401 && !options._retry) {
      options._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        options.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return fetch(url, options);
      } else {
        return response;
      }
    }

    return response;
  }, [refreshAccessToken]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const rol = localStorage.getItem('user_rol');
    if (token && rol) {
      setUser({ token, rol });
    }
  }, []);

  const getRedirectPath = useCallback(() => {
    if (!user) return '/';
    if (['profesor', 'profesor_jefe', 'profesor_asistente', 'superadmin'].includes(user.rol)) return '/control-panel';
    if (user.rol === 'alumno') return '/home';
    return '/home';
  }, [user]);

  // Helpers de acceso
  const isAlumno = user?.rol === 'alumno';
  const isProfesor = ['profesor', 'profesor_jefe', 'profesor_asistente'].includes(user?.rol);
  const isSuperAdmin = user?.rol === 'superadmin';

  return (
    <>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={user ? <Navigate to={getRedirectPath()} /> : <LoginPage setUser={handleSetUser} />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route
          path="/home"
          element={user ? <HomePage user={user} makeAuthenticatedRequest={makeAuthenticatedRequest} /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={user ? <ProfilePage user={user} onLogout={handleLogout} makeAuthenticatedRequest={makeAuthenticatedRequest} /> : <Navigate to="/" />}
        />
        <Route
          path="/tree"
          element={isAlumno || isSuperAdmin ? <TreePage user={user} makeAuthenticatedRequest={makeAuthenticatedRequest} /> : <Navigate to="/" />}
        />
        <Route
          path="/pet-screen"
          element={isAlumno || isSuperAdmin ? <PetScreen user={user} makeAuthenticatedRequest={makeAuthenticatedRequest} /> : <Navigate to="/" />}
        />
        <Route
          path="/control-panel"
          element={(isProfesor || isSuperAdmin) ? <ControlPanelPage user={user} makeAuthenticatedRequest={makeAuthenticatedRequest} /> : <Navigate to="/" />}
        />
        <Route
          path="/alumnos"
          element={(isProfesor || isSuperAdmin) ? <AlumnosPage user={user} makeAuthenticatedRequest={makeAuthenticatedRequest} /> : <Navigate to="/" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
