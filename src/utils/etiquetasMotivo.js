const ETIQUETAS = {
  AVERIA: "Avería",
  FALTANTE: "Faltante",
  SOBRANTE: "Sobrante",
  VENCIMIENTO_CORTO: "Vencimiento corto",
  LOTE_CRUZADO: "Lote cruzado",
  CRUCE_PRODUCTOS: "Cruce de productos",
  LOCAL_CERRADO: "Local cerrado",
  PEDIDO_DUPLICADO: "Pedido duplicado",
  DIFERENCIA_PRECIO: "Diferencia de precio",
  ERROR_PRESENTACION: "Error de presentación",
  PRODUCTOS_NO_SOLICITADOS: "Productos no solicitados",
};

function titulo(valor) {
  const texto = String(valor ?? "").toLowerCase().replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function etiquetaMotivo(subcategoria) {
  return ETIQUETAS[subcategoria] ?? titulo(subcategoria);
}
