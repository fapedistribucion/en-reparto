// Exporta un arreglo de objetos a un archivo .csv y dispara la descarga en el navegador.
// `columnas`: [{ clave: "codigo_ticket", titulo: "N° Ticket" }, ...]
export function exportarCsv(nombreArchivo, columnas, filas) {
  function celda(valor) {
    const texto = valor === null || valor === undefined ? "" : String(valor);
    if (texto.includes(";") || texto.includes("\n") || texto.includes('"')) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  }

  const encabezado = columnas.map((c) => celda(c.titulo)).join(";");
  const lineas = filas.map((fila) => columnas.map((c) => celda(c.obtener ? c.obtener(fila) : fila[c.clave])).join(";"));
  const contenido = "﻿" + [encabezado, ...lineas].join("\r\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo.endsWith(".csv") ? nombreArchivo : `${nombreArchivo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
