import { useState } from "react";

// El logo "EnReparto" vive dentro de la barra lateral (se oculta con ella).
// El botón de 3 líneas queda fuera de la barra, en el flujo normal del
// contenido (no superpuesto/absoluto), para no chocar con el título de la
// vista activa que va justo debajo.
export default function LayoutLateral({ items, activo, onCambiar, children }) {
  const [abierta, setAbierta] = useState(true);

  return (
    <div className={`layout-lateral ${abierta ? "" : "barra-cerrada"}`}>
      <aside className="barra-lateral">
        <div className="marca-lateral">EnReparto</div>
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

      <div className="contenido-lateral">
        <div className="franja-superior">
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
        </div>
        {children}
      </div>
    </div>
  );
}
