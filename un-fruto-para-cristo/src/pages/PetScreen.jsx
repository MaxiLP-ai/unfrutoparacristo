import React, { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Html } from '@react-three/drei'; // Importa Html para el fallback de carga
import * as THREE from 'three';
import Swal from 'sweetalert2';
import { FaUtensils, FaTint, FaEdit } from 'react-icons/fa'; // Iconos para accioness
import '../pages_css/PetScreen.css';

// Componente para cargar y renderizar el modelo GLTF
const Model = React.memo(({ path, scale, position, rotation, innerRef }) => {
  const gltf = useLoader(GLTFLoader, path, (loader) => {
    // Puedes añadir un callback de progreso aquí si lo deseas
  }, (xhr) => {
    // Callback de progreso
  }, (error) => {
    // Manejo de errores de carga del modelo
    console.error(`Error al cargar el modelo GLTF desde ${path}:`, error);
    Swal.fire({
      icon: 'error',
      title: 'Error de carga de modelo',
      text: `No se pudo cargar la mascota desde: ${path}. Asegúrate de que el archivo exista en la carpeta 'public/models/' y que el nombre sea exacto (sensible a mayúsculas/minúsculas).`,
      confirmButtonColor: '#d33',
    });
  });

  // Iterar a través de la escena y establecer el modo de sombreado en SmoothShading
  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      node.material.flatShading = false; // Asegura sombreado suave
      node.material.needsUpdate = true;
    }
  });
  return <primitive object={gltf.scene} scale={scale} position={position} rotation={rotation} ref={innerRef} />;
});

// Mapeo de códigos de clase a nombres de mascotas y rutas de modelo
const PET_DATA = {
  '3': { // Corresponde a 'Transición Niños(as)'
    name: 'Valentin',
    clase: 'Transición Niños',
    modelPath: '/models/valentin.glb',
    initialScale: 1.2, // Ajustado para que sea más grande
    initialPosition: [0, 0, 0], // Ajustado para que esté más abajo
  },
  '2': { // Corresponde a 'Valientes de David'
    name: 'Leo',
    clase: 'Valientes de David',
    modelPath: '/models/leo.glb',
    initialScale: 1.0,
    initialPosition: [0, 0, 0],
  },
  '1': { // Corresponde a 'Semillas de Amor'
    name: 'Luna',
    clase: 'Semillas de Amor',
    modelPath: '/models/luna.glb',
    initialScale: 1.1, // Ajustado para que sea más grande
    initialPosition: [0, -0.1, 0], // Ajustado para que esté más abajo
  },
  // Fallback o mascota por defecto si la clase no se encuentra
  'default': {
    name: 'Mascota por Defecto',
    modelPath: '/models/valentin.glb', // Puedes elegir un modelo por defecto
    initialScale: 1.0,
    initialPosition: [0, 0, 0],
  }
};

