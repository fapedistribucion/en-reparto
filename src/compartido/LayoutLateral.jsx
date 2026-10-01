import { useState } from "react";

export default function LayoutLateral({ items, activo, onCambiar, children }) {
  const [abierta, setAbierta] = useState(true);

  return (
    <div className={`layout-lateral ${abierta ? "" : "barra-cerrada"}`}>
      <button
        type="button"
        className="boton-toggle-barra"
        onClick={() => setAbierta((valor) => !valor)}
        aria-label={abierta ? "Ocultar menú" : "Mostrar menú"}
        title={abierta ? "Ocultar menú" : "Mostrar menú"}
      >
        <span />
        <span />
        <span />
      </button>

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
