import { useState } from "react";
import { useTickets } from "../compartido/useTickets";
import { useObservaciones } from "../compartido/useObservaciones";
import { useVistaTickets } from "../compartido/useVistaTickets";
import LayoutLateral from "../compartido/LayoutLateral";
import TablaTickets from "../compartido/TablaTickets";
import TablaObservaciones from "../compartido/TablaObservaciones";
import BarraHerramientas from "../compartido/BarraHerramientas";
import PanelFiltros from "../compartido/PanelFiltros";
import DashboardTickets from "../compartido/DashboardTickets";
import { IconoSeguimiento, IconoDashboard } from "../compartido/iconos";
const PESTANAS = [
  { clave: "factura", etiqueta: "Por factura", icono: IconoSeguimiento },
  { clave: "sku", etiqueta: "Por producto", icono: IconoSeguimiento },
  { clave: "dashboard", etiqueta: "Dashboard", subetiqueta: "(En desarrollo)", icono: IconoDashboard },
];

// Vista de solo lectura para Liquidaciones: mismas tablas y columnas que Logística
// Inversa (incluida "Entrega a transporte"), con exportar CSV, pero sin ningún botón
// de acción ni el detalle con fotos ("Ver") — Liquidaciones solo consulta.
export default function PanelLiquidaciones({ sidebarAbierta }) {
  const { tickets, cargando: cargandoTickets, error: errorCarga, recargar } = useTickets();
  const { observaciones, cargando: cargandoObs, recargar: recargarObs } = useObservaciones();

  const [pestana, setPestana] = useState("factura");
  // Datos de la factura, filtros, orden por encabezado, conteo y exportación a Excel (compartido por todos los roles).
  const vista = useVistaTickets({ tickets, observaciones, pestana });
  const { ticketsFiltrados, observacionesFiltradas } = vista;

  function refrescarTodo() {
    recargar();
    recargarObs();
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
        <TablaTickets tickets={ticketsFiltrados} {...vista.propsTablaFactura} mostrarDetalle={false} />
      )}
      {pestana === "sku" && (
        <TablaObservaciones observaciones={observacionesFiltradas} {...vista.propsTablaProducto} mostrarDetalle={false} />
      )}
      {pestana === "dashboard" && (
        <DashboardTickets tickets={ticketsFiltrados} observaciones={observacionesFiltradas} rol="Liquidaciones" />
      )}

      <PanelFiltros {...vista.propsPanelFiltros} />
    </LayoutLateral>
  );
}
