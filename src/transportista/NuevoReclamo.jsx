import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useMotivos } from "./useMotivos";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";
import { esMotivoSinAlcance, etiquetaAlcance } from "../utils/alcance";
import {
  PREFIJO_SIN_ALCANCE,
  derivarObservaciones,
  evidenciasDe,
  interpretarOpcion,
  requiereSAC,
  validarReclamo,
} from "./logicaReclamo";
import { crearTicket, subirEvidencias, verificarFacturaConIA } from "./servicioReclamo";
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
  const [tarjetas, setTarjetas] = useState(() => [nuevaTarjeta()]);
  const [archivosFactura, setArchivosFactura] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [resultado, setResultado] = useState(null); // { codigo, requiereSAC }

  const { alcance, motivoFijo, seleccionada } = interpretarOpcion(opcion);

  // Motivos que el transportista puede elegir a mano dentro de un rechazo (no los que fuerzan un alcance,
  // ni los que tienen su propia opción en el formulario, como Sobrante)
  const motivosSeleccionables = useMemo(
    () => motivos.filter((m) => !m.alcance_forzado && !esMotivoSinAlcance(m.subcategoria)),
    [motivos]
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

  const motivoActual = motivoFijo ?? motivoTotal;
  const evidenciasMotivo = motivoActual ? evidenciasDe(motivos, motivoActual) : [];

  function reiniciarTodo() {
    setEncontrada(null);
    setOpcion("");
    setMotivoTotal("");
    setArchivosMotivo({});
    setTarjetas([nuevaTarjeta()]);
    setArchivosFactura([]);
    setEnviando(false);
    setErrorEnvio("");
    setResultado(null);
  }

  function elegirOpcion(clave) {
    setOpcion(clave);
    setMotivoTotal("");
    setArchivosMotivo({});
    setErrorEnvio("");
  }

  function actualizarTarjeta(uid, nueva) {
    setTarjetas((prev) => prev.map((t) => (t.uid === uid ? nueva : t)));
  }

  // Cantidad que ya tomaron las OTRAS tarjetas del mismo producto (mismo motivo distinto o no).
  function cantidadOcupadaPorOtras(tarjeta) {
    if (tarjeta.posicion == null) return 0;
    return tarjetas
      .filter((x) => x.uid !== tarjeta.uid && x.posicion === tarjeta.posicion)
      .reduce((suma, x) => suma + (Number.isFinite(Number(x.cantidad)) ? Number(x.cantidad) : 0), 0);
  }

  async function generarTicket() {
    setErrorEnvio("");

    const problema = validarReclamo({
      opcion,
      motivos,
      motivoTotal,
      archivosMotivo,
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
      const observaciones = derivarObservaciones({ opcion, motivos, motivoTotal, archivosMotivo, tarjetas });
      const numeroFactura = encontrada.factura.factura;

      // Alerta automática: nunca bloquea, solo queda registrada en el ticket
      const facturaVerificadaIA = await verificarFacturaConIA(
        archivosFactura[archivosFactura.length - 1],
        numeroFactura
      );

      const { evidenciasTicket, observacionesPayload } = await subirEvidencias({
        empresa: empresaTransporte,
        archivosFactura,
        observaciones,
      });

      const respuesta = await crearTicket({
        factura: numeroFactura,
        alcance,
        facturaVerificadaIA,
        evidenciasTicket,
        observacionesPayload,
      });

      setResultado({ codigo: respuesta.codigo_ticket, requiereSAC: requiereSAC(observaciones, motivos) });
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
                    }}
                  />
                </div>
              )}

              {seleccionada && alcance !== "RECHAZO_PARCIAL" && evidenciasMotivo.length > 0 && (
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

              {alcance === "RECHAZO_PARCIAL" && (
                <div className="seccion-reclamo">
                  <p className="etiqueta-seccion">Productos con observación</p>
                  {tarjetas.map((t, i) => (
                    <TarjetaProducto
                      key={t.uid}
                      indice={i}
                      tarjeta={t}
                      productos={encontrada.productos}
                      motivosSeleccionables={motivosSeleccionables}
                      motivos={motivos}
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
                    {enviando ? "Verificando y generando ticket..." : "Generar ticket"}
                  </button>
                </>
              )}
            </>
          )}
        </>
      )}

      {resultado && (
        <ModalTicketCreado codigo={resultado.codigo} requiereSAC={resultado.requiereSAC} onCerrar={reiniciarTodo} />
      )}
    </div>
  );
}
