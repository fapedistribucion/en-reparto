import { useAuth } from "./auth/useAuth";
import Login from "./auth/Login";
import PanelTransportista from "./transportista/PanelTransportista";
import PanelSAC from "./sac/PanelSAC";
import PanelLI from "./li/PanelLI";
import MenuUsuario from "./compartido/MenuUsuario";

export default function App() {
  const { usuario, rol, cargando, cerrarSesion } = useAuth();

  if (cargando) return null;

  if (!usuario) return <Login />;

  return (
    <div className="app">
      <header className="encabezado">
        <div className="usuario-actual">
          <MenuUsuario correo={usuario.email} onSalir={cerrarSesion} />
        </div>
      </header>

      <main className="contenido">
        {rol === "transportista" && <PanelTransportista />}
        {rol === "sac" && <PanelSAC />}
        {rol === "li" && <PanelLI />}
        {!rol && (
          <div className="contenedor-simple">
            <p>Tu cuenta no tiene un rol asignado. Contacta al administrador.</p>
          </div>
        )}
      </main>
    </div>
  );
}
