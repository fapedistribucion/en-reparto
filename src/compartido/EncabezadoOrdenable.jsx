// Celda de encabezado que ordena al hacer clic: 1.er clic de menor a mayor, 2.º de mayor a menor, 3.º orden original.
// `orden` = { id, dir } | null (ver useOrdenTabla). Se reserva siempre el sitio de la flecha para que
// el ancho de la columna no salte al ordenar.
export default function EncabezadoOrdenable({ columna, orden, onOrdenar }) {
  const activa = orden?.id === columna.id;
  const sentido = activa ? (orden.dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <th
      className="th-ordenable"
      aria-sort={sentido}
      tabIndex={0}
      onClick={() => onOrdenar(columna.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOrdenar(columna.id);
        }
      }}
      title="Clic para ordenar"
    >
      {columna.titulo}
      <span className={`flecha-orden ${activa ? "flecha-orden-activa" : ""}`} aria-hidden="true">
        {activa && orden.dir === "desc" ? "▼" : "▲"}
      </span>
    </th>
  );
}
