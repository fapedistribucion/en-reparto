import { useState } from "react";
import { ETIQUETAS_MOTIVO_RETENCION } from "../utils/estadosTicket";

// Popup para registrar (o corregir) si la factura ya se entregó al transporte.
// Es una acción de LI, independiente del `estado` final del ticket: solo deja
// una traza informativa (fecha_entrega_transporte / usuario_entrega_transporte).
// Si la respuesta es "No (Retención)" pide además el motivo. Editable: se puede
// reabrir para corregir una respuesta ya guardada, precargando los valores actuales.
export default function ModalEntregaTransporte({ ticket, onGuardar, onCancelar, cargando = false }) {
  const [respuesta, setRespuesta] = useState(ticket.entrega_transporte ?? null);
  const [motivo, setMotivo] = useState(ticket.motivo_retencion ?? "");

  const puedeGuardar = respuesta === "SI" || (respuesta === "NO_RETENCION" && motivo);

  function elegir(valor) {
    setRespuesta(valor);
    if (valor !== "NO_RETENCION") setMotivo("");
  }

  function guardar() {
    if (!puedeGuardar) return;
    onGuardar({
      entrega_transporte: respuesta,
      motivo_retencion: respuesta === "NO_RETENCION" ? motivo : null,
    });
  }

  return (
    <div className="fondo-modal" onClick={cargando ? undefined : onCancelar}>
      <div className="modal-confirmar" onClick={(e) => e.stopPropagation()}>
        <p className="modal-confirmar-mensaje">¿Se entregó la factura {ticket.factura} al transporte?</p>

        <div className="modal-confirmar-acciones">
          <button
            type="button"
            className={respuesta === "SI" ? "boton-primario" : ""}
            onClick={() => elegir("SI")}
            disabled={cargando}
          >
            Sí
          </button>
          <button
            type="button"
            className={respuesta === "NO_RETENCION" ? "boton-primario" : ""}
            onClick={() => elegir("NO_RETENCION")}
            disabled={cargando}
          >
            No (Retención)
          </button>
        </div>

        {respuesta === "NO_RETENCION" && (
          <div className="accion-rol">
            <label htmlFor="motivoRetencion">Motivo</label>
            <select
              id="motivoRetencion"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={cargando}
            >
              <option value="">Selecciona un motivo...</option>
              {Object.entries(ETIQUETAS_MOTIVO_RETENCION).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="modal-confirmar-acciones">
          <button type="button" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </button>
          <button type="button" className="boton-primario" onClick={guardar} disabled={cargando || !puedeGuardar}>
            {cargando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