const PetScreen = ({ makeAuthenticatedRequest }) => {
  const [userClass, setUserClass] = useState(null); // Inicialmente nulo, se cargará del backend
  const [petNickname, setPetNickname] = useState('');
  const [hunger, setHunger] = useState(100); // 100% lleno
  const [thirst, setThirst] = useState(100); // 100% hidratado
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const nicknameInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true); // Nuevo estado de carga

  // Obtener datos de la mascota basados en la clase del usuario
  // Usamos 'default' como fallback si userClass es null o no se encuentra
  const currentPet = userClass ? PET_DATA[userClass] || PET_DATA['default'] : PET_DATA['default'];

  // Ref para el modelo 3D de la mascota para posibles animaciones
  const petModelRef = useRef();

  // Función para obtener datos del usuario desde el backend
  const fetchUserData = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Mapear la clase del backend a la clave de PET_DATA
        // Acceder a usuario_clase_actual.clase_id
        const fetchedClass = data.usuario_clase_actual?.clase_id; 
        setUserClass(fetchedClass);

        // Usar los campos de mascota del backend (alumno_pet_nickname, alumno_pet_hunger, alumno_pet_thirst)
        setPetNickname(data.perfil?.mascota_estado?.mascota_estado_sobrenombre ?? PET_DATA[fetchedClass]?.name ?? currentPet.name);

        const hungerValue = data.perfil?.mascota_estado?.mascota_estado_hambre;
        setHunger(hungerValue !== null && hungerValue !== undefined ? Number(hungerValue) : 100);

        const thirstValue = data.perfil?.mascota_estado?.mascota_estado_sed;
        setThirst(thirstValue !== null && thirstValue !== undefined ? Number(thirstValue) : 100);


      } else {
        const errorData = await response.json();
        console.error("Error al obtener datos del usuario:", errorData);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos',
          text: errorData.detail || 'No se pudieron cargar los datos del usuario.',
        });
      }
    } catch (error) {
      console.error("Error de red al obtener datos del usuario:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor para obtener tus datos.',
      });
    } finally {
      setIsLoading(false); // Finaliza la carga
    }
  }, [makeAuthenticatedRequest, currentPet.name]); // currentPet.name como dependencia para el fallback de nickname


  useEffect(() => {
  fetchUserData(); // llamada inicial

  const intervalId = setInterval(() => {
      fetchUserData(); // actualiza datos cada 10 minutos
    }, 10 * 60 * 1000); // 10 minutos en ms

    return () => clearInterval(intervalId); // limpia intervalo cuando el componente se desmonta
  }, [fetchUserData]);


  // Función para alimentar a la mascota
  const handleFeed = useCallback(async () => {
    const newHungerValue = Math.min(100, hunger + 15);
    setHunger(newHungerValue);
    // Actualizar en el backend
    try {
      await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/mascota-estado/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mascota_estado_hambre: newHungerValue }),
      });

      // Mostrar alerta **solo si la actualización fue exitosa**
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `¡${petNickname} está feliz y sin hambre!`,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

    } catch (error) {
      console.error("Error al actualizar hambre en backend:", error);
      Swal.fire('Error', 'No se pudo guardar el cambio de hambre.', 'error');
    }
  }, [hunger, petNickname, makeAuthenticatedRequest]);

  // Función para dar agua a la mascota
  const handleWater = useCallback(async () => {
    const newThirstValue = Math.min(100, thirst + 20);
    setThirst(newThirstValue);

    // Actualizar en el backend
    try {
      await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/mascota-estado/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mascota_estado_sed: newThirstValue }),
      });

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `¡${petNickname} está feliz y sin sed!`,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

    } catch (error) {
      console.error("Error al actualizar sed en backend:", error);
      Swal.fire('Error', 'No se pudo guardar el cambio de sed.', 'error');
    }
  }, [thirst, petNickname, makeAuthenticatedRequest]);

  // Manejar edición de sobrenombre
  const handleEditNickname = () => {
    setIsEditingNickname(true);
    setTimeout(() => {
      if (nicknameInputRef.current) {
        nicknameInputRef.current.focus();
      }
    }, 0);
  };

  const handleSaveNickname = async () => {
    setIsEditingNickname(false);
    // Actualizar en el backend
    try {
      await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/mascota-estado/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mascota_estado_sobrenombre: petNickname }),
      });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `¡Su nuevo apodo es ${petNickname}!`,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

    } catch (error) {
      console.error("Error al actualizar nickname en backend:", error);
      Swal.fire('Error', 'No se pudo guardar el sobrenombre.', 'error');
    }
  };

  const handleNicknameChange = (e) => {
    setPetNickname(e.target.value);
  };

  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100">
        <p className="text-xl text-gray-700">Cargando mascota...</p>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="pet-screen-background">
        {/* Elementos flotantes decorativos */}
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="pet-card">
          <h1 className="pet-title">Mascota de la clase: {userClass ? PET_DATA[userClass]?.clase || 'desconocida' : 'desconocida'}</h1>

          <div className="nickname-section">
            {isEditingNickname ? (
              <input
                ref={nicknameInputRef}
                type="text"
                value={petNickname}
                onChange={handleNicknameChange}
                onBlur={handleSaveNickname}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname(); }}
                className="nickname-input"
                placeholder="Escribe un sobrenombre"
              />
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-white-700">{petNickname}</h2>
                <button onClick={handleEditNickname} className="edit-button">
                  <FaEdit />
                </button>
              </>
            )}
          </div>

          <div className="pet-canvas-container">
            <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
              {/* Luces para iluminar el modelo 3D */}
              <ambientLight intensity={1.5} />
              <hemisphereLight skyColor="#FFFFFF" groundColor="#333333" intensity={1.0} />
              <directionalLight position={[5, 10, 5]} intensity={1.5} />
              <directionalLight position={[-5, -10, -5]} intensity={0.8} />
              <pointLight position={[0, 2, 0]} intensity={0.5} distance={10} decay={2} /> {/* Luz puntual cerca de la mascota */}

              <OrbitControls
                enableDamping
                dampingFactor={0.25}
                enableZoom={false} // Deshabilita el zoom (agrandar/achicar)
                minPolarAngle={Math.PI / 2} // Restringe el movimiento vertical hacia arriba
                maxPolarAngle={Math.PI / 2} // Restringe el movimiento vertical hacia abajo (juntos, solo permiten movimiento horizontal)
              />
              <Suspense fallback={<Html center><p style={{ color: 'black', fontSize: '1.5rem' }}>Cargando mascota...</p></Html>}>
                {currentPet.modelPath && (
                  <Model
                    path={currentPet.modelPath}
                    scale={currentPet.initialScale}
                    position={currentPet.initialPosition}
                    rotation={[0, Math.PI / 4, 0]} // Rotación inicial para verla mejor
                    innerRef={petModelRef}
                  />
                )}
              </Suspense>
            </Canvas>
          </div>

          {/* Barras de progreso */}
          <div className="progress-bar-container hunger-bar">
            <div className="progress-bar-fill" style={{ width: `${hunger}%` }}>
              Hambre: {hunger}%
            </div>
          </div>

          <div className="progress-bar-container thirst-bar">
            <div className="progress-bar-fill" style={{ width: `${thirst}%` }}>
              Sed: {thirst}%
            </div>
          </div>

          {/* Botones de acción */}
          <div className="action-buttons">
            <button onClick={handleFeed} className="action-button">
              <FaUtensils /> Alimentar
            </button>
            <button onClick={handleWater} className="action-button water">
              <FaTint /> Dar Agua
            </button>
          </div>
        </div>

        {/* Pop-up de bienvenida */}
        {showWelcomePopup && (
          <div className="welcome-popup-overlay">
            <div className="welcome-popup-content">
              <h2>¡Conoce a tu Mascota!</h2>
              <p>
                Esta es tu mascota de la clase {userClass ? PET_DATA[userClass]?.name || 'desconocida' : 'desconocida'}. Puedes darle un sobrenombre, alimentarla y darle agua para mantenerla feliz. ¡Explora el modelo 3D con el mouse o el dedo!
              </p>
              <button onClick={closeWelcomePopup} className="welcome-popup-button">
                ¡Empezar!
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PetScreen;
