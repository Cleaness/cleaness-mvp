"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = { id: string; firstName: string; lastName: string; phone: string };
type Service = { id: string; displayName: string; durationMinutes: number };
type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  notes: string | null;
  source: "ADMIN" | "ONLINE";
  status: "ACTIVE" | "CANCELED";
  customer: Customer;
  serviceType: Service;
};

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmt(iso: string) {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function AdminKalenderPage() {
  const [date, setDate] = useState<string>(() => toISODate(new Date()));
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [msg, setMsg] = useState<string>("");

  const canSubmit = useMemo(() => customers.length > 0 && services.length > 0, [customers.length, services.length]);

  async function loadAll(selectedDate: string) {
    setMsg("");

    const [s, c, b] = await Promise.all([
      fetch("/api/services", { cache: "no-store" }).then((r) => r.json()),
      // wir laden hier bewusst "alle" (du hast Limit ja schon entfernt)
      fetch("/api/customers", { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/bookings?date=${encodeURIComponent(selectedDate)}`, { cache: "no-store" }).then((r) => r.json()),
    ]);

    setServices(s.services || []);
    setCustomers(c.customers || []);
    setBookings(b.bookings || []);
  }

  useEffect(() => {
    loadAll(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function createBooking(form: HTMLFormElement) {
    setMsg("");

    const fd = new FormData(form);
    const time = String(fd.get("time") || "");
    const serviceTypeId = String(fd.get("serviceTypeId") || "");
    const customerId = String(fd.get("customerId") || "");
    const notes = String(fd.get("notes") || "");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date,
        time,
        serviceTypeId,
        customerId,
        notes: notes ? notes : null,
        source: "ADMIN",
      }),
    });

    if (res.status === 409) {
      setMsg("Zeit ist bereits belegt.");
      await loadAll(date);
      return;
    }

    if (!res.ok) {
      setMsg("Speichern fehlgeschlagen.");
      return;
    }

    form.reset();
    setMsg("Termin gespeichert.");
    await loadAll(date);
  }

  async function deleteBooking(id: string) {
    if (!confirm("Termin wirklich löschen?")) return;

    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Stornieren fehlgeschlagen.");
      return;
    }

    await loadAll(date);
  }

  return (
    <main className="grid">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="h1">Admin Kalender</div>
            <div className="small">Termine verwalten (intern + online sichtbar)</div>
          </div>
          <a className="btn secondary" href="/admin">Admin</a>
        </div>

        <div className="hr" />

        <div className="row">
          <label className="small">
            Datum&nbsp;
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ maxWidth: 200 }}
            />
          </label>
          <button className="btn secondary" type="button" onClick={() => loadAll(date)}>
            Neu laden
          </button>
          <span className="small">{msg}</span>
        </div>
      </div>

      <div className="card">
        <div className="h2">Neuen Termin anlegen</div>
        <div className="hr" />

        {!canSubmit ? (
          <div className="small">Lade Kunden/Leistungen…</div>
        ) : (
          <form
            className="grid grid2"
            onSubmit={(e) => {
              e.preventDefault();
              createBooking(e.currentTarget);
            }}
          >
            <label>
              <div className="small">Uhrzeit (HH:MM)</div>
              <input className="input" name="time" placeholder="12:00" required />
            </label>

            <label>
              <div className="small">Leistung</div>
              <select className="input" name="serviceTypeId" required>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <div className="small">Kunde</div>
              <select className="input" name="customerId" required>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} – {c.phone}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <div className="small">Notiz (optional)</div>
              <textarea className="input" name="notes" rows={2} placeholder="z.B. konkrete Behandlung / Hinweise" />
            </label>

            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn" type="submit">
                Termin speichern
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <div className="h2">Termine am {date}</div>
        <div className="hr" />

        {bookings.length === 0 ? (
          <div className="small">Keine Termine.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Von</th>
                <th>Bis</th>
                <th>Kunde</th>
                <th>Leistung</th>
                <th>Quelle</th><th>Status</th>
                <th>Notiz</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{fmt(b.startAt)}</td>
                  <td>{fmt(b.endAt)}</td>
                  <td>
                    {b.customer.firstName} {b.customer.lastName}
                  </td>
                  <td>{b.serviceType.displayName}</td>
                  <td><span className="badge">{b.source}</span></td>
                  <td><span className="badge">{(b as any).status || "ACTIVE"}</span></td>
                  <td>{b.notes || <span className="small">–</span>}</td>
                  <td>
                    <button className="btn secondary" type="button" onClick={() => deleteBooking(b.id)}>
                      Stornieren
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
