// La hamburguesa y el logo "EnReparto" viven en el encabezado global (App.jsx),
// a la misma altura que el círculo de usuario. Este componente solo dibuja el
// sidebar (nav) y el contenido; `abierta` es controlada desde afuera.
export default function LayoutLateral({ items, activo, onCambiar, abierta = true, children }) {
  return (
    <div className={`layout-lateral ${abierta ? "" : "barra-cerrada"}`}>
      <aside className="barra-lateral">
        <nav>
          {items.map((item) => (
            <button
              key={item.clave}
              className={activo === item.clave ? "activo" : ""}
              onClick={() => onCambiar(item.clave)}
            >
              {item.etiqueta}
            </button>
          ))}
        </nav>
      </aside>

      <div className="contenido-lateral">{children}</div>
    </div>
  );
}
