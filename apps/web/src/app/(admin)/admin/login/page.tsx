export default function AdminLoginPage() {
  return (
    <main className="container section" style={{ maxWidth: 480 }}>
      <h1>Acceso administrativo</h1>
      <form>
        <div>
          <label>Correo electrónico</label>
          <input type="email" placeholder="admin@ejemplo.com" />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" placeholder="••••••••" />
        </div>
        <button className="button primary" type="submit">Iniciar sesión</button>
      </form>
    </main>
  );
}
