import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { 
  FaGamepad, FaTrophy, FaArrowLeft, FaPlay, FaUndo, FaArrowUp, 
  FaArrowDown, FaArrowRight, FaCoins 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

// --- Preguntas de Trivia ---
const TRIVIA_QUESTIONS = [
  { pregunta: "¿Quién construyó el Arca para salvar a los animales del diluvio?", opciones: ["Moisés", "Abraham", "Noé", "David"], correcta: 2 },
  { pregunta: "¿Cuál es el primer libro de la Biblia?", opciones: ["Éxodo", "Génesis", "Mateo", "Apocalipsis"], correcta: 1 },
  { pregunta: "¿Qué gigante fue vencido por el joven David con una honda?", opciones: ["Goliat", "Faraón", "Herodes", "Saúl"], correcta: 0 },
  { pregunta: "¿Cuántos discípulos escogió Jesús?", opciones: ["7", "10", "12", "40"], correcta: 2 },
  { pregunta: "¿Quién fue tragado por un gran pez por no querer predicar en Nínive?", opciones: ["Daniel", "Jonás", "Pedro", "Pablo"], correcta: 1 },
  { pregunta: "¿Quién recibió los Diez Mandamientos en tablas de piedra?", opciones: ["Abraham", "Noé", "Moisés", "Elías"], correcta: 2 },
  { pregunta: "¿Cuál es el último libro de la Biblia?", opciones: ["Mateo", "Génesis", "Apocalipsis", "Salmos"], correcta: 2 },
  { pregunta: "¿Qué discípulo negó a Jesús tres veces antes de que cantara el gallo?", opciones: ["Pedro", "Juan", "Judas", "Santiago"], correcta: 0 },
  { pregunta: "¿Cuál es el rey sabio que construyó el Templo de Jerusalén?", opciones: ["David", "Saúl", "Salomón", "Ezequías"], correcta: 2 },
  { pregunta: "¿Qué mar abrió Moisés para que el pueblo de Israel cruzara a salvo?", opciones: ["Mar Rojo", "Mar de Galilea", "Mar Muerto", "Mar Negro"], correcta: 0 }
];

export default function MinijuegosPage({ makeAuthenticatedRequest }) {
  const [activeGame, setActiveGame] = useState(null); 
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    const fetchMonedas = async () => {
      try {
        const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`);
        if (response.ok) {
          const data = await response.json();
          setCoins(data.perfil?.alumno_monedas ?? 0);
        }
      } catch (err) {
        console.error("Error al obtener monedas:", err);
      }
    };
    fetchMonedas();
  }, [makeAuthenticatedRequest]);

  const registrarGanancia = async (minijuego, puntos) => {
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/minijuegos/completar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minijuego, puntos }),
      });
      if (response.ok) {
        const data = await response.json();
        setCoins(data.total_monedas);
        return data.monedas_ganadas;
      }
    } catch (error) {
      console.error("Error al registrar monedas ganadas:", error);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 pt-24 lg:pt-12 pb-10 px-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera general */}
        <div className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[6px_6px_0px_0px_#0f172a] flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="bg-white hover:bg-slate-50 border-3 border-slate-900 rounded-2xl p-2.5 text-slate-800 hover:scale-105 active:scale-95 shadow-[2px_2px_0px_0px_#0f172a] transition-all flex items-center justify-center"
              title="Volver a Inicio"
            >
              <FaArrowLeft className="text-lg" />
            </Link>
            <span className="text-4xl select-none">🎮</span>
            <div className="text-left">
              <h1 className="text-2xl font-black text-slate-900 tracking-wide uppercase">Zona de Minijuegos</h1>
              <p className="text-slate-500 font-bold text-xs">¡Juega, diviértete y gana monedas para la tienda!</p>
            </div>
          </div>
          <div className="bg-yellow-300 border-4 border-slate-900 rounded-2xl px-5 py-2 font-black text-lg shadow-[3px_3px_0px_0px_#0f172a] flex items-center gap-2">
            <span>🪙</span>
            <span>{coins} Monedas</span>
          </div>
        </div>

        {/* Renderizado de juego activo o panel de selección */}
        {activeGame === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            {/* Juego 1: Atrapa Frutas */}
            <div className="bg-teal-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">🍎</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Atrapa Frutos</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Mueve la cesta para atrapar los frutos que caen. Velocidad progresiva y lenta.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('catcher')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 2: Memoria */}
            <div className="bg-pink-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">🧠</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Memoria</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Encuentra las parejas de cartas idénticas antes de agotar tus movimientos.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('memory')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 3: Trivia */}
            <div className="bg-amber-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">📖</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Trivia Bíblica</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Responde preguntas bíblicas y demuestra cuánto sabes de las Escrituras.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('trivia')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 4: Salto de fe */}
            <div className="bg-emerald-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">🐑</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Salto de Fe</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Haz que la ovejita salte los obstáculos a velocidad adaptada y lenta.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('salto_fe')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 5: Flappy Dove */}
            <div className="bg-sky-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">🕊️</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Paloma Mensajera</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Haz volar a la paloma. Desciende suavemente como pluma para mayor control.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('flappy_dove')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 6: David's Sling */}
            <div className="bg-purple-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">👦</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Honda de David</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Usa la honda de David para derribar a Goliat, esquivando sus proyectiles.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('david_sling')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 7: Jericho Breaker */}
            <div className="bg-red-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">🧱</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Muros de Jericó</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Derriba los ladrillos del muro de Jericó en una gran pantalla arcade.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('jericho')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 8: Serpiente de Bronce */}
            <div className="bg-indigo-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">🐍</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Serpiente de Bronce</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Guía a la serpiente en pantalla completa adaptable para recolectar escudos.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('snake')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 9: Math Talents */}
            <div className="bg-yellow-100 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">🧮</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Cálculo de Talentos</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Resuelve desafíos matemáticos veloces para multiplicar tus talentos.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('math')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

            {/* Juego 10: Velas del Templo */}
            <div className="bg-violet-200 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#0f172a] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6 text-left">
                <span className="text-5xl block mb-4">🎨</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Velas del Templo</h3>
                <p className="text-slate-700 font-bold text-xs leading-relaxed">Repite la secuencia de colores de las velas para iluminar el templo.</p>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => setActiveGame('simon')} className="w-full bubbly-button bg-white py-2.5 text-slate-900 text-sm font-black shadow-[2px_2px_0px_0px_#0f172a]">¡Jugar!</button>
              </div>
            </div>

          </div>
        ) : (
          <div>
            {activeGame === 'catcher' && <FruitCatcherGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('atrapa_frutas', pts)} />}
            {activeGame === 'memory' && <MemoryGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('memoria', pts)} />}
            {activeGame === 'trivia' && <TriviaGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('trivia', pts)} />}
            {activeGame === 'salto_fe' && <JumpingFaithGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('salto_fe', pts)} />}
            {activeGame === 'flappy_dove' && <FlappyDoveGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('flappy_dove', pts)} />}
            {activeGame === 'david_sling' && <DavidSlingGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('clicker', pts)} />}
            {activeGame === 'jericho' && <JerichoWallBreakerGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('jericho', pts)} />}
            {activeGame === 'snake' && <SerpienteBronceGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('snake', pts)} />}
            {activeGame === 'math' && <TalentsMathQuizGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('math', pts)} />}
            {activeGame === 'simon' && <SimonSaysTempleGame onBack={() => setActiveGame(null)} onSaveCoins={(pts) => registrarGanancia('simon', pts)} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================================================================
// FUNCIONES AUXILIARES PARA DIBUJAR TEXTO FLOTANTE DE IMPACTO
// ===================================================================
const drawFloatingTexts = (ctx, floatingTexts) => {
  return floatingTexts.map(ft => {
    const nextY = ft.y + ft.speedY;
    const nextOpacity = ft.opacity - (1 / ft.life);
    
    ctx.save();
    ctx.globalAlpha = Math.max(0, nextOpacity);
    ctx.fillStyle = ft.color;
    // Sombreado de texto para excelente visibilidad en cualquier fondo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.font = `bold ${ft.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, nextY);
    ctx.restore();

    if (nextOpacity <= 0) return null;
    return { ...ft, y: nextY, opacity: nextOpacity };
  }).filter(Boolean);
};

const createFloatingText = (list, x, y, text, color = '#22c55e', fontSize = 24) => {
  list.push({
    x,
    y,
    text,
    color,
    fontSize,
    opacity: 1.0,
    speedY: -1.2,
    life: 45 // dura 45 frames
  });
};

// ===================================================================
// JUEGO 1: ATRAPA FRUTOS
// ===================================================================
const FruitCatcherGame = ({ onBack, onSaveCoins }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const loopRef = useRef(null);
  const stateRef = useRef({
    basketX: 300,
    basketWidth: 80,
    fruits: [],
    floatingTexts: [],
    score: 0,
    lives: 3,
    spawnTimer: 0
  });

  const startGame = () => {
    stateRef.current = {
      basketX: 300,
      basketWidth: 80,
      fruits: [],
      floatingTexts: [],
      score: 0,
      lives: 3,
      spawnTimer: 0
    };
    setScore(0);
    setLives(3);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const logicalX = (relativeX / rect.width) * 600;
      state.basketX = Math.max(state.basketWidth / 2, Math.min(600 - state.basketWidth / 2, logicalX));
    };

    const handleTouchMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.touches[0].clientX - rect.left;
      const logicalX = (relativeX / rect.width) * 600;
      state.basketX = Math.max(state.basketWidth / 2, Math.min(600 - state.basketWidth / 2, logicalX));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / 600;
      const scaleY = canvas.height / 500;

      ctx.save();
      ctx.scale(scaleX, scaleY);

      // 1. Spawning progresivo y muy lento al principio
      state.spawnTimer++;
      const spawnInterval = Math.max(30, 65 - Math.floor(state.score / 3));
      if (state.spawnTimer > spawnInterval) {
        state.spawnTimer = 0;
        const types = ['verdes', 'rojas', 'doradas', 'bomba'];
        const emojis = ['🍏', '🍎', '⭐', '💣'];
        const typeIndex = Math.random() < 0.15 ? 3 : Math.floor(Math.random() * 3);
        
        const baseSpeed = 0.85 + (state.score * 0.04);
        const speed = Math.min(3.8, baseSpeed + Math.random() * 0.25);

        state.fruits.push({
          id: Math.random(),
          x: Math.random() * 540 + 30,
          y: 0,
          type: types[typeIndex],
          emoji: emojis[typeIndex],
          speed,
        });
      }

      // 2. Mover frutas y colisiones
      state.fruits = state.fruits.map(f => {
        const nextY = f.y + f.speed;
        
        ctx.font = '32px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(f.emoji, f.x, nextY);

        if (nextY >= 445) {
          if (Math.abs(f.x - state.basketX) < (state.basketWidth / 2 + 10)) {
            if (f.type === 'bomba') {
              state.lives = Math.max(0, state.lives - 1);
              setLives(state.lives);
              createFloatingText(state.floatingTexts, f.x, 420, '💥 -1 Vida', '#f43f5e', 24);
            } else {
              const points = f.type === 'doradas' ? 3 : 1;
              state.score += points;
              setScore(state.score);
              createFloatingText(
                state.floatingTexts, 
                f.x, 
                420, 
                f.type === 'doradas' ? '⭐ +3 Pts' : '+1 Pt', 
                f.type === 'doradas' ? '#fbbf24' : '#34d399', 
                24
              );
            }
            return null; 
          }
          
          if (f.type !== 'bomba') {
            state.lives = Math.max(0, state.lives - 1);
            setLives(state.lives);
            createFloatingText(state.floatingTexts, f.x, 475, '❌ -1 Vida', '#ef4444', 22);
          }
          return null;
        }
        return { ...f, y: nextY };
      }).filter(Boolean);

      // Dibujar cesta 🧺
      ctx.font = '46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🧺', state.basketX, 455);

      // 3. Dibujar textos flotantes
      state.floatingTexts = drawFloatingTexts(ctx, state.floatingTexts);

      ctx.restore();

      if (state.lives <= 0) {
        endGame(state.score);
      } else {
        loopRef.current = requestAnimationFrame(draw);
      }
    };

    loopRef.current = requestAnimationFrame(draw);

    const endGame = (finalScore) => {
      setIsPlaying(false);
      cancelAnimationFrame(loopRef.current);
      const coinsEarned = Math.floor(finalScore / 2);
      onSaveCoins(coinsEarned).then((monedas) => {
        Swal.fire({
          title: '¡Fin de la cosecha! 🧺',
          html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Atrapaste ${finalScore} frutas.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#6366f1'
        });
      });
    };

    return () => {
      cancelAnimationFrame(loopRef.current);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-50 bg-sky-100 overflow-hidden flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="flex gap-4 font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          <span>🍎 Puntos: {score}</span>
          <span>❤️ Vidas: {lives}</span>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center w-full">
        {!isPlaying ? (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
            <h3 className="text-3xl font-black mb-2 text-white">Atrapa los Frutos</h3>
            <p className="text-sm font-bold mb-6 text-slate-100 text-center max-w-sm">Arrastra la cesta. Con textos de impacto visual que muestran tus aciertos y errores.</p>
            <button onClick={startGame} className="bubbly-button bg-yellow-300 text-slate-900 px-6 py-3 text-lg font-black shadow-[3px_3px_0px_0px_#0f172a]">
              <FaPlay className="inline mr-2" /> Jugar
            </button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={340}
            height={360}
            className="bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-100 border-4 border-slate-900 rounded-[2.5rem] shadow-[5px_5px_0px_0px_#0f172a] w-full max-w-md h-[55vh] md:h-[65vh]"
          />
        )}
      </div>
    </div>
  );
};

