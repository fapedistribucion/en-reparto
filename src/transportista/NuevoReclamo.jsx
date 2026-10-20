import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useMotivos } from "./useMotivos";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";
import { esMotivoSinAlcance, etiquetaAlcance } from "../utils/alcance";
import {
  PREFIJO_SIN_ALCANCE,
  MAX_OBSERVACION,
  derivarObservaciones,
  evidenciasDe,
  interpretarOpcion,
  usaTarjetas,
  validarReclamo,
} from "./logicaReclamo";
import { crearTicket, subirEvidencias } from "./servicioReclamo";
import BusquedaFactura from "./componentes/BusquedaFactura";
import SelectorAlcance from "./componentes/SelectorAlcance";
import SelectorMotivo from "./componentes/SelectorMotivo";
import TarjetaProducto from "./componentes/TarjetaProducto";
import SubidaEvidencia from "./componentes/SubidaEvidencia";
import ModalTicketCreado from "../compartido/ModalTicketCreado";

function nuevaTarjeta() {
  return { uid: crypto.randomUUID(), posicion: null, subcategoria: "", cantidad: "", bulto: "", archivos: {} };
}

export default function NuevoReclamo() {
  const { empresaTransporte } = useAuth();
  const { motivos, cargando: cargandoMotivos, error: errorMotivos } = useMotivos();

  const [encontrada, setEncontrada] = useState(null); // { factura, productos }
  const [opcion, setOpcion] = useState("");
  const [motivoTotal, setMotivoTotal] = useState("");
  const [archivosMotivo, setArchivosMotivo] = useState({});
  const [observacionTotal, setObservacionTotal] = useState("");
  const [tarjetas, setTarjetas] = useState(() => [nuevaTarjeta()]);
  const [archivosFactura, setArchivosFactura] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [resultado, setResultado] = useState(null); // { codigo (null si queda pendiente de SAC), factura }

  const { alcance, motivoFijo, seleccionada } = interpretarOpcion(opcion);

  // Motivos que el transportista puede elegir a mano dentro de un rechazo (no los que fuerzan un alcance,
  // ni los que tienen su propia opción en el formulario, como Sobrante)
  const motivosSeleccionables = useMemo(
    () => motivos.filter((m) => !m.alcance_forzado && !esMotivoSinAlcance(m.subcategoria)),
    [motivos]
  );
  // En rechazo parcial / tarjetas no se pueden elegir los motivos que solo aplican a la factura completa
  const motivosParaTarjetas = useMemo(
    () => motivosSeleccionables.filter((m) => !m.solo_rechazo_total),
    [motivosSeleccionables]
  );

  const opciones = useMemo(() => {
    const forzadas = motivos
      .filter((m) => m.alcance_forzado)
      .map((m) => ({
        clave: `${m.alcance_forzado}:${m.subcategoria}`,
        titulo: `${etiquetaMotivo(m.subcategoria)} - ${etiquetaAlcance(m.alcance_forzado)}`,
        ayuda: "La factura se atenderá otro día",
      }));
    // Opciones propias sin alcance (Sobrante): solo aparecen si el motivo existe y está activo
    const sinAlcance = motivos
      .filter((m) => esMotivoSinAlcance(m.subcategoria))
      .map((m) => ({
        clave: `${PREFIJO_SIN_ALCANCE}:${m.subcategoria}`,
        titulo: etiquetaMotivo(m.subcategoria),
        ayuda: "Llegó producto de más",
      }));
    return [
      { clave: "RECHAZO_TOTAL", titulo: "Rechazo total", ayuda: "El cliente rechaza toda la factura" },
      { clave: "RECHAZO_PARCIAL", titulo: "Rechazo parcial", ayuda: "El cliente rechaza solo algunos productos" },
      ...sinAlcance,
      ...forzadas,
    ];
  }, [motivos]);

  const conTarjetas = usaTarjetas(opcion); // Rechazo parcial o Sobrante
  const motivoActual = motivoFijo ?? motivoTotal;
  const evidenciasMotivo = motivoActual ? evidenciasDe(motivos, motivoActual) : [];
  const pideObservacion = !conTarjetas && !!motivos.find((m) => m.subcategoria === motivoActual)?.pide_observacion;

  function reiniciarTodo() {
    setEncontrada(null);
    setOpcion("");
    setMotivoTotal("");
    setArchivosMotivo({});
    setObservacionTotal("");
    setTarjetas([nuevaTarjeta()]);
    setArchivosFactura([]);
    setEnviando(false);
    setErrorEnvio("");
    setResultado(null);
  }

  function elegirOpcion(clave) {
    // Al cambiar entre Parcial y Sobrante se vuelve a empezar con una tarjeta limpia
    if (clave !== opcion) setTarjetas([nuevaTarjeta()]);
    setOpcion(clave);
    setMotivoTotal("");
    setArchivosMotivo({});
    setObservacionTotal("");
    setErrorEnvio("");
  }

  function actualizarTarjeta(uid, nueva) {
    setTarjetas((prev) => prev.map((t) => (t.uid === uid ? nueva : t)));
  }

  // Cantidad que ya tomaron las OTRAS tarjetas del mismo producto con el MISMO motivo.
  // El tope es por motivo: el mismo producto puede tener varios motivos y no se suman entre sí.
  function cantidadOcupadaPorOtras(tarjeta) {
    if (tarjeta.posicion == null) return 0;
    const motivo = motivoFijo ?? tarjeta.subcategoria;
    return tarjetas
      .filter(
        (x) =>
          x.uid !== tarjeta.uid &&
          x.posicion === tarjeta.posicion &&
          (motivoFijo ?? x.subcategoria) === motivo
      )
      .reduce((suma, x) => suma + (Number.isFinite(Number(x.cantidad)) ? Number(x.cantidad) : 0), 0);
  }

  async function generarTicket() {
    setErrorEnvio("");

    const problema = validarReclamo({
      opcion,
      motivos,
      motivoTotal,
      archivosMotivo,
      observacionTotal,
      tarjetas,
      productos: encontrada.productos,
      archivosFactura,
    });
    if (problema) {
      setErrorEnvio(problema);
      return;
    }

    setEnviando(true);
    try {
      const observaciones = derivarObservaciones({ opcion, motivos, motivoTotal, archivosMotivo, observacionTotal, tarjetas });
      const numeroFactura = encontrada.factura.factura;

      const { evidenciasTicket, observacionesPayload } = await subirEvidencias({
        empresa: empresaTransporte,
        archivosFactura,
        observaciones,
      });

      const respuesta = await crearTicket({
        factura: numeroFactura,
        alcance,
        evidenciasTicket,
        observacionesPayload,
      });

      setResultado({ codigo: respuesta.codigo_ticket ?? null, factura: numeroFactura });
    } catch (error) {
      setErrorEnvio(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h2>Nuevo reclamo</h2>

      {!encontrada && (
        <BusquedaFactura empresaTransporte={empresaTransporte} onEncontrada={setEncontrada} />
      )}

      {encontrada && (
        <>
          <div className="tarjeta-info">
            <div className="tarjeta-info-encabezado">
              <p className="tarjeta-info-titulo">Factura encontrada</p>
              <button type="button" onClick={reiniciarTodo}>
                Cambiar
              </button>
            </div>
            <div className="tarjeta-info-datos">
              <div><span>Factura</span><strong>{encontrada.factura.factura}</strong></div>
              <div><span>Pedido</span><strong>{encontrada.factura.pedido_entrega}</strong></div>
              <div><span>Cliente</span><strong>{encontrada.factura.cliente}</strong></div>
              <div><span>Productos</span><strong>{encontrada.productos.length}</strong></div>
            </div>
          </div>

          {cargandoMotivos && <p className="seccion-reclamo">Cargando motivos...</p>}
          {errorMotivos && (
            <p className="mensaje-error seccion-reclamo">No se pudieron cargar los motivos: {errorMotivos}</p>
          )}

          {!cargandoMotivos && !errorMotivos && (
            <>
              <div className="seccion-reclamo">
                <p className="etiqueta-seccion">¿Qué ocurrió con la entrega?</p>
                <SelectorAlcance opciones={opciones} valor={opcion} onCambiar={elegirOpcion} />
              </div>

              {alcance === "RECHAZO_TOTAL" && (
                <div className="seccion-reclamo bloque-formulario">
                  <label htmlFor="motivo-total">Motivo</label>
                  <SelectorMotivo
                    id="motivo-total"
                    motivos={motivosSeleccionables}
                    valor={motivoTotal}
                    onCambiar={(valor) => {
                      setMotivoTotal(valor);
                      setArchivosMotivo({});
                      setObservacionTotal("");
                    }}
                  />
                </div>
              )}

              {seleccionada && !conTarjetas && pideObservacion && (
                <div className="seccion-reclamo bloque-formulario">
                  <label htmlFor="observacion-total">Observación</label>
                  <textarea
                    id="observacion-total"
                    rows={3}
                    maxLength={MAX_OBSERVACION}
                    placeholder="Escribe la observación"
                    value={observacionTotal}
                    onChange={(e) => setObservacionTotal(e.target.value)}
                  />
                  <p className="dato-menor">{observacionTotal.length}/{MAX_OBSERVACION}</p>
                </div>
              )}

              {seleccionada && !conTarjetas && evidenciasMotivo.length > 0 && (
                <div className="seccion-reclamo">
                  <p className="etiqueta-seccion">Evidencia</p>
                  {evidenciasMotivo.map((tipo) => (
                    <SubidaEvidencia
                      key={tipo}
                      tipo={tipo}
                      subcategoria={motivoActual}
                      archivos={archivosMotivo[tipo] ?? []}
                      onCambiar={(archivos) => setArchivosMotivo((prev) => ({ ...prev, [tipo]: archivos }))}
                    />
                  ))}
                </div>
              )}

              {conTarjetas && (
                <div className="seccion-reclamo">
                  <p className="etiqueta-seccion">
                    {motivoFijo ? `Productos con ${etiquetaMotivo(motivoFijo).toLowerCase()}` : "Productos con observación"}
                  </p>
                  {tarjetas.map((t, i) => (
                    <TarjetaProducto
                      key={t.uid}
                      indice={i}
                      tarjeta={t}
                      productos={encontrada.productos}
                      motivosSeleccionables={motivosParaTarjetas}
                      motivos={motivos}
                      motivoFijo={motivoFijo}
                      puedeQuitar={tarjetas.length > 1}
                      cantidadOcupada={cantidadOcupadaPorOtras(t)}
                      onCambiar={(nueva) => actualizarTarjeta(t.uid, nueva)}
                      onQuitar={() => setTarjetas((prev) => prev.filter((x) => x.uid !== t.uid))}
                    />
                  ))}
                  <button type="button" onClick={() => setTarjetas((prev) => [...prev, nuevaTarjeta()])}>
                    + Agregar producto
                  </button>
                </div>
              )}

              {seleccionada && (
                <>
                  <div className="seccion-reclamo">
                    <p className="etiqueta-seccion">Factura</p>
                    <SubidaEvidencia tipo="foto_factura" archivos={archivosFactura} onCambiar={setArchivosFactura} />
                  </div>

                  {errorEnvio && <p className="mensaje-error">{errorEnvio}</p>}

                  <button type="button" onClick={generarTicket} disabled={enviando} className="boton-enviar">
                    {enviando ? "Generando ticket..." : "Generar ticket"}
                  </button>
                </>
              )}
            </>
          )}
        </>
      )}

      {resultado && (
        <ModalTicketCreado codigo={resultado.codigo} factura={resultado.factura} onCerrar={reiniciarTodo} />
      )}
    </div>
  );
}
