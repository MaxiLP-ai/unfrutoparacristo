import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaUsers, FaChartLine, FaBible, FaSeedling, 
  FaChevronLeft, FaChevronRight, FaPlayCircle, 
  FaCalendarAlt, FaClock, FaGamepad, FaStore, 
  FaArrowRight, FaHeart, FaTshirt, FaBookOpen
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const VERSICULOS = [
  { texto: "Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza; contra tales cosas no hay ley.", cita: "Gálatas 5:22-23" },
  { texto: "Yo soy la vid, vosotros los pámpanos; el que permanece en mí, y yo en él, éste lleva mucho fruto; porque separados de mí nada podéis hacer.", cita: "Juan 15:5" },
  { texto: "En esto es glorificado mi Padre, en que llevéis mucho fruto, y seáis así mis discípulos.", cita: "Juan 15:8" },
  { texto: "No me elegisteis vosotros a mí, sino que yo os elegí a vosotros, y os he puesto para que vayáis y llevéis fruto, y vuestro fruto permanezca.", cita: "Juan 15:16" },
  { texto: "El que siembra generosamente, generosamente también segará. Cada uno dé como propuso en su corazón, no con tristeza, ni por necesidad, porque Dios ama al dador alegre.", cita: "2 Corintios 9:6-7" },
  { texto: "Así que, mi hijo amado, estad firmes y constantes, creciendo en la obra del Señor siempre, sabiendo que vuestro trabajo en el Señor no es en vano.", cita: "1 Corintios 15:58" },
  { texto: "Llenos de frutos de justicia que son por medio de Jesucristo, para gloria y alabanza de Dios.", cita: "Filipenses 1:11" },
  { texto: "Para que andéis como es digno del Señor, agradándole en todo, llevando fruto en toda buena obra, y creciendo en el conocimiento de Dios.", cita: "Colosenses 1:10" },
  { texto: "El árbol se conoce por su fruto.", cita: "Mateo 12:33" },
  { texto: "Haced, pues, frutos dignos de arrepentimiento.", cita: "Mateo 3:8" }
];

const FLOATING_ITEMS = [
  { emoji: '🍇', style: { top: '12%', left: '4%', animationDelay: '0s', fontSize: '2.5rem' } },
  { emoji: '🍎', style: { top: '22%', right: '6%', animationDelay: '4s', fontSize: '2.2rem' } },
  { emoji: '🍒', style: { top: '38%', left: '9%', animationDelay: '2s', fontSize: '1.8rem' } },
  { emoji: '🌾', style: { top: '68%', right: '12%', animationDelay: '6s', fontSize: '2rem' } },
  { emoji: '🕊️', style: { top: '82%', left: '7%', animationDelay: '8s', fontSize: '2.8rem' } },
  { emoji: '✨', style: { top: '8%', right: '28%', animationDelay: '1s', fontSize: '1.6rem' } },
  { emoji: '☁️', style: { top: '18%', left: '42%', animationDelay: '5s', fontSize: '3.2rem', opacity: 0.18 } },
  { emoji: '🌿', style: { top: '52%', right: '4%', animationDelay: '7s', fontSize: '2.4rem' } },
  { emoji: '⭐', style: { top: '78%', right: '35%', animationDelay: '9s', fontSize: '1.5rem' } },
  { emoji: '🍊', style: { top: '48%', left: '3%', animationDelay: '3.5s', fontSize: '2.1rem' } },
  { emoji: '🍉', style: { top: '88%', right: '8%', animationDelay: '5.5s', fontSize: '2.3rem' } },
];

const useIntersectionObserver = (options) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return [ref, isVisible];
};

