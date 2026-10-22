import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTickets } from "../compartido/useTickets";
import { useObservaciones } from "../compartido/useObservaciones";
import { useVistaTickets } from "../compartido/useVistaTickets";
import LayoutLateral from "../compartido/LayoutLateral";
import TablaTickets from "../compartido/TablaTickets";
import TablaObservaciones from "../compartido/TablaObservaciones";
import TicketDetalle from "../compartido/TicketDetalle";
import ConfirmModal from "../compartido/ConfirmModal";
import ValidarObservacion from "./ValidarObservacion";
import AprobarTicketSAC from "./AprobarTicketSAC";
import AgregarProductoSAC, { puedeAgregarProducto } from "./AgregarProductoSAC";
import { invalidarDetalle } from "../compartido/cargaDetalle";
import BarraHerramientas from "../compartido/BarraHerramientas";
import PanelFiltros from "../compartido/PanelFiltros";
import DashboardTickets from "../compartido/DashboardTickets";
import { IconoSeguimiento, IconoDashboard } from "../compartido/iconos";
import { textoCodigoTicket } from "../utils/estadosTicket";

const PESTANAS = [
  { clave: "factura", etiqueta: "Por factura", icono: IconoSeguimiento },
  { clave: "sku", etiqueta: "Por producto", icono: IconoSeguimiento },
  { clave: "dashboard", etiqueta: "Dashboard", subetiqueta: "(En desarrollo)", icono: IconoDashboard },
];

