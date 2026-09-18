import { useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/useAuth";
import { construirNumeroFactura } from "../utils/construirNumeroFactura";
import { convertirABase64 } from "../utils/convertirABase64";
import { etiquetaEvidencia } from "../utils/etiquetasEvidencia";
import SelectorCategoria from "./componentes/SelectorCategoria";
import FormularioObservaciones from "./componentes/FormularioObservaciones";
import SubidaEvidencia from "./componentes/SubidaEvidencia";
import ModalTicketCreado from "../compartido/ModalTicketCreado";

const NUMERO_CONTACTO = "920799198";

const ESTADO_INICIAL_RECLAMO = {
  subcategoriaSeleccionada: null,
  detalleServicio: "",
  observaciones: [],
  archivosPorTipo: {},
};

export default function NuevoReclamo() {
  const { empresaTransporte } = useAuth();

  // Paso 1: búsqueda de factura
  const [parte1, setParte1] = useState("");
  const [parte2, setParte2] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [facturaEncontrada, setFacturaEncontrada] = useState(null);

  // Paso 2: el reclamo en sí
  const [reclamo, setReclamo] = useState(ESTADO_INICIAL_RECLAMO);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [ticketCreado, setTicketCreado] = useState(null);

  const numeroCompleto = construirNumeroFactura(parte1 + parte2);
  const refParte2 = useRef(null);

  function manejarCambioParte1(e) {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 2);
    setParte1(valor);
    if (valor.length === 2) refParte2.current?.focus();
  }

  function manejarCambioParte2(e) {
    setParte2(e.target.value.replace(/\D/g, "").slice(0, 6));
  }

  async function buscarFactura(e) {
    e.preventDefault();
    setErrorBusqueda("");
    setFacturaEncontrada(null);

    if (!numeroCompleto) {
      setErrorBusqueda("Ingresa los 8 dígitos de la factura.");
      return;
    }

    setBuscando(true);
    const { data, error } = await supabase
      .from("facturas_data")
      .select("factura, pedido_entrega, cliente, empresa_transporte, vendedor, canal, departamento, viaje, fecha_viaje")
      .eq("factura", numeroCompleto)
      .maybeSingle();
    setBuscando(false);

    if (error) {
      setErrorBusqueda("Ocurrió un error al buscar la factura. Intenta de nuevo.");
      return;
    }

    if (!data) {
      setErrorBusqueda(`Factura no encontrada. Comunícate al ${NUMERO_CONTACTO} para que te ayuden a verificarla.`);
      return;
    }

    if (data.empresa_transporte !== empresaTransporte) {
      setErrorBusqueda("Esta factura no corresponde a tu empresa de transporte.");
      return;
    }

    setFacturaEncontrada(data);
  }

  function reiniciarTodo() {
    setParte1("");
    setParte2("");
    setFacturaEncontrada(null);
    setErrorBusqueda("");
    setReclamo(ESTADO_INICIAL_RECLAMO);
    setErrorEnvio("");
    setTicketCreado(null);
  }

  function actualizarArchivosPorTipo(tipo, archivos) {
    setReclamo((prev) => ({
      ...prev,
      archivosPorTipo: { ...prev.archivosPorTipo, [tipo]: archivos },
    }));
  }

  async function crearTicket() {
    setErrorEnvio("");

    if (!reclamo.subcategoriaSeleccionada) {
      setErrorEnvio("Selecciona la categoría y subcategoría del reclamo.");
      return;
    }

    const evidenciasRequeridas = reclamo.subcategoriaSeleccionada.evidencias_requeridas ?? [];
    const tiposFaltantes = evidenciasRequeridas.filter(
      (tipo) => !(reclamo.archivosPorTipo[tipo]?.length > 0)
    );
    if (tiposFaltantes.length > 0) {
      setErrorEnvio("Falta subir: " + tiposFaltantes.map(etiquetaEvidencia).join(", "));
      return;
    }

    setEnviando(true);

    // Verificación automática con IA -- nunca bloquea el envío, solo queda
    // registrada en el ticket para que SAC/LI tengan visibilidad de si
    // la foto de la factura coincidió con lo digitado o no.
    let facturaVerificadaIA = null;
    const archivosFactura = reclamo.archivosPorTipo.foto_factura ?? [];
    const archivoFactura = archivosFactura[archivosFactura.length - 1];

    if (archivoFactura) {
      try {
        const imagenBase64 = await convertirABase64(archivoFactura);
        const respuestaIA = await fetch("/api/validar-factura", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagenBase64, numeroFactura: facturaEncontrada.factura }),
        });
        const resultadoIA = await respuestaIA.json();
        facturaVerificadaIA = respuestaIA.ok ? Boolean(resultadoIA.coincide) : false;
      } catch {
        facturaVerificadaIA = false;
      }
    }

    const { data: sesion } = await supabase.auth.getUser();
    const usuarioId = sesion.user.id;

    const { data: ticket, error: errorTicket } = await supabase
      .from("tickets")
      .insert({
        factura: facturaEncontrada.factura,
        pedido_entrega: facturaEncontrada.pedido_entrega,
        cliente: facturaEncontrada.cliente,
        empresa_transporte: facturaEncontrada.empresa_transporte,
        vendedor: facturaEncontrada.vendedor,
        canal: facturaEncontrada.canal,
        departamento: facturaEncontrada.departamento,
        viaje: facturaEncontrada.viaje,
        fecha_viaje: facturaEncontrada.fecha_viaje,
        categoria: reclamo.subcategoriaSeleccionada.categoria,
        subcategoria: reclamo.subcategoriaSeleccionada.subcategoria,
        detalle_servicio: reclamo.detalleServicio,
        creado_por: usuarioId,
        factura_verificada_ia: facturaVerificadaIA,
      })
      .select()
      .single();

    if (errorTicket) {
      setEnviando(false);
      setErrorEnvio("No se pudo crear el ticket: " + errorTicket.message);
      return;
    }

    const filasObservaciones = reclamo.observaciones
      .filter((o) => o.numero_bulto || o.posicion || o.cantidad)
      .map((o) => ({
        ticket_id: ticket.id,
        numero_bulto: o.numero_bulto || null,
        posicion: o.posicion || null,
        cantidad: o.cantidad ? Number(o.cantidad) : null,
      }));

    if (filasObservaciones.length > 0) {
      await supabase.from("ticket_observaciones").insert(filasObservaciones);
    }

    for (const tipo of Object.keys(reclamo.archivosPorTipo)) {
      const archivos = reclamo.archivosPorTipo[tipo];
      for (let i = 0; i < archivos.length; i++) {
        const ruta = `${empresaTransporte}/${ticket.codigo_ticket}/${tipo}-${i + 1}.jpg`;
        const { error: errorSubida } = await supabase.storage
          .from("evidencias")
          .upload(ruta, archivos[i], { upsert: true });

        if (!errorSubida) {
          await supabase.from("ticket_adjuntos").insert({
            ticket_id: ticket.id,
            tipo_evidencia: tipo,
            url_storage: ruta,
            subido_por: usuarioId,
          });
        }
      }
    }

    setEnviando(false);
    setTicketCreado(ticket.codigo_ticket);
  }

  return (
    <div>
      <h2>Nuevo reclamo</h2>

      {!facturaEncontrada && (
        <form onSubmit={buscarFactura} className="bloque-formulario">
          <label htmlFor="parte1">Número de factura</label>
          <div className="campo-factura-segmentado">
            <span className="literal-factura">01-0FF</span>
            <input
              id="parte1"
              type="text"
              inputMode="numeric"
              value={parte1}
              onChange={manejarCambioParte1}
              maxLength={2}
              className="casilla-factura casilla-factura-corta"
            />
            <span className="literal-factura">-0</span>
            <input
              ref={refParte2}
              type="text"
              inputMode="numeric"
              value={parte2}
              onChange={manejarCambioParte2}
              maxLength={6}
              className="casilla-factura casilla-factura-larga"
            />
          </div>

          {errorBusqueda && <p className="mensaje-error">{errorBusqueda}</p>}

          <button type="submit" disabled={buscando}>
            {buscando ? "Buscando..." : "Buscar factura"}
          </button>
        </form>
      )}

      {facturaEncontrada && (
        <>
          <div className="tarjeta-info">
            <div className="tarjeta-info-encabezado">
              <p className="tarjeta-info-titulo">Factura encontrada</p>
              <button type="button" onClick={reiniciarTodo}>
                Cambiar
              </button>
            </div>

            <div className="tarjeta-info-datos">
              <div><span>Factura</span><strong>{facturaEncontrada.factura}</strong></div>
              <div><span>Pedido</span><strong>{facturaEncontrada.pedido_entrega}</strong></div>
              <div><span>Cliente</span><strong>{facturaEncontrada.cliente}</strong></div>
              <div><span>Vendedor</span><strong>{facturaEncontrada.vendedor}</strong></div>
              <div><span>Canal</span><strong>{facturaEncontrada.canal}</strong></div>
              <div><span>Viaje</span><strong>{facturaEncontrada.viaje}</strong></div>
            </div>
          </div>

          <div className="seccion-reclamo">
            <SelectorCategoria
              onSeleccion={(sub) => setReclamo((prev) => ({ ...prev, subcategoriaSeleccionada: sub }))}
            />
          </div>

          {reclamo.subcategoriaSeleccionada && (
            <>
              <div className="seccion-reclamo bloque-formulario">
                <label htmlFor="detalle">Observación (opcional)</label>
                <textarea
                  id="detalle"
                  rows={3}
                  value={reclamo.detalleServicio}
                  onChange={(e) => setReclamo((prev) => ({ ...prev, detalleServicio: e.target.value }))}
                  placeholder="¿Algo más que quieras indicar sobre este reclamo?"
                />
              </div>

              <div className="seccion-reclamo">
                <FormularioObservaciones
                  observaciones={reclamo.observaciones}
                  onCambiar={(obs) => setReclamo((prev) => ({ ...prev, observaciones: obs }))}
                />
              </div>

              <div className="seccion-reclamo">
                <p className="etiqueta-seccion">Evidencia requerida</p>
                {reclamo.subcategoriaSeleccionada.evidencias_requeridas.map((tipo) => (
                  <SubidaEvidencia
                    key={tipo}
                    tipo={tipo}
                    archivos={reclamo.archivosPorTipo[tipo] ?? []}
                    onCambiar={(archivos) => actualizarArchivosPorTipo(tipo, archivos)}
                  />
                ))}
              </div>

              {errorEnvio && <p className="mensaje-error">{errorEnvio}</p>}

              <button type="button" onClick={crearTicket} disabled={enviando} className="boton-enviar">
                {enviando ? "Verificando y generando ticket..." : "Generar ticket"}
              </button>
            </>
          )}
        </>
      )}

      {ticketCreado && (
        <ModalTicketCreado codigo={ticketCreado} onCerrar={reiniciarTodo} />
      )}
    </div>
  );
}