const HomePage = ({ makeAuthenticatedRequest }) => {
  const navigate = useNavigate();

  const [homeData, setHomeData] = useState({
    stats: {},
    noticias: [],
    desafioClase: null,
    proximoServicio: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Versículo diario interactivo
  const [verseIdx, setVerseIdx] = useState(0);
  const [pulseVerse, setPulseVerse] = useState(false);

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * VERSICULOS.length);
    setVerseIdx(randomIdx);
  }, []);

  const handleNextVerse = () => {
    setPulseVerse(true);
    setTimeout(() => setPulseVerse(false), 500);
    setVerseIdx(prev => (prev + 1) % VERSICULOS.length);
  };

  const newsCarouselRef = useRef(null);

  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userRes = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/user-data/`);
      let url = `${import.meta.env.VITE_API_URL}/home-data/`;
      if (userRes.ok) {
        const user = await userRes.json();
        if (user.usuario_rol && user.usuario_rol.startsWith('profesor')) {
          const claseId = user.usuario_clase_actual?.clase_id || null;
          if (claseId) url = `${url}?clase_id=${claseId}`;
        }
      }

      const response = await makeAuthenticatedRequest(url);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los datos de la página de inicio.');
      }
      const data = await response.json();
      setHomeData(data);
    } catch (err) {
      setError(err.message);
      console.error("Error al cargar datos del Home:", err);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const scrollCarousel = (direction) => {
    if (newsCarouselRef.current) {
      const scrollAmount = newsCarouselRef.current.children[0].offsetWidth + 24;
      newsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CL', options);
  };

  const [desafioRef, isDesafioVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [proximoServicioRef, isProximoServicioVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [newsRef, isNewsVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [statsRef, isStatsVisible] = useIntersectionObserver({ threshold: 0.1 });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-200">
        <p className="text-xl font-bold text-slate-800 animate-pulse">Cargando Un Fruto Para Cristo...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <p className="text-xl font-bold text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      
      {/* CSS Integrado para Animaciones y Diseño */}
      <style>{`
        .home-background {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #bae6fd, #e0f2fe, #f0f9ff);
          font-family: 'Fredoka', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 5rem;
        }

        .floating-bg-item {
          position: absolute;
          pointer-events: none;
          animation: floatAround 10s ease-in-out infinite;
          opacity: 0.25;
          z-index: 0;
        }

        @keyframes floatAround {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(15deg) scale(1.05); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        .home-content-wrapper {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 6.5rem 1.5rem 2rem 1.5rem;
          position: relative;
          z-index: 10;
        }

        .main-title {
          font-family: 'Fredoka', sans-serif;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 4px 4px 0px #1e293b, 8px 8px 0px rgba(0,0,0,0.1);
          -webkit-text-stroke: 2px #1e293b;
          text-align: center;
          line-height: 1.2;
          animation: pulseTitle 3s ease-in-out infinite;
        }

        @keyframes pulseTitle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }

        .section-title {
          font-family: 'Fredoka', sans-serif;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 3px 3px 0px #1e293b;
          -webkit-text-stroke: 1.5px #1e293b;
          text-align: center;
          font-size: 2.25rem;
          margin-bottom: 2rem;
          margin-top: 1rem;
        }

        /* Rejilla de Dashboard Lúdica */
        .quick-grid {
          display: grid;
          grid-template-cols: repeat(2, 1fr);
          gap: 1.25rem;
          margin-bottom: 3.5rem;
          width: 100%;
        }

        @media (min-width: 768px) {
          .quick-grid {
            grid-template-cols: repeat(4, 1fr);
          }
        }

        .quick-card {
          border: 4px solid #1e293b;
          border-radius: 2rem;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #ffffff;
          position: relative;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          user-select: none;
        }

        .quick-card.card-pet {
          background: linear-gradient(135deg, #a78bfa, #8b5cf6);
          box-shadow: 5px 5px 0px #1e293b;
        }
        .quick-card.card-tree {
          background: linear-gradient(135deg, #34d399, #10b981);
          box-shadow: 5px 5px 0px #1e293b;
        }
        .quick-card.card-games {
          background: linear-gradient(135deg, #38bdf8, #0284c7);
          box-shadow: 5px 5px 0px #1e293b;
        }
        .quick-card.card-store {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          box-shadow: 5px 5px 0px #1e293b;
        }

        .quick-card:hover {
          transform: translateY(-8px);
        }
        .quick-card.card-pet:hover { box-shadow: 8px 8px 0px #1e293b; }
        .quick-card.card-tree:hover { box-shadow: 8px 8px 0px #1e293b; }
        .quick-card.card-games:hover { box-shadow: 8px 8px 0px #1e293b; }
        .quick-card.card-store:hover { box-shadow: 8px 8px 0px #1e293b; }

        .quick-card:active {
          transform: translateY(2px);
          box-shadow: 1px 1px 0px #1e293b;
        }

        .quick-icon {
          font-size: 3.5rem;
          margin-bottom: 0.75rem;
          filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.15));
          transition: transform 0.3s ease;
        }

        .quick-card:hover .quick-icon {
          transform: scale(1.15) rotate(5deg);
        }

        .quick-title {
          font-size: 1.25rem;
          font-weight: 700;
          text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.2);
          margin-bottom: 0.25rem;
        }

        .quick-desc {
          font-size: 0.8rem;
          opacity: 0.95;
          line-height: 1.3;
          font-weight: 600;
          max-width: 140px;
        }

        /* Versículo del Día */
        .verse-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 4px solid #1e293b;
          border-radius: 2.25rem;
          padding: 2rem;
          box-shadow: 6px 6px 0px #1e293b;
          max-width: 800px;
          margin: 0 auto 3.5rem auto;
          position: relative;
        }

        .verse-text {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.6;
          text-align: center;
        }

        .verse-cite {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: #4f46e5;
          margin-top: 1rem;
          text-align: center;
        }

        /* Desafío de la clase */
        .desafio-card {
          background: linear-gradient(180deg, #ffffff, #fffbeb);
          border: 4px solid #1e293b;
          border-radius: 2rem;
          box-shadow: 8px 8px 0px #1e293b;
          overflow: hidden;
          max-width: 900px;
          margin: 0 auto 3rem auto;
        }

        .video-container {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          border-radius: 1.5rem;
          border: 4px solid #1e293b;
          box-shadow: 4px 4px 0px #1e293b;
        }

        .video-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        /* Carrusel de Noticias */
        .carousel-wrapper {
          position: relative;
          width: 100%;
          padding: 0 1.5rem;
        }

        .carousel-container {
          display: flex;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding-bottom: 1.5rem;
          gap: 1.5rem;
          scrollbar-width: none;
        }

        .carousel-container::-webkit-scrollbar {
          display: none;
        }

        .carousel-item {
          flex: 0 0 85%;
          max-width: 320px;
          background-color: #fef08a;
          border: 3.5px solid #1e293b;
          border-radius: 2rem;
          box-shadow: 5px 5px 0px #1e293b;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @media (min-width: 768px) {
          .carousel-item {
            flex: 0 0 30%;
          }
        }

        .carousel-item:hover {
          transform: translateY(-6px);
          box-shadow: 8px 8px 0px #1e293b;
        }

        .carousel-item img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-bottom: 3.5px solid #1e293b;
        }

        .carousel-item .content {
          padding: 1.25rem;
        }

        .carousel-item h4 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .carousel-item p {
          font-size: 0.9rem;
          color: #4b5563;
          line-height: 1.4;
        }

        .carousel-item .date {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 700;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: #ffffff;
          color: #1e293b;
          border: 3px solid #1e293b;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 3px 3px 0px #1e293b;
          z-index: 10;
          transition: all 0.2s ease;
        }

        .carousel-arrow:hover {
          background-color: #f3f4f6;
          transform: translateY(-50%) scale(1.1);
        }

        .carousel-arrow.left { left: 0px; }
        .carousel-arrow.right { right: 0px; }

        /* Tarjetas de Estadísticas */
        .stat-card {
          background-color: #ffffff;
          border: 3.5px solid #1e293b;
          border-radius: 2rem;
          box-shadow: 4px 4px 0px #1e293b;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .stat-card:hover {
          transform: scale(1.05) translateY(-4px);
          box-shadow: 7px 7px 0px #1e293b;
        }

        .stat-icon {
          font-size: 3rem;
          filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.1));
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 0.5rem;
        }

        .stat-label {
          color: #4b5563;
          font-size: 0.95rem;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .animated-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        .animated-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .next-service-card {
          background: #ffffff;
          padding: 1.25rem;
          border-radius: 2rem;
          box-shadow: 5px 5px 0px #1e293b;
          border: 3px solid #1e293b;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          max-width: 500px;
          margin: 0 auto 3rem auto;
        }

        .service-icon {
          font-size: 2.2rem;
          color: #3b82f6;
        }

        .service-details h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1e293b;
        }

        .service-time {
          display: flex;
          align-items: center;
          color: #4b5563;
          font-size: 0.9rem;
          margin-top: 0.2rem;
          font-weight: 600;
        }
      `}</style>

      <div className="home-background">
        
        {/* Elementos flotantes decorativos en el fondo */}
        {FLOATING_ITEMS.map((item, idx) => (
          <div key={idx} className="floating-bg-item select-none pointer-events-none" style={item.style}>
            {item.emoji}
          </div>
        ))}

        <main className="home-content-wrapper">
          
          {/* Cabecera Principal */}
          <div className="text-center mb-10 relative z-10">
            <h1 className="main-title text-4xl md:text-5xl lg:text-6xl text-white">
              Un Fruto Para Cristo
            </h1>
            <p className="text-slate-700 text-sm md:text-md font-bold mt-2 select-none">
              ⛪ IUMP Concón — ¡Creciendo fuertes en la fe y dando buen fruto! 🌿
            </p>
          </div>

          {/* GRID DE ACCESOS RÁPIDOS (DASHBOARD LÚDICO) */}
          <div className="w-full max-w-4xl mx-auto z-10 relative">
            <h2 className="section-title">📍 Panel de Control</h2>
            <div className="quick-grid">
              
              <Link to="/pet-screen" className="quick-card card-pet">
                <span className="quick-icon">🐾</span>
                <span className="quick-title">Mascota</span>
                <span className="quick-desc">Alimenta y viste a tu amiguito virtual.</span>
              </Link>

              <Link to="/tree" className="quick-card card-tree">
                <span className="quick-icon">🌳</span>
                <span className="quick-title">Mi Árbol</span>
                <span className="quick-desc">Siembra, riega y cosecha frutos de fe.</span>
              </Link>

              <Link to="/minijuegos" className="quick-card card-games">
                <span className="quick-icon">🎮</span>
                <span className="quick-title">Minijuegos</span>
                <span className="quick-desc">Juega y gana cristo monedas para la tienda.</span>
              </Link>

              <Link to="/tienda" className="quick-card card-store">
                <span className="quick-icon">🛒</span>
                <span className="quick-title">Tienda</span>
                <span className="quick-desc">Canjea tus cristo monedas por accesorios.</span>
              </Link>

            </div>
          </div>

          {/* TARJETA INTERACTIVA: Versículo del Día */}
          <div className="w-full z-10 relative">
            <div className="verse-card border-4 border-slate-900 shadow-[4px_4px_0px_0px_#1e293b]">
              <div className="flex justify-center mb-2 text-indigo-500">
                <FaBookOpen className="text-3xl" />
              </div>
              <h3 className="text-center text-xs font-black uppercase text-indigo-600 tracking-wider mb-2 select-none">
                📖 Versículo de Fe
              </h3>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={verseIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="verse-text"
                >
                  <p className="italic">"{VERSICULOS[verseIdx].texto}"</p>
                  <span className="verse-cite">{VERSICULOS[verseIdx].cita}</span>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center mt-6">
                <button
                  onClick={handleNextVerse}
                  className="bubbly-button bg-yellow-300 text-slate-900 border-slate-900 font-extrabold text-xs py-2 px-5 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#1e293b]"
                >
                  ✨ Inspirar otro versículo
                </button>
              </div>
            </div>
          </div>

          {/* Desafío de la Clase */}
          {homeData.desafioClase?.desafio_activo && (
            <section ref={desafioRef} className={`animated-section ${isDesafioVisible ? 'is-visible' : ''}`}>
              <h2 className="section-title">
                <FaPlayCircle className="inline-block mr-2 text-red-500" /> Desafío de la Clase
              </h2>

              <div className="desafio-card">
                <div className="desafio-layout">
                  {homeData.desafioClase.desafio_video_url && (
                    <div className="desafio-media">
                      <div className="video-container" style={{ marginBottom: 0 }}>
                        <iframe 
                          src={homeData.desafioClase.desafio_video_url} 
                          title="Desafío de la Clase" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}

                  <div className="desafio-body p-6">
                    <h3 className="font-extrabold text-slate-800 text-lg mb-2">{homeData.desafioClase.desafio_titulo}</h3>
                    {homeData.desafioClase.desafio_contenido ? (
                      <div className="desafio-text text-sm text-slate-600">
                        <p>{homeData.desafioClase.desafio_contenido}</p>
                      </div>
                    ) : (
                      !homeData.desafioClase.desafio_video_url && <p className="text-center text-gray-500 text-xs">No hay contenido de desafío disponible para esta clase.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Próximo Servicio */}
          {homeData.proximoServicio && (
            <section ref={proximoServicioRef} className={`animated-section ${isProximoServicioVisible ? 'is-visible' : ''}`}>
              <h2 className="section-title">📅 Próximo Servicio</h2>
              <div className="next-service-card">
                <div className="service-icon"><FaCalendarAlt /></div>
                <div className="service-details">
                  <h3>{homeData.proximoServicio.tipo_servicio + ': ' + homeData.proximoServicio.servicio_descripcion}</h3>
                  <div className="service-time">
                    <FaClock size={14} className="mr-1.5" />
                    <span>{formatDate(homeData.proximoServicio.servicio_fecha_hora)}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Últimas Noticias */}
          <section ref={newsRef} className={`animated-section ${isNewsVisible ? 'is-visible' : ''}`}>
            <h2 className="section-title">📰 Últimas Noticias</h2>
            <div className="carousel-wrapper">
              {homeData.noticias.length > 4 && (
                <button className="carousel-arrow left" onClick={() => scrollCarousel('left')}>
                  <FaChevronLeft />
                </button>
              )}
              <div ref={newsCarouselRef} className="carousel-container">
                {homeData.noticias.map(news => (
                  <div key={news.noticia_id} className="carousel-item">
                    <img src={news.noticia_imagen_url || '/images/default/defaultNoticia.png'} alt={news.noticia_titulo} />
                    <div className="content">
                      <p className="date">{formatDate(news.noticia_fecha_publicacion)}</p>
                      <h4>{news.noticia_titulo}</h4>
                      <p>{news.noticia_contenido}</p>
                    </div>
                  </div>
                ))}
              </div>
              {homeData.noticias.length > 4 && (
                <button className="carousel-arrow right" onClick={() => scrollCarousel('right')}>
                  <FaChevronRight />
                </button>
              )}
            </div>
            {homeData.noticias.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No hay noticias publicadas.</p>}
          </section>

          {/* Estadísticas */}
          <section ref={statsRef} className={`animated-section ${isStatsVisible ? 'is-visible' : ''} mt-12`}>
            <h2 className="section-title">📊 Nuestras Estadísticas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              <div className="stat-card">
                <div className="stat-icon"><FaUsers className="text-blue-500" /></div>
                <p className="stat-value">{homeData.stats.total_alumnos || 0}</p>
                <p className="stat-label">Alumnos Ingresados</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaSeedling className="text-emerald-500" /></div>
                <p className="stat-value">{homeData.stats.frutos_recolectados || 0}</p>
                <p className="stat-label">Frutos Recolectados</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaBible className="text-amber-500" /></div>
                <p className="stat-value">{homeData.stats.clases_activas || 0}</p>
                <p className="stat-label">Clases Activas</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaChartLine className="text-pink-500" /></div>
                <p className="stat-value">{homeData.stats.asistencia_promedio || '0%'}</p>
                <p className="stat-label">Asistencia Promedio</p>
              </div>
            </div>
          </section>

        </main>
      </div>
    </>
  );
};

export default HomePage;
