import React, { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Html } from '@react-three/drei';
import Swal from 'sweetalert2';
import { FaEdit, FaTshirt, FaTimes, FaStore, FaWrench, FaArrowLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import '../pages_css/PetScreen.css';
import { Link } from 'react-router-dom';

// Componente para cargar y renderizar el modelo GLTF de la mascota
const Model = React.memo(({ path, scale, position, rotation, innerRef }) => {
  const gltf = useLoader(GLTFLoader, path, undefined, undefined, (error) => {
    console.error(`Error al cargar el modelo GLTF desde ${path}:`, error);
    Swal.fire({
      icon: 'error',
      title: 'Error de carga de modelo',
      text: `No se pudo cargar la mascota desde: ${path}. Asegúrate de que el archivo exista en la carpeta 'public/models/'.`,
      confirmButtonColor: '#d33',
    });
  });

  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      node.material.flatShading = false;
      node.material.needsUpdate = true;
    }
  });
  return <primitive object={gltf.scene} scale={scale} position={position} rotation={rotation} ref={innerRef} />;
});

// Componente para cargar y renderizar accesorios 3D
const AccessoryModel = React.memo(({ path, scale, position, rotation, xRay }) => {
  const gltf = useLoader(GLTFLoader, path, undefined, undefined, (error) => {
    console.error(`Error al cargar el accesorio GLTF desde ${path}:`, error);
  });

  const clonedScene = React.useMemo(() => {
    if (!gltf) return null;
    return gltf.scene.clone();
  }, [gltf]);

  React.useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((node) => {
        if (node.isMesh) {
          node.material.flatShading = false;

          if (xRay) {
            node.material.depthTest = false;
            node.material.transparent = true;
            node.material.opacity = 0.85;
          } else {
            node.material.depthTest = true;
            node.material.transparent = false;
            node.material.opacity = 1.0;
          }

          node.material.needsUpdate = true;
        }
      });
    }
  }, [clonedScene, xRay]);

  if (!clonedScene) return null;

  // Convierte los ángulos de rotación de grados a radianes
  const radRotation = rotation ? rotation.map(deg => (deg * Math.PI) / 180) : [0, 0, 0];

  return (
    <group scale={scale} position={position} rotation={radRotation} renderOrder={xRay ? 999 : 0}>
      <primitive object={clonedScene} />
    </group>
  );
});

const PET_DATA = {
  '3': {
    name: 'Valentin',
    clase: 'Transición Niños',
    modelPath: '/models/valentin.glb',
    initialScale: 0.85,
    initialPosition: [0, -0.2, 0],
  },
  '2': {
    name: 'Leo',
    clase: 'Valientes de David',
    modelPath: '/models/leo.glb',
    initialScale: 0.95,
    initialPosition: [-0.2, -0.2, 0],
  },
  '1': {
    name: 'Luna',
    clase: 'Semillas de Amor',
    modelPath: '/models/luna.glb',
    initialScale: 0.8,
    initialPosition: [0, -0.3, 0],
  },
  'default': {
    name: 'Mascota',
    modelPath: '/models/valentin.glb',
    initialScale: 0.7,
    initialPosition: [0, -0.2, 0],
  }
};

const FOOD_METADATA = {
  'food_watermelon': { emoji: '🍉', nombre: 'Sandía', nutrition: { hambre: 10, sed: 15 } },
  'food_cookie': { emoji: '🍪', nombre: 'Galleta', nutrition: { hambre: 15, sed: 5 } },
  'food_donut': { emoji: '🍩', nombre: 'Dona', nutrition: { hambre: 20, sed: 5 } },
  'food_icecream': { emoji: '🍦', nombre: 'Helado', nutrition: { hambre: 15, sed: 25 } },
  'food_pizza': { emoji: '🍕', nombre: 'Pizza', nutrition: { hambre: 35, sed: 10 } },
};

const CLOTHES_METADATA = [
  { id: 'skin_gorro', nombre: 'Gorro Divertido', emoji: '🎩', tipo: 'skin', modelPath: '/models/gorro.glb' },
  { id: 'skin_quico_gorro', nombre: 'Gorro de Quico', emoji: '🧢', tipo: 'skin', modelPath: '/models/quico_gorro.glb' },
  { id: 'skin_lentes', nombre: 'Lentes de Sol 3D', emoji: '🕶️', tipo: 'skin', modelPath: '/models/lentes_de_sol.glb' },
  { id: 'skin_lentes_vr', nombre: 'Lentes VR Box', emoji: '🥽', tipo: 'skin', modelPath: '/models/vr-glasses.glb' },
  { id: 'skin_guitarra', nombre: 'Guitarra Acústica', emoji: '🎸', tipo: 'skin', modelPath: '/models/guitarra_gibson_acustica.glb' },
  { id: 'skin_violin', nombre: 'Violín Clásico', emoji: '🎻', tipo: 'skin', modelPath: '/models/violin.glb' },
  { id: 'skin_bateria', nombre: 'Batería Musical', emoji: '🥁', tipo: 'skin', modelPath: '/models/bateria.glb' },
  { id: 'skin_pulpito', nombre: 'Púlpito de la Iglesia', emoji: '⛪', tipo: 'skin', modelPath: '/models/pulpito_iumpconcon.glb' },
  { id: 'skin_figurita_pastor', nombre: 'Figurita del Pastor', emoji: '👨‍💼', tipo: 'skin', modelPath: '/models/figurita_pastor.glb' },
  { id: 'bg_normal', nombre: 'Fondo de la Habitación', emoji: '🏠', tipo: 'fondo' },
  { id: 'bg_bosque', nombre: 'Fondo del Bosque', emoji: '🌲', tipo: 'fondo' },
  { id: 'bg_playa', nombre: 'Fondo de Playa', emoji: '🏖️', tipo: 'fondo' },
];

