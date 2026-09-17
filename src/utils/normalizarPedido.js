// Mismo criterio que en el script de carga de facturas_data: el pedido
// se normaliza quitando el prefijo "R" (refrigerado), nunca se excluye.
// Esto se usa acá para que lo que digita el transportista se compare
// contra facturas_data.pedido_entrega de forma consistente.

export function normalizarPedido(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor).trim();
  if (texto.toUpperCase().startsWith("R")) {
    return texto.slice(1);
  }
  return texto;
}
