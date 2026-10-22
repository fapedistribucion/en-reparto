import { precargarDetalle } from "./cargaDetalle";
import ContenedorTabla from "./ContenedorTabla";
import EncabezadoOrdenable from "./EncabezadoOrdenable";
import { contenidoCelda } from "./columnas";

// Vista a nivel producto/bulto ("Por producto"): una fila por observación, con los datos
// del ticket al que pertenece (se espera `observacion.ticket` ya combinado).
// `columnas`: definición de columnas (ver columnas.jsx → columnasObservaciones); la misma sirve para el orden y el Excel.
// `orden` / `onOrdenar`: orden por clic en el encabezado. `pie`: conteo al pie ("40 productos").
// `mostrarDetalle`: controla si se muestra la columna fija "Detalle" con el botón "Ver" (y por lo
// tanto si hace falta `onVerTicket`). Por defecto true; Liquidaciones la pasa en false.
// `onVerTicket(ticket, observacionId)`: abre el detalle enfocado solo en esta observación.
// `accionExtra(ticket)`: botón adicional por fila (confirmar llegada a LI), columna fija
// "Confirmar recepción".
// `accionExtra2(ticket)`: segundo botón adicional (registrar/editar entrega a transporte), columna
// fija "Registrar entrega".
// Las columnas de acción y "Detalle" quedan fijas a la derecha (sticky) para no tener que scrollear
// hasta el final de la tabla para usarlas.
export default function TablaObservaciones({
  observaciones,
  columnas,
  orden,
  onOrdenar,
  pie,
  onVerTicket,
  mostrarDetalle = true,
  accionExtra,
  accionExtra2,
}) {
  // Con dos columnas de acción, "Confirmar recepción" se fija a la izquierda de "Registrar entrega".
  const claseAccionPrevia = accionExtra2 ? "col-fija-accion col-fija-accion-previa" : "col-fija-accion";
  const visibles = columnas.filter((c) => !c.soloExcel);

  if (observaciones.length === 0) {
    return <p>No hay bultos/productos para mostrar.</p>;
  }

  return (
    <ContenedorTabla pie={pie}>
      <table className="tabla-tickets">
        <thead>
          <tr>
            {visibles.map((c) => (
              <EncabezadoOrdenable key={c.id} columna={c} orden={orden} onOrdenar={onOrdenar} />
            ))}
            {accionExtra && (
              <th className={claseAccionPrevia}>
                Confirmar
                <br />
                recepción
              </th>
            )}
            {accionExtra2 && (
              <th className="col-fija-accion">
                Registrar
                <br />
                entrega
              </th>
            )}
            {mostrarDetalle && <th className="col-fija-detalle">Detalle</th>}
          </tr>
        </thead>
        <tbody>
          {observaciones.map((o) => {
            const t = o.ticket;
            return (
              <tr key={o.id}>
                {visibles.map((c) => (
                  <td key={c.id}>{contenidoCelda(c, o)}</td>
                ))}
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
    </ContenedorTabla>
  );
}
