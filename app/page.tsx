export default function Home() {
  return (
    <main className="card">
      <div className="h1">Cleaness MVP</div>
      <div className="hr" />
      <div className="grid">
        <a className="btn" href="/admin">Admin öffnen</a>
        <a className="btn secondary" href="/book/beratung">Online: Beratung buchen</a>
        <div className="small">
          Hinweis: Dieses MVP ist für lokalen Betrieb gedacht. Für Internetbetrieb bitte Absicherung/Backups/HTTPS ergänzen.
        </div>
      </div>
    </main>
  );
}
