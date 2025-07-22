import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

function CalendarioServicios() {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/servicios/`)
    .then(res => res.json())
    .then(data => {
      const eventosMapped = data.map(srv => ({
        id: srv.servicio_id,
        title: srv.servicio_descripcion,
        start: srv.servicio_fecha_hora,
      }));
      setEventos(eventosMapped);
    })
    .catch(console.error);
}, []);


  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      events={eventos}
    />
  );
}

export default CalendarioServicios;
