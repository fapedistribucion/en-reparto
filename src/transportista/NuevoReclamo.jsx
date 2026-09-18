import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/useAuth";
import { construirNumeroFactura } from "../utils/construirNumeroFactura";

const NUMERO_CONTACTO = "920799198";

export default function NuevoReclamo() {
  const { empresaTransporte } = useAuth();

  const [digitos, setDigitos] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [facturaEncontrada, setFacturaEncontrada] = useState(null);

  const numeroCompleto = construirNumeroFactura(digitos);

  function manejarCambioDigitos(e) {
    const soloNumeros = e.target.value.replace(/\D/g, "").slice(0, 8);
    setDigitos(soloNumeros);
  }

  async function buscarFactura(e) {
    e.preventDefault();
    setError("");
    setFacturaEncontrada(null);

    if (!numeroCompleto) {
      setError("Ingresa los 8 dígitos de la factura.");
      return;
    }

    setBuscando(true);
    const { data, error: errorBusqueda } = await supabase
      .from("facturas_data")
      .select("factura, pedido_entrega, cliente, empresa_transporte, vendedor, canal, viaje")
      .eq("factura", numeroCompleto)
      .maybeSingle();
    setBuscando(false);

    if (errorBusqueda) {
      setError("Ocurrió un error al buscar la factura. Intenta de nuevo.");
      return;
    }

    if (!data) {
      setError(
        `Factura no encontrada. Comunícate al ${NUMERO_CONTACTO} para que te ayuden a verificarla.`
      );
      return;
    }

    if (data.empresa_transporte !== empresaTransporte) {
      setError("Esta factura no corresponde a tu empresa de transporte.");
      return;
    }

    setFacturaEncontrada(data);
  }

  function reiniciarBusqueda() {
    setDigitos("");
    setFacturaEncontrada(null);
    setError("");
  }

  return (
    <div>
      <h2>Nuevo reclamo</h2>

      {!facturaEncontrada && (
        <form onSubmit={buscarFactura} className="bloque-formulario">
          <label htmlFor="factura">Número de factura (8 dígitos)</label>
          <input
            id="factura"
            type="text"
            inputMode="numeric"
            value={digitos}
            onChange={manejarCambioDigitos}
            placeholder="Ej. 01206863"
            maxLength={8}
          />

          {digitos.length > 0 && (
            <p className="ayuda-campo">
              Factura completa: {numeroCompleto ?? `faltan ${8 - digitos.length} dígitos`}
            </p>
          )}

          {error && <p className="mensaje-error">{error}</p>}

          <button type="submit" disabled={buscando}>
            {buscando ? "Buscando..." : "Buscar factura"}
          </button>
        </form>
      )}

      {facturaEncontrada && (
        <div className="tarjeta-info">
          <div className="tarjeta-info-encabezado">
            <p className="tarjeta-info-titulo">Factura encontrada</p>
            <button type="button" onClick={reiniciarBusqueda}>
              Cambiar
            </button>
          </div>

          <div className="tarjeta-info-datos">
            <div>
              <span>Factura</span>
              <strong>{facturaEncontrada.factura}</strong>
            </div>
            <div>
              <span>Pedido</span>
              <strong>{facturaEncontrada.pedido_entrega}</strong>
            </div>
            <div>
              <span>Cliente</span>
              <strong>{facturaEncontrada.cliente}</strong>
            </div>
            <div>
              <span>Vendedor</span>
              <strong>{facturaEncontrada.vendedor}</strong>
            </div>
            <div>
              <span>Canal</span>
              <strong>{facturaEncontrada.canal}</strong>
            </div>
            <div>
              <span>Viaje</span>
              <strong>{facturaEncontrada.viaje}</strong>
            </div>
          </div>

          <p className="siguiente-paso">
            Próximo paso: elegir categoría y subcategoría del reclamo.
          </p>
        </div>
      )}
    </div>
  );
}
