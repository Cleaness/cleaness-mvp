"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Service = {
  id: string;
  displayName: string;
  baseName: string;
  durationMinutes: number;
  isOnlineBookable: boolean;
  isActive: boolean;
};

type Booking = {
  startAt: string;
  endAt: string;
  source: "ADMIN" | "ONLINE";
  serviceType?: { displayName: string };
};

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function hhmm(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function parseLocal(dateISO: string, timeHHMM: string) {
  // Lokale Zeit, nicht UTC
  return new Date(`${dateISO}T${timeHHMM}:00`);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export default function BeratungSlotsClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [date, setDate] = useState<string>(sp.get("date") || todayISO);

  const [service, setService] = useState<Service | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<string>("");

  const [selectedTime, setSelectedTime] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    router.replace(`/book/beratung?date=${encodeURIComponent(date)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function load() {
    setStatus("");
    setSelectedTime("");

    // Services
    const sRes = await fetch("/api/services", { cache: "no-store" });
    if (!sRes.ok) {
      setStatus(`Fehler: Services API (${sRes.status})`);
      return;
    }
    const sData = await sRes.json();
    const all: Service[] = sData.services || [];

    const found =
      all
        .filter((x) => x.isActive && x.isOnlineBookable)
        .find((x) => (x.displayName || "").includes("Beratung") || (x.baseName || "").includes("Beratung")) || null;

    setService(found);

    // Bookings (intern + online)
    const bRes = await fetch(`/api/bookings?date=${encodeURIComponent(date)}`, { cache: "no-store" });
    if (!bRes.ok) {
      const t = await bRes.text();
      console.error(t);
      setStatus(`Fehler: Bookings API (${bRes.status})`);
      return;
    }
    const bData = await bRes.json();
    setBookings(bData.bookings || []);

    if (!found) {
      setStatus("Keine online-buchbare Beratung gefunden. Bitte im Admin prüfen.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // Statt nur "freie Slots" zu rendern, zeigen wir ALLE Slots und deaktivieren belegte.
  const slots = useMemo(() => {
    if (!service) return [];

    const open = parseLocal(date, "09:00");
    const close = parseLocal(date, "18:00");

    const busy = bookings.map((b) => ({
      start: new Date(b.startAt),
      end: new Date(b.endAt),
      label: `${b.serviceType?.displayName || "Termin"} (${b.source})`,
    }));

    const out: { time: string; blocked: boolean; blockedBy?: string }[] = [];

    for (let t = new Date(open); t < close; t = addMinutes(t, 30)) {
      const start = t;
      const end = addMinutes(t, service.durationMinutes);

      if (end > close) continue;

      const blocker = busy.find((x) => overlaps(start, end, x.start, x.end));
      out.push({
        time: hhmm(start),
        blocked: !!blocker,
        blockedBy: blocker?.label,
      });
    }

    return out;
  }, [bookings, date, service]);

  async function book() {
    if (!service) return;
    if (!selectedTime) { setStatus("Bitte erst eine Uhrzeit auswählen."); return; }
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) { setStatus("Bitte Name und Telefon ausfüllen."); return; }

    setStatus("Buchung wird angelegt…");

    // Kunde anlegen – falls Telefon existiert, fällt es in den Fallback
    const cRes = await fetch("/api/customers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: null,
        notes: "Online Beratung",
      }),
    });

    let customerId: string | null = null;

    if (cRes.ok) {
      const cData = await cRes.json();
      customerId = cData.customer?.id || null;
    } else {
      const gRes = await fetch(`/api/customers?q=${encodeURIComponent(phone.trim())}`, { cache: "no-store" });
      if (!gRes.ok) { setStatus("Kunde konnte nicht angelegt/gefunden werden."); return; }
      const gData = await gRes.json();
      const match = (gData.customers || []).find((x: any) => String(x.phone || "") === phone.trim());
      customerId = match?.id || null;
    }

    if (!customerId) { setStatus("Kunde konnte nicht angelegt/gefunden werden."); return; }

    const bRes = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date,
        time: selectedTime,
        serviceTypeId: service.id,
        customerId,
        notes: "Online gebucht",
        source: "ONLINE",
      }),
    });

    if (bRes.status === 409) {
      setStatus("Dieser Zeitraum wurde gerade belegt. Bitte neu laden.");
      await load();
      return;
    }

    if (!bRes.ok) {
      const t = await bRes.text();
      console.error(t);
      setStatus("Buchung fehlgeschlagen.");
      return;
    }

    router.push(`/book/beratung/success?date=${encodeURIComponent(date)}`);
  }

  return (
    <main className="grid">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="h1">Beratung buchen</div>
            <div className="small">Wähle Datum und Uhrzeit.</div>
          </div>
          <a className="btn secondary" href="/">Start</a>
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
          <button className="btn secondary" onClick={load} type="button">Neu laden</button>
          <span className="small">{status}</span>
        </div>
      </div>
      <div className="card">
        <div className="h2">Uhrzeiten</div>
        <div className="small">
          {service ? `Service: ${service.displayName} (${service.durationMinutes} Min)` : "Service wird geladen…"}
        </div>
        <div className="hr" />
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          {slots.length === 0 ? (
            <span className="small">Keine Slots.</span>
          ) : (
            slots.map((s) => (
              <button
                key={s.time}
                type="button"
                className={`btn ${selectedTime === s.time ? "" : "secondary"}`}
                disabled={s.blocked}
                title={s.blocked ? `Belegt durch: ${s.blockedBy}` : "Frei"}
                onClick={() => setSelectedTime(s.time)}
                style={s.blocked ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
              >
                {s.time}{s.blocked ? " (belegt)" : ""}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="h2">Deine Daten</div>
        <div className="small">Name + Telefon sind erforderlich.</div>
        <div className="hr" />
        <div className="grid grid2">
          <label>
            <div className="small">Vorname</div>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label>
            <div className="small">Nachname</div>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <div className="small">Telefon</div>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn" type="button" onClick={book} disabled={!selectedTime}>
              {selectedTime ? `Termin buchen (${date} ${selectedTime})` : "Bitte zuerst freie Uhrzeit wählen"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
