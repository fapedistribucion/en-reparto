// Datos de contacto que se muestran en la app. Cambiarlos aquí, en un solo lugar.

export const CONTACTO_DATOS = {
  nombre: "Jefferson Laura",
  telefono: "920799198",
};

// Teléfono de SAC: el transportista debe llamar aquí en los casos No logísticos y Faltante
// para que SAC atienda el caso, lo apruebe y le brinde el número de ticket.
export const TELEFONO_SAC = "016199010";

export const MENSAJE_FACTURA_NO_ENCONTRADA =
  `Factura no encontrada, colocar bien el número de factura, si el problema persiste comunicarse con ${CONTACTO_DATOS.nombre} - ${CONTACTO_DATOS.telefono}`;
