import BuscadorProducto from "./BuscadorProducto";
import SelectorMotivo from "./SelectorMotivo";
import SubidaEvidencia from "./SubidaEvidencia";
import { evidenciasDe } from "../logicaReclamo";

export default function TarjetaProducto({
  indice,
  tarjeta,
  productos,
  motivosSeleccionables,
  motivos,
  motivoFijo = null, // Sobrante: el motivo viene de la opción, no se elige en la tarjeta
  puedeQuitar,
  cantidadOcupada = 0,
  onCambiar,
  onQuitar,
}) {
  const producto = productos.find((p) => p.posicion === tarjeta.posicion) ?? null;
  const subcategoria = motivoFijo ?? tarjeta.subcategoria;
  const requeridas = evidenciasDe(motivos, subcategoria);
  // `cantidadOcupada`: lo que ya tomaron otros motivos/tarjetas del MISMO producto (un producto
  // puede tener varios motivos, pero entre todos no pueden superar lo facturado).
  const disponible = producto ? Math.max(0, Number(producto.cantidad) - cantidadOcupada) : 0;
  // Con motivo fijo (Sobrante) la cantidad no tiene tope: es lo que llegó de más
  const excede = !motivoFijo && producto && Number(tarjeta.cantidad) > disponible;

  return (
    <div className="tarjeta-producto">
      <div className="tarjeta-producto-encabezado">
        <p className="etiqueta-seccion">Producto {indice + 1}</p>
        {puedeQuitar && (
          <button type="button" onClick={onQuitar}>
            Quitar
          </button>
        )}
      </div>

      <BuscadorProducto
        productos={productos}
        seleccionado={producto}
        onSeleccionar={(p) => onCambiar({ ...tarjeta, posicion: p.posicion })}
        onCambiar={() => onCambiar({ ...tarjeta, posicion: null })}
      />

      {producto && (
        <>
          <div className="bloque-formulario">
            {!motivoFijo && (
              <>
                <label htmlFor={`motivo-${tarjeta.uid}`}>Motivo</label>
                <SelectorMotivo
                  id={`motivo-${tarjeta.uid}`}
                  motivos={motivosSeleccionables}
                  valor={tarjeta.subcategoria}
                  onCambiar={(valor) => onCambiar({ ...tarjeta, subcategoria: valor })}
                />
              </>
            )}

            <div className="fila-dos">
              <div>
                <label htmlFor={`cantidad-${tarjeta.uid}`}>
                  {motivoFijo ? "Cantidad sobrante" : "Cantidad observada"}
                </label>
                <input
                  id={`cantidad-${tarjeta.uid}`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={motivoFijo ? undefined : disponible}
                  step="1"
                  value={tarjeta.cantidad}
                  onChange={(e) => onCambiar({ ...tarjeta, cantidad: e.target.value })}
                />
                <p className={excede ? "mensaje-error" : "dato-menor"}>
                  {motivoFijo
                    ? `Facturado: ${producto.cantidad}`
                    : cantidadOcupada > 0
                      ? `Disponible: ${disponible} de ${producto.cantidad} (${cantidadOcupada} ya en otro motivo)`
                      : `Disponible: ${disponible} de ${producto.cantidad}`}
                </p>
              </div>
              <div>
                <label htmlFor={`bulto-${tarjeta.uid}`}>N° de bulto</label>
                <input
                  id={`bulto-${tarjeta.uid}`}
                  type="text"
                  placeholder="BANSA..."
                  value={tarjeta.bulto}
                  onChange={(e) => onCambiar({ ...tarjeta, bulto: e.target.value })}
                />
              </div>
            </div>
          </div>

          {requeridas.map((tipo) => (
            <SubidaEvidencia
              key={tipo}
              tipo={tipo}
              subcategoria={subcategoria}
              archivos={tarjeta.archivos[tipo] ?? []}
              onCambiar={(archivos) =>
                onCambiar({ ...tarjeta, archivos: { ...tarjeta.archivos, [tipo]: archivos } })
              }
            />
          ))}
        </>
      )}
    </div>
  );
}
