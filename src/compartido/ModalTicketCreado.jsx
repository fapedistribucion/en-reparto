import { TELEFONO_SAC } from "../config";

// Dos casos:
//  - Con código: el reclamo es logístico y el ticket ya existe → se muestra el número.
//  - Sin código (`codigo` null): reclamo No logístico o con Faltante → todavía NO tiene ticket;
//    el transportista debe llamar a SAC, que atiende el caso, lo aprueba y le da el número.
export default function ModalTicketCreado({ codigo, factura, onCerrar }) {
  if (!codigo) {
    return (
      <div className="fondo-modal">
        <div className="modal-ticket">
          <p className="modal-ticket-titulo">Reclamo registrado sin ticket</p>
          <p className="modal-ticket-aviso">
            Para que tu caso sea atendido y se te brinde el número de ticket, comunícate directamente con SAC
            al <strong>{TELEFONO_SAC}</strong>
            {factura ? ` e indica la factura ${factura}` : ""}.
          </p>
          <p className="modal-ticket-ayuda">
            Cuando SAC apruebe el caso, el número de ticket aparecerá en tu Seguimiento. No entregues los
            bultos en Logística Inversa hasta tener el ticket.
          </p>
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
