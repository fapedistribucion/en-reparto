import { precargarDetalle } from "./cargaDetalle";
import ContenedorTabla from "./ContenedorTabla";
import EncabezadoOrdenable from "./EncabezadoOrdenable";
import { contenidoCelda } from "./columnas";

// Vista "Por factura": una fila por ticket.
// `columnas`: definición de columnas (ver columnas.jsx → columnasTickets); la misma sirve para el orden y el Excel.
// `orden` / `onOrdenar`: orden por clic en el encabezado (ver useOrdenTabla). `pie`: conteo al pie ("25 tickets").
// `mostrarDetalle`: controla si se muestra la columna fija "Detalle" con el botón "Ver" (y por lo
// tanto si hace falta `onVerDetalle`). Por defecto true; Liquidaciones la pasa en false porque su
// vista es de solo lectura, sin el modal de detalle/fotos.
// `accionExtra(ticket)`: botón adicional por fila (confirmar llegada a LI), en la columna fija
// "Confirmar recepción" (solo LI la usa).
// `accionExtra2(ticket)`: segundo botón adicional (registrar/editar entrega a transporte), en la
// columna fija "Registrar entrega" (también solo LI).
// Las columnas de acción y "Detalle" quedan fijas a la derecha (sticky) para no tener que scrollear
// hasta el final de la tabla para usarlas.
export default function TablaTickets({
  tickets,
  columnas,
  orden,
  onOrdenar,
  pie,
  onVerDetalle,
  mostrarDetalle = true,
  accionExtra,
  accionExtra2,
}) {
  // Con dos columnas de acción, "Confirmar recepción" se fija a la izquierda de "Registrar entrega".
  const claseAccionPrevia = accionExtra2 ? "col-fija-accion col-fija-accion-previa" : "col-fija-accion";
  const visibles = columnas.filter((c) => !c.soloExcel);

  if (tickets.length === 0) {
    return <p>No hay tickets para mostrar.</p>;
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
          {tickets.map((t) => (
            <tr key={t.id}>
              {visibles.map((c) => (
                <td key={c.id}>{contenidoCelda(c, t)}</td>
              ))}
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
    </ContenedorTabla>
  );
}
