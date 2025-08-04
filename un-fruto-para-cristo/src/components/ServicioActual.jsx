// components/ServicioActual.jsx
import React from 'react';
import { Calendar, User } from 'lucide-react';

export default function ServicioActual({ servicio }) {
  if (!servicio) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md text-center mb-10">
        <p className="text-gray-500 text-lg">No hay un servicio programado próximamente.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mb-10 animate__animated animate__fadeInUp">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar className="text-blue-500" /> Próximo Servicio
      </h2>
      <p className="text-lg text-gray-700 mb-2">
        <span className="font-semibold text-gray-900">Descripción:</span> {servicio.servicio_descripcion}
      </p>
      <p className="text-lg text-gray-700 mb-2">
        <span className="font-semibold text-gray-900">Fecha y hora:</span>{' '}
        {new Date(servicio.servicio_fecha_hora).toLocaleString()}
      </p>
      {servicio.profesor_encargado && (
        <p className="text-lg text-gray-700 flex items-center gap-2 mt-2">
          <User className="text-green-500" size={20} />
          Profesor Encargado: <span className="font-semibold">{servicio.profesor_encargado}</span>
        </p>
      )}


    </div>
  );
}
