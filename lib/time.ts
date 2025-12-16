export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function toISODate(d: Date): string {
  const z = new Date(d);
  z.setMinutes(z.getMinutes() - z.getTimezoneOffset());
  return z.toISOString().slice(0, 10);
}

export function parseLocalDateTime(date: string, time: string): Date {
  const [y, m, dd] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, dd, hh, mm, 0, 0);
}

export function formatLocal(dt: Date): string {
  return dt.toLocaleString("de-DE", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
}
