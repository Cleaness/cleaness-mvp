import Link from "next/link";

export default async function AdminHome() {
  return (
    <main className="grid">
      <div className="card">
        <div className="h1">Admin</div>
        <div className="small">MVP ohne Login (lokal auf diesem Mac).</div>
        <div className="hr" />
        <div className="row">
          <Link className="btn" href="/admin/kalender">Kalender</Link>
          <Link className="btn secondary" href="/admin/kunden">Kunden</Link>
          <Link className="btn secondary" href="/admin/leistungen">Leistungen</Link>
        </div>
      </div>

      <div className="card">
        <div className="h2">Erststart</div>
        <div className="small">Lege Standardleistungen an (Beratung + Behandlung 30..300) – nur einmal nötig.</div>
        <div className="row">
          <form action="/admin/seed" method="post">
            <button className="btn" type="submit">Defaults anlegen</button>
          </form>
        </div>
      </div>
    </main>
  );
}
