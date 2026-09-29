import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTickets } from "../compartido/useTickets";
import { useObservaciones } from "../compartido/useObservaciones";
import { useFacturasViaje } from "../compartido/useFacturasViaje";
import LayoutLateral from "../compartido/LayoutLateral";
import TablaTickets from "../compartido/TablaTickets";
import TablaObservaciones from "../compartido/TablaObservaciones";
import TicketDetalle from "../compartido/TicketDetalle";
import ConfirmModal from "../compartido/ConfirmModal";
import { IconoCheck } from "../compartido/iconos";
import BarraHerramientas from "../compartido/BarraHerramientas";
import PanelFiltros from "../compartido/PanelFiltros";
import DashboardTickets from "../compartido/DashboardTickets";
import { ETIQUETAS_ESTADO, textoAlcance, textoSkuObservados } from "../utils/estadosTicket";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";
import { exportarCsv } from "../utils/exportarCsv";

const PESTANAS = [
  { clave: "factura", etiqueta: "Por factura" },
  { clave: "sku", etiqueta: "Por producto" },
  { clave: "dashboard", etiqueta: "Dashboard" },
];

const FILTROS_VACIOS = { ticket: "", factura: "", transporte: "", estado: "", desde: "", hasta: "" };

function coincideTexto(valor, filtro) {
  if (!filtro) return true;
  return String(valor ?? "")
    .toLowerCase()
    .includes(filtro.trim().toLowerCase());
}

function coincideFecha(fechaIso, desde, hasta) {
  if (!desde && !hasta) return true;
  if (!fechaIso) return false;
  const fecha = new Date(fechaIso);
  if (desde && fecha < new Date(`${desde}T00:00:00`)) return false;
  if (hasta && fecha > new Date(`${hasta}T23:59:59`)) return false;
  return true;
}

