import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaTree, FaUserCircle, FaBars, FaTimes, FaPaw, FaList, FaGamepad, FaStore } from 'react-icons/fa'; // Importa los íconos, ¡añadido FaPaw!




// Navbar ahora recibe el objeto user (con token y rol), pero NO onLogout
const Navbar = ({ user }) => { // onLogout eliminado de las props
  const [isOpen, setIsOpen] = useState(false);
  const userRol = user?.rol?.toLowerCase();
  const isProfesor =
    ['profesor', 'profesor_jefe', 'profesor_asistente', 'superadmin'].includes(userRol);

  const isAlumno =
    ['alumno', 'superadmin'].includes(userRol);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-500 text-white shadow-lg fixed w-full z-50 top-0 border-b-4 border-indigo-600"> {/* Añadido fixed, w-full, z-50, top-0 */}
      <div className=" max-w-7xl mx-auto px-2 sm:px-6 lg:apx-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Icono de menú hamburguesa (visible en móvil) */}
          <div className="absolute inset-y-0 right-0 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none hover:scale-110 active:scale-90 transition-transform duration-200"
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
            </button>
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex-shrink-0">
              {/* Enlace principal que redirige según el rol (si está logeado) */}
              {/* Cambiado a /home por defecto para alumnos, y movido el comentario */}
              <Link
                to={user && user.rol === 'profesor' ? '/control-panel' : (user ? '/home' : '/')}
                className="text-2xl font-extrabold text-white tracking-wide hover:scale-105 transition-transform duration-200 inline-block filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
              >
                🌳 Frutos Para Cristo
              </Link>
            </div>

            {/* Menú en pantallas grandes */}
            <div className="hidden md:flex items-center">
              {user && user.token && ( // Solo muestra enlaces si hay un token (usuario logeado)
                <div className="flex space-x-4 items-center">
                  {/* Enlaces comunes a ambos roles */}
                  <Link
                    to="/home"
                    className="text-white hover:bg-white hover:text-indigo-600 px-3 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 inline-block"
                  >
                    <FaHome className="inline-block mr-2" /> Inicio
                  </Link>
                  {isAlumno && (
                    <>
                      <Link
                        to="/tree"
                        className="text-white hover:bg-white hover:text-indigo-600 px-3 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 inline-block"
                      >
                        <FaTree className="inline-block mr-2" /> Mi Árbol
                      </Link>
                      {/* NUEVO ENLACE PARA LA MASCOTA */}
                      <Link
                        to="/pet-screen"
                        className="text-white hover:bg-white hover:text-indigo-600 px-3 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 inline-block"
                      >
                        <FaPaw className="inline-block mr-2" /> Mi Mascota
                      </Link>
                      <Link
                        to="/minijuegos"
                        className="text-white hover:bg-white hover:text-indigo-600 px-3 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 inline-block"
                      >
                        <FaGamepad className="inline-block mr-2" /> Minijuegos
                      </Link>
                      <Link
                        to="/tienda"
                        className="text-white hover:bg-white hover:text-indigo-600 px-3 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 inline-block"
                      >
                        <FaStore className="inline-block mr-2" /> Tienda
                      </Link>
                    </>
                  )}
                  {isProfesor && (
                    <Link
                      to="/control-panel"
                      className="text-white hover:bg-white hover:text-indigo-600 px-3 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 inline-block"
                    >
                      <FaHome className="inline-block mr-2" /> Panel de Control
                    </Link>
                  )}
                  {isProfesor && (
                    <Link
                      to="/alumnos"
                      className="text-white hover:bg-white hover:text-indigo-600 px-3 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 inline-block"
                    >
                      <FaList className="inline-block mr-2" /> Lista de Alumnos
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="text-white hover:bg-white hover:text-indigo-600 px-3 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 inline-block"
                  >
                    <FaUserCircle className="inline-block mr-2" /> Perfil
                  </Link>
                  {/* El botón de Cerrar Sesión ha sido movido a ProfilePage */}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menú en pantallas pequeñas (desplegable) */}
        {user && user.token && ( // Solo muestra el menú móvil si hay un token
          <div className={`${isOpen ? "block" : "hidden"} sm:hidden pb-3`}>
            <div className="px-2 pt-2 pb-3 space-y-2">
              <Link
                to="/home"
                className="text-white hover:bg-white hover:text-indigo-600 block px-3 py-2 rounded-xl text-lg font-semibold transition-all duration-200"
                onClick={toggleMenu}
              >
                <FaHome className="inline-block mr-2" /> Inicio
              </Link>
              <Link
                to="/profile"
                className="text-white hover:bg-white hover:text-indigo-600 block px-3 py-2 rounded-xl text-lg font-semibold transition-all duration-200"
                onClick={toggleMenu}
              >
                <FaUserCircle className="inline-block mr-2" /> Perfil
              </Link>
              {isAlumno && (
                <>
                  <Link
                    to="/tree"
                    className="text-white hover:bg-white hover:text-indigo-600 block px-3 py-2 rounded-xl text-lg font-semibold transition-all duration-200"
                    onClick={toggleMenu}
                  >
                    <FaTree className="inline-block mr-2" /> Mi Árbol
                  </Link>
                  {/* NUEVO ENLACE PARA LA MASCOTA */}
                  <Link
                    to="/pet-screen"
                    className="text-white hover:bg-white hover:text-indigo-600 block px-3 py-2 rounded-xl text-lg font-semibold transition-all duration-200"
                    onClick={toggleMenu}
                  >
                    <FaPaw className="inline-block mr-2" /> Mi Mascota
                  </Link>
                  <Link
                    to="/minijuegos"
                    className="text-white hover:bg-white hover:text-indigo-600 block px-3 py-2 rounded-xl text-lg font-semibold transition-all duration-200"
                    onClick={toggleMenu}
                  >
                    <FaGamepad className="inline-block mr-2" /> Minijuegos
                  </Link>
                  <Link
                    to="/tienda"
                    className="text-white hover:bg-white hover:text-indigo-600 block px-3 py-2 rounded-xl text-lg font-semibold transition-all duration-200"
                    onClick={toggleMenu}
                  >
                    <FaStore className="inline-block mr-2" /> Tienda
                  </Link>
                </>
              )}
              {isProfesor && (
                <Link
                  to="/control-panel"
                  className="text-white hover:bg-white hover:text-indigo-600 block px-3 py-2 rounded-xl text-lg font-semibold transition-all duration-200"
                  onClick={toggleMenu}
                >
                  <FaHome className="inline-block mr-2" /> Panel de Control
                </Link>
              )}
              {isProfesor && (
                <Link
                  to="/alumnos"
                  className="text-white hover:bg-white hover:text-indigo-600 block px-3 py-2 rounded-xl text-lg font-semibold transition-all duration-200"
                  onClick={toggleMenu}
                >
                  <FaHome className="inline-block mr-2" /> Alumnos
                </Link>
              )}
              {/* El botón de Cerrar Sesión ha sido movido a ProfilePage */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
