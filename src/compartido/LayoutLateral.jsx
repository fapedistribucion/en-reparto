import { useState } from "react";

// Franja superior de ancho completo: hamburguesa + logo "EnReparto" juntos, con la
// hamburguesa a la izquierda. Debajo, el cuerpo se divide en sidebar (nav) + contenido.
export default function LayoutLateral({ items, activo, onCambiar, children }) {
  const [abierta, setAbierta] = useState(true);

  return (
    <div className={`layout-lateral ${abierta ? "" : "barra-cerrada"}`}>
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
        <span className="marca-lateral">EnReparto</span>
      </div>

      <div className="layout-lateral-cuerpo">
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
    </div>
  );
}
