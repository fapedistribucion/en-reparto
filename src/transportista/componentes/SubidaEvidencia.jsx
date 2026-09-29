import { comprimirImagen } from "../../utils/comprimirImagen";
import { etiquetaEvidencia, cantidadEvidencia } from "../../utils/etiquetasEvidencia";

// `tipo` define cuántas fotos son exigidas (ver CANTIDAD_EVIDENCIA en etiquetasEvidencia.js):
// la mayoría pide exactamente 1, "foto_4_lados_bulto"/"foto_4_lados_caja" piden exactamente 4.
// No se permite subir de más (el botón "+" desaparece al llegar al cupo) ni de menos
// (logicaReclamo.js exige que la cantidad final coincida exacto antes de generar el ticket).
export default function SubidaEvidencia({ tipo, archivos, onCambiar }) {
  const requerida = cantidadEvidencia(tipo);
  const cupoDisponible = Math.max(0, requerida - archivos.length);
  const completo = archivos.length === requerida;

  async function manejarSeleccion(e) {
    const seleccionados = Array.from(e.target.files);
    e.target.value = "";

    if (seleccionados.length > cupoDisponible) {
      alert(
        cupoDisponible === 0
          ? `Ya subiste las ${requerida} foto(s) requeridas para "${etiquetaEvidencia(tipo)}". Quita alguna para reemplazarla.`
          : `Para "${etiquetaEvidencia(tipo)}" se suben exactamente ${requerida} foto(s). Solo se tomaron las primeras ${cupoDisponible}.`
      );
    }
    const aProcesar = seleccionados.slice(0, cupoDisponible);

    const comprimidos = [];
    for (const archivo of aProcesar) {
      try {
        comprimidos.push(await comprimirImagen(archivo));
      } catch (error) {
        alert(`${archivo.name}: ${error.message}`);
      }
    }

    if (comprimidos.length > 0) onCambiar([...archivos, ...comprimidos]);
  }

  function quitarArchivo(indice) {
    onCambiar(archivos.filter((_, i) => i !== indice));
  }

  return (
    <div className="bloque-evidencia-tipo">
      <p className="etiqueta-evidencia">
        {etiquetaEvidencia(tipo)}{" "}
        <span className={`contador-evidencia${completo ? " contador-evidencia-completo" : ""}`}>
          ({archivos.length}/{requerida})
        </span>
      </p>

      <div className="miniaturas">
        {archivos.map((archivo, indice) => (
          <div className="miniatura" key={indice}>
            <img src={URL.createObjectURL(archivo)} alt={archivo.name} />
            <button type="button" onClick={() => quitarArchivo(indice)}>
              ×
            </button>
          </div>
        ))}

        {cupoDisponible > 0 && (
          <label className="miniatura miniatura-agregar">
            +
            <input type="file" accept="image/*" multiple onChange={manejarSeleccion} hidden />
          </label>
        )}
      </div>
    </div>
  );
}
