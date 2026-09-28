export default function SelectorAlcance({ opciones, valor, onCambiar }) {
  return (
    <div className="opciones-alcance" role="radiogroup" aria-label="¿Qué ocurrió con la entrega?">
      {opciones.map((o) => (
        <button
          key={o.clave}
          type="button"
          role="radio"
          aria-checked={valor === o.clave}
          className={`opcion-alcance ${valor === o.clave ? "activa" : ""}`}
          onClick={() => onCambiar(o.clave)}
        >
          <strong>{o.titulo}</strong>
          <span>{o.ayuda}</span>
        </button>
      ))}
    </div>
  );
}
