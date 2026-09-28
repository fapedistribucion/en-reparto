import { useEffect, useMemo, useRef, useState } from "react";

function normalizar(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Desplegable con búsqueda por código, nombre, lote o posición.
// Muestra posición y lote para poder distinguir el mismo código en dos líneas de la factura.
export default function BuscadorProducto({ productos, seleccionado, onSeleccionar, onCambiar }) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    function cerrarAlTocarFuera(e) {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
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
        normalizar(p.lote).includes(q) ||
        String(p.posicion) === q
    );
  }, [productos, texto]);

  function elegir(producto) {
    onSeleccionar(producto);
    setTexto("");
    setAbierto(false);
  }

  function teclado(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (resultados.length > 0) elegir(resultados[0]);
    }
    if (e.key === "Escape") setAbierto(false);
  }

  if (seleccionado) {
    return (
      <div className="producto-elegido">
        <div>
          <strong>
            Pos. {seleccionado.posicion} · {seleccionado.codigo_producto}
          </strong>
          <span>{seleccionado.nombre_producto}</span>
          <span className="dato-menor">
            Lote {seleccionado.lote ?? "—"} · Facturado: {seleccionado.cantidad}
          </span>
        </div>
        <button type="button" onClick={onCambiar}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="buscador-producto" ref={contenedor}>
      <input
        type="text"
        inputMode="search"
        autoComplete="off"
        placeholder="Buscar por código o nombre del producto"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={teclado}
      />

      {abierto && (
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
                  <span className="dato-menor">
                    Lote {p.lote ?? "—"} · Facturado: {p.cantidad}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
