import { useState } from "react";
import { useAuth } from "./auth/useAuth";
import Login from "./auth/Login";
import PanelTransportista from "./transportista/PanelTransportista";
import PanelSAC from "./sac/PanelSAC";
import PanelLI from "./li/PanelLI";
import MenuUsuario from "./compartido/MenuUsuario";

// Solo SAC y LI tienen sidebar (Por factura / Por producto / Dashboard); el
// transportista usa una vista simple sin menú lateral.
const ROLES_CON_SIDEBAR = ["sac", "li"];

export default function App() {
  const { usuario, rol, cargando, cerrarSesion } = useAuth();
  const [sidebarAbierta, setSidebarAbierta] = useState(true);

  if (cargando) return null;

  if (!usuario) return <Login />;

  const tieneSidebar = ROLES_CON_SIDEBAR.includes(rol);

  return (
    <div className="app">
      <header className="encabezado">
        <div className="encabezado-izquierda">
          {tieneSidebar && (
            <button
              type="button"
              className="boton-toggle-barra"
              onClick={() => setSidebarAbierta((v) => !v)}
              aria-label={sidebarAbierta ? "Ocultar menú" : "Mostrar menú"}
              title={sidebarAbierta ? "Ocultar menú" : "Mostrar menú"}
            >
              <span />
              <span />
              <span />
            </button>
          )}
          <span className="marca">EnReparto</span>
        </div>
        <MenuUsuario correo={usuario.email} onSalir={cerrarSesion} />
      </header>

      <main className="contenido">
        {rol === "transportista" && <PanelTransportista />}
        {rol === "sac" && <PanelSAC sidebarAbierta={sidebarAbierta} />}
        {rol === "li" && <PanelLI sidebarAbierta={sidebarAbierta} />}
        {!rol && (
          <div className="contenedor-simple">
            <p>Tu cuenta no tiene un rol asignado. Contacta al administrador.</p>
          </div>
        )}
      </main>
    </div>
  );
}
