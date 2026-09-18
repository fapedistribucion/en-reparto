export default function LayoutLateral({ items, activo, onCambiar, children }) {
  return (
    <div className="layout-lateral">
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
