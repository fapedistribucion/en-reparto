import { useMemo, useState } from "react";
import { useDatosFactura, conDatosFactura } from "./useDatosFactura";
import { useOrdenTabla, ordenarFilas } from "./useOrdenTabla";
import { FILTROS_VACIOS, filtrarTickets, filtrarObservaciones, hayFiltros } from "./filtrosTickets";
import { columnasTickets, columnasObservaciones } from "./columnas";
import { exportarExcel } from "../utils/exportarExcel";
import { etiquetaMotivo, etiquetasMotivosConocidos } from "../utils/etiquetasMotivo";
import { REGIONES, SIN_REGION } from "../config";

function pie(cantidad, singular, plural) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

// Todo lo que comparten las vistas de tickets de los 4 roles: datos de la factura (fecha, región,
// departamento, centro), filtros, orden por encabezado, conteo del pie y exportación a Excel.
// Cada panel solo decide qué columnas opcionales muestra y qué hace con las filas (acciones, detalle).
//
//   tickets / observaciones: lo que devuelven useTickets / useObservaciones (observaciones puede faltar).
//   pestana: "factura" | "sku" | "dashboard" (define el filtro de Motivo y qué se exporta).
export function useVistaTickets({
  tickets,
  observaciones = [],
  pestana = "factura",
  mostrarTransporte = true,
  mostrarSkuObservados = true,
  nombreExportacion = "en-reparto-por-ticket",
}) {
  const facturas = useMemo(() => tickets.map((t) => t.factura), [tickets]);
  const { datos: datosFactura, listo: datosListos } = useDatosFactura(facturas);

  // Se combina una sola vez aquí para que "Por factura" y "Por producto" tengan fecha, región, etc.
  const ticketsEnriquecidos = useMemo(() => tickets.map((t) => conDatosFactura(t, datosFactura)), [tickets, datosFactura]);

  const observacionesConTicket = useMemo(() => {
    const porId = new Map(ticketsEnriquecidos.map((t) => [t.id, t]));
    return observaciones.map((o) => ({ ...o, ticket: porId.get(o.ticket_id) }));
  }, [observaciones, ticketsEnriquecidos]);

  // ----- filtros -----
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const opcionesTransporte = useMemo(
    () => [...new Set(tickets.map((t) => t.empresa_transporte).filter(Boolean))].sort(),
    [tickets]
  );

  // "Sin región" solo aparece como opción cuando de verdad hay registros sin región.
  const opcionesRegion = useMemo(() => {
    const haySin = datosListos && ticketsEnriquecidos.some((t) => !t.region);
    return haySin ? [...REGIONES, SIN_REGION] : REGIONES;
  }, [datosListos, ticketsEnriquecidos]);

  const opcionesMotivo = useMemo(
    () =>
      [...new Set([...etiquetasMotivosConocidos(), ...observaciones.map((o) => etiquetaMotivo(o.subcategoria))])].sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    [observaciones]
  );

  const filtrosActivos = hayFiltros(filtros, pestana);

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

  // ----- columnas, orden y filas -----
  const columnasFactura = useMemo(
    () => columnasTickets({ mostrarTransporte, mostrarSkuObservados }),
    [mostrarTransporte, mostrarSkuObservados]
  );
  const columnasProducto = useMemo(() => columnasObservaciones({ mostrarTransporte }), [mostrarTransporte]);

  const ordenFactura = useOrdenTabla();
  const ordenProducto = useOrdenTabla();

  const ticketsFiltrados = useMemo(
    () => ordenarFilas(filtrarTickets(ticketsEnriquecidos, filtros), columnasFactura, ordenFactura.orden),
    [ticketsEnriquecidos, filtros, columnasFactura, ordenFactura.orden]
  );

  const observacionesFiltradas = useMemo(
    () => ordenarFilas(filtrarObservaciones(observacionesConTicket, filtros), columnasProducto, ordenProducto.orden),
    [observacionesConTicket, filtros, columnasProducto, ordenProducto.orden]
  );

  // ----- exportar (lo que se ve: filtrado y en el orden elegido) -----
  function exportarVistaActual() {
    if (pestana === "sku") {
      exportarExcel("en-reparto-por-producto", columnasProducto, observacionesFiltradas, "Por producto");
    } else {
      exportarExcel(nombreExportacion, columnasFactura, ticketsFiltrados, "Por factura");
    }
  }

  return {
    // datos
    ticketsFiltrados,
    observacionesFiltradas,
    // propiedades listas para las tablas
    propsTablaFactura: {
      columnas: columnasFactura,
      orden: ordenFactura.orden,
      onOrdenar: ordenFactura.alternar,
      pie: pie(ticketsFiltrados.length, "ticket", "tickets"),
    },
    propsTablaProducto: {
      columnas: columnasProducto,
      orden: ordenProducto.orden,
      onOrdenar: ordenProducto.alternar,
      pie: pie(observacionesFiltradas.length, "producto", "productos"),
    },
    // barra de herramientas y panel de filtros
    filtrosActivos,
    abrirPanelFiltros,
    limpiarFiltros,
    exportarVistaActual,
    propsPanelFiltros: {
      abierto: filtrosAbiertos,
      onCerrar: () => setFiltrosAbiertos(false),
      valores: borrador,
      onCambiar: setBorrador,
      opcionesTransporte,
      opcionesRegion,
      opcionesMotivo,
      mostrarMotivo: pestana === "sku",
      onBuscar: aplicarFiltros,
      onLimpiar: limpiarFiltros,
    },
  };
}
