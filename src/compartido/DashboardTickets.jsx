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

  const porMotivo = useMemo(() => {
    const conteo = new Map();
    observaciones.forEach((o) => {
      conteo.set(o.subcategoria, (conteo.get(o.subcategoria) ?? 0) + 1);
    });
    return [...conteo.entries()].sort((a, b) => b[1] - a[1]);
  }, [observaciones]);

  const maximoMotivo = porMotivo.length > 0 ? porMotivo[0][1] : 0;

  return (
    <div className="tablero">
      <div className="tarjetas-stat">
        <div className="tarjeta-stat tarjeta-stat-total">
          <span className="tarjeta-stat-numero">{tickets.length}</span>
          <span className="tarjeta-stat-etiqueta">Tickets totales</span>
        </div>

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
          <div className="grafico-barras" role="img" aria-label="Cantidad de reclamos por motivo">
            {porMotivo.map(([motivo, cantidad]) => (
              <div className="fila-barra" key={motivo}>
                <span className="fila-barra-etiqueta">{etiquetaMotivo(motivo)}</span>
                <div className="fila-barra-pista">
                  <div
                    className="fila-barra-relleno"
                    style={{ width: `${maximoMotivo ? (cantidad / maximoMotivo) * 100 : 0}%` }}
                    title={`${etiquetaMotivo(motivo)}: ${cantidad}`}
                  />
                </div>
                <span className="fila-barra-valor">{cantidad}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