// ===================================================================
// JUEGO 2: PAREJAS DE MEMORIA
// ===================================================================
const MemoryGame = ({ onBack, onSaveCoins }) => {
  const CARD_EMOJIS = ['🐱', '🦁', '🐰', '🍎', '🍇', '⭐', '🐶', '💎'];
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);

  const initGame = () => {
    const doubleList = [...CARD_EMOJIS, ...CARD_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(doubleList);
    setSelectedCards([]);
    setMatchedCount(0);
    setMoves(0);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (card) => {
    if (selectedCards.length === 2 || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c => c.id === card.id ? { ...c, isFlipped: true } : c);
    setCards(newCards);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      if (newSelected[0].emoji === newSelected[1].emoji) {
        setTimeout(() => {
          setCards(prevCards => prevCards.map(c => 
            c.emoji === card.emoji ? { ...c, isMatched: true } : c
          ));
          setMatchedCount(prev => {
            const nextCount = prev + 2;
            if (nextCount === CARD_EMOJIS.length * 2) {
              const reward = Math.max(10, 40 - Math.floor(moves * 0.8));
              onSaveCoins(reward).then((monedas) => {
                Swal.fire({
                  title: '¡Felicidades! 🎉🧠',
                  html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Parejas resueltas en <b>${moves} movimientos</b>.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
                  confirmButtonText: 'Excelente',
                  confirmButtonColor: '#10b981'
                });
              });
            }
            return nextCount;
          });
          setSelectedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prevCards => prevCards.map(c => 
            c.id === newSelected[0].id || c.id === newSelected[1].id 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-100 flex flex-col justify-between p-4 md:p-6 select-none overflow-y-auto font-sans">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="flex gap-4 font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          <span>🧠 Movimientos: {moves}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto my-auto flex-1 content-center">
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card)}
            className={`h-16 sm:h-20 flex items-center justify-center text-3xl font-bold border-4 border-slate-900 rounded-2xl cursor-pointer transition-all duration-200 shadow-[3px_3px_0px_0px_#0f172a] select-none ${
              card.isFlipped || card.isMatched 
                ? 'bg-white rotate-y-180' 
                : 'bg-gradient-to-r from-pink-400 to-indigo-400 text-white'
            }`}
          >
            {(card.isFlipped || card.isMatched) ? card.emoji : '❓'}
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <button onClick={initGame} className="bubbly-button bg-white px-6 py-2 border-3 border-slate-800 rounded-xl font-bold text-slate-800 shadow-[2px_2px_0px_0px_#0f172a]">
          Reiniciar
        </button>
      </div>
    </div>
  );
};

// ===================================================================
// JUEGO 3: TRIVIA BÍBLICA
// ===================================================================
const TriviaGame = ({ onBack, onSaveCoins }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (optionIndex) => {
    const isCorrect = optionIndex === TRIVIA_QUESTIONS[currentIdx].correcta;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '¡Correcto! 🌟', showConfirmButton: false, timer: 1000 });
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: `Incorrecto 😢 (Era: ${TRIVIA_QUESTIONS[currentIdx].opciones[TRIVIA_QUESTIONS[currentIdx].correcta]})`, showConfirmButton: false, timer: 1800 });
    }

    setTimeout(() => {
      if (currentIdx + 1 < TRIVIA_QUESTIONS.length) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setIsFinished(true);
        const finalAnswers = correctCount + (isCorrect ? 1 : 0);
        onSaveCoins(finalAnswers).then((monedas) => {
          Swal.fire({
            title: '¡Trivia Finalizada! 📖✨',
            html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Aciertos: ${finalAnswers} de ${TRIVIA_QUESTIONS.length} preguntas.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
            confirmButtonText: 'Súper',
            confirmButtonColor: '#6366f1'
          });
        });
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-amber-100 flex flex-col justify-between p-4 md:p-6 select-none overflow-y-auto font-sans">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          📖 Pregunta {currentIdx + 1} de {TRIVIA_QUESTIONS.length}
        </div>
      </div>

      {!isFinished ? (
        <div className="max-w-xl w-full mx-auto my-auto flex-1 flex flex-col justify-center">
          <h3 className="text-xl font-black text-slate-800 mb-6 leading-snug text-center">
            {TRIVIA_QUESTIONS[currentIdx].pregunta}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TRIVIA_QUESTIONS[currentIdx].opciones.map((opc, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="bubbly-button bg-white text-left p-4 hover:bg-yellow-100 text-slate-800 text-sm font-bold shadow-[3px_3px_0px_0px_#0f172a] active:translate-y-0.5"
              >
                {opc}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center max-w-sm mx-auto my-auto flex-1 flex flex-col justify-center">
          <span className="text-6xl block mb-4">🏆</span>
          <h3 className="text-2xl font-black text-slate-900 mb-2">¡Trivia Completada!</h3>
          <p className="font-bold text-slate-500 mb-6">Aciertos finales: {correctCount} / {TRIVIA_QUESTIONS.length}</p>
          <button onClick={() => { setCurrentIdx(0); setCorrectCount(0); setIsFinished(false); }} className="bubbly-button bg-white px-6 py-2 border-3 border-slate-800 font-bold text-slate-800 shadow-[2px_2px_0px_0px_#0f172a]">
            Jugar de nuevo
          </button>
        </div>
      )}
    </div>
  );
};

// ===================================================================
// JUEGO 4: SALTO DE FE
// ===================================================================
const JumpingFaithGame = ({ onBack, onSaveCoins }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const loopRef = useRef(null);
  const stateRef = useRef({
    playerY: 420,
    velocityY: 0,
    obstacles: [],
    floatingTexts: [],
    score: 0,
    lives: 3,
    spawnTimer: 0
  });

  const startGame = () => {
    stateRef.current = {
      playerY: 420,
      velocityY: 0,
      obstacles: [],
      floatingTexts: [],
      score: 0,
      lives: 3,
      spawnTimer: 0
    };
    setScore(0);
    setLives(3);
    setIsPlaying(true);
  };

  const triggerJump = () => {
    if (!isPlaying) return;
    const state = stateRef.current;
    if (state.playerY >= 418) {
      state.velocityY = -8.2; 
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / 600;
      const scaleY = canvas.height / 500;

      ctx.save();
      ctx.scale(scaleX, scaleY);

      // 1. Gravedad
      const gravity = 0.22;
      if (state.playerY < 420 || state.velocityY !== 0) {
        state.velocityY += gravity;
        state.playerY = Math.min(420, state.playerY + state.velocityY);
      }

      // 2. Obstáculos
      state.spawnTimer++;
      if (state.spawnTimer > 150) {
        state.spawnTimer = 0;
        const types = ['lobo', 'bomba'];
        const emojis = ['🐺', '💣'];
        const typeIdx = Math.random() < 0.25 ? 1 : 0;
        state.obstacles.push({
          id: Math.random(),
          x: 620,
          type: types[typeIdx],
          emoji: emojis[typeIdx],
          speed: 1.45 
        });
      }

      // Suelo verde
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 435, 600, 65);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 435, 600, 4);

      // 3. Mover y colisiones
      state.obstacles = state.obstacles.map(o => {
        const nextX = o.x - o.speed;
        
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(o.emoji, nextX, 420);

        // Colisión con la ovejita en X=100
        if (nextX > 75 && nextX < 125) {
          if (state.playerY > 375) {
            state.lives = Math.max(0, state.lives - 1);
            setLives(state.lives);
            createFloatingText(state.floatingTexts, 100, state.playerY - 30, '💥 -1 Vida', '#f43f5e', 24);
            return null;
          }
        }

        if (nextX <= 0) {
          state.score += 1;
          setScore(state.score);
          createFloatingText(state.floatingTexts, 100, 320, '+1 Obstáculo', '#34d399', 22);
          return null; 
        }

        return { ...o, x: nextX };
      }).filter(Boolean);

      // Dibujar ovejita 🐑
      ctx.font = '45px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐑', 100, state.playerY);

      // Dibujar textos flotantes
      state.floatingTexts = drawFloatingTexts(ctx, state.floatingTexts);

      ctx.restore();

      if (state.lives <= 0) {
        endGame(state.score);
      } else {
        loopRef.current = requestAnimationFrame(draw);
      }
    };

    loopRef.current = requestAnimationFrame(draw);

    const endGame = (finalScore) => {
      setIsPlaying(false);
      cancelAnimationFrame(loopRef.current);
      const coins = Math.max(2, finalScore * 4);
      onSaveCoins(coins).then((monedas) => {
        Swal.fire({
          title: '¡Fin de la carrera! 🐑💨',
          html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Esquivaste ${finalScore} obstáculos.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
          confirmButtonText: 'Genial',
          confirmButtonColor: '#10b981'
        });
      });
    };

    return () => cancelAnimationFrame(loopRef.current);
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-50 bg-emerald-100 overflow-hidden flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="flex gap-4 font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          <span>🏆 Puntos: {score}</span>
          <span>❤️ Vidas: {lives}</span>
        </div>
      </div>

      <div
        onClick={triggerJump}
        onTouchStart={triggerJump}
        className="flex-grow flex items-center justify-center w-full relative"
      >
        {!isPlaying ? (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center z-30">
            <span className="text-6xl mb-4 animate-bounce">🐑</span>
            <h3 className="text-3xl font-black mb-2 text-white">Salto de Fe</h3>
            <p className="text-sm font-bold mb-6 text-slate-100 max-w-sm">Salto suave y obstáculos muy lentos. Toca en cualquier parte de la pantalla para saltar.</p>
            <button onClick={startGame} className="bubbly-button bg-yellow-300 text-slate-900 px-6 py-3 text-lg font-black shadow-[3px_3px_0px_0px_#0f172a]">
              <FaPlay className="inline mr-2" /> Iniciar Juego
            </button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={340}
            height={360}
            className="bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-150 border-4 border-slate-900 rounded-[2.5rem] shadow-[5px_5px_0px_0px_#0f172a] w-full max-w-md h-[55vh] md:h-[65vh] cursor-pointer"
          />
        )}
      </div>
    </div>
  );
};