const DEFAULT_ACCESSORY_ADJUSTMENTS = {
  skin_gorro: {
    '1': { scale: [0.5058, 0.5058, 0.5058], position: [0.02, 0.291, -0.017], rotation: [0, 38, 0] },
    '2': { scale: [0.5298, 0.5298, 0.5298], position: [-0.1, 0.364, 0.073], rotation: [-6, 51, 0] },
    '3': { scale: [0.4, 0.4, 0.4], position: [0.037, 0.193, 0.018], rotation: [0, 29, 0] },
    default: { scale: [0.35, 0.35, 0.35], position: [0, 0.5, 0], rotation: [0, 0, 0] }
  },
  skin_quico_gorro: {
    '1': { scale: [4.5599, 4.5599, 4.5599], position: [0.039, 0.304, 0.026], rotation: [0, 44, 0] },
    '2': { scale: [4.1764, 4.1764, 4.1764], position: [-0.068, 0.591, 0.098], rotation: [0, 46, 0] },
    '3': { scale: [3.4472, 3.4472, 3.4472], position: [0.082, 0.181, 0.068], rotation: [0, 49, 0] },
    default: { scale: [0.35, 0.35, 0.35], position: [0, 0.5, 0], rotation: [0, 0, 0] }
  },
  skin_lentes: {
    '1': { scale: [0.06, 0.06, 0.06], position: [0.104, -0.756, 0.13], rotation: [0, 47, 0] },
    '2': { scale: [0.06, 0.06, 0.06], position: [0.075, -0.481, 0.242], rotation: [0, 42, 0] },
    '3': { scale: [0.0435, 0.0435, 0.0435], position: [0.09, -0.54, 0.095], rotation: [0, 48, 0] },
    default: { scale: [0.06, 0.06, 0.06], position: [0, 0.25, 0.35], rotation: [0, 0, 0] }
  },
  skin_lentes_vr: {
    '1': { scale: [0.0719, 0.0719, 0.0719], position: [0.344, 0.036, 0.35], rotation: [0, 31, 0] },
    '2': { scale: [0.0748, 0.0748, 0.0748], position: [0.223, 0.25, 0.4], rotation: [0, 42, 0] },
    '3': { scale: [0.045, 0.045, 0.045], position: [0.2, 0.009, 0.195], rotation: [0, 34, 0] },
    default: { scale: [0.05, 0.05, 0.05], position: [0, 0.25, 0.35], rotation: [0, 0, 0] }
  },
  skin_guitarra: {
    '1': { scale: [0.0299, 0.0299, 0.0299], position: [0.45, -1.004, 0.25], rotation: [15, 63, -35] },
    '2': { scale: [0.0253, 0.0253, 0.0253], position: [0.765, -0.96, -0.12], rotation: [360, 64, -3] },
    '3': { scale: [0.0191, 0.0191, 0.0191], position: [0.45, -0.8, 0.154], rotation: [28, 92, -47] },
    default: { scale: [0.015, 0.015, 0.015], position: [0.45, -0.35, 0.25], rotation: [15, 45, -35] }
  },
  skin_violin: {
    '1': { scale: [1.62, 1.62, 1.62], position: [0.362, -0.728, 0.3], rotation: [59, -8, -20] },
    '2': { scale: [1.6646, 1.6646, 1.6646], position: [0.26, -0.753, 0.434], rotation: [-109, -171, -226] },
    '3': { scale: [1.25, 1.25, 1.25], position: [0.4, -0.6, 0.3], rotation: [74, 16, -20] },
    default: { scale: [1.1, 1.1, 1.1], position: [0.4, -0.3, 0.3], rotation: [-30, 45, -20] }
  },
  skin_bateria: {
    '1': { scale: [0.1672, 0.1672, 0.1672], position: [0.501, -0.84, 0.375], rotation: [0, -124, 0] },
    '2': { scale: [0.1655, 0.1655, 0.1655], position: [0.4, -0.71, 0.83], rotation: [0, -146, 0] },
    '3': { scale: [0.1672, 0.1672, 0.1725], position: [0.454, -0.737, 0.384], rotation: [0, -132, 0] },
    default: { scale: [0.08, 0.08, 0.08], position: [0.6, -0.4, 0.1], rotation: [0, -45, 0] }
  },
  skin_pulpito: {
    '1': { scale: [0.3344, 0.3344, 0.3344], position: [0.455, -0.653, 0.483], rotation: [0, -131, 0] },
    '2': { scale: [0.4123, 0.4123, 0.4123], position: [0.56, -0.617, 0.691], rotation: [0, -136, 0] },
    '3': { scale: [0.4999, 0.4999, 0.4999], position: [0.284, -0.781, 0.316], rotation: [0, -143, 0] },
    default: { scale: [0.25, 0.25, 0.25], position: [0, -0.4, 0.35], rotation: [0, 0, 0] }
  },
  skin_figurita_pastor: {
    '1': { scale: [0.49, 0.49, 0.49], position: [0.856, -0.488, 0.014], rotation: [0, 44, 0] },
    '2': { scale: [0.4747, 0.4747, 0.4747], position: [1.07, -0.4, 0.25], rotation: [0, 42, 0] },
    '3': { scale: [0.4999, 0.4999, 0.4999], position: [0.779, -0.461, 0.18], rotation: [0, 30, 0] },
    default: { scale: [0.2, 0.2, 0.2], position: [0.35, -0.4, 0.25], rotation: [0, 0, 0] }
  }
};

