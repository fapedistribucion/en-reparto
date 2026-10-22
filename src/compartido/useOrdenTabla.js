import { useCallback, useState } from "react";

// Orden por clic en el encabezado: 1.er clic de menor a mayor, 2.º de mayor a menor, 3.º vuelve al orden original.
export function useOrdenTabla() {
  const [orden, setOrden] = useState(null); // { id, dir: "asc" | "desc" } | null

  const alternar = useCallback((id) => {
    setOrden((actual) => {
      if (!actual || actual.id !== id) return { id, dir: "asc" };
      if (actual.dir === "asc") return { id, dir: "desc" };
      return null;
    });
  }, []);

  return { orden, alternar };
}

function vacio(v) {
  return v === null || v === undefined || v === "";
}

function comparar(a, b, tipo) {
  if (tipo === "numero") return Number(a) - Number(b);
  if (tipo === "fecha" || tipo === "fechahora") return Date.parse(a) - Date.parse(b);
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
}

// Devuelve una copia ordenada de `filas` según la columna elegida (la que trae `valor` y `tipo`).
// Los vacíos quedan siempre al final, sea ascendente o descendente. Sin orden elegido, no toca nada.
export function ordenarFilas(filas, columnas, orden) {
  if (!orden) return filas;
  const columna = columnas.find((c) => c.id === orden.id);
  if (!columna) return filas;
  const signo = orden.dir === "desc" ? -1 : 1;
  const tipo = columna.tipo ?? "texto";

  return filas
    .map((fila, posicion) => ({ fila, posicion, valor: columna.valor(fila) }))
    .sort((x, y) => {
      const xVacio = vacio(x.valor);
      const yVacio = vacio(y.valor);
      if (xVacio && yVacio) return x.posicion - y.posicion;
      if (xVacio) return 1;
      if (yVacio) return -1;
      const c = comparar(x.valor, y.valor, tipo);
      return c !== 0 ? signo * c : x.posicion - y.posicion;
    })
    .map((x) => x.fila);
}
