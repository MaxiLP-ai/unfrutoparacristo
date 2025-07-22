import React, { useRef, useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import Swal from 'sweetalert2';
import '../pages_css/TreePage.css';

// --- Configuración de Modelos y Assets ---
const ARBOL_MODEL_PATH = '/models/arbolsimple.glb';
const MANZANA_VERDE_MODEL_PATH = '/models/AppleGreen.glb';
const MANZANA_ROJA_MODEL_PATH = '/models/AppleRed.glb';
const MANZANA_DORADA_MODEL_PATH = '/models/AppleGold.glb';

// ==================================================================
// CONFIGURACIÓN INDIVIDUAL POR TIPO DE FRUTO
// ==================================================================
const FRUTO_CONFIG = {
  verdes: {
    baseScale: 10,
    baseRotation: [0, 0, 0], // Rotación por defecto para la escena principal
    inventoryScale: 14,
    inventoryPosition: [0, -0.5, 0],
    inventoryRotation: [0, 0, 0],
  },
  rojas: {
    baseScale: 0.045,
    // ¡SOLUCIÓN! Rotación en radianes (-90 grados en el eje X) para enderezar la manzana.
    baseRotation: [-Math.PI / 2, 0, 0], 
    inventoryScale: 0.15,
    inventoryPosition: [-0.1, -1, 0],
    // ¡SOLUCIÓN! Usamos radianes también para la cesta.
    inventoryRotation: [-Math.PI / 2, 0, 0],
  },
  doradas: {
    baseScale: 0.0045,
    baseRotation: [0, 0, 0],
    inventoryScale: 0.007,
    inventoryPosition: [0, -0.6, 0],
    inventoryRotation: [0.2, 0, 0],
  },
};

// ==================================================================


// --- Componente de Carga para Suspense ---
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'white', fontSize: '1.5rem', fontFamily: 'sans-serif' }}>
        Cargando datos del árbol...
      </div>
    </Html>
  );
}

// --- Componente para un Fruto Individual en el Árbol ---
const FrutoEnArbol = React.memo(({ id, modelo, position, scale, rotation, onDevolver, controlsRef }) => {
  // ==================================================================
  // ¡SOLUCIÓN! Lógica mejorada para detectar un "clic" y controlar la cámara.
  // ==================================================================
  const clickInfo = useRef({ x: 0, y: 0, time: 0 });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    clickInfo.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    // Desactivamos la cámara solo al presionar sobre un fruto
    if (controlsRef.current) controlsRef.current.enabled = false;
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    // Reactivamos la cámara siempre al soltar el clic
    if (controlsRef.current) controlsRef.current.enabled = true;
    
    const timeDiff = Date.now() - clickInfo.current.time;
    const distance = Math.sqrt(Math.pow(e.clientX - clickInfo.current.x, 2) + Math.pow(e.clientY - clickInfo.current.y, 2));

    if (timeDiff < 200 && distance < 5) {
      onDevolver(id, modelo.userData.tipo);
    }
  };
  // ==================================================================

  return (
    <primitive
      object={modelo.clone()}
      position={position}
      scale={scale}
      rotation={rotation}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  );
});

