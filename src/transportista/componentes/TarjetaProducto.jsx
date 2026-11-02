import BuscadorProducto from "./BuscadorProducto";
import SelectorMotivo from "./SelectorMotivo";
import SubidaEvidencia from "./SubidaEvidencia";
import {
  LARGO_BULTO,
  MAX_NOMBRE_PRODUCTO,
  evidenciasDe,
  limpiarBulto,
  limpiarCantidad,
  limpiarNombreProducto,
} from "../logicaReclamo";

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
  // Solo en Sobrante: el producto puede no estar en la factura (se escribe su nombre en vez de buscarlo)
  const permiteNoFacturado = Boolean(motivoFijo);
  const noFacturado = permiteNoFacturado && Boolean(tarjeta.noFacturado);

  const producto = noFacturado ? null : productos.find((p) => p.posicion === tarjeta.posicion) ?? null;
  const subcategoria = motivoFijo ?? tarjeta.subcategoria;
  const requeridas = evidenciasDe(motivos, subcategoria);
  // `cantidadOcupada`: lo que ya registraron otras tarjetas del MISMO producto con el MISMO motivo.
  // El tope es por motivo: un producto puede tener varios motivos y la suma entre motivos no se limita.
  const disponible = producto ? Math.max(0, Number(producto.cantidad) - cantidadOcupada) : 0;
  // Con motivo fijo (Sobrante) la cantidad no tiene tope: es lo que llegó de más
  const excede = !motivoFijo && producto && Number(tarjeta.cantidad) > disponible;
  const nombreEscrito = String(tarjeta.nombreProducto ?? "");
  const nombreMuyCorto = nombreEscrito.trim().length > 0 && nombreEscrito.trim().length < 3;

  function elegirEnFactura(estaEnFactura) {
    // Solo si cambia de opción. Se limpia lo propio de la otra (producto o nombre); cantidad, bulto y fotos se conservan.
    if (estaEnFactura === noFacturado) {
      onCambiar({ ...tarjeta, noFacturado: !estaEnFactura, posicion: null, nombreProducto: "" });
    }
  }

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

      {permiteNoFacturado && (
        <div className="bloque-formulario">
          <p className="dato-menor">¿El producto está en la factura?</p>
          <div className="selector-vista" role="radiogroup" aria-label="¿El producto está en la factura?">
            <button
              type="button"
              role="radio"
              aria-checked={!noFacturado}
              className={!noFacturado ? "activo" : ""}
              onClick={() => elegirEnFactura(true)}
            >
              Sí, está en la factura
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={noFacturado}
              className={noFacturado ? "activo" : ""}
              onClick={() => elegirEnFactura(false)}
            >
              No está en la factura
            </button>
          </div>
        </div>
      )}

      {noFacturado ? (
        <div className="bloque-formulario">
          <label htmlFor={`nombre-${tarjeta.uid}`}>Nombre del producto</label>
          <input
            id={`nombre-${tarjeta.uid}`}
            type="text"
            autoComplete="off"
            maxLength={MAX_NOMBRE_PRODUCTO}
            placeholder="Ej. Paracetamol 500 mg x 100"
            value={nombreEscrito}
            onChange={(e) => onCambiar({ ...tarjeta, nombreProducto: limpiarNombreProducto(e.target.value) })}
          />
          <p className={nombreMuyCorto ? "mensaje-error" : "dato-menor"}>
            Escribe el nombre como figura en el empaque
          </p>
        </div>
      ) : (
        <BuscadorProducto
          productos={productos}
          seleccionado={producto}
          onSeleccionar={(p) => onCambiar({ ...tarjeta, posicion: p.posicion })}
          onCambiar={() => onCambiar({ ...tarjeta, posicion: null })}
        />
      )}

      {(producto || noFacturado) && (
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={tarjeta.cantidad}
                  onChange={(e) => onCambiar({ ...tarjeta, cantidad: limpiarCantidad(e.target.value) })}
                />
                <p className={excede ? "mensaje-error" : "dato-menor"}>
                  {noFacturado
                    ? "Producto fuera de la factura"
                    : motivoFijo
                      ? `Facturado: ${producto.cantidad}`
                      : cantidadOcupada > 0
                        ? `Facturado: ${producto.cantidad} (${cantidadOcupada} ya registrado(s) con este motivo)`
                        : `Facturado: ${producto.cantidad}`}
                </p>
              </div>
              <div>
                <label htmlFor={`bulto-${tarjeta.uid}`}>N° de bulto</label>
                <input
                  id={`bulto-${tarjeta.uid}`}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={LARGO_BULTO}
                  placeholder={`${LARGO_BULTO} letras o números`}
                  value={tarjeta.bulto}
                  onChange={(e) => onCambiar({ ...tarjeta, bulto: limpiarBulto(e.target.value) })}
                />
                <p className={tarjeta.bulto.length > 0 && tarjeta.bulto.length < LARGO_BULTO ? "mensaje-error" : "dato-menor"}>
                  {tarjeta.bulto.length}/{LARGO_BULTO} caracteres
                </p>
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
