import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import ModalServicioDetalle from './ModalServicioDetalle'; // crea este modal con los datos que quieras mostrar

function CalendarioServicios({ makeAuthenticatedRequest }) {
  const [eventos, setEventos] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    async function fetchEventos() {
      try {
        const res = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_URL}/servicios/`);
        if (!res.ok) throw new Error('No autorizado o error en la API');
        const data = await res.json();
        const eventosMapped = data.map(srv => ({
          id: srv.servicio_id,
          title: srv.servicio_descripcion,
          start: srv.servicio_fecha_hora,
          extendedProps: {
            tipo_servicio: srv.tipo_servicio,
            profesor_encargado: srv.profesor_encargado,
          }
        }));

        setEventos(eventosMapped);
      } catch (error) {
        console.error(error);
      }
    }
    fetchEventos();
  }, [makeAuthenticatedRequest]);

  const handleEventClick = (clickInfo) => {
    // clickInfo.event contiene toda la info del evento seleccionado
    setServicioSeleccionado(clickInfo.event);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setServicioSeleccionado(null);
  };

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={eventos}
        eventClick={handleEventClick}
      />

      {modalAbierto && servicioSeleccionado && (
        <ModalServicioDetalle
          isOpen={modalAbierto}
          onClose={cerrarModal}
          servicio={servicioSeleccionado}
        />
      )}
    </>
  );
}

export default CalendarioServicios;