const PetScreen = ({ makeAuthenticatedRequest }) => {
  const [userClass, setUserClass] = useState(null);
  const [userRol, setUserRol] = useState('');
  const [petNickname, setPetNickname] = useState('');
  const [hunger, setHunger] = useState(100);
  const [thirst, setThirst] = useState(100);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const nicknameInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Nuevos estados para armario y alimentos
  const [equippedItems, setEquippedItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isArmarioOpen, setIsArmarioOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedFoodIndex, setSelectedFoodIndex] = useState(0);

  // Estados para calibrador 3D de accesorios
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);
  const [selectedPetIdForAdjustment, setSelectedPetIdForAdjustment] = useState(null);
  const [previewAccessoryId, setPreviewAccessoryId] = useState(null);
  const [xRayPreview, setXRayPreview] = useState(false);
  const [adjustments, setAdjustments] = useState(() => {
    const saved = localStorage.getItem('pet_accessory_adjustments_v14');
    return saved ? JSON.parse(saved) : DEFAULT_ACCESSORY_ADJUSTMENTS;
  });

  const activePetId = selectedPetIdForAdjustment || userClass || '3';
  const currentPet = PET_DATA[activePetId] || PET_DATA['default'];

  const activeSkinId = isAdjusterOpen
    ? (previewAccessoryId || equippedItems.find(item => item.startsWith('skin_')) || 'skin_gorro')
    : equippedItems.find(item => item.startsWith('skin_'));

  const activeSkinMetadata = CLOTHES_METADATA.find(c => c.id === activeSkinId);
  const is3DAccessory = activeSkinMetadata && activeSkinMetadata.modelPath;

  let currentAdjustments = (is3DAccessory && adjustments[activeSkinId])
    ? (adjustments[activeSkinId][activePetId] || adjustments[activeSkinId]['default'] || { scale: [1, 1, 1], position: [0, 0, 0], rotation: [0, 0, 0] })
    : { scale: [1, 1, 1], position: [0, 0, 0], rotation: [0, 0, 0] };

  // Salvaguardas: Evitar que los modelos 3D se rendericen con escala 1.0 por defecto
  if (activeSkinId === 'skin_guitarra' && currentAdjustments.scale[0] === 1.0) {
    currentAdjustments = {
      ...currentAdjustments,
      scale: activePetId === '2' ? [0.0253, 0.0253, 0.0253] : (activePetId === '1' ? [0.0299, 0.0299, 0.0299] : (activePetId === '3' ? [0.0191, 0.0191, 0.0191] : [0.015, 0.015, 0.015])),
      position: currentAdjustments.position[0] === 0 ? (activePetId === '2' ? [0.765, -0.96, -0.12] : (activePetId === '1' ? [0.45, -1.004, 0.25] : (activePetId === '3' ? [0.45, -0.8, 0.154] : [0.45, -0.35, 0.25]))) : currentAdjustments.position,
      rotation: currentAdjustments.rotation[0] === 0 ? (activePetId === '2' ? [360, 64, -3] : (activePetId === '1' ? [15, 63, -35] : (activePetId === '3' ? [28, 92, -47] : [15, 45, -35]))) : currentAdjustments.rotation
    };
  } else if (activeSkinId === 'skin_violin' && currentAdjustments.scale[0] === 1.0) {
    currentAdjustments = {
      ...currentAdjustments,
      scale: activePetId === '2' ? [1.6646, 1.6646, 1.6646] : (activePetId === '1' ? [1.62, 1.62, 1.62] : (activePetId === '3' ? [1.25, 1.25, 1.25] : [1.1, 1.1, 1.1])),
      position: currentAdjustments.position[0] === 0 ? (activePetId === '2' ? [0.26, -0.753, 0.434] : (activePetId === '1' ? [0.362, -0.728, 0.3] : (activePetId === '3' ? [0.4, -0.6, 0.3] : [0.4, -0.3, 0.3]))) : currentAdjustments.position,
      rotation: currentAdjustments.rotation[0] === 0 ? (activePetId === '2' ? [-109, -171, -226] : (activePetId === '1' ? [59, -8, -20] : (activePetId === '3' ? [74, 16, -20] : [-30, 45, -20]))) : currentAdjustments.rotation
    };
  } else if (activeSkinId === 'skin_lentes' && currentAdjustments.scale[0] === 1.0) {
    currentAdjustments = {
      ...currentAdjustments,
      scale: activePetId === '3' ? [0.0435, 0.0435, 0.0435] : [0.06, 0.06, 0.06],
      position: currentAdjustments.position[0] === 0 ? (activePetId === '2' ? [0.075, -0.481, 0.242] : (activePetId === '1' ? [0.104, -0.756, 0.13] : (activePetId === '3' ? [0.09, -0.54, 0.095] : [0, 0.25, 0.35]))) : currentAdjustments.position,
      rotation: currentAdjustments.rotation[0] === 0 ? (activePetId === '2' ? [0, 42, 0] : (activePetId === '1' ? [0, 47, 0] : (activePetId === '3' ? [0, 48, 0] : [0, 0, 0]))) : currentAdjustments.rotation
    };
  } else if (activeSkinId === 'skin_lentes_vr' && currentAdjustments.scale[0] === 1.0) {
    currentAdjustments = {
      ...currentAdjustments,
      scale: activePetId === '2' ? [0.0748, 0.0748, 0.0748] : (activePetId === '1' ? [0.0719, 0.0719, 0.0719] : (activePetId === '3' ? [0.045, 0.045, 0.045] : [0.05, 0.05, 0.05])),
      position: currentAdjustments.position[0] === 0 ? (activePetId === '2' ? [0.223, 0.25, 0.4] : (activePetId === '1' ? [0.344, 0.036, 0.35] : (activePetId === '3' ? [0.2, 0.009, 0.195] : [0, 0.25, 0.35]))) : currentAdjustments.position,
      rotation: currentAdjustments.rotation[0] === 0 ? (activePetId === '2' ? [0, 42, 0] : (activePetId === '1' ? [0, 31, 0] : (activePetId === '3' ? [0, 34, 0] : [0, 0, 0]))) : currentAdjustments.rotation
    };
  } else if (activeSkinId === 'skin_pulpito' && currentAdjustments.scale[0] === 1.0) {
    currentAdjustments = {
      ...currentAdjustments,
      scale: activePetId === '2' ? [0.4123, 0.4123, 0.4123] : (activePetId === '1' ? [0.3344, 0.3344, 0.3344] : (activePetId === '3' ? [0.4999, 0.4999, 0.4999] : [0.25, 0.25, 0.25])),
      position: currentAdjustments.position[0] === 0 ? (activePetId === '2' ? [0.56, -0.617, 0.691] : (activePetId === '1' ? [0.455, -0.653, 0.483] : (activePetId === '3' ? [0.284, -0.781, 0.316] : [0, -0.4, 0.35]))) : currentAdjustments.position,
      rotation: currentAdjustments.rotation[0] === 0 ? (activePetId === '2' ? [0, -136, 0] : (activePetId === '1' ? [0, -131, 0] : (activePetId === '3' ? [0, -143, 0] : [0, 0, 0]))) : currentAdjustments.rotation
    };
  } else if (activeSkinId === 'skin_figurita_pastor' && currentAdjustments.scale[0] === 1.0) {
    currentAdjustments = {
      ...currentAdjustments,
      scale: activePetId === '2' ? [0.4747, 0.4747, 0.4747] : (activePetId === '1' ? [0.49, 0.49, 0.49] : (activePetId === '3' ? [0.4999, 0.4999, 0.4999] : [0.2, 0.2, 0.2])),
      position: currentAdjustments.position[0] === 0 ? (activePetId === '2' ? [1.07, -0.4, 0.25] : (activePetId === '1' ? [0.856, -0.488, 0.014] : (activePetId === '3' ? [0.779, -0.461, 0.18] : [0.35, -0.4, 0.25]))) : currentAdjustments.position,
      rotation: currentAdjustments.rotation[0] === 0 ? (activePetId === '2' ? [0, 42, 0] : (activePetId === '1' ? [0, 44, 0] : (activePetId === '3' ? [0, 30, 0] : [0, 0, 0]))) : currentAdjustments.rotation
    };
  } else if (activeSkinId === 'skin_bateria' && currentAdjustments.scale[0] === 1.0) {
    currentAdjustments = {
      ...currentAdjustments,
      scale: activePetId === '2' ? [0.1655, 0.1655, 0.1655] : (activePetId === '1' ? [0.1672, 0.1672, 0.1672] : (activePetId === '3' ? [0.1672, 0.1672, 0.1725] : [0.08, 0.08, 0.08])),
      position: currentAdjustments.position[0] === 0 ? (activePetId === '2' ? [0.4, -0.71, 0.83] : (activePetId === '1' ? [0.501, -0.84, 0.375] : (activePetId === '3' ? [0.454, -0.737, 0.384] : [0.6, -0.4, 0.1]))) : currentAdjustments.position,
      rotation: currentAdjustments.rotation[0] === 0 ? (activePetId === '2' ? [0, -146, 0] : (activePetId === '1' ? [0, -124, 0] : (activePetId === '3' ? [0, -132, 0] : [0, -45, 0]))) : currentAdjustments.rotation
    };
  }

  // Escalas y posiciones dinámicas para el Canvas
  const finalPetScale = isMobile
    ? [currentPet.initialScale * 0.58, currentPet.initialScale * 0.58, currentPet.initialScale * 0.58]
    : [currentPet.initialScale, currentPet.initialScale, currentPet.initialScale];

  const finalPetPosition = isMobile
    ? [currentPet.initialPosition[0] * 0.58, currentPet.initialPosition[1] * 0.58, currentPet.initialPosition[2] * 0.58]
    : currentPet.initialPosition;

  const finalAccScale = isMobile
    ? [currentAdjustments.scale[0] * 0.58, currentAdjustments.scale[1] * 0.58, currentAdjustments.scale[2] * 0.58]
    : currentAdjustments.scale;

  const finalAccPos = isMobile
    ? [currentAdjustments.position[0] * 0.58, currentAdjustments.position[1] * 0.58, currentAdjustments.position[2] * 0.58]
    : currentAdjustments.position;

  const handleAdjustmentChange = (field, axis, value) => {
    setAdjustments(prev => {
      const updated = { ...prev };
      if (!updated[activeSkinId]) {
        updated[activeSkinId] = {};
      }
      if (!updated[activeSkinId][activePetId]) {
        updated[activeSkinId][activePetId] = { scale: [1, 1, 1], position: [0, 0, 0], rotation: [0, 0, 0] };
      }

      const itemAdjustments = { ...updated[activeSkinId][activePetId] };

      if (field === 'scale') {
        const nextScale = [...itemAdjustments.scale];
        if (axis === 'all') {
          nextScale[0] = value;
          nextScale[1] = value;
          nextScale[2] = value;
        } else {
          nextScale[axis] = value;
        }
        itemAdjustments.scale = nextScale;
      } else if (field === 'position') {
        const nextPos = [...itemAdjustments.position];
        nextPos[axis] = value;
        itemAdjustments.position = nextPos;
      } else if (field === 'rotation') {
        const nextRot = [...itemAdjustments.rotation];
        nextRot[axis] = value;
        itemAdjustments.rotation = nextRot;
      }

      updated[activeSkinId][activePetId] = itemAdjustments;
      localStorage.setItem('pet_accessory_adjustments_v14', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetAdjustments = () => {
    setAdjustments(prev => {
      const updated = { ...prev };
      const defaultVal = DEFAULT_ACCESSORY_ADJUSTMENTS[activeSkinId]?.[activePetId] || { scale: [1, 1, 1], position: [0, 0, 0], rotation: [0, 0, 0] };
      if (!updated[activeSkinId]) updated[activeSkinId] = {};
      updated[activeSkinId][activePetId] = JSON.parse(JSON.stringify(defaultVal));
      localStorage.setItem('pet_accessory_adjustments_v14', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetAllToFactory = () => {
    setAdjustments(DEFAULT_ACCESSORY_ADJUSTMENTS);
    localStorage.removeItem('pet_accessory_adjustments_v14');
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: '¡Todo restablecido a los valores por defecto!',
      showConfirmButton: false,
      timer: 2000
    });
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(adjustments, null, 2));
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: '¡JSON copiado al portapapeles!',
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Animaciones y Drag & Drop
  const [isEating, setIsEating] = useState(false);
  const [eatingFood, setEatingFood] = useState('');
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [draggedFood, setDraggedFood] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const petModelRef = useRef();

  // Obtener estilo de fondo condicional
  const getBackgroundStyle = () => {
    if (equippedItems.includes('bg_bosque')) {
      return {
        backgroundImage: 'url("/images/fondos/fondo bosque.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    if (equippedItems.includes('bg_playa')) {
      return {
        backgroundImage: 'url("/images/fondos/fondo playa.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    // Fondo normal (habitación por defecto)
    return {
      backgroundImage: 'url("/images/fondos/fondo normal.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  };

  // Función para obtener datos del usuario desde el backend
  const fetchUserData = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setUserRol(data.usuario_rol);
        const fetchedClass = data.usuario_clase_actual?.clase_id;
        setUserClass(fetchedClass);

        setPetNickname(data.perfil?.mascota_estado?.mascota_estado_sobrenombre ?? PET_DATA[fetchedClass]?.name ?? currentPet.name);

        const hungerValue = data.perfil?.mascota_estado?.mascota_estado_hambre;
        setHunger(hungerValue !== null && hungerValue !== undefined ? Number(hungerValue) : 100);

        const thirstValue = data.perfil?.mascota_estado?.mascota_estado_sed;
        setThirst(thirstValue !== null && thirstValue !== undefined ? Number(thirstValue) : 100);

        // Cargar skins e inventario
        const equippedStr = data.perfil?.alumno_skin_equipada || '';
        setEquippedItems(equippedStr.split(',').filter(Boolean));
        setInventory(data.perfil?.alumno_inventario_list ?? []);
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest, currentPet.name]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Manejar cambio de nombre
  const handleEditNickname = () => {
    setIsEditingNickname(true);
    setTimeout(() => {
      if (nicknameInputRef.current) nicknameInputRef.current.focus();
    }, 50);
  };

  const handleSaveNickname = async () => {
    setIsEditingNickname(false);
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
        timer: 2000
      });
    } catch (error) {
      console.error("Error al guardar nickname:", error);
    }
  };

  // Agrupar alimentos del inventario y contar cantidades
  const getFoodInventoryCounts = () => {
    const counts = {};
    Object.keys(FOOD_METADATA).forEach(key => counts[key] = 0);
    inventory.forEach(itemId => {
      if (counts[itemId] !== undefined) {
        counts[itemId]++;
      }
    });
    return counts;
  };

  const foodCounts = getFoodInventoryCounts();
  const availableFoods = Object.keys(foodCounts).filter(foodId => foodCounts[foodId] > 0);
  const hasAnyFood = availableFoods.length > 0;

  // Gestionar Drag & Drop
  const handleDragStart = (foodId, e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDraggedFood(foodId);
    setDragPosition({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setDragPosition({ x: clientX, y: clientY });
    };

    const handleRelease = async (e) => {
      setIsDragging(false);
      const canvasEl = document.querySelector('.pet-canvas-container');
      if (canvasEl && draggedFood) {
        const rect = canvasEl.getBoundingClientRect();
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          await executeFeed(draggedFood);
        }
      }
      setDraggedFood(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleRelease);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleRelease);
    };
  }, [isDragging, draggedFood]);

  // Lógica de Alimentar Mascota (Backend API)
  const executeFeed = async (foodId) => {
    const metadata = FOOD_METADATA[foodId];

    // Optimista
    setIsEating(true);
    setEatingFood(metadata.emoji);
    setTimeout(() => setIsEating(false), 1200);

    // Texto flotante
    const newText = {
      id: Math.random(),
      text: `+${metadata.nutrition.hambre} Hambre 🍗  +${metadata.nutrition.sed} Agua 💧`,
    };
    setFloatingTexts(prev => [...prev, newText]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
    }, 2000);

    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/mascota/alimentar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_id: foodId }),
      });

      if (response.ok) {
        const data = await response.json();
        setHunger(data.hambre);
        setThirst(data.sed);
        setInventory(data.inventario);
      } else {
        const errData = await response.json();
        Swal.fire('Error', errData.detail || 'No se pudo alimentar.', 'error');
      }
    } catch (error) {
      console.error("Error al alimentar:", error);
    }
  };

  // Equipar / Desequipar Skin en el armario
  const handleEquipInDrawer = async (itemId) => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/mascota/equipar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId }),
      });

      if (response.ok) {
        const data = await response.json();
        setEquippedItems((data.alumno_skin_equipada || '').split(',').filter(Boolean));
      }
    } catch (error) {
      console.error("Error al equipar:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <p className="text-xl">Cargando mascota...</p>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="pet-screen-background transition-all duration-500" style={getBackgroundStyle()}>

        {/* HUD SUPERIOR: Header con botones de control integrados */}
        <div className="w-full max-w-lg mx-auto flex flex-col gap-2 p-3 bg-white/95 border-4 border-slate-800 rounded-3xl shadow-[4px_4px_0px_0px_#1e293b] z-10">
          <div className="flex justify-between items-center w-full">
            {/* Botón Volver e Información de Mascota */}
            <div className="flex items-center gap-2">
              <Link
                to="/home"
                className="bg-white hover:bg-slate-100 border-2 border-slate-800 rounded-xl p-2 text-slate-800 transition-all flex items-center justify-center active:scale-95"
                title="Volver a Inicio"
              >
                <FaArrowLeft className="text-sm" />
              </Link>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider select-none">
                  {userClass ? PET_DATA[userClass]?.clase || 'Mascota' : 'Mascota'}
                </span>
                <div className="flex items-center gap-1">
                  {isEditingNickname ? (
                    <input
                      ref={nicknameInputRef}
                      type="text"
                      value={petNickname}
                      onChange={(e) => setPetNickname(e.target.value)}
                      onBlur={handleSaveNickname}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname(); }}
                      className="nickname-input text-xs py-0.5 px-1 max-w-[90px]"
                    />
                  ) : (
                    <>
                      <h2 className="text-sm font-black text-slate-800">{petNickname}</h2>
                      <button onClick={handleEditNickname} className="text-indigo-600">
                        <FaEdit className="text-[10px]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de Armario y Ajustador */}
            <div className="flex items-center gap-1.5">
              {userRol === 'superadmin' && (
                <button
                  onClick={() => setIsAdjusterOpen(!isAdjusterOpen)}
                  className={`border-2 border-slate-800 rounded-xl p-2 transition-all active:scale-95 ${isAdjusterOpen ? 'bg-red-400 text-white' : 'bg-indigo-200 text-slate-800'
                    }`}
                  title="Ajustar Medidas 3D"
                >
                  <FaWrench className="text-sm" />
                </button>
              )}
              <button
                onClick={() => setIsArmarioOpen(true)}
                className="bg-yellow-300 border-2 border-slate-800 rounded-xl p-2 text-slate-800 active:scale-95 transition-all"
                title="Mi Armario"
              >
                <FaTshirt className="text-sm" />
              </button>
            </div>
          </div>

          {/* HUD de Stats (Comida y Agua) */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-1 bg-amber-50/40 backdrop-blur-sm border-2 border-slate-800 rounded-lg px-1.5 py-0.5 select-none">
              <span className="text-[10px]">🍖</span>
              <div className="flex-1 h-1.5 bg-slate-200/50 border border-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${hunger}%` }} />
              </div>
              <span className="text-[8px] font-black text-slate-800">{hunger}%</span>
            </div>

            <div className="flex-1 flex items-center gap-1 bg-sky-50/40 backdrop-blur-sm border-2 border-slate-800 rounded-lg px-1.5 py-0.5 select-none">
              <span className="text-[10px]">💧</span>
              <div className="flex-1 h-1.5 bg-slate-200/50 border border-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500" style={{ width: `${thirst}%` }} />
              </div>
              <span className="text-[8px] font-black text-slate-800">{thirst}%</span>
            </div>
          </div>
        </div>

        {/* LIENZO CANVAS 3D A PANTALLA COMPLETA */}
        <div className="pet-canvas-container absolute inset-0 w-full h-full">

          {/* Animación flotante de comer */}
          <AnimatePresence>
            {isEating && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0, y: -50 }}
                animate={{ scale: [1, 1.4, 0.2], opacity: 1, y: [0, -20, 50] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1 }}
                className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-30"
              >
                <span className="text-8xl select-none filter drop-shadow-[3px_3px_0px_#1e293b]">{eatingFood}</span>
                <span className="text-2xl font-black text-yellow-300 mt-2 filter drop-shadow-[2px_2px_0px_#1e293b]">¡Ñam! 😋❤️</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textos flotantes de ganancia */}
          <div className="absolute inset-x-0 top-32 pointer-events-none flex flex-col items-center gap-2 z-30">
            {floatingTexts.map(t => (
              <div
                key={t.id}
                className="bg-yellow-300 text-slate-900 border-4 border-slate-800 rounded-2xl px-4 py-2 font-black text-sm shadow-[3px_3px_0px_0px_#1e293b] animate-bounce"
              >
                {t.text}
              </div>
            ))}
          </div>

          <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
            <ambientLight intensity={1.5} />
            <hemisphereLight skyColor="#FFFFFF" groundColor="#333333" intensity={1.0} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <directionalLight position={[-5, -10, -5]} intensity={0.8} />
            <pointLight position={[0, 2, 0]} intensity={0.5} distance={10} decay={2} />

            <OrbitControls
              enableDamping
              dampingFactor={0.25}
              enableZoom={false}
              minPolarAngle={Math.PI / 2}
              maxPolarAngle={Math.PI / 2}
            />
            <Suspense fallback={<Html center><p className="text-slate-800 font-bold text-lg">Cargando...</p></Html>}>
              {currentPet.modelPath && (
                <Model
                  path={currentPet.modelPath}
                  scale={finalPetScale}
                  position={finalPetPosition}
                  rotation={[0, Math.PI / 4, 0]}
                  innerRef={petModelRef}
                />
              )}
              {isAdjusterOpen && is3DAccessory && (
                <AccessoryModel
                  path={activeSkinMetadata.modelPath}
                  scale={finalAccScale}
                  position={finalAccPos}
                  rotation={currentAdjustments.rotation}
                  xRay={xRayPreview}
                />
              )}
              {!isAdjusterOpen && equippedItems.map(itemId => {
                const meta = CLOTHES_METADATA.find(c => c.id === itemId);
                if (!meta || !meta.modelPath) return null;

                const itemAdjusts = adjustments[itemId]?.[activePetId] || adjustments[itemId]?.['default'] || { scale: [1, 1, 1], position: [0, 0, 0], rotation: [0, 0, 0] };

                let finalScale = itemAdjusts.scale;
                let finalPos = itemAdjusts.position;
                let finalRot = itemAdjusts.rotation;

                if (itemId === 'skin_guitarra' && finalScale[0] === 1.0) {
                  finalScale = activePetId === '2' ? [0.0253, 0.0253, 0.0253] : [0.015, 0.015, 0.015];
                  finalPos = finalPos[0] === 0 ? (activePetId === '2' ? [0.765, -0.96, -0.12] : [0.45, -0.35, 0.25]) : finalPos;
                  finalRot = finalRot[0] === 0 ? (activePetId === '2' ? [360, 64, -3] : [15, 45, -35]) : finalRot;
                } else if (itemId === 'skin_violin' && finalScale[0] === 1.0) {
                  finalScale = activePetId === '2' ? [1.6646, 1.6646, 1.6646] : [1.1, 1.1, 1.1];
                  finalPos = finalPos[0] === 0 ? (activePetId === '2' ? [0.26, -0.753, 0.434] : [0.4, -0.3, 0.3]) : finalPos;
                  finalRot = finalRot[0] === 0 ? (activePetId === '2' ? [-109, -171, -226] : [-30, 45, -20]) : finalRot;
                } else if (itemId === 'skin_lentes' && finalScale[0] === 1.0) {
                  finalScale = [0.06, 0.06, 0.06];
                  finalPos = finalPos[0] === 0 ? (activePetId === '2' ? [0.075, -0.481, 0.242] : [0, 0.25, 0.35]) : finalPos;
                  finalRot = finalRot[0] === 0 ? (activePetId === '2' ? [0, 42, 0] : [0, 0, 0]) : finalRot;
                } else if (itemId === 'skin_lentes_vr' && finalScale[0] === 1.0) {
                  finalScale = activePetId === '2' ? [0.0748, 0.0748, 0.0748] : [0.05, 0.05, 0.05];
                  finalPos = finalPos[0] === 0 ? (activePetId === '2' ? [0.223, 0.25, 0.4] : [0, 0.25, 0.35]) : finalPos;
                  finalRot = finalRot[0] === 0 ? (activePetId === '2' ? [0, 42, 0] : [0, 0, 0]) : finalRot;
                } else if (itemId === 'skin_pulpito' && finalScale[0] === 1.0) {
                  finalScale = activePetId === '2' ? [0.4123, 0.4123, 0.4123] : [0.25, 0.25, 0.25];
                  finalPos = finalPos[0] === 0 ? (activePetId === '2' ? [0.56, -0.617, 0.691] : [0, -0.4, 0.35]) : finalPos;
                  finalRot = finalRot[0] === 0 ? (activePetId === '2' ? [0, -136, 0] : [0, 0, 0]) : finalRot;
                } else if (itemId === 'skin_figurita_pastor' && finalScale[0] === 1.0) {
                  finalScale = activePetId === '2' ? [0.4747, 0.4747, 0.4747] : [0.2, 0.2, 0.2];
                  finalPos = finalPos[0] === 0 ? (activePetId === '2' ? [1.07, -0.4, 0.25] : [0.35, -0.4, 0.25]) : finalPos;
                  finalRot = finalRot[0] === 0 ? (activePetId === '2' ? [0, 42, 0] : [0, 0, 0]) : finalRot;
                } else if (itemId === 'skin_bateria' && finalScale[0] === 1.0) {
                  finalScale = activePetId === '2' ? [0.1655, 0.1655, 0.1655] : [0.08, 0.08, 0.08];
                  finalPos = finalPos[0] === 0 ? (activePetId === '2' ? [0.4, -0.71, 0.83] : [0.6, -0.4, 0.1]) : finalPos;
                  finalRot = finalRot[0] === 0 ? (activePetId === '2' ? [0, -146, 0] : [0, -45, 0]) : finalRot;
                }

                // Multiplicar escala y sumar offset para accesorios en móvil si corresponde
                const finalAccScaleLocal = isMobile ? [finalScale[0] * 0.58, finalScale[1] * 0.58, finalScale[2] * 0.58] : finalScale;
                const finalAccPosLocal = isMobile ? [finalPos[0] * 0.58, finalPos[1] * 0.58, finalPos[2] * 0.58] : finalPos;

                return (
                  <AccessoryModel
                    key={itemId}
                    path={meta.modelPath}
                    scale={finalAccScaleLocal}
                    position={finalAccPosLocal}
                    rotation={finalRot}
                    xRay={false}
                  />
                );
              })}
            </Suspense>
          </Canvas>
        </div>

        {/* HUD INFERIOR: Alacena Carrusel minimalista */}
        <div className="w-full max-w-xs mx-auto bg-white/15 backdrop-blur-[2px] border-2 border-slate-800/60 rounded-xl p-1.5 pb-2.5 px-3 shadow-[2px_2px_0px_0px_#1e293b] z-10">
          {hasAnyFood ? (
            <div className="flex items-center justify-between gap-2 py-0.5">
              {availableFoods.length > 1 && (
                <button
                  onClick={() => setSelectedFoodIndex(prev => (prev === 0 ? availableFoods.length - 1 : prev - 1))}
                  className="bg-white hover:bg-yellow-100 border-2 border-slate-800 rounded-md p-1 text-slate-800 text-[8px] font-bold transition-all shadow-[1px_1px_0px_0px_#1e293b] active:scale-95"
                >
                  ◀
                </button>
              )}

              {availableFoods[selectedFoodIndex] && (() => {
                const foodId = availableFoods[selectedFoodIndex];
                const item = FOOD_METADATA[foodId];
                const qty = foodCounts[foodId];

                return (
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      onMouseDown={(e) => handleDragStart(foodId, e)}
                      onTouchStart={(e) => handleDragStart(foodId, e)}
                      onClick={() => executeFeed(foodId)}
                      className="relative w-9 h-9 bg-white/70 border-2 border-slate-800 rounded-lg flex items-center justify-center text-xl cursor-grab active:cursor-grabbing hover:scale-105 shadow-[1.5px_1.5px_0px_0px_#1e293b] select-none touch-none"
                    >
                      <span>{item.emoji}</span>
                      <span className="absolute -bottom-1 -right-1 bg-yellow-300 border border-slate-800 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black text-slate-800">
                        {qty}
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-700 mt-0.5">{item.nombre}</span>
                  </div>
                );
              })()}

              {availableFoods.length > 1 && (
                <button
                  onClick={() => setSelectedFoodIndex(prev => (prev === availableFoods.length - 1 ? 0 : prev + 1))}
                  className="bg-white hover:bg-yellow-100 border-2 border-slate-800 rounded-md p-1 text-slate-800 text-[8px] font-bold transition-all shadow-[1px_1px_0px_0px_#1e293b] active:scale-95"
                >
                  ▶
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-0.5">
              <p className="text-slate-500 font-bold text-[8px] mb-0.5">¡Alacena vacía! 🧺</p>
              <Link
                to="/tienda"
                className="inline-block bubbly-button bg-yellow-300 text-[8px] font-black text-slate-900 py-0.5 px-1.5"
              >
                🛒 Ir a la Tienda
              </Link>
            </div>
          )}
        </div>

        {/* Drawer del Armario Deslizable */}
        <AnimatePresence>
          {isArmarioOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white border-l-4 border-slate-800 z-50 shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col p-6 font-sans text-slate-800"
            >
              <div className="flex justify-between items-center mb-6 border-b-4 border-slate-800 pb-4">
                <h3 className="font-extrabold text-2xl text-slate-900 flex items-center gap-2">
                  👗 Mi Armario
                </h3>
                <button
                  onClick={() => setIsArmarioOpen(false)}
                  className="bg-red-200 border-3 border-slate-800 rounded-xl p-2 hover:bg-red-300 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Cuerpo del Armario */}
              <div className="flex-1 overflow-y-auto space-y-6">
                <div>
                  <h4 className="font-black text-md text-indigo-600 mb-3 select-none">🧢 Accesorios de Mascota</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {CLOTHES_METADATA.filter(c => c.tipo === 'skin').map(item => {
                      const isOwned = inventory.includes(item.id);
                      const isEquipped = equippedItems.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 border-3 border-slate-800 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-slate-50 ${!isOwned && 'opacity-60'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{item.emoji}</span>
                            <span className="font-extrabold text-sm text-slate-800">{item.nombre}</span>
                          </div>

                          {isOwned ? (
                            <button
                              onClick={() => handleEquipInDrawer(item.id)}
                              className={`bubbly-button text-xs font-black py-1.5 px-4 ${isEquipped
                                ? 'bg-emerald-400 text-slate-900 border-emerald-600'
                                : 'bg-white text-slate-800'
                                }`}
                            >
                              {isEquipped ? 'Puesto' : 'Equipar'}
                            </button>
                          ) : (
                            <Link
                              to="/tienda"
                              className="bg-slate-300 border-2 border-slate-800 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1"
                            >
                              🔒 Tienda
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-md text-teal-600 mb-3 select-none">🌲 Paisajes y Fondos</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {CLOTHES_METADATA.filter(c => c.tipo === 'fondo').map(item => {
                      const isOwned = inventory.includes(item.id) || item.id === 'bg_normal';
                      const isEquipped = equippedItems.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 border-3 border-slate-800 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-slate-50 ${!isOwned && 'opacity-60'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{item.emoji}</span>
                            <span className="font-extrabold text-sm text-slate-800">{item.nombre}</span>
                          </div>

                          {isOwned ? (
                            <button
                              onClick={() => handleEquipInDrawer(item.id)}
                              className={`bubbly-button text-xs font-black py-1.5 px-4 ${isEquipped
                                ? 'bg-emerald-400 text-slate-900 border-emerald-600'
                                : 'bg-white text-slate-800'
                                }`}
                            >
                              {isEquipped ? 'Puesto' : 'Colocar'}
                            </button>
                          ) : (
                            <Link
                              to="/tienda"
                              className="bg-slate-300 border-2 border-slate-800 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1"
                            >
                              🔒 Tienda
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clon flotante de arrastre de comida */}
        {isDragging && draggedFood && (
          <div
            className="fixed pointer-events-none text-5xl z-50 animate-pulse"
            style={{
              left: `${dragPosition.x}px`,
              top: `${dragPosition.y}px`,
              transform: 'translate(-50%, -50%)',
              filter: 'drop-shadow(3px 3px 0px #1e293b)'
            }}
          >
            {FOOD_METADATA[draggedFood].emoji}
          </div>
        )}

        {/* Pop-up de bienvenida */}
        {showWelcomePopup && (
          <div className="welcome-popup-overlay">
            <div className="welcome-popup-content border-4 border-slate-800 shadow-[8px_8px_0px_0px_#1e293b]">
              <h2 className="pet-title text-indigo-600 mb-4">🐾 ¡Cuida a tu Mascota! 🐾</h2>
              <p className="font-semibold text-slate-600 mb-6 text-sm leading-relaxed">
                ¡Esta es la mascota de tu clase! Puedes cambiarle el apodo, vestirla con accesorios de tu **Armario** 👗, o arrastrar alimentos de tu **Alacena** 🍉 hacia ella para alimentarla. ¡Diviértete!
              </p>
              <button
                onClick={() => setShowWelcomePopup(false)}
                className="welcome-popup-button bubbly-button bg-yellow-300 text-slate-900 font-bold"
              >
                ¡Comenzar!
              </button>
            </div>
          </div>
        )}

        {/* Panel de Calibración 3D de Accesorios (Para Desarrollador/Administrador) */}
        {isAdjusterOpen && (
          <div className="max-w-5xl w-full mx-auto mt-8 bg-slate-800 border-4 border-slate-950 text-white rounded-[2.5rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_#0f172a] relative z-20 font-sans">
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-4 border-slate-900 pb-4 mb-6">
              <div>
                <h3 className="font-extrabold text-2xl text-yellow-300 flex items-center gap-2">
                  🔧 Ajustador de Medidas 3D
                </h3>
                <p className="text-slate-400 text-xs mt-1">Calibra el tamaño y posición de cada accesorio para cada mascota.</p>
              </div>
              <button
                onClick={() => setIsAdjusterOpen(false)}
                className="bg-red-400 hover:bg-red-500 border-2 border-slate-950 rounded-xl px-4 py-2 font-bold text-sm text-white shadow-[2px_2px_0px_0px_#000] mt-4 sm:mt-0"
              >
                Cerrar Calibrador
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Controles de Selección */}
              <div className="md:col-span-4 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">1. Selecciona la Mascota:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(PET_DATA).filter(k => k !== 'default').map(key => (
                      <button
                        key={key}
                        onClick={() => setSelectedPetIdForAdjustment(key)}
                        className={`border-2 border-slate-950 rounded-xl p-2 text-xs font-black transition-all shadow-[2px_2px_0px_0px_#000] ${activePetId === key ? 'bg-yellow-300 text-slate-900 scale-105' : 'bg-slate-700 text-slate-200'
                          }`}
                      >
                        {PET_DATA[key].name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">2. Selecciona el Accesorio:</label>
                  <select
                    value={activeSkinId}
                    onChange={(e) => setPreviewAccessoryId(e.target.value)}
                    className="w-full bg-slate-700 border-2 border-slate-950 rounded-xl p-2.5 text-sm font-bold text-white shadow-[2px_2px_0px_0px_#000]"
                  >
                    {CLOTHES_METADATA.filter(c => c.modelPath).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.emoji} {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-900 border-2 border-slate-950 rounded-2xl p-4 space-y-3">
                  <h4 className="font-extrabold text-sm text-yellow-300 border-b border-slate-800 pb-1">Acciones rápidas</h4>
                  <button
                    onClick={handleResetAdjustments}
                    className="w-full bg-orange-400 hover:bg-orange-500 border-2 border-slate-950 rounded-xl py-2 px-4 font-bold text-xs shadow-[2px_2px_0px_0px_#000] text-slate-900"
                  >
                    Restablecer Valores Iniciales (Activo)
                  </button>
                  <button
                    onClick={handleResetAllToFactory}
                    className="w-full bg-red-400 hover:bg-red-500 border-2 border-slate-950 rounded-xl py-2 px-4 font-bold text-xs shadow-[2px_2px_0px_0px_#000] text-white"
                  >
                    Restablecer TODO (Borrar Caché)
                  </button>
                  <button
                    onClick={handleCopyJSON}
                    className="w-full bg-emerald-400 hover:bg-emerald-500 border-2 border-slate-950 rounded-xl py-2 px-4 font-bold text-xs shadow-[2px_2px_0px_0px_#000] text-slate-900"
                  >
                    Copiar JSON para el código
                  </button>
                </div>

                <div className="bg-slate-900 border-2 border-slate-950 rounded-2xl p-4 space-y-3">
                  <h4 className="font-extrabold text-sm text-yellow-300 border-b border-slate-800 pb-1">Visualización</h4>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={xRayPreview}
                      onChange={(e) => setXRayPreview(e.target.checked)}
                      className="w-4 h-4 rounded accent-teal-400 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-300">Modo Rayos-X (Ver encima)</span>
                  </label>
                </div>
              </div>

              {/* Sliders de Ajuste */}
              <div className="md:col-span-8 space-y-6 bg-slate-900/50 p-6 border-2 border-slate-950 rounded-3xl">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-300">Escala (Proporcional): {currentAdjustments.scale[0]}</span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="10"
                    step="0.001"
                    value={currentAdjustments.scale[0]}
                    onChange={(e) => handleAdjustmentChange('scale', 'all', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <h4 className="font-bold text-slate-300 text-sm mb-4">Posición (X, Y, Z):</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {['X (Izquierda/Derecha)', 'Y (Arriba/Abajo)', 'Z (Adelante/Atrás)'].map((label, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-400">{label}: {currentAdjustments.position[idx]}</span>
                        </div>
                        <input
                          type="range"
                          min="-3"
                          max="3"
                          step="0.001"
                          value={currentAdjustments.position[idx]}
                          onChange={(e) => handleAdjustmentChange('position', idx, parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <h4 className="font-bold text-slate-300 text-sm mb-4">Rotación (X, Y, Z en grados):</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {['Rotación X', 'Rotación Y', 'Rotación Z'].map((label, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-400">{label}: {currentAdjustments.rotation[idx]}°</span>
                        </div>
                        <input
                          type="range"
                          min="-360"
                          max="360"
                          step="1"
                          value={currentAdjustments.rotation[idx]}
                          onChange={(e) => handleAdjustmentChange('rotation', idx, parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PetScreen;