// --- Componente Principal: TreePage ---
const TreePage = ({ makeAuthenticatedRequest }) => {
  // --- Estados ---
  const [frutosEnArbol, setFrutosEnArbol] = useState([]);
  const [inventario, setInventario] = useState({ verdes: 0, rojas: 0, doradas: 0 });
  const [frutoArrastrando, setFrutoArrastrando] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // --- Referencias ---
  const arbolRef = useRef();
  const orbitControlsRef = useRef();
  const intersectionPlaneRef = useRef();
  const isProcessingDrop = useRef(false);

  // --- Carga de Modelos 3D ---
  const arbolGLTF = useLoader(GLTFLoader, ARBOL_MODEL_PATH);
  const manzanaVerdeGLTF = useLoader(GLTFLoader, MANZANA_VERDE_MODEL_PATH);
  const manzanaRojaGLTF = useLoader(GLTFLoader, MANZANA_ROJA_MODEL_PATH);
  const manzanaDoradaGLTF = useLoader(GLTFLoader, MANZANA_DORADA_MODEL_PATH);

  const modelosFrutos = {
    verdes: manzanaVerdeGLTF,
    rojas: manzanaRojaGLTF,
    doradas: manzanaDoradaGLTF,
  };

  // --- Lógica de Sincronización con el Backend ---
  const fetchCestaData = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/cesta/`); 
      if (!response.ok) throw new Error('No se pudieron cargar los datos de la cesta.');
      const data = await response.json();

      setInventario({
        verdes: data.cesta_total_verdes || 0,
        rojas: data.cesta_total_rojas || 0,
        doradas: data.cesta_total_doradas || 0,
      });

      const frutosColocados = (data.frutos_colocados || []).map(fruto => {
        const config = FRUTO_CONFIG[fruto.tipo];
        const modelo = modelosFrutos[fruto.tipo].scene;
        modelo.userData.tipo = fruto.tipo;
        return {
          ...fruto,
          modelo: modelo,
          scale: config.baseScale,
          rotation: config.baseRotation,
        };
      });
      setFrutosEnArbol(frutosColocados);

    } catch (error) {
      console.error("Error al cargar datos de la cesta:", error);
      Swal.fire('Error', 'No se pudieron cargar tus datos del árbol.', 'error');
    }
  }, [makeAuthenticatedRequest, modelosFrutos]);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkIsMobile);
    
    document.body.style.overflow = 'hidden';
    
    
    fetchCestaData();

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [fetchCestaData]);

  // --- Lógica de Interacción 3D ---
  const SceneEvents = () => {
    const { camera, raycaster, pointer, gl } = useThree();
    const stateRef = useRef({ frutoArrastrando });
    useEffect(() => {
      stateRef.current.frutoArrastrando = frutoArrastrando;
    }, [frutoArrastrando]);

    useEffect(() => {
        const handlePointerMove = (event) => {
            const currentFruto = stateRef.current.frutoArrastrando;
            if (currentFruto) {
                event.preventDefault();
                const clientX = event.touches ? event.touches[0].clientX : event.clientX;
                const clientY = event.touches ? event.touches[0].clientY : event.clientY;
                pointer.x = (clientX / gl.domElement.clientWidth) * 2 - 1;
                pointer.y = -(clientY / gl.domElement.clientHeight) * 2 + 1;
                raycaster.setFromCamera(pointer, camera);
                const intersects = raycaster.intersectObject(intersectionPlaneRef.current);
                if (intersects.length > 0) {
                    setFrutoArrastrando(prev => (prev ? { ...prev, position: intersects[0].point } : null));
                }
            }
        };

        const handlePointerUp = async (event) => {
            const currentFruto = stateRef.current.frutoArrastrando;
            if (!currentFruto || isProcessingDrop.current) return;
            
            isProcessingDrop.current = true;
            if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;

            const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
            const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
            pointer.x = (clientX / gl.domElement.clientWidth) * 2 - 1;
            pointer.y = -(clientY / gl.domElement.clientHeight) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);

            const intersects = raycaster.intersectObjects(arbolRef.current.children, true);

            if (intersects.length > 0) {
                const intersectionPoint = intersects[0].point;
                const treeMatrixInverse = new THREE.Matrix4().copy(arbolRef.current.matrixWorld).invert();
                const localPosition = intersectionPoint.clone().applyMatrix4(treeMatrixInverse);
                const tipoDeFruto = currentFruto.tipo;
                
                const frutoDataParaBackend = {
                    tipo: tipoDeFruto,
                    position: localPosition.toArray(),
                };

                try {
                  const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/cesta/poner_fruto/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(frutoDataParaBackend),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = Object.values(errorData).join(' ');
                    throw new Error(errorMessage || 'El servidor no pudo guardar el fruto.');
                  }
                  
                  const frutoGuardado = await response.json();
                  const configDelFruto = FRUTO_CONFIG[tipoDeFruto];
                  
                  setFrutosEnArbol(prev => [...prev, { 
                      ...frutoGuardado, 
                      modelo: currentFruto.modelo, 
                      rotation: configDelFruto.baseRotation, 
                      scale: configDelFruto.baseScale 
                  }]);
                  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '¡Fruto colocado!', showConfirmButton: false, timer: 2000, timerProgressBar: true });

                } catch (error) {
                  console.error("Error al colocar el fruto:", error);
                  setInventario(prev => ({ ...prev, [tipoDeFruto]: (prev[tipoDeFruto] || 0) + 1 }));
                  Swal.fire('Error', error.message, 'error');
                }

            } else {
                setInventario(prev => ({ ...prev, [currentFruto.tipo]: (prev[currentFruto.tipo] || 0) + 1 }));
                Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'El fruto volvió a tu cesta', showConfirmButton: false, timer: 2000 });
            }
            
            setFrutoArrastrando(null);
            setTimeout(() => { isProcessingDrop.current = false; }, 100);
        };

        const canvasEl = gl.domElement;
        canvasEl.addEventListener('pointermove', handlePointerMove);
        canvasEl.addEventListener('pointerup', handlePointerUp);
        canvasEl.addEventListener('touchmove', handlePointerMove, { passive: false });
        canvasEl.addEventListener('touchend', handlePointerUp);

        return () => {
            canvasEl.removeEventListener('pointermove', handlePointerMove);
            canvasEl.removeEventListener('pointerup', handlePointerUp);
            canvasEl.removeEventListener('touchmove', handlePointerMove);
            canvasEl.removeEventListener('touchend', handlePointerUp);
        };
    }, [gl, camera, pointer, raycaster]);

    return null;
  };

  const handleIniciarArrastre = (tipoFruto) => {
    if (inventario[tipoFruto] > 0) {
      if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
      setInventario(prev => ({ ...prev, [tipoFruto]: prev[tipoFruto] - 1 }));
      
      const modelo = modelosFrutos[tipoFruto].scene;
      modelo.userData.tipo = tipoFruto;
      setFrutoArrastrando({
        tipo: tipoFruto,
        modelo: modelo,
        position: new THREE.Vector3(0, 0, 1000),
      });
    } else {
      Swal.fire('¡Cesta vacía!', `No tienes manzanas ${tipoFruto}.`, 'warning');
    }
  };

  const handleDevolverFruto = (frutoId, tipoFruto) => {
    Swal.fire({
      title: '¿Devolver a la cesta?',
      text: "El fruto volverá a tu inventario.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, devolver',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/cesta/devolver_fruto/${frutoId}/`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('El servidor no pudo devolver el fruto.');

          setFrutosEnArbol(prev => prev.filter(f => f.id !== frutoId));
          setInventario(prev => ({ ...prev, [tipoFruto]: (prev[tipoFruto] || 0) + 1 }));
          Swal.fire('¡Devuelto!', 'El fruto está de nuevo en tu cesta.', 'success');

        } catch (error) {
          console.error("Error al devolver el fruto:", error);
          Swal.fire('Error', 'No se pudo devolver el fruto. Intenta recargar la página.', 'error');
        }
      }
    });
  };
  
  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  return (
    <div className="arbol-container">

      {showWelcomePopup && (
        <div className="welcome-popup-overlay" onClick={closeWelcomePopup}>
          <div className="welcome-popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>¡Bienvenido al Árbol de Frutos!</h2>
            <p>
              {isMobile
                ? "Toca un fruto de tu cesta y arrástralo al árbol para colocarlo."
                : "Haz clic en un fruto de tu cesta y arrástralo al árbol para colocarlo."}
            </p>
            <button onClick={closeWelcomePopup} className="welcome-popup-button">
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      <div className="cesta-inventario">
        {Object.keys(FRUTO_CONFIG).map((tipo) => {
          const config = FRUTO_CONFIG[tipo];
          const cantidad = inventario ? inventario[tipo] : 0;
          return (
            <div key={tipo} className="cesta-item">
              <div className="cesta-item-draggable" onPointerDown={() => handleIniciarArrastre(tipo)}>
                <div className="cesta-canvas-container">
                  <Canvas camera={{ position: [0, 0, 1.5], fov: 75 }}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <Suspense fallback={null}>
                      <primitive 
                        object={modelosFrutos[tipo].scene.clone()} 
                        scale={config.inventoryScale}
                        position={config.inventoryPosition}
                        rotation={config.inventoryRotation}
                      />
                    </Suspense>
                  </Canvas>
                </div>
                <span className="cesta-contador">x {cantidad}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="canvas-wrapper">
        <Canvas 
          camera={{ position: [0, 2, 12], fov: 50 }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (event) => console.error('WebGL context lost!', event));
            gl.domElement.addEventListener('webglcontextrestored', () => console.log('WebGL context restored!'));
          }}
        >
          <Suspense fallback={<Loader />}>
            <ambientLight intensity={0.7} />
            <hemisphereLight skyColor="#b1e1ff" groundColor="#b97a20" intensity={0.6} />
            <directionalLight position={[5, 10, 7.5]} intensity={1.2} castShadow />
            <OrbitControls ref={orbitControlsRef} enableDamping dampingFactor={0.1} minDistance={2} maxDistance={100} />
            <mesh ref={intersectionPlaneRef} visible={false}>
              <planeGeometry args={[100, 100]} />
              <meshBasicMaterial />
            </mesh>
            
            <primitive ref={arbolRef} object={arbolGLTF.scene} scale={0.8} position={[0, -14, 0]}>
              {frutosEnArbol.map(fruto => (
                <FrutoEnArbol
                  key={fruto.id}
                  id={fruto.id}
                  modelo={fruto.modelo}
                  position={fruto.position}
                  scale={fruto.scale}
                  rotation={fruto.rotation}
                  onDevolver={handleDevolverFruto}
                  // ¡SOLUCIÓN! Pasamos la referencia de los controles
                  controlsRef={orbitControlsRef}
                />
              ))}
            </primitive>

            {frutoArrastrando && frutoArrastrando.tipo && (
              <primitive 
                object={frutoArrastrando.modelo} 
                position={frutoArrastrando.position} 
                scale={FRUTO_CONFIG[frutoArrastrando.tipo].baseScale}
                rotation={FRUTO_CONFIG[frutoArrastrando.tipo].baseRotation}
              />
            )}
            
            <SceneEvents />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default TreePage;
