import { precargarDetalle } from "./cargaDetalle";
import {
  ETIQUETAS_ESTADO,
  formatearFecha,
  fechaOPendiente,
  textoAlcance,
  textoSkuObservados,
  textoEntregaTransporte,
  textoMotivoRetencion,
} from "../utils/estadosTicket";

// `mostrarTransporte`: agrega la columna de empresa de transporte (SAC/LI la necesitan; el propio
// transportista no, ya que en su vista todos los tickets son de su misma empresa).
// `mostrarSkuObservados`: agrega la columna "SKU observados" (cantidad de productos distintos
// observados). Solo la usan SAC/LI; para transportista no aporta y se mantiene oculta por defecto.
// `mostrarDetalle`: controla si se muestra la columna fija "Detalle" con el botón "Ver" (y por lo
// tanto si hace falta `onVerDetalle`). Por defecto true; Liquidaciones la pasa en false porque su
// vista es de solo lectura, sin el modal de detalle/fotos.
// `accionExtra(ticket)`: botón adicional por fila (confirmar llegada a LI), en la columna fija
// "Confirmar recepción" (solo LI la usa).
// `accionExtra2(ticket)`: segundo botón adicional (registrar/editar entrega a transporte), en la
// columna fija "Registrar entrega" (también solo LI).
// "Fecha viaje" viene de facturas_data.fecha_viaje, unida por número de factura (ver useFacturasViaje);
// se espera que el ticket ya traiga ese campo combinado.
// Las columnas de acción y "Detalle" quedan fijas a la derecha (sticky) para no tener que scrollear
// hasta el final de la tabla para usarlas.
export default function TablaTickets({
  tickets,
  onVerDetalle,
  mostrarTransporte = false,
  mostrarSkuObservados = false,
  mostrarDetalle = true,
  accionExtra,
  accionExtra2,
}) {
  // Con dos columnas de acción, "Confirmar recepción" se fija a la izquierda de "Registrar entrega".
  const claseAccionPrevia = accionExtra2 ? "col-fija-accion col-fija-accion-previa" : "col-fija-accion";

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
            <th>Entrega a transporte</th>
            <th>Motivo retención</th>
            <th>Nota de crédito</th>
            {accionExtra && <th className={claseAccionPrevia}>
                Confirmar
                <br />
                recepción
              </th>}
            {accionExtra2 && <th className="col-fija-accion">
                Registrar
                <br />
                entrega
              </th>}
            {mostrarDetalle && <th className="col-fija-detalle">Detalle</th>}
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
              <td>{textoEntregaTransporte(t)}</td>
              <td>{textoMotivoRetencion(t)}</td>
              <td>{t.nota_credito ?? "Pendiente"}</td>
              {accionExtra && <td className={claseAccionPrevia}>{accionExtra(t)}</td>}
              {accionExtra2 && <td className="col-fija-accion">{accionExtra2(t)}</td>}
              {mostrarDetalle && (
                <td className="col-fija-detalle">
                  <button
                    type="button"
                    onClick={() => onVerDetalle(t)}
                    onMouseEnter={() => precargarDetalle(t.id)}
                    onFocus={() => precargarDetalle(t.id)}
                    onTouchStart={() => precargarDetalle(t.id)}
                  >
                    Ver
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
