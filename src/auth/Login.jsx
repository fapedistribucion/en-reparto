import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Completa tu correo y contraseña.");
      return;
    }

    setEnviando(true);
    const { error: errorLogin } = await supabase.auth.signInWithPassword({ email, password });
    setEnviando(false);

    if (errorLogin) {
      setError("Correo o contraseña incorrectos.");
    }
  }

  return (
    <div className="pantalla-login">
      <form className="tarjeta-login" onSubmit={manejarSubmit}>
        <h1>EnReparto</h1>
        <p className="subtitulo">Ingresa con tu cuenta</p>

        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <p className="mensaje-error">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
