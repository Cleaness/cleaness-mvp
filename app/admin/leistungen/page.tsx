"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Service = { id: string; displayName: string; baseName: string; durationMinutes: number; isOnlineBookable: boolean };

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState("");

  async function load() {
    const res = await fetch("/api/services", { cache: "no-store" });
    const data = await res.json();
    setServices(data.services || []);
  }

  useEffect(() => { load(); }, []);

  async function createService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    const form = new FormData(e.currentTarget);
    const payload = {
      displayName: String(form.get("displayName") || ""),
      baseName: String(form.get("baseName") || ""),
      durationMinutes: Number(form.get("durationMinutes") || 60),
      isOnlineBookable: String(form.get("isOnlineBookable") || "false") === "true",
    };
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? "Leistung angelegt." : "Fehler beim Anlegen.");
    (e.target as HTMLFormElement).reset();
    await load();
  }

  return (
    <main className="grid">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="h1">Leistungen</div>
            <div className="small">Online sichtbar ist nur Beratung. Interne Behandlungen sind offline.</div>
          </div>
          <Link className="btn secondary" href="/admin">Zurück</Link>
        </div>
        <div className="hr" />
        <div className="small">Tipp: Nutze „Behandlung (30..300)“ und zusätzlich bis zu 25 benannte Leistungen.</div>
      </div>

      <div className="card">
        <div className="h2">Neue Leistung</div>
        <div className="hr" />
        <form onSubmit={createService} className="grid grid3">
          <label style={{ gridColumn: "1 / -1" }}>
            <div className="small">Anzeigename</div>
            <input className="input" name="displayName" placeholder="z.B. HydraFacial (60 Min)" required />
          </label>
          <label>
            <div className="small">Basisname</div>
            <input className="input" name="baseName" placeholder="z.B. HydraFacial" required />
          </label>
          <label>
            <div className="small">Dauer (Min)</div>
            <input className="input" name="durationMinutes" type="number" min="15" max="600" step="15" defaultValue="60" required />
          </label>
          <label>
            <div className="small">Online buchbar?</div>
            <select className="input" name="isOnlineBookable" defaultValue="false">
              <option value="false">Nein (intern)</option>
              <option value="true">Ja (online)</option>
            </select>
          </label>
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn" type="submit">Anlegen</button>
            <span className="small" style={{ marginLeft: 10 }}>{status}</span>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="h2">Liste</div>
        <div className="hr" />
        <table>
          <thead>
            <tr>
              <th>Anzeigename</th><th>Dauer</th><th>Online</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td>{s.displayName}</td>
                <td>{s.durationMinutes} Min</td>
                <td>{s.isOnlineBookable ? <span className="badge">online</span> : <span className="small">intern</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
