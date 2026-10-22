import { useEffect, useRef, useState } from "react";

// Envuelve una tabla ancha. Muestra una barra de scroll horizontal FIJA al pie de la pantalla, para
// poder desplazarse a izquierda y derecha sin bajar hasta el final de la tabla (con muchos
// registros, la barra nativa queda al fondo). La barra nativa de la tabla se oculta; la de abajo
// se mantiene sincronizada con ella (también se puede seguir usando Shift + rueda o el gesto del
// touchpad sobre la tabla).
// `pie`: texto de conteo (ej. "25 tickets") que queda fijo al pie, justo encima de la barra de scroll.
export default function ContenedorTabla({ children, pie }) {
  const refTabla = useRef(null);
  const refBarra = useRef(null);
  const [ancho, setAncho] = useState(0);
  const [hayScroll, setHayScroll] = useState(false);

  useEffect(() => {
    const contenedor = refTabla.current;
    if (!contenedor) return undefined;

    function medir() {
      setAncho(contenedor.scrollWidth);
      setHayScroll(contenedor.scrollWidth > contenedor.clientWidth + 1);
    }

    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(contenedor);
    if (contenedor.firstElementChild) observador.observe(contenedor.firstElementChild);
    return () => observador.disconnect();
  }, [children]);

  // Cada barra copia su posición a la otra; al quedar iguales, el evento de rebote no hace nada más.
  function desdeTabla() {
    const barra = refBarra.current;
    const tabla = refTabla.current;
    if (barra && barra.scrollLeft !== tabla.scrollLeft) barra.scrollLeft = tabla.scrollLeft;
  }

  function desdeBarra() {
    const barra = refBarra.current;
    const tabla = refTabla.current;
    if (tabla.scrollLeft !== barra.scrollLeft) tabla.scrollLeft = barra.scrollLeft;
  }

  return (
    <div className="envoltorio-tabla">
      <div className="contenedor-tabla" ref={refTabla} onScroll={desdeTabla}>
        {children}
      </div>
      <div className="pie-fijo">
        <div
          className="barra-scroll-fija"
          ref={refBarra}
          onScroll={desdeBarra}
          style={{ display: hayScroll ? "block" : "none" }}
          aria-hidden="true"
        >
          <div style={{ width: ancho, height: 1 }} />
        </div>
        {pie && <div className="pie-conteo">{pie}</div>}
      </div>
    </div>
  );
}
