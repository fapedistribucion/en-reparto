import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTickets } from "../compartido/useTickets";
import TablaTickets from "../compartido/TablaTickets";
import TicketDetalle from "../compartido/TicketDetalle";
import ValidarObservacion from "./ValidarObservacion";

export default function PanelSAC() {
  const { tickets, cargando, error: errorCarga, recargar } = useTickets();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  function abrirDetalle(ticket) {
    setSeleccionadoId(ticket.id);
    setMotivoAnulacion("");
    setError("");
  }

  async function anularTicket() {
    if (!motivoAnulacion.trim()) {
      setError("Escribe el motivo de anulación.");
      return;
    }
    if (!window.confirm(`¿Anular el ticket ${seleccionado.codigo_ticket}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setGuardando(true);
    setError("");
    const { data: sesion } = await supabase.auth.getUser();

    const { error: errorUpdate } = await supabase
      .from("tickets")
      .update({
        motivo_anulacion: motivoAnulacion,
        usuario_anulacion: sesion.user.id,
        fecha_anulacion: new Date().toISOString(),
      })
      .eq("id", seleccionado.id);

    setGuardando(false);

    if (errorUpdate) {
      setError("No se pudo anular: " + errorUpdate.message);
      return;
    }
    await recargar();
  }

  if (cargando) return <p className="panel-rol">Cargando tickets...</p>;

  return (
    <div className="panel-rol">
      <h2>Panel SAC</h2>
      {errorCarga && <p className="mensaje-error">No se pudieron cargar los tickets: {errorCarga}</p>}
      <TablaTickets tickets={tickets} onVerDetalle={abrirDetalle} />

      {seleccionado && (
        <TicketDetalle
          ticket={seleccionado}
          onCerrar={() => setSeleccionadoId(null)}
          renderAccionObservacion={(obs, recargarDetalle) => (
            <ValidarObservacion
              observacion={obs}
              onHecho={() => {
                recargarDetalle();
                recargar();
              }}
            />
          )}
          acciones={
            seleccionado.estado === "EN_RUTA" ? (
              <div className="accion-rol">
                <label htmlFor="motivoAnulacion">Motivo de anulación</label>
                <input
                  id="motivoAnulacion"
                  type="text"
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej: información errónea al crear el ticket"
                />
                {error && <p className="mensaje-error">{error}</p>}
                <button type="button" onClick={anularTicket} disabled={guardando} className="boton-peligro">
                  Anular ticket
                </button>
              </div>
            ) : null
          }
        />
      )}
    </div>
  );
}
