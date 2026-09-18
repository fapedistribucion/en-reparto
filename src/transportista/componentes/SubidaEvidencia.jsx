import { comprimirImagen } from "../../utils/comprimirImagen";
import { etiquetaEvidencia } from "../../utils/etiquetasEvidencia";

export default function SubidaEvidencia({ tipo, archivos, onCambiar }) {
  async function manejarSeleccion(e) {
    const seleccionados = Array.from(e.target.files);
    e.target.value = "";

    const comprimidos = [];
    for (const archivo of seleccionados) {
      try {
        comprimidos.push(await comprimirImagen(archivo));
      } catch (error) {
        alert(`${archivo.name}: ${error.message}`);
      }
    }

    onCambiar([...archivos, ...comprimidos]);
  }

  function quitarArchivo(indice) {
    onCambiar(archivos.filter((_, i) => i !== indice));
  }

  return (
    <div className="bloque-evidencia-tipo">
      <p className="etiqueta-evidencia">{etiquetaEvidencia(tipo)}</p>

      <div className="miniaturas">
        {archivos.map((archivo, indice) => (
          <div className="miniatura" key={indice}>
            <img src={URL.createObjectURL(archivo)} alt={archivo.name} />
            <button type="button" onClick={() => quitarArchivo(indice)}>
              ×
            </button>
          </div>
        ))}

        <label className="miniatura miniatura-agregar">
          +
          <input type="file" accept="image/*" multiple onChange={manejarSeleccion} hidden />
        </label>
      </div>
    </div>
  );
}