// ===================================================================
// JUEGO 5: PALOMA MENSAJERA
// ===================================================================
const FlappyDoveGame = ({ onBack, onSaveCoins }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  const loopRef = useRef(null);
  const stateRef = useRef({
    birdY: 250,
    velocityY: 0,
    pipes: [],
    floatingTexts: [],
    score: 0,
    spawnTimer: 0
  });

  const startGame = () => {
    stateRef.current = {
      birdY: 250,
      velocityY: 0,
      pipes: [],
      floatingTexts: [],
      score: 0,
      spawnTimer: 0
    };
    setScore(0);
    setIsPlaying(true);
  };

  const triggerFlap = () => {
    if (!isPlaying) return;
    stateRef.current.velocityY = -1.6; 
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / 600;
      const scaleY = canvas.height / 500;

      ctx.save();
      ctx.scale(scaleX, scaleY);

      // 1. Gravedad
      const gravity = 0.055;
      state.velocityY += gravity;
      state.birdY = Math.max(10, Math.min(490, state.birdY + state.velocityY));

      if (state.birdY >= 485 || state.birdY <= 15) {
        endGame(state.score);
        return;
      }

      // 2. Obstáculos
      state.spawnTimer++;
      if (state.spawnTimer > 130) {
        state.spawnTimer = 0;
        const gapSize = 175; 
        const minHeight = 60;
        const maxHeight = 500 - gapSize - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

        state.pipes.push({
          id: Math.random(),
          x: 620,
          topHeight,
          bottomHeight: 500 - gapSize - topHeight,
          passed: false
        });
      }

      // 3. Mover y colisiones de lianas
      let crashed = false;
      state.pipes = state.pipes.map(p => {
        const nextX = p.x - 1.1; 

        // Liana superior
        ctx.fillStyle = '#065f46';
        ctx.fillRect(nextX - 15, 0, 30, p.topHeight);
        ctx.fillStyle = '#047857';
        ctx.fillRect(nextX - 12, 0, 24, p.topHeight);
        
        // Liana inferior
        ctx.fillStyle = '#065f46';
        ctx.fillRect(nextX - 15, 500 - p.bottomHeight, 30, p.bottomHeight);
        ctx.fillStyle = '#047857';
        ctx.fillRect(nextX - 12, 500 - p.bottomHeight, 24, p.bottomHeight);

        // Colisión
        if (nextX > 80 && nextX < 120) {
          if (state.birdY - 12 < p.topHeight || state.birdY + 12 > (500 - p.bottomHeight)) {
            crashed = true;
          }
        }

        if (nextX <= 100 && !p.passed) {
          p.passed = true;
          state.score += 1;
          setScore(state.score);
          createFloatingText(state.floatingTexts, 100, state.birdY - 30, '🕊️ +1 Punto', '#34d399', 22);
        }

        return { ...p, x: nextX };
      }).filter(p => p.x > -40);

      // Dibujar Paloma 🕊️
      ctx.font = '38px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🕊️', 100, state.birdY);

      // Dibujar textos flotantes
      state.floatingTexts = drawFloatingTexts(ctx, state.floatingTexts);

      ctx.restore();

      if (crashed) {
        endGame(state.score);
      } else {
        loopRef.current = requestAnimationFrame(draw);
      }
    };

    loopRef.current = requestAnimationFrame(draw);

    const endGame = (finalScore) => {
      setIsPlaying(false);
      cancelAnimationFrame(loopRef.current);
      const coins = Math.max(1, finalScore * 5);
      onSaveCoins(coins).then((monedas) => {
        Swal.fire({
          title: '¡Vuelo finalizado! 🕊️🍂',
          html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Superaste ${finalScore} lianas.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#6366f1'
        });
      });
    };

    return () => cancelAnimationFrame(loopRef.current);
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-50 bg-sky-100 overflow-hidden flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          🕊️ Puntos: {score}
        </div>
      </div>

      <div
        onClick={triggerFlap}
        onTouchStart={triggerFlap}
        className="flex-grow flex items-center justify-center w-full relative"
      >
        {!isPlaying ? (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center z-30">
            <span className="text-6xl mb-4 animate-bounce">🕊️</span>
            <h3 className="text-3xl font-black mb-2 text-white">Paloma Mensajera</h3>
            <p className="text-sm font-bold mb-6 text-slate-100 max-w-sm">La paloma planea lento como una pluma. Toca en cualquier parte de la pantalla para aletear.</p>
            <button onClick={startGame} className="bubbly-button bg-yellow-300 text-slate-900 px-6 py-3 text-lg font-black shadow-[3px_3px_0px_0px_#0f172a]">
              <FaPlay className="inline mr-2" /> Iniciar Vuelo
            </button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={340}
            height={360}
            className="bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100 border-4 border-slate-900 rounded-[2.5rem] shadow-[5px_5px_0px_0px_#0f172a] w-full max-w-md h-[55vh] md:h-[65vh] cursor-pointer"
          />
        )}
      </div>
    </div>
  );
};