export default function PanelLI({ sidebarAbierta }) {
  const { tickets, cargando: cargandoTickets, error: errorCarga, recargar } = useTickets();
  const { observaciones, cargando: cargandoObs, recargar: recargarObs } = useObservaciones();

  const [pestana, setPestana] = useState("factura");
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [observacionFocoId, setObservacionFocoId] = useState(null);
  const [notaCredito, setNotaCredito] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [procesandoLlegadaId, setProcesandoLlegadaId] = useState(null);
  const [error, setError] = useState("");
  const [ticketConfirmarLlegada, setTicketConfirmarLlegada] = useState(null);
  const [confirmarNC, setConfirmarNC] = useState(false);

  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  const opcionesTransporte = useMemo(
    () => [...new Set(tickets.map((t) => t.empresa_transporte).filter(Boolean))].sort(),
    [tickets]
  );

  const facturasVisibles = useMemo(() => tickets.map((t) => t.factura), [tickets]);
  const fechasViaje = useFacturasViaje(facturasVisibles);

  // `fecha_viaje` viene de facturas_data (tabla aparte); se combina una sola vez
  // aquí para que tanto la tabla "Por factura" como "Por producto" la tengan.
  const ticketsConFechaViaje = useMemo(
    () => tickets.map((t) => ({ ...t, fecha_viaje: fechasViaje.get(t.factura) ?? null })),
    [tickets, fechasViaje]
  );

  const filtrosActivos = Object.values(filtros).some((v) => v);

  const ticketsFiltrados = useMemo(
    () =>
      ticketsConFechaViaje.filter(
        (t) =>
          coincideTexto(t.codigo_ticket, filtros.ticket) &&
          coincideTexto(t.factura, filtros.factura) &&
          (!filtros.transporte || t.empresa_transporte === filtros.transporte) &&
          (!filtros.estado || t.estado === filtros.estado) &&
          coincideFecha(t.fecha_creacion, filtros.desde, filtros.hasta)
      ),
    [ticketsConFechaViaje, filtros]
  );

  const observacionesConTicket = useMemo(
    () =>
      observaciones.map((o) => {
        const t = ticketsConFechaViaje.find((tt) => tt.id === o.ticket_id);
        return { ...o, ticket: t };
      }),
    [observaciones, ticketsConFechaViaje]
  );

  const observacionesFiltradas = useMemo(
    () =>
      observacionesConTicket.filter(
        (o) =>
          coincideTexto(o.ticket?.codigo_ticket, filtros.ticket) &&
          coincideTexto(o.ticket?.factura, filtros.factura) &&
          (!filtros.transporte || o.ticket?.empresa_transporte === filtros.transporte) &&
          (!filtros.estado || o.ticket?.estado === filtros.estado) &&
          coincideFecha(o.ticket?.fecha_creacion, filtros.desde, filtros.hasta)
      ),
    [observacionesConTicket, filtros]
  );

  function abrirDetalle(ticket, observacionId = null) {
    setSeleccionadoId(ticket.id);
    setObservacionFocoId(observacionId);
    setNotaCredito("");
    setError("");
  }

  function abrirPanelFiltros() {
    setBorrador(filtros);
    setFiltrosAbiertos(true);
  }

  function aplicarFiltros() {
    setFiltros(borrador);
    setFiltrosAbiertos(false);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS);
    setBorrador(FILTROS_VACIOS);
    setFiltrosAbiertos(false);
  }

  function refrescarTodo() {
    recargar();
    recargarObs();
  }

  function exportarVistaActual() {
    if (pestana === "sku") {
      exportarCsv("en-reparto-por-producto", [
        { titulo: "Fecha creación", obtener: (o) => o.ticket?.fecha_creacion },
        { titulo: "N° Ticket", obtener: (o) => o.ticket?.codigo_ticket },
        { titulo: "Fecha viaje", obtener: (o) => o.ticket?.fecha_viaje },
        { titulo: "Transporte", obtener: (o) => o.ticket?.empresa_transporte },
        { titulo: "Factura", obtener: (o) => o.ticket?.factura },
        { titulo: "Cliente", obtener: (o) => o.ticket?.cliente },
        { titulo: "Cód. Producto", clave: "codigo_producto" },
        { titulo: "Producto", clave: "nombre_producto" },
        { titulo: "Motivo", obtener: (o) => etiquetaMotivo(o.subcategoria) },
        { titulo: "Categoría", obtener: (o) => (o.categoria === "LOGISTICO" ? "Logístico" : "No logístico") },
        { titulo: "Bulto", clave: "numero_bulto" },
        { titulo: "Cant. Reclamada", clave: "cantidad_observada" },
        { titulo: "Cant. Total", clave: "cantidad_facturada" },
        { titulo: "Fecha llegada LI", obtener: (o) => o.ticket?.fecha_entrega_li },
        { titulo: "Nota de Crédito", obtener: (o) => o.ticket?.nota_credito },
      ], observacionesFiltradas);
    } else {
      exportarCsv("en-reparto-por-ticket", [
        { titulo: "Fecha creación", clave: "fecha_creacion" },
        { titulo: "N° Ticket", clave: "codigo_ticket" },
        { titulo: "Fecha viaje", clave: "fecha_viaje" },
        { titulo: "Transporte", clave: "empresa_transporte" },
        { titulo: "Estado", obtener: (t) => ETIQUETAS_ESTADO[t.estado] ?? t.estado },
        { titulo: "Factura", clave: "factura" },
        { titulo: "Pedido", clave: "pedido_entrega" },
        { titulo: "Alcance", obtener: (t) => textoAlcance(t) },
        { titulo: "SKU observados", obtener: (t) => textoSkuObservados(t) },
        { titulo: "Cliente", clave: "cliente" },
        { titulo: "Fecha llegada LI", clave: "fecha_entrega_li" },
        { titulo: "Nota de crédito", clave: "nota_credito" },
      ], ticketsFiltrados);
    }
  }

  // `ticket`: se pide tanto desde el botón dentro del detalle (con `seleccionado`)
  // como desde el botón externo en la tabla (sin abrir el detalle). En vez del
  // diálogo nativo del navegador, se pide confirmación con nuestro ConfirmModal;
  // marcarLlegada() hace el cambio recién cuando se confirma ahí.
  function pedirConfirmarLlegada(ticket) {
    setTicketConfirmarLlegada(ticket);
  }

  async function marcarLlegada() {
    const ticket = ticketConfirmarLlegada;
    setTicketConfirmarLlegada(null);
    if (!ticket) return;

    setProcesandoLlegadaId(ticket.id);
    setGuardando(true);
    setError("");
    const { data: sesion } = await supabase.auth.getUser();

    const { error: errorUpdate } = await supabase
      .from("tickets")
      .update({
        usuario_llegada_li: sesion.user.id,
        fecha_entrega_li: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    setGuardando(false);
    setProcesandoLlegadaId(null);

    if (errorUpdate) {
      setError("No se pudo registrar la llegada: " + errorUpdate.message);
      return;
    }
    await recargar();
  }

  function pedirConfirmarNC() {
    if (!notaCredito.trim()) {
      setError("Ingresa el número de Nota de Crédito.");
      return;
    }
    setError("");
    setConfirmarNC(true);
  }

  async function guardarNotaCredito() {
    setConfirmarNC(false);
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
          onExportar={pestana !== "dashboard" ? exportarVistaActual : undefined}
          onQuitarFiltros={limpiarFiltros}
          onRefrescar={refrescarTodo}
          onAbrirFiltros={abrirPanelFiltros}
          filtrosActivos={filtrosActivos}
        />
      </div>

      {pestana === "factura" && (
        <TablaTickets
          tickets={ticketsFiltrados}
          onVerDetalle={abrirDetalle}
          mostrarTransporte
          mostrarSkuObservados
          accionExtra={(t) =>
            t.estado === "EN_RUTA" ? (
              <button
                type="button"
                className="boton-icono boton-confirmar-recepcion"
                onClick={() => pedirConfirmarLlegada(t)}
                disabled={procesandoLlegadaId === t.id}
                title="Marcar llegada a LI"
                aria-label="Marcar llegada a LI"
              >
                <IconoCheck size={16} />
              </button>
            ) : null
          }
        />
      )}
      {pestana === "sku" && (
        <TablaObservaciones
          observaciones={observacionesFiltradas}
          onVerTicket={abrirDetalle}
          mostrarTransporte
          accionExtra={(t) =>
            t.estado === "EN_RUTA" ? (
              <button
                type="button"
                className="boton-icono boton-confirmar-recepcion"
                onClick={() => pedirConfirmarLlegada(t)}
                disabled={procesandoLlegadaId === t.id}
                title="Marcar llegada a LI"
                aria-label="Marcar llegada a LI"
              >
                <IconoCheck size={16} />
              </button>
            ) : null
          }
        />
      )}
      {pestana === "dashboard" && (
        <DashboardTickets tickets={ticketsFiltrados} observaciones={observacionesFiltradas} rol="LI" />
      )}

      <PanelFiltros
        abierto={filtrosAbiertos}
        onCerrar={() => setFiltrosAbiertos(false)}
        valores={borrador}
        onCambiar={setBorrador}
        opcionesTransporte={opcionesTransporte}
        onBuscar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
      />

      {seleccionado && (
        <TicketDetalle
          ticket={seleccionado}
          soloObservacionId={observacionFocoId}
          onCerrar={() => {
            setSeleccionadoId(null);
            setObservacionFocoId(null);
          }}
          acciones={
            seleccionado.estado === "EN_RUTA" || seleccionado.estado === "EN_LI" ? (
              <>
                {error && <p className="mensaje-error">{error}</p>}

                {seleccionado.estado === "EN_RUTA" && (
                  <button type="button" onClick={() => pedirConfirmarLlegada(seleccionado)} disabled={guardando}>
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
                    <button type="button" onClick={pedirConfirmarNC} disabled={guardando}>
                      Guardar NC
                    </button>
                  </div>
                )}
              </>
            ) : null
          }
        />
      )}

      {ticketConfirmarLlegada && (
        <ConfirmModal
          mensaje={`¿Confirmar que el ticket ${ticketConfirmarLlegada.codigo_ticket} llegó a Logística Inversa?`}
          onConfirmar={marcarLlegada}
          onCancelar={() => setTicketConfirmarLlegada(null)}
          cargando={guardando}
        />
      )}

      {confirmarNC && seleccionado && (
        <ConfirmModal
          mensaje={`¿Registrar la NC "${notaCredito}" para el ticket ${seleccionado.codigo_ticket}? El ticket pasará a Solucionado.`}
          onConfirmar={guardarNotaCredito}
          onCancelar={() => setConfirmarNC(false)}
          cargando={guardando}
        />
      )}
    </LayoutLateral>
  );
}
