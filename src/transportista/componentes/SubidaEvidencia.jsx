import { comprimirImagen } from "../../utils/comprimirImagen";
import { etiquetaEvidencia, reglaEvidencia } from "../../utils/etiquetasEvidencia";

// `tipo` (y opcionalmente `subcategoria`, el motivo elegido) definen cuántas fotos se permiten
// (ver reglaEvidencia en etiquetasEvidencia.js): por defecto la mayoría pide exactamente 1 y
// "foto_4_lados_bulto"/"foto_4_lados_caja" exactamente 4; Avería tiene excepciones (6 exactas
// para bulto/caja y de 1 hasta 4 para la foto del producto).
// Nunca se permite subir de más (el botón "+" desaparece al llegar al máximo) y
// logicaReclamo.js exige el mínimo antes de generar el ticket.
export default function SubidaEvidencia({ tipo, subcategoria, archivos, onCambiar }) {
  const { min, max } = reglaEvidencia(tipo, subcategoria);
  const exacta = min === max;
  const etiqueta = etiquetaEvidencia(tipo, subcategoria);
  const cupoDisponible = Math.max(0, max - archivos.length);
  const completo = archivos.length >= min && archivos.length <= max;

  async function manejarSeleccion(e) {
    const seleccionados = Array.from(e.target.files);
    e.target.value = "";

    if (seleccionados.length > cupoDisponible) {
      if (cupoDisponible === 0) {
        alert(
          exacta
            ? `Ya subiste las ${max} foto(s) requeridas para "${etiqueta}". Quita alguna para reemplazarla.`
            : `Ya subiste el máximo de ${max} foto(s) para "${etiqueta}". Quita alguna para reemplazarla.`
        );
      } else {
        alert(
          exacta
            ? `Para "${etiqueta}" se suben exactamente ${max} foto(s). Solo se tomaron las primeras ${cupoDisponible}.`
            : `Para "${etiqueta}" se admiten hasta ${max} foto(s). Solo se tomaron las primeras ${cupoDisponible}.`
        );
      }
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
        {etiqueta}{" "}
        <span className={`contador-evidencia${completo ? " contador-evidencia-completo" : ""}`}>
          ({archivos.length}/{max})
        </span>
        {!exacta && <span className="dato-menor"> · mínimo {min}, hasta {max}</span>}
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
