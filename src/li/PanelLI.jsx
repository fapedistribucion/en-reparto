import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTickets } from "../compartido/useTickets";
import { useObservaciones } from "../compartido/useObservaciones";
import TablaTickets from "../compartido/TablaTickets";
import TablaObservaciones from "../compartido/TablaObservaciones";
import TicketDetalle from "../compartido/TicketDetalle";
import { ETIQUETAS_ESTADO } from "../utils/estadosTicket";

export default function PanelLI() {
  const { tickets, cargando: cargandoTickets, error: errorCarga, recargar } = useTickets();
  const { observaciones, cargando: cargandoObs } = useObservaciones();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [notaCredito, setNotaCredito] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [vista, setVista] = useState("ticket");
  const [filtroEstado, setFiltroEstado] = useState("");

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  const ticketsFiltrados = useMemo(
    () => (filtroEstado ? tickets.filter((t) => t.estado === filtroEstado) : tickets),
    [tickets, filtroEstado]
  );

  const observacionesConTicket = useMemo(
    () => observaciones.map((o) => ({ ...o, ticket: tickets.find((t) => t.id === o.ticket_id) })),
    [observaciones, tickets]
  );

  const observacionesFiltradas = useMemo(
    () => (filtroEstado ? observacionesConTicket.filter((o) => o.ticket?.estado === filtroEstado) : observacionesConTicket),
    [observacionesConTicket, filtroEstado]
  );

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

  if (cargandoTickets || cargandoObs) return <p className="panel-rol">Cargando tickets...</p>;

  return (
    <div className="panel-rol">
      <h2>Panel Logística Inversa</h2>
      {errorCarga && <p className="mensaje-error">No se pudieron cargar los tickets: {errorCarga}</p>}

      <div className="barra-filtros">
        <div className="selector-vista">
          <button type="button" className={vista === "ticket" ? "activo" : ""} onClick={() => setVista("ticket")}>
            Por ticket
          </button>
          <button type="button" className={vista === "bulto" ? "activo" : ""} onClick={() => setVista("bulto")}>
            Por bulto
          </button>
        </div>

        <label className="filtro-select">
          Estado
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ETIQUETAS_ESTADO).map(([clave, etiqueta]) => (
              <option key={clave} value={clave}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
      </div>

      {vista === "ticket" ? (
        <TablaTickets tickets={ticketsFiltrados} onVerDetalle={abrirDetalle} />
      ) : (
        <TablaObservaciones observaciones={observacionesFiltradas} onVerTicket={abrirDetalle} />
      )}

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