// ===================================================================
// JUEGO 6: LA HONDA DE DAVID CONTRA GOLIAT (VISUAL DAMAGE POPUPS -10HP)
// ===================================================================
const DavidSlingGame = ({ onBack, onSaveCoins }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bossHP, setBossHP] = useState(100);
  const [lives, setLives] = useState(3);
  
  const loopRef = useRef(null);
  const stateRef = useRef({
    davidX: 300,
    davidWidth: 50,
    bullets: [],       
    goliathX: 300,
    goliathDir: 1.0,
    goliathHP: 100,
    projectiles: [],   
    floatingTexts: [],
    spawnTimer: 0,
    score: 0,
    lives: 3,
    projectileSpeed: 1.45,
    projectileInterval: 85,
    rewardMultiplier: 1.0
  });

  const startGame = (selectedLevel) => {
    let speedMult = 0.95;
    let projSpeed = 1.25;
    let spawnRate = 95;
    let rewardMult = 1.0;

    if (selectedLevel === 'medio') {
      speedMult = 1.65;
      projSpeed = 2.15;
      spawnRate = 65;
      rewardMult = 1.4;
    } else if (selectedLevel === 'rapido') {
      speedMult = 2.45;
      projSpeed = 3.0;
      spawnRate = 40;
      rewardMult = 1.8;
    }

    stateRef.current = {
      davidX: 300,
      davidWidth: 50,
      bullets: [],
      goliathX: 300,
      goliathDir: speedMult,
      goliathHP: 100,
      projectiles: [],
      floatingTexts: [],
      spawnTimer: 0,
      score: 0,
      lives: 3,
      projectileSpeed: projSpeed,
      projectileInterval: spawnRate,
      rewardMultiplier: rewardMult
    };
    setScore(0);
    setBossHP(100);
    setLives(3);
    setIsPlaying(true);
  };

  const shootStone = () => {
    if (!isPlaying) return;
    const state = stateRef.current;
    state.bullets.push({
      x: state.davidX,
      y: 440,
      speed: 3.2
    });
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const logicalX = (relativeX / rect.width) * 600;
      state.davidX = Math.max(state.davidWidth / 2, Math.min(600 - state.davidWidth / 2, logicalX));
    };

    const handleTouchMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.touches[0].clientX - rect.left;
      const logicalX = (relativeX / rect.width) * 600;
      state.davidX = Math.max(state.davidWidth / 2, Math.min(600 - state.davidWidth / 2, logicalX));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / 600;
      const scaleY = canvas.height / 500;

      ctx.save();
      ctx.scale(scaleX, scaleY);

      // Dibujar a David 👦
      ctx.font = '38px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👦', state.davidX, 455);

      // Dibujar a Goliat 🗿
      ctx.font = '55px sans-serif';
      ctx.fillText('🗿', state.goliathX, 60);

      // Mover a Goliat
      state.goliathX += state.goliathDir;
      if (state.goliathX < 50 || state.goliathX > 550) {
        state.goliathDir = -state.goliathDir;
      }

      // Proyectiles Goliat
      state.spawnTimer++;
      if (state.spawnTimer > state.projectileInterval) {
        state.spawnTimer = 0;
        state.projectiles.push({
          x: state.goliathX,
          y: 75,
          speed: state.projectileSpeed
        });
      }

      // Piedras de David
      state.bullets = state.bullets.map(b => {
        const nextY = b.y - b.speed;
        ctx.font = '18px sans-serif';
        ctx.fillText('🪨', b.x, nextY);

        if (nextY < 75 && nextY > 20 && Math.abs(b.x - state.goliathX) < 32) {
          state.goliathHP = Math.max(0, state.goliathHP - 10);
          setBossHP(state.goliathHP);
          state.score += 15;
          setScore(state.score);
          
          createFloatingText(state.floatingTexts, state.goliathX, 35, '-10 HP 💥', '#ef4444', 28);
          createFloatingText(state.floatingTexts, state.goliathX + 35, 55, '+15 Puntos', '#fbbf24', 20);

          if (state.goliathHP <= 0) endGame(true, state.score);
          return null;
        }
        return { ...b, y: nextY };
      }).filter(Boolean);

      // Proyectiles de Goliat
      state.projectiles = state.projectiles.map(p => {
        const nextY = p.y + p.speed;
        ctx.font = '24px sans-serif';
        ctx.fillText('☄️', p.x, nextY);

        if (nextY > 430 && nextY < 470 && Math.abs(p.x - state.davidX) < 28) {
          state.lives = Math.max(0, state.lives - 1);
          setLives(state.lives);
          
          createFloatingText(state.floatingTexts, state.davidX, 420, '💥 -1 Vida', '#f43f5e', 24);

          if (state.lives <= 0) endGame(false, state.score);
          return null;
        }
        return { ...p, y: nextY };
      }).filter(Boolean);

      // Dibujar textos flotantes de impacto
      state.floatingTexts = drawFloatingTexts(ctx, state.floatingTexts);

      ctx.restore();

      if (state.lives > 0 && state.goliathHP > 0) {
        loopRef.current = requestAnimationFrame(draw);
      }
    };

    loopRef.current = requestAnimationFrame(draw);

    const endGame = (won, finalScore) => {
      setIsPlaying(false);
      cancelAnimationFrame(loopRef.current);
      const baseCoins = won ? 55 : Math.max(2, Math.floor(finalScore / 2));
      const coins = Math.min(60, Math.round(baseCoins * state.rewardMultiplier));
      onSaveCoins(coins).then((monedas) => {
        Swal.fire({
          title: won ? '¡Victoria! Goliat ha caído 🪨👑' : '¡Fin de la batalla! ⚔️',
          html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Puntos logrados: ${finalScore}<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#6366f1'
        });
      });
    };

    return () => {
      cancelAnimationFrame(loopRef.current);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-50 bg-purple-50 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="flex gap-3 font-bold text-xs md:text-sm text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a] items-center">
          <span>👦 Vidas: {lives}</span>
          <span className="h-4 w-px bg-slate-200" />
          <span>🗿 Goliat HP: {bossHP}%</span>
          <span className="h-4 w-px bg-slate-200" />
          <span>🏆 Puntos: {score}</span>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center w-full">
        {!isPlaying ? (
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 text-center max-w-sm shadow-[4px_4px_0px_0px_#0f172a] flex flex-col items-center">
            <span className="text-6xl mb-4 block">👦🪨</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">La Honda de David</h3>
            <p className="text-xs text-slate-500 font-bold mb-6">Elige la velocidad del gigante Goliat y lánzale piedras con tu honda. ¡Esquiva sus ataques!</p>
            
            <div className="space-y-3 w-full">
              <button onClick={() => startGame('lento')} className="w-full py-3 bg-emerald-400 hover:bg-emerald-350 border-3 border-slate-900 rounded-2xl text-slate-900 font-black shadow-[2.5px_2.5px_0px_0px_#0f172a] text-xs transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0f172a]">
                🟢 Nivel Lento
              </button>
              <button onClick={() => startGame('medio')} className="w-full py-3 bg-amber-400 hover:bg-amber-350 border-3 border-slate-900 rounded-2xl text-slate-900 font-black shadow-[2.5px_2.5px_0px_0px_#0f172a] text-xs transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0f172a]">
                🟡 Nivel Medio
              </button>
              <button onClick={() => startGame('rapido')} className="w-full py-3 bg-rose-400 hover:bg-rose-450 border-3 border-slate-900 rounded-2xl text-slate-900 font-black shadow-[2.5px_2.5px_0px_0px_#0f172a] text-xs transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0f172a]">
                🔴 Nivel Rápido
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <canvas
              ref={canvasRef}
              onClick={shootStone}
              width={340}
              height={360}
              className="bg-gradient-to-b from-indigo-900 to-indigo-950 border-4 border-slate-900 rounded-[2.5rem] shadow-[5px_5px_0px_0px_#0f172a] w-full h-[55vh] md:h-[65vh] cursor-crosshair animate-fade-in"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================================
// JUEGO 7: ROMPEBLOQUES JERICÓ
// ===================================================================
const JerichoWallBreakerGame = ({ onBack, onSaveCoins }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const loopRef = useRef(null);
  const gameRef = useRef({
    ballX: 300,
    ballY: 350,
    dx: 1.5,
    dy: -1.5,
    paddleX: 240,
    paddleWidth: 120,
    paddleHeight: 14,
    bricks: [],
    floatingTexts: [],
    score: 0,
    lives: 3
  });

  const initGame = () => {
    const bricks = [];
    const brickRowCount = 4;
    const brickColumnCount = 8;
    const brickWidth = 56;
    const brickHeight = 18;
    const brickPadding = 6;
    const brickOffsetTop = 45;
    const brickOffsetLeft = 50;

    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
      }
    }

    gameRef.current = {
      ballX: 300,
      ballY: 340,
      dx: 1.7,
      dy: -1.7,
      paddleX: 240,
      paddleWidth: 120,
      paddleHeight: 14,
      bricks,
      floatingTexts: [],
      score: 0,
      lives: 3,
      brickWidth,
      brickHeight,
      brickPadding,
      brickOffsetTop,
      brickOffsetLeft,
      brickRowCount,
      brickColumnCount
    };

    setScore(0);
    setLives(3);
  };

  const startGame = () => {
    initGame();
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = gameRef.current;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const logicalX = (relativeX / rect.width) * 600;
      state.paddleX = Math.max(0, Math.min(600 - state.paddleWidth, logicalX - state.paddleWidth / 2));
    };

    const handleTouchMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.touches[0].clientX - rect.left;
      const logicalX = (relativeX / rect.width) * 600;
      state.paddleX = Math.max(0, Math.min(600 - state.paddleWidth, logicalX - state.paddleWidth / 2));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / 600;
      const scaleY = canvas.height / 500;

      ctx.save();
      ctx.scale(scaleX, scaleY);

      // Dibujar bloques
      for (let c = 0; c < state.brickColumnCount; c++) {
        for (let r = 0; r < state.brickRowCount; r++) {
          const b = state.bricks[c][r];
          if (b.status === 1) {
            const brickX = c * (state.brickWidth + state.brickPadding) + state.brickOffsetLeft;
            const brickY = r * (state.brickHeight + state.brickPadding) + state.brickOffsetTop;
            b.x = brickX;
            b.y = brickY;
            ctx.beginPath();
            ctx.rect(brickX, brickY, state.brickWidth, state.brickHeight);
            ctx.fillStyle = r === 0 ? '#ef4444' : r === 1 ? '#f97316' : r === 2 ? '#eab308' : '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      // Dibujar esfera sagrada
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      ctx.closePath();

      // Dibujar trompeta pala
      ctx.beginPath();
      ctx.rect(state.paddleX, 480, state.paddleWidth, state.paddleHeight);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.closePath();

      // Colisiones bloques
      for (let c = 0; c < state.brickColumnCount; c++) {
        for (let r = 0; r < state.brickRowCount; r++) {
          const b = state.bricks[c][r];
          if (b.status === 1) {
            if (state.ballX > b.x && state.ballX < b.x + state.brickWidth && state.ballY > b.y && state.ballY < b.y + state.brickHeight) {
              state.dy = -state.dy;
              b.status = 0;
              state.score += 5;
              setScore(state.score);
              createFloatingText(state.floatingTexts, b.x + state.brickWidth / 2, b.y, '+5 Pts', '#fbbf24', 20);
              
              let allBroken = true;
              for (let col = 0; col < state.brickColumnCount; col++) {
                for (let row = 0; row < state.brickRowCount; row++) {
                  if (state.bricks[col][row].status === 1) allBroken = false;
                }
              }
              if (allBroken) endGame(true, state.score);
            }
          }
        }
      }

      // Colisiones límites
      if (state.ballX + state.dx > 592 || state.ballX + state.dx < 8) {
        state.dx = -state.dx;
      }
      if (state.ballY + state.dy < 8) {
        state.dy = -state.dy;
      } else if (state.ballY + state.dy > 472) {
        if (state.ballX > state.paddleX && state.ballX < state.paddleX + state.paddleWidth) {
          state.dy = -state.dy;
        } else if (state.ballY + state.dy > 492) {
          state.lives = Math.max(0, state.lives - 1);
          setLives(state.lives);
          createFloatingText(state.floatingTexts, state.ballX, 460, '💥 -1 Vida', '#ef4444', 24);

          if (state.lives <= 0) {
            endGame(false, state.score);
            return;
          } else {
            state.ballX = 300;
            state.ballY = 340;
            state.dx = 1.7;
            state.dy = -1.7;
            state.paddleX = 240;
          }
        }
      }

      state.ballX += state.dx;
      state.ballY += state.dy;

      // Dibujar textos flotantes
      state.floatingTexts = drawFloatingTexts(ctx, state.floatingTexts);

      ctx.restore();

      if (state.lives > 0) {
        loopRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    const endGame = (won, finalScore) => {
      setIsPlaying(false);
      cancelAnimationFrame(loopRef.current);
      const coins = Math.max(2, Math.floor(finalScore / 2.2));
      onSaveCoins(coins).then((monedas) => {
        Swal.fire({
          title: won ? '¡Murallas derribadas! 🎺🧱' : '¡Fin del juego! 🧱',
          html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Derribaste muros sumando ${finalScore} pts.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
          confirmButtonText: 'Genial',
          confirmButtonColor: '#6366f1'
        });
      });
    };

    return () => {
      cancelAnimationFrame(loopRef.current);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-50 bg-red-50 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="flex gap-4 font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          <span>🧱 Puntos: {score}</span>
          <span>❤️ Vidas: {lives}</span>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center w-full">
        {!isPlaying ? (
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 text-center max-w-sm shadow-[4px_4px_0px_0px_#0f172a]">
            <span className="text-6xl mb-4 block">🎺🧱</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Muros de Jericó</h3>
            <p className="text-xs text-slate-500 font-bold mb-6">Destruye la muralla antes de perder tus vidas. Arrastra el dedo para mover la pala inferior.</p>
            <button onClick={startGame} className="bubbly-button bg-red-400 text-slate-900 py-3 px-6 font-black text-sm shadow-[2px_2px_0px_0px_#0f172a]">
              ¡Derribar Muro!
            </button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={340}
            height={360}
            className="bg-orange-50 border-4 border-slate-900 rounded-[2.5rem] shadow-[5px_5px_0px_0px_#0f172a] w-full max-w-md h-[55vh] md:h-[65vh]"
          />
        )}
      </div>
    </div>
  );
};

// ===================================================================
// JUEGO 8: SERPIENTE DE BRONCE
// ===================================================================
const SerpienteBronceGame = ({ onBack, onSaveCoins }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  const loopRef = useRef(null);
  const stateRef = useRef({
    snake: [[5, 8], [5, 9]],
    food: [8, 4],
    dir: [0, -1],
    floatingTexts: [],
    score: 0,
    gridSize: 18
  });

  const handleStart = () => {
    stateRef.current = {
      snake: [[5, 8], [5, 9]],
      food: [8, 4],
      dir: [0, -1],
      floatingTexts: [],
      score: 0,
      gridSize: 18
    };
    setScore(0);
    setIsPlaying(true);
  };

  const handleDir = (newDir) => {
    const state = stateRef.current;
    if ((newDir[0] !== 0 && state.dir[0] === 0) || (newDir[1] !== 0 && state.dir[1] === 0)) {
      state.dir = newDir;
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    let lastTick = 0;
    const tickInterval = 225; 

    const spawnFood = (currentSnake) => {
      let newFood;
      while (true) {
        newFood = [Math.floor(Math.random() * state.gridSize), Math.floor(Math.random() * state.gridSize)];
        let onSnake = false;
        for (const segment of currentSnake) {
          if (segment[0] === newFood[0] && segment[1] === newFood[1]) onSnake = true;
        }
        if (!onSnake) break;
      }
      state.food = newFood;
    };

    const draw = (timestamp) => {
      if (!lastTick) lastTick = timestamp;
      const elapsed = timestamp - lastTick;

      if (elapsed > tickInterval) {
        lastTick = timestamp;

        const head = state.snake[0];
        const nextHead = [head[0] + state.dir[0], head[1] + state.dir[1]];

        if (nextHead[0] < 0 || nextHead[0] >= state.gridSize || nextHead[1] < 0 || nextHead[1] >= state.gridSize) {
          endGame(state.score);
          return;
        }

        for (const segment of state.snake) {
          if (segment[0] === nextHead[0] && segment[1] === nextHead[1]) {
            endGame(state.score);
            return;
          }
        }

        const newSnake = [nextHead, ...state.snake];
        if (nextHead[0] === state.food[0] && nextHead[1] === state.food[1]) {
          state.score += 10;
          setScore(state.score);
          
          // Crear texto flotante al comer escudo
          const cellSize = canvas.width / state.gridSize;
          createFloatingText(
            state.floatingTexts, 
            state.food[0] * cellSize + cellSize / 2, 
            state.food[1] * cellSize, 
            '🛡️ +10 Pts', 
            '#fbbf24', 
            22
          );

          spawnFood(newSnake);
        } else {
          newSnake.pop();
        }
        state.snake = newSnake;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cellSize = canvas.width / state.gridSize;

      // Dibujar comida 🛡️
      ctx.font = `${cellSize * 0.9}px serif`;
      ctx.textBaseline = 'top';
      ctx.fillText('🛡️', state.food[0] * cellSize, state.food[1] * cellSize);

      // Dibujar serpiente
      state.snake.forEach((segment, idx) => {
        ctx.fillStyle = idx === 0 ? '#047857' : '#10b981';
        ctx.strokeStyle = '#065f46';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(segment[0] * cellSize + 1, segment[1] * cellSize + 1, cellSize - 2, cellSize - 2, 4);
        ctx.fill();
        ctx.stroke();
      });

      // Dibujar textos flotantes de impacto
      state.floatingTexts = drawFloatingTexts(ctx, state.floatingTexts);

      loopRef.current = requestAnimationFrame(draw);
    };

    loopRef.current = requestAnimationFrame(draw);

    const endGame = (finalScore) => {
      setIsPlaying(false);
      cancelAnimationFrame(loopRef.current);
      const coins = Math.max(1, Math.floor(finalScore / 5));
      onSaveCoins(coins).then((monedas) => {
        Swal.fire({
          title: '¡Fin de la caminata! 🏜️🐍',
          html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Escudos recolectados: ${finalScore / 10}.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#6366f1'
        });
      });
    };

    return () => cancelAnimationFrame(loopRef.current);
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-50 bg-indigo-50 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          🐍 Puntos: {score}
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center gap-4 w-full">
        {!isPlaying ? (
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 text-center max-w-sm shadow-[4px_4px_0px_0px_#0f172a]">
            <span className="text-6xl mb-4 block">🐍🛡️</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Serpiente de Bronce</h3>
            <p className="text-xs text-slate-500 font-bold mb-6">Guía a la serpiente en pantalla completa. Recolecta los escudos protectores en el desierto.</p>
            <button onClick={handleStart} className="bubbly-button bg-indigo-400 text-slate-900 py-3 px-6 font-black text-sm shadow-[2px_2px_0px_0px_#0f172a]">
              ¡Empezar!
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md flex flex-col items-center gap-4">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="bg-amber-50 border-4 border-slate-900 rounded-[2.5rem] shadow-[5px_5px_0px_0px_#0f172a] w-full aspect-square"
            />

            {/* Controles para Móviles */}
            <div className="grid grid-cols-3 gap-2 w-36">
              <div />
              <button onClick={() => handleDir([0, -1])} className="p-3 bg-white border-3 border-slate-900 rounded-xl shadow-md font-bold text-slate-800">▲</button>
              <div />
              <button onClick={() => handleDir([-1, 0])} className="p-3 bg-white border-3 border-slate-900 rounded-xl shadow-md font-bold text-slate-800">◀</button>
              <div />
              <button onClick={() => handleDir([1, 0])} className="p-3 bg-white border-3 border-slate-900 rounded-xl shadow-md font-bold text-slate-800">▶</button>
              <div />
              <button onClick={() => handleDir([0, 1])} className="p-3 bg-white border-3 border-slate-900 rounded-xl shadow-md font-bold text-slate-800">▼</button>
              <div />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================================
// JUEGO 9: CÁLCULO DE TALENTOS
// ===================================================================
const TalentsMathQuizGame = ({ onBack, onSaveCoins }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [round, setRound] = useState(0);

  const generateEquation = () => {
    const isMult = Math.random() < 0.35; 
    let a, b, correct;
    if (isMult) {
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 7) + 2;
      correct = a * b;
    } else {
      a = Math.floor(Math.random() * 45) + 5;
      b = Math.floor(Math.random() * 40) + 5;
      correct = a + b;
    }

    setNumA(a);
    setNumB(b);
    setCorrectAnswer(correct);

    const wrong1 = correct + (Math.random() < 0.5 ? 5 : -3);
    const wrong2 = correct + (Math.random() < 0.5 ? 10 : -7);
    const setOfOpts = Array.from(new Set([correct, wrong1, wrong2])).sort(() => Math.random() - 0.5);
    setOptions(setOfOpts);
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setRound(1);
    generateEquation();
  };

  const handleSelectOption = (opt) => {
    if (opt === correctAnswer) {
      setScore(prev => prev + 10);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '¡Correcto! 🪙', showConfirmButton: false, timer: 1000 });
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: '¡Incorrecto! 😢', showConfirmButton: false, timer: 1000 });
    }

    if (round < 6) {
      setRound(prev => prev + 1);
      generateEquation();
    } else {
      setIsPlaying(false);
      const coins = Math.max(2, Math.floor((score + (opt === correctAnswer ? 10 : 0)) / 1.5));
      onSaveCoins(coins).then((monedas) => {
        Swal.fire({
          title: '¡Cálculo Finalizado! 🧮',
          html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Obtuviste ${score + (opt === correctAnswer ? 10 : 0)} puntos.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
          confirmButtonText: 'Amén',
          confirmButtonColor: '#6366f1'
        });
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-yellow-50 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          🧮 Ronda: {round}/6
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center">
        {!isPlaying ? (
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 text-center max-w-sm shadow-[4px_4px_0px_0px_#0f172a]">
            <span className="text-6xl mb-4 block">🧮</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Multiplicar Talentos</h3>
            <p className="text-xs text-slate-500 font-bold mb-6">Resuelve sumas y multiplicaciones bíblicas rápidas antes de que termine el tiempo.</p>
            <button onClick={startGame} className="bubbly-button bg-yellow-300 text-slate-900 py-3 px-6 font-black text-sm shadow-[2px_2px_0px_0px_#0f172a]">
              ¡Empezar Prueba!
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 md:p-8 text-center shadow-[5px_5px_0px_0px_#0f172a]">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ecuación de los Talentos</p>
            <h3 className="text-4xl font-black text-slate-900 mb-8 leading-snug">
              {numA} {numA * numB === correctAnswer ? '×' : '+'} {numB} = ?
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {options.map((opt, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectOption(opt)}
                  className="py-4 bg-slate-50 hover:bg-yellow-100 border-3 border-slate-800 rounded-2xl text-xl font-black text-slate-800 shadow-[3px_3px_0px_0px_#0f172a] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0f172a] transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================================
// JUEGO 10: VELAS DEL TEMPLO
// ===================================================================
const SimonSaysTempleGame = ({ onBack, onSaveCoins }) => {
  const COLORS = ['🔴', '🔵', '🟢', '🟡'];
  const BG_COLORS = ['bg-rose-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400'];
  const FLASH_COLORS = ['bg-rose-200', 'bg-blue-200', 'bg-emerald-200', 'bg-amber-200'];

  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [activeLamp, setActiveLamp] = useState(null); 
  const [pattern, setPattern] = useState([]);
  const [userPattern, setUserPattern] = useState([]);
  
  const playPattern = async (currentPattern) => {
    for (let i = 0; i < currentPattern.length; i++) {
      const colorIdx = currentPattern[i];
      await new Promise(r => setTimeout(r, 450));
      setActiveLamp(colorIdx);
      await new Promise(r => setTimeout(r, 450));
      setActiveLamp(null);
    }
  };

  const startNextRound = async (existingPattern = []) => {
    const nextPattern = [...existingPattern, Math.floor(Math.random() * 4)];
    setPattern(nextPattern);
    setUserPattern([]);
    await playPattern(nextPattern);
  };

  const handleStart = () => {
    setIsPlaying(true);
    setScore(0);
    startNextRound([]);
  };

  const handleLampClick = async (colorIdx) => {
    if (!isPlaying) return;
    setActiveLamp(colorIdx);
    setTimeout(() => setActiveLamp(null), 250);

    const nextUserPattern = [...userPattern, colorIdx];
    setUserPattern(nextUserPattern);

    const currentStep = nextUserPattern.length - 1;
    if (colorIdx !== pattern[currentStep]) {
      setIsPlaying(false);
      const coins = Math.max(1, score * 5);
      onSaveCoins(coins).then((monedas) => {
        Swal.fire({
          title: '¡Velas apagadas! 🕯️🍂',
          html: `<div style="font-family:'Fredoka'; font-size:1.15rem;">Iluminaste ${score} velas seguidas.<br/>¡Ganaste <b>🪙 ${monedas} monedas</b>!</div>`,
          confirmButtonText: 'Genial',
          confirmButtonColor: '#6366f1'
        });
      });
      return;
    }

    if (nextUserPattern.length === pattern.length) {
      setScore(prev => prev + 1);
      setTimeout(() => {
        startNextRound(pattern);
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-violet-50 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="bubbly-button bg-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
          <FaArrowLeft /> Salir
        </button>
        <div className="font-bold text-lg text-slate-800 bg-white border-3 border-slate-900 rounded-2xl px-4 py-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
          🕯️ Velas: {score}
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center">
        {!isPlaying ? (
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 text-center max-w-sm shadow-[4px_4px_0px_0px_#0f172a]">
            <span className="text-6xl mb-4 block">🕯️</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Velas del Templo</h3>
            <p className="text-xs text-slate-500 font-bold mb-6">Memoriza el orden de encendido de las velas litúrgicas y repítelo con exactitud.</p>
            <button onClick={handleStart} className="bubbly-button bg-yellow-300 text-slate-900 py-3 px-6 font-black text-sm shadow-[2px_2px_0px_0px_#0f172a]">
              ¡Encender Velas!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-60 h-60">
            {COLORS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleLampClick(index)}
                className={`w-full h-full rounded-3xl border-4 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0f172a] transition-all flex items-center justify-center text-4xl ${
                  activeLamp === index ? FLASH_COLORS[index] : BG_COLORS[index]
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
