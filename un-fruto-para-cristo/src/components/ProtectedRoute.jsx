// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ requiredRole }) {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_rol');

  if (!token) return <Navigate to="/" />;

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/home" />; // o a otra ruta de "no autorizado"
  }

  return <Outlet />;
}

export default ProtectedRoute;
