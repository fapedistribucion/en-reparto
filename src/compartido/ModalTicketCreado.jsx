export default function ModalTicketCreado({ codigo, onCerrar }) {
  return (
    <div className="fondo-modal">
      <div className="modal-ticket">
        <p className="modal-ticket-titulo">Ticket generado</p>
        <p className="modal-ticket-codigo">{codigo}</p>
        <p className="modal-ticket-ayuda">
          Anota este código y dirígete a Logística Inversa para hacer entrega de los bultos observados.
        </p>
        <button type="button" onClick={onCerrar}>
          Entendido
        </button>
      </div>
    </div>
  );
}
