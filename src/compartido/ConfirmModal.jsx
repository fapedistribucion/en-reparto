// Popup de confirmación propio (reemplaza window.confirm, que muestra el
// diálogo nativo del navegador). Se usa antes de anular un ticket, marcar
// llegada a LI, guardar una Nota de Crédito, o validar la respuesta del vendedor.
export default function ConfirmModal({ mensaje, onConfirmar, onCancelar, cargando = false, textoConfirmar = "Aceptar" }) {
  return (
    <div className="fondo-modal" onClick={cargando ? undefined : onCancelar}>
      <div className="modal-confirmar" onClick={(e) => e.stopPropagation()}>
        <p className="modal-confirmar-mensaje">{mensaje}</p>
        <div className="modal-confirmar-acciones">
          <button type="button" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </button>
          <button type="button" className="boton-primario" onClick={onConfirmar} disabled={cargando}>
            {cargando ? "Guardando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
