import { precargarDetalle } from "./cargaDetalle";
import {
  ETIQUETAS_ESTADO,
  formatearFecha,
  fechaOPendiente,
  etiquetaRespuestaVendedor,
  formatearPrecio,
  textoEntregaTransporte,
  textoMotivoRetencion,
} from "../utils/estadosTicket";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";

const ETIQUETAS_CATEGORIA = {
  LOGISTICO: "Logístico",
  NO_LOGISTICO: "No logístico",
};

// Vista a nivel producto/bulto: una fila por observación, con los datos
// del ticket al que pertenece (se espera `observacion.ticket` ya combinado).
// `mostrarTransporte`: se mantiene como prop por compatibilidad; SAC y LI siempre la piden en true,
// ya que "Transporte" es columna fija en esta vista.
// `mostrarDetalle`: controla si se muestra la columna fija "Detalle" con el botón "Ver" (y por lo
// tanto si hace falta `onVerTicket`). Por defecto true; Liquidaciones la pasa en false.
// `onVerTicket(ticket, observacionId)`: abre el detalle enfocado solo en esta observación.
// `accionExtra(ticket)`: botón adicional por fila (confirmar llegada a LI), columna fija
// "Confirmar recepción".
// `accionExtra2(ticket)`: segundo botón adicional (registrar/editar entrega a transporte), columna
// fija "Registrar entrega".
//
// "Fecha viaje" viene de facturas_data.fecha_viaje, unida por número de factura (ver useFacturasViaje).
// Las columnas de acción y "Detalle" quedan fijas a la derecha (sticky) para no tener que scrollear
// hasta el final de la tabla para usarlas.
export default function TablaObservaciones({
  observaciones,
  onVerTicket,
  mostrarTransporte = false,
  mostrarDetalle = true,
  accionExtra,
  accionExtra2,
}) {
  // Con dos columnas de acción, "Confirmar recepción" se fija a la izquierda de "Registrar entrega".
  const claseAccionPrevia = accionExtra2 ? "col-fija-accion col-fija-accion-previa" : "col-fija-accion";

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
            <th>Estado</th>
            <th>Factura</th>
            <th>Cliente</th>
            <th>Cód. Producto</th>
            <th>Producto</th>
            <th>Precio Unitario</th>
            <th>Motivo</th>
            <th>Categoría</th>
            <th>Respuesta vendedor</th>
            <th>Bulto</th>
            <th>Cant. Reclamada</th>
            <th>Cant. Total</th>
            <th>Fecha llegada LI</th>
            <th>Entrega a transporte</th>
            <th>Motivo retención</th>
            <th>Nota de Crédito</th>
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
          {observaciones.map((o) => {
            const t = o.ticket;
            return (
              <tr key={o.id}>
                <td>{formatearFecha(t?.fecha_creacion)}</td>
                <td>{t?.codigo_ticket ?? "—"}</td>
                <td>{formatearFecha(t?.fecha_viaje)}</td>
                {mostrarTransporte && <td>{t?.empresa_transporte ?? "—"}</td>}
                <td>
                  {t?.estado ? (
                    <span className={`badge-estado badge-estado-${t.estado.toLowerCase()}`}>
                      {ETIQUETAS_ESTADO[t.estado] ?? t.estado}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{t?.factura ?? "—"}</td>
                <td>{t?.cliente ?? "—"}</td>
                <td>{o.codigo_producto ?? "—"}</td>
                <td>{o.codigo_producto ? o.nombre_producto : "Toda la factura"}</td>
                <td>{o.codigo_producto ? formatearPrecio(o.precio_unitario) : "—"}</td>
                <td>{etiquetaMotivo(o.subcategoria)}</td>
                <td>{ETIQUETAS_CATEGORIA[o.categoria] ?? o.categoria}</td>
                <td>
                  {o.respuesta_vendedor ? (
                    <span className={`badge-respuesta badge-respuesta-${o.respuesta_vendedor.toLowerCase()}`}>
                      {etiquetaRespuestaVendedor(o.respuesta_vendedor)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{o.numero_bulto ?? "—"}</td>
                <td>{o.posicion != null ? o.cantidad_observada : "—"}</td>
                <td>{o.posicion != null ? o.cantidad_facturada : "—"}</td>
                <td>{fechaOPendiente(t?.fecha_entrega_li)}</td>
                <td>{textoEntregaTransporte(t)}</td>
                <td>{textoMotivoRetencion(t)}</td>
                <td>{t?.nota_credito ?? "Pendiente"}</td>
                {accionExtra && <td className={claseAccionPrevia}>{t && accionExtra(t)}</td>}
                {accionExtra2 && <td className="col-fija-accion">{t && accionExtra2(t)}</td>}
                {mostrarDetalle && (
                  <td className="col-fija-detalle">
                    <button
                      type="button"
                      onClick={() => t && onVerTicket(t, o.id)}
                      onMouseEnter={() => t && precargarDetalle(t.id, o.id)}
                      onFocus={() => t && precargarDetalle(t.id, o.id)}
                      onTouchStart={() => t && precargarDetalle(t.id, o.id)}
                      disabled={!t}
                    >
                      Ver
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
