import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import TicketDetalle from "../compartido/TicketDetalle";

const ETIQUETAS_ESTADO = {
  EN_RUTA: "En ruta",
  EN_LI: "En LI",
  SOLUCIONADO: "Solucionado",
  ANULADO: "Anulado",
};

function formatearFecha(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Seguimiento() {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  useEffect(() => {
    cargarTickets();
  }, []);

  async function cargarTickets() {
    setCargando(true);
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("fecha_creacion", { ascending: false });
    setTickets(data ?? []);
    setCargando(false);
  }

  if (cargando) return <p>Cargando tickets...</p>;

  if (tickets.length === 0) {
    return <p>Todavía no has generado ningún reclamo.</p>;
  }

  return (
    <div className="contenedor-tabla">
      <table className="tabla-tickets">
        <thead>
          <tr>
            <th>Fecha creación</th>
            <th>N° Ticket</th>
            <th>Estado</th>
            <th>Factura</th>
            <th>Pedido</th>
            <th>Categoría</th>
            <th>Subcategoría</th>
            <th>Cliente</th>
            <th>Llegada a LI</th>
            <th>Nota de crédito</th>
            <th>Validado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{formatearFecha(t.fecha_creacion)}</td>
              <td>{t.codigo_ticket}</td>
              <td>
                <span className={`badge-estado badge-estado-${t.estado?.toLowerCase()}`}>
                  {ETIQUETAS_ESTADO[t.estado] ?? t.estado}
                </span>
              </td>
              <td>{t.factura}</td>
              <td>{t.pedido_entrega}</td>
              <td>{t.categoria === "LOGISTICO" ? "Logístico" : "No logístico"}</td>
              <td>{t.subcategoria}</td>
              <td>{t.cliente}</td>
              <td>{formatearFecha(t.fecha_entrega_li)}</td>
              <td>{t.nota_credito ?? "—"}</td>
              <td>
                {t.categoria === "NO_LOGISTICO"
                  ? (t.validado === "VALIDADO" ? "Validado" : "No validado")
                  : "—"}
              </td>
              <td>
                <button type="button" onClick={() => setTicketSeleccionado(t)}>
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {ticketSeleccionado && (
        <TicketDetalle ticket={ticketSeleccionado} onCerrar={() => setTicketSeleccionado(null)} />
      )}
    </div>
  );
}
