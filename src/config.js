// Datos de contacto que se muestran en la app. Cambiarlos aquí, en un solo lugar.

export const CONTACTO_DATOS = {
  nombre: "Jefferson Laura",
  telefono: "920799198",
};

// Teléfono de QTA para los casos No Logísticos (pendiente de definir).
// Mientras esté vacío, el aviso se muestra sin número.
export const TELEFONO_QTA = "";

export const MENSAJE_FACTURA_NO_ENCONTRADA =
  `Factura no encontrada, colocar bien el número de factura, si el problema persiste comunicarse con ${CONTACTO_DATOS.nombre} - ${CONTACTO_DATOS.telefono}`;
