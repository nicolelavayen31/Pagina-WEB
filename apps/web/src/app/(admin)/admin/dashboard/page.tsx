export default function DashboardPage() {
  return (
    <main className="container section">
      <h1>Dashboard</h1>
      <div className="grid grid-3">
        <div className="card" style={{ padding: 24 }}><h3>Total proyectos</h3><p>0</p></div>
        <div className="card" style={{ padding: 24 }}><h3>Publicados</h3><p>0</p></div>
        <div className="card" style={{ padding: 24 }}><h3>Solicitudes</h3><p>0</p></div>
      </div>
    </main>
  );
}
