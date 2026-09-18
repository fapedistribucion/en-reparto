export default function FormularioObservaciones({ observaciones, onCambiar }) {
  function actualizarFila(indice, campo, valor) {
    onCambiar(observaciones.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)));
  }

  function agregarFila() {
    onCambiar([...observaciones, { numero_bulto: "", posicion: "", cantidad: "" }]);
  }

  function quitarFila(indice) {
    onCambiar(observaciones.filter((_, i) => i !== indice));
  }

  return (
    <div className="bloque-observaciones">
      <p className="etiqueta-seccion">Bultos observados</p>

      {observaciones.map((fila, indice) => (
        <div className="fila-observacion" key={indice}>
          <input
            type="text"
            placeholder="N° bulto (BANSA...)"
            value={fila.numero_bulto}
            onChange={(e) => actualizarFila(indice, "numero_bulto", e.target.value)}
          />
          <input
            type="text"
            placeholder="Posición"
            value={fila.posicion}
            onChange={(e) => actualizarFila(indice, "posicion", e.target.value)}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={fila.cantidad}
            onChange={(e) => actualizarFila(indice, "cantidad", e.target.value)}
          />
          <button type="button" onClick={() => quitarFila(indice)}>
            Quitar
          </button>
        </div>
      ))}

      <button type="button" onClick={agregarFila}>
        + Agregar bulto
      </button>
    </div>
  );
}
