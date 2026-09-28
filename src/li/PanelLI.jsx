import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTickets } from "../compartido/useTickets";
import TablaTickets from "../compartido/TablaTickets";
import TicketDetalle from "../compartido/TicketDetalle";

export default function PanelLI() {
  const { tickets, cargando, error: errorCarga, recargar } = useTickets();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [notaCredito, setNotaCredito] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  function abrirDetalle(ticket) {
    setSeleccionadoId(ticket.id);
    setNotaCredito("");
    setError("");
  }

  async function marcarLlegada() {
    if (!window.confirm(`¿Confirmar que el ticket ${seleccionado.codigo_ticket} llegó a Logística Inversa?`)) {
      return;
    }

    setGuardando(true);
    setError("");
    const { data: sesion } = await supabase.auth.getUser();

    const { error: errorUpdate } = await supabase
      .from("tickets")
      .update({
        usuario_llegada_li: sesion.user.id,
        fecha_entrega_li: new Date().toISOString(),
      })
      .eq("id", seleccionado.id);

    setGuardando(false);

    if (errorUpdate) {
      setError("No se pudo registrar la llegada: " + errorUpdate.message);
      return;
    }
    await recargar();
  }

  async function guardarNotaCredito() {
    if (!notaCredito.trim()) {
      setError("Ingresa el número de Nota de Crédito.");
      return;
    }
    if (
      !window.confirm(
        `¿Registrar la NC "${notaCredito}" para el ticket ${seleccionado.codigo_ticket}? El ticket pasará a Solucionado.`
      )
    ) {
      return;
    }

    setGuardando(true);
    setError("");
    const { data: sesion } = await supabase.auth.getUser();

    const { error: errorUpdate } = await supabase
      .from("tickets")
      .update({
        nota_credito: notaCredito,
        usuario_nc: sesion.user.id,
        fecha_nc: new Date().toISOString(),
      })
      .eq("id", seleccionado.id);

    setGuardando(false);

    if (errorUpdate) {
      setError("No se pudo guardar la NC: " + errorUpdate.message);
      return;
    }
    await recargar();
  }

  if (cargando) return <p className="panel-rol">Cargando tickets...</p>;

  return (
    <div className="panel-rol">
      <h2>Panel Logística Inversa</h2>
      {errorCarga && <p className="mensaje-error">No se pudieron cargar los tickets: {errorCarga}</p>}
      <TablaTickets tickets={tickets} onVerDetalle={abrirDetalle} />

      {seleccionado && (
        <TicketDetalle
          ticket={seleccionado}
          onCerrar={() => setSeleccionadoId(null)}
          acciones={
            seleccionado.estado === "EN_RUTA" || seleccionado.estado === "EN_LI" ? (
            <>
              {error && <p className="mensaje-error">{error}</p>}

              {seleccionado.estado === "EN_RUTA" && (
                <button type="button" onClick={marcarLlegada} disabled={guardando}>
                  Marcar llegada a LI
                </button>
              )}

              {seleccionado.estado === "EN_LI" && (
                <div className="accion-rol">
                  <label htmlFor="notaCredito">Nota de crédito</label>
                  <input
                    id="notaCredito"
                    type="text"
                    value={notaCredito}
                    onChange={(e) => setNotaCredito(e.target.value)}
                    placeholder="N° de NC"
                  />
                  <button type="button" onClick={guardarNotaCredito} disabled={guardando}>
                    Guardar NC
                  </button>
                </div>
              )}
            </>
            ) : null
          }
        />
      )}
    </div>
  );
}
