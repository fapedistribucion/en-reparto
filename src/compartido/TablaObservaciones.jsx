import { ETIQUETAS_ESTADO, formatearFecha } from "../utils/estadosTicket";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";

// Vista a nivel producto/bulto: una fila por observación, con los datos
// del ticket al que pertenece (se espera `observacion.ticket` ya combinado).
// `mostrarTransporte`: igual que en TablaTickets, oculto para el propio transportista.
export default function TablaObservaciones({ observaciones, onVerTicket, mostrarTransporte = false }) {
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
            <th>Estado</th>
            <th>Factura</th>
            <th>Cliente</th>
            {mostrarTransporte && <th>Transporte</th>}
            <th>Posición</th>
            <th>Producto</th>
            <th>Motivo</th>
            <th>Bulto</th>
            <th>Cantidad</th>
            <th>Validado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {observaciones.map((o) => {
            const t = o.ticket;
            const esNoLogistico = o.categoria === "NO_LOGISTICO";
            return (
              <tr key={o.id}>
                <td>{formatearFecha(t?.fecha_creacion)}</td>
                <td>{t?.codigo_ticket ?? "—"}</td>
                <td>
                  {t?.estado && (
                    <span className={`badge-estado badge-estado-${t.estado.toLowerCase()}`}>
                      {ETIQUETAS_ESTADO[t.estado] ?? t.estado}
                    </span>
                  )}
                </td>
                <td>{t?.factura ?? "—"}</td>
                <td>{t?.cliente ?? "—"}</td>
                {mostrarTransporte && <td>{t?.empresa_transporte ?? "—"}</td>}
                <td>{o.posicion ?? "—"}</td>
                <td>
                  {o.codigo_producto ? (
                    <>
                      <strong>{o.codigo_producto}</strong>
                      <div className="dato-menor">{o.nombre_producto}</div>
                    </>
                  ) : (
                    "Toda la factura"
                  )}
                </td>
                <td>{etiquetaMotivo(o.subcategoria)}</td>
                <td>{o.numero_bulto ?? "—"}</td>
                <td>{o.posicion != null ? `${o.cantidad_observada} de ${o.cantidad_facturada}` : "—"}</td>
                <td>
                  {esNoLogistico ? (
                    <span className={o.validado === "VALIDADO" ? "badge-validacion-ok" : "badge-pendiente"}>
                      {o.validado === "VALIDADO" ? "Validado" : "Pendiente"}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <button type="button" onClick={() => t && onVerTicket(t)} disabled={!t}>
                    Ver ticket
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
