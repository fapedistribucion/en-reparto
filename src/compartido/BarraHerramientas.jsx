import { IconoExportar, IconoRefrescar, IconoFiltro, IconoQuitarFiltro } from "./iconos";

// Barra de acciones sobre la tabla: exportar, quitar filtros, refrescar y abrir el panel de filtros.
// `filtrosActivos`: true si hay algún filtro aplicado (para mostrar el botón de quitar filtros resaltado).
export default function BarraHerramientas({ onExportar, onQuitarFiltros, onRefrescar, onAbrirFiltros, filtrosActivos }) {
  return (
    <div className="barra-herramientas">
      {onExportar && (
        <button type="button" className="boton-icono" onClick={onExportar} title="Exportar a CSV">
          <IconoExportar size={18} />
          <span>Exportar</span>
        </button>
      )}

      {filtrosActivos && (
        <button type="button" className="boton-icono" onClick={onQuitarFiltros} title="Quitar filtros">
          <IconoQuitarFiltro size={18} />
        </button>
      )}

      <button type="button" className="boton-icono" onClick={onRefrescar} title="Actualizar">
        <IconoRefrescar size={18} />
      </button>

      <button type="button" className="boton-icono boton-filtrar" onClick={onAbrirFiltros}>
        <IconoFiltro size={18} />
        <span>Filtrar</span>
      </button>
    </div>
  );
}
