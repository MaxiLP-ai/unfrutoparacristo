import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaTree, FaUserCircle, FaBars, FaTimes, FaPaw, FaList } from 'react-icons/fa'; // Importa los íconos, ¡añadido FaPaw!




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
    <nav className="bg-gray-800 text-white shadow-md fixed w-full z-50 top-0"> {/* Añadido fixed, w-full, z-50, top-0 */}
      <div className=" max-w-7xl mx-auto px-2 sm:px-6 lg:apx-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Icono de menú hamburguesa (visible en móvil) */}
          <div className="absolute inset-y-0 right-0 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none"
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
                className="text-2xl font-bold text-blue-500 hover:text-blue-300"
              >
                Frutos Para Cristo
              </Link>
            </div>

            {/* Menú en pantallas grandes */}
            <div className="hidden md:flex items-center">
              {user && user.token && ( // Solo muestra enlaces si hay un token (usuario logeado)
                <div className="flex space-x-4 items-center">
                  {/* Enlaces comunes a ambos roles */}
                  <Link
                    to="/home"
                    className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                  >
                    <FaHome className="inline-block mr-2" /> Inicio
                  </Link>
                  {isAlumno && (
                    <>
                      <Link
                        to="/tree"
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                      >
                        <FaTree className="inline-block mr-2" /> Mi Árbol
                      </Link>
                      {/* NUEVO ENLACE PARA LA MASCOTA */}
                      <Link
                        to="/pet-screen"
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                      >
                        <FaPaw className="inline-block mr-2" /> Mi Mascota
                      </Link>
                    </>
                  )}
                  {isProfesor && (
                    <Link
                      to="/control-panel"
                      className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                    >
                      <FaHome className="inline-block mr-2" /> Panel de Control
                    </Link>
                  )}
                  {isProfesor && (
                    <Link
                      to="/alumnos"
                      className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                    >
                      <FaList className="inline-block mr-2" /> Lista de Alumnos
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-lg font-medium transition duration-300"
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
          <div className={`${isOpen ? "block" : "hidden"} sm:hidden`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/home"
                className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                onClick={toggleMenu}
              >
                <FaHome className="inline-block mr-2" /> Inicio
              </Link>
              <Link
                to="/profile"
                className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                onClick={toggleMenu}
              >
                <FaUserCircle className="inline-block mr-2" /> Perfil
              </Link>
              {isAlumno && (
                <>
                  <Link
                    to="/tree"
                    className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                    onClick={toggleMenu}
                  >
                    <FaTree className="inline-block mr-2" /> Mi Árbol
                  </Link>
                  {/* NUEVO ENLACE PARA LA MASCOTA */}
                  <Link
                    to="/pet-screen"
                    className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                    onClick={toggleMenu}
                  >
                    <FaPaw className="inline-block mr-2" /> Mi Mascota
                  </Link>
                </>
              )}
              {isProfesor && (
                <Link
                  to="/control-panel"
                  className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-lg font-medium transition duration-300"
                  onClick={toggleMenu}
                >
                  <FaHome className="inline-block mr-2" /> Panel de Control
                </Link>
              )}
              {isProfesor && (
                <Link
                  to="/alumnos"
                  className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-lg font-medium transition duration-300"
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
