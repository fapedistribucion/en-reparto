import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTickets } from "../compartido/useTickets";
import { useObservaciones } from "../compartido/useObservaciones";
import LayoutLateral from "../compartido/LayoutLateral";
import TablaTickets from "../compartido/TablaTickets";
import TablaObservaciones from "../compartido/TablaObservaciones";
import TicketDetalle from "../compartido/TicketDetalle";
import ValidarObservacion from "./ValidarObservacion";
import BarraHerramientas from "../compartido/BarraHerramientas";
import PanelFiltros from "../compartido/PanelFiltros";
import DashboardTickets from "../compartido/DashboardTickets";
import { ETIQUETAS_ESTADO } from "../utils/estadosTicket";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";
import { exportarCsv } from "../utils/exportarCsv";

const PESTANAS = [
  { clave: "factura", etiqueta: "Seguimiento a nivel factura" },
  { clave: "sku", etiqueta: "Seguimiento a nivel SKU" },
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

export default function PanelSAC() {
  const { tickets, cargando: cargandoTickets, error: errorCarga, recargar } = useTickets();
  const { observaciones, cargando: cargandoObs, recargar: recargarObs } = useObservaciones();

  const [pestana, setPestana] = useState("factura");
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtroValidacion, setFiltroValidacion] = useState("");

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  const opcionesTransporte = useMemo(
    () => [...new Set(tickets.map((t) => t.empresa_transporte).filter(Boolean))].sort(),
    [tickets]
  );

  const filtrosActivos = Object.values(filtros).some((v) => v);

  const ticketsFiltrados = useMemo(
    () =>
      tickets.filter(
        (t) =>
          coincideTexto(t.codigo_ticket, filtros.ticket) &&
          coincideTexto(t.factura, filtros.factura) &&
          (!filtros.transporte || t.empresa_transporte === filtros.transporte) &&
          (!filtros.estado || t.estado === filtros.estado) &&
          coincideFecha(t.fecha_creacion, filtros.desde, filtros.hasta)
      ),
    [tickets, filtros]
  );

  const observacionesConTicket = useMemo(
    () => observaciones.map((o) => ({ ...o, ticket: tickets.find((t) => t.id === o.ticket_id) })),
    [observaciones, tickets]
  );

  const observacionesFiltradas = useMemo(() => {
    let lista = observacionesConTicket.filter(
      (o) =>
        coincideTexto(o.ticket?.codigo_ticket, filtros.ticket) &&
        coincideTexto(o.ticket?.factura, filtros.factura) &&
        (!filtros.transporte || o.ticket?.empresa_transporte === filtros.transporte) &&
        (!filtros.estado || o.ticket?.estado === filtros.estado) &&
        coincideFecha(o.ticket?.fecha_creacion, filtros.desde, filtros.hasta)
    );
    if (filtroValidacion === "pendiente") {
      lista = lista.filter((o) => o.categoria === "NO_LOGISTICO" && o.validado !== "VALIDADO");
    } else if (filtroValidacion === "validado") {
      lista = lista.filter((o) => o.categoria === "NO_LOGISTICO" && o.validado === "VALIDADO");
    }
    return lista;
  }, [observacionesConTicket, filtros, filtroValidacion]);

  function abrirDetalle(ticket) {
    setSeleccionadoId(ticket.id);
    setMotivoAnulacion("");
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
      exportarCsv("en-reparto-por-sku", [
        { titulo: "N° Ticket", obtener: (o) => o.ticket?.codigo_ticket },
        { titulo: "Estado", obtener: (o) => ETIQUETAS_ESTADO[o.ticket?.estado] ?? o.ticket?.estado },
        { titulo: "Factura", obtener: (o) => o.ticket?.factura },
        { titulo: "Cliente", obtener: (o) => o.ticket?.cliente },
        { titulo: "Transporte", obtener: (o) => o.ticket?.empresa_transporte },
        { titulo: "Posición", clave: "posicion" },
        { titulo: "Código producto", clave: "codigo_producto" },
        { titulo: "Producto", clave: "nombre_producto" },
        { titulo: "Motivo", obtener: (o) => etiquetaMotivo(o.subcategoria) },
        { titulo: "Bulto", clave: "numero_bulto" },
        { titulo: "Cant. observada", clave: "cantidad_observada" },
        { titulo: "Cant. facturada", clave: "cantidad_facturada" },
        { titulo: "Validado", obtener: (o) => (o.validado === "VALIDADO" ? "Sí" : "No") },
      ], observacionesFiltradas);
    } else {
      exportarCsv("en-reparto-por-ticket", [
        { titulo: "Fecha creación", clave: "fecha_creacion" },
        { titulo: "N° Ticket", clave: "codigo_ticket" },
        { titulo: "Estado", obtener: (t) => ETIQUETAS_ESTADO[t.estado] ?? t.estado },
        { titulo: "Factura", clave: "factura" },
        { titulo: "Pedido", clave: "pedido_entrega" },
        { titulo: "Cliente", clave: "cliente" },
        { titulo: "Transporte", clave: "empresa_transporte" },
        { titulo: "Llegada a LI", clave: "fecha_entrega_li" },
        { titulo: "Nota de crédito", clave: "nota_credito" },
      ], ticketsFiltrados);
    }
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

  if (cargandoTickets || cargandoObs) {
    return (
      <LayoutLateral items={PESTANAS} activo={pestana} onCambiar={setPestana}>
        <p>Cargando tickets...</p>
      </LayoutLateral>
    );
  }

  return (
    <LayoutLateral items={PESTANAS} activo={pestana} onCambiar={setPestana}>
      <h2>{PESTANAS.find((p) => p.clave === pestana)?.etiqueta}</h2>
      {errorCarga && <p className="mensaje-error">No se pudieron cargar los tickets: {errorCarga}</p>}

      <BarraHerramientas
        onExportar={pestana !== "dashboard" ? exportarVistaActual : undefined}
        onQuitarFiltros={limpiarFiltros}
        onRefrescar={refrescarTodo}
        onAbrirFiltros={abrirPanelFiltros}
        filtrosActivos={filtrosActivos}
      />

      {pestana === "sku" && (
        <label className="filtro-select filtro-validacion">
          Validación
          <select value={filtroValidacion} onChange={(e) => setFiltroValidacion(e.target.value)}>
            <option value="">Todas</option>
            <option value="pendiente">Pendientes de validar</option>
            <option value="validado">Validadas</option>
          </select>
        </label>
      )}

      {pestana === "factura" && (
        <TablaTickets tickets={ticketsFiltrados} onVerDetalle={abrirDetalle} mostrarTransporte />
      )}
      {pestana === "sku" && (
        <TablaObservaciones observaciones={observacionesFiltradas} onVerTicket={abrirDetalle} mostrarTransporte />
      )}
      {pestana === "dashboard" && (
        <DashboardTickets tickets={ticketsFiltrados} observaciones={observacionesFiltradas} rol="SAC" />
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
    </LayoutLateral>
  );
}
