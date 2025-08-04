export default function ModalServicioDetalle({ isOpen, onClose, servicio }) {
  if (!isOpen || !servicio) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{servicio.title}</h2>
        <p><strong>Fecha y hora:</strong> {new Date(servicio.start).toLocaleString()}</p>
        <p><strong>Tipo:</strong> {servicio.extendedProps.tipo_servicio}</p>
        <p><strong>Encargado:</strong> {servicio.extendedProps.profesor_encargado}</p>

        <button
          onClick={onClose}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
