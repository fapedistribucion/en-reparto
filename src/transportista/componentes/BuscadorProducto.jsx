import { useEffect, useMemo, useRef, useState } from "react";

function normalizar(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Desplegable para elegir un producto de la factura.
// Cerrado se ve como un selector ("Seleccionar producto" con una flecha). Al tocarlo se despliega
// un panel con el campo "Buscar por código o nombre del producto" y la lista; en celular el
// teclado NO se abre solo: recién aparece al tocar el campo de búsqueda. En computador el campo
// de búsqueda queda enfocado de una vez.
// Muestra la posición para poder distinguir el mismo código en dos líneas de la factura.
// (El lote se retiró por ahora: la nueva fuente de datos no lo trae.)
const esTactil = () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;

function Flecha({ arriba }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={arriba ? "6 15 12 9 18 15" : "6 9 12 15 18 9"} />
    </svg>
  );
}

export default function BuscadorProducto({ productos, seleccionado, onSeleccionar, onCambiar }) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  function cerrar() {
    setAbierto(false);
    setTexto("");
  }

  useEffect(() => {
    function cerrarAlTocarFuera(e) {
      if (contenedor.current && !contenedor.current.contains(e.target)) cerrar();
    }
    document.addEventListener("pointerdown", cerrarAlTocarFuera);
    return () => document.removeEventListener("pointerdown", cerrarAlTocarFuera);
  }, []);

  const resultados = useMemo(() => {
    const q = normalizar(texto).trim();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        normalizar(p.codigo_producto).includes(q) ||
        normalizar(p.nombre_producto).includes(q) ||
        String(p.posicion) === q
    );
  }, [productos, texto]);

  function elegir(producto) {
    onSeleccionar(producto);
    cerrar();
  }

  function teclado(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (resultados.length > 0) elegir(resultados[0]);
    }
    if (e.key === "Escape") cerrar();
  }

  if (seleccionado) {
    return (
      <div className="producto-elegido">
        <div>
          <strong>
            Pos. {seleccionado.posicion} · {seleccionado.codigo_producto}
          </strong>
          <span>{seleccionado.nombre_producto}</span>
          <span className="dato-menor">Cantidad: {seleccionado.cantidad}</span>
        </div>
        <button type="button" onClick={onCambiar}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="buscador-producto" ref={contenedor}>
      <button
        type="button"
        className="boton-selector-producto"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
      >
        <span>Seleccionar producto</span>
        <Flecha arriba={abierto} />
      </button>

      {abierto && (
        <div className="panel-productos">
          <input
            type="text"
            inputMode="search"
            autoComplete="off"
            autoFocus={!esTactil()}
            placeholder="Buscar por código o nombre del producto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={teclado}
          />
          <ul className="lista-productos">
            {resultados.length === 0 ? (
              <li className="sin-resultados">Ningún producto de esta factura coincide</li>
            ) : (
              resultados.map((p) => (
                <li key={p.posicion}>
                  <button type="button" onClick={() => elegir(p)}>
                    <strong>
                      Pos. {p.posicion} · {p.codigo_producto}
                    </strong>
                    <span>{p.nombre_producto}</span>
                    <span className="dato-menor">Cantidad: {p.cantidad}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
