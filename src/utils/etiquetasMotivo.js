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
  ERROR_DIRECCION: "Error de dirección",
  FALTANTE_DOCUMENTACION: "Faltante de documentación",
  PEDIDO_NO_SOLICITADO: "Pedido no solicitado",
};

function titulo(valor) {
  const texto = String(valor ?? "").toLowerCase().replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function etiquetaMotivo(subcategoria) {
  return ETIQUETAS[subcategoria] ?? titulo(subcategoria);
}

// Orden de las listas de motivos: «Faltante» primero y el resto alfabético.
export function ordenarEtiquetasMotivo(etiquetas) {
  const primero = ETIQUETAS.FALTANTE;
  return [...etiquetas].sort((a, b) => {
    if (a === primero && b !== primero) return -1;
    if (b === primero && a !== primero) return 1;
    return a.localeCompare(b, "es");
  });
}

// Todos los motivos conocidos, para armar listas de selección (ya con su etiqueta, ordenadas).
export function etiquetasMotivosConocidos() {
  return ordenarEtiquetasMotivo(Object.values(ETIQUETAS));
}
