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
import ModalEntregaTransporte from "../compartido/ModalEntregaTransporte";
import BarraHerramientas from "../compartido/BarraHerramientas";
import PanelFiltros from "../compartido/PanelFiltros";
import DashboardTickets from "../compartido/DashboardTickets";
import { IconoCheck, IconoCamion, IconoSeguimiento, IconoDashboard } from "../compartido/iconos";
import {
  ETIQUETAS_ESTADO,
  textoAlcance,
  textoSkuObservados,
  etiquetaRespuestaVendedor,
  formatearPrecio,
  textoEntregaTransporte,
  textoMotivoRetencion,
} from "../utils/estadosTicket";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";
import { exportarCsv } from "../utils/exportarCsv";

const PESTANAS = [
  { clave: "factura", etiqueta: "Por factura", icono: IconoSeguimiento },
  { clave: "sku", etiqueta: "Por producto", icono: IconoSeguimiento },
  { clave: "dashboard", etiqueta: "Dashboard", icono: IconoDashboard },
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
  // Errores de las acciones que se hacen desde la tabla (✓ de llegada, camión de entrega): se muestran
  // arriba de la tabla porque el popup de detalle puede no estar abierto.
  const [errorAccionTabla, setErrorAccionTabla] = useState("");
  const [ticketConfirmarLlegada, setTicketConfirmarLlegada] = useState(null);
  const [confirmarNC, setConfirmarNC] = useState(false);
  const [ticketEntregaTransporte, setTicketEntregaTransporte] = useState(null);
  const [guardandoEntrega, setGuardandoEntrega] = useState(false);

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
        { titulo: "Precio Unitario", obtener: (o) => (o.codigo_producto ? formatearPrecio(o.precio_unitario) : "") },
        { titulo: "Motivo", obtener: (o) => etiquetaMotivo(o.subcategoria) },
        { titulo: "Categoría", obtener: (o) => (o.categoria === "LOGISTICO" ? "Logístico" : "No logístico") },
        { titulo: "Respuesta vendedor", obtener: (o) => (o.respuesta_vendedor ? etiquetaRespuestaVendedor(o.respuesta_vendedor) : "") },
        { titulo: "Bulto", clave: "numero_bulto" },
        { titulo: "Cant. Reclamada", clave: "cantidad_observada" },
        { titulo: "Cant. Total", clave: "cantidad_facturada" },
        { titulo: "Fecha llegada LI", obtener: (o) => o.ticket?.fecha_entrega_li },
        { titulo: "Entrega a transporte", obtener: (o) => textoEntregaTransporte(o.ticket) },
        { titulo: "Motivo retención", obtener: (o) => textoMotivoRetencion(o.ticket) },
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
        { titulo: "Entrega a transporte", obtener: (t) => textoEntregaTransporte(t) },
        { titulo: "Motivo retención", obtener: (t) => textoMotivoRetencion(t) },
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
    setErrorAccionTabla("");
    const { data: sesion } = await supabase.auth.getUser();

    // .select("id") devuelve las filas realmente modificadas: si la base lo bloquea por permisos
    // (RLS) no da error, solo 0 filas, y sin esto parecería que se guardó.
    const { data: filas, error: errorUpdate } = await supabase
      .from("tickets")
      .update({
        usuario_llegada_li: sesion.user.id,
        fecha_entrega_li: new Date().toISOString(),
      })
      .eq("id", ticket.id)
      .select("id");

    setGuardando(false);
    setProcesandoLlegadaId(null);

    if (errorUpdate || !filas || filas.length === 0) {
      setErrorAccionTabla(
        "No se pudo registrar la llegada" + (errorUpdate ? ": " + errorUpdate.message : " (sin permiso o ticket no encontrado).")
      );
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

  // Registrar (o corregir) si la factura ya se entregó al transporte. Independiente
  // del `estado` del ticket: no participa en fn_calcular_estado_ticket(), solo deja
  // traza informativa (fecha/usuario). Se habilita desde la tabla apenas existe
  // fecha_entrega_li, y queda editable después (abrirEntregaTransporte reabre el
  // modal precargado con lo ya guardado).
  function abrirEntregaTransporte(ticket) {
    setTicketEntregaTransporte(ticket);
  }

  async function guardarEntregaTransporte(valores) {
    const ticket = ticketEntregaTransporte;
    if (!ticket) return;

    setGuardandoEntrega(true);
    setError("");
    setErrorAccionTabla("");
    const { data: sesion } = await supabase.auth.getUser();

    const { data: filas, error: errorUpdate } = await supabase
      .from("tickets")
      .update({
        entrega_transporte: valores.entrega_transporte,
        motivo_retencion: valores.motivo_retencion,
        usuario_entrega_transporte: sesion.user.id,
        fecha_entrega_transporte: new Date().toISOString(),
      })
      .eq("id", ticket.id)
      .select("id");

    setGuardandoEntrega(false);
    setTicketEntregaTransporte(null);

    if (errorUpdate || !filas || filas.length === 0) {
      setErrorAccionTabla(
        "No se pudo guardar la entrega a transporte" +
          (errorUpdate ? ": " + errorUpdate.message : " (sin permiso o ticket no encontrado).")
      );
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
      {errorAccionTabla && <p className="mensaje-error">{errorAccionTabla}</p>}

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
          accionExtra2={(t) =>
            t.fecha_entrega_li ? (
              <button
                type="button"
                className="boton-icono"
                onClick={() => abrirEntregaTransporte(t)}
                title={t.entrega_transporte ? "Editar entrega a transporte" : "Registrar entrega a transporte"}
                aria-label={t.entrega_transporte ? "Editar entrega a transporte" : "Registrar entrega a transporte"}
              >
                <IconoCamion size={16} />
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
          accionExtra2={(t) =>
            t.fecha_entrega_li ? (
              <button
                type="button"
                className="boton-icono"
                onClick={() => abrirEntregaTransporte(t)}
                title={t.entrega_transporte ? "Editar entrega a transporte" : "Registrar entrega a transporte"}
                aria-label={t.entrega_transporte ? "Editar entrega a transporte" : "Registrar entrega a transporte"}
              >
                <IconoCamion size={16} />
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
            // La llegada a LI se marca con el ✓ de la columna "Confirmar recepción" de la tabla;
            // en el popup solo queda la Nota de crédito (cuando el ticket está en GESTION LI).
            seleccionado.estado === "EN_LI" ? (
              <>
                <p className="panel-detalle-titulo-seccion">Acciones</p>
                <div className="accion-rol">
                  <label htmlFor="notaCredito">Nota de crédito</label>
                  <input
                    id="notaCredito"
                    type="text"
                    value={notaCredito}
                    onChange={(e) => setNotaCredito(e.target.value)}
                    placeholder="N° de NC"
                  />
                  {error && <p className="mensaje-error">{error}</p>}
                  <button type="button" onClick={pedirConfirmarNC} disabled={guardando}>
                    Guardar NC
                  </button>
                </div>
              </>
            ) : null
          }
        />
      )}

      {ticketConfirmarLlegada && (
        <ConfirmModal
          mensaje={`¿Confirmar que la factura ${ticketConfirmarLlegada.factura} llegó a Logística Inversa?`}
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

      {ticketEntregaTransporte && (
        <ModalEntregaTransporte
          ticket={ticketEntregaTransporte}
          onGuardar={guardarEntregaTransporte}
          onCancelar={() => setTicketEntregaTransporte(null)}
          cargando={guardandoEntrega}
        />
      )}
    </LayoutLateral>
  );
}
