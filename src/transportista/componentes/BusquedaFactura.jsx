import { useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { construirNumeroFactura } from "../../utils/construirNumeroFactura";
import { MENSAJE_FACTURA_NO_ENCONTRADA } from "../../config";

// Busca la factura y, si existe, trae también sus productos. Si falta cualquiera de las dos cosas,
// se muestra la alerta de "factura no encontrada" para que se revise la carga de datos.
export default function BusquedaFactura({ empresaTransporte, onEncontrada }) {
  const [parte1, setParte1] = useState("");
  const [parte2, setParte2] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const refParte2 = useRef(null);

  const numeroCompleto = construirNumeroFactura(parte1 + parte2);

  function cambioParte1(e) {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 2);
    setParte1(valor);
    if (valor.length === 2) refParte2.current?.focus();
  }

  function cambioParte2(e) {
    setParte2(e.target.value.replace(/\D/g, "").slice(0, 6));
  }

  async function buscar(e) {
    e.preventDefault();
    setError("");

    if (!numeroCompleto) {
      setError("Ingresa el número de factura completo.");
      return;
    }

    setBuscando(true);

    const { data: factura, error: errorFactura } = await supabase
      .from("facturas_data")
      .select("factura, pedido_entrega, cliente, empresa_transporte, vendedor, canal, viaje")
      .eq("factura", numeroCompleto)
      .maybeSingle();

    if (errorFactura) {
      setBuscando(false);
      setError("Ocurrió un error al buscar la factura. Intenta de nuevo.");
      return;
    }
    if (!factura) {
      setBuscando(false);
      setError(MENSAJE_FACTURA_NO_ENCONTRADA);
      return;
    }
    if (factura.empresa_transporte !== empresaTransporte) {
      setBuscando(false);
      setError("Esta factura no corresponde a tu empresa de transporte.");
      return;
    }

    const { data: productos, error: errorProductos } = await supabase
      .from("factura_productos")
      .select("posicion, codigo_producto, nombre_producto, cantidad, lote")
      .eq("factura", numeroCompleto)
      .order("posicion");

    setBuscando(false);

    if (errorProductos) {
      setError("Ocurrió un error al cargar los productos de la factura. Intenta de nuevo.");
      return;
    }
    if (!productos || productos.length === 0) {
      setError(MENSAJE_FACTURA_NO_ENCONTRADA);
      return;
    }

    onEncontrada({ factura, productos });
  }

  return (
    <form onSubmit={buscar} className="bloque-formulario">
      <label htmlFor="parte1">Número de factura</label>
      <div className="campo-factura-segmentado">
        <span className="literal-factura">01-0FF</span>
        <input
          id="parte1"
          type="text"
          inputMode="numeric"
          value={parte1}
          onChange={cambioParte1}
          maxLength={2}
          className="casilla-factura casilla-factura-corta"
        />
        <span className="literal-factura">-0</span>
        <input
          ref={refParte2}
          type="text"
          inputMode="numeric"
          value={parte2}
          onChange={cambioParte2}
          maxLength={6}
          className="casilla-factura casilla-factura-larga"
        />
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <button type="submit" disabled={buscando}>
        {buscando ? "Buscando..." : "Buscar factura"}
      </button>
    </form>
  );
}
