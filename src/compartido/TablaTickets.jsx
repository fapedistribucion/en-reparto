import { ETIQUETAS_ESTADO, formatearFecha, textoAlcance, textoSkuObservados } from "../utils/estadosTicket";

// `mostrarTransporte`: agrega la columna de empresa de transporte (SAC/LI la necesitan; el propio
// transportista no, ya que en su vista todos los tickets son de su misma empresa).
// `mostrarSkuObservados`: agrega la columna "SKU observados" (cantidad de productos distintos
// observados). Solo la usan SAC/LI; para transportista no aporta y se mantiene oculta por defecto.
// `accionExtra(ticket)`: botón adicional por fila (ej. "Marcar llegada a LI"), sin tener que abrir el detalle.
// Devuelve null/undefined para esa fila si no aplica.
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
            <th>Estado</th>
            <th>Factura</th>
            <th>Pedido</th>
            <th>Alcance</th>
            {mostrarSkuObservados && <th>SKU observados</th>}
            <th>Cliente</th>
            {mostrarTransporte && <th>Transporte</th>}
            <th>Llegada a LI</th>
            <th>Nota de crédito</th>
            <th>Por validar</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{formatearFecha(t.fecha_creacion)}</td>
              <td>{t.codigo_ticket}</td>
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
              {mostrarTransporte && <td>{t.empresa_transporte}</td>}
              <td>{formatearFecha(t.fecha_entrega_li)}</td>
              <td>{t.nota_credito ?? "—"}</td>
              <td>
                {t.n_pendientes_validacion > 0 ? (
                  <span className="badge-pendiente">{t.n_pendientes_validacion} pendiente(s)</span>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <div className="acciones-fila">
                  {accionExtra?.(t)}
                  <button type="button" onClick={() => onVerDetalle(t)}>
                    Ver detalle
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
