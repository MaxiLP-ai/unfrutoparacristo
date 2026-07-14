import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaTimes } from 'react-icons/fa';

const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState(''); // 'android' | 'ios'

  useEffect(() => {
    // 1. Detectar si ya está en modo standalone (instalada)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone === true;

    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // 2. Detectar Plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);

    if (isIos) {
      setPlatform('ios');
      setShowBanner(true);
    } else {
      setPlatform('android');
    }

    // 3. Capturar el evento de instalación en Android / Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      // Mostrar guía interactiva y visual para iOS
      Swal.fire({
        title: '¡Instala la App en tu iPhone! 📱✨',
        html: `
          <div style="font-family: 'Fredoka', sans-serif; text-align: left; line-height: 1.6; font-size: 1.1rem; color: #1e293b;">
            <p style="margin-bottom: 15px; text-align: center; font-weight: bold; color: #2563eb;">
              Sigue estos 2 sencillos pasos para tener tu app:
            </p>
            <div style="display: flex; align-items: center; margin-bottom: 12px; background: #f1f5f9; padding: 10px; border-radius: 12px; border: 2px solid #cbd5e1;">
              <span style="font-size: 1.8rem; margin-right: 15px;">1️⃣</span>
              <span>Toca el botón <b>Compartir</b> en Safari (el cuadrado con la flecha hacia arriba <span style="color:#2563eb; font-size: 1.25rem;">📤</span> en la parte de abajo).</span>
            </div>
            <div style="display: flex; align-items: center; background: #f1f5f9; padding: 10px; border-radius: 12px; border: 2px solid #cbd5e1;">
              <span style="font-size: 1.8rem; margin-right: 15px;">2️⃣</span>
              <span>Busca en la lista y selecciona <b>"Agregar al inicio"</b> (<span style="color:#10b981; font-size: 1.25rem;">➕</span> o "Add to Home Screen").</span>
            </div>
            <p style="margin-top: 15px; text-align: center; font-size: 1.2rem; font-weight: bold; color: #10b981;">
              ¡Y listo, ya la verás en tu celular! 🎉
            </p>
          </div>
        `,
        confirmButtonText: '¡Entendido!',
        confirmButtonColor: '#10b981',
        customClass: {
          popup: 'cartoon-border rounded-3xl',
        }
      });
    } else if (deferredPrompt) {
      // Lanzar prompt nativo en Android/Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install choice: ${outcome}`);
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-bounce-slow">
      <div className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 border-4 border-slate-800 rounded-3xl p-4 shadow-[6px_6px_0px_0px_#1e293b] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍎</span>
          <div className="font-sans">
            <h4 className="text-slate-900 font-bold text-base leading-tight">¡Instala nuestra App!</h4>
            <p className="text-slate-800 text-xs font-semibold">Para jugar en tu teléfono móvil</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-2xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_#1e293b] transition-all duration-150"
          >
            Instalar
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="text-slate-800 hover:text-slate-950 p-1 font-bold"
            aria-label="Cerrar banner"
          >
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaBanner;
