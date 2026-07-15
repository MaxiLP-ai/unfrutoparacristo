import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaStore, FaCoins, FaCheckCircle, FaPalette } from 'react-icons/fa';

const TIENDA_ITEMS = [
  // --- Categoría: Frutos ---
  {
    id: 'verdes',
    nombre: 'Manzana Verde',
    costo: 300,
    tipo: 'fruto',
    imagen: '🍏',
    descripcion: 'Añade 1 manzana verde a tu cesta del árbol.',
  },
  {
    id: 'rojas',
    nombre: 'Manzana Roja',
    costo: 600,
    tipo: 'fruto',
    imagen: '🍎',
    descripcion: 'Añade 1 manzana roja a tu cesta del árbol.',
  },
  {
    id: 'doradas',
    nombre: 'Manzana Dorada',
    costo: 1800,
    tipo: 'fruto',
    imagen: '⭐',
    descripcion: 'Añade 1 manzana dorada a tu cesta del árbol.',
  },

  // --- Categoría: Accesorios ---
  {
    id: 'skin_gorro',
    nombre: 'Gorro Divertido',
    costo: 500,
    tipo: 'skin',
    imagen: '🎩',
    descripcion: 'Un elegante sombrero de copa para tu mascota.',
  },
  {
    id: 'skin_quico_gorro',
    nombre: 'Gorro de Quico',
    costo: 650,
    tipo: 'skin',
    imagen: '🧢',
    descripcion: 'Un colorido gorro de Quico para tu mascota.',
  },
  {
    id: 'skin_lentes',
    nombre: 'Lentes de Sol 3D',
    costo: 800,
    tipo: 'skin',
    imagen: '🕶️',
    descripcion: '¡Lentes de sol en 3D para tu mascota!',
  },
  {
    id: 'skin_lentes_vr',
    nombre: 'Lentes VR Box',
    costo: 1750,
    tipo: 'skin',
    imagen: '🥽',
    descripcion: '¡Lentes de realidad virtual VR Box!',
  },
  {
    id: 'skin_guitarra',
    nombre: 'Guitarra Acústica',
    costo: 1400,
    tipo: 'skin',
    imagen: '🎸',
    descripcion: '¡Una guitarra acústica para tocar alabanzas!',
  },
  {
    id: 'skin_violin',
    nombre: 'Violín Clásico',
    costo: 1200,
    tipo: 'skin',
    imagen: '🎻',
    descripcion: 'Un hermoso violín clásico para tu mascota.',
  },
  {
    id: 'skin_bateria',
    nombre: 'Batería Musical',
    costo: 2100,
    tipo: 'skin',
    imagen: '🥁',
    descripcion: '¡Una increíble batería para alabar con ritmo!',
  },
  {
    id: 'skin_pulpito',
    nombre: 'Púlpito de la Iglesia',
    costo: 2400,
    tipo: 'skin',
    imagen: '⛪',
    descripcion: '¡Un púlpito de iglesia para dar sermones!',
  },
  {
    id: 'skin_figurita_pastor',
    nombre: 'Figurita del Pastor',
    costo: 3500,
    tipo: 'skin',
    imagen: '👨‍💼',
    descripcion: '¡Exclusiva figurita coleccionable del pastor!',
  },

  // --- Categoría: Fondos ---
  {
    id: 'bg_normal',
    nombre: 'Fondo de la Habitación',
    costo: 0,
    tipo: 'fondo',
    imagen: '🏠',
    descripcion: 'El fondo por defecto de la habitación de tu mascota.',
  },
  {
    id: 'bg_bosque',
    nombre: 'Fondo del Bosque',
    costo: 250,
    tipo: 'fondo',
    imagen: '🌲',
    descripcion: 'Desbloquea el fondo del bosque mágico para tu mascota.',
  },
  {
    id: 'bg_playa',
    nombre: 'Fondo de Playa',
    costo: 250,
    tipo: 'fondo',
    imagen: '🏖️',
    descripcion: 'Desbloquea el fondo soleado de playa.',
  },

  // --- Categoría: Alimentos ---
  {
    id: 'food_watermelon',
    nombre: 'Sandía Fresca',
    costo: 10,
    tipo: 'food',
    imagen: '🍉',
    descripcion: 'Una deliciosa rebanada de sandía (+10 Hambre, +15 Sed).',
  },
  {
    id: 'food_cookie',
    nombre: 'Galleta de Chocolate',
    costo: 15,
    tipo: 'food',
    imagen: '🍪',
    descripcion: 'Una galleta recién horneada (+15 Hambre, +5 Sed).',
  },
  {
    id: 'food_donut',
    nombre: 'Dona Glaseada',
    costo: 20,
    tipo: 'food',
    imagen: '🍩',
    descripcion: 'Una dona con chispas de colores (+20 Hambre, +5 Sed).',
  },
  {
    id: 'food_icecream',
    nombre: 'Helado Cremoso',
    costo: 25,
    tipo: 'food',
    imagen: '🍦',
    descripcion: 'Un cono de helado de fresa y vainilla (+15 Hambre, +25 Sed).',
  },
  {
    id: 'food_pizza',
    nombre: 'Rebanada de Pizza',
    costo: 30,
    tipo: 'food',
    imagen: '🍕',
    descripcion: '¡La favorita de todos! (+35 Hambre, +10 Sed).',
  }
];

