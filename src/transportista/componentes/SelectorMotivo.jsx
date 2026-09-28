import { etiquetaMotivo } from "../../utils/etiquetasMotivo";

// Lista plana con todos los motivos: el transportista no ve la categoría, se deduce sola.
export default function SelectorMotivo({ id, motivos, valor, onCambiar }) {
  return (
    <select id={id} value={valor} onChange={(e) => onCambiar(e.target.value)}>
      <option value="">Selecciona el motivo...</option>
      {motivos.map((m) => (
        <option key={m.subcategoria} value={m.subcategoria}>
          {etiquetaMotivo(m.subcategoria)}
        </option>
      ))}
    </select>
  );
}
