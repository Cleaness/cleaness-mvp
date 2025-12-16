"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = { id: string; firstName: string; lastName: string; phone: string; email?: string | null; notes?: string | null };

export default function Customers() {
  const [q, setQ] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [status, setStatus] = useState<string>("");

  async function load() {
    setStatus("");
    try {
      const url = `/api/customers?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        const text = await res.text();
        setStatus(`API Fehler (${res.status}). Öffne Terminal für Details.`);
        console.error("API /customers non-ok:", res.status, text);
        return;
      }

      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e: any) {
      setStatus(`Fehler beim Laden (siehe Konsole/Terminal).`);
      console.error(e);
    }
  }

  useEffect(() => { load(); }, []);

  async function createCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    const form = new FormData(e.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") || ""),
      lastName: String(form.get("lastName") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || "") || null,
      notes: String(form.get("notes") || "") || null,
    };

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        setStatus(`Speichern fehlgeschlagen (${res.status}).`);
        console.error("POST /api/customers failed:", res.status, text);
        return;
      }

      setStatus("Kunde gespeichert.");
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      setStatus("Fehler beim Speichern (siehe Konsole/Terminal).");
      console.error(err);
    }
  }

  return (
    <main className="grid">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="h1">Kunden</div>
            <div className="small">Suche nach Name, Telefon oder E-Mail.</div>
          </div>
          <Link className="btn secondary" href="/admin">Zurück</Link>
        </div>
        <div className="hr" />
        <div className="row">
          <input className="input" style={{ maxWidth: 420 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suche…" />
          <button className="btn" onClick={load}>Suchen</button>
          <span className="small">{status}</span>
        </div>
      </div>

      <div className="card">
        <div className="h2">Neuer Kunde</div>
        <div className="small">Telefon ist Pflicht und eindeutig.</div>
        <div className="hr" />
        <form onSubmit={createCustomer} className="grid grid2">
          <label>
            <div className="small">Vorname</div>
            <input className="input" name="firstName" required />
          </label>
          <label>
            <div className="small">Nachname</div>
            <input className="input" name="lastName" required />
          </label>
          <label>
            <div className="small">Telefon</div>
            <input className="input" name="phone" required />
          </label>
          <label>
            <div className="small">E-Mail (optional)</div>
            <input className="input" name="email" />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <div className="small">Notiz (optional)</div>
            <textarea className="input" name="notes" rows={3} />
          </label>
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn" type="submit">Kunde speichern</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="h2">Liste</div>
        <div className="hr" />
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Telefon</th><th>E-Mail</th><th>Notiz</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.firstName} {c.lastName}</td>
                <td>{c.phone}</td>
                <td>{c.email || <span className="small">–</span>}</td>
                <td>{c.notes || <span className="small">–</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