const TiendaPage = ({ makeAuthenticatedRequest }) => {
  const [coins, setCoins] = useState(0);
  const [ownedSkins, setOwnedSkins] = useState([]);
  const [equippedSkin, setEquippedSkin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener datos iniciales del perfil
  const fetchTiendaData = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`);
      if (response.ok) {
        const data = await response.json();
        setCoins(data.perfil?.alumno_monedas ?? 0);
        setOwnedSkins(data.perfil?.alumno_inventario_list ?? []);
        setEquippedSkin(data.perfil?.alumno_skin_equipada ?? null);
      }
    } catch (err) {
      console.error("Error al obtener datos de tienda:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTiendaData();
  }, [makeAuthenticatedRequest]);

  // Manejar compras
  const handleComprar = async (item) => {
    if (coins < item.costo) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'No tienes cristo monedas suficientes. ¡Juega a los minijuegos para ganar más!',
        confirmButtonColor: '#d33',
        customClass: { popup: 'cartoon-border rounded-3xl' }
      });
      return;
    }

    Swal.fire({
      title: '¿Confirmar compra?',
      text: `¿Quieres canjear ${item.costo} cristo monedas por "${item.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, comprar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      customClass: { popup: 'cartoon-border rounded-3xl' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/shop/comprar/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              item_id: item.id,
              item_tipo: item.tipo,
              costo: item.costo
            })
          });

          if (response.ok) {
            const data = await response.json();
            setCoins(data.total_monedas);
            if (data.inventario) setOwnedSkins(data.inventario);
            
            Swal.fire({
              icon: 'success',
              title: '¡Compra exitosa! 🎉',
              text: item.tipo === 'fruto' 
                ? `Se ha añadido 1 fruto ${item.id} a tu cesta.` 
                : item.tipo === 'food'
                ? `Compraste ${item.nombre}. ¡Ya puedes dárselo a tu mascota!`
                : `Desbloqueaste "${item.nombre}". ¡Ya puedes equiparlo!`,
              confirmButtonColor: '#10b981',
              customClass: { popup: 'cartoon-border rounded-3xl' }
            });
          } else {
            const errData = await response.json();
            Swal.fire('Error', errData.detail || 'Ocurrió un error en la compra.', 'error');
          }
        } catch (error) {
          console.error("Error al procesar compra:", error);
          Swal.fire('Error', 'Error de red.', 'error');
        }
      }
    });
  };

  // Equipar una skin o fondo
  const handleEquipar = async (itemId) => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/mascota/equipar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId })
      });

      if (response.ok) {
        const data = await response.json();
        setEquippedSkin(data.alumno_skin_equipada);
        const list = (data.alumno_skin_equipada || '').split(',').filter(Boolean);
        const isEquippedNow = list.includes(itemId);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: isEquippedNow ? '¡Equipado con éxito! 🎉' : 'Desequipado con éxito',
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        const errData = await response.json();
        Swal.fire('Error', errData.detail || 'No se pudo equipar.', 'error');
      }
    } catch (error) {
      console.error("Error al equipar:", error);
      Swal.fire('Error', 'Error de red.', 'error');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-indigo-50"><p className="text-xl">Cargando Tienda...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-yellow-100 pt-20 pb-10 px-4 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto">
        {/* Cabecera Tienda */}
        <div className="bg-white border-4 border-slate-800 rounded-3xl p-5 shadow-[6px_6px_0px_0px_#1e293b] flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎁</span>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-wide">Mercado de Recompensas</h1>
              <p className="text-slate-600 font-semibold text-sm">Canjea tus cristo monedas ganadas por fabulosas sorpresas.</p>
            </div>
          </div>
          <div className="bg-yellow-300 border-4 border-slate-800 rounded-2xl px-5 py-2 font-bold text-xl shadow-[3px_3px_0px_0px_#1e293b] flex items-center gap-2">
            <span>🪙</span>
            <span>{coins} Cristo Monedas</span>
          </div>
        </div>

        {/* Listado de Artículos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {TIENDA_ITEMS.map((item) => {
            const hasPurchased = ownedSkins.includes(item.id) || item.id === 'bg_normal';
            const equippedList = (equippedSkin || '').split(',').filter(Boolean);
            const isEquipped = equippedList.includes(item.id);

            return (
              <div 
                key={item.id} 
                className={`bg-white border-4 border-slate-800 rounded-3xl overflow-hidden shadow-[5px_5px_0px_0px_#1e293b] flex flex-col justify-between transition-transform duration-150 hover:-translate-y-1`}
              >
                {/* Cabecera del Item */}
                <div className="p-5 flex flex-col items-center text-center">
                  <span className="text-6xl my-4 select-none animate-float-slow">{item.imagen}</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{item.nombre}</h3>
                  <p className="text-slate-500 font-semibold text-xs leading-relaxed min-h-[36px]">{item.descripcion}</p>
                </div>

                {/* Footer/Acciones */}
                <div className="p-5 pt-0">
                  {item.tipo === 'fruto' || item.tipo === 'food' ? (
                    // Los frutos se pueden comprar ilimitadas veces
                    <button
                      onClick={() => handleComprar(item)}
                      className="w-full bubbly-button bg-yellow-300 py-2.5 text-slate-900 font-bold flex items-center justify-center gap-2"
                    >
                      <FaCoins /> {item.costo} Cristo Monedas
                    </button>
                  ) : hasPurchased ? (
                    // Skins/fondos compradas se pueden equipar o desequipar
                    <button
                      onClick={() => handleEquipar(item.id)}
                      className={`w-full bubbly-button py-2.5 font-bold flex items-center justify-center gap-2 ${
                        isEquipped 
                          ? 'bg-emerald-400 text-slate-900 border-emerald-600' 
                          : 'bg-white text-slate-700'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <FaCheckCircle /> Equipado
                        </>
                      ) : (
                        <>
                          <FaPalette /> Equipar
                        </>
                      )}
                    </button>
                  ) : (
                    // Skins/fondos no compradas
                    <button
                      onClick={() => handleComprar(item)}
                      className="w-full bubbly-button bg-yellow-300 py-2.5 text-slate-900 font-bold flex items-center justify-center gap-2"
                    >
                      <FaCoins /> {item.costo} Cristo Monedas
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TiendaPage;
