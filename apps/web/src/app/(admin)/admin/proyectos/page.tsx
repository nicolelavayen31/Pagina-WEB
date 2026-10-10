export default function AdminProjectsPage() {
  return (
    <main className="container section">
      <h1>Proyectos</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 12 }}>Título</th>
            <th style={{ textAlign: 'left', padding: 12 }}>Estado</th>
            <th style={{ textAlign: 'left', padding: 12 }}>Última modificación</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: 12 }}>Proyecto de ejemplo</td>
            <td style={{ padding: 12 }}>DRAFT</td>
            <td style={{ padding: 12 }}>Hoy</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
