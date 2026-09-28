import { IconoCerrar } from "./iconos";
import { ETIQUETAS_ESTADO } from "../utils/estadosTicket";
import CalendarioRango from "./CalendarioRango";

// Panel deslizable (derecha) con los filtros. Controlado desde el panel que lo usa:
// `valores` = { ticket, factura, transporte, estado, desde, hasta }
export default function PanelFiltros({ abierto, onCerrar, valores, onCambiar, opcionesTransporte, onBuscar, onLimpiar }) {
  if (!abierto) return null;

  function cambiar(campo, valor) {
    onCambiar({ ...valores, [campo]: valor });
  }

  return (
    <div className="fondo-drawer" onClick={onCerrar}>
      <div className="panel-filtros" onClick={(e) => e.stopPropagation()}>
        <div className="panel-filtros-encabezado">
          <h3>Opciones de filtros</h3>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
            <IconoCerrar size={18} />
          </button>
        </div>

        <div className="panel-filtros-cuerpo">
          <label className="campo-filtro">
            N° Ticket
            <input type="text" value={valores.ticket} onChange={(e) => cambiar("ticket", e.target.value)} />
          </label>

          <label className="campo-filtro">
            N° Factura
            <input type="text" value={valores.factura} onChange={(e) => cambiar("factura", e.target.value)} />
          </label>

          <label className="campo-filtro">
            Transporte
            <select value={valores.transporte} onChange={(e) => cambiar("transporte", e.target.value)}>
              <option value="">Todos</option>
              {opcionesTransporte.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="campo-filtro">
            Estado
            <select value={valores.estado} onChange={(e) => cambiar("estado", e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(ETIQUETAS_ESTADO).map(([clave, etiqueta]) => (
                <option key={clave} value={clave}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </label>

          <div className="campo-filtro">
            <span>Rango de fecha</span>
            <CalendarioRango
              desde={valores.desde}
              hasta={valores.hasta}
              onCambiarRango={({ desde, hasta }) => onCambiar({ ...valores, desde, hasta })}
              maxDias={31}
            />
          </div>
        </div>

        <div className="panel-filtros-acciones">
          <button type="button" onClick={onLimpiar}>
            Limpiar
          </button>
          <button type="button" className="boton-primario" onClick={onBuscar}>
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
