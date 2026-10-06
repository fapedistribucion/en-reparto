import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useMotivos } from "../transportista/useMotivos";
import TarjetaProducto from "../transportista/componentes/TarjetaProducto";
import {
  cantidadesPreviasPorPosicion,
  derivarObservaciones,
  validarProductoAgregado,
} from "../transportista/logicaReclamo";
import { agregarProductoSAC } from "./servicioAgregarProducto";

// Solo SAC, solo rechazo parcial y solo en EN_RUTA / EN_LI (GESTION LI): el que decide si se
// muestra es PanelSAC (puedeAgregarProducto). La base de datos lo vuelve a validar.
export const ESTADOS_AGREGAR_PRODUCTO = ["EN_RUTA", "EN_LI"];

export function puedeAgregarProducto(ticket) {
  return ticket?.alcance_reclamo === "RECHAZO_PARCIAL" && ESTADOS_AGREGAR_PRODUCTO.includes(ticket?.estado);
}

function tarjetaVacia() {
  return { uid: crypto.randomUUID(), posicion: null, subcategoria: "", cantidad: "", bulto: "", archivos: {} };
}

function FormularioAgregar({ ticket, onCerrar, onAgregado }) {
  const { motivos, cargando: cargandoMotivos, error: errorMotivos } = useMotivos();
  const [productos, setProductos] = useState([]);
  const [observadas, setObservadas] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [tarjeta, setTarjeta] = useState(tarjetaVacia);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      const [prod, obs] = await Promise.all([
        supabase
          .from("factura_productos")
          .select("posicion, codigo_producto, nombre_producto, cantidad, lote")
          .eq("factura", ticket.factura)
          .order("posicion"),
        // Todo lo ya observado del ticket (de cualquier motivo) cuenta para el tope de cantidad.
        supabase.from("ticket_observaciones").select("posicion, cantidad_observada").eq("ticket_id", ticket.id),
      ]);
      if (cancelado) return;
      if (prod.error || obs.error) {
        setErrorCarga("No se pudieron cargar los productos de la factura. Intenta de nuevo.");
      } else {
        setProductos(prod.data ?? []);
        setObservadas(obs.data ?? []);
      }
      setCargandoDatos(false);
    }
    cargar();
    return () => {
      cancelado = true;
    };
  }, [ticket.id, ticket.factura]);

  const motivosSeleccionables = useMemo(() => motivos.filter((m) => !m.alcance_forzado), [motivos]);
  const cantidadesPrevias = useMemo(() => cantidadesPreviasPorPosicion(observadas), [observadas]);

  async function agregar() {
    setErrorEnvio("");
    const problema = validarProductoAgregado({ tarjeta, motivos, productos, cantidadesPrevias });
    if (problema) {
      setErrorEnvio(problema.replace(/^Producto 1: /, ""));
      return;
    }

    setEnviando(true);
    try {
      const [observacion] = derivarObservaciones({
        opcion: "RECHAZO_PARCIAL",
        motivos,
        tarjetas: [tarjeta],
      });
      await agregarProductoSAC({ ticket, observacion });
      onAgregado();
      onCerrar();
    } catch (error) {
      setErrorEnvio(error.message);
      setEnviando(false);
    }
  }

  const cargando = cargandoMotivos || cargandoDatos;

  return (
    <div className="fondo-modal" onClick={enviando ? undefined : onCerrar}>
      <div className="panel-detalle" onClick={(e) => e.stopPropagation()}>
        <p className="panel-detalle-titulo-seccion">Agregar producto al ticket {ticket.codigo_ticket}</p>
        <p className="dato-menor">Factura {ticket.factura}</p>

        {cargando ? (
          <p className="panel-detalle-seccion">Cargando productos...</p>
        ) : errorCarga || errorMotivos ? (
          <p className="mensaje-error">{errorCarga || `No se pudieron cargar los motivos: ${errorMotivos}`}</p>
        ) : (
          <TarjetaProducto
            indice={0}
            tarjeta={tarjeta}
            productos={productos}
            motivosSeleccionables={motivosSeleccionables}
            motivos={motivos}
            puedeQuitar={false}
            cantidadOcupada={tarjeta.posicion != null ? cantidadesPrevias.get(tarjeta.posicion) ?? 0 : 0}
            onCambiar={setTarjeta}
            onQuitar={() => {}}
          />
        )}

        {errorEnvio && <p className="mensaje-error">{errorEnvio}</p>}

        <div className="modal-confirmar-acciones">
          <button type="button" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="boton-primario" onClick={agregar} disabled={enviando || cargando || Boolean(errorCarga)}>
            {enviando ? "Agregando..." : "Agregar producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgregarProductoSAC({ ticket, onAgregado }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Agregar producto
      </button>
      {abierto && (
        <FormularioAgregar ticket={ticket} onCerrar={() => setAbierto(false)} onAgregado={onAgregado} />
      )}
    </>
  );
}
