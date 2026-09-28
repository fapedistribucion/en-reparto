import { useMemo } from "react";
import { ETIQUETAS_ESTADO } from "../utils/estadosTicket";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";

// Primera versión: conteos generales. Se ajusta según lo que Jefferson indique después de verla.
// `rol`: "SAC" | "LI" — cambia cuál tarjeta de "acción requerida" se resalta primero.
export default function DashboardTickets({ tickets, observaciones, rol }) {
  const porEstado = useMemo(() => {
    const conteo = { EN_RUTA: 0, EN_LI: 0, SOLUCIONADO: 0, ANULADO: 0 };
    tickets.forEach((t) => {
      if (conteo[t.estado] !== undefined) conteo[t.estado] += 1;
    });
    return conteo;
  }, [tickets]);

  const pendientesValidar = useMemo(
    () => observaciones.filter((o) => o.categoria === "NO_LOGISTICO" && o.validado !== "VALIDADO").length,
    [observaciones]
  );

  const porMotivo = useMemo(() => {
    const conteo = new Map();
    observaciones.forEach((o) => {
      conteo.set(o.subcategoria, (conteo.get(o.subcategoria) ?? 0) + 1);
    });
    return [...conteo.entries()].sort((a, b) => b[1] - a[1]);
  }, [observaciones]);

  return (
    <div className="tablero">
      <div className="tarjetas-stat">
        <div className="tarjeta-stat tarjeta-stat-total">
          <span className="tarjeta-stat-numero">{tickets.length}</span>
          <span className="tarjeta-stat-etiqueta">Tickets totales</span>
        </div>

        {rol === "SAC" && (
          <div className="tarjeta-stat tarjeta-stat-alerta">
            <span className="tarjeta-stat-numero">{pendientesValidar}</span>
            <span className="tarjeta-stat-etiqueta">Pendientes de validar</span>
          </div>
        )}

        <div className={`tarjeta-stat ${rol === "LI" ? "tarjeta-stat-alerta" : ""}`}>
          <span className="tarjeta-stat-numero">{porEstado.EN_RUTA}</span>
          <span className="tarjeta-stat-etiqueta">{ETIQUETAS_ESTADO.EN_RUTA}</span>
        </div>

        <div className={`tarjeta-stat ${rol === "LI" ? "tarjeta-stat-alerta" : ""}`}>
          <span className="tarjeta-stat-numero">{porEstado.EN_LI}</span>
          <span className="tarjeta-stat-etiqueta">{ETIQUETAS_ESTADO.EN_LI}</span>
        </div>

        <div className="tarjeta-stat tarjeta-stat-exito">
          <span className="tarjeta-stat-numero">{porEstado.SOLUCIONADO}</span>
          <span className="tarjeta-stat-etiqueta">{ETIQUETAS_ESTADO.SOLUCIONADO}</span>
        </div>

        <div className="tarjeta-stat">
          <span className="tarjeta-stat-numero">{porEstado.ANULADO}</span>
          <span className="tarjeta-stat-etiqueta">{ETIQUETAS_ESTADO.ANULADO}</span>
        </div>
      </div>

      <div className="tarjeta-info tarjeta-motivos">
        <p className="etiqueta-seccion">Reclamos por motivo</p>
        {porMotivo.length === 0 ? (
          <p className="dato-menor">Sin datos todavía.</p>
        ) : (
          <table className="tabla-motivos">
            <tbody>
              {porMotivo.map(([motivo, cantidad]) => (
                <tr key={motivo}>
                  <td>{etiquetaMotivo(motivo)}</td>
                  <td>{cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
