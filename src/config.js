// Datos de contacto que se muestran en la app. Cambiarlos aquí, en un solo lugar.

export const CONTACTO_DATOS = {
  nombre: "Jefferson Laura",
  telefono: "920799198",
};

// Canal de soporte al transportista (Supply Te Ayuda): atiende los casos No logísticos y Faltante,
// brinda el número de ticket y anula tickets cuando hace falta.
export const NOMBRE_SOPORTE = "Supply Te Ayuda";
export const TELEFONO_SOPORTE = "016199010";

// Aviso cuando la factura ya tiene un ticket que no está anulado (un solo ticket activo por factura).
// `codigo` viene vacío si el ticket todavía no fue aprobado (aún no tiene número).
export function mensajeTicketExistente(codigo, factura) {
  const contacto = `llama a ${NOMBRE_SOPORTE} al ${TELEFONO_SOPORTE}`;
  return codigo
    ? `Esta factura ya tiene el ticket ${codigo}. Si necesitas anularlo para crear uno nuevo, ${contacto} e indica el número del ticket.`
    : `Esta factura ya tiene un reclamo registrado, pendiente de aprobación. Si necesitas anularlo para crear uno nuevo, ${contacto} e indica la factura${factura ? ` ${factura}` : ""}.`;
}

export const MENSAJE_FACTURA_NO_ENCONTRADA =
  `Factura no encontrada, colocar bien el número de factura, si el problema persiste comunicarse con ${CONTACTO_DATOS.nombre} - ${CONTACTO_DATOS.telefono}`;

// Regiones que salen de la tabla config_rutas (ruta -> departamento / región). "Sin región" no es una
// región: es el valor que se muestra cuando la factura todavía no tiene ruta o su ruta no está en la tabla.
export const REGIONES = ["LIMA", "NORTE", "SUR", "CENTRO", "ORIENTE"];
export const SIN_REGION = "Sin región";