export default function PanelSAC({ sidebarAbierta }) {
  const { tickets, cargando: cargandoTickets, error: errorCarga, recargar } = useTickets();
  const { observaciones, cargando: cargandoObs, recargar: recargarObs } = useObservaciones();

  const [pestana, setPestana] = useState("factura");
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [observacionFocoId, setObservacionFocoId] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [confirmarAnulacion, setConfirmarAnulacion] = useState(false);
  const [ticketAprobado, setTicketAprobado] = useState(null); // código recién generado (popup para dárselo al transportista)
  const [anulando, setAnulando] = useState(false); // muestra el campo de motivo recién al elegir "Anular ticket"

  // Datos de la factura, filtros, orden por encabezado, conteo y exportación a Excel (compartido por todos los roles).
  const vista = useVistaTickets({ tickets, observaciones, pestana });
  const { ticketsFiltrados, observacionesFiltradas } = vista;

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  function abrirDetalle(ticket, observacionId = null) {
    setSeleccionadoId(ticket.id);
    setObservacionFocoId(observacionId);
    setMotivoAnulacion("");
    setAnulando(false);
    setError("");
  }

  function cancelarAnulacion() {
    setAnulando(false);
    setMotivoAnulacion("");
    setError("");
  }

  function refrescarTodo() {
    recargar();
    recargarObs();
  }

  // El botón "Anular ticket" pide confirmación con nuestro propio popup (ConfirmModal)
  // en vez del diálogo nativo del navegador; anularTicket() hace el cambio recién
  // cuando se confirma ahí.
  function pedirConfirmarAnulacion() {
    if (!motivoAnulacion.trim()) {
      setError("Escribe el motivo de anulación.");
      return;
    }
    setError("");
    setConfirmarAnulacion(true);
  }

  async function anularTicket() {
    setConfirmarAnulacion(false);
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

  if (cargandoTickets || cargandoObs) {
    return (
      <LayoutLateral items={PESTANAS} activo={pestana} onCambiar={setPestana} abierta={sidebarAbierta}>
        <p>Cargando tickets...</p>
      </LayoutLateral>
    );
  }

  return (
    <LayoutLateral items={PESTANAS} activo={pestana} onCambiar={setPestana} abierta={sidebarAbierta}>
      {errorCarga && <p className="mensaje-error">No se pudieron cargar los tickets: {errorCarga}</p>}

      <div className="encabezado-vista">
        <h2 className="titulo-vista">{PESTANAS.find((p) => p.clave === pestana)?.etiqueta}</h2>
        <BarraHerramientas
          onExportar={pestana !== "dashboard" ? vista.exportarVistaActual : undefined}
          onQuitarFiltros={vista.limpiarFiltros}
          onRefrescar={refrescarTodo}
          onAbrirFiltros={vista.abrirPanelFiltros}
          filtrosActivos={vista.filtrosActivos}
        />
      </div>

      {pestana === "factura" && (
        <TablaTickets tickets={ticketsFiltrados} onVerDetalle={abrirDetalle} {...vista.propsTablaFactura} />
      )}
      {pestana === "sku" && (
        <TablaObservaciones observaciones={observacionesFiltradas} onVerTicket={abrirDetalle} {...vista.propsTablaProducto} />
      )}
      {pestana === "dashboard" && (
        <DashboardTickets tickets={ticketsFiltrados} observaciones={observacionesFiltradas} rol="SAC" />
      )}

      <PanelFiltros {...vista.propsPanelFiltros} />

      {seleccionado && (
        <TicketDetalle
          ticket={seleccionado}
          soloObservacionId={observacionFocoId}
          onCerrar={() => {
            setSeleccionadoId(null);
            setObservacionFocoId(null);
          }}
          renderAccionObservacion={(obs, recargarDetalle) =>
            // En un ticket por aprobar la respuesta del vendedor se confirma junto con "Aprobar".
            seleccionado.estado === "POR_APROBAR" ? null : (
            <ValidarObservacion
              observacion={obs}
              onHecho={() => {
                recargarDetalle();
                recargar();
                recargarObs();
              }}
            />
            )
          }
          acciones={(recargarDetalle) => {
            const puedeAgregar = puedeAgregarProducto(seleccionado);
            const porAprobar = seleccionado.estado === "POR_APROBAR";
            // Se puede anular mientras el ticket está POR APROBAR (rechazo), EN RUTA o en GESTION LI (aunque LI ya
            // haya registrado alguna Nota de Crédito). Un ticket SOLUCIONADO ya está cerrado.
            const puedeAnular = seleccionado.estado === "EN_RUTA" || seleccionado.estado === "EN_LI" || porAprobar;
            if (!puedeAgregar && !puedeAnular) return null;
            return (
              <>
                {porAprobar && (
                  <AprobarTicketSAC
                    ticket={seleccionado}
                    onAprobado={(codigo) => {
                      invalidarDetalle(seleccionado.id);
                      recargarDetalle();
                      recargar();
                      recargarObs();
                      setTicketAprobado(codigo);
                    }}
                  />
                )}
                <p className="panel-detalle-titulo-seccion">Acciones</p>
                <div className="acciones-sac">
                  {puedeAgregar && (
                    <AgregarProductoSAC
                      ticket={seleccionado}
                      onAgregado={() => {
                        invalidarDetalle(seleccionado.id);
                        recargarDetalle();
                        recargar();
                        recargarObs();
                      }}
                    />
                  )}
                  {puedeAnular && (
                    <button
                      type="button"
                      className="boton-peligro"
                      onClick={() => {
                        setError("");
                        setAnulando(true);
                      }}
                      disabled={anulando || guardando}
                    >
                      {porAprobar ? "Rechazar" : "Anular ticket"}
                    </button>
                  )}
                </div>
                {puedeAnular && anulando && (
                  <div className="accion-rol">
                    <label htmlFor="motivoAnulacion">{porAprobar ? "Motivo del rechazo" : "Motivo de anulación"}</label>
                    <input
                      id="motivoAnulacion"
                      type="text"
                      value={motivoAnulacion}
                      onChange={(e) => setMotivoAnulacion(e.target.value)}
                      autoFocus
                    />
                    {error && <p className="mensaje-error">{error}</p>}
                    <div className="acciones-sac">
                      <button type="button" className="boton-neutro" onClick={cancelarAnulacion} disabled={guardando}>
                        Cancelar
                      </button>
                      <button type="button" className="boton-peligro" onClick={pedirConfirmarAnulacion} disabled={guardando}>
                        {porAprobar ? "Confirmar rechazo" : "Confirmar anulación"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          }}
        />
      )}

      {confirmarAnulacion && seleccionado && (
        <ConfirmModal
          mensaje={
            seleccionado.estado === "POR_APROBAR"
              ? "¿Rechazar este reclamo? No se generará número de ticket y la acción no se puede deshacer."
              : seleccionado.estado === "EN_LI"
                ? `¿Anular el ticket ${textoCodigoTicket(seleccionado)}? Ya llegó a Logística Inversa y puede tener Notas de Crédito registradas. Esta acción no se puede deshacer.`
                : `¿Anular el ticket ${textoCodigoTicket(seleccionado)}? Esta acción no se puede deshacer.`
          }
          onConfirmar={anularTicket}
          onCancelar={() => setConfirmarAnulacion(false)}
          cargando={guardando}
          textoConfirmar={seleccionado.estado === "POR_APROBAR" ? "Rechazar" : "Anular"}
        />
      )}

      {ticketAprobado && (
        <div className="fondo-modal">
          <div className="modal-ticket">
            <p className="modal-ticket-titulo">Ticket aprobado</p>
            <p className="modal-ticket-codigo">{ticketAprobado}</p>
            <p className="modal-ticket-ayuda">
              Bríndale este número de ticket al transportista. Ya quedó asignado al caso en todas las vistas.
            </p>
            <button type="button" onClick={() => setTicketAprobado(null)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </LayoutLateral>
  );
}
