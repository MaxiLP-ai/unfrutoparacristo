import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaChartLine, FaBible, FaSeedling, FaChevronLeft, FaChevronRight, FaPlayCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';
// No es necesario importar el CSS aquí si lo vamos a integrar directamente

// Custom hook para animaciones al hacer scroll (sin cambios)
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

  // Estado unificado para todos los datos de la página
  const [homeData, setHomeData] = useState({
    stats: {},
    noticias: [],
    desafioClase: null,
    proximoServicio: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs para los carruseles
  const newsCarouselRef = useRef(null);

  // Función para obtener todos los datos del backend
  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/home-data/`);
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

  // Función para desplazar el carrusel de noticias
  const scrollCarousel = (direction) => {
    if (newsCarouselRef.current) {
      const scrollAmount = newsCarouselRef.current.children[0].offsetWidth + 24;
      newsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CL', options);
  };

  // Refs para animaciones
  const [welcomeRef, isWelcomeVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [desafioRef, isDesafioVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [proximoServicioRef, isProximoServicioVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [newsRef, isNewsVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [statsRef, isStatsVisible] = useIntersectionObserver({ threshold: 0.1 });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center"><p>Error: {error}</p></div>;
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      
      {/* --- CSS INTEGRADO --- */}
      <style>{`
        .home-background {
          min-height: 100vh;
          width: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          font-family: 'Poppins', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .home-content-wrapper {
          width: 100%;
          max-width: 1280px; /* 7xl */
          margin-left: auto;
          margin-right: auto;
          padding-top: 6rem; /* pt-24 */
          padding-left: 1rem; /* p-4 */
          padding-right: 1rem; /* p-4 */
          padding-bottom: 2rem; /* p-8 */
        }
        @media (min-width: 640px) {
          .home-content-wrapper {
            padding-left: 1.5rem; /* sm:p-6 */
            padding-right: 1.5rem; /* sm:p-6 */
          }
        }
        @media (min-width: 1024px) {
          .home-content-wrapper {
            padding-left: 2rem; /* lg:p-8 */
            padding-right: 2rem; /* lg:p-8 */
          }
        }
        .home-background {
          background: linear-gradient(135deg, #B0E0E6, #4682B4);
        }
        @media (min-width: 768px) {
          .home-background {
            background: linear-gradient(135deg, #87CEEB, #000080);
          }
        }
        .main-title {
          font-family: 'Poppins', sans-serif;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
          color: #FFFFFF;
          -webkit-text-stroke: 1px #4682B4;
          font-size: 2.25rem; /* text-4xl */
          text-align: center;
          margin-bottom: 3rem;
        }
        @media (min-width: 1024px) {
          .main-title {
            font-size: 3.75rem; /* lg:text-6xl */
          }
        }
        .section-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          color: #FFFFFF;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
          text-align: center;
          margin-bottom: 2rem; /* mb-8 */
          font-size: 2.25rem; /* text-4xl */
        }
        .video-container {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
          height: 0;
          overflow: hidden;
          border-radius: 1.2rem;
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
          margin-bottom: 3rem;
          /* 👇 AJUSTE: Aumentamos el ancho máximo para que se vea más rectangular */
          max-width: 960px; 
          margin-left: auto;
          margin-right: auto;
          border: 3px solid #4169E1;
        }
        .video-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        .carousel-wrapper {
          position: relative;
          width: 100%;
          padding: 0 1rem; /* Espacio para que las flechas no se peguen al borde */
        }
        .carousel-container {
          display: flex;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding-bottom: 1rem;
          gap: 1.5rem;
          /* Ocultar la barra de scroll */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE and Edge */
        }
        .carousel-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, and Opera */
        }
        .carousel-item {
          flex: 0 0 80%;
          max-width: 300px;
          background-color: #E0FFFF;
          border-radius: 1.2rem;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 2px solid #4169E1;
        }
        .carousel-item:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
        }
        .carousel-item img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-bottom: 2px solid #4169E1;
        }
        .carousel-item .content { padding: 1rem; }
        .carousel-item h4 { font-size: 1.2rem; font-weight: 700; color: #0000CD; margin-bottom: 0.5rem; }
        .carousel-item p { font-size: 1rem; color: #6495ED; line-height: 1.5; }
        .carousel-item .date { font-size: 0.9rem; color: #7B68EE; margin-top: 0.5rem; }
        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          /* 👇 AJUSTE: Fondo más oscuro y semitransparente */
          background-color: rgba(0, 0, 0, 0.4); 
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.5rem;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          z-index: 10;
        }
        .carousel-arrow:hover {
          background-color: rgba(0, 0, 0, 0.6);
          transform: translateY(-50%) scale(1.1);
        }
        /* 👇 AJUSTE: Posicionamiento dentro del contenedor */
        .carousel-arrow.left {
          left: 0.5rem; /* 8px */
        }
        .carousel-arrow.right {
          right: 0.5rem; /* 8px */
        }
        .stat-card {
          background-color: rgba(255, 255, 255, 0.95);
          border-radius: 1.5rem;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 2px solid #6A5ACD;
        }
        .stat-card:hover { transform: translateY(-8px) scale(1.05); box-shadow: 0 18px 45px rgba(0, 0, 0, 0.3); }
        .stat-icon { font-size: 3rem; filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.2)); }
        .stat-value { font-size: 2rem; font-weight: 700; color: #191970; }
        .stat-label { color: #4682B4; font-size: 1.1rem; }
        .animated-section { opacity: 0; transform: translateY(50px); transition: opacity 1s ease-out, transform 1s ease-out; }
        .animated-section.is-visible { opacity: 1; transform: translateY(0); }
        .next-service-card {
          background: linear-gradient(135deg, #fff, #f1f5f9);
          padding: 1.5rem; border-radius: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          display: flex; align-items: center; gap: 1.5rem; max-width: 600px; margin: 0 auto 3rem auto;
        }
        .service-icon { font-size: 2.5rem; color: #3b82f6; }
        .service-details h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
        .service-time { display: flex; align-items: center; color: #475569; margin-top: 0.25rem; }
      `}</style>

      <div className="home-background">
        <main className="home-content-wrapper">
          <h1 className="main-title">
            ¡Bienvenido al sistema Un Fruto Para Cristo!
          </h1>

          <section ref={welcomeRef} className={`animated-section ${isWelcomeVisible ? 'is-visible' : ''}`}>
            <h2 className="section-title">Bienvenida de Nuestro Pastor</h2>
            <div className="video-container">
              <iframe src="https://www.youtube.com/embed/t6okm6U2k-w?si=FlC7W3-1-oYlf1vV" title="Video de Bienvenida" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
            </div>
          </section>

          {homeData.desafioClase?.desafio_activo && (
            <section ref={desafioRef} className={`animated-section ${isDesafioVisible ? 'is-visible' : ''}`}>
              <h2 className="section-title"><FaPlayCircle className="inline-block mr-3 text-red-500" /> Desafío de la Clase: {homeData.desafioClase.desafio_titulo}</h2>
              <div className="video-container">
                <iframe src={homeData.desafioClase.desafio_video_url} title="Desafío de la Clase" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
              </div>
            </section>
          )}

          {homeData.proximoServicio && (
            <section ref={proximoServicioRef} className={`animated-section ${isProximoServicioVisible ? 'is-visible' : ''}`}>
              <h2 className="section-title">Próximo Servicio</h2>
              <div className="next-service-card">
                <div className="service-icon"><FaCalendarAlt /></div>
                <div className="service-details">
                  <h3>{homeData.proximoServicio.tipo_servicio+': '+homeData.proximoServicio.servicio_descripcion}</h3>
                  <div className="service-time">
                    <FaClock size={16} className="mr-2" />
                    <span>{formatDate(homeData.proximoServicio.servicio_fecha_hora)}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section ref={newsRef} className={`animated-section ${isNewsVisible ? 'is-visible' : ''}`}>
            <h2 className="section-title">Últimas Noticias</h2>
            <div className="carousel-wrapper">
              {homeData.noticias.length > 4 && <button className="carousel-arrow left" onClick={() => scrollCarousel('left')}><FaChevronLeft /></button>}
              <div ref={newsCarouselRef} className="carousel-container">
                {homeData.noticias.map(news => (
                  <div key={news.noticia_id} className="carousel-item">
                    <img src={news.noticia_imagen_url || '/images/default/defaultNoticia.png'} alt={news.noticia_titulo} />
                    <div className="content">
                      <h4>{news.noticia_titulo}</h4>
                      <p className="date">{formatDate(news.noticia_fecha_publicacion)}</p>
                      <p>{news.noticia_contenido}</p>
                    </div>
                  </div>
                ))}
              </div>
              {homeData.noticias.length > 4 && <button className="carousel-arrow right" onClick={() => scrollCarousel('right')}><FaChevronRight /></button>}
            </div>
            {homeData.noticias.length === 0 && <p className="text-center text-gray-500">No hay noticias publicadas.</p>}
          </section>

          <section ref={statsRef} className={`animated-section ${isStatsVisible ? 'is-visible' : ''}`}>
            <h2 className="section-title">Nuestras Estadísticas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
              <div className="stat-card"><div className="stat-icon"><FaUsers className="text-blue-600" /></div><div className="mt-4 text-center"><p className="stat-value">{homeData.stats.total_alumnos || 0}</p><p className="stat-label">Alumnos Ingresados</p></div></div>
              <div className="stat-card"><div className="stat-icon"><FaSeedling className="text-green-600" /></div><div className="mt-4 text-center"><p className="stat-value">{homeData.stats.frutos_recolectados || 0}</p><p className="stat-label">Frutos Recolectados</p></div></div>
              <div className="stat-card"><div className="stat-icon"><FaBible className="text-yellow-600" /></div><div className="mt-4 text-center"><p className="stat-value">{homeData.stats.clases_activas || 0}</p><p className="stat-label">Clases Activas</p></div></div>
              <div className="stat-card"><div className="stat-icon"><FaChartLine className="text-pink-600" /></div><div className="mt-4 text-center"><p className="stat-value">{homeData.stats.asistencia_promedio || '0%'}</p><p className="stat-label">Asistencia Promedio</p></div></div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default HomePage;
