import { useState } from "react";
import NuevoReclamo from "./NuevoReclamo";
import Seguimiento from "./Seguimiento";

export default function PanelTransportista() {
  const [pestana, setPestana] = useState("nuevo");

  return (
    <div>
      <nav className="pestanas">
        <button
          className={pestana === "nuevo" ? "activa" : ""}
          onClick={() => setPestana("nuevo")}
        >
          Nuevo reclamo
        </button>
        <button
          className={pestana === "seguimiento" ? "activa" : ""}
          onClick={() => setPestana("seguimiento")}
        >
          Seguimiento
        </button>
      </nav>

      {pestana === "nuevo" ? <NuevoReclamo /> : <Seguimiento />}
    </div>
  );
}
