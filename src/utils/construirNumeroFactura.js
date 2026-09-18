// Formato fijo de factura: 01-0FF{2 dígitos}-0{6 dígitos}
// Ej: los 8 dígitos "01206863" -> "01-0FF01-0206863"
// El transportista solo digita los 8 dígitos variables; el resto es siempre igual.

export function construirNumeroFactura(ochoDigitos) {
  const limpio = String(ochoDigitos).replace(/\D/g, "");
  if (limpio.length !== 8) return null;

  const primerosDos = limpio.slice(0, 2);
  const ultimosSeis = limpio.slice(2);
  return `01-0FF${primerosDos}-0${ultimosSeis}`;
}
