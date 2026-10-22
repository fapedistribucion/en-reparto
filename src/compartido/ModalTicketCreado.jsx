import { NOMBRE_SOPORTE, TELEFONO_SOPORTE } from "../config";

// Dos casos:
//  - Con código: el reclamo es logístico y el ticket ya existe → se muestra el número.
//  - Sin código (`codigo` null): reclamo No logístico o con Faltante → todavía NO tiene ticket;
//    el transportista debe llamar a Supply Te Ayuda, que atiende el caso, lo aprueba y le da el número.
export default function ModalTicketCreado({ codigo, factura, onCerrar }) {
  if (!codigo) {
    return (
      <div className="fondo-modal">
        <div className="modal-ticket">
          <p className="modal-ticket-titulo">Reclamo registrado sin ticket</p>
          <p className="modal-ticket-aviso">
            Llama a {NOMBRE_SOPORTE} al <strong>{TELEFONO_SOPORTE}</strong>
            {factura ? ` e indica la factura ${factura}` : ""} para recibir tu número de ticket.
          </p>
          <p className="modal-ticket-ayuda">No entregues los bultos en Logística Inversa hasta tener el ticket.</p>
          <button type="button" onClick={onCerrar}>
            Entendido
          </button>
        </div>
      </div>
    );
  }

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
