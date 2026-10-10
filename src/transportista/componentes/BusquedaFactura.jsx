import { useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { construirNumeroFactura } from "../../utils/construirNumeroFactura";
import { MENSAJE_FACTURA_NO_ENCONTRADA } from "../../config";

// Busca la factura y, si existe, trae también sus productos. Si falta cualquiera de las dos cosas,
// se muestra la alerta de "factura no encontrada" para que se revise la carga de datos.
export default function BusquedaFactura({ empresaTransporte, onEncontrada }) {
  const [serie, setSerie] = useState("");
  const [numero, setNumero] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const refNumero = useRef(null);

  const numeroCompleto = construirNumeroFactura(serie, numero);

  // Serie de 4 caracteres: 2 letras (FF o BB) + 2 dígitos. Se escribe en mayúsculas sola.
  function cambioSerie(e) {
    const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setSerie(valor);
    if (valor.length === 4) refNumero.current?.focus();
  }

  function cambioNumero(e) {
    setNumero(e.target.value.replace(/\D/g, "").slice(0, 6));
  }

  async function buscar(e) {
    e.preventDefault();
    setError("");

    if (!numeroCompleto) {
      setError("Ingresa la serie (por ejemplo FF01 o BB01) y los 6 dígitos del número de factura.");
      return;
    }

    setBuscando(true);

    const { data: factura, error: errorFactura } = await supabase
      .from("facturas_data")
      .select("factura, pedido_entrega, cliente, empresa_transporte")
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
    // Una factura sin transporte asignado la puede ver cualquier transporte; con transporte, solo el suyo
    // (la base ya filtra, esta es una segunda barrera por si acaso).
    if (factura.empresa_transporte && factura.empresa_transporte !== empresaTransporte) {
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
      <label htmlFor="serie">Número de factura</label>
      <div className="campo-factura-segmentado">
        <span className="literal-factura">01-0</span>
        <input
          id="serie"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          value={serie}
          onChange={cambioSerie}
          maxLength={4}
          placeholder="FF01"
          className="casilla-factura casilla-factura-serie"
        />
        <span className="literal-factura">-0</span>
        <input
          ref={refNumero}
          type="text"
          inputMode="numeric"
          value={numero}
          onChange={cambioNumero}
          maxLength={6}
          placeholder="000000"
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
