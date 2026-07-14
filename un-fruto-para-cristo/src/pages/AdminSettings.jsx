import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Shield, Users, Award, BookOpen, Coins, ArrowRight, Sparkles, Settings
} from 'lucide-react';

export default function AdminSettings({ makeAuthenticatedRequest }) {
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [selectedClass, setSelectedClass] = useState('all');
  const [rewardAmount, setRewardAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [reason, setReason] = useState('Recompensa especial del súper administrador');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar estadísticas globales
      const statsRes = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/superadmin/tools/`);
      // 2. Cargar clases
      const clasesRes = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/clases/`);

      if (statsRes.ok && clasesRes.ok) {
        const statsData = await statsRes.json();
        const clasesData = await clasesRes.json();
        setStats(statsData);
        setClasses(clasesData);
      } else {
        throw new Error('Fallo al obtener datos administrativos del backend.');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudieron cargar las herramientas de súper administrador.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [makeAuthenticatedRequest]);

  const handlePresetCoins = (amount) => {
    setRewardAmount(amount);
    setCustomAmount('');
  };

  const handleCustomCoinsChange = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    setRewardAmount(val ? Number(val) : 0);
  };

  const handleGrantCoins = async (e) => {
    e.preventDefault();
    const finalAmount = customAmount ? Number(customAmount) : rewardAmount;
    if (finalAmount <= 0) {
      Swal.fire('Cantidad Inválida', 'Por favor ingresa una cantidad de monedas mayor a 0.', 'warning');
      return;
    }

    try {
      const res = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/superadmin/tools/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'award_coins',
          clase_id: selectedClass,
          cantidad: finalAmount,
          motivo: reason
        })
      });

      if (res.ok) {
        const data = await res.json();
        Swal.fire({
          title: '✨ ¡Premio Otorgado! ✨',
          text: data.detail || `Se asignaron ${finalAmount} monedas correctamente.`,
          icon: 'success',
          confirmButtonColor: '#6366f1'
        });
        // Recargar datos
        fetchAdminData();
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Error en la petición.');
      }
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo realizar la transacción.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-100">
        <p className="text-xl font-bold text-slate-800 animate-pulse">Cargando Herramientas de Administrador...</p>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap" rel="stylesheet" />
      
      <style>{`
        .admin-page-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #faf5ff, #f3e8ff, #e0e7ff);
          font-family: 'Fredoka', sans-serif;
          padding-bottom: 5rem;
        }
        .chunky-admin-card {
          background: #ffffff;
          border: 4px solid #0f172a;
          border-radius: 2rem;
          box-shadow: 6px 6px 0px 0px #0f172a;
        }
        .admin-title-shadow {
          color: #ffffff;
          text-shadow: 3.5px 3.5px 0px #0f172a;
          -webkit-text-stroke: 1.5px #0f172a;
        }
      `}</style>

      <div className="admin-page-bg p-6 lg:p-12 pt-24 lg:pt-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black admin-title-shadow flex items-center justify-center gap-2">
              🛡️ Herramientas de Superadmin
            </h1>
            <p className="text-slate-500 font-bold text-sm mt-2">
              Gestión global del sistema, estadísticas de la iglesia y distribución de recompensas.
            </p>
          </header>

          {/* Estadísticas de Administración */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border-3 border-slate-900 p-4 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
              <Users className="text-indigo-500 mb-2" size={24} />
              <p className="text-[10px] font-black text-slate-400 uppercase">Usuarios Totales</p>
              <p className="text-2xl font-black text-slate-800">{stats?.total_usuarios}</p>
            </div>
            
            <div className="bg-white border-3 border-slate-900 p-4 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
              <Award className="text-indigo-500 mb-2" size={24} />
              <p className="text-[10px] font-black text-slate-400 uppercase">Alumnos Activos</p>
              <p className="text-2xl font-black text-slate-800">{stats?.total_alumnos}</p>
            </div>

            <div className="bg-white border-3 border-slate-900 p-4 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
              <BookOpen className="text-indigo-500 mb-2" size={24} />
              <p className="text-[10px] font-black text-slate-400 uppercase">Profesores</p>
              <p className="text-2xl font-black text-slate-800">{stats?.total_profesores}</p>
            </div>

            <div className="bg-white border-3 border-slate-900 p-4 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
              <Coins className="text-indigo-500 mb-2" size={24} />
              <p className="text-[10px] font-black text-slate-400 uppercase">Promedio Monedas</p>
              <p className="text-2xl font-black text-slate-800">{stats?.promedio_monedas} 🪙</p>
            </div>
          </section>

          {/* Formulario de Recompensas Masivas */}
          <section className="chunky-admin-card p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
              🪙 Otorgar Monedas en Lote
            </h2>
            <p className="text-slate-500 text-xs font-bold mb-6">
              Elige una clase o premia a todos los alumnos a la vez para motivarlos a aprender.
            </p>

            <form onSubmit={handleGrantCoins} className="space-y-5">
              
              {/* Clase a Recompensar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Destinatarios (Clase)</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border-3 border-slate-800 rounded-xl font-bold text-slate-800 focus:outline-none bg-slate-50"
                >
                  <option value="all">⭐ Todos los Alumnos del Sistema</option>
                  {classes.map(c => (
                    <option key={c.clase_id} value={c.clase_id}>🎒 {c.clase_nombre}</option>
                  ))}
                </select>
              </div>

              {/* Cantidad de Monedas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Cantidad de Monedas</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetCoins(amt)}
                      className={`py-2 px-3 border-3 font-bold rounded-xl text-xs transition-all shadow-[2px_2px_0px_0px_#0f172a] active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_0px_#0f172a] ${
                        rewardAmount === amt && !customAmount
                          ? 'bg-yellow-300 text-slate-900 border-slate-900' 
                          : 'bg-white text-slate-700 border-slate-800'
                      }`}
                    >
                      +{amt} 🪙
                    </button>
                  ))}
                </div>
                
                {/* Cantidad Personalizada */}
                <input
                  type="number"
                  min="1"
                  value={customAmount}
                  onChange={handleCustomCoinsChange}
                  placeholder="O escribe una cantidad personalizada (Ej: 150)"
                  className="w-full p-3 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none"
                />
              </div>

              {/* Motivo de la recompensa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Motivo / Razón de la Recompensa</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Recompensa por asistencia perfecta..."
                  className="w-full p-3 border-3 border-slate-800 rounded-xl text-sm font-semibold focus:outline-none"
                  required
                />
              </div>

              {/* Botón Guardar */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bubbly-button bg-indigo-400 hover:bg-indigo-500 border-slate-900 text-slate-900 py-3.5 font-extrabold text-sm shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0f172a] transition-all"
                >
                  <Sparkles size={16} /> Otorga Monedas a la Clase
                </button>
              </div>

            </form>
          </section>

          {/* Más Configuraciones del Sistema */}
          <section className="bg-slate-50 border-3 border-slate-900 p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-1">
                <Settings size={20} className="text-slate-600 animate-spin-slow" /> Configuraciones Básicas
              </h3>
              <p className="text-slate-500 text-xs font-bold">
                Para editar nombres de clases o edades de referencia, utiliza la opción "Configurar Clase" en el Panel de Control.
              </p>
            </div>
            <button
              onClick={() => Swal.fire('Información', 'Para modificar clases y profesores principales, utiliza las herramientas del Panel Docente interactivo.', 'info')}
              className="p-3 bg-slate-200 border-2 border-slate-800 hover:bg-slate-300 rounded-xl active:translate-y-0.5"
            >
              <ArrowRight size={18} />
            </button>
          </section>

        </div>
      </div>
    </>
  );
}
