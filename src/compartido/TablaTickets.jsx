import {
  ETIQUETAS_ESTADO,
  formatearFecha,
  fechaOPendiente,
  textoAlcance,
  textoSkuObservados,
} from "../utils/estadosTicket";

// `mostrarTransporte`: agrega la columna de empresa de transporte (SAC/LI la necesitan; el propio
// transportista no, ya que en su vista todos los tickets son de su misma empresa).
// `mostrarSkuObservados`: agrega la columna "SKU observados" (cantidad de productos distintos
// observados). Solo la usan SAC/LI; para transportista no aporta y se mantiene oculta por defecto.
// `accionExtra(ticket)`: botón adicional por fila (ej. confirmar llegada a LI), sin tener que abrir
// el detalle. Va en la columna fija "Confirmar recepción". Devuelve null/undefined si no aplica.
// "Fecha viaje" viene de facturas_data.fecha_viaje, unida por número de factura (ver useFacturasViaje);
// se espera que el ticket ya traiga ese campo combinado.
// Las últimas 2 columnas ("Confirmar recepción" y "Detalle") quedan fijas a la derecha (sticky) para
// no tener que scrollear hasta el final de la tabla para usarlas.
export default function TablaTickets({
  tickets,
  onVerDetalle,
  mostrarTransporte = false,
  mostrarSkuObservados = false,
  accionExtra,
}) {
  if (tickets.length === 0) {
    return <p>No hay tickets para mostrar.</p>;
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
            <th>Estado</th>
            <th>Factura</th>
            <th>Pedido</th>
            <th>Alcance</th>
            {mostrarSkuObservados && <th>SKU observados</th>}
            <th>Cliente</th>
            <th>Fecha llegada LI</th>
            <th>Nota de crédito</th>
            <th>Por validar</th>
            <th className="col-fija-accion">Confirmar recepción</th>
            <th className="col-fija-detalle">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{formatearFecha(t.fecha_creacion)}</td>
              <td>{t.codigo_ticket}</td>
              <td>{formatearFecha(t.fecha_viaje)}</td>
              {mostrarTransporte && <td>{t.empresa_transporte}</td>}
              <td>
                <span className={`badge-estado badge-estado-${t.estado?.toLowerCase()}`}>
                  {ETIQUETAS_ESTADO[t.estado] ?? t.estado}
                </span>
              </td>
              <td>{t.factura}</td>
              <td>{t.pedido_entrega}</td>
              <td>{textoAlcance(t)}</td>
              {mostrarSkuObservados && <td>{textoSkuObservados(t)}</td>}
              <td>{t.cliente}</td>
              <td>{fechaOPendiente(t.fecha_entrega_li)}</td>
              <td>{t.nota_credito ?? "Pendiente"}</td>
              <td>
                {t.n_pendientes_validacion > 0 ? (
                  <span className="badge-pendiente">{t.n_pendientes_validacion} pendiente(s)</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="col-fija-accion">{accionExtra?.(t)}</td>
              <td className="col-fija-detalle">
                <button type="button" onClick={() => onVerDetalle(t)}>
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
