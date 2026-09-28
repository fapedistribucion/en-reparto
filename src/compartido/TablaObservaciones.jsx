import { formatearFecha } from "../utils/estadosTicket";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";

const ETIQUETAS_CATEGORIA = {
  LOGISTICO: "Logístico",
  NO_LOGISTICO: "No logístico",
};

// Vista a nivel producto/bulto: una fila por observación, con los datos
// del ticket al que pertenece (se espera `observacion.ticket` ya combinado).
// `mostrarTransporte`: se mantiene como prop por compatibilidad; SAC y LI siempre la piden en true,
// ya que "Transporte" es columna fija en esta vista.
// `onVerTicket(ticket, observacionId)`: abre el detalle enfocado solo en esta observación
// (el botón dice "Ver evidencias" porque en esta vista solo importan las fotos del producto).
// `accionExtra(ticket)`: botón adicional por fila (ej. "Marcar llegada a LI").
//
// "Fecha viaje" viene de facturas_data.fecha_viaje, unida por número de factura (ver useFacturasViaje).
export default function TablaObservaciones({ observaciones, onVerTicket, mostrarTransporte = false, accionExtra }) {
  if (observaciones.length === 0) {
    return <p>No hay bultos/productos para mostrar.</p>;
  }

  return (
    <div className="contenedor-tabla">
      <table className="tabla-tickets">
        <thead>
          <tr>
            <th>Fecha creación</th>
            <th>N° Ticket</th>
            <th>Fecha viaje</th>
            {mostrarTransporte && <th>Transporte</th>}
            <th>Factura</th>
            <th>Cliente</th>
            <th>Cód. Producto</th>
            <th>Producto</th>
            <th>Motivo</th>
            <th>Categoría</th>
            <th>Bulto</th>
            <th>Cant. Obs.</th>
            <th>Cant. Total</th>
            <th>Fecha llegada LI</th>
            <th>Nota de Crédito</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {observaciones.map((o) => {
            const t = o.ticket;
            return (
              <tr key={o.id}>
                <td>{formatearFecha(t?.fecha_creacion)}</td>
                <td>{t?.codigo_ticket ?? "—"}</td>
                <td>{formatearFecha(t?.fecha_viaje)}</td>
                {mostrarTransporte && <td>{t?.empresa_transporte ?? "—"}</td>}
                <td>{t?.factura ?? "—"}</td>
                <td>{t?.cliente ?? "—"}</td>
                <td>{o.codigo_producto ?? "—"}</td>
                <td>{o.codigo_producto ? o.nombre_producto : "Toda la factura"}</td>
                <td>{etiquetaMotivo(o.subcategoria)}</td>
                <td>{ETIQUETAS_CATEGORIA[o.categoria] ?? o.categoria}</td>
                <td>{o.numero_bulto ?? "—"}</td>
                <td>{o.posicion != null ? o.cantidad_observada : "—"}</td>
                <td>{o.posicion != null ? o.cantidad_facturada : "—"}</td>
                <td>{formatearFecha(t?.fecha_entrega_li)}</td>
                <td>{t?.nota_credito ?? "—"}</td>
                <td>
                  <div className="acciones-fila">
                    {t && accionExtra?.(t)}
                    <button type="button" onClick={() => t && onVerTicket(t, o.id)} disabled={!t}>
                      Ver evidencias
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
