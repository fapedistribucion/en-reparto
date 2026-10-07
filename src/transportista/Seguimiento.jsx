import { useMemo, useState } from "react";
import { useTickets } from "../compartido/useTickets";
import { useFacturasViaje } from "../compartido/useFacturasViaje";
import TablaTickets from "../compartido/TablaTickets";
import TicketDetalle from "../compartido/TicketDetalle";
import BarraHerramientas from "../compartido/BarraHerramientas";
import PanelFiltros from "../compartido/PanelFiltros";
import { ETIQUETAS_ESTADO, textoAlcance, textoSkuObservados, textoNotaCredito } from "../utils/estadosTicket";
import { exportarCsv } from "../utils/exportarCsv";

const FILTROS_VACIOS = { ticket: "", factura: "", pedido: "", transporte: "", estado: "", desde: "", hasta: "" };

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

// Vista de seguimiento del transportista: no tiene pestañas (solo la tabla por ticket,
// no la vista "por producto"), no muestra la columna "Transporte" (todos sus tickets son
// de su propia empresa) ni "Confirmar recepción" (no es una acción del transportista, ya
// que no se pasa `accionExtra` a TablaTickets).
export default function Seguimiento() {
  const { tickets, cargando, error, recargar } = useTickets();
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  const facturasVisibles = useMemo(() => tickets.map((t) => t.factura), [tickets]);
  const fechasViaje = useFacturasViaje(facturasVisibles);

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
          coincideTexto(t.pedido_entrega, filtros.pedido) &&
          (!filtros.transporte || t.empresa_transporte === filtros.transporte) &&
          (!filtros.estado || t.estado === filtros.estado) &&
          coincideFecha(t.fecha_creacion, filtros.desde, filtros.hasta)
      ),
    [ticketsConFechaViaje, filtros]
  );

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

  function exportarVistaActual() {
    exportarCsv(
      "en-reparto-seguimiento",
      [
        { titulo: "Fecha creación", clave: "fecha_creacion" },
        { titulo: "N° Ticket", clave: "codigo_ticket" },
        { titulo: "Fecha viaje", clave: "fecha_viaje" },
        { titulo: "Estado", obtener: (t) => ETIQUETAS_ESTADO[t.estado] ?? t.estado },
        { titulo: "Factura", clave: "factura" },
        { titulo: "Pedido", clave: "pedido_entrega" },
        { titulo: "Alcance", obtener: (t) => textoAlcance(t) },
        { titulo: "SKU observados", obtener: (t) => textoSkuObservados(t) },
        { titulo: "Cliente", clave: "cliente" },
        { titulo: "Fecha llegada LI", clave: "fecha_entrega_li" },
        { titulo: "Nota de crédito", obtener: (t) => textoNotaCredito(t) },
      ],
      ticketsFiltrados
    );
  }

  if (cargando) return <p>Cargando tickets...</p>;
  if (error) return <p className="mensaje-error">No se pudieron cargar los tickets: {error}</p>;

  return (
    <div>
      <div className="encabezado-vista">
        <h2 className="titulo-vista">Seguimiento Ticket</h2>
        <BarraHerramientas
          onExportar={exportarVistaActual}
          onQuitarFiltros={limpiarFiltros}
          onRefrescar={recargar}
          onAbrirFiltros={abrirPanelFiltros}
          filtrosActivos={filtrosActivos}
        />
      </div>

      <TablaTickets tickets={ticketsFiltrados} onVerDetalle={(t) => setSeleccionadoId(t.id)} mostrarSkuObservados />

      <PanelFiltros
        abierto={filtrosAbiertos}
        onCerrar={() => setFiltrosAbiertos(false)}
        valores={borrador}
        onCambiar={setBorrador}
        opcionesTransporte={[]}
        onBuscar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
      />

      {seleccionado && <TicketDetalle ticket={seleccionado} onCerrar={() => setSeleccionadoId(null)} />}
    </div>
  );
}
