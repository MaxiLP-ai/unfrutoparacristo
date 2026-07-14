import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, FaTree, FaUserCircle, FaBars, FaTimes, FaPaw, 
  FaGamepad, FaStore, FaCog, FaChartBar, FaSignOutAlt 
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function Sidebar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const userRol = user?.rol?.toLowerCase();

  const menuItems = [
    { label: 'Inicio', path: '/home', icon: <FaHome /> },
    { label: 'Mi Mascota', path: '/pet-screen', icon: <FaPaw /> },
    { label: 'Mi Árbol', path: '/tree', icon: <FaTree /> },
    { label: 'Minijuegos', path: '/minijuegos', icon: <FaGamepad /> },
    { label: 'Tienda', path: '/tienda', icon: <FaStore /> },
    { label: 'Panel de Control', path: '/control-panel', icon: <FaChartBar /> },
    { label: 'Ajustes Globales', path: '/admin-settings', icon: <FaCog /> },
    { label: 'Mi Perfil', path: '/profile', icon: <FaUserCircle /> },
  ];

  const handleLogoutClick = () => {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: "¿Quieres salir del panel de administración?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
        Swal.fire('¡Sesión Cerrada!', 'Has salido correctamente.', 'success');
      }
    });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Botón Flotante para Móviles */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-indigo-500 text-white border-3 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1e293b] transition-all"
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Backdrop en Móviles */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950 bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white border-r-4 border-slate-900 z-40 transform transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col justify-between p-6 pt-20 lg:pt-8`}>
        
        {/* Cabecera Sidebar */}
        <div>
          <div className="mb-8 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-yellow-300 drop-shadow-[2px_2px_0px_rgba(30,41,59,1)]">
              👑 UFPC Admin
            </h2>
            <p className="text-[10px] font-black text-indigo-150 uppercase tracking-widest mt-1 bg-indigo-600/40 py-1 px-3 border border-indigo-400/20 rounded-full inline-block">
              Super Administrador
            </p>
          </div>

          {/* Menú de Enlaces */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-3 font-bold text-sm transition-all duration-200 ${
                    active 
                      ? 'bg-yellow-300 text-slate-900 border-slate-900 shadow-[3px_3px_0px_0px_#1e293b] translate-x-1' 
                      : 'bg-indigo-600/30 text-indigo-50 border-transparent hover:bg-indigo-600/60 hover:translate-x-1'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Botón Cerrar Sesión */}
        <button
          onClick={handleLogoutClick}
          className="flex items-center justify-center gap-3 w-full py-3 bg-red-400 text-slate-900 border-3 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] font-black text-sm hover:bg-red-500 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1e293b] transition-all"
        >
          <FaSignOutAlt />
          <span>Cerrar Sesión</span>
        </button>

      </aside>
    </>
  );
}
