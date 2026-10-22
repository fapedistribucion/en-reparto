import { useState } from "react";
import { useTickets } from "../compartido/useTickets";
import { useVistaTickets } from "../compartido/useVistaTickets";
import TablaTickets from "../compartido/TablaTickets";
import TicketDetalle from "../compartido/TicketDetalle";
import BarraHerramientas from "../compartido/BarraHerramientas";
import PanelFiltros from "../compartido/PanelFiltros";

// Vista de seguimiento del transportista: no tiene pestañas (solo la tabla por ticket,
// no la vista "por producto"), no muestra la columna "Transporte" (todos sus tickets son
// de su propia empresa) ni "Confirmar recepción" (no es una acción del transportista, ya
// que no se pasa `accionExtra` a TablaTickets).
export default function Seguimiento() {
  const { tickets, cargando, error, recargar } = useTickets();
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  // Datos de la factura (fecha, región, departamento, centro), filtros, orden por encabezado, conteo y
  // exportación a Excel: lo mismo que ven los demás roles, sin "Transporte" (todos sus tickets son de su empresa).
  const vista = useVistaTickets({
    tickets,
    pestana: "factura",
    mostrarTransporte: false,
    mostrarSkuObservados: true,
    nombreExportacion: "en-reparto-seguimiento",
  });
  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  if (cargando) return <p>Cargando tickets...</p>;
  if (error) return <p className="mensaje-error">No se pudieron cargar los tickets: {error}</p>;

  return (
    <div>
      <div className="encabezado-vista">
        <h2 className="titulo-vista">Seguimiento Ticket</h2>
        <BarraHerramientas
          onExportar={vista.exportarVistaActual}
          onQuitarFiltros={vista.limpiarFiltros}
          onRefrescar={recargar}
          onAbrirFiltros={vista.abrirPanelFiltros}
          filtrosActivos={vista.filtrosActivos}
        />
      </div>

      <TablaTickets tickets={vista.ticketsFiltrados} onVerDetalle={(t) => setSeleccionadoId(t.id)} {...vista.propsTablaFactura} />

      <PanelFiltros {...vista.propsPanelFiltros} />

      {seleccionado && <TicketDetalle ticket={seleccionado} onCerrar={() => setSeleccionadoId(null)} />}
    </div>
  );
}
