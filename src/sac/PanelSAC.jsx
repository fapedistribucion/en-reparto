import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTickets } from "../compartido/useTickets";
import { useObservaciones } from "../compartido/useObservaciones";
import TablaTickets from "../compartido/TablaTickets";
import TablaObservaciones from "../compartido/TablaObservaciones";
import TicketDetalle from "../compartido/TicketDetalle";
import ValidarObservacion from "./ValidarObservacion";
import { ETIQUETAS_ESTADO } from "../utils/estadosTicket";

export default function PanelSAC() {
  const { tickets, cargando: cargandoTickets, error: errorCarga, recargar } = useTickets();
  const { observaciones, cargando: cargandoObs, recargar: recargarObs } = useObservaciones();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [vista, setVista] = useState("ticket");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroValidacion, setFiltroValidacion] = useState("");

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  const ticketsFiltrados = useMemo(
    () => (filtroEstado ? tickets.filter((t) => t.estado === filtroEstado) : tickets),
    [tickets, filtroEstado]
  );

  // Cada observación se combina con su ticket ya cargado (mismo registro que usa la tabla por ticket,
  // con motivos/n_observaciones incluidos), en vez de volver a traerlo del servidor.
  const observacionesConTicket = useMemo(
    () => observaciones.map((o) => ({ ...o, ticket: tickets.find((t) => t.id === o.ticket_id) })),
    [observaciones, tickets]
  );

  const observacionesFiltradas = useMemo(() => {
    let lista = observacionesConTicket;
    if (filtroEstado) lista = lista.filter((o) => o.ticket?.estado === filtroEstado);
    if (filtroValidacion === "pendiente") {
      lista = lista.filter((o) => o.categoria === "NO_LOGISTICO" && o.validado !== "VALIDADO");
    } else if (filtroValidacion === "validado") {
      lista = lista.filter((o) => o.categoria === "NO_LOGISTICO" && o.validado === "VALIDADO");
    }
    return lista;
  }, [observacionesConTicket, filtroEstado, filtroValidacion]);

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

  if (cargandoTickets || cargandoObs) return <p className="panel-rol">Cargando tickets...</p>;

  return (
    <div className="panel-rol">
      <h2>Panel SAC</h2>
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

        {vista === "bulto" && (
          <label className="filtro-select">
            Validación
            <select value={filtroValidacion} onChange={(e) => setFiltroValidacion(e.target.value)}>
              <option value="">Todas</option>
              <option value="pendiente">Pendientes de validar</option>
              <option value="validado">Validadas</option>
            </select>
          </label>
        )}
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
          renderAccionObservacion={(obs, recargarDetalle) => (
            <ValidarObservacion
              observacion={obs}
              onHecho={() => {
                recargarDetalle();
                recargar();
                recargarObs();
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
