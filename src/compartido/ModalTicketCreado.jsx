import { TELEFONO_SAC } from "../config";

export default function ModalTicketCreado({ codigo, requiereSAC, onCerrar }) {
  return (
    <div className="fondo-modal">
      <div className="modal-ticket">
        <p className="modal-ticket-titulo">Ticket generado</p>
        <p className="modal-ticket-codigo">{codigo}</p>
        <p className="modal-ticket-ayuda">
          Anota este código y dirígete a Logística Inversa para hacer entrega de los bultos observados.
        </p>
        {requiereSAC && (
          <p className="modal-ticket-aviso">
            Este reclamo requiere que te comuniques con SAC{TELEFONO_SAC ? ` al ${TELEFONO_SAC}` : ""} para
            coordinar el caso.
          </p>
        )}
        <button type="button" onClick={onCerrar}>
          Entendido
        </button>
      </div>
    </div>
  );
}
