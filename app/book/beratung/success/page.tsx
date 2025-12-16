import Link from "next/link";

type SearchParams = { date?: string };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const date = sp?.date || "";

  return (
    <main className="grid">
      <div className="card">
        <div className="h1">Buchung erfolgreich</div>
        <div className="small">Danke. Wir haben den Termin eingetragen.</div>
        <div className="hr" />
        <Link className="btn" href={`/book/beratung?date=${encodeURIComponent(date)}`}>Zurück</Link>
      </div>
    </main>
  );
}
