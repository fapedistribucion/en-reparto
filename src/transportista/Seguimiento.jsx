import { useState } from "react";
import { useTickets } from "../compartido/useTickets";
import TablaTickets from "../compartido/TablaTickets";
import TicketDetalle from "../compartido/TicketDetalle";

export default function Seguimiento() {
  const { tickets, cargando, error } = useTickets();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;

  if (cargando) return <p>Cargando tickets...</p>;
  if (error) return <p className="mensaje-error">No se pudieron cargar los tickets: {error}</p>;

  return (
    <div>
      <TablaTickets tickets={tickets} onVerDetalle={(t) => setSeleccionadoId(t.id)} />
      {seleccionado && <TicketDetalle ticket={seleccionado} onCerrar={() => setSeleccionadoId(null)} />}
    </div>
  );
}
