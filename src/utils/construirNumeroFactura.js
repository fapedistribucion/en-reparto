// El transportista digita la serie de 4 caracteres (FF01, FF07, BB01...) y los 6 dígitos del número.
//   FF01 + 206863 -> "01-0FF01-0206863"
//   BB01 + 000123 -> "03-0BB01-0000123"   (las BB se guardan y se muestran siempre como 03-0BB...)
// En el formulario las BB se escriben igual que las FF (01-0 + serie), por eso acá se traduce el prefijo.

export function construirNumeroFactura(serie, seisDigitos) {
  const s = String(serie ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const n = String(seisDigitos ?? "").replace(/\D/g, "");
  if (!/^(FF|BB)\d{2}$/.test(s) || n.length !== 6) return null;

  const prefijo = s.startsWith("BB") ? "03-0" : "01-0";
  return `${prefijo}${s}-0${n}`;
}
